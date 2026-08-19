import * as profileService from '../services/profileService.js';
import { asyncHandler } from '../utils/helpers.js';

export const getProfiles = asyncHandler(async (req, res) => {
  const profiles = await profileService.getVisibleProfiles(req.user);
  res.json({ success: true, data: profiles });
});

export const createProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.createProfile(req.body, req.user);
  res.status(201).json({ success: true, data: profile });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfile(req.params.id, req.body, req.user);
  res.json({ success: true, data: profile });
});

export const getEventRelatedProfiles = asyncHandler(async (req, res) => {
  const profiles = await profileService.getEventRelatedProfiles(req.user);
  res.json({ success: true, data: profiles });
});

export const getAssignableProfiles = asyncHandler(async (req, res) => {
  const profiles = await profileService.getAssignableProfiles();
  res.json({ success: true, data: profiles });
});
