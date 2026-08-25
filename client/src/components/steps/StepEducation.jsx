import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function StepEducation({ application, saving, onNext, onPrev }) {
  const [form, setForm] = useState({
    highestQualification: application.highestQualification || 'UG',
    institution: application.institution || '',
    degreeSpecialization: application.degreeSpecialization || '',
    yearOfPassing: application.yearOfPassing || new Date().getFullYear(),
    percentageOrCgpa: application.percentageOrCgpa || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="step-title">Education</h2>
      <p className="step-subtitle">Your academic qualifications</p>

      <div className="step-form">
        <div className="form-group">
          <label className="form-label">Highest Qualification <span className="required">*</span></label>
          <select name="highestQualification" className="form-input form-select" value={form.highestQualification} onChange={handleChange} required>
            <option value="TENTH">10th</option>
            <option value="TWELFTH">12th</option>
            <option value="DIPLOMA">Diploma</option>
            <option value="UG">Undergraduate (UG)</option>
            <option value="PG">Postgraduate (PG)</option>
          </select>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Institution / University <span className="required">*</span></label>
            <input type="text" name="institution" className="form-input" placeholder="University or institution name" value={form.institution} onChange={handleChange} maxLength={150} required />
          </div>
          <div className="form-group">
            <label className="form-label">Degree & Specialization <span className="required">*</span></label>
            <input type="text" name="degreeSpecialization" className="form-input" placeholder="e.g., B.Tech in Computer Science" value={form.degreeSpecialization} onChange={handleChange} maxLength={100} required />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Year of Passing <span className="required">*</span></label>
            <input type="number" name="yearOfPassing" className="form-input" placeholder="e.g., 2024" min="1980" max="2030" value={form.yearOfPassing} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Percentage / CGPA <span className="required">*</span></label>
            <input type="text" name="percentageOrCgpa" className="form-input" placeholder="e.g., 85% or 8.5 CGPA" value={form.percentageOrCgpa} onChange={handleChange} maxLength={10} required />
          </div>
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
