import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Auth.css';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = location.state?.email;
  const purpose = location.state?.purpose || 'EMAIL_VERIFICATION';

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex(v => !v);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otpCode, purpose });
      toast.success(res.data.message);

      if (purpose === 'EMAIL_VERIFICATION' && res.data.token) {
        login(res.data.token, res.data.user);
        // Navigate directly to the application process
        navigate('/apply');
      } else if (purpose === 'PASSWORD_RESET') {
        navigate('/reset-password', { state: { email, otpVerified: true } });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { email, purpose });
      toast.success('A new OTP has been sent to your email.');
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fadeIn">
        <div className="auth-header">
          <img src="/assets/zanSphereLogo.svg" alt="Zansphere Logo" style={{ height: '180px', margin: '0 auto', display: 'block' }} />
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle">
            We've sent a 6-digit OTP to<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-input"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <div className="spinner" /> : 'Verify OTP'}
          </button>

          <div className="otp-resend">
            {resendTimer > 0 ? (
              <p className="text-muted text-sm">Resend OTP in <strong>{resendTimer}s</strong></p>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleResend}>
                <RefreshCw size={14} /> Resend OTP
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="auth-decoration">
        <div className="auth-deco-circle" />
        <div className="auth-deco-circle small" />
      </div>
    </div>
  );
}
