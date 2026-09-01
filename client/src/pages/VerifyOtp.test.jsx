import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import VerifyOtp from './VerifyOtp';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { act } from '@testing-library/react';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../services/api');

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

const mockNavigate = jest.fn();
let mockLocationState = { email: 'test@example.com', purpose: 'EMAIL_VERIFICATION' };

jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}));

describe('VerifyOtp Component', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
    mockLocationState = { email: 'test@example.com', purpose: 'EMAIL_VERIFICATION' };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderVerifyOtp = () => {
    return render(
      <BrowserRouter>
        <VerifyOtp />
      </BrowserRouter>
    );
  };

  it('redirects to register if no email in state', () => {
    mockLocationState = null;
    renderVerifyOtp();
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('renders correctly', () => {
    renderVerifyOtp();
    expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox').length).toBe(6);
  });

  it('handles typing OTP and focusing next input', () => {
    renderVerifyOtp();
    const inputs = screen.getAllByRole('textbox');
    
    // Type in first input
    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(inputs[0].value).toBe('1');
    expect(document.activeElement).toBe(inputs[1]);

    // Ignored non-digit
    fireEvent.change(inputs[1], { target: { value: 'a' } });
    expect(inputs[1].value).toBe('');
  });

  it('handles backspace to focus previous input', () => {
    renderVerifyOtp();
    const inputs = screen.getAllByRole('textbox');
    
    // Focus 2nd input
    inputs[1].focus();
    
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('handles paste event with full OTP', () => {
    renderVerifyOtp();
    const inputs = screen.getAllByRole('textbox');
    
    // Simulate paste directly on the first input so it bubbles up to the container
    const mockClipboardEvent = {
      clipboardData: {
        getData: () => '1234567', // extra digit should be sliced
      }
    };
    
    fireEvent.paste(inputs[0], mockClipboardEvent);
    
    expect(inputs[0].value).toBe('1');
    expect(inputs[5].value).toBe('6');
  });

  it('handles paste event with partial OTP', () => {
    renderVerifyOtp();
    const inputs = screen.getAllByRole('textbox');
    
    const mockClipboardEvent = {
      clipboardData: {
        getData: () => '123',
      }
    };
    
    fireEvent.paste(inputs[0], mockClipboardEvent);
    
    expect(inputs[0].value).toBe('1');
    expect(inputs[2].value).toBe('3');
    expect(inputs[3].value).toBe('');
    expect(document.activeElement).toBe(inputs[3]); // Focuses the next empty input
  });

  it('shows error if OTP is incomplete', () => {
    renderVerifyOtp();
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Verify OTP/i }));
    
    expect(toast.error).toHaveBeenCalledWith('Please enter the complete 6-digit OTP.');
  });

  it('handles successful verification for EMAIL_VERIFICATION', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Success', token: 'token123', user: { id: 1 } } });
    renderVerifyOtp();
    
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input, i) => fireEvent.change(input, { target: { value: (i + 1).toString() } }));
    
    fireEvent.submit(screen.getByRole('button', { name: /Verify OTP/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/verify-otp', {
        email: 'test@example.com',
        otp: '123456',
        purpose: 'EMAIL_VERIFICATION'
      });
      expect(toast.success).toHaveBeenCalledWith('Success');
      expect(mockLogin).toHaveBeenCalledWith('token123', { id: 1 });
      expect(mockNavigate).toHaveBeenCalledWith('/profile-setup');
    });
  });

  it('handles successful verification for PASSWORD_RESET', async () => {
    mockLocationState.purpose = 'PASSWORD_RESET';
    api.post.mockResolvedValueOnce({ data: { message: 'Success' } });
    renderVerifyOtp();
    
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input, i) => fireEvent.change(input, { target: { value: '9' } }));
    
    fireEvent.submit(screen.getByRole('button', { name: /Verify OTP/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reset-password', {
        state: { email: 'test@example.com', otpVerified: true }
      });
    });
  });

  it('handles failed verification', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Invalid OTP' } } });
    renderVerifyOtp();
    
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input, i) => fireEvent.change(input, { target: { value: '0' } }));
    
    fireEvent.submit(screen.getByRole('button', { name: /Verify OTP/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid OTP');
    });
  });

  it('handles fallback error message for failed verification', async () => {
    api.post.mockRejectedValueOnce(new Error('Network Error'));
    renderVerifyOtp();
    
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input, i) => fireEvent.change(input, { target: { value: '0' } }));
    
    fireEvent.submit(screen.getByRole('button', { name: /Verify OTP/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Verification failed.');
    });
  });

  it('handles timer and resend OTP successfully', async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    renderVerifyOtp();
    
    for(let i=0; i<61; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
    
    const resendButton = screen.getByRole('button', { name: /Resend OTP/i });
    expect(resendButton).toBeInTheDocument();
    
    fireEvent.click(resendButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/resend-otp', {
        email: 'test@example.com',
        purpose: 'EMAIL_VERIFICATION'
      });
      expect(toast.success).toHaveBeenCalledWith('A new OTP has been sent to your email.');
    });
    
    // Timer should be reset, text should show Resend OTP in 60s
    expect(screen.getByText(/Resend OTP in/i)).toBeInTheDocument();
  });

  it('handles resend OTP failure', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Too many requests' } } });
    renderVerifyOtp();
    
    for(let i=0; i<61; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
    
    fireEvent.click(screen.getByRole('button', { name: /Resend OTP/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Too many requests');
    });
  });

  it('handles fallback error message for resend OTP failure', async () => {
    api.post.mockRejectedValueOnce(new Error('Network Error'));
    renderVerifyOtp();
    
    for(let i=0; i<61; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
    
    fireEvent.click(screen.getByRole('button', { name: /Resend OTP/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to resend OTP.');
    });
  });
});
