import { jest } from '@jest/globals';
import api from './api';
import { navigation } from '../utils/navigation';

describe('API Service', () => {
  let redirectSpy;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    redirectSpy = jest.spyOn(navigation, 'redirectTo').mockImplementation(() => {});
  });

  afterEach(() => {
    redirectSpy.mockRestore();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header if token exists', () => {
      localStorage.setItem('career_portal_token', 'my-token');
      
      const config = { headers: {} };
      const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;
      const result = requestInterceptor(config);
      
      expect(result.headers.Authorization).toBe('Bearer my-token');
    });

    it('should not add Authorization header if token does not exist', () => {
      const config = { headers: {} };
      const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;
      const result = requestInterceptor(config);
      
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should return response on success', () => {
      const response = { data: 'ok' };
      const responseInterceptor = api.interceptors.response.handlers[0].fulfilled;
      const result = responseInterceptor(response);
      
      expect(result).toBe(response);
    });

    it('should handle 401 error and redirect if not on login/register', async () => {
      localStorage.setItem('career_portal_token', 'my-token');
      localStorage.setItem('career_portal_user', 'user');

      window.history.replaceState(null, '', '/dashboard');

      const error = { response: { status: 401 } };
      const responseInterceptor = api.interceptors.response.handlers[0].rejected;
      
      await expect(responseInterceptor(error)).rejects.toEqual(error);
      
      expect(localStorage.getItem('career_portal_token')).toBeNull();
      expect(localStorage.getItem('career_portal_user')).toBeNull();
      expect(navigation.redirectTo).toHaveBeenCalledWith('/login');
    });

    it('should handle 401 error but not redirect if on login page', async () => {
      window.history.replaceState(null, '', '/login');
      const error = { response: { status: 401 } };
      const responseInterceptor = api.interceptors.response.handlers[0].rejected;
      
      await expect(responseInterceptor(error)).rejects.toEqual(error);
      expect(navigation.redirectTo).not.toHaveBeenCalled();
    });
  });
});
