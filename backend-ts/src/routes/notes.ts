import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notes - permanent notes
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const where: Record<string, any> = {};
    // Admins see all notes, regular users only their own
    if (!req.user!.developer && req.user!.teamRole !== 'admin') {
      where.userId = req.user!.id;
    }
    const notes = await prisma.permanentNote.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/notes
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, content, title, isPinned, color } = req.body;
    const noteText = text || content || title;
    if (!noteText) return res.status(400).json({ error: 'text is required' });

    const note = await prisma.permanentNote.create({
      data: {
        userId: req.user!.id,
        title: title || noteText,
        content: noteText,
      },
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PATCH /api/notes/:id
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { text, content, title } = req.body;
    const data: any = {};
    if (text !== undefined || content !== undefined) data.content = text || content;
    if (title !== undefined) data.title = title;

    const note = await prisma.permanentNote.update({ where: { id }, data });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.permanentNote.delete({ where: { id } });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
