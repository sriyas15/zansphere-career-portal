import { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Upload, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function StepDocuments({ application, saving, onNext, onPrev }) {
  const [form, setForm] = useState({
    resumeUrl: application.resumeUrl || '',
    resumeFileName: application.resumeFileName || '',
    portfolioUrl: application.portfolioUrl || '',
    linkedinUrl: application.linkedinUrl || '',
    githubUrl: application.githubUrl || '',
  });
  
  const [otherLinks, setOtherLinks] = useState(
    Array.isArray(application.otherLinks) && application.otherLinks.length > 0 
      ? application.otherLinks 
      : []
  );

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm({ ...form, resumeUrl: res.data.fileUrl, resumeFileName: res.data.fileName });
      toast.success('Resume uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.resumeUrl) {
      toast.error('Please upload your resume.');
      return;
    }
    if (!form.linkedinUrl) {
      toast.error('LinkedIn profile URL is required.');
      return;
    }
    const validLinks = otherLinks.filter(l => l.trim() !== '');
    onNext({ ...form, otherLinks: validLinks });
  };

  const addOtherLink = () => setOtherLinks([...otherLinks, '']);
  const updateOtherLink = (index, value) => {
    const updated = [...otherLinks];
    updated[index] = value;
    setOtherLinks(updated);
  };
  const removeOtherLink = (index) => {
    setOtherLinks(otherLinks.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="step-title">Documents & Links</h2>
      <p className="step-subtitle">Upload your resume and share relevant profile links</p>

      <div className="step-form">
        <div className="form-group">
          <label className="form-label">Resume / CV (PDF) <span className="required">*</span></label>
          <input
            type="file"
            ref={fileRef}
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <div
            className={`file-upload-area ${form.resumeUrl ? 'has-file' : ''}`}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <>
                <div className="spinner" />
                <p>Uploading...</p>
              </>
            ) : form.resumeUrl ? (
              <>
                <CheckCircle size={32} style={{ color: 'var(--color-success)' }} />
                <p className="file-name">{form.resumeFileName || 'Resume uploaded'}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Click to replace</p>
              </>
            ) : (
              <>
                <Upload size={32} style={{ color: 'var(--color-text-muted)' }} />
                <p>Click to upload your resume (PDF, max 5MB)</p>
              </>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Portfolio / Work Samples URL</label>
          <input type="url" name="portfolioUrl" className="form-input" placeholder="https://behance.net/yourportfolio (Optional)" value={form.portfolioUrl} onChange={handleChange} maxLength={200} />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">LinkedIn Profile <span className="required">*</span></label>
            <input type="url" name="linkedinUrl" className="form-input" placeholder="https://linkedin.com/in/you" value={form.linkedinUrl} onChange={handleChange} maxLength={200} required />
          </div>
          <div className="form-group">
            <label className="form-label">GitHub Profile</label>
            <input type="url" name="githubUrl" className="form-input" placeholder="https://github.com/you (Optional)" value={form.githubUrl} onChange={handleChange} maxLength={200} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>Other Links</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addOtherLink}>
              Add Another Link
            </button>
          </div>
          {otherLinks.map((link, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input 
                type="url" 
                className="form-input" 
                placeholder="https://... (Optional)" 
                value={link} 
                onChange={(e) => updateOtherLink(index, e.target.value)} 
                maxLength={200}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeOtherLink(index)} style={{ padding: '0 12px' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={onPrev}>
          <ArrowLeft size={16} /> Previous
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? <div className="spinner" /> : <>Save & Continue <ArrowRight size={16} /></>}
        </button>
      </div>
    </form>
  );
}
