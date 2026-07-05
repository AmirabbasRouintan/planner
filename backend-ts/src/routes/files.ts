import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import path from 'path';

const router = Router();

// POST /api/files/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { recipientId, isPublic, targetRole } = req.body;
    const file = await prisma.configFile.create({
      data: {
        name: req.file.originalname,
        file: `/uploads/config_files/${req.file.filename}`,
        uploadedBy: req.user!.id,
        recipientId: recipientId ? parseInt(recipientId) : null,
        isPublic: isPublic === 'true' || isPublic === true,
        targetRole: targetRole || null,
      },
    });

    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /api/files
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const files = await prisma.configFile.findMany({
      where: {
        OR: [
          { uploadedBy: req.user!.id },
          { recipientId: req.user!.id },
          { isPublic: true },
        ],
      },
      include: {
        uploader: { select: { id: true, username: true, firstName: true, lastName: true } },
        recipient: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// DELETE /api/files/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const file = await prisma.configFile.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.uploadedBy !== req.user!.id && !req.user!.developer) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.configFile.delete({ where: { id } });
    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
