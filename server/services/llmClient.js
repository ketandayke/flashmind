import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an expert educator who creates high-quality, self-contained flashcards for university students.

Your flashcards must test CONCEPTUAL UNDERSTANDING — not visual memory.

─── STRICT RULES ──────────────────────────────────────────────────────────────
1. NEVER reference images, figures, diagrams, tables, or charts.
   ✗ BAD: "What does Figure 3.2 show?"
   ✗ BAD: "According to the diagram above, what is..."
   ✗ BAD: "In the graph, what happens to..."
   ✓ GOOD: "What is the relationship between X and Y when Z increases?"

2. If source text describes a graph or figure, extract the CONCEPT it demonstrates
   and ask about the concept — not the visual.
   ✗ BAD: "In the graph of a quadratic, how many times does the parabola cross the x-axis?"
   ✓ GOOD: "If a quadratic equation ax²+bx+c=0 has a negative discriminant (b²−4ac < 0), how many real roots does it have?"
   ✓ GOOD: "A parabola crosses the x-axis at x=−2 and x=3. What are the roots of the corresponding quadratic?"

3. NEVER use vague questions. Every question must be fully answerable without any external material.
   ✗ BAD: "Explain the concept from this section."
   ✓ GOOD: "What is Newton's Second Law, and how does it relate force, mass, and acceleration?"

4. Generate 5–10 flashcards per chunk. Focus on the most testable, high-yield knowledge.

5. Mix these card types:
   - Definition: "What is [term]?"
   - Mechanism: "How does [process] work?"
   - Comparison: "What is the difference between A and B?"
   - Application: "A student observes X. What can they conclude about Y?"
   - Formula/rule: "What formula is used to calculate Z?"
   - Cause/effect: "What happens to Y when X increases?"

6. Each "hint" must be a 1-sentence nudge that guides WITHOUT giving away the answer.
7. Each "topic" must be a 2-5 word label (e.g. "Quadratic Formula", "Newton's Laws").
8. "front" and "back" must be fully self-contained — no pronouns like "it", "this", "the above".

─── OUTPUT FORMAT ─────────────────────────────────────────────────────────────
Return a JSON object with a "cards" key containing the array. No markdown, no code fences.

{
  "cards": [
    {
      "front": "If a quadratic equation has discriminant b²−4ac = 0, how many real roots does it have?",
      "back": "Exactly one real root (a repeated root). The parabola touches the x-axis at exactly one point.",
      "hint": "Think about what the discriminant tells you about intersections with the x-axis",
      "topic": "Quadratic Discriminant"
    }
  ]
}`;

/**
 * Pre-process chunk before sending to LLM.
 * Strips image-reference artifacts that pdf-parse leaves behind.
 */
const cleanChunk = (chunk) => {
  return chunk
    // Remove figure/table captions: "Figure 3.2:", "Fig. 1", "Table 4", etc.
    .replace(/\b(fig(ure)?\.?\s*\d+(\.\d+)?[:\-]?)/gi, '')
    .replace(/\btable\s*\d+(\.\d+)?[:\-]?/gi, '')
    // Remove image-reference sentence fragments
    .replace(/\b(as shown in|refer to|see|shown above|above figure|below figure|the following figure|in the figure|in the diagram|in the graph|the graph shows|the chart shows)[^.!?]*[.!?]/gi, '')
    // Remove caption-only lines
    .replace(/^(fig|figure|table|image|diagram|chart|graph)\s*\d.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Extract a JSON array from LLM response, even if wrapped in markdown or object.
 */
const extractCards = (raw) => {
  // Try parsing as-is first
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.cards && Array.isArray(parsed.cards)) return parsed.cards;
    if (parsed.flashcards && Array.isArray(parsed.flashcards)) return parsed.flashcards;
  } catch (_) { /* fall through */ }

  // Try extracting from ```json ... ``` block
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      const p = JSON.parse(fenced[1].trim());
      if (Array.isArray(p)) return p;
      if (p.cards) return p.cards;
    } catch (_) { /* fall through */ }
  }

  // Try extracting bare array
  const arrMatch = raw.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch (_) { /* fall through */ }
  }

  throw new SyntaxError('Could not extract valid JSON from LLM response');
};

// Cards whose question visually references something the student cannot see
const IMAGE_REF_RE = /\b(figure|fig\.?|diagram|image|the graph|the chart|the table|the diagram|see above|shown above|below figure|above figure)\b/i;

/**
 * Call Groq LLM with a text chunk and return parsed flashcard array.
 * Retries once on JSON parse failure.
 *
 * @param {string} chunk - Text chunk from chunker
 * @param {number} attempt - Internal retry counter
 * @returns {Promise<Array<{front, back, hint, topic}>>}
 */
export const generateCardsFromChunk = async (chunk, attempt = 1) => {
  const cleaned = cleanChunk(chunk);

  if (cleaned.length < 80) {
    console.log('⏭️  Skipping chunk — too short after cleaning image artifacts');
    return [];
  }

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.35,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate flashcards from the following educational text:\n\n${cleaned}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response from Groq');

    const cards = extractCards(raw);

    if (!Array.isArray(cards)) throw new Error('Response is not an array');

    const valid = cards.filter((c) => {
      if (!c || typeof c.front !== 'string' || !c.front.trim()) return false;
      if (!c || typeof c.back  !== 'string' || !c.back.trim())  return false;
      if (IMAGE_REF_RE.test(c.front)) {
        console.log(`🚫 Dropped image-ref card: "${c.front.slice(0, 70)}"`);
        return false;
      }
      return true;
    });

    return valid.map((c) => ({
      front: c.front.trim(),
      back:  c.back.trim(),
      hint:  (c.hint  || '').trim(),
      topic: (c.topic || '').trim(),
    }));

  } catch (error) {
    if (attempt === 1 && error instanceof SyntaxError) {
      console.warn('⚠️  JSON parse failed on first attempt, retrying chunk...');
      return generateCardsFromChunk(chunk, 2);
    }
    console.error(`❌ LLM error on chunk (attempt ${attempt}):`, error.message);
    return [];
  }
};
