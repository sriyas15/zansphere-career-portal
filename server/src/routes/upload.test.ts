import express from 'express';
import request from 'supertest';
import uploadRouter, { s3Client } from './upload.routes';
import { PutObjectCommand } from '@aws-sdk/client-s3';

jest.mock('../middleware/auth.middleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => next(),
}));

jest.mock('../middleware/rateLimiter', () => ({
  uploadLimiter: (req: any, res: any, next: any) => next(),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/upload', uploadRouter);

describe('Upload Routes', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, AWS_S3_BUCKET: 'test-bucket', AWS_REGION: 'us-east-1' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should fail if no file uploaded', async () => {
    const res = await request(app).post('/upload/resume');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No file uploaded.');
  });

  it('should fail if file is not pdf', async () => {
    const res = await request(app)
      .post('/upload/resume')
      .attach('resume', Buffer.from('test text'), 'test.txt');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Only PDF files are allowed.');
  });

  it('should upload successfully', async () => {
    const res = await request(app)
      .post('/upload/resume')
      .attach('resume', Buffer.from('dummy pdf content'), 'test.pdf');
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Resume uploaded successfully to S3!');
    expect(res.body.fileUrl).toContain('https://test-bucket.s3.us-east-1.amazonaws.com/resumes/resume-');
    expect(s3Client.send).toHaveBeenCalled();
    expect(PutObjectCommand).toHaveBeenCalled();
  });

  it('should fail if bucket is missing', async () => {
    delete process.env.AWS_S3_BUCKET;
    const res = await request(app)
      .post('/upload/resume')
      .attach('resume', Buffer.from('dummy pdf content'), 'test.pdf');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to upload file.');
  });

  it('should fail if file size exceeds 5MB', async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const res = await request(app)
      .post('/upload/resume')
      .attach('resume', largeBuffer, 'large.pdf');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('File size must be under 5MB.');
  });

  it('should fail on generic multer error (e.g. wrong field name)', async () => {
    const res = await request(app)
      .post('/upload/resume')
      .attach('wrong_field', Buffer.from('test'), 'test.pdf');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Unexpected field');
  });
});
