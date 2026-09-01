import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import StepEducation from './StepEducation';

describe('StepEducation Component', () => {
  const mockOnNext = jest.fn();
  const mockOnPrev = jest.fn();

  const mockApp = {
    educationHistory: [
      {
        institution: 'IIT Bombay',
        degreeSpecialization: 'B.Tech CS',
        yearOfPassing: 2020,
        percentageOrCgpa: '9.0 CGPA'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderStep = (application = {}, saving = false) => {
    return render(
      <StepEducation application={application} saving={saving} onNext={mockOnNext} onPrev={mockOnPrev} />
    );
  };

  it('renders correctly with pre-filled application data', () => {
    const { container } = renderStep(mockApp);
    
    expect(screen.getByText('Education')).toBeInTheDocument();
    
    expect(container.querySelector('input[placeholder="University or institution name"]').value).toBe('IIT Bombay');
    expect(container.querySelector('input[placeholder="e.g., B.Tech in Computer Science"]').value).toBe('B.Tech CS');
    expect(container.querySelector('input[placeholder="e.g., 2024"]').value).toBe('2020');
    expect(container.querySelector('input[placeholder="e.g., 85% or 8.5 CGPA"]').value).toBe('9.0 CGPA');
  });

  it('renders with empty application data and current year default', () => {
    const { container } = renderStep({});
    
    expect(container.querySelector('input[placeholder="University or institution name"]').value).toBe('');
    expect(container.querySelector('input[placeholder="e.g., B.Tech in Computer Science"]').value).toBe('');
    expect(container.querySelector('input[placeholder="e.g., 2024"]').value).toBe(new Date().getFullYear().toString());
    expect(container.querySelector('input[placeholder="e.g., 85% or 8.5 CGPA"]').value).toBe('');
  });

  it('handles input changes', () => {
    const { container } = renderStep({});
    
    fireEvent.change(container.querySelector('input[placeholder="University or institution name"]'), { target: { value: 'MIT' } });
    expect(container.querySelector('input[placeholder="University or institution name"]').value).toBe('MIT');
    
    fireEvent.change(container.querySelector('input[placeholder="e.g., B.Tech in Computer Science"]'), { target: { value: 'BS CS' } });
    expect(container.querySelector('input[placeholder="e.g., B.Tech in Computer Science"]').value).toBe('BS CS');
    
    fireEvent.change(container.querySelector('input[placeholder="e.g., 2024"]'), { target: { value: '2025' } });
    expect(container.querySelector('input[placeholder="e.g., 2024"]').value).toBe('2025');
    
    fireEvent.change(container.querySelector('input[placeholder="e.g., 85% or 8.5 CGPA"]'), { target: { value: '10 CGPA' } });
    expect(container.querySelector('input[placeholder="e.g., 85% or 8.5 CGPA"]').value).toBe('10 CGPA');
  });

  it('handles adding and removing history entries', () => {
    renderStep(mockApp);
    
    const addBtn = screen.getByRole('button', { name: /Add Education/i });
    
    fireEvent.click(addBtn); // Adds second entry
    
    let removeBtns = screen.getAllByRole('button', { name: /Remove/i });
    expect(removeBtns.length).toBe(2);
    
    // Remove first entry
    fireEvent.click(removeBtns[0]);
    
    removeBtns = screen.queryAllByRole('button', { name: /Remove/i });
    expect(removeBtns.length).toBe(0); // Only 1 left
  });

  it('submits correctly', () => {
    const { container } = renderStep(mockApp);
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(mockOnNext).toHaveBeenCalledWith({
      educationHistory: [
        {
          institution: 'IIT Bombay',
          degreeSpecialization: 'B.Tech CS',
          yearOfPassing: 2020,
          percentageOrCgpa: '9.0 CGPA'
        }
      ]
    });
  });

  it('calls onPrev when Previous is clicked', () => {
    renderStep(mockApp);
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(mockOnPrev).toHaveBeenCalled();
  });
});
