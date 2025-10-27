const Brevo = require('@getbrevo/brevo');

// ✅ Initialize Brevo API client properly for all SDK versions
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

/**
 * Sends a styled HTML email using Brevo API (Render & Vercel compatible)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Main message content (e.g., OTP, greeting, etc.)
 * @param {string} [ctaText] - Optional call-to-action button text
 * @param {string} [ctaLink] - Optional call-to-action link
 */
const sendMail = async (to, subject, message, ctaText = null, ctaLink = null) => {
  const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 30px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f4c430, #daa520); color: white; text-align: center; padding: 20px 10px;">
        <h1 style="margin: 0; font-size: 22px;">Golden Swift Bank</h1>
        <p style="margin: 5px 0 0;">Your All-in-One Wallet</p>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 15px; color: #333; line-height: 1.6;">
          ${message}
        </p>

        ${
          ctaText && ctaLink
            ? `<div style="text-align: center; margin: 30px 0;">
                <a href="${ctaLink}" style="background: #f4c430; color: #000; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  ${ctaText}
                </a>
              </div>`
            : ''
        }

        <p style="font-size: 13px; color: #888; margin-top: 20px;">
          If you did not request this, please ignore this email.
        </p>
      </div>
      <div style="background: #f9fafb; text-align: center; padding: 10px; font-size: 12px; color: #666;">
        &copy; ${new Date().getFullYear()} Golden Swift Bank. All rights reserved.
      </div>
    </div>
  </div>
  `;

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.sender = { email: process.env.SENDER_EMAIL, name: "Golden Swift Bank" };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlTemplate;

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to ${to}:`, response?.messageId || 'OK');
  } catch (error) {
    console.error('❌ Brevo sendMail error:', error.response?.body || error.message);
    throw new Error('Failed to send email');
  }
};

module.exports = sendMail;
