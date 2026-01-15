/**
 * Email sending functionality using Resend
 */

import { Resend } from 'resend';
import { delay } from './utils.js';

let resendClient = null;

/**
 * Initialize Resend client
 */
function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set in .env');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Get email configuration from environment
 */
export function getEmailConfig() {
  return {
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    replyTo: process.env.EMAIL_REPLY_TO || null,
  };
}

/**
 * Send a single email with retry logic
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendEmail({ to, subject, html }, maxRetries = 3) {
  const resend = getResendClient();
  const config = getEmailConfig();

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await resend.emails.send({
        from: config.from,
        to: [to],
        replyTo: config.replyTo,
        subject,
        html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await delay(backoffMs);
      }
    }
  }

  return { success: false, error: lastError?.message || 'Unknown error' };
}

/**
 * Send emails to multiple recipients
 * @param {Array<{email: string, subject: string, html: string, metadata?: object}>} emails
 * @param {function} onProgress - Progress callback (current, total, result)
 * @returns {Promise<{sent: Array, failed: Array}>}
 */
export async function sendBatchEmails(emails, onProgress = null) {
  const sent = [];
  const failed = [];
  const total = emails.length;

  for (let i = 0; i < emails.length; i++) {
    const { email, subject, html, metadata = {} } = emails[i];
    const current = i + 1;

    const result = await sendEmail({ to: email, subject, html });

    if (result.success) {
      sent.push({
        email,
        emailId: result.id,
        sentAt: new Date().toISOString(),
        ...metadata,
      });

      if (onProgress) {
        onProgress(current, total, { success: true, email });
      }
    } else {
      failed.push({
        email,
        error: result.error,
        failedAt: new Date().toISOString(),
        ...metadata,
      });

      if (onProgress) {
        onProgress(current, total, { success: false, email, error: result.error });
      }
    }

    // Small delay between emails to avoid rate limiting
    if (i < emails.length - 1) {
      await delay(100);
    }
  }

  return { sent, failed };
}

/**
 * Validate email configuration
 */
export function validateEmailConfig() {
  const errors = [];

  if (!process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is not set');
  }

  if (!process.env.EMAIL_FROM) {
    errors.push('EMAIL_FROM is not set (will use default resend.dev domain)');
  }

  return errors;
}

export default { sendEmail, sendBatchEmails, getEmailConfig, validateEmailConfig };
