import { Router } from 'express';
import { getProfiles, createProfile, updateProfile, getEventRelatedProfiles, getAssignableProfiles } from '../controllers/profileController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProfiles);
router.get('/event-related', getEventRelatedProfiles);
router.get('/assignable', getAssignableProfiles);
router.post('/', requireAdmin, createProfile);
router.patch('/:id', updateProfile);

export default router;
