import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { sendEmail } from '../services/emailService';

const router = express.Router();

// Helper: Generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send Verification Code
router.post('/send-code', async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'REGISTER' | 'RESET_PASSWORD'
    
    if (!email || !type) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    // Check logic based on type
    if (type === 'REGISTER') {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(400).json({ message: '该邮箱已被注册' });
    } else if (type === 'RESET_PASSWORD') {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) return res.status(400).json({ message: '该邮箱未注册' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save code to DB
    await prisma.verificationCode.create({
      data: { email, code, type, expiresAt }
    });

    // Send Email
    const subject = type === 'REGISTER' ? '注册验证码' : '重置密码验证码';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; text-align: center; }
          .code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; margin: 20px 0; background: #f0f9f0; padding: 15px; border-radius: 5px; display: inline-block; }
          .footer { background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div style="background-color: #f6f6f6; padding: 20px;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div class="header" style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
              <h2 style="margin:0;">${subject}</h2>
            </div>
            <div class="content" style="padding: 30px 20px; text-align: center;">
              <p style="font-size: 16px; color: #333;">您的验证码是：</p>
              <div class="code" style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; margin: 20px 0; background: #f0f9f0; padding: 15px; border-radius: 5px; display: inline-block;">${code}</div>
              <p style="font-size: 14px; color: #666;">验证码 10 分钟内有效，请勿泄露给他人。</p>
            </div>
            <div class="footer" style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888;">
              <p style="margin:0;">此邮件由系统自动发送，请勿回复</p>
              <p style="margin:5px 0 0;">© FreshTracker 食品保质期计算器</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail(email, `【FreshTracker】${subject}`, html);

    res.json({ message: '验证码已发送' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ message: '发送验证码失败' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: '请输入验证码' });
    }

    // Verify Code
    const validCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'REGISTER',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!validCode) {
      return res.status(400).json({ message: '验证码错误或已过期' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword }
    });

    // Mark code as used (optional: delete it)
    // await prisma.verificationCode.delete({ where: { id: validCode.id } });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret_key');
    res.json({ 
      user: { 
        id: user.id.toString(), 
        username: user.username, 
        email: user.email, 
        role: user.role 
      }, 
      token 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret_key');
    res.json({ 
      user: { 
        id: user.id.toString(),
        username: user.username, 
        email: user.email,
        avatar: user.avatar,
        qqEmail: user.qqEmail,
        enableEmailNotify: user.enableEmailNotify,
        registerDate: user.registerDate,
        role: user.role 
      }, 
      token 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password, code } = req.body;

    if (!code || !password) {
      return res.status(400).json({ message: '缺少参数' });
    }

    // Verify Code
    const validCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'RESET_PASSWORD',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!validCode) {
      return res.status(400).json({ message: '验证码错误或已过期' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: '密码重置成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

export default router;
