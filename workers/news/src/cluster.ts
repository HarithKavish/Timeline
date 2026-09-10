import { cosineSimilarity } from './embeddings';
import type { Embedding } from './types';

/**
 * Tuning knobs for embedding-based matching. Starting points, not
 * empirically fit to this exact corpus — same status as the term-vector
 * thresholds they replaced. Watch real clustering behaviour (workers/news
 * README has the how) and adjust:
 *
 * - TOPIC_MATCH_THRESHOLD: how similar a new article's embedding must be to
 *   a topic's centroid to belong to that story at all. Too low and
 *   unrelated stories merge; too high and the same story keeps
 *   re-splitting into new topics.
 * - DIRECT_DUPLICATE_THRESHOLD: how similar to an existing thread entry
 *   before it's treated as a confident corroboration *without* spending an
 *   LLM call — this is deliberately conservative (only the clearest cases
 *   skip the model) since a wrong "skip" here means no narrative gets
 *   written and no duplicate-catch gets a second look.
 */
export const TOPIC_WINDOW_DAYS = 4;
export const TOPIC_MATCH_THRESHOLD = 0.62;
export const DIRECT_DUPLICATE_THRESHOLD = 0.9;
export const DEVELOPING_WINDOW_HOURS = 48;

export interface CandidateTopic {
  id: string;
  title: string;
  centroid: Embedding;
}

export interface CandidateEntry {
  id: string;
  embedding: Embedding;
  headline: string;
}

/** Best-matching topic for a new article's embedding, or null if nothing clears TOPIC_MATCH_THRESHOLD. */
export function pickTopic(
  embedding: Embedding,
  candidates: CandidateTopic[],
): { topicId: string; title: string; score: number } | null {
  let best: { topicId: string; title: string; score: number } | null = null;
  for (const candidate of candidates) {
    const score = cosineSimilarity(embedding, candidate.centroid);
    if (score >= TOPIC_MATCH_THRESHOLD && (!best || score > best.score)) {
      best = { topicId: candidate.id, title: candidate.title, score };
    }
  }
  return best;
}

/** Best-matching thread entry within a topic, whatever the score — the caller decides what to do with it. */
export function pickEntry(
  embedding: Embedding,
  candidates: CandidateEntry[],
): { entryId: string; headline: string; score: number } | null {
  let best: { entryId: string; headline: string; score: number } | null = null;
  for (const candidate of candidates) {
    const score = cosineSimilarity(embedding, candidate.embedding);
    if (!best || score > best.score) {
      best = { entryId: candidate.id, headline: candidate.headline, score };
    }
  }
  return best;
}
