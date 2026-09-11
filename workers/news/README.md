# Timeline News — ingestion worker

A Cloudflare Worker that is the *only* real (non-mock) backend in this
repository. On a Cron Trigger it pulls trusted, free RSS feeds across five
geographic tiers, dedupes and clusters what it finds into **topics** (the
same real-world story) made of chronological **thread entries** (the distinct
developments within it, each corroborated by whichever outlets reported it),
and stores the result in D1. A second entry point serves that data as a small
read-only JSON API.

See `../../src/services/newsService.ts` for the frontend that consumes this,
and the root README's News section for the product-level description and the
clustering algorithm write-up.

## Sources

Five tiers, each a `category` on the outlet (`src/outlets.ts`) that every
article and topic it produces inherits — clustering is scoped per category,
so a national Indian story can never merge with an unrelated international
one just because they share vocabulary.

| Category | Outlet | Feed |
|---|---|---|
| International (excludes India) | BBC News (World) | `https://feeds.bbci.co.uk/news/world/rss.xml` |
| International | NPR | `https://feeds.npr.org/1001/rss.xml` |
| International | Al Jazeera | `https://www.aljazeera.com/xml/rss/all.xml` |
| International | The Guardian (World) | `https://www.theguardian.com/world/rss` |
| International | PBS NewsHour | `https://www.pbs.org/newshour/feeds/rss/headlines` |
| National (India) | Times of India | `https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms` |
| State (Tamil Nadu) | Times of India (Chennai) | `https://timesofindia.indiatimes.com/rssfeeds/2950623.cms` |
| State (Tamil Nadu) | The New Indian Express | `https://www.newindianexpress.com/states/tamil-nadu/rssfeed/?id=170&getXmlFeed=true` |
| District (Virudhunagar) | Google News search, English | `https://news.google.com/rss/search?q=Virudhunagar+OR+Rajapalayam+OR+Sivakasi+OR+Srivilliputhur+OR+Aruppukkottai+OR+Sattur&hl=en-IN&gl=IN&ceid=IN:en` |
| District (Virudhunagar) | Google News search, Tamil | searches the same six towns' Tamil names (see `src/outlets.ts`) |
| City (Rajapalayam) | Google News search, English | `https://news.google.com/rss/search?q=Rajapalayam&hl=en-IN&gl=IN&ceid=IN:en` |
| City (Rajapalayam) | Google News search, Tamil | `https://news.google.com/rss/search?q=%E0%AE%B0%E0%AE%BE%E0%AE%9C%E0%AE%AA%E0%AE%BE%E0%AE%B3%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D&hl=ta-IN&gl=IN&ceid=IN:ta` |

District searches across the district's main towns by name (Virudhunagar,
Rajapalayam, Sivakasi, Srivilliputhur, Aruppukkottai, Sattur) rather than
searching "Virudhunagar district" as a phrase — most local reporting names
the specific town, not the district, so a phrase search would miss most of
the real coverage. Verified directly (from an ordinary connection, not this
worker) before building: real results included a fireworks-factory accident
in Sattur, a weavers' protest, new district-collector appointments, and a
Tamil-press HPV vaccination drive story — alongside the same kind of noise
(product listings, price pages) City already has.

The International tier is free, official, direct publisher feeds — no API
key, no aggregator proxy. Reuters and AP no longer publish free direct RSS
(Reuters dropped theirs in 2020) and are deliberately not substituted with a
Google News scrape, which would be aggregator content wearing a publisher's
name. National and State are also direct publisher feeds.

**The Hindu is not used, despite being the obvious first choice for National
and State.** Its feeds are real, correctly formatted, and were verified
directly (`https://www.thehindu.com/news/national/feeder/default.rss` and
the `/tamil-nadu/` equivalent both return proper RSS when fetched normally)
— but they return HTTP 403 specifically to requests from this worker's
Cloudflare network range, confirmed by sending the identical request with
the identical User-Agent from an ordinary connection and getting 200. Times
of India and The New Indian Express don't block that range, so they carry
National and State instead.

