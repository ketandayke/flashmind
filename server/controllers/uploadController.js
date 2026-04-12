import Deck from '../models/Deck.js';
import Card from '../models/Card.js';
import { processPDFInBackground } from '../services/processingQueue.js';

// ─── POST /api/upload ─────────────────────────────────────────────────────────
export const uploadDeck = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded. Use field name "pdf".',
      });
    }

    const deckTitle = req.file.originalname.replace(/\.pdf$/i, '').trim() || 'Untitled Deck';

    // Create deck with "processing" status
    const deck = await Deck.create({
      userId: req.user._id,
      title: deckTitle,
      sourceFile: req.file.originalname,
      status: 'processing',
    });

    // Fire background pipeline with the saved temp file path
    processPDFInBackground(req.file.path, deck._id, req.user._id);

    res.status(202).json({
      success: true,
      message: 'PDF uploaded. Flashcards are being generated.',
      deckId: deck._id,
      title: deck.title,
      status: 'processing',
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/upload/status/:deckId ──────────────────────────────────────────
export const getUploadStatus = async (req, res, next) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.deckId,
      userId: req.user._id,
    }).select('status cardCount errorMessage title createdAt');

    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    res.status(200).json({
      success: true,
      deckId: deck._id,
      title: deck.title,
      status: deck.status,
      cardCount: deck.cardCount,
      errorMessage: deck.errorMessage,
      createdAt: deck.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/upload/preview/:deckId ─────────────────────────────────────────
export const previewDeck = async (req, res, next) => {
  try {
    const deck = await Deck.findOne({ _id: req.params.deckId, userId: req.user._id });

    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    if (deck.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: `Deck is still ${deck.status}. Cannot preview yet.`,
      });
    }

    const cards = await Card.find({ deckId: deck._id })
      .select('front back hint topic')
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      deck: { _id: deck._id, title: deck.title, cardCount: deck.cardCount },
      preview: cards,
    });
  } catch (error) {
    next(error);
  }
};
