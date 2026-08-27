import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, ArrowRight, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Dashboard.css';

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState(null);
  const [applyingJobTitle, setApplyingJobTitle] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobsData();
  }, []);

  const fetchJobsData = async () => {
    try {
      const [profileRes, appsRes, jobsRes] = await Promise.all([
        api.get('/profile'),
        api.get('/applications'),
        api.get('/applications/jobs')
      ]);
      setProfile(profileRes.data.profile);

      if (!profileRes.data.profile.isComplete) {
        navigate('/profile-setup');
        return;
      }

      setApplications(appsRes.data.applications || []);
      setJobs(jobsRes.data.jobs || []);
    } catch (err) {
      toast.error('Failed to load jobs data.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (jobId, jobTitle) => {
    if (!profile?.isComplete) {
      toast.error('Please complete your profile first!');
      return;
    }
    setApplyingTo(jobId);
    setApplyingJobTitle(jobTitle);
    setShowPreviewModal(true);
  };

  const confirmApply = async () => {
    setSubmitting(true);
    try {
      if (applyingTo === 'general') {
        const res = await api.post('/applications/general');
        toast.success(res.data.message);
      } else {
        const res = await api.post(`/applications/${applyingTo}`);
        toast.success(res.data.message);
      }
      setShowPreviewModal(false);
      fetchJobsData(); // Refresh lists
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasGeneralApplication = applications.some(a => !a.jobId);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="dashboard-header animate-fadeIn">
          <div>
            <h1 className="page-title">Available Positions</h1>
            <p className="page-subtitle">Find your next role at Zansphere</p>
          </div>
        </div>

        <div className="dashboard-section animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="jobs-grid">
            {jobs.filter(job => !applications.some(a => a.jobId === job.id)).map((job) => {
              return (
                <div key={job.id} className="application-card card">
                  <div className="app-card-main">
                    <div className="app-card-info">
                      <h3 className="app-card-title">{job.title}</h3>
                      {job.department_name && (
                        <span className="job-dept-badge">{job.department_name}</span>
                      )}
                      <div className="app-card-meta">
                        <span><Briefcase size={13} /> {job.vacancies} Vacancies</span>
                      </div>
                    </div>
                    <div className="app-card-actions">
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleApplyClick(job.id, job.title)}
                        disabled={!profile?.isComplete}
                      >
                        Apply Now <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!hasGeneralApplication && (
              <div className="application-card card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                <div className="app-card-main">
                  <div className="app-card-info">
                    <h3 className="app-card-title">General Application</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Don't see a matching role? Submit your profile to our general talent pool.</p>
                  </div>
                  <div className="app-card-actions">
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => handleApplyClick('general', 'General Application')}
                      disabled={!profile?.isComplete}
                    >
                      <Send size={14} /> Submit Profile
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0 }}>Confirm Application</h2>
            <p>You are about to apply for <strong>{applyingJobTitle}</strong>.</p>
            
            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', margin: '20px 0' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Your application will be submitted with your current profile details:</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem' }}>
                <li><strong>Name:</strong> {profile?.fullName}</li>
                <li><strong>Email:</strong> {profile?.email}</li>
                <li><strong>Experience:</strong> {profile?.totalExperienceYears}y {profile?.totalExperienceMonths}m</li>
                <li><strong>Current Role:</strong> {profile?.currentDesignation || 'Fresher'}</li>
              </ul>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Need to update your details before applying? <Link to="/profile-setup" onClick={() => setShowPreviewModal(false)} style={{ color: 'var(--primary-color)' }}>Edit Profile</Link>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-ghost" onClick={() => setShowPreviewModal(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmApply} disabled={submitting}>
                {submitting ? <div className="spinner" /> : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
