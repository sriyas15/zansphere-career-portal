import { Request, Response, NextFunction } from 'express';
import { authMiddleware, generateToken, AuthRequest } from './auth.middleware';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should return 401 if no auth header', () => {
      authMiddleware(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    });

    it('should return 401 if auth header does not start with Bearer', () => {
      req.headers = { authorization: 'Basic sometoken' };
      authMiddleware(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    });

    it('should return 401 if token is invalid', () => {
      req.headers = { authorization: 'Bearer invalidtoken' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token.' });
    });

    it('should call next and set req properties if token is valid', () => {
      req.headers = { authorization: 'Bearer validtoken' };
      const decodedPayload = { userId: '123', email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

      authMiddleware(req as AuthRequest, res as Response, next);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken', process.env.JWT_SECRET || 'fallback-secret');
      expect(req.userId).toBe('123');
      expect(req.userEmail).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate a signed token', () => {
      (jwt.sign as jest.Mock).mockReturnValue('signed_token');
      const token = generateToken('123', 'test@example.com');
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: '123', email: 'test@example.com' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: 604800 }
      );
      expect(token).toBe('signed_token');
    });
  });
});
