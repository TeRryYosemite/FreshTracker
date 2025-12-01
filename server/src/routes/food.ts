import express from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkAndGenerateRecord } from '../services/emailService';

const router = express.Router();

// Get all foods for user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const foods = await prisma.food.findMany({
      where: { userId: req.user.id }
    });
    res.json(foods.map(f => ({ 
      id: f.id.toString(), 
      name: f.name, 
      category: f.category, 
      quantity: f.quantity, 
      purchaseDate: f.purchaseDate, 
      expirationDate: f.expirationDate, 
      image: f.image,
      tags: f.tags ? f.tags.split(',') : [],
      notes: f.notes
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching foods' });
  }
});

// Add food
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, category, quantity, purchaseDate, expirationDate, image, notes, tags } = req.body;
    const food = await prisma.food.create({
      data: {
        userId: req.user.id,
        name,
        category,
        quantity: Number(quantity),
        purchaseDate: new Date(purchaseDate),
        expirationDate: new Date(expirationDate),
        image,
        tags: Array.isArray(tags) ? tags.join(',') : '',
        notes
      }
    });
    
    // Check if this newly added food needs a return record immediately
    try {
      await checkAndGenerateRecord(food, req.user.id, true);
    } catch (recordError) {
      console.error('Failed to auto-generate record:', recordError);
      // Continue execution - do not fail the food creation
    }
    
    res.json({ 
      id: food.id.toString(), 
      name: food.name, 
      category: food.category, 
      quantity: food.quantity, 
      purchaseDate: food.purchaseDate, 
      expirationDate: food.expirationDate, 
      image: food.image,
      tags: food.tags ? food.tags.split(',') : [],
      notes: food.notes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding food' });
  }
});

// Update food
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    const { name, category, quantity, purchaseDate, expirationDate, image, notes, tags } = req.body;

    // Ensure user owns the food
    const existingFood = await prisma.food.findFirst({
      where: { id, userId: req.user.id }
    });
    
    if (!existingFood) return res.status(404).json({ message: 'Food not found' });

    const updatedFood = await prisma.food.update({
      where: { id },
      data: {
        name,
        category,
        quantity: Number(quantity),
        purchaseDate: new Date(purchaseDate),
        expirationDate: new Date(expirationDate),
        image,
        tags: Array.isArray(tags) ? tags.join(',') : '',
        notes
      }
    });
    
    // Auto-sync logic for Return Records
    try {
      // 1. Try to sync existing auto-generated records first
      const syncResult = await prisma.record.updateMany({
        where: {
          foodId: id, // Match by foodId
          reason: '临期自动记录',
          userId: req.user.id
        },
        data: {
          foodName: updatedFood.name,
          image: updatedFood.image,
          quantity: updatedFood.quantity,
          returnDate: updatedFood.expirationDate
        }
      });

      // 2. Only if NO record was updated (meaning none existed or matched), 
      // check if we need to generate a new one
      if (syncResult.count === 0) {
        await checkAndGenerateRecord(updatedFood, req.user.id, true);
      } else {
        console.log(`🔄 Synced ${syncResult.count} existing records for food ${updatedFood.name}`);
      }
    } catch (recordError) {
      console.error('Failed to sync/generate records on update:', recordError);
    }

    res.json({ 
      id: updatedFood.id.toString(), 
      name: updatedFood.name, 
      category: updatedFood.category, 
      quantity: updatedFood.quantity, 
      purchaseDate: updatedFood.purchaseDate, 
      expirationDate: updatedFood.expirationDate,
      image: updatedFood.image,
      tags: updatedFood.tags ? updatedFood.tags.split(',') : [],
      notes: updatedFood.notes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating food' });
  }
});

// Batch Delete
router.post('/batch-delete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body; // Expecting { ids: [1, 2, 3] }
    if (!Array.isArray(ids)) return res.status(400).json({ message: 'Invalid IDs' });

    // Convert string IDs to numbers if necessary
    const numericIds = ids.map((id: string | number) => Number(id)).filter(id => !isNaN(id));

    await prisma.food.deleteMany({
      where: {
        id: { in: numericIds },
        userId: req.user.id // Security check
      }
    });

    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error batch deleting foods' });
  }
});

// Batch Import
router.post('/batch-import', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const foods = req.body;
    if (!Array.isArray(foods)) return res.status(400).json({ message: 'Invalid data format' });

    // Validation and mapping
    const validFoods = foods
      .filter((f: any) => f.name && f.expirationDate)
      .map((f: any) => ({
        userId: req.user.id,
        name: f.name,
        category: f.category || '其他',
        quantity: Number(f.quantity) || 1,
        purchaseDate: f.purchaseDate ? new Date(f.purchaseDate) : new Date(),
        expirationDate: new Date(f.expirationDate),
        notes: f.notes || '',
        tags: f.tags || '',
        image: null
      }));

    if (validFoods.length === 0) return res.status(400).json({ message: 'No valid foods found' });

    const result = await prisma.food.createMany({
      data: validFoods
    });

    res.json({ message: `Successfully imported ${result.count} items` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error batch importing foods' });
  }
});

// Delete food
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    // Ensure user owns the food
    const food = await prisma.food.findFirst({
      where: { id, userId: req.user.id }
    });
    
    if (!food) return res.status(404).json({ message: 'Food not found' });

    await prisma.food.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting food' });
  }
});

export default router;
