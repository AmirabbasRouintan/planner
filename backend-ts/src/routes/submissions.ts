import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/submissions
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user!.id },
      orderBy: { date: 'desc' },
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// GET /api/submissions/all
router.get('/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all submissions' });
  }
});

// POST /api/submissions
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date, report } = req.body;
    if (!date || !report) return res.status(400).json({ error: 'date and report are required' });

    const submission = await prisma.submission.create({
      data: { userId: req.user!.id, date: new Date(date), report },
    });
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// PATCH /api/submissions/:id
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, rating } = req.body;
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (rating !== undefined) data.rating = rating ? parseInt(rating) : null;

    const submission = await prisma.submission.update({ where: { id }, data });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// DELETE /api/submissions/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.submission.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Submission deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

export default router;
