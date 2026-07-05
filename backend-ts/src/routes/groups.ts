import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/groups
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        owner: { select: { id: true, username: true, firstName: true, lastName: true } },
        memberships: {
          include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// POST /api/groups
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isPublic } = req.body;
    const { v4: uuidv4 } = await import('uuid');
    const group = await prisma.group.create({
      data: {
        name,
        description,
        ownerId: req.user!.id,
        isPublic: isPublic || false,
        inviteCode: uuidv4().slice(0, 8),
      },
    });
    // Add creator as admin member
    await prisma.groupMembership.create({
      data: { userId: req.user!.id, groupId: group.id, role: 'admin' },
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// POST /api/groups/join/:inviteCode
router.post('/join/:inviteCode', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const group = await prisma.group.findUnique({ where: { inviteCode: req.params.inviteCode } });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    await prisma.groupMembership.create({
      data: { userId: req.user!.id, groupId: group.id },
    });
    res.json({ message: 'Joined group', group });
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Already a member' });
    res.status(500).json({ error: 'Failed to join group' });
  }
});

export default router;
