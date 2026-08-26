import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

import path from 'path';

export async function sendOtpEmail(to: string, otp: string, purpose: 'verification' | 'reset'): Promise<void> {
  const subject = purpose === 'verification'
    ? 'Zansphere Career Portal - Verify Your Email'
    : 'Zansphere Career Portal - Password Reset OTP';

  const html = `
    <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
      <div style="background: #ffffff; padding: 32px 40px; text-align: center;">
        <img src="cid:zansphere-logo" alt="Zansphere Logo" style="height: 100px; margin-bottom: 12px; background-color: #000000; border-radius: 8px; padding: 8px;" />
        <p style="color: rgba(0,0,0,0.5); margin: 0; font-size: 12px; letter-spacing: 2px;">CAREER PORTAL</p>
      </div>
      <div style="padding: 40px;">
        <h2 style="color: #111; margin: 0 0 8px; font-size: 20px; font-weight: 600;">
          ${purpose === 'verification' ? 'Verify Your Email' : 'Reset Your Password'}
        </h2>
        <p style="color: #555; margin: 0 0 28px; font-size: 14px; line-height: 1.6;">
          ${purpose === 'verification'
      ? 'Use the OTP below to complete your registration. This code is valid for <strong>10 minutes</strong>.'
      : 'Use the OTP below to reset your password. This code is valid for <strong>10 minutes</strong>.'}
        </p>
        <div style="background: #f5f5f5; border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 28px;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #000;">${otp}</span>
        </div>
        <p style="color: #999; margin: 0; font-size: 12px; line-height: 1.5;">
          If you did not request this, please ignore this email.<br/>
          Do not share this OTP with anyone.
        </p>
      </div>
      <div style="background: #fafafa; padding: 16px 40px; text-align: center; border-top: 1px solid #eee;">
        <p style="color: #bbb; margin: 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Zansphere | AI & Software Services</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Zansphere Careers" <careers@zansphere.com>',
      to,
      subject,
      html,
      attachments: [{
        filename: 'Zansphere-Company-Logo.png',
        path: path.join(__dirname, 'Zansphere-Company-Logo.png'),
        cid: 'zansphere-logo'
      }]
    });
    console.log(`[EMAIL] OTP email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    // Fallback: log OTP to console for development
    console.log(`[EMAIL] [DEV FALLBACK] OTP for ${to}: ${otp}`);
  }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
