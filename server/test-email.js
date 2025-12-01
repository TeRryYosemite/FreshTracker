require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  console.log('📧 正在初始化邮件发送服务...');
  console.log(`   发件人: ${process.env.EMAIL_USER}`);

  // 1. 创建传输对象 (使用显式配置而非 service 简写)
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // 增加超时设置，防止网络波动
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });

  // 2. 验证配置是否正确
  try {
    await transporter.verify();
    console.log('✅ SMTP 连接配置正确');
  } catch (error) {
    console.error('❌ SMTP 连接失败:', error);
    console.log('提示：请检查您的网络是否使用了代理，或者防火墙是否阻止了 465 端口。');
    return;
  }

  // 3. 发送测试邮件
  console.log('📤 正在发送测试邮件...');
  try {
    const info = await transporter.sendMail({
      from: `"FreshTracker Test" <${process.env.EMAIL_USER}>`, 
      to: process.env.EMAIL_USER, 
      subject: '【测试】食品保质期计算器邮件服务',
      text: '如果您看到这封邮件，说明您的邮件服务配置成功！',
      html: `
        <div style="background-color: #f3f4f6; padding: 20px;">
          <div style="background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #16a34a;">🎉 邮件服务配置成功</h2>
            <p>亲爱的用户，</p>
            <p>您的后端服务现在已经具备发送邮件提醒的能力。</p>
          </div>
        </div>
      `
    });

    console.log('✅ 邮件发送成功！');
    console.log('   Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ 邮件发送失败:', error);
  }
}

main();
