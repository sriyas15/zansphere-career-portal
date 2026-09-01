import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { jest } from '@jest/globals';
import Dashboard from './Dashboard';
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

describe('Dashboard Component', () => {
  const mockUser = { firstName: 'John' };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    const { container } = renderDashboard();
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('redirects to profile-setup if profile is incomplete', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: { isComplete: false } } });
      return Promise.resolve({ data: {} });
    });

    renderDashboard();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile-setup');
    });
  });

  it('shows error toast if data fetching fails', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderDashboard();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load dashboard data.');
    });
  });

  it('renders dashboard correctly with completed profile and jobs', async () => {
    const profileData = { isComplete: true, roleOfInterest: 'Software Engineer', fullName: 'John Doe', email: 'j@d.com' };
    const jobsData = [
      { id: 'job1', title: 'Software Engineer', vacancies: 2, department_name: 'Engineering' },
      { id: 'job2', title: 'Designer', vacancies: 1, department_name: 'Design' }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: jobsData } });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
      expect(screen.getByText('Profile Completed')).toBeInTheDocument();
      // Should filter jobs by roleOfInterest
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('2 Vacancies')).toBeInTheDocument();
    });
  });

  it('renders general application card if roleOfInterest has no exact match', async () => {
    const profileData = { isComplete: true, roleOfInterest: 'Product Manager' };
    const jobsData = [
      { id: 'job1', title: 'Software Engineer', vacancies: 2 }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: jobsData } });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Profile/i })).toBeInTheDocument();
    });
  });

  it('renders 3 jobs if roleOfInterest is missing', async () => {
    const profileData = { isComplete: true };
    const jobsData = [
      { id: '1', title: 'Job 1', vacancies: 1 },
      { id: '2', title: 'Job 2', vacancies: 1 },
      { id: '3', title: 'Job 3', vacancies: 1 },
      { id: '4', title: 'Job 4', vacancies: 1 }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: jobsData } });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Job 1')).toBeInTheDocument();
      expect(screen.getByText('Job 2')).toBeInTheDocument();
      expect(screen.getByText('Job 3')).toBeInTheDocument();
      expect(screen.queryByText('Job 4')).not.toBeInTheDocument(); // Sliced to 3
    });
  });

  it('renders existing applications instead of jobs', async () => {
    const profileData = { isComplete: true };
    const uuid = '12345678-1234-1234-1234-123456789012'; // 36 chars
    const appsData = [
      { id: 'app1', shortId: 'APP-1', status: 'SUBMITTED', appliedAt: '2023-01-01T00:00:00Z', jobTitle: uuid },
      { id: 'app2', shortId: 'APP-2', status: 'UNKNOWN_STATUS', appliedAt: '2023-01-02T00:00:00Z', jobTitle: 'General' },
      { id: 'app3', shortId: 'APP-3', status: 'SELECTED', zanpeopleStatus: 'REJECTED', appliedAt: '2023-01-03T00:00:00Z', jobTitle: 'Backend Dev' }
    ];
    const jobsData = [
      { id: uuid, title: 'Software Engineer', vacancies: 2 }
    ];

    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: appsData } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: jobsData } });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Your Applications')).toBeInTheDocument();
      
      // UUID job title resolution
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Submitted')).toBeInTheDocument(); // SUBMITTED badge

      // General fallback or normal job titles
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();

      // zanpeopleStatus override
      expect(screen.getByText('Backend Dev')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument(); // REJECTED badge
      
      // Jobs grid should not be shown if applications exist
      expect(screen.queryByText('Available Positions')).not.toBeInTheDocument();
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

    renderDashboard();

    // Wait for jobs to render
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    // Click Apply Now
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));

    // Modal should appear
    expect(screen.getByText('Confirm Application')).toBeInTheDocument();
    expect(screen.getByText(/You are about to apply for/i)).toHaveTextContent('Software Engineer');
    expect(screen.getByText(/2y 5m/i)).toBeInTheDocument();
    expect(screen.getByText(/Fresher/i)).toBeInTheDocument(); // default current role
    
    // Confirm apply
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Apply' }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/applications/job1');
      expect(toast.success).toHaveBeenCalledWith('Application submitted!');
      expect(screen.queryByText('Confirm Application')).not.toBeInTheDocument(); // Modal closed
    });
  });

  it('handles general apply click and confirm modal', async () => {
    const profileData = { isComplete: true, roleOfInterest: 'Product Manager' };
    
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: [] } });
    });
    
    api.post.mockResolvedValueOnce({ data: { message: 'General application submitted!' } });

    renderDashboard();

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

  it('shows error if application fails', async () => {
    const profileData = { isComplete: true, roleOfInterest: 'PM' };
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: [] } });
    });
    
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Already applied' } } });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Profile/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Profile/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Apply' }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Already applied');
    });
  });

  it('shows fallback error if application fails', async () => {
    const profileData = { isComplete: true, roleOfInterest: 'PM' };
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: [] } });
    });
    
    api.post.mockRejectedValueOnce(new Error('Network error'));

    renderDashboard();

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
    const profileData = { isComplete: true, roleOfInterest: 'PM' };
    api.get.mockImplementation((url) => {
      if (url === '/profile') return Promise.resolve({ data: { profile: profileData } });
      if (url === '/applications') return Promise.resolve({ data: { applications: [] } });
      if (url === '/applications/jobs') return Promise.resolve({ data: { jobs: [] } });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Profile/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Profile/i }));
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Confirm Application')).not.toBeInTheDocument();
  });

});
