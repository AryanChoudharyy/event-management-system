import { Router } from 'express';
import { getCurrentIdentity, listIdentities, logout, selectIdentity } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/identities', listIdentities);
router.post('/select-profile', selectIdentity);
router.get('/me', requireAuth, getCurrentIdentity);
router.post('/logout', logout);

export default router;
