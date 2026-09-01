import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import StepDocuments from './StepDocuments';
import api from '../../services/api';
import toast from 'react-hot-toast';

jest.mock('../../services/api');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

describe('StepDocuments Component', () => {
  const mockOnNext = jest.fn();
  const mockOnPrev = jest.fn();

  const mockApp = {
    resumeUrl: 'https://example.com/resume.pdf',
    resumeFileName: 'John_Resume.pdf',
    portfolioUrl: 'https://portfolio.com',
    linkedinUrl: 'https://linkedin.com/in/john',
    githubUrl: 'https://github.com/john',
    otherLinks: ['https://other.com']
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderStep = (application = {}, saving = false) => {
    return render(
      <StepDocuments application={application} saving={saving} onNext={mockOnNext} onPrev={mockOnPrev} />
    );
  };

  it('renders correctly with pre-filled application data', () => {
    const { container } = renderStep(mockApp);
    
    expect(screen.getByText('Documents & Links')).toBeInTheDocument();
    
    expect(screen.getByText('John_Resume.pdf')).toBeInTheDocument();
    
    expect(container.querySelector('input[name="portfolioUrl"]').value).toBe('https://portfolio.com');
    expect(container.querySelector('input[name="linkedinUrl"]').value).toBe('https://linkedin.com/in/john');
    expect(container.querySelector('input[name="githubUrl"]').value).toBe('https://github.com/john');
    
    const otherLinkInputs = container.querySelectorAll('input[placeholder="https://... (Optional)"]');
    expect(otherLinkInputs[0].value).toBe('https://other.com');
  });

  it('handles input changes', () => {
    const { container } = renderStep({});
    
    fireEvent.change(container.querySelector('input[name="linkedinUrl"]'), { target: { value: 'https://linkedin.com/in/jane' } });
    expect(container.querySelector('input[name="linkedinUrl"]').value).toBe('https://linkedin.com/in/jane');
  });

  it('handles other links addition and removal', () => {
    const { container } = renderStep(mockApp);
    
    const addBtn = screen.getByRole('button', { name: /Add Another Link/i });
    
    fireEvent.click(addBtn); // Adds second entry
    
    let removeBtns = screen.getAllByRole('button', { name: /Remove/i });
    expect(removeBtns.length).toBe(2);
    
    const inputs = container.querySelectorAll('input[placeholder="https://... (Optional)"]');
    fireEvent.change(inputs[1], { target: { value: 'https://newlink.com' } });
    expect(inputs[1].value).toBe('https://newlink.com');
    
    // Remove first entry
    fireEvent.click(removeBtns[0]);
    
    removeBtns = screen.queryAllByRole('button', { name: /Remove/i });
    expect(removeBtns.length).toBe(1);
    
    // Now the first input should be the new link
    const newInputs = container.querySelectorAll('input[placeholder="https://... (Optional)"]');
    expect(newInputs[0].value).toBe('https://newlink.com');
  });

  it('handles successful file upload', async () => {
    const { container } = renderStep({});
    
    api.post.mockResolvedValueOnce({
      data: { fileUrl: 'https://aws.com/resume.pdf', fileName: 'Jane_Resume.pdf' }
    });
    
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Resume uploaded successfully!');
      expect(screen.getByText('Jane_Resume.pdf')).toBeInTheDocument();
    });
  });

  it('handles file upload wrong type error', async () => {
    const { container } = renderStep({});
    
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'resume.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(toast.error).toHaveBeenCalledWith('Only PDF files are allowed.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('handles file upload size error', async () => {
    const { container } = renderStep({});
    
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(toast.error).toHaveBeenCalledWith('File size must be under 5MB.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('handles file upload API error', async () => {
    const { container } = renderStep({});
    
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Upload limit reached' } } });
    
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Upload limit reached');
    });
  });

  it('handles file upload empty target', () => {
    const { container } = renderStep({});
    
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [] } });
    
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits correctly', () => {
    const { container } = renderStep(mockApp);
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(mockOnNext).toHaveBeenCalledWith(mockApp);
  });

  it('submits error when resume is missing', () => {
    const { container } = renderStep({ linkedinUrl: 'https://linkedin.com' });
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(toast.error).toHaveBeenCalledWith('Please upload your resume.');
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('submits error when linkedin is missing', () => {
    const { container } = renderStep({ resumeUrl: 'http://a.com' });
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(toast.error).toHaveBeenCalledWith('LinkedIn profile URL is required.');
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('calls onPrev when Previous is clicked', () => {
    renderStep(mockApp);
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(mockOnPrev).toHaveBeenCalled();
  });

  it('simulates file input click via upload area', () => {
    const { container } = renderStep({});
    
    const uploadArea = container.querySelector('.file-upload-area');
    const fileInput = container.querySelector('input[type="file"]');
    
    // We spy on the click method
    const clickSpy = jest.spyOn(fileInput, 'click');
    
    fireEvent.click(uploadArea);
    
    expect(clickSpy).toHaveBeenCalled();
  });
});
