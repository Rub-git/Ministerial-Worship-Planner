/**
 * Forgot Password API - Sends reset link via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetUrl: string
): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://ministerialworshipplanner.com';
    const logoUrl = `${baseUrl}/assets/mwp-icon.svg`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
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
                  </td>
                </tr>
                
                <!-- Message -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Hola <strong>${userName}</strong>,
                    </p>
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña.
                    </p>
                    <p style="margin: 0 0 20px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                      We received a request to reset your password. Click the button below to create a new password.
                    </p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 10px 40px 30px 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="background-color: #C9A227; border-radius: 8px;">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">
                            Restablecer Contraseña / Reset Password
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
                      Este enlace expira en <strong>1 hora</strong>. / This link expires in <strong>1 hour</strong>.
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
                            ¿Problemas con el botón? / Having trouble?
                          </p>
                          <p style="margin: 0; color: #92400E; font-size: 12px; word-break: break-all; line-height: 1.5;">
                            Copia y pega este enlace en tu navegador:<br>
                            <span style="color: #B45309;">${resetUrl}</span>
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
                      Si no solicitaste este cambio, ignora este mensaje.
                    </p>
                    <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
                      &copy; ${new Date().getFullYear()} Ministerial Worship Planner
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
        notification_id: process.env.NOTIF_ID_PASSWORD_RESET,
        subject: 'Restablecer Contraseña / Reset Password – MWP',
        body: htmlBody,
        is_html: true,
        recipient_email: email,
        sender_email: `noreply@${senderDomain}`,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      console.error('[EMAIL] Failed to send password reset email:', result);
      return false;
    }

    console.log(`[EMAIL] Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending password reset email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[PASSWORD_RESET] No user found for email: ${normalizedEmail}`);
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists, a reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send email
    const baseUrl = process.env.NEXTAUTH_URL || 'https://ministerialworshipplanner.com';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const emailSent = await sendPasswordResetEmail(
      normalizedEmail,
      user.name || 'Usuario',
      resetUrl
    );

    if (!emailSent) {
      console.error(`[PASSWORD_RESET] Failed to send email to ${normalizedEmail}`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'If an account exists, a reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
