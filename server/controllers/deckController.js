import {
  getUserDecks,
  getDeckById,
  updateDeck,
  deleteDeck,
  getDeckStats,
} from '../services/deckService.js';
import { getCardsByDeck, getDueCards } from '../services/cardService.js';

// ─── GET /api/decks ───────────────────────────────────────────────────────────
export const listDecks = async (req, res, next) => {
  try {
    const decks = await getUserDecks(req.user._id);
    res.status(200).json({ success: true, count: decks.length, decks });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/decks/:id ───────────────────────────────────────────────────────
export const getDeck = async (req, res, next) => {
  try {
    const deck = await getDeckById(req.params.id, req.user._id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }
    res.status(200).json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/decks/:id ─────────────────────────────────────────────────────
export const renameDeck = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const deck = await updateDeck(req.params.id, req.user._id, { title });
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    res.status(200).json({ success: true, deck });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/decks/:id ────────────────────────────────────────────────────
export const removeDeck = async (req, res, next) => {
  try {
    const deck = await deleteDeck(req.params.id, req.user._id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    res.status(200).json({
      success: true,
      message: `Deck "${deck.title}" and all its cards have been deleted`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/decks/:id/cards ─────────────────────────────────────────────────
export const getDeckCards = async (req, res, next) => {
  try {
    const deck = await getDeckById(req.params.id, req.user._id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    const cards = await getCardsByDeck(req.params.id, req.user._id);
    res.status(200).json({ success: true, count: cards.length, cards });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/decks/:id/cards/due ────────────────────────────────────────────
export const getDeckDueCards = async (req, res, next) => {
  try {
    const deck = await getDeckById(req.params.id, req.user._id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    const cards = await getDueCards(req.user._id, req.params.id);
    res.status(200).json({ success: true, count: cards.length, cards });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/decks/:id/stats ─────────────────────────────────────────────────
export const deckStats = async (req, res, next) => {
  try {
    const deck = await getDeckById(req.params.id, req.user._id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    const stats = await getDeckStats(req.params.id, req.user._id);
    res.status(200).json({ success: true, deckId: deck._id, title: deck.title, ...stats });
  } catch (error) {
    next(error);
  }
};
