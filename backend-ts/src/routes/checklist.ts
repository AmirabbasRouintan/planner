import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/checklist
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.checklistItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// POST /api/checklist
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const item = await prisma.checklistItem.create({
      data: { userId: req.user!.id, text },
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checklist item' });
  }
});

// PATCH /api/checklist/:id
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { text, completed } = req.body;
    const data: any = {};
    if (text !== undefined) data.text = text;
    if (completed !== undefined) data.completed = completed;

    const item = await prisma.checklistItem.update({ where: { id }, data });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

// DELETE /api/checklist/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.checklistItem.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Checklist item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete checklist item' });
  }
});

export default router;
