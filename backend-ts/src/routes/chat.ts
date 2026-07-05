import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// GET /api/chat - list my chat rooms
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
          { members: { some: { id: userId } } },
        ],
      },
      include: {
        user1: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true } },
        user2: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true } },
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(rooms.map(r => ({
      ...r,
      user1: r.user1 ? { ...r.user1, name: [r.user1.firstName, r.user1.lastName].filter(Boolean).join(' ').trim() || r.user1.username } : null,
      user2: r.user2 ? { ...r.user2, name: [r.user2.firstName, r.user2.lastName].filter(Boolean).join(' ').trim() || r.user2.username } : null,
      lastMessage: r.messages[0] || null,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// GET /api/chat/general - get or create general room
router.get('/general', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let room = await prisma.chatRoom.findFirst({
      where: { slug: 'general' },
      include: { members: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true } } },
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: { isGroup: true, name: 'General', slug: 'general' },
        include: { members: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true } } },
      });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch general chat' });
  }
});

// GET /api/chat/room/:roomId/messages
router.get('/room/:roomId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = parseInt(req.params.roomId as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await prisma.chatMessage.findMany({
      where: { chatRoomId: roomId },
      include: {
        sender: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true } },
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json(messages.map(m => ({
      id: m.id,
      user: {
        id: m.sender.id,
        username: m.sender.username,
        name: [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ').trim() || m.sender.username,
        profilePicture: m.sender.profilePicture,
      },
      message: m.message,
      image: m.image,
      timestamp: m.timestamp,
      isSaved: m.isSaved,
    })).reverse());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/room/:roomId/send
router.post('/room/:roomId/send', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const roomId = parseInt(req.params.roomId as string);
    const { message } = req.body;
    const image = req.file ? `/uploads/chat_images/${req.file.filename}` : null;

    if (!message && !image) {
      return res.status(400).json({ error: 'message or image is required' });
    }

    const msg = await prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        senderId: req.user!.id,
        message: message || null,
        image,
      },
      include: {
        sender: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true } },
      },
    });

    // Update room's updatedAt
    await prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } });

    res.status(201).json({
      id: msg.id,
      user: {
        id: msg.sender.id,
        username: msg.sender.username,
        name: [msg.sender.firstName, msg.sender.lastName].filter(Boolean).join(' ').trim() || msg.sender.username,
        profilePicture: msg.sender.profilePicture,
      },
      message: msg.message,
      image: msg.image,
      timestamp: msg.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/chat/room/:targetUserId (create/get DM)
router.post('/room/:targetUserId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const targetId = parseInt(req.params.targetUserId as string);
    const userId = req.user!.id;

    if (targetId === userId) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }

    // Find existing DM room
    let room = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        OR: [
          { user1Id: userId, user2Id: targetId },
          { user1Id: targetId, user2Id: userId },
        ],
      },
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: { user1Id: userId, user2Id: targetId },
      });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create/find room' });
  }
});

// DELETE /api/chat/message/:messageId
router.delete('/message/:messageId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.chatMessage.delete({ where: { id: parseInt(req.params.messageId as string) } });
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// DELETE /api/chat/room/:roomId/delete
router.delete('/room/:roomId/delete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.chatRoom.delete({ where: { id: parseInt(req.params.roomId as string) } });
    res.json({ message: 'Chat room deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// POST /api/chat/message/:messageId/save
router.post('/message/:messageId/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId as string);
    const existing = await prisma.savedMessage.findUnique({
      where: { userId_messageId: { userId: req.user!.id, messageId } },
    });

    if (existing) {
      await prisma.savedMessage.delete({ where: { userId_messageId: { userId: req.user!.id, messageId } } });
      res.json({ saved: false });
    } else {
      await prisma.savedMessage.create({ data: { userId: req.user!.id, messageId } });
      res.json({ saved: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle save' });
  }
});

export default router;
