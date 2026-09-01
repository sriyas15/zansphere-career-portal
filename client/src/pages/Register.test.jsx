import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import Register from './Register';
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

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  };

  const fillForm = () => {
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special'), { target: { value: 'Password@123' } });
    fireEvent.change(screen.getByPlaceholderText('9943XXXXXX'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Engineering' } });
  };

  it('renders correctly', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('removes spaces from first and last name', () => {
    renderRegister();
    const firstNameInput = screen.getByPlaceholderText('First name');
    fireEvent.change(firstNameInput, { target: { value: 'John ' } });
    expect(firstNameInput.value).toBe('John');

    const lastNameInput = screen.getByPlaceholderText('Last name');
    fireEvent.change(lastNameInput, { target: { value: ' Doe ' } });
    expect(lastNameInput.value).toBe('Doe');
  });

  it('toggles password visibility', () => {
    renderRegister();
    const passwordInput = screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special');
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getAllByRole('button')[0];
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('validates file upload to allow only PDF', () => {
    renderRegister();
    const fileInput = document.getElementById('resume-upload');
    
    const txtFile = new File(['resume'], 'resume.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [txtFile] } });
    
    expect(toast.error).toHaveBeenCalledWith('Only PDF files are allowed for resume.');
    expect(screen.getByText('Choose PDF file')).toBeInTheDocument();

    const pdfFile = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
  });

  it('shows error if required fields are missing', async () => {
    renderRegister();
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }));
    expect(toast.error).toHaveBeenCalledWith('All fields are required.');
  });

  it('shows error if password is less than 8 characters', async () => {
    renderRegister();
    fillForm();
    fireEvent.change(screen.getByPlaceholderText('Min. 8 chars with upper, lower, number & special'), { target: { value: 'Pass1!' } });
    
    const pdfFile = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(document.getElementById('resume-upload'), { target: { files: [pdfFile] } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }));
    expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters.');
  });

  it('shows error if resume is missing', async () => {
    renderRegister();
    fillForm();
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }));
    expect(toast.error).toHaveBeenCalledWith('Resume (PDF) is required.');
  });

  it('handles successful registration', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Success' } });
    renderRegister();
    fillForm();
    
    const pdfFile = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(document.getElementById('resume-upload'), { target: { files: [pdfFile] } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Success');
      expect(mockNavigate).toHaveBeenCalledWith('/verify-otp', {
        state: { email: 'john@test.com', purpose: 'EMAIL_VERIFICATION' }
      });
    });
  });

  it('handles failed registration', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Email already exists' } } });
    renderRegister();
    fillForm();
    
    const pdfFile = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(document.getElementById('resume-upload'), { target: { files: [pdfFile] } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already exists');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('handles successful registration with fallback message', async () => {
    api.post.mockResolvedValueOnce({ data: {} }); // no message
    renderRegister();
    fillForm();
    
    const pdfFile = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(document.getElementById('resume-upload'), { target: { files: [pdfFile] } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }));
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Registration successful!');
    });
  });

  it('handles failed registration with fallback message', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error')); // no response data
    renderRegister();
    fillForm();
    
    const pdfFile = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(document.getElementById('resume-upload'), { target: { files: [pdfFile] } });
    
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Registration failed.');
    });
  });
});
