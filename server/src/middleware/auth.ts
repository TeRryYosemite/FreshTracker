import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma'; // Fixed import (default import)

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  // 显式处理 Verify
  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err: any, user: any) => {
    if (err) {
      console.error('JWT Verify Error:', err);
      return res.sendStatus(403);
    }
    // 赋值
    req.user = user;
    // console.log('Auth Success, User:', user); // Debug Log
    next();
  });
};

export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // console.log('Checking Admin, req.user:', req.user); // Debug Log

  // 安全检查：确保 req.user 存在
  if (!req.user) {
    console.error('isAdmin Error: req.user is undefined. authenticateToken failed?');
    return res.status(401).json({ message: 'Authentication failed' });
  }

  if (!req.user.id) {
    console.error('isAdmin Error: req.user.id is missing');
    return res.status(403).json({ message: 'Invalid Token Content' });
  }

  try {
    const userId = Number(req.user.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.role === 'admin') {
      next();
    } else {
      console.warn(`User ${userId} attempted admin access but is role: ${user?.role}`);
      res.status(403).json({ message: 'Requires Admin Privileges' });
    }
  } catch (error) {
    console.error('isAdmin Middleware Error:', error);
    res.status(500).json({ message: 'Server error checking admin status' });
  }
};
