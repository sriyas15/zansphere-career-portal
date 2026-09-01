import { sendOtpEmail, generateOtp } from './email';
import nodemailer from 'nodemailer';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: (...args: any[]) => mockSendMail(...args),
  }),
}));

describe('Email Utils', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
    mockSendMail.mockClear();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP string', () => {
      const otp = generateOtp();
      expect(typeof otp).toBe('string');
      expect(otp).toHaveLength(6);
      expect(Number.isNaN(Number(otp))).toBe(false);
    });
  });

  describe('sendOtpEmail', () => {
    it('should send verification email successfully', async () => {
      mockSendMail.mockResolvedValueOnce(true);
      
      await sendOtpEmail('test@example.com', '123456', 'verification');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Zansphere Career Portal - Verify Your Email',
          html: expect.stringContaining('123456')
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('[EMAIL] OTP email sent to test@example.com');
    });

    it('should send reset email successfully', async () => {
      mockSendMail.mockResolvedValueOnce(true);
      
      await sendOtpEmail('test@example.com', '654321', 'reset');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Zansphere Career Portal - Password Reset OTP',
          html: expect.stringContaining('654321')
        })
      );
    });

    it('should handle email sending failure and log fallback', async () => {
      const error = new Error('SMTP Error');
      mockSendMail.mockRejectedValueOnce(error);
      
      await sendOtpEmail('test@example.com', '111222', 'verification');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send OTP email:', error);
      expect(consoleLogSpy).toHaveBeenCalledWith('[EMAIL] [DEV FALLBACK] OTP for test@example.com: 111222');
    });
  });
});

