import express from 'express';
import request from 'supertest';
import jobRouter from './job.routes';
import prisma from '../config/db';

jest.mock('../config/db', () => ({
  $queryRawUnsafe: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/jobs', jobRouter);

describe('Job Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all jobs without filters', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([{ id: '1', title: 'Developer' }]);
      const res = await request(app).get('/jobs');
      
      expect(res.status).toBe(200);
      expect(res.body.jobs).toHaveLength(1);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining(`WHERE jo.status = 'OPEN' AND jo.title != 'General Applications'`));
    });

    it('should apply department filter', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);
      const res = await request(app).get('/jobs?department=Engineering');
      
      expect(res.status).toBe(200);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('d.name ILIKE $1'), '%Engineering%');
    });

    it('should apply search filter', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);
      const res = await request(app).get('/jobs?search=react');
      
      expect(res.status).toBe(200);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('(jo.title ILIKE $1 OR jo.description ILIKE $1)'), '%react%');
    });

    it('should handle 500 error', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockRejectedValue(new Error('err'));
      const res = await request(app).get('/jobs');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch job openings.');
    });
  });

  describe('GET /:id', () => {
    it('should return job if found', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([{ id: '1' }]);
      const res = await request(app).get('/jobs/1');
      expect(res.status).toBe(200);
      expect(res.body.job.id).toBe('1');
    });

    it('should return 404 if not found', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);
      const res = await request(app).get('/jobs/1');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Job opening not found.');
    });

    it('should return 500 on error', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockRejectedValue(new Error('err'));
      const res = await request(app).get('/jobs/1');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch job details.');
    });
  });

  describe('GET /departments/list', () => {
    it('should return departments', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([{ id: '1', name: 'Eng' }]);
      const res = await request(app).get('/jobs/departments/list');
      expect(res.status).toBe(200);
      expect(res.body.departments).toHaveLength(1);
    });

    it('should return 500 on error', async () => {
      (prisma.$queryRawUnsafe as jest.Mock).mockRejectedValue(new Error('err'));
      const res = await request(app).get('/jobs/departments/list');
      expect(res.status).toBe(500);
    });
  });
});
