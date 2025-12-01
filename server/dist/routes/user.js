"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const nodemailer_1 = __importDefault(require("nodemailer"));
const router = express_1.default.Router();
// Update Profile
router.put('/profile', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, qqEmail, enableEmailNotify, avatar } = req.body;
        const user = yield prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { username, qqEmail, enableEmailNotify, avatar }
        });
        res.json({
            id: user.id.toString(),
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            qqEmail: user.qqEmail,
            enableEmailNotify: user.enableEmailNotify,
            registerDate: user.registerDate
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile' });
    }
}));
// Send Email Test
router.post('/email-test', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const transporter = nodemailer_1.default.createTransport({
        service: 'qq',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    try {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; text-align: center; }
          .footer { background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div style="background-color: #f6f6f6; padding: 20px;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div class="header" style="background: #2196F3; color: white; padding: 20px; text-align: center;">
              <h2 style="margin:0;">📧 邮箱绑定测试</h2>
            </div>
            <div class="content" style="padding: 30px 20px; text-align: center;">
              <p style="font-size: 16px; color: #333;">恭喜！您的邮箱已成功绑定到食品保质期计算器。</p>
              <p style="font-size: 14px; color: #666;">您将能接收到食品到期提醒通知。</p>
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
        yield transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '[FreshTracker] 邮箱绑定测试',
            html
        });
        res.json({ message: 'Email sent' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send email' });
    }
}));
exports.default = router;
