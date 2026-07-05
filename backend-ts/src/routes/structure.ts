import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/structure/boards - list structure boards
router.get('/boards', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const boards = await prisma.structureBoard.findMany({
      where: {
        OR: [
          { ownerId: req.user!.id },
          { collaborators: { some: { id: req.user!.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, username: true, firstName: true, lastName: true } },
        collaborators: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// POST /api/structure/boards
router.post('/boards', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, code } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });

    const board = await prisma.structureBoard.create({
      data: { ownerId: req.user!.id, name: name || 'New Board', code },
    });
    res.status(201).json(board);
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Board code already exists' });
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// GET /api/structure/boards/:code
router.get('/boards/:code', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const board = await prisma.structureBoard.findUnique({
      where: { code: req.params.code },
      include: {
        owner: { select: { id: true, username: true, firstName: true, lastName: true } },
        collaborators: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

// PUT /api/structure/boards/:code
router.put('/boards/:code', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const board = await prisma.structureBoard.update({
      where: { code: req.params.code },
      data: req.body,
    });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update board' });
  }
});

// DELETE /api/structure/boards/:code
router.delete('/boards/:code', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.structureBoard.delete({ where: { code: req.params.code } });
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

export default router;
