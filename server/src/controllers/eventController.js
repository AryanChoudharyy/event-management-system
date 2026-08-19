import * as eventService from '../services/eventService.js';
import { asyncHandler } from '../utils/helpers.js';

export const getEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getAllEvents(req.query, req.user);
  res.json({ success: true, data: events });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id, req.user);
  res.json({ success: true, data: event });
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user);
  res.status(201).json({ success: true, data: event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body, req.user);
  res.json({ success: true, data: event });
});

export const getEventLogs = asyncHandler(async (req, res) => {
  const logs = await eventService.getEventLogs(req.params.id, req.user);
  res.json({ success: true, data: logs });
});
