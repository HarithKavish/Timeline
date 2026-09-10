import { cosineSimilarity } from './text';
import type { TermVector } from './types';

/**
 * Tuning knobs for the incremental clustering pass. These are starting
 * points from the topic-detection-and-tracking literature (TF-weighted
 * cosine similarity over a rolling time window), not empirically fit to
 * this exact outlet set — expect to adjust them after watching a few days
 * of real topics form. Nudge ENTRY_THRESHOLD up if unrelated stories are
 * merging; nudge DUPLICATE_THRESHOLD down if the same development from two
 * outlets is landing as two separate thread entries instead of one
 * corroborated entry.
 */
export const TOPIC_WINDOW_DAYS = 4;
export const ENTRY_THRESHOLD = 0.22;
export const DUPLICATE_THRESHOLD = 0.5;
export const DEVELOPING_WINDOW_HOURS = 48;

/**
 * Real production data surfaced a second chaining failure, this time
 * *within* a topic: four articles about a Trump/Iran/midterms story — one
 * literally restating the lead headline, but two others on genuinely
 * different specific angles ("Iran war looms over Trump at Republican
 * midterm convention" vs the lead claim) — all landed in one thread entry.
 * The reason is structural: every article in a topic already shares the
 * topic's dominant entities (here, Trump, Iran), so full-vector cosine
 * between any two of its articles is inflated regardless of whether they're
 * actually the same specific development. DUPLICATE_PLAIN_THRESHOLD is the
 * same fix as MIN_PLAIN_OVERLAP applied one level down: corroboration
 * requires non-entity vocabulary to actually overlap too, not just the
 * entities every article in the topic already shares.
 */
export const DUPLICATE_PLAIN_THRESHOLD = 0.15;

/**
 * A frequently-mentioned name ("Trump", "Israel") shared between two
 * headlines is not, by itself, evidence they're the same story — real
 * testing surfaced exactly this: five unrelated Trump stories chained into
 * one topic because "Trump" alone cleared ENTRY_THRESHOLD. Requiring some
 * non-entity vocabulary overlap too (this floor) is a cheap stand-in for
 * full corpus IDF, which would naturally down-weight a name that common.
 */
export const MIN_PLAIN_OVERLAP = 0.06;

export interface CandidateTopic {
  id: string;
  centroid: TermVector;
}

export interface CandidateEntry {
  id: string;
  vector: TermVector;
}

function withoutEntities(vector: TermVector): TermVector {
  const out: TermVector = {};
  for (const [term, weight] of Object.entries(vector)) {
    if (!term.startsWith('ent:')) out[term] = weight;
  }
  return out;
}

/** Best-matching topic for a new article's vector, or null if nothing clears ENTRY_THRESHOLD. */
export function pickTopic(
  vector: TermVector,
  candidates: CandidateTopic[],
): { topicId: string; score: number } | null {
  const plainVector = withoutEntities(vector);
  let best: { topicId: string; score: number } | null = null;
  for (const candidate of candidates) {
    const score = cosineSimilarity(vector, candidate.centroid);
    if (score < ENTRY_THRESHOLD) continue;
    const plainScore = cosineSimilarity(plainVector, withoutEntities(candidate.centroid));
    if (plainScore < MIN_PLAIN_OVERLAP) continue;
    if (!best || score > best.score) best = { topicId: candidate.id, score };
  }
  return best;
}

/**
 * Within a topic, decide whether a new article is the same development as
 * an existing thread entry (corroboration — another outlet reporting the
 * same fact) or a new one (an update/escalation worth its own row).
 */
export function pickEntry(
  vector: TermVector,
  candidates: CandidateEntry[],
): { entryId: string; isDuplicate: boolean } | null {
  const plainVector = withoutEntities(vector);
  let best: { entryId: string; score: number; plainScore: number } | null = null;
  for (const candidate of candidates) {
    const score = cosineSimilarity(vector, candidate.vector);
    if (!best || score > best.score) {
      const plainScore = cosineSimilarity(plainVector, withoutEntities(candidate.vector));
      best = { entryId: candidate.id, score, plainScore };
    }
  }
  if (!best) return null;
  const isDuplicate = best.score >= DUPLICATE_THRESHOLD && best.plainScore >= DUPLICATE_PLAIN_THRESHOLD;
  return { entryId: best.entryId, isDuplicate };
}
