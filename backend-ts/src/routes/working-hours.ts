import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/working-hours
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
      where.date = { gte: new Date(start as string), lte: new Date(end as string) };
    }

    const records = await prisma.workingHours.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch working hours' });
  }
});

// POST /api/working-hours/check-in
router.post('/check-in', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { shift } = req.body; // 'morning' or 'afternoon'
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (shift !== 'morning' && shift !== 'afternoon') {
      return res.status(400).json({ error: 'shift must be "morning" or "afternoon"' });
    }

    let record = await prisma.workingHours.findUnique({
      where: { userId_date: { userId: req.user!.id, date: today } },
    });

    if (!record) {
      record = await prisma.workingHours.create({
        data: { userId: req.user!.id, date: today },
      });
    }

    const data: any = { isCurrentlyWorking: true, currentShift: shift };
    if (shift === 'morning') {
      data.morningCheckIn = new Date();
      data.morningStatus = 'partial';
    } else {
      data.afternoonCheckIn = new Date();
      data.afternoonStatus = 'partial';
    }

    const updated = await prisma.workingHours.update({
      where: { id: record.id },
      data,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// POST /api/working-hours/check-out
router.post('/check-out', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.workingHours.findUnique({
      where: { userId_date: { userId: req.user!.id, date: today } },
    });

    if (!record) return res.status(404).json({ error: 'No check-in found for today' });

    const data: any = { isCurrentlyWorking: false, currentShift: null };
    if (record.currentShift === 'morning') {
      data.morningCheckOut = new Date();
      data.morningStatus = 'complete';
    } else if (record.currentShift === 'afternoon') {
      data.afternoonCheckOut = new Date();
      data.afternoonStatus = 'complete';
    }

    const updated = await prisma.workingHours.update({
      where: { id: record.id },
      data,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check out' });
  }
});

export default router;
