import mongoose from 'mongoose';

const deckSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sourceFile: {
      type: String, // original filename, stored for display only
      default: null,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    cardCount: {
      type: Number,
      default: 0,
    },
    masteredCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Deck', deckSchema);
