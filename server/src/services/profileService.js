import Profile from '../models/Profile.js';
import Event from '../models/Event.js';
import { createError } from '../utils/helpers.js';

/**
 * Get profiles visible to the current user.
 * Admin → all profiles.
 * Normal user → only their own profile.
 */
export const getVisibleProfiles = async (user) => {
  if (user.isAdmin) {
    return Profile.find().sort({ role: 1, name: 1 }).lean();
  }

  // Normal user sees only themselves
  return Profile.find({ _id: user.id }).lean();
};

/**
 * Create a new profile. Only admins may call this (enforced at the route level).
 */
export const createProfile = async ({ name, timezone }, user) => {
  if (!user.isAdmin) {
    throw createError(403, 'Only admins can create profiles');
  }

  if (!name || !name.trim()) {
    throw createError(400, 'Profile name is required');
  }

  const profile = await Profile.create({
    name: name.trim(),
    timezone: timezone || 'UTC',
    role: 'User',
  });

  return profile.toObject();
};

/**
 * Update a profile.
 * Normal users can only update their own timezone.
 * Admin can update name, timezone, and role.
 */
export const updateProfile = async (id, updates, user) => {
  const targetId = id.toString();
  const isSelf = targetId === user.id;

  // Normal user can only update themselves
  if (!user.isAdmin && !isSelf) {
    throw createError(403, 'You can only update your own profile');
  }

  const allowed = {};

  // Admin can update name
  if (user.isAdmin && updates.name !== undefined) {
    const name = updates.name.trim();
    if (!name) throw createError(400, 'Profile name cannot be empty');
    allowed.name = name;
  }

  // Normal user trying to change name → reject
  if (!user.isAdmin && updates.name !== undefined) {
    throw createError(403, 'Only admins can update profile names');
  }

  // Timezone — both admin and self can update
  if (updates.timezone !== undefined) {
    allowed.timezone = updates.timezone;
  }

  // Role — admin only
  if (user.isAdmin && updates.role !== undefined) {
    if (!['Admin', 'User'].includes(updates.role)) throw createError(400, 'Invalid role');
    allowed.role = updates.role;
  }

  // Normal user trying to change role → reject
  if (!user.isAdmin && updates.role !== undefined) {
    throw createError(403, 'Only admins can change roles');
  }

  if (Object.keys(allowed).length === 0) {
    throw createError(400, 'No allowed profile changes provided');
  }

  const profile = await Profile.findByIdAndUpdate(id, allowed, {
    new: true,
    runValidators: true,
  }).lean();

  if (!profile) throw createError(404, 'Profile not found');

  return profile;
};

/**
 * Get profiles relevant to a user's events (for event filter dropdown).
 * Admin → all profiles.
 * Normal user → only profiles that share events with them.
 */
export const getEventRelatedProfiles = async (user) => {
  if (user.isAdmin) {
    return Profile.find().select('name timezone').sort({ name: 1 }).lean();
  }

  // Find all events the user is part of, then collect all profile IDs from those events
  const userEvents = await Event.find({ profiles: user.id }).select('profiles').lean();
  const visibleIds = new Set([user.id]);
  userEvents.forEach((event) => {
    event.profiles.forEach((profileId) => visibleIds.add(profileId.toString()));
  });

  return Profile.find({ _id: { $in: [...visibleIds] } }).select('name timezone').sort({ name: 1 }).lean();
};

/**
 * Get all profiles for assignment (accessible by any logged in user).
 */
export const getAssignableProfiles = async () => {
  return Profile.find().select('name timezone role').sort({ role: 1, name: 1 }).lean();
};
