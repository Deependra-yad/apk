import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = new Resend(resendApiKey);

// Production sending domain
const FROM_EMAIL = 'support@liquidchat.online';
const LOGO_URL = 'https://liquidchat.online/logo.png';

const getEmailWrapper = (title: string, subtitle: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07050e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fbfaff;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07050e; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #0d0b1a; border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.7);">
          <!-- Top Gradient Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #ff4b82, #a855f7, #00f2fe);"></td>
          </tr>
          
          <!-- Logo & Brand Header -->
          <tr>
            <td align="center" style="padding: 32px 24px 20px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <img src="${LOGO_URL}" width="64" height="64" alt="LiquidChat Logo" style="display: block; border-radius: 16px; margin-bottom: 14px; box-shadow: 0 0 25px rgba(255, 75, 130, 0.4);" />
                    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                      Liquid<span style="color: #ff7597;">Chat</span>
                    </h1>
                    <p style="margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #a855f7; font-weight: 600;">
                      ${subtitle}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #141126; border: 1px solid rgba(255, 117, 151, 0.15); border-radius: 18px; padding: 24px; text-align: center;">
                ${bodyContent}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="margin: 16px 0 6px; font-size: 11px; color: #6e6485;">
                🌸 Zero-Knowledge Cryptographic Communication • Verified E2EE
              </p>
              <p style="margin: 0; font-size: 11px; color: #4e4663;">
                &copy; 2026 <a href="https://liquidchat.online" style="color: #a855f7; text-decoration: none;">LiquidChat.online</a>. All rights reserved.
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

export const sendOtpEmail = async (email: string, code: string, type: string) => {
  let subject = '';
  let title = '';
  let description = '';

  if (type === 'login') {
    subject = '🌸 Your LiquidChat Login OTP';
    title = 'Welcome Back!';
    description = 'Use the verification code below to authorize your login to LiquidChat.';
  } else if (type === 'signup') {
    subject = '🌸 Verify Your LiquidChat Account';
    title = 'Confirm Your Email';
    description = 'Use the verification code below to complete your registration on LiquidChat.';
  } else if (type === 'reset_password') {
    subject = '🌸 Reset Your LiquidChat Password';
    title = 'Reset Password Request';
    description = 'Use the verification code below to reset your password and restore access.';
  } else {
    subject = '🌸 Your LiquidChat Verification Code';
    title = 'Verification Code';
    description = 'Use the verification code below to proceed.';
  }

  const bodyContent = `
    <h2 style="margin: 0 0 10px; color: #fbfaff; font-size: 18px; font-weight: 700;">${title}</h2>
    <p style="margin: 0 0 22px; color: #a59cb8; font-size: 13px; line-height: 1.5;">${description}</p>
    
    <div style="background: linear-gradient(135deg, rgba(255,75,130,0.12), rgba(168,85,247,0.12)); border: 1px solid rgba(255,117,151,0.3); border-radius: 14px; padding: 18px; margin: 0 auto 20px; max-width: 280px;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ff7597; display: block; text-shadow: 0 0 15px rgba(255,117,151,0.5);">
        ${code}
      </span>
    </div>

    <p style="margin: 0; font-size: 12px; color: #786e8f;">
      ⏱️ This code will expire in <strong>10 minutes</strong>.<br>If you did not make this request, you can safely ignore this email.
    </p>
  `;

  const html = getEmailWrapper(subject, 'Zero-Knowledge E2EE Messenger', bodyContent);

  try {
    if (!resendApiKey) {
      console.log(`[Email Simulation - ${subject}] To: ${email} | Code: ${code}`);
      return { id: 'simulated-otp-id' };
    }

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });
    console.log('OTP Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

export const sendActivityNotification = async (email: string, activityType: string, ipOrSender: string, deviceOrDetails: string = 'Unknown Device') => {
  if (!email || !email.includes('@')) return;
  const date = new Date().toLocaleString();
  
  let subject = 'LiquidChat Security Notification';
  let title = 'Account Activity';
  let message = 'You have a new activity update on your LiquidChat account.';
  
  if (activityType === 'login') {
    subject = '🌸 New Login to LiquidChat';
    title = 'New Device Logged In';
    message = 'A new session was successfully started on your LiquidChat account.';
  } else if (activityType === 'password_reset_success') {
    subject = '🌸 Your LiquidChat Password was Changed';
    title = 'Password Updated';
    message = 'Your account password was successfully updated.';
  } else if (activityType === 'account_deleted') {
    subject = '🌸 LiquidChat Account Deleted';
    title = 'Account Wiped';
    message = 'Your LiquidChat account and all associated messages and data have been permanently wiped from the database.';
  } else if (activityType === 'missed_call') {
    subject = `🌸 Missed Call from ${ipOrSender}`;
    title = 'Missed HD Call';
    message = `You missed a call from ${ipOrSender} on LiquidChat.`;
  } else if (activityType === 'new_message') {
    subject = `🌸 New Encrypted Message from ${ipOrSender}`;
    title = 'New E2EE Message';
    message = `You received a new end-to-end encrypted message from ${ipOrSender} on LiquidChat.`;
  } else if (activityType === 'profile_updated') {
    subject = '🌸 LiquidChat Profile Updated';
    title = 'Profile Updated';
    message = 'Your LiquidChat profile details were recently updated.';
  }

  const bodyContent = `
    <h2 style="margin: 0 0 10px; color: #fbfaff; font-size: 18px; font-weight: 700;">${title}</h2>
    <p style="margin: 0 0 18px; color: #a59cb8; font-size: 13px; line-height: 1.5;">${message}</p>
    
    <div style="background-color: #0b0914; border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; padding: 14px 18px; text-align: left; margin-bottom: 22px;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #b388ff;">
        <strong style="color: #fbfaff;">Timestamp:</strong> ${date}
      </p>
      <p style="margin: 0; font-size: 12px; color: #b388ff;">
        <strong style="color: #fbfaff;">Details:</strong> ${deviceOrDetails}
      </p>
    </div>

    <div>
      <a href="https://liquidchat.online" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #ff4b82, #a855f7); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 13px; box-shadow: 0 4px 15px rgba(255, 75, 130, 0.4);">
        Open LiquidChat
      </a>
    </div>
  `;

  const html = getEmailWrapper(subject, 'Account Security Alert', bodyContent);

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
