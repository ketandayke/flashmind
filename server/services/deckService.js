import Deck from '../models/Deck.js';
import Card from '../models/Card.js';

/**
 * Get all decks for a user, sorted newest first.
 * Includes live card/mastered counts via aggregation.
 */
export const getUserDecks = async (userId) => {
  const decks = await Deck.find({ userId }).sort({ createdAt: -1 }).lean();
  
  const now = new Date();
  const stats = await Card.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$deckId',
        cardCount: { $sum: 1 },
        dueCount: { $sum: { $cond: [{ $lte: ['$nextReviewDate', now] }, 1, 0] } },
        masteredCount: { $sum: { $cond: [{ $gt: ['$interval', 21] }, 1, 0] } }
      }
    }
  ]);

  const statsMap = stats.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr;
    return acc;
  }, {});

  return decks.map(deck => {
    const deckStats = statsMap[deck._id.toString()] || { cardCount: 0, dueCount: 0, masteredCount: 0 };
    return {
      ...deck,
      cardCount: deckStats.cardCount,
      dueCount: deckStats.dueCount,
      masteredCount: deckStats.masteredCount,
    };
  });
};

/**
 * Get a single deck by ID — must belong to user.
 */
export const getDeckById = async (deckId, userId) => {
  const deck = await Deck.findOne({ _id: deckId, userId }).lean();
  return deck; // null if not found or not owner
};

/**
 * Rename a deck.
 */
export const updateDeck = async (deckId, userId, { title }) => {
  const deck = await Deck.findOneAndUpdate(
    { _id: deckId, userId },
    { title: title.trim() },
    { new: true, runValidators: true }
  );
  return deck;
};

/**
 * Delete a deck and all its cards.
 */
export const deleteDeck = async (deckId, userId) => {
  const deck = await Deck.findOneAndDelete({ _id: deckId, userId });
  if (deck) {
    await Card.deleteMany({ deckId });
  }
  return deck;
};

/**
 * Get per-deck stats (total, mastered, due today, by topic).
 */
export const getDeckStats = async (deckId, userId) => {
  const now = new Date();

  const [totals] = await Card.aggregate([
    { $match: { deckId: deckId, userId: userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        dueToday: {
          $sum: { $cond: [{ $lte: ['$nextReviewDate', now] }, 1, 0] },
        },
        newCards: { $sum: { $cond: [{ $eq: ['$repetitions', 0] }, 1, 0] } },
        learningCards: { $sum: { $cond: [{ $and: [{ $gt: ['$repetitions', 0] }, { $lte: ['$repetitions', 3] }] }, 1, 0] } },
        practicingCards: { $sum: { $cond: [{ $and: [{ $gt: ['$repetitions', 3] }, { $lte: ['$interval', 7] }] }, 1, 0] } },
        strongCards: { $sum: { $cond: [{ $and: [{ $gt: ['$interval', 7] }, { $lte: ['$interval', 21] }] }, 1, 0] } },
        masteredCards: { $sum: { $cond: [{ $gt: ['$interval', 21] }, 1, 0] } },
      },
    },
  ]);

  // Cards grouped by topic
  const byTopic = await Card.aggregate([
    { $match: { deckId: deckId, userId: userId } },
    {
      $group: {
        _id: '$topic',
        count: { $sum: 1 },
        mastered: { $sum: { $cond: ['$mastered', 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return {
    total: totals?.total ?? 0,
    dueToday: totals?.dueToday ?? 0,
    learningStages: {
      new: totals?.newCards ?? 0,
      learning: totals?.learningCards ?? 0,
      practicing: totals?.practicingCards ?? 0,
      strong: totals?.strongCards ?? 0,
      mastered: totals?.masteredCards ?? 0,
    },
    byTopic,
  };
};
