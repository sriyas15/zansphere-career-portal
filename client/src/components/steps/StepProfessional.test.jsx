import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import StepProfessional from './StepProfessional';

describe('StepProfessional Component', () => {
  const mockOnNext = jest.fn();
  const mockOnPrev = jest.fn();

  const mockEmployedApp = {
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
      { company: 'Tech Corp', role: 'SDE', durationFrom: '2021-01-01', durationTo: 'Present' }
    ]
  };

  const mockFresherApp = {
    employmentStatus: 'FRESHER',
    expectedCtc: '500000'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderStep = (application, saving = false) => {
    return render(
      <StepProfessional application={application} saving={saving} onNext={mockOnNext} onPrev={mockOnPrev} />
    );
  };

  it('renders correctly for FRESHER', () => {
    const { container } = renderStep(mockFresherApp);
    
    expect(screen.getByText('Professional Profile')).toBeInTheDocument();
    
    expect(container.querySelector('select[name="employmentStatus"]').value).toBe('FRESHER');
    expect(container.querySelector('input[name="expectedCtc"]').value).toBe('500000');
    
    // Most fields should be disabled
    expect(container.querySelector('input[name="currentCompany"]')).toBeDisabled();
    expect(container.querySelector('input[name="totalExperience"]')).toBeDisabled();
    
    // Add Entry button should be disabled
    expect(screen.getByRole('button', { name: /Add Entry/i })).toBeDisabled();
  });

  it('renders correctly for EMPLOYED', () => {
    const { container } = renderStep(mockEmployedApp);
    
    expect(container.querySelector('select[name="employmentStatus"]').value).toBe('EMPLOYED');
    expect(container.querySelector('input[name="currentCompany"]').value).toBe('Tech Corp');
    
    // 2 years 6 months = 2.5
    expect(container.querySelector('input[name="totalExperience"]').value).toBe('2.5');
    // 2 years 0 months = 2
    expect(container.querySelector('input[name="relevantExperience"]').value).toBe('2');
    
    expect(container.querySelector('input[name="currentCtcFixed"]').value).toBe('1000000');
    expect(container.querySelector('select[name="noticePeriod"]').value).toBe('30 days');
    
    // History
    const historyCompanyInputs = container.querySelectorAll('input[placeholder="Company name"]');
    // first is currentCompany, second is history company
    expect(historyCompanyInputs[1].value).toBe('Tech Corp');
    
    // 'Currently Working' checkbox
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(true);
  });

  it('submits fresher correctly', () => {
    const { container } = renderStep({ employmentStatus: 'FRESHER', expectedCtc: '500000' });
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(mockOnNext).toHaveBeenCalledWith(expect.objectContaining({
      employmentStatus: 'FRESHER',
      expectedCtc: '500000',
      currentCompany: 'N/A',
      currentDesignation: 'N/A',
      totalExperienceYears: 0,
      totalExperienceMonths: 0,
      employmentHistory: []
    }));
  });

  it('submits employed correctly', () => {
    const { container } = renderStep(mockEmployedApp);
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(mockOnNext).toHaveBeenCalledWith(expect.objectContaining({
      employmentStatus: 'EMPLOYED',
      currentCompany: 'Tech Corp',
      totalExperienceYears: 2,
      totalExperienceMonths: 6,
      relevantExperienceYears: 2,
      relevantExperienceMonths: 0,
      employmentHistory: [
        { company: 'Tech Corp', role: 'SDE', durationFrom: '2021-01-01', durationTo: 'Present' }
      ]
    }));
  });

  it('handles input changes', () => {
    const { container } = renderStep(mockFresherApp);
    
    fireEvent.change(container.querySelector('select[name="employmentStatus"]'), { target: { name: 'employmentStatus', value: 'EMPLOYED' } });
    expect(container.querySelector('select[name="employmentStatus"]').value).toBe('EMPLOYED');
    
    // Now it should be enabled
    const companyInput = container.querySelector('input[name="currentCompany"]');
    expect(companyInput).not.toBeDisabled();
    
    fireEvent.change(companyInput, { target: { name: 'currentCompany', value: 'New Corp' } });
    expect(companyInput.value).toBe('New Corp');
  });

  it('handles adding and removing history entries', () => {
    const { container } = renderStep(mockEmployedApp);
    
    const addBtn = screen.getByRole('button', { name: /Add Entry/i });
    
    fireEvent.click(addBtn); // Adds second entry
    
    let removeBtns = screen.getAllByRole('button', { name: /Remove/i });
    expect(removeBtns.length).toBe(2);
    
    // Remove first entry
    fireEvent.click(removeBtns[0]);
    
    removeBtns = screen.queryAllByRole('button', { name: /Remove/i });
    expect(removeBtns.length).toBe(0); // Only 1 left, so remove button is hidden
  });

  it('handles history input changes', () => {
    const { container } = renderStep(mockEmployedApp);
    
    const historyCompanyInputs = container.querySelectorAll('input[placeholder="Company name"]');
    // Index 1 is the first history entry
    fireEvent.change(historyCompanyInputs[1], { target: { value: 'Old Corp' } });
    
    expect(historyCompanyInputs[1].value).toBe('Old Corp');
    
    const checkbox = container.querySelector('input[type="checkbox"]');
    // Uncheck currently working
    fireEvent.click(checkbox);
    
    // Now 'To' date should be available
    const dateInputs = container.querySelectorAll('input[type="date"]');
    // dateInputs[0] is from, dateInputs[1] is to
    fireEvent.change(dateInputs[1], { target: { value: '2022-01-01' } });
    expect(dateInputs[1].value).toBe('2022-01-01');

    // Check again
    fireEvent.click(checkbox);
    expect(container.querySelector('input[value="Present"]')).toBeInTheDocument();
  });

  it('calls onPrev when Previous is clicked', () => {
    renderStep(mockFresherApp);
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(mockOnPrev).toHaveBeenCalled();
  });
});
