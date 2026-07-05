import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get or create token
    let token = await prisma.token.findUnique({ where: { userId: user.id } });
    if (!token) {
      const { v4: uuidv4 } = await import('uuid');
      const key = uuidv4();
      token = await prisma.token.create({
        data: { key, userId: user.id },
      });
    }

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });

    res.json({
      token: token.key,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username,
        teamRole: user.teamRole,
        profilePicture: user.profilePicture,
        developer: user.developer,
        isValidate: user.isValidate,
        canSeeWorkHours: user.canSeeWorkHours,
        bio: user.bio,
        telegramId: user.telegramId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      },
    });

    // Create profile
    await prisma.userProfile.create({ data: { userId: user.id } });

    // Create token
    const { v4: uuidv4 } = await import('uuid');
    const token = await prisma.token.create({
      data: { key: uuidv4(), userId: user.id },
    });

    res.status(201).json({
      token: token.key,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.token.delete({ where: { userId: req.user!.id } });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username,
      teamRole: user.teamRole,
      profilePicture: user.profilePicture,
      developer: user.developer,
      isValidate: user.isValidate,
      canSeeWorkHours: user.canSeeWorkHours,
      bio: user.bio,
      telegramId: user.telegramId,
      lastSeen: user.lastSeen,
      profile: user.profile,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/auth/update-profile
router.post('/update-profile', authMiddleware, upload.single('profile_picture'), async (req: AuthRequest, res: Response) => {
  try {
    const data: any = {};
    const { firstName, lastName, bio, email, teamRole } = req.body;
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (bio !== undefined) data.bio = bio;
    if (email !== undefined) data.email = email;
    if (teamRole !== undefined) data.teamRole = teamRole;
    if (req.file) data.profilePicture = `/uploads/profile_pictures/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username,
        profilePicture: user.profilePicture,
        teamRole: user.teamRole,
        bio: user.bio,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/auth/team
router.get('/team', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        teamRole: true,
        profilePicture: true,
        developer: true,
        isValidate: true,
        bio: true,
        lastSeen: true,
      },
      orderBy: { username: 'asc' },
    });

    const result = users.map(u => ({
      ...u,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username,
      isOnline: u.lastSeen ? (Date.now() - new Date(u.lastSeen).getTime()) < 60000 : false,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// GET /api/auth/dashboard
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [taskCount, goalCount, reportCount, submissionCount, notificationCount, todoCount] = await Promise.all([
      prisma.assignedTask.count({ where: { userId: req.user!.id, done: false } }),
      prisma.dailyGoal.count({ where: { userId: req.user!.id, date: today, completed: false } }),
      prisma.report.count({ where: { userId: req.user!.id, status: 'pending' } }),
      prisma.submission.count({ where: { userId: req.user!.id, status: 'pending' } }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
      prisma.employeeTodo.count({ where: { userId: req.user!.id, done: false } }),
    ]);

    res.json({
      pendingTasks: taskCount,
      pendingGoals: goalCount,
      pendingReports: reportCount,
      pendingSubmissions: submissionCount,
      unreadNotifications: notificationCount,
      pendingTodos: todoCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

export default router;
