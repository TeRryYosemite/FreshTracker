import express from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get memos
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const memos = await prisma.memo.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(memos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching memos' });
  }
});

// Create memo
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content required' });
    
    const memo = await prisma.memo.create({
      data: {
        content,
        userId: req.user.id
      }
    });
    res.json(memo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating memo' });
  }
});

// Toggle memo
router.put('/:id/toggle', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    const memo = await prisma.memo.findFirst({ where: { id, userId: req.user.id } });
    if (!memo) return res.status(404).json({ message: 'Memo not found' });

    const updated = await prisma.memo.update({
      where: { id },
      data: { completed: !memo.completed }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating memo' });
  }
});

// Delete memo
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    const result = await prisma.memo.deleteMany({ 
      where: { 
        id, 
        userId: req.user.id 
      } 
    });
    
    if (result.count === 0) return res.status(404).json({ message: 'Memo not found' });
    
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting memo' });
  }
});

export default router;

