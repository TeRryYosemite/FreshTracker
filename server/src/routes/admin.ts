import express from 'express';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users (Admin only)
router.get('/users', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { registerDate: 'desc' }, // 按注册时间倒序
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        registerDate: true,
        avatar: true,
        enableEmailNotify: true,
        qqEmail: true
      }
    });
    // 修复：将 BigInt/Int ID 转换为字符串返回，防止前端精度丢失或类型问题
    const safeUsers = users.map(u => ({
      ...u,
      id: u.id.toString()
    }));
    res.json(safeUsers);
  } catch (error) {
    console.error('Admin Get Users Error:', error); // 打印错误
    res.status(500).json({ message: 'Error fetching users: ' + (error as any).message });
  }
});

// Update user (Admin only - e.g., change password or role)
router.put('/users/:id', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { password, role, enableEmailNotify, qqEmail } = req.body;

  try {
    const dataToUpdate: any = {};
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashedPassword;
    }
    if (role) dataToUpdate.role = role;
    if (enableEmailNotify !== undefined) dataToUpdate.enableEmailNotify = enableEmailNotify;
    if (qqEmail) dataToUpdate.qqEmail = qqEmail;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (userId === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete yourself' });
  }

  try {
    // Delete related records first (Cascade normally handles this, but good to be safe)
    await prisma.food.deleteMany({ where: { userId } });
    await prisma.record.deleteMany({ where: { userId } });
    
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

export default router;

