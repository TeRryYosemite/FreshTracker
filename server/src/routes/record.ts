import express from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const records = await prisma.record.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: 'desc' }
    });
    res.json(records.map(r => ({
      id: r.id.toString(),
      foodName: r.foodName,
      image: r.image,
      quantity: r.quantity,
      returnDate: r.returnDate,
      reason: r.reason,
      timestamp: r.timestamp
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching records' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    // Ensure user owns the record
    const record = await prisma.record.findFirst({
      where: { id, userId: req.user.id }
    });
    
    if (!record) return res.status(404).json({ message: 'Record not found' });

    await prisma.record.delete({ where: { id } });
    res.json({ message: 'Record deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting record' });
  }
});

router.post('/batch-delete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ message: 'Invalid IDs' });

    const numericIds = ids.map((id: string | number) => Number(id)).filter(id => !isNaN(id));

    await prisma.record.deleteMany({
      where: {
        id: { in: numericIds },
        userId: req.user.id
      }
    });

    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error batch deleting records' });
  }
});

export default router;
