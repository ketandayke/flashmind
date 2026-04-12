import express from 'express';
import { getGlobalStats, getDeckStatsRoute } from '../controllers/statsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/',            getGlobalStats);    // GET /api/stats
router.get('/deck/:deckId', getDeckStatsRoute);  // GET /api/stats/deck/:deckId

export default router;
