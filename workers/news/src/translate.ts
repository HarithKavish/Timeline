const TRANSLATION_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';

/**
 * Place names this pipeline's own outlets are built to cover (State/
 * District/City tiers — see src/outlets.ts) — given to the model as a
 * glossary. Real testing surfaced the model otherwise guessing at
 * transliteration and getting it wrong: "Sattur" came back as "Chittoor"
 * (a different place in a different state) in one run, "Sivakasi" as
 * "Shivaganga" (a different Tamil Nadu town) in another. A general-purpose
 * translation model (`@cf/meta/m2m100-1.2b`) was tried too and was worse —
 * it fabricated unrelated sentences rather than translating at all — so
 * this stays on the same instruct model used for narrative generation,
 * constrained with the one piece of domain knowledge that actually fixed
 * the observed errors.
 */
const KNOWN_PLACES = [
  'Tamil Nadu',
  'Virudhunagar',
  'Rajapalayam',
  'Sivakasi',
  'Srivilliputhur',
  'Aruppukkottai',
  'Sattur',
  'Chennai',
];

const SYSTEM_PROMPT = [
  'Translate the given news headline to English.',
  `If any of these place names appear (in Tamil or English), use exactly this spelling: ${KNOWN_PLACES.join(', ')}.`,
  'Do not guess or substitute a different place name for one you are unsure of.',
  'Respond with only the translation — no preamble, no quotation marks, no explanation.',
].join(' ');

/**
 * Translates a non-English article title to English, for display only.
 * The original is never touched — see NewArticle.titleEn in db.ts, which
 * is an additional field, not a replacement. Embeddings and clustering
 * (src/embeddings.ts) use the original text directly: bge-m3 is
 * multilingual and matches same-language text more reliably than
 * post-translation paraphrases would, so translation happens only for
 * what a reader sees, never for what the matching logic compares.
 *
 * Only called for outlets whose `language` isn't 'en' (see src/outlets.ts)
 * — known-English outlets never pay for a translation call they don't need.
 *
 * This is a heuristic AI translation, not a guarantee — like the narrative
 * generation it sits alongside, it can occasionally get a detail wrong.
 * Returns null (never throws) on failure — callers fall back to the
 * original title so a flaky call never blocks ingestion.
 */
export async function translateTitle(ai: Ai, text: string): Promise<string | null> {
  try {
    const result = await ai.run(TRANSLATION_MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: 100,
      temperature: 0.1,
    });
    const translated = ((result as { response?: string } | undefined)?.response ?? '').trim();
    return translated ? translated.replace(/^["']|["']$/g, '') : null;
  } catch (error) {
    console.error('[news-ingest] translation failed:', error);
    return null;
  }
}
