import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Auth.css';

export default function ResetPassword() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success(res.data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="auth-page">
        <div className="auth-container animate-fadeIn">
          <p>Invalid access. <Link to="/forgot-password">Go back</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container animate-fadeIn">
        <div className="auth-header">
          <div className="auth-logo"><Lock size={22} /></div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter the OTP sent to <strong>{email}</strong> and your new password</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">OTP Code <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password <span className="required">*</span></label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input with-icon"
                placeholder="Min. 8 chars with upper, lower, number & special"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <div className="spinner" /> : <>Reset Password <ArrowRight size={16} /></>}
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
