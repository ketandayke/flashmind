import express from 'express';
import {
  getCard,
  getAllDueCards,
  addCard,
  editCard,
  removeCard,
} from '../controllers/cardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// IMPORTANT: /due must come before /:id — otherwise Express matches "due" as :id
router.get('/due',   getAllDueCards);  // GET  /api/cards/due  (all decks)
router.get('/:id',   getCard);        // GET  /api/cards/:id
router.post('/',     addCard);        // POST /api/cards
router.patch('/:id', editCard);       // PATCH /api/cards/:id
router.delete('/:id',removeCard);     // DELETE /api/cards/:id

export default router;
