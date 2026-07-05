import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/goals
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date, start, end } = req.query;
    const where: any = { userId: req.user!.id };

    if (date) {
      const d = new Date(date as string);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    } else if (start && end) {
      where.date = {
        gte: new Date(start as string),
        lte: new Date(end as string),
      };
    }

    const goals = await prisma.dailyGoal.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /api/goals
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, date, priority, category, color, notes, targetTime } = req.body;
    if (!text || !date) {
      return res.status(400).json({ error: 'text and date are required' });
    }

    const goal = await prisma.dailyGoal.create({
      data: {
        userId: req.user!.id,
        text,
        date: new Date(date),
        priority: priority || 'medium',
        category: category || 'personal',
        color: color || 'blue',
        notes: notes || '',
        targetTime: targetTime ? parseInt(targetTime) : null,
      },
    });
    res.status(201).json(goal);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Goal already exists for this date' });
    }
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PATCH /api/goals/:id
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { text, completed, priority, category, color, notes, targetTime } = req.body;
    const data: any = {};
    if (text !== undefined) data.text = text;
    if (completed !== undefined) data.completed = completed;
    if (priority !== undefined) data.priority = priority;
    if (category !== undefined) data.category = category;
    if (color !== undefined) data.color = color;
    if (notes !== undefined) data.notes = notes;
    if (targetTime !== undefined) data.targetTime = targetTime;

    const goal = await prisma.dailyGoal.update({ where: { id }, data });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.dailyGoal.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
