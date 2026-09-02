import { Resend } from 'resend';

// The user requested we use their provided API key which they added to Vercel, 
// but we will default to it if not in env just to be safe during dev.
const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = new Resend(resendApiKey);

// According to their screenshot, the domain is liquidchat.online
const FROM_EMAIL = 'support@liquidchat.online';

export const sendOtpEmail = async (email: string, code: string, type: string) => {
  let subject = '';
  let html = '';

  if (type === 'login') {
    subject = 'Your LiquidChat Login OTP';
    html = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0ea5e9;">Login to LiquidChat</h2>
        <p>Your one-time password (OTP) is:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #64748b;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;
  } else if (type === 'signup') {
    subject = 'Verify your LiquidChat Account';
    html = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0ea5e9;">Welcome to LiquidChat!</h2>
        <p>Please verify your email address with the following code:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #64748b;">This code will expire in 10 minutes. If you did not sign up for LiquidChat, please ignore this email.</p>
      </div>
    `;
  } else if (type === 'reset_password') {
    subject = 'LiquidChat Password Reset';
    html = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0ea5e9;">Reset Your Password</h2>
        <p>Use the following OTP to reset your LiquidChat password:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #64748b;">This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
      </div>
    `;
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });
    console.log('OTP Email sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

export const sendActivityNotification = async (email: string, activityType: string, ip: string, device: string = 'Unknown Device') => {
  const date = new Date().toLocaleString();
  
  let subject = '';
  let message = '';
  
  if (activityType === 'login') {
    subject = 'New Login to LiquidChat';
    message = 'We noticed a new login to your LiquidChat account.';
  } else if (activityType === 'password_reset_success') {
    subject = 'Your LiquidChat Password was Changed';
    message = 'Your password was successfully changed.';
  }

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0ea5e9;">Security Alert</h2>
      <p>${message}</p>
      <ul style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; list-style: none;">
        <li><strong>Time:</strong> ${date}</li>
        <li><strong>IP Address:</strong> ${ip}</li>
        <li><strong>Device info:</strong> ${device}</li>
      </ul>
      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">If this was you, you can safely ignore this email. If this wasn't you, please secure your account immediately.</p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });
    console.log('Activity email sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending activity email:', error);
  }
};