**District and City currently have no working source, for the same
reason.** Neither Virudhunagar district nor Rajapalayam has a dedicated
publisher feed, so Google News search is the only real free source for
either — but `news.google.com/rss/search` returns HTTP 503 to this worker's
Cloudflare network range too (same confirmation as The Hindu: 200 from an
ordinary connection, 503 from here, reproduced across multiple cron cycles
for all four of these feeds). The outlets stay defined in `src/outlets.ts`,
honestly labelled, in case a future fix changes this (a different execution
environment for just these feeds; see the open question in the root
README's News section) — right now they contribute nothing, and both
sections say so on the News homepage rather than showing a
plausible-looking empty state.

Tamil-language text (State, District and City tiers) is part of why clustering moved
to `bge-m3` embeddings (see below) rather than staying on the earlier
hand-built term vectors — `bge-m3` is multilingual, so Tamil and English
headlines share one real semantic space instead of the Tamil half being
reduced to noise by an English-only heuristic.

Add more outlets by appending to `src/outlets.ts` with a `category` —
nothing else needs to change; ingestion, storage and the API are all
outlet-count- and category-agnostic.

## One-time setup

```bash
cd workers/news
npm install
npx wrangler login

npm run db:create
# copy the printed database_id into wrangler.toml's [[d1_databases]] block

npm run db:apply           # local D1, for `wrangler dev`
npm run db:apply:remote    # remote D1, for the deployed worker
```

Upgrading an existing database? Apply migrations in order, in addition to
(not instead of) `schema.sql`:

```bash
npx wrangler d1 execute timeline-news --remote --file=./migrations/0001_add_category.sql
npx wrangler d1 execute timeline-news --remote --file=./migrations/0002_reset_for_embeddings.sql
npx wrangler d1 execute timeline-news --remote --file=./migrations/0003_add_title_translation.sql
```

0002 clears `articles`/`thread_entries`/`topics` — the switch from
term-vectors to real embeddings (see below) means the old rows can't be
compared against anything the new pipeline produces. This is ephemeral news
data, not an archive, so a reset is the honest fix rather than a backfill;
everything re-ingests within a few cron cycles.

Also needs a Workers AI binding — add to `wrangler.toml` (already present in
this repo's copy, shown for a from-scratch setup):

```toml
[ai]
binding = "AI"
```

No separate account or API key: Workers AI is available to every Cloudflare
account this worker is already deployed to.

## Deploy

```bash
npm run deploy
```

This registers the Cron Trigger (`*/5 * * * *`, in `wrangler.toml`) and the
`fetch` handler on your `*.workers.dev` subdomain. Once the worker has a
stable name, uncomment the `[[routes]]` block in `wrangler.toml` and point
`news-api.timeline.harithkavish.com` at it via a CNAME to
`<worker>.<account>.workers.dev`, then set `VITE_NEWS_API_BASE` in the
frontend's `.env` accordingly (see the root README).

## Local development

```bash
npm run dev              # serves the fetch handler against local D1
npx wrangler dev --test-scheduled   # then curl the printed /__scheduled URL to trigger one ingest pass
```

## API

- `GET /topics/by-category?limit=` — the category-first homepage view: the latest `limit` (default 3) topics in each of international/national/state/city, newest first
- `GET /topics?q=&category=&outletId=&status=developing|settled&sort=newest|oldest&offset=&limit=`
- `GET /topics/:id`
- `GET /outlets`

All responses are JSON, CORS-restricted to the Timeline origins listed in
`src/api.ts`, cached at the edge for 60 seconds.

## The clustering + narrative pipeline

The first version of this ran entirely on hand-built term-frequency vectors
— cosine similarity over shared words, with entity-weighting and anti-
chaining heuristics bolted on as real production traffic found their
failure modes (see git history on `src/cluster.ts` for what those were).
That approach has a hard ceiling: it counts shared *words*, so it can never
reliably tell "the same claim, reworded" apart from "a different claim, same
people" — every article in a topic already shares that topic's dominant
names, so word-overlap between any two of its articles is inflated
regardless of whether they're actually the same development. The pipeline
now uses real language understanding instead, via Cloudflare Workers AI
(same account, same worker — no new signup, no external API key):

1. **Normalize.** Each feed item's URL is canonicalized (tracking params and
   fragments stripped) and hashed; an article already seen by that URL is
   skipped outright — the exact-duplicate layer, unchanged.
2. **Embed.** Title + summary go to `@cf/baai/bge-m3`, a real multilingual
   sentence-embedding model — one semantic space that understands English
   and Tamil headlines alike, not two separate heuristics. `embedText` in
   `src/embeddings.ts`; graceful fallback (a standalone topic, not a dropped
   article) if the call fails.
3. **Match a topic.** Cosine similarity against the centroids of every topic
   updated in the last 4 days, scoped to the article's category. Below
   `TOPIC_MATCH_THRESHOLD` (`src/cluster.ts`), nothing matches and the
   article starts a new topic.
4. **Match a thread entry — the two-tier decision.** Within the matched
   topic, cosine similarity against each existing entry's own embedding.
     - **Above `DIRECT_DUPLICATE_THRESHOLD`** (very high confidence): treated
       as corroboration immediately, no model call spent — this is the
       common case of multiple outlets reporting the identical fact.
     - **Otherwise**: an LLM (`@cf/meta/llama-3.1-8b-instruct-fp8`,
       `src/narrative.ts`) is shown the *actual prior log* for this topic and
       the *actual new article*, and asked to either write the next log entry
       in one natural sentence, continuing the story, or respond `DUPLICATE`
       if it judges this the same development already logged. This is the
       "real language understanding" step — it reads content, not vectors,
       so it catches the cases embedding cosine alone can't resolve (a
       near-verbatim restatement vs. a genuinely different angle on the same
       people), and it's what produces the natural, flowing thread instead of
       a list of raw scraped headlines.
