import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/calendar - list calendar events
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const where: Record<string, any> = { userId: req.user!.id };
    if (req.query.date) where.date = new Date(req.query.date as string);
    if (req.query.month) {
      const d = new Date(req.query.month as string);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      where.date = { gte: start, lte: end };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: { comments: { include: { user: { select: { id: true, username: true } } }, orderBy: { createdAt: 'asc' } } },
      orderBy: { date: 'asc' },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// POST /api/calendar
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date, startTime, endTime, task, description, status, color, isHoliday } = req.body;
    const event = await prisma.calendarEvent.create({
      data: {
        userId: req.user!.id,
        date: new Date(date),
        startTime,
        endTime,
        task,
        description,
        status,
        color,
        isHoliday,
      },
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/calendar/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const event = await prisma.calendarEvent.update({ where: { id }, data: req.body });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/calendar/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.calendarEvent.delete({ where: { id } });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// POST /api/calendar/:id/comments
router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = parseInt(req.params.id as string);
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const comment = await prisma.comment.create({
      data: { eventId, userId: req.user!.id, text },
      include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
