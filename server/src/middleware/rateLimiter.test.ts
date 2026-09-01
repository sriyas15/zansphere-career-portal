import express from 'express';
import request from 'supertest';
import { authLimiter, otpLimiter, uploadLimiter } from './rateLimiter';

describe('Rate Limiters', () => {
  it('should be exported functions (middleware)', () => {
    expect(typeof authLimiter).toBe('function');
    expect(typeof otpLimiter).toBe('function');
    expect(typeof uploadLimiter).toBe('function');
  });

  describe('authLimiter Integration', () => {
    const app = express();
    app.use('/auth', authLimiter);
    app.get('/auth', (req, res) => { res.send('ok'); });

    it('should limit after max requests', async () => {
      // Send 10 successful requests
      for (let i = 0; i < 10; i++) {
        await request(app).get('/auth').expect(200);
      }
      // 11th request should be blocked
      const res = await request(app).get('/auth');
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Too many attempts. Please try again after 15 minutes.');
    });
  });

  describe('otpLimiter Integration', () => {
    const app = express();
    app.use('/otp', otpLimiter);
    app.get('/otp', (req, res) => { res.send('ok'); });

    it('should limit after max requests', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).get('/otp').expect(200);
      }
      const res = await request(app).get('/otp');
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Too many OTP requests. Please wait before requesting again.');
    });
  });

  describe('uploadLimiter Integration', () => {
    const app = express();
    app.use('/upload', uploadLimiter);
    app.get('/upload', (req, res) => { res.send('ok'); });

    it('should limit after max requests', async () => {
      for (let i = 0; i < 20; i++) {
        await request(app).get('/upload').expect(200);
      }
      const res = await request(app).get('/upload');
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Too many upload attempts. Please try again later.');
    });
  });
});
