import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendOtpEmail, sendActivityNotification } from '../utils/email';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'liquid_super_secret';

// Helper to generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP for Login, Signup, or Reset Password
router.post('/request-otp', async (req, res) => {
  const { email, type } = req.body;
  if (!email || !type) return res.status(400).json({ error: 'Email and type are required' });

  try {
    const user = await prisma.user.findFirst({ where: { email } });
    
    if (type === 'login' && !user) {
      return res.status(400).json({ error: 'No account found with this email. Please sign up.' });
    }
    
    if (type === 'signup' && user) {
      return res.status(400).json({ error: 'Email is already registered. Please login.' });
    }
    
    if (type === 'reset_password' && !user) {
      return res.status(400).json({ error: 'No account found with this email.' });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTPs for this email & type
    await prisma.otpCode.deleteMany({ where: { email, type } });

    await prisma.otpCode.create({
      data: { email, code, type, expiresAt }
    });

    await sendOtpEmail(email, code, type);
    res.json({ success: true, message: 'OTP sent to email.' });
  } catch (err) {
    console.error('Request OTP Error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, code, type, username, password } = req.body;
  
  if (!email || !code || !type) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const otp = await prisma.otpCode.findFirst({
      where: { email, code, type },
      orderBy: { createdAt: 'desc' }
    });

    if (!otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > otp.expiresAt) return res.status(400).json({ error: 'OTP has expired' });

    // Mark as used (delete)
    await prisma.otpCode.deleteMany({ where: { email, type } });

    if (type === 'signup') {
      if (!username || !password) return res.status(400).json({ error: 'Username and password required for signup' });
      
      const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
      if (existingUser) return res.status(400).json({ error: 'Username or email already taken' });

      const passwordHash = await bcrypt.hash(password, 10);
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
      
      const user = await prisma.user.create({
        data: { username, email, passwordHash, avatar }
      });
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      // Async notify
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
      sendActivityNotification(email, 'login', ip as string, req.headers['user-agent']);
      
      return res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
    }
    
    if (type === 'login') {
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
      sendActivityNotification(email, 'login', ip as string, req.headers['user-agent']);
      
      return res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
    }
    
    if (type === 'reset_password') {
      return res.json({ success: true, message: 'OTP verified, you can now reset your password', resetToken: jwt.sign({ resetEmail: email }, JWT_SECRET, { expiresIn: '15m' }) });
    }

  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Reset Password Form Submission
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const decoded: any = jwt.verify(resetToken, JWT_SECRET);
    if (!decoded.resetEmail) return res.status(400).json({ error: 'Invalid token' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.updateMany({
      where: { email: decoded.resetEmail },
      data: { passwordHash }
    });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    sendActivityNotification(decoded.resetEmail, 'password_reset_success', ip as string, req.headers['user-agent']);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
