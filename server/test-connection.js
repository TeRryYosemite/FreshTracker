const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 正在尝试连接数据库...');
    console.log('URL:', process.env.DATABASE_URL || '未找到环境变量 (将使用 Prisma 默认配置)');

    // 尝试连接
    await prisma.$connect();
    console.log('✅ 连接成功！数据库配置正确。');

    // 尝试简单的查询 (列出所有表名 - MySQL 语法)
    const result = await prisma.$queryRaw`SHOW TABLES`;
    console.log('📊 现有表:', result);

  } catch (e) {
    console.error('❌ 连接失败:', e.message);
    console.error('   请检查: 用户名、密码、端口(3306) 以及数据库名是否正确。');
  } finally {
    await prisma.$disconnect();
  }
}

main();

