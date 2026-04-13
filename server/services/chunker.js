/**
 * Splits extracted PDF text into overlapping chunks for LLM processing.
 *
 * Strategy:
 *  - Estimate tokens as: characters / 4  (good enough without a tokenizer)
 *  - Target chunk size : 500 tokens (~2000 chars)
 *  - Overlap           : 50  tokens (~200  chars) — prevents losing ideas at boundaries
 *  - Split on paragraph breaks first, then enforce size limits
 */

const CHUNK_SIZE_CHARS = 12000; // ≈ 3000 tokens
const OVERLAP_CHARS = 500;     // ≈ 125 tokens

/**
 * Remove common PDF extraction noise before chunking:
 *  - Standalone figure/table captions
 *  - Page numbers
 *  - Header/footer repetitions (very short lines that appear repeatedly)
 *  - Lines that are purely numbers or symbols
 */
const cleanText = (text) => {
  const lines = text.split('\n');

  // Track which short lines repeat (likely headers/footers)
  const freq = {};
  lines.forEach((l) => {
    const k = l.trim().toLowerCase();
    if (k.length > 0 && k.length < 60) freq[k] = (freq[k] || 0) + 1;
  });

  return lines
    .filter((line) => {
      const t = line.trim();
      if (!t) return true; // keep blank lines for paragraph detection

      // Remove standalone page numbers: "1", "12", "- 3 -", "Page 3"
      if (/^[-–]?\s*(page\s*)?\d+\s*[-–]?$/i.test(t)) return false;

      // Remove standalone figure/table captions
      if (/^(fig(ure)?\.?\s*\d|table\s*\d|image\s*\d|diagram\s*\d)/i.test(t)) return false;

      // Remove very short lines that repeat 3+ times (headers/footers)
      if (t.length < 60 && freq[t.toLowerCase()] >= 3) return false;

      // Remove lines that are purely symbols/bullets/dashes
      if (/^[•·\-–—=_*#|]{2,}$/.test(t)) return false;

      return true;
    })
    .join('\n');
};

/**
 * Split text into overlapping chunks.
 * @param {string} text - Raw text from pdfParser
 * @returns {string[]} Array of text chunks
 */
export const chunkText = (text) => {
  const cleaned = cleanText(text);

  // Split into paragraphs (double newline separators)
  const paragraphs = cleaned
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph stays within limit, append it
    if ((currentChunk + '\n\n' + paragraph).length <= CHUNK_SIZE_CHARS) {
      currentChunk = currentChunk ? currentChunk + '\n\n' + paragraph : paragraph;
    } else {
      // Flush current chunk if it has content
      if (currentChunk) {
        chunks.push(currentChunk.trim());

        // Carry overlap from the end of the current chunk into the next
        const overlap = currentChunk.slice(-OVERLAP_CHARS);
        currentChunk = overlap + '\n\n' + paragraph;
      } else {
        // Single paragraph larger than CHUNK_SIZE — hard split it
        const hardChunks = hardSplit(paragraph);
        // Keep last piece as current chunk with overlap
        const last = hardChunks.pop();
        chunks.push(...hardChunks);
        currentChunk = last;
      }
    }
  }

  // Push the last remaining chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Filter out chunks that are too short to be useful (< 100 chars)
  return chunks.filter((c) => c.length >= 100);
};

/**
 * Hard-splits a single oversized string into CHUNK_SIZE_CHARS pieces with overlap.
 * @param {string} text
 * @returns {string[]}
 */
const hardSplit = (text) => {
  const result = [];
  let start = 0;

  while (start < text.length) {
    const end = start + CHUNK_SIZE_CHARS;
    result.push(text.slice(start, end).trim());
    start = end - OVERLAP_CHARS; // step back by overlap amount
  }

  return result.filter((c) => c.length > 0);
};