5. **Recompute.** The topic's centroid is recomputed as a recency-weighted
   average of its thread entries' embeddings (`weightedCentroid` in
   `src/embeddings.ts`, 3-day half-life), so matching drifts with where the
   story is now rather than staying anchored to how it started.

**Fallback discipline**: every AI call (embedding or generation) can fail —
rate limit, transient error, anything — and every call site falls back to
something safe (a standalone topic; the raw article title as the entry text)
rather than blocking ingestion. The pipeline never depends on the AI calls
succeeding to keep working; it only gets better prose and better matching
when they do.

`TOPIC_MATCH_THRESHOLD` and `DIRECT_DUPLICATE_THRESHOLD` (`src/cluster.ts`)
are starting points, not values tuned against this exact corpus — same
status as their term-vector predecessors, and the same expectation: watch
real topics form over the next few days and adjust if stories are merging
that shouldn't, or the LLM is being asked to arbitrate cases that are
actually obvious either way.

**Cost and latency, worth watching**: embedding is mandatory per new
article (that's how matching happens at all); generation only runs when a
match isn't a high-confidence direct duplicate, which bounds it to roughly
"one call per genuine development," not "one call per article." Workers AI's
free tier has a daily neuron allowance — fine at current volume, but if
topic counts grow a lot this is the first thing to check if ingestion starts
silently falling back to raw headlines more often than expected (that
fallback is silent on purpose — it never blocks ingestion — so it's worth
occasionally checking `wrangler tail` rather than assuming quiet means
everything succeeded).

## Auto-translation

Article titles from non-English outlets (`language: 'ta'` in `src/outlets.ts`
— currently the District and City tiers' Tamil-language Google News feeds)
are translated to English for display via `src/translate.ts`, using the same
`llama-3.1-8b-instruct-fp8` model as narrative generation. Only non-English
outlets pay for the call — English outlets, the large majority, never do.
The real source title (`articles.title`) is never overwritten; the
translation lands in a separate `title_en` column, and the frontend shows
`titleEn ?? title` with the real original always available on hover.

Thread-entry narratives don't need a separate translation step: the
narrative-generation prompt (`src/narrative.ts`) is instructed to always
answer in English regardless of the source article's language, since it's
already reading the source text to write the log entry — no extra call.

**Translation quality is heuristic, not a guarantee — tested and tuned, not
assumed.** A first version, using the general instruct model with no
constraints, mistranslated real Tamil place names in testing: "Sattur" (a
real town this pipeline's own City/District outlets cover) came back as
"Chittoor" (a different place in a different state) in one run, "Sivakasi"
as "Shivaganga" (a different Tamil Nadu town) in another — plausible-looking
but factually wrong. A dedicated translation model
(`@cf/meta/m2m100-1.2b`) was tried as an alternative and was worse: it
fabricated unrelated sentences rather than translating at all. The fix that
worked — verified by rerunning the same real headlines three times each and
checking for consistency, not just one lucky result — was giving the model
an explicit glossary of the exact place names this pipeline's outlets are
built to cover (`KNOWN_PLACES` in `src/translate.ts`) plus a low temperature
(0.1). Place names have been consistent since; a domain-term imprecision
remains (பட்டாசு, "firecracker," has come back as "matchbox" — a lower-stakes
error than a wrong place, but not fixed). Extending `KNOWN_PLACES` is the
first thing to try if a specific new mistranslation shows up.
