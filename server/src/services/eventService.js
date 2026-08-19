import Event from '../models/Event.js';
import EventLog from '../models/EventLog.js';
import Profile from '../models/Profile.js';
import { createError } from '../utils/helpers.js';

const UPDATABLE_FIELDS = ['title', 'description', 'profiles', 'timezone', 'startDateTime', 'endDateTime'];

// Field labels for human-readable logs
const FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  profiles: 'Profiles',
  timezone: 'Timezone',
  startDateTime: 'Start Time',
  endDateTime: 'End Time',
};

export const getAllEvents = async (query = {}, user) => {
  const filter = user.isAdmin ? {} : { profiles: user.id };

  // Filter by profile
  if (query.profileId) {
    if (user.isAdmin) {
      filter.profiles = query.profileId;
    } else {
      filter.$and = [{ profiles: user.id }, { profiles: query.profileId }];
      delete filter.profiles;
    }
  }

  return Event.find(filter)
    .populate('profiles', 'name timezone')
    .populate('createdBy', 'name')
    .sort({ startDateTime: 1 })
    .lean();
};

export const getEventById = async (id, user) => {
  const event = await Event.findById(id)
    .populate('profiles', 'name timezone')
    .populate('createdBy', 'name')
    .lean();

  if (!event) throw createError(404, 'Event not found');
  if (!user.isAdmin && !event.profiles.some((p) => p._id.toString() === user.id)) {
    throw createError(404, 'Event not found');
  }
  return event;
};

export const createEvent = async (data, user) => {
  const { title, description, profiles, timezone, startDateTime, endDateTime } = data;

  // Validate required fields
  if (!title || !title.trim()) throw createError(400, 'Event title is required');
  if (!profiles || profiles.length === 0) throw createError(400, 'At least one profile must be assigned');
  if (!timezone) throw createError(400, 'Timezone is required');
  if (!startDateTime) throw createError(400, 'Start date/time is required');
  if (!endDateTime) throw createError(400, 'End date/time is required');
  if (!user.isAdmin && !profiles.map((profile) => profile.toString()).includes(user.id)) {
    throw createError(403, 'You can only create events assigned to yourself');
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const now = new Date();

  if (isNaN(start.getTime())) throw createError(400, 'Invalid start date/time');
  if (isNaN(end.getTime())) throw createError(400, 'Invalid end date/time');
  if (end <= start) throw createError(400, 'End date/time must be after start date/time');
  if (start < new Date(now.getTime() - 60000)) {
    throw createError(400, 'Event start date/time cannot be in the past');
  }

  // Verify profiles exist
  const existingProfiles = await Profile.find({ _id: { $in: profiles } }).lean();
  if (existingProfiles.length !== profiles.length) {
    throw createError(400, 'One or more selected profiles do not exist');
  }

  // Verify creator exists
  const creator = await Profile.findById(user.id).lean();
  if (!creator) throw createError(400, 'Creator profile does not exist');

  const event = await Event.create({
    title: title.trim(),
    description: description?.trim() || '',
    profiles,
    timezone,
    startDateTime: start,
    endDateTime: end,
    createdBy: user.id,
  });

  return Event.findById(event._id)
    .populate('profiles', 'name timezone')
    .populate('createdBy', 'name')
    .lean();
};

export const updateEvent = async (id, data, user) => {
  const existing = await Event.findById(id)
    .populate('profiles', 'name timezone')
    .lean();

  if (!existing) throw createError(404, 'Event not found');
  if (!user.isAdmin && !existing.profiles.some((p) => p._id.toString() === user.id)) {
    throw createError(404, 'Event not found');
  }

  const updates = {};
  const changes = [];

  for (const field of UPDATABLE_FIELDS) {
    if (data[field] === undefined) continue;

    let newValue = data[field];
    let oldValue = existing[field];

    if (field === 'title' || field === 'description') {
      newValue = typeof newValue === 'string' ? newValue.trim() : newValue;
      if (field === 'title' && !newValue) throw createError(400, 'Title cannot be empty');
    }

    if (field === 'startDateTime' || field === 'endDateTime') {
      newValue = new Date(newValue);
      if (isNaN(newValue.getTime())) throw createError(400, `Invalid ${FIELD_LABELS[field]}`);
      oldValue = existing[field]; // already a Date
    }

    if (field === 'profiles') {
      if (!Array.isArray(newValue) || newValue.length === 0) {
        throw createError(400, 'At least one profile must be assigned');
      }
      if (!user.isAdmin && !newValue.map((profile) => profile.toString()).includes(user.id)) {
        throw createError(403, 'You cannot remove yourself from an event');
      }
      const existingIds = await Profile.find({ _id: { $in: newValue } }).lean();
      if (existingIds.length !== newValue.length) {
        throw createError(400, 'One or more selected profiles do not exist');
      }
      // Compare as sorted string arrays
      const oldIds = existing.profiles.map((p) => p._id.toString()).sort();
      const newIds = newValue.map((p) => p.toString()).sort();
      if (JSON.stringify(oldIds) === JSON.stringify(newIds)) continue;

      // Store profile names in the log for readability
      const oldNames = existing.profiles.map((p) => p.name);
      const newProfiles = await Profile.find({ _id: { $in: newValue } }).select('name').lean();
      const newNames = newProfiles.map((p) => p.name);

      changes.push({
        field: FIELD_LABELS[field],
        previousValue: oldNames,
        updatedValue: newNames,
      });
      updates[field] = newValue;
      continue;
    }

    // Detect actual change
    const oldStr = oldValue instanceof Date ? oldValue.toISOString() : String(oldValue || '');
    const newStr = newValue instanceof Date ? newValue.toISOString() : String(newValue || '');
    if (oldStr === newStr) continue;

    changes.push({
      field: FIELD_LABELS[field] || field,
      previousValue: oldValue instanceof Date ? oldValue.toISOString() : oldValue,
      updatedValue: newValue instanceof Date ? newValue.toISOString() : newValue,
    });
    updates[field] = newValue;
  }

  if (Object.keys(updates).length === 0) {
    throw createError(400, 'No changes detected');
  }

  // Validate start < end after applying updates
  const finalStart = updates.startDateTime || existing.startDateTime;
  const finalEnd = updates.endDateTime || existing.endDateTime;
  if (new Date(finalEnd) <= new Date(finalStart)) {
    throw createError(400, 'End date/time must be after start date/time');
  }

  if (updates.startDateTime) {
    const now = new Date();
    if (new Date(updates.startDateTime) < new Date(now.getTime() - 60000)) {
      throw createError(400, 'Event start date/time cannot be in the past');
    }
  }

  // Save update log
  await EventLog.create({
    eventId: id,
    updatedBy: user.id,
    changes,
  });

  const updated = await Event.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('profiles', 'name timezone')
    .populate('createdBy', 'name')
    .lean();

  return updated;
};

export const getEventLogs = async (eventId, user) => {
  const event = await Event.findById(eventId).lean();
  if (!event) throw createError(404, 'Event not found');
  if (!user.isAdmin && !event.profiles.some((profileId) => profileId.toString() === user.id)) {
    throw createError(404, 'Event not found');
  }

  return EventLog.find({ eventId })
    .populate('updatedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();
};
