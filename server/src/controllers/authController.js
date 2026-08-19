import Profile from '../models/Profile.js';
import { asyncHandler, createError } from '../utils/helpers.js';
import { createSessionToken, setSessionCookie, getCookie, readSessionToken, sessionCookieName } from '../utils/session.js';

/**
 * GET /api/auth/identities
 * - If the caller is already authenticated as Admin → return all profiles
 * - Otherwise → return only the caller's own profile (or all for initial login screen)
 *
 * For the initial login screen (no session), we return all profiles so the user
 * can pick who to log in as. Once logged in, the profile selector in the sidebar
 * is governed by the frontend using currentUser.role.
 */
export const listIdentities = asyncHandler(async (req, res) => {
  // Try to read existing session
  const token = getCookie(req, sessionCookieName);
  const session = readSessionToken(token);

  if (session?.id) {
    const caller = await Profile.findById(session.id).select('role').lean();
    if (caller && caller.role === 'Admin') {
      // Admin sees all profiles
      const identities = await Profile.find().select('name timezone role').sort({ role: 1, name: 1 }).lean();
      return res.json({ success: true, data: identities });
    }
    // Non-admin sees only themselves
    const self = await Profile.findById(session.id).select('name timezone role').lean();
    if (self) {
      return res.json({ success: true, data: [self] });
    }
  }

  // No session — login screen: return all profiles for identity selection
  const identities = await Profile.find().select('name timezone role').sort({ role: 1, name: 1 }).lean();
  res.json({ success: true, data: identities });
});

export const selectIdentity = asyncHandler(async (req, res) => {
  const { profileId } = req.body;
  if (!profileId) throw createError(400, 'profileId is required');

  const profile = await Profile.findById(profileId).select('name timezone role').lean();
  if (!profile) throw createError(404, 'Profile not found');

  const token = createSessionToken({
    id: profile._id.toString(),
    role: profile.role,
  });
  setSessionCookie(res, token);

  res.json({ success: true, data: profile });
});

export const getCurrentIdentity = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export const logout = asyncHandler(async (_req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  });
  res.json({ success: true, message: 'Logged out' });
});
