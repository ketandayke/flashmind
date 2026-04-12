import dayjs from 'dayjs';

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Ratings:
 *   "easy"  → q = 5  (recalled perfectly)
 *   "hard"  → q = 3  (recalled with difficulty)
 *   "again" → q = 0  (failed — reset)
 *
 * Returns updated card fields (does NOT save to DB — caller handles that).
 *
 * @param {Object} card   - Mongoose card document (plain values)
 * @param {string} rating - "easy" | "hard" | "again"
 * @returns {Object}      - Updated fields: interval, easeFactor, repetitions, nextReviewDate, mastered, lastRating
 */
export const applyReview = (card, rating) => {
  const q = rating === 'easy' ? 5 : rating === 'hard' ? 3 : 0;

  let { interval, easeFactor, repetitions } = card;

  if (q < 3) {
    // Failed — reset progress, review again tomorrow
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall — grow interval using SM-2 schedule
    if (repetitions === 0)      interval = 1;
    else if (repetitions === 1) interval = 6;
    else                        interval = Math.round(interval * easeFactor);

    repetitions += 1;
  }

  // Update ease factor — min 1.3 per SM-2 spec
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  const nextReviewDate = dayjs().add(interval, 'day').toDate();
  const mastered = interval > 21; // mastered after ~3 weeks of consistent recall

  return {
    interval,
    easeFactor: parseFloat(easeFactor.toFixed(4)),
    repetitions,
    nextReviewDate,
    mastered,
    lastRating: rating,
  };
};
