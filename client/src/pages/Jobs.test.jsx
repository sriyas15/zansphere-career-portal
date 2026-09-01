import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import Jobs from './Jobs';
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
  Link: ({ children, to, onClick }) => <a href={to} onClick={onClick}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

describe('Jobs Component', () => {
  const mockUser = { firstName: 'John' };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  const renderJobs = () => {
    return render(
      <BrowserRouter>
        <Jobs />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    const { container } = renderJobs();
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('redirects to profile-setup if profile is incomplete', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: { isComplete: false } } });
      return Promise.resolve({ data: {} });
    });

    renderJobs();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile-setup');
    });
  });

  it('shows error toast if data fetching fails', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderJobs();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load jobs data.');
    });
  });

  it('renders jobs list and filters out applied jobs', async () => {
    const profileData = { isComplete: true, fullName: 'John Doe', email: 'j@d.com' };
    const jobsData = [
      { id: 'job1', title: 'Software Engineer', vacancies: 2, department_name: 'Engineering' },
      { id: 'job2', title: 'Designer', vacancies: 1, department_name: 'Design' }
    ];
    const appsData = [
      { jobId: 'job1' }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: appsData } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: jobsData } });
    });

    renderJobs();

    await waitFor(() => {
      expect(screen.getByText('Available Positions')).toBeInTheDocument();
      // Should filter out job1 because applied
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.getByText('Designer')).toBeInTheDocument();
      
      // Should show general application because not applied to general
      expect(screen.getByText('General Application')).toBeInTheDocument();
    });
  });

  it('does not show General Application if already applied to general', async () => {
    const profileData = { isComplete: true };
    const appsData = [{ jobId: null }]; // General application has no jobId
    
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: appsData } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: [] } });
    });

    renderJobs();

    await waitFor(() => {
      expect(screen.queryByText('General Application')).not.toBeInTheDocument();
    });
  });

  it('handles apply click and confirm modal', async () => {
    const profileData = { isComplete: true, fullName: 'John Doe', email: 'test@example.com', totalExperienceYears: 2, totalExperienceMonths: 5 };
    const jobsData = [
      { id: 'job1', title: 'Software Engineer', vacancies: 2 }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: jobsData } });
    });
    
    api.post.mockResolvedValueOnce({ data: { message: 'Application submitted!' } });

    renderJobs();

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    // Click Apply Now for specific job
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));

    expect(screen.getByText('Confirm Application')).toBeInTheDocument();
    expect(screen.getByText(/You are about to apply for/i)).toHaveTextContent('Software Engineer');
    
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Apply' }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/applications/job1');
      expect(toast.success).toHaveBeenCalledWith('Application submitted!');
      expect(screen.queryByText('Confirm Application')).not.toBeInTheDocument();
    });
  });

  it('handles general apply click and confirm modal', async () => {
    const profileData = { isComplete: true };
    
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: [] } });
    });
    
    api.post.mockResolvedValueOnce({ data: { message: 'General application submitted!' } });

    renderJobs();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Profile/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Profile/i }));
    expect(screen.getByText('Confirm Application')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Apply' }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/applications/general');
      expect(toast.success).toHaveBeenCalledWith('General application submitted!');
    });
  });

  it('shows fallback error if application fails', async () => {
    const profileData = { isComplete: true };
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: [] } });
    });
    
    api.post.mockRejectedValueOnce(new Error('Network error'));

    renderJobs();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Profile/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Profile/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Apply' }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to submit application.');
    });
  });

  it('can cancel application modal', async () => {
    const profileData = { isComplete: true };
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: [] } });
    });

    renderJobs();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Profile/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Profile/i }));
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Confirm Application')).not.toBeInTheDocument();
  });


});
