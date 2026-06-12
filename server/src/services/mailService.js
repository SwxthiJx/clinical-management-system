import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

function createTransport() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });
}

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

export async function sendMail({ to, subject, text }) {
  const transport = createTransport();

  if (!transport) {
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Development email generated', { to, subject, text });
      return { delivered: true, mode: 'development' };
    }
    logger.warn('Email delivery skipped because SMTP is not configured', { to, subject });
    return { delivered: false, mode: 'unconfigured' };
  }

  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || 'Aarogya Care Hospital <no-reply@clinic.local>',
    to,
    subject,
    text
  });
  return { delivered: true, mode: 'smtp', messageId: info.messageId };
}

export async function sendVerificationEmail(user, token) {
  const url = `${process.env.APP_BASE_URL || process.env.CLIENT_URL}/login?verifyToken=${encodeURIComponent(token)}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your Aarogya Care Hospital account',
    text: `Welcome, ${user.name}. Verify your account using this link: ${url}`
  });
}

export async function sendPasswordResetEmail(user, token) {
  const url = `${process.env.APP_BASE_URL || process.env.CLIENT_URL}/login?resetToken=${encodeURIComponent(token)}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your Aarogya Care Hospital password',
    text: `Reset your password using this link: ${url}. This link expires in 30 minutes.`
  });
}
