import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import Login from './Login';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
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
describe('Login Component', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('renders correctly', () => {
    renderLogin();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getAllByRole('button')[0]; // eye icon
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('shows error if fields are empty on submit', async () => {
    renderLogin();
    
    // Attempt to submit empty form by triggering form submit directly 
    // (since required attribute prevents default browser submit, we simulate form event)
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }));

    expect(toast.error).toHaveBeenCalledWith('Please fill in all fields.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('handles successful login', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'fake-token', user: { id: 1 }, message: 'Success' } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }));

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'password123' });
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('fake-token', { id: 1 });
      expect(toast.success).toHaveBeenCalledWith('Success');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles failed login', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrongpassword' } });
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('navigates to verify-otp if email requires verification', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Verify email', requiresVerification: true } } });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password' } });
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/verify-otp', { state: { email: 'test@test.com', purpose: 'EMAIL_VERIFICATION' } });
    });
  });

  it('handles successful login with fallback message', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'fake-token', user: { id: 1 } } }); // no message
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });
  });

  it('handles failed login with fallback message', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error')); // no response.data.error
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrongpassword' } });
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed. Please try again.');
    });
  });
});
