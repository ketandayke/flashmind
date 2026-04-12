import {
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  getDueCards,
} from '../services/cardService.js';

// ─── GET /api/cards/:id ───────────────────────────────────────────────────────
export const getCard = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.id, req.user._id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    res.status(200).json({ success: true, card });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/cards/due ───────────────────────────────────────────────────────
// Global due cards across ALL decks (no deckId filter)
export const getAllDueCards = async (req, res, next) => {
  try {
    const cards = await getDueCards(req.user._id, null);
    res.status(200).json({ success: true, count: cards.length, cards });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/cards ──────────────────────────────────────────────────────────
export const addCard = async (req, res, next) => {
  try {
    const { deckId, front, back, hint, topic } = req.body;

    if (!deckId || !front?.trim() || !back?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'deckId, front, and back are required',
      });
    }

    if (front.length > 300) return res.status(400).json({ success: false, message: 'Front concept must be under 300 characters.' });
    if (back.length > 1000) return res.status(400).json({ success: false, message: 'Back explanation must be under 1000 characters.' });
    if (hint && hint.length > 200) return res.status(400).json({ success: false, message: 'Hint must be under 200 characters.' });
    if (topic && topic.length > 60) return res.status(400).json({ success: false, message: 'Topic must be under 60 characters.' });

    const card = await createCard({
      deckId,
      userId: req.user._id,
      front: front.trim(),
      back: back.trim(),
      hint: hint?.trim() || '',
      topic: topic?.trim() || '',
    });

    res.status(201).json({ success: true, card });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/cards/:id ─────────────────────────────────────────────────────
export const editCard = async (req, res, next) => {
  try {
    const { front, back, hint, topic } = req.body;
    
    if (front && front.length > 300) return res.status(400).json({ success: false, message: 'Front concept must be under 300 characters.' });
    if (back && back.length > 1000) return res.status(400).json({ success: false, message: 'Back explanation must be under 1000 characters.' });
    if (hint && hint.length > 200) return res.status(400).json({ success: false, message: 'Hint must be under 200 characters.' });
    if (topic && topic.length > 60) return res.status(400).json({ success: false, message: 'Topic must be under 60 characters.' });

    const card = await updateCard(req.params.id, req.user._id, req.body);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    res.status(200).json({ success: true, card });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/cards/:id ────────────────────────────────────────────────────
export const removeCard = async (req, res, next) => {
  try {
    const card = await deleteCard(req.params.id, req.user._id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    res.status(200).json({ success: true, message: 'Card deleted' });
  } catch (error) {
    next(error);
  }
};
