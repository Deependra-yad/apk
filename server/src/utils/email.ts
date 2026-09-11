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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 20px; background-color: #0b0914; color: #fbfaff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ff7597; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">🌸 LiquidChat</h2>
        <p style="color: #b388ff; font-size: 13px; margin-top: 4px; font-weight: 500;">End-to-End Encrypted • 暗号化 Protected</p>
      </div>
      <div style="background-color: #181329; padding: 22px; border-radius: 16px; border: 1px solid rgba(255, 117, 151, 0.25); margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <h3 style="color: #fbfaff; margin-top: 0; font-size: 17px; font-weight: 700;">${subject}</h3>
        <p style="color: #e2d9f3; font-size: 14px; line-height: 1.6;">${message}</p>
        <ul style="padding-left: 20px; color: #b388ff; font-size: 13px; line-height: 1.7;">
          <li><strong style="color: #fbfaff;">Time:</strong> ${date}</li>
          <li><strong style="color: #fbfaff;">Details:</strong> ${deviceOrDetails}</li>
        </ul>
      </div>
      <div style="text-align: center;">
        <a href="https://liquidchat.online" style="display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, #ff4b82, #a855f7); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 20px rgba(255, 75, 130, 0.4);">Open LiquidChat</a>
      </div>
      <p style="font-size: 11px; color: #7e7195; text-align: center; margin-top: 28px;">This is an automated security and activity alert from LiquidChat.online.</p>
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
