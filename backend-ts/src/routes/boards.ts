import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/boards - list all boards (flow diagram style)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const boards = await prisma.board.findMany({
      include: {
        _count: { select: { nodes: true, edges: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// POST /api/boards
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const board = await prisma.board.create({
      data: { name: name || 'New Board', ownerId: req.user!.id },
    });
    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// GET /api/boards/:boardId - get board with nodes and edges
router.get('/:boardId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.boardId as string },
      include: {
        nodes: { orderBy: { type: 'asc' } },
        edges: true,
      },
    });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

// PUT /api/boards/:boardId/nodes - upsert nodes (save canvas state)
router.put('/:boardId/nodes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const boardId = req.params.boardId as string;
    const { nodes, edges } = req.body;

    if (nodes) {
      // Delete removed nodes, upsert existing
      const existingNodeIds = nodes.filter((n: any) => n.id).map((n: any) => n.id);
      if (existingNodeIds.length > 0) {
        await prisma.node.deleteMany({
          where: { boardId, id: { notIn: existingNodeIds } },
        });
      } else {
        await prisma.node.deleteMany({ where: { boardId } });
      }

      for (const node of nodes) {
        await prisma.node.upsert({
          where: { boardId_id: { boardId, id: node.id || uuidv4() } },
          update: {
            type: node.type,
            positionX: node.position?.x ?? node.positionX ?? 0,
            positionY: node.position?.y ?? node.positionY ?? 0,
            data: typeof node.data === 'object' ? JSON.stringify(node.data) : node.data,
            style: typeof node.style === 'object' ? JSON.stringify(node.style) : (node.style || '{}'),
            measuredWidth: node.measured?.width ?? node.measuredWidth ?? null,
            measuredHeight: node.measured?.height ?? node.measuredHeight ?? null,
          },
          create: {
            id: node.id || uuidv4(),
            boardId,
            type: node.type || 'default',
            positionX: node.position?.x ?? node.positionX ?? 0,
            positionY: node.position?.y ?? node.positionY ?? 0,
            data: typeof node.data === 'object' ? JSON.stringify(node.data) : (node.data || '{}'),
            style: typeof node.style === 'object' ? JSON.stringify(node.style) : (node.style || '{}'),
            measuredWidth: node.measured?.width ?? node.measuredWidth ?? null,
            measuredHeight: node.measured?.height ?? node.measuredHeight ?? null,
          },
        });
      }
    }

    if (edges) {
      const existingEdgeIds = edges.filter((e: any) => e.id).map((e: any) => e.id);
      if (existingEdgeIds.length > 0) {
        await prisma.edge.deleteMany({
          where: { boardId, id: { notIn: existingEdgeIds } },
        });
      } else {
        await prisma.edge.deleteMany({ where: { boardId } });
      }

      for (const edge of edges) {
        await prisma.edge.upsert({
          where: { boardId_id: { boardId, id: edge.id || uuidv4() } },
          update: {
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
            animated: edge.animated || false,
            style: typeof edge.style === 'object' ? JSON.stringify(edge.style) : (edge.style || '{}'),
            type: edge.type || 'default',
          },
          create: {
            id: edge.id || uuidv4(),
            boardId,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
            animated: edge.animated || false,
            style: typeof edge.style === 'object' ? JSON.stringify(edge.style) : (edge.style || '{}'),
            type: edge.type || 'default',
          },
        });
      }
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { nodes: true, edges: true },
    });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save board' });
  }
});

// DELETE /api/boards/:boardId
router.delete('/:boardId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.board.delete({ where: { id: req.params.boardId as string } });
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

export default router;
