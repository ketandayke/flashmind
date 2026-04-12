import Card from '../models/Card.js';
import Deck from '../models/Deck.js';
import ReviewLog from '../models/ReviewLog.js';

// ─── GET /api/stats ───────────────────────────────────────────────────────────
/**
 * Global stats for the logged-in user across all decks.
 */
export const getGlobalStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [cardStats] = await Card.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalCards: { $sum: 1 },
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

    const totalDecks = await Deck.countDocuments({ userId, status: 'ready' });

    // Calculate Today's Stats from ReviewLogs
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysLogs = await ReviewLog.find({
      userId,
      createdAt: { $gte: startOfToday },
    }).lean();

    const reviewedToday = todaysLogs.length;
    const correctToday = todaysLogs.filter(l => l.rating !== 'again').length;
    const newlyLearned = todaysLogs.filter(l => l.wasNew && l.rating !== 'again').length;
    const accuracy = reviewedToday > 0 ? Math.round((correctToday / reviewedToday) * 100) : 0;

    // Detect weak topics (topics with most 'again'/'hard' ratings today)
    const weakTopicsMap = todaysLogs
      .filter(l => l.rating === 'again' || l.rating === 'hard')
      .reduce((acc, log) => {
        if (log.topic) {
          acc[log.topic] = (acc[log.topic] || 0) + (log.rating === 'again' ? 2 : 1);
        }
        return acc;
      }, {});

    const weakTopics = Object.entries(weakTopicsMap)
      .map(([topic, score]) => ({ topic, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.topic);

    res.status(200).json({
      success: true,
      stats: {
        totalDecks,
        totalCards: cardStats?.totalCards ?? 0,
        dueToday: cardStats?.dueToday ?? 0,
        streak: req.user.streak,
        lastStudiedAt: req.user.lastStudiedAt,
        learningStages: {
          new: cardStats?.newCards ?? 0,
          learning: cardStats?.learningCards ?? 0,
          practicing: cardStats?.practicingCards ?? 0,
          strong: cardStats?.strongCards ?? 0,
          mastered: cardStats?.masteredCards ?? 0,
        },
        today: {
          reviewed: reviewedToday,
          correct: correctToday,
          newlyLearned,
          accuracy,
          weakTopics,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/stats/deck/:deckId ──────────────────────────────────────────────
/**
 * Per-deck stats — total, mastered, due, topic breakdown.
 */
export const getDeckStatsRoute = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { deckId } = req.params;
    const now = new Date();

    const deck = await Deck.findOne({ _id: deckId, userId });
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    const [totals] = await Card.aggregate([
      { $match: { deckId: deck._id, userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          dueToday: { $sum: { $cond: [{ $lte: ['$nextReviewDate', now] }, 1, 0] } },
          avgEaseFactor: { $avg: '$easeFactor' },
          newCards: { $sum: { $cond: [{ $eq: ['$repetitions', 0] }, 1, 0] } },
          learningCards: { $sum: { $cond: [{ $and: [{ $gt: ['$repetitions', 0] }, { $lte: ['$repetitions', 3] }] }, 1, 0] } },
          practicingCards: { $sum: { $cond: [{ $and: [{ $gt: ['$repetitions', 3] }, { $lte: ['$interval', 7] }] }, 1, 0] } },
          strongCards: { $sum: { $cond: [{ $and: [{ $gt: ['$interval', 7] }, { $lte: ['$interval', 21] }] }, 1, 0] } },
          masteredCards: { $sum: { $cond: [{ $gt: ['$interval', 21] }, 1, 0] } },
        },
      },
    ]);

    const byTopic = await Card.aggregate([
      { $match: { deckId: deck._id, userId } },
      {
        $group: {
          _id: '$topic',
          total: { $sum: 1 },
          mastered: { $sum: { $cond: ['$mastered', 1, 0] } },
          due: { $sum: { $cond: [{ $lte: ['$nextReviewDate', now] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      deckId: deck._id,
      title: deck.title,
      status: deck.status,
      stats: {
        total: totals?.total ?? 0,
        dueToday: totals?.dueToday ?? 0,
        avgEaseFactor: totals ? parseFloat(totals.avgEaseFactor.toFixed(2)) : 0,
        learningStages: {
          new: totals?.newCards ?? 0,
          learning: totals?.learningCards ?? 0,
          practicing: totals?.practicingCards ?? 0,
          strong: totals?.strongCards ?? 0,
          mastered: totals?.masteredCards ?? 0,
        },
        byTopic,
      },
    });
  } catch (error) {
    next(error);
  }
};
