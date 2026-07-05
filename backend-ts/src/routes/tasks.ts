import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/tasks - user's assigned tasks
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.assignedTask.findMany({
      where: { userId: req.user!.id },
      include: { assigner: { select: { id: true, username: true, firstName: true, lastName: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(tasks.map(t => ({
      ...t,
      assignerName: [t.assigner.firstName, t.assigner.lastName].filter(Boolean).join(' ').trim() || t.assigner.username,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/all - all tasks (admin)
router.get('/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.assignedTask.findMany({
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
        assigner: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all tasks' });
  }
});

// POST /api/tasks - create task
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, text, title, date } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ error: 'userId and text are required' });
    }

    const task = await prisma.assignedTask.create({
      data: {
        userId: parseInt(userId),
        assignedBy: req.user!.id,
        text,
        title: title || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: task.userId,
        message: `New task assigned: ${text.substring(0, 50)}`,
        link: '/tasks',
      },
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id - update task
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { done, text, title, date } = req.body;
    const data: any = {};
    if (done !== undefined) data.done = done;
    if (text !== undefined) data.text = text;
    if (title !== undefined) data.title = title;
    if (date !== undefined) data.date = new Date(date);

    const task = await prisma.assignedTask.update({ where: { id }, data });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.assignedTask.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
