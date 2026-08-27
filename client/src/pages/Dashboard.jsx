import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Clock, Eye, ArrowRight, FileText, TrendingUp, Edit3, User, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Dashboard.css';

const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  IN_PIPELINE: 'In Pipeline',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  ON_HOLD: 'On Hold',
  APPLIED: 'Applied',
};

const STATUS_BADGE = {
  SUBMITTED: 'badge-info',
  IN_REVIEW: 'badge-warning',
  IN_PIPELINE: 'badge-info',
  INTERVIEW_SCHEDULED: 'badge-warning',
  SELECTED: 'badge-success',
  REJECTED: 'badge-error',
  WITHDRAWN: 'badge-neutral',
  ON_HOLD: 'badge-warning',
  APPLIED: 'badge-info',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState(null); // Job ID or 'general'
  const [applyingJobTitle, setApplyingJobTitle] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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
      toast.error('Failed to load dashboard data.');
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
      fetchDashboardData(); // Refresh lists
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
            <h1 className="page-title">Welcome, {user?.firstName}!</h1>
            <p className="page-subtitle">Track your career journey and explore new opportunities</p>
          </div>
        </div>

        {/* Profile Status */}
        <div className="dashboard-section animate-fadeIn">
          <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: profile?.isComplete ? 'var(--bg-card)' : '#fff8e1', border: profile?.isComplete ? '1px solid var(--border-color)' : '1px solid #fde047' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="stepper-circle" style={{ background: profile?.isComplete ? 'var(--success-bg)' : 'var(--warning)', color: profile?.isComplete ? 'var(--success)' : '#fff', width: '48px', height: '48px' }}>
                {profile?.isComplete ? <CheckCircle size={24} /> : <User size={24} />}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                  {profile?.isComplete ? 'Profile Completed' : 'Profile Incomplete'}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {profile?.isComplete 
                    ? 'Your profile is ready. You can now apply for jobs.' 
                    : 'Complete your profile to unlock job applications.'}
                </p>
              </div>
            </div>
            <Link to="/profile-setup" className={profile?.isComplete ? 'btn btn-secondary' : 'btn btn-primary'}>
              {profile?.isComplete ? 'Edit Profile' : 'Complete Profile'}
            </Link>
          </div>
        </div>

        {/* Available Jobs - Only shown if they haven't applied to anything yet */}
        {applications.length === 0 && (
          <div className="dashboard-section animate-fadeIn" style={{ animationDelay: '100ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Available Positions</h2>
              <Link to="/jobs" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary-color)' }}>
                View All <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="jobs-grid">
              {(() => {
                let relevantJobs = jobs.filter(job => !applications.some(a => a.jobId === job.id));
                let isCustomRole = false;

                if (profile?.roleOfInterest) {
                  const matchedJobs = relevantJobs.filter(j => j.title.toLowerCase() === profile.roleOfInterest.toLowerCase());
                  if (matchedJobs.length > 0) {
                    relevantJobs = matchedJobs; // Only show matched jobs
                  } else {
                    relevantJobs = []; // Custom role, show no specific jobs
                    isCustomRole = true;
                  }
                } else {
                  relevantJobs = relevantJobs.slice(0, 3); // Fallback to top 3 if no preference
                }

                return (
                  <>
                    {relevantJobs.map((job) => (
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
                    ))}

                    {!hasGeneralApplication && isCustomRole && (
                      <div className="application-card card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                        <div className="app-card-main">
                          <div className="app-card-info">
                            <h3 className="app-card-title">{profile.roleOfInterest}</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                              Since you specified "{profile.roleOfInterest}" as your preferred role, submit your profile here to apply for it.
                            </p>
                          </div>
                          <div className="app-card-actions">
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => handleApplyClick('general', profile.roleOfInterest)}
                              disabled={!profile?.isComplete}
                            >
                              <Send size={14} /> Submit Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* My Applications List */}
        {applications.length > 0 && (
          <div className="dashboard-section animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <h2 className="section-title">Your Applications</h2>
            <div className="applications-list">
              {applications.map((app) => {
                const displayStatus = app.zanpeopleStatus || app.status;
                // Resolve UUID job title if it exists
                let displayTitle = app.jobTitle;
                if (displayTitle && displayTitle.length === 36 && displayTitle.includes('-')) {
                  const foundJob = jobs.find(j => j.id === displayTitle);
                  displayTitle = foundJob ? foundJob.title : 'General Application';
                }

                return (
                  <div key={app.id} className="application-card card">
                    <div className="app-card-main">
                      <div className="app-card-info">
                        <h3 className="app-card-title">{displayTitle}</h3>
                        <div className="app-card-meta">
                          <span><Clock size={13} /> Applied: {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span style={{ marginLeft: '12px', fontSize: '11px', color: '#888' }}>ID: {app.shortId}</span>
                        </div>
                      </div>
                      <div className="app-card-actions">
                        <span className={`badge ${STATUS_BADGE[displayStatus] || 'badge-neutral'}`}>
                          {STATUS_LABELS[displayStatus] || displayStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
