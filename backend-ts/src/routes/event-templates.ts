import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/event-templates
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.eventTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event templates' });
  }
});

// POST /api/event-templates
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, title, startTime, endTime, task, description, color } = req.body;
    if (!name && !title) return res.status(400).json({ error: 'name is required' });

    const template = await prisma.eventTemplate.create({
      data: {
        userId: req.user!.id,
        name: name || title,
        title: title || name,
        startTime: startTime || null,
        endTime: endTime || null,
        task: task || null,
        description: description || null,
        color: color || '#3B82F6',
      },
    });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event template' });
  }
});

// PUT /api/event-templates/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, startTime, endTime, task, description, color } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (task !== undefined) data.task = task;
    if (description !== undefined) data.description = description;
    if (color !== undefined) data.color = color;

    const template = await prisma.eventTemplate.update({ where: { id }, data });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event template' });
  }
});

// DELETE /api/event-templates/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.eventTemplate.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Event template deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event template' });
  }
});

export default router;
