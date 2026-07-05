import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications — create a notification
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { message, link } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const notification = await prisma.notification.create({
      data: {
        userId: req.user!.id,
        message,
        link: link || null,
      },
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// POST /api/notifications/:id/mark_read
router.post('/:id/mark_read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/:id/toggle_saved
router.post('/:id/toggle_saved', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    const updated = await prisma.notification.update({
      where: { id },
      data: { isSaved: !notification.isSaved },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle notification saved status' });
  }
});

// POST /api/notifications/mark_all_read
router.post('/mark_all_read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router;
