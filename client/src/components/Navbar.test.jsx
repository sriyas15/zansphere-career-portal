import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
let mockLocation = { pathname: '/dashboard' };

jest.mock('react-router-dom', () => {
  return {
    BrowserRouter: ({ children }) => <div>{children}</div>,
    Link: ({ children, to, className, onClick }) => (
      <a href={to} className={className} onClick={onClick}>
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('Navbar Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = '/dashboard';
  });

  const renderNavbar = (path = '/dashboard') => {
    return render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  it('renders correctly for unauthenticated user', () => {
    useAuth.mockReturnValue({ user: null, logout: mockLogout });
    renderNavbar();

    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders correctly for authenticated user', () => {
    useAuth.mockReturnValue({
      user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      logout: mockLogout,
    });
    renderNavbar();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  it('opens dropdown menu and handles logout', async () => {
    useAuth.mockReturnValue({
      user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      logout: mockLogout,
    });
    renderNavbar();

    // Toggle dropdown
    const userMenuButton = screen.getByRole('button', { name: /John Doe/i });
    fireEvent.click(userMenuButton);

    expect(screen.getByText('Logout')).toBeInTheDocument();
    
    // Click logout
    fireEvent.click(screen.getByText('Logout'));
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('toggles mobile menu', () => {
    useAuth.mockReturnValue({
      user: { firstName: 'John', lastName: 'Doe' },
      logout: mockLogout,
    });
    renderNavbar();

    const toggleButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(toggleButton); // open
    
    // Check if open class is added
    const navbarLinks = document.querySelector('.navbar-links');
    expect(navbarLinks.className).toContain('open');

    fireEvent.click(toggleButton); // close
    expect(navbarLinks.className).not.toContain('open');
  });

  it('closes mobile menu when link is clicked', () => {
    useAuth.mockReturnValue({
      user: { firstName: 'John', lastName: 'Doe' },
      logout: mockLogout,
    });
    mockLocation.pathname = '/jobs'; // Test jobs active state
    renderNavbar();

    const toggleButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(toggleButton); // open menu
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    fireEvent.click(dashboardLink); // click dashboard link
    
    expect(document.querySelector('.navbar-links').className).not.toContain('open');

    // Test Jobs link as well
    fireEvent.click(toggleButton); // open menu
    const jobsLink = screen.getByText('Jobs').closest('a');
    fireEvent.click(jobsLink); // click jobs link

    expect(document.querySelector('.navbar-links').className).not.toContain('open');
  });

  it('closes dropdown on blur', () => {
    jest.useFakeTimers();
    useAuth.mockReturnValue({
      user: { firstName: 'John', lastName: 'Doe' },
      logout: mockLogout,
    });
    renderNavbar();

    const userMenuButton = screen.getByRole('button', { name: /John Doe/i });
    fireEvent.click(userMenuButton); // open dropdown
    expect(screen.getByText('Logout')).toBeInTheDocument();

    fireEvent.blur(userMenuButton); // blur dropdown
    
    // Fast-forward setTimeout
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
