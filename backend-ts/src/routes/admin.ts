import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.developer && req.user!.teamRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const [userCount, pendingTasks, pendingReports, pendingSubmissions, groups] = await Promise.all([
      prisma.user.count(),
      prisma.assignedTask.count({ where: { done: false } }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.submission.count({ where: { status: 'pending' } }),
      prisma.group.count(),
    ]);

    res.json({
      totalUsers: userCount,
      pendingTasks,
      pendingReports,
      pendingSubmissions,
      totalGroups: groups,
      activeSessions: 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin dashboard' });
  }
});

// GET /api/admin/settings
router.get('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.developer) return res.status(403).json({ error: 'Not authorized' });

    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST /api/admin/settings
router.post('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.developer) return res.status(403).json({ error: 'Not authorized' });

    const entries = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(entries)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/admin/logs
router.get('/logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.developer) return res.status(403).json({ error: 'Not authorized' });

    const logs = await prisma.activityLog.findMany({
      include: { user: { select: { id: true, username: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
