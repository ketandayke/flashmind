import { createRequire } from 'module';

// pdf-parse is a CommonJS module and its index.js tries to load a test PDF
// on import. We bypass that by importing the core function directly.
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

/**
 * Extract raw text from a PDF buffer.
 * @param {Buffer} buffer - PDF file buffer from multer memoryStorage
 * @returns {Promise<string>} Raw extracted text
 */
export const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains only images/scanned content with no extractable text.');
    }

    // Normalize whitespace: collapse multiple newlines, trim
    const cleanText = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')  // collapse triple+ newlines to double
      .replace(/[ \t]{2,}/g, ' ')  // collapse multiple spaces/tabs
      .trim();

    return cleanText;
  } catch (error) {
    if (error.message.includes('empty or contains')) throw error;
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};
