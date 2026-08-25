import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import StepPersonal from '../components/steps/StepPersonal';
import StepProfessional from '../components/steps/StepProfessional';
import StepEducation from '../components/steps/StepEducation';
import StepSkills from '../components/steps/StepSkills';
import StepPreferences from '../components/steps/StepPreferences';
import StepDocuments from '../components/steps/StepDocuments';
import StepReview from '../components/steps/StepReview';
import { User, Briefcase, GraduationCap, Wrench, Heart, FileText, CheckCircle } from 'lucide-react';
import './ApplicationForm.css';

const STEPS = [
  { label: 'Personal Details', icon: User },
  { label: 'Professional Profile', icon: Briefcase },
  { label: 'Education', icon: GraduationCap },
  { label: 'Skills', icon: Wrench },
  { label: 'Job Preferences', icon: Heart },
  { label: 'Documents & Links', icon: FileText },
  { label: 'Review & Submit', icon: CheckCircle },
];

export default function ApplicationForm() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initApplication();
  }, []);

  const initApplication = async () => {
    setLoading(true);
    try {
      const res = await api.post('/applications', {});
      setApplication(res.data.application);
      if (res.data.isExisting && res.data.application.status === 'SUBMITTED') {
        // Already submitted, go to review
        setCurrentStep(7);
      } else if (res.data.isExisting) {
        setCurrentStep(Math.min(res.data.application.currentStep || 1, 7));
      }
    } catch (err) {
      toast.error('Failed to initialize application.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveStep = async (stepNum, data) => {
    if (!application) return;
    setSaving(true);
    try {
      const res = await api.put(`/applications/${application.id}/step/${stepNum}`, data);
      setApplication(res.data.application);
      toast.success('Step saved successfully!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save step.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (data) => {
    const saved = await saveStep(currentStep, data);
    if (saved && currentStep < 7) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToStep = (step) => {
    if (step <= (application?.currentStep || 1) || step <= currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/applications/${application.id}/submit`, { dpdpConsent: true });
      toast.success(res.data.message);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  if (!application) return null;

  const stepProps = {
    application,
    saving,
    onNext: handleNext,
    onPrev: handlePrev,
    onSubmit: handleSubmit,
    onGoToStep: handleGoToStep,
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="application-job-header animate-fadeIn">
          <div className="job-dept-badge">{application.preferredDepartment || 'General'}</div>
          <h2>Applying for: <strong>{application.roleOfInterest || 'General Application'}</strong></h2>
        </div>

        {/* Stepper */}
        <div className="stepper animate-fadeIn">
          {STEPS.map((step, index) => {
            const stepNum = index + 1;
            const Icon = step.icon;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum || application.status === 'SUBMITTED';
            const isClickable = application.status === 'SUBMITTED' || stepNum <= (application?.currentStep || 1) || stepNum <= currentStep;

            return (
              <div key={stepNum} className="stepper-item-wrapper">
                <button
                  className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
                  onClick={() => isClickable && handleGoToStep(stepNum)}
                  disabled={!isClickable}
                >
                  <div className="stepper-circle">
                    {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </div>
                  <span className="stepper-label">{step.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`stepper-line ${isCompleted ? 'completed' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="step-content animate-fadeIn">
          {currentStep === 1 && <StepPersonal {...stepProps} />}
          {currentStep === 2 && <StepProfessional {...stepProps} />}
          {currentStep === 3 && <StepEducation {...stepProps} />}
          {currentStep === 4 && <StepSkills {...stepProps} />}
          {currentStep === 5 && <StepPreferences {...stepProps} />}
          {currentStep === 6 && <StepDocuments {...stepProps} />}
          {currentStep === 7 && <StepReview {...stepProps} />}
        </div>
      </div>
    </div>
  );
}
