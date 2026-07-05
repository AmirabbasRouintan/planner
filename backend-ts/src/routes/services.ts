import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/services
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/services
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, url, status } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const service = await prisma.service.create({
      data: {
        name,
        url: url || '',
        status: status || 'unknown',
      },
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PATCH /api/services/:id
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, url, status } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (url !== undefined) data.url = url;
    if (status !== undefined) data.status = status;

    const service = await prisma.service.update({ where: { id }, data });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.service.delete({ where: { id } });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;
