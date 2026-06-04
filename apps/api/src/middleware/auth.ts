import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@cig/types';

export interface AuthPayload {
  userId: string;
  role: Role;
  email: string;
}

// Extend Express Request to carry typed auth payload
declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Verifies the Bearer JWT from the Authorization header.
 * Attaches decoded payload to req.auth.
 * Returns 401 if token is missing or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Invalid or expired token' });
  }
}

/**
 * Role guard factory — use after requireAuth.
 * Example: router.delete('/events/:id', requireAuth, requireRole('ADMIN'), handler)
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ ok: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
