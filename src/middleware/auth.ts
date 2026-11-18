import type { NextFunction, Request, Response } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateGoogleUser } from '../db/repository.ts';
import {
  parseCookies,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from '../server/auth.ts';
import type { AuthUser } from '../types/fieldshare.ts';

export interface AuthRequest extends Request {
  authUser?: AuthUser;
}

export async function resolveAuthUser(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) {
      const sessionUser = verifySessionToken(token);
      if (sessionUser) {
        return sessionUser;
      }
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        const requestedRole =
          req.headers['x-agrohub-role'] === 'OWNER' ? 'OWNER' : 'FARMER';
        return await getOrCreateGoogleUser({
          uid: decoded.uid,
          email: decoded.email || `${decoded.uid}@users.agrohub.local`,
          fullName: decoded.name || decoded.email?.split('@')[0] || 'AgroHub User',
          role: requestedRole,
        });
      } catch {
        // Fall through to cookie check
      }
    }
  }

  const cookies = parseCookies(req);
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  if (sessionToken) {
    return verifySessionToken(sessionToken);
  }
  return null;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Please sign in.' });
    }
    req.authUser = user;
    next();
  } catch (error) {
    console.error('Authentication check failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid session.' });
  }
};
