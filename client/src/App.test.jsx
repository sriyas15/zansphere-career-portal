import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import App from './App';

// Mock all the pages to avoid rendering full component trees
jest.mock('./pages/Login', () => () => <div data-testid="login-page">Login Page</div>);
jest.mock('./pages/Register', () => () => <div data-testid="register-page">Register Page</div>);
jest.mock('./pages/VerifyOtp', () => () => <div data-testid="verify-otp-page">Verify OTP Page</div>);
jest.mock('./pages/ForgotPassword', () => () => <div data-testid="forgot-password-page">Forgot Password Page</div>);
jest.mock('./pages/ResetPassword', () => () => <div data-testid="reset-password-page">Reset Password Page</div>);
jest.mock('./pages/Dashboard', () => () => <div data-testid="dashboard-page">Dashboard Page</div>);
jest.mock('./pages/ProfileForm', () => () => <div data-testid="profile-form-page">Profile Form Page</div>);
jest.mock('./pages/Settings', () => () => <div data-testid="settings-page">Settings Page</div>);
jest.mock('./pages/Jobs', () => () => <div data-testid="jobs-page">Jobs Page</div>);

// Mock AuthContext and ProtectedRoute
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({ user: { id: 1 }, logout: jest.fn() })
}));

jest.mock('./components/ProtectedRoute', () => ({ children }) => <div data-testid="protected-route">{children}</div>);
jest.mock('./components/Navbar', () => () => <div data-testid="navbar">Navbar</div>);

describe('App Component', () => {
  it('renders without crashing and defaults to dashboard', () => {
    // Suppress console error if any React Router warnings appear
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<App />);
    
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    
    // Default route redirects to dashboard
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    
    consoleError.mockRestore();
  });
});
