import express from 'express';
import request from 'supertest';
import authRouter from './auth.routes';
import prisma from '../config/db';
import bcrypt from 'bcryptjs';
import * as emailUtils from '../utils/email';
import { s3Client } from './upload.routes';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

jest.mock('../config/db', () => ({
  portalUser: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  portalProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  otp: {
    updateMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
  $executeRawUnsafe: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_value'),
  compare: jest.fn(),
}));

jest.mock('../utils/email', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(true),
  generateOtp: jest.fn().mockReturnValue('123456'),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
}));

jest.mock('../middleware/auth.middleware', () => {
  const original = jest.requireActual('../middleware/auth.middleware');
  return {
    ...original,
    authMiddleware: (req: any, res: any, next: any) => {
      req.userId = 'user-123';
      next();
    },
    generateToken: jest.fn().mockReturnValue('fake_token'),
  };
});

jest.mock('../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  otpLimiter: (req: any, res: any, next: any) => next(),
  uploadLimiter: (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AWS_S3_BUCKET = 'test-bucket';
  });

  describe('POST /register', () => {
    it('should return 400 on validation fail', async () => {
      const res = await request(app).post('/auth/register').send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 if no resume uploaded', async () => {
      const res = await request(app).post('/auth/register').send({
        firstName: 'John', lastName: 'Doe', email: 'john@example.com',
        password: 'Password123!', phone: '1234567890'
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Resume (PDF) is required.');
    });

    it('should return 409 if user exists and is not pending', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: 'VERIFIED' });
      const res = await request(app)
        .post('/auth/register')
        .field('firstName', 'John')
        .field('lastName', 'Doe')
        .field('email', 'john@example.com')
        .field('password', 'Password123!')
        .field('phone', '1234567890')
        .attach('resume', Buffer.from('pdf'), 'resume.pdf');
      
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('An account with this email already exists.');
    });

    it('should resend OTP if user exists and is pending', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: 'PENDING' });
      const res = await request(app)
        .post('/auth/register')
        .field('firstName', 'John')
        .field('lastName', 'Doe')
        .field('email', 'john@example.com')
        .field('password', 'Password123!')
        .field('phone', '1234567890')
        .attach('resume', Buffer.from('pdf'), 'resume.pdf');
      
      expect(res.status).toBe(200);
      expect(emailUtils.sendOtpEmail).toHaveBeenCalled();
    });

    it('should register new user successfully', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.portalUser.create as jest.Mock).mockResolvedValue({ id: 'new-user', email: 'john@example.com' });
      
      const res = await request(app)
        .post('/auth/register')
        .field('firstName', 'John')
        .field('lastName', 'Doe')
        .field('email', 'john@example.com')
        .field('password', 'Password123!')
        .field('phone', '1234567890')
        .attach('resume', Buffer.from('pdf'), 'resume.pdf');
      
      expect(res.status).toBe(201);
      expect(prisma.portalUser.create).toHaveBeenCalled();
      expect(prisma.portalProfile.create).toHaveBeenCalled();
      expect(emailUtils.sendOtpEmail).toHaveBeenCalled();
    });

    it('should return 500 if S3 fails', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue(null);
      delete process.env.AWS_S3_BUCKET;
      
      const res = await request(app)
        .post('/auth/register')
        .field('firstName', 'John')
        .field('lastName', 'Doe')
        .field('email', 'john@example.com')
        .field('password', 'Password123!')
        .field('phone', '1234567890')
        .attach('resume', Buffer.from('pdf'), 'resume.pdf');
      
      expect(res.status).toBe(500);
    });
  });

  describe('POST /verify-otp', () => {
    it('should return 400 on validation fail', async () => {
      const res = await request(app).post('/auth/verify-otp').send({});
      expect(res.status).toBe(400);
    });

    it('should return 404 if user not found', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post('/auth/verify-otp').send({ email: 'test@example.com', otp: '123456', purpose: 'EMAIL_VERIFICATION' });
      expect(res.status).toBe(404);
    });

    it('should return 400 if otp expired/invalid', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post('/auth/verify-otp').send({ email: 'test@example.com', otp: '123456', purpose: 'EMAIL_VERIFICATION' });
      expect(res.status).toBe(400);
    });

    it('should return 400 if wrong otp', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue({ id: 'otp1', code: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const res = await request(app).post('/auth/verify-otp').send({ email: 'test@example.com', otp: '123456', purpose: 'EMAIL_VERIFICATION' });
      expect(res.status).toBe(400);
    });

    it('should verify email and return token', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue({ id: 'otp1', code: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.portalProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'prof1', fullName: 'Test', email: 't@t.com', phone: '123' });
      
      const res = await request(app).post('/auth/verify-otp').send({ email: 'test@example.com', otp: '123456', purpose: 'EMAIL_VERIFICATION' });
      
      expect(res.status).toBe(200);
      expect(res.body.token).toBe('fake_token');
      expect(prisma.portalUser.update).toHaveBeenCalled();
    });

    it('should verify OTP for PASSWORD_RESET and return temporary token', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue({ id: 'otp1', code: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const res = await request(app).post('/auth/verify-otp').send({ email: 'test@example.com', otp: '123456', purpose: 'PASSWORD_RESET' });
      
      expect(res.status).toBe(200);
      expect(res.body.resetAllowed).toBe(true);
      expect(prisma.otp.update).toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      const res = await request(app).post('/auth/verify-otp').send({ email: 'test@example.com', otp: '123456', purpose: 'EMAIL_VERIFICATION' });
      expect(res.status).toBe(500);
    });
  });

  describe('POST /login', () => {
    it('should return 400 on validation fail', async () => {
      const res = await request(app).post('/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('should return 401 on invalid user', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'Password123!' });
      expect(res.status).toBe(401);
    });

    it('should return 423 if locked', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ lockedUntil: new Date(Date.now() + 10000) });
      const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'Password123!' });
      expect(res.status).toBe(423);
    });

    it('should return 403 if pending', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ status: 'PENDING' });
      const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'Password123!' });
      expect(res.status).toBe(403);
    });

    it('should return 403 if suspended', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ status: 'SUSPENDED' });
      const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'Password123!' });
      expect(res.status).toBe(403);
    });

    it('should return 401 and increment attempts on wrong password', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: 'VERIFIED', failedLoginAttempts: 0, passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'Password123!' });
      expect(res.status).toBe(401);
      expect(prisma.portalUser.update).toHaveBeenCalledWith(expect.objectContaining({ data: { failedLoginAttempts: 1 } }));
    });

    it('should lock account after 5 failed attempts', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: 'VERIFIED', failedLoginAttempts: 4, passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'Password123!' });
      expect(res.status).toBe(423);
      expect(prisma.portalUser.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ failedLoginAttempts: 0, lockedUntil: expect.any(Date) })
      }));
    });

    it('should login successfully', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: 'VERIFIED', email: 'test@example.com', passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBe('fake_token');
    });

    it('should handle 500 error', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockRejectedValue(new Error('err'));
      const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'Password123!' });
      expect(res.status).toBe(500);
    });
  });

  describe('POST /forgot-password', () => {
    it('should return 400 on validation fail', async () => {
      const res = await request(app).post('/auth/forgot-password').send({});
      expect(res.status).toBe(400);
    });

    it('should not reveal if email exists but returns success message', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post('/auth/forgot-password').send({ email: 'test@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If an account exists');
    });

    it('should send reset OTP successfully', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      const res = await request(app).post('/auth/forgot-password').send({ email: 'test@example.com' });
      expect(res.status).toBe(200);
      expect(emailUtils.sendOtpEmail).toHaveBeenCalled();
    });

    it('should handle 500 error', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockRejectedValue(new Error('err'));
      const res = await request(app).post('/auth/forgot-password').send({ email: 'test@example.com' });
      expect(res.status).toBe(500);
    });
  });

  describe('POST /reset-password', () => {
    it('should return 400 on validation fail', async () => {
      const res = await request(app).post('/auth/reset-password').send({});
      expect(res.status).toBe(400);
    });

    it('should return 404 if user not found', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post('/auth/reset-password').send({ email: 'test@example.com', otp: '123456', newPassword: 'Password123!' });
      expect(res.status).toBe(404);
    });

    it('should return 400 if otp expired/invalid', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post('/auth/reset-password').send({ email: 'test@example.com', otp: '123456', newPassword: 'Password123!' });
      expect(res.status).toBe(400);
    });

    it('should return 400 if wrong otp', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue({ id: 'otp1', code: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const res = await request(app).post('/auth/reset-password').send({ email: 'test@example.com', otp: '123456', newPassword: 'Password123!' });
      expect(res.status).toBe(400);
    });

    it('should reset password successfully', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue({ id: 'otp1', code: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const res = await request(app).post('/auth/reset-password').send({ email: 'test@example.com', otp: '123456', newPassword: 'Password123!' });
      
      expect(res.status).toBe(200);
      expect(prisma.portalUser.update).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockRejectedValue(new Error('err'));
      const res = await request(app).post('/auth/reset-password').send({ email: 'test@example.com', otp: '123456', newPassword: 'Password123!' });
      expect(res.status).toBe(500);
    });
  });

  describe('POST /resend-otp', () => {
    it('should return 400 if missing data', async () => {
      const res = await request(app).post('/auth/resend-otp').send({});
      expect(res.status).toBe(400);
    });

    it('should not reveal if user does not exist', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post('/auth/resend-otp').send({ email: 'test@example.com', purpose: 'EMAIL_VERIFICATION' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If an account exists');
    });

    it('should resend otp successfully', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      const res = await request(app).post('/auth/resend-otp').send({ email: 'test@example.com', purpose: 'EMAIL_VERIFICATION' });
      expect(res.status).toBe(200);
      expect(emailUtils.sendOtpEmail).toHaveBeenCalled();
    });

    it('should resend otp successfully for password reset', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      const res = await request(app).post('/auth/resend-otp').send({ email: 'test@example.com', purpose: 'PASSWORD_RESET' });
      expect(res.status).toBe(200);
      expect(emailUtils.sendOtpEmail).toHaveBeenCalled();
    });

    it('should handle 500 error', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockRejectedValue(new Error('err'));
      const res = await request(app).post('/auth/resend-otp').send({ email: 'test@example.com', purpose: 'EMAIL_VERIFICATION' });
      expect(res.status).toBe(500);
    });
  });
  
  describe('GET /me', () => {
    it('should return user profile', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(200);
    });

    it('should return 404 if deleted', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockResolvedValue(null);
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(404);
    });

    it('should return 500 on db error', async () => {
      (prisma.portalUser.findUnique as jest.Mock).mockRejectedValue(new Error('err'));
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(500);
    });
  });
});
