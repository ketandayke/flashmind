import fs from 'fs/promises';
import pLimit from 'p-limit';
import { extractTextFromPDF } from './pdfParser.js';
import { chunkText } from './chunker.js';
import { generateCardsFromChunk } from './llmClient.js';
import Deck from '../models/Deck.js';
import Card from '../models/Card.js';

// Max 3 concurrent Groq calls — stays within free tier rate limits
const limit = pLimit(3);

/**
 * Kick off the processing pipeline from a saved temp file path.
 * Fire-and-forget: controller does NOT await this.
 *
 * @param {string} filePath - Absolute path to the temp PDF file
 * @param {string} deckId   - MongoDB Deck _id
 * @param {string} userId   - MongoDB User _id
 */
export const processPDFInBackground = (filePath, deckId, userId) => {
  _runPipeline(filePath, deckId, userId).catch((err) => {
    console.error(`🔥 Unhandled pipeline error for deck ${deckId}:`, err.message);
  });
};

const _runPipeline = async (filePath, deckId, userId) => {
  console.log(`🔄 [${deckId}] Pipeline started — file: ${filePath}`);

  try {
    // ── Step 1: Read temp file into buffer ────────────────────────────────
    const pdfBuffer = await fs.readFile(filePath);
    console.log(`📂 [${deckId}] Read ${(pdfBuffer.length / 1024).toFixed(1)} KB from disk`);

    // ── Step 2: Extract text from PDF ─────────────────────────────────────
    const rawText = await extractTextFromPDF(pdfBuffer);
    console.log(`📄 [${deckId}] Extracted ${rawText.length} chars`);

    // ── Step 3: Split into chunks ─────────────────────────────────────────
    const chunks = chunkText(rawText);
    console.log(`✂️  [${deckId}] ${chunks.length} chunks created`);

    if (chunks.length === 0) {
      throw new Error('No usable text chunks found in PDF');
    }

    // ── Step 4: LLM calls (rate-limited, parallel) ────────────────────────
    console.log(`🤖 [${deckId}] Calling Groq for ${chunks.length} chunks...`);

    const chunkResults = await Promise.all(
      chunks.map((chunk, i) =>
        limit(async () => {
          console.log(`   → Chunk ${i + 1}/${chunks.length}`);
          return generateCardsFromChunk(chunk);
        })
      )
    );

    const allCards = chunkResults.flat();
    console.log(`🃏 [${deckId}] Raw cards generated: ${allCards.length}`);

    if (allCards.length === 0) {
      throw new Error('LLM could not generate any valid flashcards from this PDF');
    }

    // ── Step 5: Deduplicate by front text ─────────────────────────────────
    const seen = new Set();
    const uniqueCards = allCards.filter((card) => {
      const key = card.front.toLowerCase().slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`🔎 [${deckId}] Unique cards after dedup: ${uniqueCards.length}`);

    // ── Step 6: Bulk insert cards ─────────────────────────────────────────
    const cardDocs = uniqueCards.map((card) => ({
      deckId,
      userId,
      front: card.front,
      back: card.back,
      hint: card.hint,
      topic: card.topic,
    }));

    await Card.insertMany(cardDocs, { ordered: false });

    // ── Step 7: Mark deck as ready ────────────────────────────────────────
    await Deck.findByIdAndUpdate(deckId, {
      status: 'ready',
      cardCount: uniqueCards.length,
      errorMessage: null,
    });

    console.log(`✅ [${deckId}] Done — ${uniqueCards.length} cards saved`);
  } catch (error) {
    console.error(`❌ [${deckId}] Pipeline failed: ${error.message}`);

    await Deck.findByIdAndUpdate(deckId, {
      status: 'failed',
      errorMessage: error.message,
    }).catch(() => {});
  } finally {
    // ── Always delete the temp file ───────────────────────────────────────
    try {
      await fs.unlink(filePath);
      console.log(`🗑️  [${deckId}] Temp file deleted: ${filePath}`);
    } catch (unlinkErr) {
      // File may already be gone — log but don't throw
      console.warn(`⚠️  [${deckId}] Could not delete temp file: ${unlinkErr.message}`);
    }
  }
};
