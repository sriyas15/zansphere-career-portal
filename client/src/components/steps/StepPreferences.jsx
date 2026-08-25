import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function StepPreferences({ application, saving, onNext, onPrev }) {
  const [form, setForm] = useState({
    preferredJobType: application.preferredJobType || 'FULL_TIME',
    preferredWorkMode: application.preferredWorkMode || 'ON_SITE',
    preferredDepartment: application.preferredDepartment || '',
    roleOfInterest: application.roleOfInterest || '',
    subscribeJobAlerts: application.subscribeJobAlerts !== false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="step-title">Job Preferences</h2>
      <p className="step-subtitle">Your ideal work setup</p>

      <div className="step-form">
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Preferred Job Type <span className="required">*</span></label>
            <select name="preferredJobType" className="form-input form-select" value={form.preferredJobType} onChange={handleChange} required>
              <option value="FULL_TIME">Full-time</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Preferred Work Mode <span className="required">*</span></label>
            <select name="preferredWorkMode" className="form-input form-select" value={form.preferredWorkMode} onChange={handleChange} required>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ON_SITE">On-site</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Preferred Department <span className="required">*</span></label>
            <input type="text" name="preferredDepartment" className="form-input" placeholder="e.g., Development, Testing, HR" value={form.preferredDepartment} onChange={handleChange} maxLength={100} required />
          </div>
          <div className="form-group">
            <label className="form-label">Job Preference <span className="required">*</span></label>
            <select name="roleOfInterest" className="form-input form-select" value={form.roleOfInterest} onChange={handleChange} required>
              <option value="" disabled>Select Role</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Marketing Specialist">Marketing Specialist</option>
              <option value="QA Engineer">QA Engineer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" name="subscribeJobAlerts" checked={form.subscribeJobAlerts} onChange={handleChange} style={{ width: '16px', height: '16px', accentColor: '#000' }} />
            Subscribe to job alerts
          </label>
        </div>
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={onPrev}>
          <ArrowLeft size={16} /> Previous
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <div className="spinner" /> : <>Save & Continue <ArrowRight size={16} /></>}
        </button>
      </div>
    </form>
  );
}
