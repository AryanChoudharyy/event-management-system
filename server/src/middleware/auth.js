import Profile from '../models/Profile.js';
import { createError } from '../utils/helpers.js';
import { getCookie, readSessionToken, sessionCookieName } from '../utils/session.js';

export const requireAuth = async (req, _res, next) => {
  try {
    const token = getCookie(req, sessionCookieName);
    const session = readSessionToken(token);
    if (!session?.id) throw createError(401, 'Authentication required');

    const profile = await Profile.findById(session.id).select('name timezone role').lean();
    if (!profile) throw createError(401, 'Authenticated profile no longer exists');

    req.user = {
      id: profile._id.toString(),
      name: profile.name,
      timezone: profile.timezone,
      role: profile.role,
      isAdmin: profile.role === 'Admin',
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req, _res, next) => {
  if (!req.user?.isAdmin) return next(createError(403, 'Admin access required'));
  return next();
};
