import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users - list users (for assigning, etc)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        teamRole: true,
        profilePicture: true,
        developer: true,
        isValidate: true,
        bio: true,
        lastSeen: true,
      },
      orderBy: { username: 'asc' },
    });

    res.json(users.map(u => ({
      ...u,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username,
      isOnline: u.lastSeen ? (Date.now() - new Date(u.lastSeen).getTime()) < 60000 : false,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id as string);
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      username: user.username,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      teamRole: user.teamRole,
      profilePicture: user.profilePicture,
      developer: user.developer,
      bio: user.bio,
      lastSeen: user.lastSeen,
      profile: user.profile,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
