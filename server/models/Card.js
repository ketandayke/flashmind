import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Content ──────────────────────────────────────────────────────────────
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
    hint: {
      type: String,
      default: '',
    },
    topic: {
      type: String, // e.g. "Quadratic Formula" — short concept label from LLM
      default: '',
      index: true,
    },

    // ── SM-2 Spaced Repetition Fields ─────────────────────────────────────────
    interval: {
      type: Number,
      default: 1, // days until next review
    },
    easeFactor: {
      type: Number,
      default: 2.5, // SM-2 default
    },
    repetitions: {
      type: Number,
      default: 0,
    },
    nextReviewDate: {
      type: Date,
      default: Date.now,
    },
    lastRating: {
      type: String,
      enum: ['easy', 'hard', 'again', null],
      default: null,
    },
    mastered: {
      type: Boolean,
      default: false, // true when interval > 21 days
    },
  },
  { timestamps: true }
);

// Compound index — primary query: "give me cards due today for this user"
cardSchema.index({ userId: 1, nextReviewDate: 1 });
// Secondary query: "all cards in this deck"
cardSchema.index({ deckId: 1 });

export default mongoose.model('Card', cardSchema);
