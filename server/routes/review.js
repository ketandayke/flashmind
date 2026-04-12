import express from 'express';
import { submitReview, startReviewSession } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/session/:deckId', startReviewSession); // GET  /api/review/session/:deckId
router.post('/:cardId',        submitReview);        // POST /api/review/:cardId

export default router;
