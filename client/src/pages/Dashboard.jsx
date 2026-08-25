import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Clock, Eye, ArrowRight, FileText, TrendingUp, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Dashboard.css';

const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  IN_PIPELINE: 'In Pipeline',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  ON_HOLD: 'On Hold',
};

const STATUS_BADGE = {
  DRAFT: 'badge-neutral',
  SUBMITTED: 'badge-info',
  IN_REVIEW: 'badge-warning',
  IN_PIPELINE: 'badge-info',
  INTERVIEW_SCHEDULED: 'badge-warning',
  SELECTED: 'badge-success',
  REJECTED: 'badge-error',
  WITHDRAWN: 'badge-neutral',
  ON_HOLD: 'badge-warning',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications');
      setApplications(res.data.applications || []);
    } catch (err) {
      toast.error('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  const submitted = applications.filter(a => a.status !== 'DRAFT');
  const drafts = applications.filter(a => a.status === 'DRAFT');

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="dashboard-header animate-fadeIn">
          <div>
            <h1 className="page-title">Welcome back, {user?.firstName}!</h1>
            <p className="page-subtitle">Track your application and manage your profile</p>
          </div>
        </div>

        {/* Stats */}
        <div className="dashboard-stats animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="stat-card">
            <div className="stat-icon"><FileText size={20} /></div>
            <div className="stat-info">
              <span className="stat-value">{applications.length}</span>
              <span className="stat-label">Total Applications</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><TrendingUp size={20} /></div>
            <div className="stat-info">
              <span className="stat-value">{submitted.length}</span>
              <span className="stat-label">Submitted</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><Clock size={20} /></div>
            <div className="stat-info">
              <span className="stat-value">{drafts.length}</span>
              <span className="stat-label">Drafts</span>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="dashboard-section animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <h2 className="section-title">Your Applications</h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : applications.length === 0 ? (
            <div className="dashboard-empty">
              <Briefcase size={48} strokeWidth={1} />
              <h3>No applications found</h3>
              <p>Your application could not be loaded. Please try refreshing the page.</p>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map((app) => {
                const displayStatus = app.zanpeopleStatus || app.status;
                return (
                  <div key={app.id} className="application-card card">
                    <div className="app-card-main">
                      <div className="app-card-info">
                        <h3 className="app-card-title">{app.jobTitle}</h3>
                        {app.departmentName && (
                          <span className="job-dept-badge">{app.departmentName}</span>
                        )}
                        <div className="app-card-meta">
                          <span><Clock size={13} /> Applied: {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="app-card-actions">
                        <span className={`badge ${STATUS_BADGE[displayStatus] || 'badge-neutral'}`}>
                          {STATUS_LABELS[displayStatus] || displayStatus}
                        </span>
                        {app.status === 'DRAFT' ? (
                          <Link to={`/apply/${app.id}`} className="btn btn-primary btn-sm">
                            Continue <ArrowRight size={14} />
                          </Link>
                        ) : (
                          <Link to={`/apply/${app.id}`} className="btn btn-secondary btn-sm">
                            <Edit3 size={14} /> Edit / View
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
