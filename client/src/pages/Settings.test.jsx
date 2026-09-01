import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import Settings from './Settings';
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

describe('Settings Component', () => {
  const mockUpdateUser = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { firstName: 'John', lastName: 'Doe', email: 'j@d.com', phone: '1234567890' },
      updateUser: mockUpdateUser,
    });
  });

  const renderSettings = () => {
    return render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );
  };

  it('renders profile tab by default with user context values', () => {
    renderSettings();
    
    expect(screen.getByRole('heading', { name: 'Profile Details' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('j@d.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
  });

  it('updates profile values and submits successfully', async () => {
    api.put.mockResolvedValueOnce({ data: { message: 'Profile updated!', user: { firstName: 'Jane' } } });
    renderSettings();

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/profile', {
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '1234567890'
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({ firstName: 'Jane' });
      expect(toast.success).toHaveBeenCalledWith('Profile updated!');
    });
  });

  it('handles profile update failure', async () => {
    api.put.mockRejectedValueOnce({ response: { data: { error: 'Invalid phone' } } });
    renderSettings();

    fireEvent.submit(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid phone');
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  it('handles fallback profile update error', async () => {
    api.put.mockRejectedValueOnce(new Error('Network error'));
    renderSettings();

    fireEvent.submit(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update profile.');
    });
  });

  it('switches to security tab', () => {
    renderSettings();
    
    fireEvent.click(screen.getByRole('button', { name: /Security/i }));
    
    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /Security/i }));
    
    const currentInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special');
    const confirmPasswordInput = screen.getByPlaceholderText('Re-enter new password');
    
    const toggleButtons = screen.getAllByRole('button');
    // Index 2 is Security tab, Index 3,4,5 are password toggles
    
    expect(currentInput.type).toBe('password');
    fireEvent.click(toggleButtons[2]); // toggle current
    expect(currentInput.type).toBe('text');
    fireEvent.click(toggleButtons[2]);
    expect(currentInput.type).toBe('password');

    expect(newPasswordInput.type).toBe('password');
    fireEvent.click(toggleButtons[3]); // toggle new
    expect(newPasswordInput.type).toBe('text');

    expect(confirmPasswordInput.type).toBe('password');
    fireEvent.click(toggleButtons[4]); // toggle confirm
    expect(confirmPasswordInput.type).toBe('text');
  });

  it('shows error if new passwords do not match', async () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /Security/i }));
    
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'oldPass' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special'), { target: { value: 'newPass123' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), { target: { value: 'newPass456' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Change Password/i }));
    
    expect(toast.error).toHaveBeenCalledWith('New passwords do not match.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits password change successfully', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Password changed' } });
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /Security/i }));
    
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'oldPass' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special'), { target: { value: 'newPass123' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), { target: { value: 'newPass123' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Change Password/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/profile/change-password', {
        currentPassword: 'oldPass',
        newPassword: 'newPass123'
      });
      expect(toast.success).toHaveBeenCalledWith('Password changed');
      
      // Fields should be cleared
      expect(screen.getByPlaceholderText('Enter current password').value).toBe('');
    });
  });

  it('handles password change failure', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Wrong current password' } } });
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /Security/i }));
    
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'oldPass' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special'), { target: { value: 'newPass123' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), { target: { value: 'newPass123' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Change Password/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Wrong current password');
    });
  });

  it('handles fallback password change error', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /Security/i }));
    
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'oldPass' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special'), { target: { value: 'newPass123' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), { target: { value: 'newPass123' } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Change Password/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to change password.');
    });
  });

  it('handles empty user context initially', () => {
    useAuth.mockReturnValue({ user: null, updateUser: mockUpdateUser });
    renderSettings();
    
    // Inputs should be empty initially instead of crashing
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0].value).toBe(''); // First Name
    expect(inputs[1].value).toBe(''); // Last Name
    expect(inputs[2].value).toBe(''); // Email
    expect(inputs[3].value).toBe(''); // Phone
  });
});
