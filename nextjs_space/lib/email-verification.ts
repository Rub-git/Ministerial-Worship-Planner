/**
 * =============================================================================
 * EMAIL VERIFICATION UTILITIES
 * Shared functions for email verification across the app
 * =============================================================================
 */

import crypto from 'crypto';

// Token expiration time (24 hours)
export const TOKEN_EXPIRATION_HOURS = 24;

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate token expiry date (24 hours from now)
 */
export function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + TOKEN_EXPIRATION_HOURS);
  return expiry;
}

/**
 * Send verification email to the user
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
  organizationName: string
): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    const logoUrl = `${baseUrl}/assets/mwp-icon.svg`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Church Account</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                
                <!-- Logo Header -->
                <tr>
                  <td align="center" style="padding: 40px 40px 20px 40px; border-bottom: 3px solid #1E3A8A;">
                    <img src="${logoUrl}" alt="Ministerial Worship Planner" width="80" height="80" style="display: block; margin-bottom: 16px;">
                    <h1 style="margin: 0; color: #1E3A8A; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                      Ministerial Worship Planner
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 14px; font-style: italic;">
                      Structured Worship. Biblical Depth.
                    </p>
                  </td>
                </tr>
                
                <!-- Welcome Message -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Dear <strong>${name}</strong>,
                    </p>
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Grace and peace to you! We are delighted to welcome ${organizationName ? `<strong>${organizationName}</strong>` : 'your church'} to the Ministerial Worship Planner family.
                    </p>
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      To complete your registration and activate your <strong>30-day free trial</strong>, please verify your email address by clicking the button below.
                    </p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 10px 40px 30px 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="background-color: #C9A227; border-radius: 8px;">
                          <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">
                            Verify My Church Account
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Expiration Notice -->
                <tr>
                  <td align="center" style="padding: 0 40px 30px 40px;">
                    <p style="margin: 0; color: #6B7280; font-size: 14px;">
                      This verification link will expire in <strong>24 hours</strong>.
                    </p>
                  </td>
                </tr>
                
                <!-- Fallback Link -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FEF9E7; border-radius: 8px; border-left: 4px solid #C9A227;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px 0; color: #92400E; font-size: 13px; font-weight: 600;">
                            Having trouble with the button?
                          </p>
                          <p style="margin: 0; color: #92400E; font-size: 12px; word-break: break-all; line-height: 1.5;">
                            Copy and paste this link into your browser:<br>
                            <span style="color: #B45309;">${verificationLink}</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #1E3A8A; border-radius: 0 0 16px 16px;">
                    <p style="margin: 0 0 8px 0; color: #E5E7EB; font-size: 14px; text-align: center; line-height: 1.5;">
                      If you did not create this account, please disregard this email.
                    </p>
                    <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
                      &copy; ${new Date().getFullYear()} Ministerial Worship Planner. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = 'Ministerial Worship Planner';
    const senderDomain = appUrl ? new URL(appUrl).hostname : 'mail.abacusai.app';

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: process.env.NOTIF_ID_EMAIL_VERIFICATION,
        subject: 'Verify Your Church Account – Welcome to Ministerial Worship Planner',
        body: htmlBody,
        is_html: true,
        recipient_email: email,
        sender_email: `noreply@${senderDomain}`,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      console.error('[EMAIL] Failed to send verification email:', result);
      return false;
    }

    console.log(`[EMAIL] Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending verification email:', error);
    return false;
  }
}
