import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/reports
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user!.id },
      include: { images: true },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/all
router.get('/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
        images: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all reports' });
  }
});

// POST /api/reports
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tasks, note, noteType } = req.body;
    if (!tasks) return res.status(400).json({ error: 'tasks are required' });

    const report = await prisma.report.create({
      data: {
        userId: req.user!.id,
        tasks: typeof tasks === 'string' ? tasks : JSON.stringify(tasks),
        note: note || null,
        noteType: noteType || 'text',
      },
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// PATCH /api/reports/:id
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, rating, note, noteType } = req.body;
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (rating !== undefined) data.rating = rating ? parseInt(rating) : null;
    if (note !== undefined) data.note = note;
    if (noteType !== undefined) data.noteType = noteType;

    const report = await prisma.report.update({ where: { id }, data });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.report.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
