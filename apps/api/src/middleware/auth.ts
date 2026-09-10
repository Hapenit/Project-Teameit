import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenantId?: string;
      rawBody?: Buffer;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authentication token' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    // We would normally verify against the Supabase JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'Authentication is not configured' } });
    }
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
};
