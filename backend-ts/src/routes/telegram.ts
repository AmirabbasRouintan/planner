import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/telegram - list telegram bot configs
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bots = await prisma.telegram.findMany({
      include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
    });
    res.json(bots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch telegram configs' });
  }
});

// GET /api/telegram/stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const totalBots = await prisma.telegram.count();
    const activeBots = await prisma.telegram.count({ where: { isActive: true } });
    const linkedUsers = await prisma.user.count({ where: { telegramId: { not: null } } });
    res.json({ totalBots, activeBots, linkedUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch telegram stats' });
  }
});

// PUT /api/telegram/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.developer) return res.status(403).json({ error: 'Not authorized' });
    const id = parseInt(req.params.id as string);
    const bot = await prisma.telegram.update({ where: { id }, data: req.body });
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update telegram config' });
  }
});

export default router;
