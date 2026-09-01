import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import ForgotPassword from './ForgotPassword';
import api from '../services/api';
import toast from 'react-hot-toast';

jest.mock('../services/api');

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderForgotPassword = () => {
    return render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );
  };

  it('renders correctly', () => {
    renderForgotPassword();
    expect(screen.getByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('shows error if email is empty on submit', () => {
    renderForgotPassword();
    
    // Simulating form submission without filling email
    fireEvent.submit(screen.getByRole('button', { name: /Send OTP/i }));
    
    expect(toast.error).toHaveBeenCalledWith('Please enter your email address.');
  });

  it('handles successful forgot password request', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent successfully' } });
    renderForgotPassword();
    
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /Send OTP/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.com' });
      expect(toast.success).toHaveBeenCalledWith('OTP sent successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/verify-otp', {
        state: { email: 'test@example.com', purpose: 'PASSWORD_RESET' }
      });
    });
  });

  it('handles failed forgot password request', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Email not found' } } });
    renderForgotPassword();
    
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /Send OTP/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email not found');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('handles fallback error message for failed request', async () => {
    api.post.mockRejectedValueOnce(new Error('Network Error'));
    renderForgotPassword();
    
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /Send OTP/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to send OTP.');
    });
  });
});
