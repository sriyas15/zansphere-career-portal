import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import StepReview from './StepReview';

describe('StepReview Component', () => {
  const mockOnPrev = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnGoToStep = jest.fn();

  const mockApp = {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    dateOfBirth: '1990-01-01T00:00:00Z',
    city: 'New York',
    state: 'NY',
    willingToRelocate: true,
    employmentStatus: 'EMPLOYED',
    currentCompany: 'Tech Corp',
    currentDesignation: 'SDE',
    totalExperienceYears: 2,
    totalExperienceMonths: 6,
    relevantExperienceYears: 2,
    relevantExperienceMonths: 0,
    currentCtcFixed: '1000000',
    currentCtcVariable: '100000',
    expectedCtc: '1500000',
    noticePeriod: '30 days',
    employmentHistory: [
      { company: 'Tech Corp', role: 'SDE', durationFrom: '2021', durationTo: 'Present' }
    ],
    educationHistory: [
      { institution: 'MIT', degreeSpecialization: 'BS CS', yearOfPassing: 2020, percentageOrCgpa: '9.0' }
    ],
    skills: [
      { category: 'Engineering/Tech', skills: 'React, Node.js' }
    ],
    preferredJobType: 'FULL_TIME',
    preferredWorkMode: 'REMOTE',
    preferredDepartment: 'Engineering',
    roleOfInterest: 'Software Engineer',
    subscribeJobAlerts: true,
    resumeFileName: 'John_Resume.pdf',
    resumeUrl: 'https://example.com/resume.pdf',
    portfolioUrl: 'https://portfolio.com',
    linkedinUrl: 'https://linkedin.com/in/john',
    githubUrl: 'https://github.com/john'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderStep = (application = {}, saving = false) => {
    return render(
      <StepReview application={application} saving={saving} onPrev={mockOnPrev} onSubmit={mockOnSubmit} onGoToStep={mockOnGoToStep} />
    );
  };

  it('renders correctly with full application data', () => {
    renderStep(mockApp);
    
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    
    expect(screen.getByText('Employed')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('SDE')).toBeInTheDocument();
    
    expect(screen.getByText('MIT')).toBeInTheDocument();
    expect(screen.getByText('React, Node.js')).toBeInTheDocument();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
    
    expect(screen.getByText('John_Resume.pdf')).toBeInTheDocument();
    
    // Check submit button state (disabled initially)
    expect(screen.getByRole('button', { name: /Submit Application/i })).toBeDisabled();
  });

  it('renders correctly with empty application data and fallbacks', () => {
    renderStep({});
    
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not provided').length).toBe(2); // Education, Skills
  });

  it('handles consent checkbox and submit', () => {
    const { container } = renderStep(mockApp);
    
    const submitBtn = screen.getByRole('button', { name: /Submit Application/i });
    expect(submitBtn).toBeDisabled();
    
    const checkbox = container.querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox);
    
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('handles edit buttons', () => {
    renderStep(mockApp);
    
    const editBtns = screen.getAllByRole('button', { name: /Edit/i });
    fireEvent.click(editBtns[0]);
    
    expect(mockOnGoToStep).toHaveBeenCalledWith(1);
  });

  it('calls onPrev when Previous is clicked', () => {
    renderStep(mockApp);
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(mockOnPrev).toHaveBeenCalled();
  });

  it('renders submitted state', () => {
    renderStep({ ...mockApp, status: 'SUBMITTED' });
    
    expect(screen.getByText('Application Submitted')).toBeInTheDocument();
    expect(screen.getByText('Your application has been submitted successfully.')).toBeInTheDocument();
    
    // Actions should not be rendered
    expect(screen.queryByRole('button', { name: /Submit Application/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Previous/i })).not.toBeInTheDocument();
  });
});
