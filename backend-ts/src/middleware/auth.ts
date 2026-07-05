import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    teamRole: string;
    isValidate: boolean;
    developer: boolean;
    profilePicture: string | null;
    name: string;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Accept both "Bearer" and "Token" auth schemes
  let tokenKey: string;
  if (authHeader.startsWith('Bearer ')) {
    tokenKey = authHeader.slice(7);
  } else if (authHeader.startsWith('Token ')) {
    tokenKey = authHeader.slice(6);
  } else {
    return res.status(401).json({ error: 'Invalid authorization header format' });
  }
  try {
    const token = await prisma.token.findUnique({
      where: { key: tokenKey },
      include: { user: true },
    });

    if (!token) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = token.user;
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      teamRole: user.teamRole,
      isValidate: user.isValidate,
      developer: user.developer,
      profilePicture: user.profilePicture,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username,
    };
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  let tokenKey: string | null = null;
  if (authHeader.startsWith('Bearer ')) {
    tokenKey = authHeader.slice(7);
  } else if (authHeader.startsWith('Token ')) {
    tokenKey = authHeader.slice(6);
  }

  if (!tokenKey) return next();

  prisma.token.findUnique({
    where: { key: tokenKey },
    include: { user: true },
  }).then(token => {
    if (token) {
      req.user = {
        id: token.user.id,
        username: token.user.username,
        email: token.user.email,
        teamRole: token.user.teamRole,
        isValidate: token.user.isValidate,
        developer: token.user.developer,
        profilePicture: token.user.profilePicture,
        name: [token.user.firstName, token.user.lastName].filter(Boolean).join(' ').trim() || token.user.username,
      };
    }
    next();
  }).catch(() => next());
}
