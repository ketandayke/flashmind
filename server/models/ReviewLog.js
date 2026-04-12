import mongoose from 'mongoose';

const reviewLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },
    topic: {
      type: String,
      default: '',
    },
    rating: {
      type: String,
      enum: ['again', 'hard', 'easy'],
      required: true,
    },
    wasNew: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for fast querying of today's stats and weak topics
reviewLogSchema.index({ userId: 1, createdAt: -1 });
reviewLogSchema.index({ userId: 1, topic: 1 });

export default mongoose.model('ReviewLog', reviewLogSchema);
