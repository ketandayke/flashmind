import Card from '../models/Card.js';
import Deck from '../models/Deck.js';
import ReviewLog from '../models/ReviewLog.js';
import { applyReview } from '../services/sm2.js';

// ─── POST /api/review/:cardId ─────────────────────────────────────────────────
/**
 * Submit a review rating for a card.
 * Body: { rating: "easy" | "hard" | "again" }
 *
 * Returns updated SM-2 fields so frontend can update local state immediately.
 */
export const submitReview = async (req, res, next) => {
  try {
    const { rating } = req.body;

    if (!['easy', 'hard', 'again'].includes(rating)) {
      return res.status(400).json({
        success: false,
        message: 'rating must be "easy", "hard", or "again"',
      });
    }

    // Fetch card — must belong to this user
    const card = await Card.findOne({
      _id: req.params.cardId,
      userId: req.user._id,
    });

    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const wasMastered = card.mastered;
    const wasNew = card.repetitions === 0;

    // Apply SM-2 algorithm — returns updated fields
    const updates = applyReview(card, rating);

    // Write updates to DB
    Object.assign(card, updates);
    await card.save();

    // Log this review interaction for gamified stats
    await ReviewLog.create({
      userId: req.user._id,
      cardId: card._id,
      deckId: card.deckId,
      topic: card.topic,
      rating,
      wasNew,
    });

    // If mastery status changed, sync deck's masteredCount
    const masteredDelta = Number(card.mastered) - Number(wasMastered);
    if (masteredDelta !== 0) {
      await Deck.findByIdAndUpdate(card.deckId, {
        $inc: { masteredCount: masteredDelta },
      });
    }

    res.status(200).json({
      success: true,
      cardId: card._id,
      rating,
      nextReviewDate: card.nextReviewDate,
      interval: card.interval,
      easeFactor: card.easeFactor,
      repetitions: card.repetitions,
      mastered: card.mastered,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/review/session/:deckId ─────────────────────────────────────────
/**
 * Start a review session for a deck.
 * Returns all due cards (shuffled) for the session.
 */
export const startReviewSession = async (req, res, next) => {
  try {
    const { topic } = req.query;
    const isMixed = req.params.deckId === 'mixed';
    
    const query = {
      userId: req.user._id,
      nextReviewDate: { $lte: new Date() },
    };

    if (!isMixed) {
      query.deckId = req.params.deckId;
    }

    if (topic && !isMixed) {
      query.topic = topic;
    }

    const cards = await Card.find(query)
      .select('front back hint topic interval easeFactor repetitions mastered lastRating deckId')
      .lean();

    if (cards.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No cards due for review.',
        cards: [],
        count: 0,
      });
    }

    // Shuffle for variety
    const shuffled = cards.sort(() => Math.random() - 0.5);

    res.status(200).json({
      success: true,
      count: shuffled.length,
      cards: shuffled,
    });
  } catch (error) {
    next(error);
  }
};
