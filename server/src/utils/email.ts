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

export const sendActivityNotification = async (email: string, activityType: string, ipOrSender: string, deviceOrDetails: string = 'Unknown Device') => {
  if (!email || !email.includes('@')) return;
  const date = new Date().toLocaleString();
  
  let subject = 'LiquidChat Notification';
  let message = 'You have a new activity update on your LiquidChat account.';
  
  if (activityType === 'login') {
    subject = 'New Login to LiquidChat';
    message = 'We noticed a new login to your LiquidChat account.';
  } else if (activityType === 'password_reset_success') {
    subject = 'Your LiquidChat Password was Changed';
    message = 'Your password was successfully changed.';
  } else if (activityType === 'account_deleted') {
    subject = 'LiquidChat Account Deleted';
    message = 'Your LiquidChat account and all associated messages and data have been permanently deleted.';
  } else if (activityType === 'missed_call') {
    subject = `Missed Call from ${ipOrSender}`;
    message = `You missed a call from ${ipOrSender} on LiquidChat. Open the app to return the call.`;
  } else if (activityType === 'new_message') {
    subject = `New Encrypted Message from ${ipOrSender}`;
    message = `You received a new end-to-end encrypted message from ${ipOrSender} on LiquidChat.`;
  } else if (activityType === 'profile_updated') {
    subject = 'LiquidChat Profile Updated';
    message = 'Your profile details were recently updated.';
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #222e35; border-radius: 16px; background-color: #0b141a; color: #e9edef;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #00d2ff; margin: 0; font-size: 24px;">LiquidChat</h2>
        <p style="color: #8696a0; font-size: 13px; margin-top: 4px;">End-to-End Encrypted Communication</p>
      </div>
      <div style="background-color: #111b21; padding: 20px; border-radius: 12px; border: 1px solid #202c33; margin-bottom: 20px;">
        <h3 style="color: #e9edef; margin-top: 0; font-size: 16px;">${subject}</h3>
        <p style="color: #d1d7db; font-size: 14px; line-height: 1.5;">${message}</p>
        <ul style="padding-left: 20px; color: #8696a0; font-size: 13px; line-height: 1.6;">
          <li><strong>Time:</strong> ${date}</li>
          <li><strong>Details:</strong> ${deviceOrDetails}</li>
        </ul>
      </div>
      <div style="text-align: center;">
        <a href="https://liquidchat.online" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #00d2ff, #00f0ff); color: #0a0a0f; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px;">Open LiquidChat</a>
      </div>
      <p style="font-size: 11px; color: #667781; text-align: center; margin-top: 24px;">This is an automated security and activity alert from LiquidChat.online.</p>
    </div>
  `;

  try {
    if (!resendApiKey) {
      console.log(`[Email Simulation - ${subject}] To: ${email} | ${message}`);
      return;
    }
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
