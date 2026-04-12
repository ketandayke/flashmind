import Card from '../models/Card.js';
import Deck from '../models/Deck.js';

/**
 * Get all cards in a deck.
 */
export const getCardsByDeck = async (deckId, userId) => {
  return Card.find({ deckId, userId }).sort({ topic: 1, createdAt: 1 }).lean();
};

/**
 * Get cards due for review.
 * - If deckId provided: due cards for that specific deck
 * - If deckId is null: all due cards across all decks
 */
export const getDueCards = async (userId, deckId = null) => {
  const query = {
    userId,
    nextReviewDate: { $lte: new Date() },
  };
  if (deckId) query.deckId = deckId;

  return Card.find(query)
    .sort({ nextReviewDate: 1 }) // oldest due first
    .lean();
};

/**
 * Get single card — must belong to user.
 */
export const getCardById = async (cardId, userId) => {
  return Card.findOne({ _id: cardId, userId }).lean();
};

/**
 * Manually create a card and increment deck cardCount.
 */
export const createCard = async ({ deckId, userId, front, back, hint, topic }) => {
  const card = await Card.create({ deckId, userId, front, back, hint, topic });
  await Deck.findByIdAndUpdate(deckId, { $inc: { cardCount: 1 } });
  return card;
};

/**
 * Update card content (front/back/hint/topic).
 */
export const updateCard = async (cardId, userId, updates) => {
  const allowed = ['front', 'back', 'hint', 'topic'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  return Card.findOneAndUpdate({ _id: cardId, userId }, filtered, {
    new: true,
    runValidators: true,
  });
};

/**
 * Delete a card and decrement deck cardCount.
 */
export const deleteCard = async (cardId, userId) => {
  const card = await Card.findOneAndDelete({ _id: cardId, userId });
  if (card) {
    await Deck.findByIdAndUpdate(card.deckId, {
      $inc: { cardCount: -1, masteredCount: card.mastered ? -1 : 0 },
    });
  }
  return card;
};
