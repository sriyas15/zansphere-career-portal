import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../services/api';

jest.mock('../services/api');

const TestComponent = () => {
  const { user, loading, login, logout, updateUser } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user">{user ? user.firstName : 'null'}</div>
      <button onClick={() => login('mock_token', { firstName: 'John' })}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateUser({ firstName: 'Jane' })}>Update</button>
    </div>
  );
};

const ThrowComponent = () => {
  useAuth();
  return <div />;
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with null user if no token in localStorage', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });

  it('should fetch user from API if token and user exist in localStorage', async () => {
    localStorage.setItem('career_portal_token', 'test_token');
    localStorage.setItem('career_portal_user', JSON.stringify({ firstName: 'OldName' }));

    api.get.mockResolvedValueOnce({ data: { user: { firstName: 'NewName' } } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('NewName');
    });
    
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(JSON.parse(localStorage.getItem('career_portal_user'))).toEqual({ firstName: 'NewName' });
  });

  it('should logout if API fails', async () => {
    localStorage.setItem('career_portal_token', 'test_token');
    localStorage.setItem('career_portal_user', JSON.stringify({ firstName: 'OldName' }));

    api.get.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    expect(localStorage.getItem('career_portal_token')).toBeNull();
  });

  it('should logout if localStorage JSON is invalid', async () => {
    localStorage.setItem('career_portal_token', 'test_token');
    localStorage.setItem('career_portal_user', 'invalid_json');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    expect(localStorage.getItem('career_portal_token')).toBeNull();
  });

  it('should handle login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    act(() => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('John');
    expect(localStorage.getItem('career_portal_token')).toBe('mock_token');
    expect(JSON.parse(localStorage.getItem('career_portal_user'))).toEqual({ firstName: 'John' });
  });

  it('should handle logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      screen.getByText('Login').click();
    });

    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(localStorage.getItem('career_portal_token')).toBeNull();
  });

  it('should handle updateUser', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      screen.getByText('Login').click();
    });

    act(() => {
      screen.getByText('Update').click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Jane');
    expect(JSON.parse(localStorage.getItem('career_portal_user'))).toEqual({ firstName: 'Jane' });
  });

  it('should throw error if useAuth is used outside AuthProvider', () => {
    // suppress console.error for the expected thrown error boundary crash
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<ThrowComponent />)).toThrow('useAuth must be used within AuthProvider');
    
    consoleError.mockRestore();
  });
});
