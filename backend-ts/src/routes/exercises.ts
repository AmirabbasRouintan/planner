import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/exercises
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exercises = await prisma.exercise.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// POST /api/exercises
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const exercise = await prisma.exercise.create({
      data: { userId: req.user!.id, content },
    });
    res.status(201).json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// DELETE /api/exercises/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.exercise.delete({ where: { id } });
    res.json({ message: 'Exercise deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
});

export default router;
