import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StepPersonal({ application, saving, onNext }) {
  const [form, setForm] = useState({
    fullName: application.fullName || '',
    email: application.email || '',
    phone: application.phone || '',
    dateOfBirth: application.dateOfBirth ? application.dateOfBirth.split('T')[0] : '',
    city: application.city || '',
    state: application.state || '',
    willingToRelocate: application.willingToRelocate || false,
    panNumber: application.panNumber || '',
  });

  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
    "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'radio') {
      setForm({ ...form, [name]: value === 'yes' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone || !form.dateOfBirth || !form.city || !form.state || !form.panNumber) {
      return;
    }
    
    // PAN validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (!panRegex.test(form.panNumber)) {
      toast.error('Invalid PAN Number format (e.g. ABCDE1234F)');
      return;
    }

    onNext({ ...form, panNumber: form.panNumber.toUpperCase() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="step-title">Personal Details</h2>
      <p className="step-subtitle">Basic information about you</p>

      <div className="step-form">
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input type="text" name="fullName" className="form-input" placeholder="Your full name" value={form.fullName} onChange={handleChange} maxLength={100} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input type="email" name="email" className="form-input" value={form.email} readOnly disabled />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Phone <span className="required">*</span></label>
            <input type="tel" name="phone" className="form-input" placeholder="+91XXXXXXXXXX" value={form.phone} onChange={handleChange} maxLength={15} required />
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth <span className="required">*</span></label>
            <input type="date" name="dateOfBirth" className="form-input" value={form.dateOfBirth} onChange={handleChange} required />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">City <span className="required">*</span></label>
            <input type="text" name="city" className="form-input" placeholder="Current city" value={form.city} onChange={handleChange} maxLength={50} required />
          </div>
          <div className="form-group">
            <label className="form-label">State <span className="required">*</span></label>
            <select name="state" className="form-input form-select" value={form.state} onChange={handleChange} required>
              <option value="" disabled>Select state</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">PAN Number <span className="required">*</span></label>
            <input type="text" name="panNumber" className="form-input" placeholder="ABCDE1234F" maxLength={10} value={form.panNumber} onChange={handleChange} required style={{ textTransform: 'uppercase' }} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Are you willing to relocate to Chennai? <span className="required">*</span></label>
          <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="radio" name="willingToRelocate" value="yes" checked={form.willingToRelocate === true} onChange={handleChange} style={{ width: '16px', height: '16px', accentColor: '#000' }} />
              Yes
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="radio" name="willingToRelocate" value="no" checked={form.willingToRelocate === false} onChange={handleChange} style={{ width: '16px', height: '16px', accentColor: '#000' }} />
              No
            </label>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <div />
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <div className="spinner" /> : <>Save & Continue <ArrowRight size={16} /></>}
        </button>
      </div>
    </form>
  );
}
