import type { Embedding } from './types';

const EMBEDDING_MODEL = '@cf/baai/bge-m3';

/**
 * Real semantic embeddings, replacing the earlier hand-built term-frequency
 * vectors. bge-m3 is multilingual — the State and City tiers carry
 * Tamil-language headlines, and a single embedding space that understands
 * both languages means a Tamil and an English article about the same event
 * can, in principle, still be compared meaningfully (English-only models
 * can't do that at all).
 */
export async function embedText(ai: Ai, text: string): Promise<Embedding | null> {
  try {
    const result = await ai.run(EMBEDDING_MODEL, { text: [text.slice(0, 2000)] });
    const vector = (result as { data?: number[][] } | undefined)?.data?.[0];
    return Array.isArray(vector) && vector.length > 0 ? vector : null;
  } catch (error) {
    console.error('[news-ingest] embedding failed:', error);
    return null;
  }
}

export function cosineSimilarity(a: Embedding, b: Embedding): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Recency-weighted centroid: entries closer to `now` count more, so a topic's matching vector drifts with where the story is now rather than staying anchored to how it started. Same strategy as before, over dense vectors instead of sparse term maps. */
export function weightedCentroid(
  entries: Array<{ embedding: Embedding; occurredAt: string }>,
  now: number,
  halfLifeDays = 3,
): Embedding {
  const dim = entries[0]?.embedding.length ?? 0;
  const centroid = new Array<number>(dim).fill(0);
  for (const entry of entries) {
    const ageDays = Math.max(0, (now - new Date(entry.occurredAt).getTime()) / 86_400_000);
    const weight = Math.pow(0.5, ageDays / halfLifeDays);
    for (let i = 0; i < dim; i++) {
      centroid[i] = (centroid[i] ?? 0) + (entry.embedding[i] ?? 0) * weight;
    }
  }
  return centroid;
}
