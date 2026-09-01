import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import ResetPassword from './ResetPassword';
import api from '../services/api';
import toast from 'react-hot-toast';

jest.mock('../services/api');

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

const mockNavigate = jest.fn();
let mockLocationState = { email: 'test@example.com' };

jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}));

describe('ResetPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = { email: 'test@example.com' };
  });

  const renderResetPassword = () => {
    return render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );
  };

  it('shows error UI if email is missing from state', () => {
    mockLocationState = null;
    renderResetPassword();
    expect(screen.getByText(/Invalid access/i)).toBeInTheDocument();
    expect(screen.getByText('Go back')).toBeInTheDocument();
  });

  it('renders correctly when email is present', () => {
    renderResetPassword();
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special')).toBeInTheDocument();
  });

  it('only allows digits for OTP', () => {
    renderResetPassword();
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP');
    
    fireEvent.change(otpInput, { target: { value: '12a3b4' } });
    expect(otpInput.value).toBe('1234');
  });

  it('toggles password visibility', () => {
    renderResetPassword();
    const passwordInput = screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special');
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('shows error if fields are empty on submit', () => {
    renderResetPassword();
    fireEvent.submit(screen.getByRole('button', { name: /Reset Password/i }));
    
    expect(toast.error).toHaveBeenCalledWith('Please fill in all fields.');
  });

  it('handles successful password reset', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Password reset successful' } });
    renderResetPassword();
    
    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit OTP'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special'), { target: { value: 'NewPassword!123' } });
    fireEvent.submit(screen.getByRole('button', { name: /Reset Password/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NewPassword!123'
      });
      expect(toast.success).toHaveBeenCalledWith('Password reset successful');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles failed password reset', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Invalid OTP' } } });
    renderResetPassword();
    
    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit OTP'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special'), { target: { value: 'NewPassword!123' } });
    fireEvent.submit(screen.getByRole('button', { name: /Reset Password/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid OTP');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('handles fallback error message for failed reset', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));
    renderResetPassword();
    
    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit OTP'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special'), { target: { value: 'NewPassword!123' } });
    fireEvent.submit(screen.getByRole('button', { name: /Reset Password/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Password reset failed.');
    });
  });
});
