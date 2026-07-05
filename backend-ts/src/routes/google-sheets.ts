import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/google-sheets/config
router.get('/config', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const config = await prisma.googleSheetsConfig.findFirst();
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Google Sheets config' });
  }
});

// POST /api/google-sheets/config
router.post('/config', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.developer) return res.status(403).json({ error: 'Not authorized' });

    const { spreadsheetId, sheetName, syncEnabled } = req.body;
    const config = await prisma.googleSheetsConfig.upsert({
      where: { id: 1 },
      update: {
        spreadsheetId: spreadsheetId || null,
        sheetName: sheetName || 'Sheet1',
        syncEnabled: syncEnabled === true || syncEnabled === 'true',
      },
      create: {
        spreadsheetId: spreadsheetId || null,
        sheetName: sheetName || 'Sheet1',
        syncEnabled: syncEnabled === true || syncEnabled === 'true',
      },
    });

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Google Sheets config' });
  }
});

// POST /api/google-sheets/sync
router.post('/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.developer) return res.status(403).json({ error: 'Not authorized' });
    // Placeholder — actual Google Sheets API sync would go here
    res.json({ message: 'Sync triggered', syncedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync' });
  }
});

export default router;
