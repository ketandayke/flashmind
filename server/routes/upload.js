import express from 'express';
import { upload } from '../config/multer.js';
import { uploadDeck, getUploadStatus, previewDeck } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All upload routes are protected
router.use(protect);

// POST /api/upload — multipart PDF upload
// multer runs first (parses file), then controller
router.post('/', upload.single('pdf'), uploadDeck);

// GET /api/upload/status/:deckId — poll processing status
router.get('/status/:deckId', getUploadStatus);

// GET /api/upload/preview/:deckId — preview first 5 cards
router.get('/preview/:deckId', previewDeck);

export default router;
