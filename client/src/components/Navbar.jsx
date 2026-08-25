import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, User, Settings, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to={user ? '/dashboard' : '/login'} className="navbar-brand"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', height: '100%' }}
        >
          <img
            src="/assets/zanSphereLogo.svg"
            alt="Zansphere Logo"
            style={{ height: '180px', position: 'absolute', left: 0, top: '41%', transform: 'translateY(-50%)' }}
          />
          <div className="brand-text" style={{ marginLeft: '150px' }}>
            <span className="brand-sub" style={{ color: 'black' }}>CAREER PORTAL</span>
          </div>
        </Link>

        {user && (
          <>
            <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <div className="nav-user-container">
                <button
                  className="nav-user"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                >
                  <div className="nav-user-avatar">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="nav-user-info">
                    <span className="nav-user-name">{user.firstName} {user.lastName}</span>
                    <span className="nav-user-email">{user.email}</span>
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="nav-dropdown">
                    <Link to="/settings" className="dropdown-item">
                      <Settings size={14} /> Settings
                    </Link>
                    <button className="dropdown-item text-error" onClick={handleLogout}>
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              className="navbar-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </>
        )}

        {!user && (
          <div className="navbar-auth">
            <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
