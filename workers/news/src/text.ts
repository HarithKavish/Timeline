import type { TermVector } from './types';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'of', 'to', 'in', 'on', 'for',
  'with', 'at', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'as', 'it', 'its', 'this', 'that', 'these', 'those', 'has', 'have', 'had',
  'will', 'would', 'could', 'should', 'can', 'may', 'might', 'not', 'no', 'do', 'does', 'did',
  'says', 'said', 'say', 'new', 'more', 'than', 'their', 'his', 'her', 'they', 'he', 'she', 'we',
  'you', 'i', 'us', 'our', 'your', 'what', 'when', 'where', 'who', 'how', 'why', 'which', 'amid',
  'live', 'update', 'updates', 'latest',
]);

/**
 * Unicode-aware: keeps any script's letters/marks/digits (`\p{L}\p{N}\p{M}`),
 * not just a-z0-9. The State and City tiers carry Tamil-language headlines,
 * and an ASCII-only filter would reduce every one of those to an empty
 * vector — no match signal at all, not even exact-duplicate detection.
 * Combining marks (`\p{M}`) matter here specifically: Tamil vowel signs are
 * separate code points from their base consonant, and stripping them would
 * collapse distinct words down to the same consonant skeleton.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/**
 * Short capitalised acronyms that show up across unrelated stories often
 * enough (country/org codes, common abbreviations) that treating them as a
 * high-weight entity match causes false merges — "AI will cure cancer…"
 * and "…UK sanctions Israel…" sharing only "UK" should not cluster. Multi-
 * word capitalised runs ("West Bank", "Federal Reserve") don't have this
 * problem and keep the full entity weight.
 */
const GENERIC_SHORT_ENTITIES = new Set([
  'uk', 'us', 'usa', 'eu', 'un', 'ai', 'pm', 'ceo', 'gdp', 'fbi', 'cia', 'nba', 'nfl', 'ap',
]);

/**
 * Proxy for named-entity extraction, cheap enough to run per-article without
 * a model: runs of capitalised words in the *original*-case text. Catches
 * "Volodymyr Zelensky", "Gaza", "Federal Reserve" etc. reliably enough that,
 * combined with a heavier weight than plain terms, two headlines sharing an
 * entity dominate the cosine score over two that merely share stopword-free
 * vocabulary. Single-word matches that are short and generic are excluded —
 * see GENERIC_SHORT_ENTITIES — but still count as an ordinary term below.
 */
function extractEntities(rawText: string): string[] {
  const matches = rawText.match(/\b[A-Z][a-zA-Z.]*(?:\s+[A-Z][a-zA-Z.]*)*\b/g) ?? [];
  return matches
    .map((match) => match.trim())
    .filter((match) => match.length > 1 && !STOPWORDS.has(match.toLowerCase()))
    .filter((match) => match.includes(' ') || match.length >= 4)
    .map((match) => match.toLowerCase())
    .filter((match) => !GENERIC_SHORT_ENTITIES.has(match));
}

/**
 * Term-frequency vector, title weighted well above summary and entities
 * weighted above plain vocabulary. This is deliberately not full TF-IDF —
 * that needs a maintained corpus-wide document-frequency table, which is a
 * reasonable upgrade once real clustering behaviour has been observed, but
 * isn't worth the complexity for a first version at five outlets.
 */
/** Adds tokenize(text)'s plain terms, skipping any word that's also part of an extracted entity — a name shouldn't count twice, once as itself and once as "topical vocabulary". */
function bumpPlainTerms(
  vector: TermVector,
  text: string,
  entities: string[],
  weight: number,
): void {
  const entityWords = new Set(entities.flatMap((entity) => entity.split(' ')));
  for (const term of tokenize(text)) {
    if (entityWords.has(term)) continue;
    vector[term] = (vector[term] ?? 0) + weight;
  }
}

export function buildVector(title: string, summary: string | null): TermVector {
  const vector: TermVector = {};

  const titleEntities = extractEntities(title);
  bumpPlainTerms(vector, title, titleEntities, 3);
  for (const entity of titleEntities) vector[`ent:${entity}`] = (vector[`ent:${entity}`] ?? 0) + 5;

  if (summary) {
    const summaryEntities = extractEntities(summary);
    bumpPlainTerms(vector, summary, summaryEntities, 1);
    for (const entity of summaryEntities) {
      vector[`ent:${entity}`] = (vector[`ent:${entity}`] ?? 0) + 2;
    }
  }

  return vector;
}

export function cosineSimilarity(a: TermVector, b: TermVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, weight] of Object.entries(a)) {
    normA += weight * weight;
    const other = b[term];
    if (other) dot += weight * other;
  }
  for (const weight of Object.values(b)) normB += weight * weight;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Recency-weighted centroid: entries closer to `now` count more, so a topic's matching vector drifts with the story instead of being anchored to how it started. */
export function weightedCentroid(
  entries: Array<{ vector: TermVector; occurredAt: string }>,
  now: number,
  halfLifeDays = 3,
): TermVector {
  const centroid: TermVector = {};
  for (const entry of entries) {
    const ageDays = Math.max(0, (now - new Date(entry.occurredAt).getTime()) / 86_400_000);
    const weight = Math.pow(0.5, ageDays / halfLifeDays);
    for (const [term, value] of Object.entries(entry.vector)) {
      centroid[term] = (centroid[term] ?? 0) + value * weight;
    }
  }
  return centroid;
}
