const GENERATION_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';

/**
 * Real testing (local, against live feeds) surfaced the model being too
 * liberal about "new": five articles that were all just the same $5,000-
 * payment claim reworded by different outlets each got written up as a
 * distinct log entry, because each phrased it slightly differently or added
 * a little color. A worked example anchors small-model instruction-
 * following far better than a rule stated abstractly — this is that fix.
 */
const SYSTEM_PROMPT = [
  'You are a neutral news editor maintaining a chronological log of developments',
  'in one ongoing news story. You are strict about what counts as genuinely new,',
  'because the log is read as a narrative and must never repeat itself.',
  '',
  'Given the developments already logged and a new source article:',
  '- If the new source restates, rephrases, re-confirms, or adds minor colour to',
  '  a claim already implied by the log — even in different words, from a',
  '  different outlet, or with a slightly different specific phrasing — respond',
  '  with exactly the single word: DUPLICATE',
  '- Only if the new source reports a fact, action, reaction, statement or event',
  '  that a reader of the existing log would not already know, write ONE short',
  '  sentence (max 25 words) describing exactly that new fact, phrased as a',
  '  natural continuation of the story.',
  '',
  'Example:',
  'Log so far:',
  '1. Trump promises $5,000 payments to every American if Republicans win the midterms.',
  'New source: "Trump repeats $5,000 pledge at Republican convention, still no funding details"',
  '-> DUPLICATE',
  'New source: "Congressional Budget Office says Trump\'s $5,000 plan would cost $700 billion"',
  '-> The Congressional Budget Office estimated Trump\'s $5,000 payment plan would cost $700 billion.',
  '',
  'Never invent facts that are not present in the source. Respond with nothing',
  'else — no preamble, no quotation marks, no explanation of your reasoning.',
].join('\n');

export interface NarrativeResult {
  text: string;
  /** True when the model judged this the same development as an existing entry, not a new one. */
  isDuplicate: boolean;
}

/**
 * Writes the next entry in a topic's thread, or judges the new article a
 * duplicate of what's already logged. This is the "real language
 * understanding" layer: unlike embedding cosine, it reads the actual prior
 * log and the actual new text, so it can tell "Trump restates the same
 * claim" apart from "a genuinely different angle on the same people" —
 * exactly the distinction keyword and embedding similarity both struggle
 * with when everything in a topic already shares the same dominant names.
 *
 * Returns null (never throws) on any failure — callers fall back to the raw
 * article title so a flaky AI call never blocks ingestion.
 */
export async function generateNarrative(
  ai: Ai,
  topicTitle: string,
  priorHeadlines: string[],
  article: { title: string; summary: string | null; outletName: string },
): Promise<NarrativeResult | null> {
  const logSoFar = priorHeadlines.length
    ? priorHeadlines.map((headline, index) => `${index + 1}. ${headline}`).join('\n')
    : '(none yet — this is the opening development)';

  const userPrompt = [
    `Story: ${topicTitle}`,
    '',
    'Developments logged so far:',
    logSoFar,
    '',
    `New source (${article.outletName}): "${article.title}"${article.summary ? ` — ${article.summary}` : ''}`,
    '',
    'Write the next log entry, or respond DUPLICATE.',
  ].join('\n');

  try {
    const result = await ai.run(GENERATION_MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 90,
    });
    const text = ((result as { response?: string } | undefined)?.response ?? '').trim();
    if (!text) return null;
    if (/^duplicate\.?$/i.test(text)) return { text: article.title, isDuplicate: true };
    return { text: text.replace(/^["']|["']$/g, ''), isDuplicate: false };
  } catch (error) {
    console.error('[news-ingest] narrative generation failed:', error);
    return null;
  }
}
