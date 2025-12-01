import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import cron from 'node-cron';

// Configure Transporter
const transporter = nodemailer.createTransport({
  service: 'qq',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send Email Function
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
  }
};

// Check and generate record for a single food item
export const checkAndGenerateRecord = async (food: any, userId: number, force: boolean = false) => {
  const today = new Date();
  // Threshold for "Return Record" (e.g., <= 2 days)
  const returnThresholdDate = new Date();
  returnThresholdDate.setDate(today.getDate() + 2);
  
  const expDate = new Date(food.expirationDate);

  // Logic A: Generate Return Record (if <= 2 days)
  if (expDate <= returnThresholdDate) {
    let recentRecord = null;

    // Only check for recent records if NOT forced (i.e., not a manual add/update)
    if (!force) {
        // Check if we already generated a record for this food recently (e.g. within last 5 days) to avoid duplicates
        recentRecord = await prisma.record.findFirst({
          where: {
            userId: userId,
            foodName: food.name,
            timestamp: {
              gte: new Date(new Date().setDate(today.getDate() - 5)) // Check last 5 days
            }
          }
        });
    } else {
        // EVEN IF FORCED: Check for EXACT duplicates (same name + same returnDate + created very recently)
        // This prevents spamming records when user just updates notes/image but expiration date is same
        recentRecord = await prisma.record.findFirst({
            where: {
              userId: userId,
              foodName: food.name,
              returnDate: expDate, // Expiration date must match
              timestamp: {
                gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 12) // Within last 12 hours
              }
            }
        });
    }

    if (!recentRecord) {
      await prisma.record.create({
        data: {
          userId: userId,
          foodId: food.id, // Link to original food
          foodName: food.name,
          image: food.image, // Save image
          quantity: food.quantity,
          reason: '临期自动记录',
          returnDate: expDate // Or today? Usually return date is the expiry date or calculated date
        }
      });
      console.log(`📝 Generated return record for ${food.name} (User ${userId})`);
    } else {
       console.log(`⚠️ Skipped duplicate record generation for ${food.name} (Force: ${force})`);
    }
  }
};

// Cron Job: Check daily at 9:00 AM
export const startEmailScheduler = () => {
  console.log('⏰ Email & Record scheduler started (Running daily at 09:00)');
  
  cron.schedule('0 9 * * *', async () => {
    console.log('🔍 Checking for expiring foods & generating records...');
    
    try {
      // 1. Find all users (we need to generate records for everyone, not just email users)
      const users = await prisma.user.findMany({
        include: {
          foods: true
        }
      });

      const today = new Date();
      // Threshold for Email (e.g., <= 3 days)
      const emailThresholdDate = new Date();
      emailThresholdDate.setDate(today.getDate() + 3);

      for (const user of users) {
        const expiringFoodsForEmail = [];

        for (const food of user.foods) {
          // Check logic A: Generate Record
          await checkAndGenerateRecord(food, user.id);

          const expDate = new Date(food.expirationDate);
          
          // --- Logic B: Collect for Email (if <= 3 days) ---
          if (user.enableEmailNotify && user.qqEmail && expDate <= emailThresholdDate) {
            expiringFoodsForEmail.push(food);
          }
        }

        // Send Email if needed
        if (expiringFoodsForEmail.length > 0 && user.qqEmail) {
          const foodListHtml = expiringFoodsForEmail.map(f => {
            const expDate = new Date(f.expirationDate);
            const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            const status = daysLeft < 0 ? '已过期' : `剩 ${daysLeft} 天`;
            const color = daysLeft < 0 ? '#e74c3c' : '#f39c12';
            return `
              <li style="margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px;">
                <b style="color: #333;">${f.name}</b> 
                <span style="color: #666; font-size: 0.9em;">(${f.category})</span>
                <br/>
                <span style="color:${color}; font-weight: bold;">${status}</span> 
                <span style="color: #999; font-size: 0.9em;"> - ${expDate.toISOString().split('T')[0]}</span>
              </li>`;
          }).join('');

          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; }
                .footer { background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888; }
                ul { padding-left: 0; list-style-type: none; }
              </style>
            </head>
            <body>
              <div style="background-color: #f6f6f6; padding: 20px;">
                <div class="container" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div class="header" style="background: #FF9800; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin:0;">🍎 食品到期提醒</h2>
                  </div>
                  <div class="content" style="padding: 30px 20px;">
                    <p style="font-size: 16px; color: #333;">亲爱的 ${user.username}，</p>
                    <p style="font-size: 14px; color: #666;">您有以下食品即将过期或已过期，请尽快处理：</p>
                    <ul style="padding-left: 0; list-style-type: none;">
                      ${foodListHtml}
                    </ul>
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

          await sendEmail(user.qqEmail, '【FreshTracker】您有食品即将过期', html);
        }
      }
    } catch (error) {
      console.error('Error in scheduler:', error);
    }
  });
};
