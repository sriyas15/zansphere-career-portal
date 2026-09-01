import { jest } from '@jest/globals';

const mockRender = jest.fn();
const mockCreateRoot = jest.fn(() => ({ render: mockRender }));

jest.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot
}));

jest.mock('./App.jsx', () => () => <div data-testid="app">App</div>);

describe('main.jsx', () => {
  let rootElement;

  beforeEach(() => {
    jest.clearAllMocks();
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the app', async () => {
    // Import main.jsx dynamically to run it
    await import('./main.jsx');

    expect(mockCreateRoot).toHaveBeenCalledWith(rootElement);
    expect(mockRender).toHaveBeenCalled();
  });

  it('blurs number inputs on wheel event', async () => {
    await import('./main.jsx');

    const input = document.createElement('input');
    input.type = 'number';
    document.body.appendChild(input);
    input.focus();

    expect(document.activeElement).toBe(input);

    const wheelEvent = new Event('wheel');
    document.dispatchEvent(wheelEvent);

    expect(document.activeElement).not.toBe(input);
    
    // Also test non-number input
    const textInput = document.createElement('input');
    textInput.type = 'text';
    document.body.appendChild(textInput);
    textInput.focus();
    
    document.dispatchEvent(wheelEvent);
    expect(document.activeElement).toBe(textInput); // still focused
  });
});
