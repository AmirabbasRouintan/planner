import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/tickets - customer support tickets
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const where: Record<string, any> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.user!.teamRole !== 'admin' && !req.user!.developer) {
      where.userId = req.user!.id;
    }
    const tickets = await prisma.ticket.findMany({
      where,
      include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// POST /api/tickets
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { subject, description } = req.body;
    if (!subject) return res.status(400).json({ error: 'subject is required' });
    const ticket = await prisma.ticket.create({
      data: { userId: req.user!.id, subject, description },
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// GET /api/tickets/stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [pending, open, resolved, closed] = await Promise.all([
      prisma.ticket.count({ where: { status: 'pending' } }),
      prisma.ticket.count({ where: { status: 'open' } }),
      prisma.ticket.count({ where: { status: 'resolved' } }),
      prisma.ticket.count({ where: { status: 'closed' } }),
    ]);
    res.json({ pending, open, resolved, closed, total: pending + open + resolved + closed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket stats' });
  }
});

// PUT /api/tickets/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const ticket = await prisma.ticket.update({ where: { id }, data: req.body });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// DELETE /api/tickets/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.ticket.delete({ where: { id } });
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// --- Ticket Comments ---

// GET /api/tickets/:id/comments
router.get('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id as string);
    const comments = await prisma.ticketComment.findMany({
      where: { ticketId },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/tickets/:id/comments
router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id as string);
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const comment = await prisma.ticketComment.create({
      data: { ticketId, userId: req.user!.id, text },
      include: { user: { select: { id: true, username: true } } },
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
