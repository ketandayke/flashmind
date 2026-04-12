import express from 'express';
import {
  listDecks,
  getDeck,
  renameDeck,
  removeDeck,
  getDeckCards,
  getDeckDueCards,
  deckStats,
} from '../controllers/deckController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/',           listDecks);        // GET  /api/decks
router.get('/:id',        getDeck);          // GET  /api/decks/:id
router.patch('/:id',      renameDeck);       // PATCH /api/decks/:id
router.delete('/:id',     removeDeck);       // DELETE /api/decks/:id

router.get('/:id/cards',  getDeckCards);     // GET  /api/decks/:id/cards
router.get('/:id/cards/due', getDeckDueCards); // GET /api/decks/:id/cards/due
router.get('/:id/stats',  deckStats);        // GET  /api/decks/:id/stats

export default router;
