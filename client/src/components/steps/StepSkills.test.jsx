import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import StepSkills from './StepSkills';

describe('StepSkills Component', () => {
  const mockOnNext = jest.fn();
  const mockOnPrev = jest.fn();

  const mockApp = {
    skills: [
      { category: 'Engineering/Tech', skills: 'React, Node.js' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderStep = (application = {}, saving = false) => {
    return render(
      <StepSkills application={application} saving={saving} onNext={mockOnNext} onPrev={mockOnPrev} />
    );
  };

  it('renders correctly with pre-filled application data', () => {
    const { container } = renderStep(mockApp);
    
    expect(screen.getByRole('heading', { name: 'Skills' })).toBeInTheDocument();
    
    expect(container.querySelector('select').value).toBe('Engineering/Tech');
    expect(container.querySelector('textarea').value).toBe('React, Node.js');
  });

  it('renders with empty application data', () => {
    const { container } = renderStep({});
    
    expect(container.querySelector('select').value).toBe('');
    expect(container.querySelector('textarea').value).toBe('');
  });

  it('handles input changes', () => {
    const { container } = renderStep({});
    
    fireEvent.change(container.querySelector('select'), { target: { value: 'Design' } });
    expect(container.querySelector('select').value).toBe('Design');
    
    fireEvent.change(container.querySelector('textarea'), { target: { value: 'Figma, Photoshop' } });
    expect(container.querySelector('textarea').value).toBe('Figma, Photoshop');
  });

  it('handles adding and removing skill entries', () => {
    const { container } = renderStep(mockApp);
    
    const addBtn = screen.getByRole('button', { name: /Add Category/i });
    
    fireEvent.click(addBtn); // Adds second entry
    
    let removeBtns = screen.getAllByRole('button', { name: /Remove/i });
    expect(removeBtns.length).toBe(2);
    
    // Remove first entry
    fireEvent.click(removeBtns[0]);
    
    removeBtns = screen.queryAllByRole('button', { name: /Remove/i });
    expect(removeBtns.length).toBe(0); // Only 1 left
  });

  it('submits correctly and filters out empty entries', () => {
    const { container } = renderStep(mockApp);
    
    // Add empty entry
    fireEvent.click(screen.getByRole('button', { name: /Add Category/i }));
    
    // The second entry is empty (missing category or skills string), but since required attributes are on, we might not be able to submit natively in real browser.
    // In JSDOM, form submission might just work if we bypass required.
    // Actually we'll just fill the second one partially to test the filter logic if needed, but required prevents it.
    // Let's just submit the pre-filled one.
    
    // We remove the required attribute to test the filter logic
    container.querySelectorAll('select')[1].removeAttribute('required');
    container.querySelectorAll('textarea')[1].removeAttribute('required');
    
    fireEvent.submit(container.querySelector('form'));
    
    expect(mockOnNext).toHaveBeenCalledWith({
      skills: [
        { category: 'Engineering/Tech', skills: 'React, Node.js' }
      ]
    });
  });

  it('calls onPrev when Previous is clicked', () => {
    renderStep(mockApp);
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(mockOnPrev).toHaveBeenCalled();
  });
});
