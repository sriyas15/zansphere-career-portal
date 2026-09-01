import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import StepPreferences from './StepPreferences';
import api from '../../services/api';

jest.mock('../../services/api');

describe('StepPreferences Component', () => {
  const mockOnNext = jest.fn();
  const mockOnPrev = jest.fn();

  const mockApp = {
    preferredJobType: 'FULL_TIME',
    preferredWorkMode: 'REMOTE',
    preferredDepartment: 'Engineering',
    roleOfInterest: 'Software Engineer',
    subscribeJobAlerts: true
  };

  const mockAppOther = {
    ...mockApp,
    roleOfInterest: 'Custom Role XYZ'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        jobs: [
          { id: '1', title: 'Software Engineer', departmentName: 'Engineering' },
          { id: '2', title: 'Data Scientist', departmentName: 'Data' }
        ]
      }
    });
  });

  const renderStep = (application = {}, saving = false) => {
    return render(
      <StepPreferences application={application} saving={saving} onNext={mockOnNext} onPrev={mockOnPrev} />
    );
  };

  it('renders and fetches jobs successfully, matching standard role', async () => {
    const { container } = renderStep(mockApp);
    
    expect(screen.getByText('Job Preferences')).toBeInTheDocument();
    
    // Wait for jobs to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer (Engineering)')).toBeInTheDocument();
    });
    
    expect(container.querySelector('select[name="preferredJobType"]').value).toBe('FULL_TIME');
    expect(container.querySelector('select[name="preferredWorkMode"]').value).toBe('REMOTE');
    expect(container.querySelector('input[name="preferredDepartment"]').value).toBe('Engineering');
    expect(container.querySelector('select[name="roleOfInterest"]').value).toBe('Software Engineer');
  });

  it('renders with OTHER role pre-selected if role not in jobs', async () => {
    const { container } = renderStep(mockAppOther);
    
    await waitFor(() => {
      expect(container.querySelector('select[name="roleOfInterest"]').value).toBe('OTHER');
      expect(container.querySelector('input[placeholder="Type your desired role..."]').value).toBe('Custom Role XYZ');
    });
  });

  it('handles input changes', async () => {
    const { container } = renderStep({});
    
    await waitFor(() => {
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    fireEvent.change(container.querySelector('select[name="preferredJobType"]'), { target: { name: 'preferredJobType', value: 'INTERNSHIP' } });
    expect(container.querySelector('select[name="preferredJobType"]').value).toBe('INTERNSHIP');
    
    fireEvent.change(container.querySelector('input[name="preferredDepartment"]'), { target: { name: 'preferredDepartment', value: 'Design' } });
    expect(container.querySelector('input[name="preferredDepartment"]').value).toBe('Design');
  });

  it('handles manual OTHER role selection', async () => {
    const { container } = renderStep({});
    
    await waitFor(() => {
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    fireEvent.change(container.querySelector('select[name="roleOfInterest"]'), { target: { name: 'roleOfInterest', value: 'OTHER' } });
    
    const otherInput = container.querySelector('input[placeholder="Type your desired role..."]');
    expect(otherInput).toBeInTheDocument();
    
    fireEvent.change(otherInput, { target: { value: 'New Cool Role' } });
    expect(otherInput.value).toBe('New Cool Role');
    
    // Switch back to normal role
    fireEvent.change(container.querySelector('select[name="roleOfInterest"]'), { target: { name: 'roleOfInterest', value: 'Software Engineer' } });
    expect(container.querySelector('input[placeholder="Type your desired role..."]')).not.toBeInTheDocument();
  });

  it('handles checkbox toggle', async () => {
    const { container } = renderStep({});
    
    const checkbox = container.querySelector('input[type="checkbox"]');
    // Default is true from component
    expect(checkbox.checked).toBe(true);
    
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('submits correctly with standard role', async () => {
    const { container } = renderStep(mockApp);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(mockOnNext).toHaveBeenCalledWith(mockApp);
  });

  it('submits correctly with OTHER role', async () => {
    const { container } = renderStep(mockAppOther);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(mockOnNext).toHaveBeenCalledWith(mockAppOther);
  });

  it('handles API failure gracefully', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    
    renderStep(mockApp);
    
    await waitFor(() => {
      // It should stop loading even if it fails
      expect(screen.queryByText('Loading roles...')).not.toBeInTheDocument();
    });
  });

  it('calls onPrev when Previous is clicked', () => {
    renderStep(mockApp);
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(mockOnPrev).toHaveBeenCalled();
  });
});
