import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message);
      navigate('/verify-otp', { state: { email, purpose: 'PASSWORD_RESET' } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fadeIn">
        <div className="auth-header">
          <img src="/assets/zanSphereLogo.svg" alt="Zansphere Logo" style={{ height: '180px', margin: '0 auto 16px', display: 'block' }} />
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Enter your registered email to receive a password reset OTP</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address <span className="required">*</span></label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                className="form-input with-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <div className="spinner" /> : <>Send OTP <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="back-link"><ArrowLeft size={14} /> Back to login</Link>
        </div>
      </div>

      <div className="auth-decoration">
        <div className="auth-deco-circle" />
        <div className="auth-deco-circle small" />
      </div>
    </div>
  );
}
