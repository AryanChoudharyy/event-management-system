import { Router } from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  getEventLogs,
} from '../controllers/eventController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', createEvent);
router.patch('/:id', updateEvent);
router.get('/:id/logs', getEventLogs);

export default router;
