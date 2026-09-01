import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import StepPersonal from './StepPersonal';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

describe('StepPersonal Component', () => {
  const mockOnNext = jest.fn();
  const mockApplication = {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    dateOfBirth: '1990-01-01T00:00:00Z',
    city: 'New York',
    state: 'Maharashtra',
    willingToRelocate: true,
    panNumber: 'ABCDE1234F',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderStep = (application = mockApplication, saving = false) => {
    return render(
      <StepPersonal application={application} saving={saving} onNext={mockOnNext} />
    );
  };

  it('renders correctly with pre-filled application data', () => {
    const { container } = renderStep();
    
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    
    expect(container.querySelector('input[name="fullName"]').value).toBe('John Doe');
    expect(container.querySelector('input[name="email"]').value).toBe('john@example.com');
    expect(container.querySelector('input[name="phone"]').value).toBe('1234567890');
    expect(container.querySelector('input[name="dateOfBirth"]').value).toBe('1990-01-01');
    expect(container.querySelector('input[name="city"]').value).toBe('New York');
    expect(container.querySelector('select[name="state"]').value).toBe('Maharashtra');
    expect(container.querySelector('input[name="panNumber"]').value).toBe('ABCDE1234F');
    
    // Check radio buttons
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios[0].checked).toBe(true); // Yes
    expect(radios[1].checked).toBe(false); // No
  });

  it('renders with empty application data', () => {
    const { container } = renderStep({});
    expect(container.querySelector('input[name="fullName"]').value).toBe('');
    expect(container.querySelector('input[name="email"]').value).toBe('');
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios[0].checked).toBe(false); // Yes
    expect(radios[1].checked).toBe(true); // No (default is false which maps to 'no' visually if checked=false but it checks form.willingToRelocate === false)
  });

  it('handles input changes', () => {
    const { container } = renderStep({});
    
    fireEvent.change(container.querySelector('input[name="fullName"]'), { target: { value: 'Jane Doe' } });
    expect(container.querySelector('input[name="fullName"]').value).toBe('Jane Doe');
    
    fireEvent.change(container.querySelector('input[name="phone"]'), { target: { value: '0987654321' } });
    expect(container.querySelector('input[name="phone"]').value).toBe('0987654321');
    
    fireEvent.change(container.querySelector('select[name="state"]'), { target: { value: 'Goa' } });
    expect(container.querySelector('select[name="state"]').value).toBe('Goa');
  });

  it('handles radio button changes', () => {
    const { container } = renderStep({});
    
    const radios = container.querySelectorAll('input[type="radio"]');
    
    // Change to Yes
    fireEvent.click(radios[0]);
    
    // Since we're just triggering the click event in JSDOM we don't need to assert DOM if state is handled correctly,
    // but the component will re-render and update checked state
    expect(radios[0].checked).toBe(true);
    
    // Change to No
    fireEvent.click(radios[1]);
    expect(radios[1].checked).toBe(true);
  });

  it('does not submit if required fields are missing', () => {
    const { container } = renderStep({});
    
    // Just try to submit empty form
    fireEvent.submit(container.querySelector('form'));
    
    expect(mockOnNext).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled(); // Handled by HTML required normally, but we have manual check in JS
  });

  it('shows error if PAN is invalid', () => {
    const { container } = renderStep({
      ...mockApplication,
      panNumber: 'invalid_pan',
    });
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(toast.error).toHaveBeenCalledWith('Invalid PAN Number format (e.g. ABCDE1234F)');
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('submits successfully and formats PAN to uppercase', () => {
    const { container } = renderStep({
      ...mockApplication,
      panNumber: 'abcde1234f', // lowercase valid PAN
    });
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(mockOnNext).toHaveBeenCalledWith({
      ...mockApplication,
      dateOfBirth: '1990-01-01',
      panNumber: 'ABCDE1234F', // Uppercased
    });
  });

  it('shows spinner when saving', () => {
    const { container } = renderStep(mockApplication, true);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeDisabled();
  });
});
