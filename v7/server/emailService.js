import nodemailer from 'nodemailer';
import { logInfo, logError } from './logger.js';

// Create transporter with Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: process.env.SMTP_PORT || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'admin@mslpakistan.org',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Send registration welcome email to member
 */
export async function sendRegistrationEmail(memberEmail, memberName) {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || 'admin@mslpakistan.org',
      to: memberEmail,
      subject: '👋 Welcome to MSL Pakistan - Registration Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to MSL Pakistan! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Dear <strong>${memberName}</strong>,
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Thank you for registering with <strong>MSL Pakistan</strong>. We're excited to have you join our community!
            </p>
            
            <div style="background-color: #f0f7ff; padding: 15px; border-left: 4px solid #0073e6; margin: 20px 0;">
              <p style="color: #0073e6; font-weight: bold; margin: 0;">📋 What's Next?</p>
              <ul style="color: #666; margin: 10px 0 0 20px;">
                <li>Your application is being reviewed</li>
                <li>We'll notify you once your membership is approved</li>
                <li>You'll receive instructions to download your membership card</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              If you have any questions, feel free to reach out to us at <strong>admin@mslpakistan.org</strong>.
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Best regards,<br>
              <strong>MSL Pakistan Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} MSL Pakistan. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to MSL Pakistan!

        Dear ${memberName},

        Thank you for registering with MSL Pakistan. We're excited to have you join our community!

        What's Next?
        - Your application is being reviewed
        - We'll notify you once your membership is approved
        - You'll receive instructions to download your membership card

        If you have any questions, feel free to reach out to us.

        Best regards,
        MSL Pakistan Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logInfo('📧 Registration email sent', { to: memberEmail, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logError('Failed to send registration email', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send approval email to member
 */
export async function sendApprovalEmail(memberEmail, memberName, membershipId) {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || 'admin@mslpakistan.org',
      to: memberEmail,
      subject: '✅ Your MSL Pakistan Membership is Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #28a745; margin-bottom: 20px;">✅ Congratulations!</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Dear <strong>${memberName}</strong>,
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              We're pleased to inform you that your membership with <strong>MSL Pakistan</strong> has been approved!
            </p>
            
            <div style="background-color: #f0fff4; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
              <p style="color: #28a745; font-weight: bold; margin: 0;">📋 Membership Details</p>
              <ul style="color: #666; margin: 10px 0 0 20px;">
                <li>Status: <strong>Approved</strong></li>
                <li>Membership ID: <strong>${membershipId}</strong></li>
                <li>Effective Date: <strong>${new Date().toLocaleDateString()}</strong></li>
              </ul>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="color: #ff9800; font-weight: bold; margin: 0;">📥 Download Your Card</p>
              <p style="color: #666; margin: 10px 0;">
                Visit our portal to download your exclusive MSL Pakistan membership card.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              If you have any questions, feel free to contact us at <strong>admin@mslpakistan.org</strong>.
            </p>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Best regards,<br>
              <strong>MSL Pakistan Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} MSL Pakistan. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        Congratulations!

        Dear ${memberName},

        We're pleased to inform you that your membership with MSL Pakistan has been approved!

        Membership Details:
        - Status: Approved
        - Membership ID: ${membershipId}
        - Effective Date: ${new Date().toLocaleDateString()}

        You can now download your exclusive MSL Pakistan membership card from our portal.

        If you have any questions, feel free to contact us.

        Best regards,
        MSL Pakistan Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logInfo('📧 Approval email sent', { to: memberEmail, membershipId, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logError('Failed to send approval email', error);
    return { success: false, error: error.message };
  }
}

export default {
  sendRegistrationEmail,
  sendApprovalEmail
};
