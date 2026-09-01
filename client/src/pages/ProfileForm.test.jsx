import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import ProfileForm from './ProfileForm';
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

// Mock the step components to easily trigger their callbacks
const MockStep = ({ stepName, onNext, onPrev, onSubmit, onGoToStep, application }) => (
  <div data-testid={`mock-step-${stepName}`}>
    <button onClick={() => onNext({ someData: 'test' })}>Next</button>
    <button onClick={onPrev}>Prev</button>
    <button onClick={() => onSubmit({ finalData: 'test' })}>Submit</button>
    <button onClick={() => onGoToStep(2)}>Go To Step 2</button>
    <span data-testid="app-complete">{application?.isComplete ? 'yes' : 'no'}</span>
  </div>
);

jest.mock('../components/steps/StepPersonal', () => (props) => <MockStep stepName="Personal" {...props} />);
jest.mock('../components/steps/StepProfessional', () => (props) => <MockStep stepName="Professional" {...props} />);
jest.mock('../components/steps/StepEducation', () => (props) => <MockStep stepName="Education" {...props} />);
jest.mock('../components/steps/StepSkills', () => (props) => <MockStep stepName="Skills" {...props} />);
jest.mock('../components/steps/StepPreferences', () => (props) => <MockStep stepName="Preferences" {...props} />);
jest.mock('../components/steps/StepDocuments', () => (props) => <MockStep stepName="Documents" {...props} />);
jest.mock('../components/steps/StepReview', () => (props) => <MockStep stepName="Review" {...props} />);

describe('ProfileForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { id: 1 } });
    
    // Default mock implementation
    api.get.mockResolvedValue({ data: { profile: { isComplete: false, currentStep: 1 } } });
  });

  const renderProfileForm = () => {
    return render(
      <BrowserRouter>
        <ProfileForm />
      </BrowserRouter>
    );
  };

  it('renders loading initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // pending promise
    const { container } = renderProfileForm();
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('navigates away if initialization fails', async () => {
    api.get.mockRejectedValue(new Error('Failed'));
    renderProfileForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to initialize profile.');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('sets current step to 7 if profile is complete', async () => {
    api.get.mockResolvedValue({ data: { profile: { isComplete: true, currentStep: 7 } } });
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Review')).toBeInTheDocument();
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });

  it('handles navigating to next step successfully', async () => {
    api.put.mockResolvedValue({ data: { profile: { isComplete: false, currentStep: 2 } } });
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Personal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/profile/step/1', { someData: 'test' });
      expect(toast.success).toHaveBeenCalledWith('Step saved successfully!');
      expect(screen.getByTestId('mock-step-Professional')).toBeInTheDocument();
    });
  });

  it('handles failing to save next step', async () => {
    api.put.mockRejectedValue({ response: { data: { error: 'Validation failed' } } });
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Personal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Validation failed');
      // Should remain on the same step
      expect(screen.getByTestId('mock-step-Personal')).toBeInTheDocument();
    });
  });

  it('handles fallback error for saving step', async () => {
    api.put.mockRejectedValue(new Error('Network error'));
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Personal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save step.');
    });
  });

  it('handles navigating to previous step', async () => {
    api.get.mockResolvedValue({ data: { profile: { isComplete: false, currentStep: 2 } } });
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Professional')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Prev'));

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Personal')).toBeInTheDocument();
    });
  });

  it('does not navigate to previous if already on step 1', async () => {
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Personal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Prev'));

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Personal')).toBeInTheDocument();
    });
  });

  it('handles specific step navigation via stepper buttons (go to allowed step)', async () => {
    // Current step 3
    api.get.mockResolvedValue({ data: { profile: { isComplete: false, currentStep: 3 } } });
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Education')).toBeInTheDocument();
    });

    // We can go back to Personal (step 1)
    fireEvent.click(screen.getByText('Go To Step 2'));

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Professional')).toBeInTheDocument();
    });
  });

  it('shows edit warning modal if profile is complete and saving a step for the first time', async () => {
    api.get.mockResolvedValue({ data: { profile: { isComplete: true, currentStep: 7 } } });
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Review')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next')); // trying to save step 7

    await waitFor(() => {
      expect(screen.getByText('Important Notice')).toBeInTheDocument();
    });

    // Cancel warning
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    expect(screen.queryByText('Important Notice')).not.toBeInTheDocument();
    expect(api.put).not.toHaveBeenCalled();

    // Try again and confirm
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Important Notice')).toBeInTheDocument();
    });
    
    api.put.mockResolvedValue({ data: { profile: { isComplete: true } } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Got it, Save & Continue' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/profile/step/7', { someData: 'test' });
      expect(screen.queryByText('Important Notice')).not.toBeInTheDocument();
    });
  });

  it('handles final profile submission success', async () => {
    api.get.mockResolvedValue({ data: { profile: { isComplete: false, currentStep: 7 } } });
    api.put.mockResolvedValue({ data: { message: 'Profile completed successfully!' } });
    
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Review')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/profile/step/7', { finalData: 'test', dpdpConsent: true });
      expect(toast.success).toHaveBeenCalledWith('Profile completed successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles final profile submission failure', async () => {
    api.get.mockResolvedValue({ data: { profile: { isComplete: false, currentStep: 7 } } });
    api.put.mockRejectedValue({ response: { data: { error: 'Missing skills' } } });
    
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Review')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Missing skills');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('handles fallback error for final submission failure', async () => {
    api.get.mockResolvedValue({ data: { profile: { isComplete: false, currentStep: 7 } } });
    api.put.mockRejectedValue(new Error('Network error'));
    
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Review')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to submit application.');
    });
  });
  
  it('stepper item clicks navigate properly', async () => {
    api.get.mockResolvedValue({ data: { profile: { isComplete: false, currentStep: 3 } } });
    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Education')).toBeInTheDocument();
    });

    // Find stepper item for Step 1 (Personal Details)
    const step1Button = screen.getByText('Personal Details').closest('button');
    fireEvent.click(step1Button);

    await waitFor(() => {
      expect(screen.getByTestId('mock-step-Personal')).toBeInTheDocument();
    });
  });
});
