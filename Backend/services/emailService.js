import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;
let isInitializing = false;

// Initialize transporter asynchronously (useful for Ethereal test accounts)
const getTransporter = async () => {
  if (transporter) return transporter;
  if (!env.smtpHost) return null;

  // If using Ethereal without credentials, generate a test account
  if (env.smtpHost === 'smtp.ethereal.email' && !env.smtpUser) {
    if (!isInitializing) {
      isInitializing = true;
      try {
        console.log('[EmailService] Generating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log('[EmailService] Ethereal test account generated successfully.');
      } catch (err) {
        console.error('[EmailService] Failed to generate test account:', err);
      } finally {
        isInitializing = false;
      }
    }
    
    // Wait for initialization to complete if called concurrently
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return transporter;
  }

  // Use provided credentials
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser ? {
        user: env.smtpUser,
        pass: env.smtpPassword,
      } : undefined,
    });
  }
  
  return transporter;
};

/**
 * Sends a verification email to the user.
 * @param {Object} options
 * @param {String} options.email - User's email
 * @param {String} options.name - User's name
 * @param {String} options.verificationUrl - Full URL to verify email
 */
export const sendVerificationEmail = async ({ email, name, verificationUrl }) => {
  const activeTransporter = await getTransporter();

  if (!activeTransporter) {
    console.warn('[EmailService] SMTP not configured. Skipping email send.');
    console.warn(`[EmailService] Verification URL for ${email}: ${verificationUrl}`);
    return;
  }

  const subject = 'Verify your TypeMind AI account';
  
  const text = `Hello ${name},

Welcome to TypeMind AI.

You're one step away from starting your personalized typing journey.

Please verify your email address to activate your account by visiting the following link:
${verificationUrl}

This verification link expires in ${env.emailVerificationExpiresMinutes} minutes.

If you didn't create a TypeMind AI account, you can safely ignore this email.

— The TypeMind AI Team`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; background-color: #0B1120; color: #F8FAFC;">
      <div style="padding: 40px; text-align: center; border-bottom: 1px solid #1E293B;">
        <h1 style="margin: 0; font-size: 24px; color: #F8FAFC; letter-spacing: -0.02em;">✦ TypeMind AI</h1>
      </div>
      <div style="padding: 40px;">
        <h2 style="margin-top: 0; font-size: 20px; font-weight: 600; color: #F8FAFC;">Verify your email</h2>
        <p style="color: #94A3B8; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
          Hello ${name},<br><br>
          Welcome to your AI typing coach. You're one step away from starting your personalized typing journey.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366F1; color: #FFFFFF; font-weight: 500; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Verify My Email
          </a>
        </div>
        
        <p style="color: #64748B; font-size: 14px; text-align: center;">
          This link expires in ${env.emailVerificationExpiresMinutes} minutes.
        </p>
        <p style="color: #64748B; font-size: 14px; text-align: center; margin-top: 24px;">
          If you didn't create a TypeMind AI account, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await activeTransporter.sendMail({
      from: `"TypeMind AI" <${env.emailFrom}>`,
      to: email,
      subject,
      text,
      html,
    });
    
    console.log(`[EmailService] Verification email sent to ${email}. Message ID: ${info.messageId}`);
    
    // Log the Ethereal email preview link if available (for local development)
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] Preview URL: ${previewUrl}`);
    }
  } catch (error) {
    console.error(`[EmailService] Failed to send verification email to ${email}:`, error);
    throw error;
  }
};
