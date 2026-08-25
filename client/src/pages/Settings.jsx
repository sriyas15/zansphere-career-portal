import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Settings.css';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/profile', profile);
      updateUser(res.data.user);
      toast.success(res.data.message || 'Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.post('/profile/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success(res.data.message || 'Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header animate-fadeIn">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile and security preferences</p>
        </div>

        <div className="settings-layout animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="settings-sidebar">
            <button
              className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} /> Profile Details
            </button>
            <button
              className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={16} /> Security
            </button>
          </div>

          <div className="settings-content">
            {activeTab === 'profile' && (
              <div className="settings-card card">
                <h2 className="settings-card-title"><User size={18} /> Profile Details</h2>
                <p className="text-muted text-sm mb-6">Update your personal information</p>

                <form onSubmit={handleProfileSave} className="step-form">
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input type="text" className="form-input" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} maxLength={50} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-input" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} maxLength={50} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" value={user?.email || ''} readOnly disabled />
                    <span className="text-xs text-muted">Email cannot be changed</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} maxLength={15} required />
                  </div>



                  <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                    {profileLoading ? <div className="spinner" /> : <><Save size={16} /> Save Changes</>}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-card card">
                <h2 className="settings-card-title"><Lock size={18} /> Change Password</h2>
                <p className="text-muted text-sm mb-6">Ensure your account stays secure</p>

                <form onSubmit={handlePasswordChange} className="step-form">
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter current password"
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        required
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Min. 8 chars with upper, lower, number & special"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        required
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Re-enter new password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        required
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                    {passwordLoading ? <div className="spinner" /> : <><Lock size={16} /> Change Password</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
