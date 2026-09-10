# Timeline News — ingestion worker

A Cloudflare Worker that is the *only* real (non-mock) backend in this
repository. On a Cron Trigger it pulls trusted, free RSS feeds across four
geographic tiers, dedupes and clusters what it finds into **topics** (the
same real-world story) made of chronological **thread entries** (the distinct
developments within it, each corroborated by whichever outlets reported it),
and stores the result in D1. A second entry point serves that data as a small
read-only JSON API.

See `../../src/services/newsService.ts` for the frontend that consumes this,
and the root README's News section for the product-level description and the
clustering algorithm write-up.

## Sources

Four tiers, each a `category` on the outlet (`src/outlets.ts`) that every
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
| City (Rajapalayam) | Google News search, English | `https://news.google.com/rss/search?q=Rajapalayam&hl=en-IN&gl=IN&ceid=IN:en` |
| City (Rajapalayam) | Google News search, Tamil | `https://news.google.com/rss/search?q=%E0%AE%B0%E0%AE%BE%E0%AE%9C%E0%AE%AA%E0%AE%BE%E0%AE%B3%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D&hl=ta-IN&gl=IN&ceid=IN:ta` |

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

**City currently has no working source, for the same reason.** No outlet
publishes a dedicated feed for a town the size of Rajapalayam, so a Google
News search feed is the only real free source of Rajapalayam-specific
coverage — but `news.google.com/rss/search` returns HTTP 503 to this
worker's Cloudflare network range too (same confirmation: 200 from an
ordinary connection, 503 from here, reproduced across multiple cron cycles).
The outlets stay defined in `src/outlets.ts`, honestly labelled, in case a
future fix changes this (a different execution environment for just these
feeds; see the open question in the root README's News section) — right now
they contribute nothing, and the City section says so rather than showing a
plausible-looking empty state.

Tamil-language text (State and City tiers) is what motivated the tokenizer's
Unicode fix in `src/text.ts` — the original ASCII-only filter would have
reduced every Tamil headline to an empty vector. The capitalised-word entity
heuristic is still Latin-script-only and simply doesn't fire for Tamil text;
plain-term overlap still provides matching signal.

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

Upgrading a database created before the geographic-category tier existed?
Apply the migration once, in addition to (not instead of) `schema.sql`:

```bash
npx wrangler d1 execute timeline-news --remote --file=./migrations/0001_add_category.sql
```

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

## The clustering algorithm, briefly

1. **Normalize.** Each feed item's URL is canonicalized (tracking params and
   fragments stripped) and hashed; an article already seen by that URL is
   skipped outright — that's the exact-duplicate layer.
2. **Vectorize.** Title and summary are tokenized, stopworded, and turned into
   a term-frequency vector, with title terms weighted above summary terms and
   capitalized-word runs (a cheap proxy for named entities: people, places,
   organizations) weighted above plain vocabulary. This is deliberately not
   full TF-IDF — that needs a maintained corpus-wide document-frequency table,
   a reasonable upgrade once real clustering behaviour has been observed, but
   more complexity than a five-outlet v1 needs.
3. **Match a topic.** Cosine similarity against the centroids of every topic
   updated in the last 4 days. Below `ENTRY_THRESHOLD` (`src/cluster.ts`),
   nothing matches and the article starts a new topic.
4. **Match a thread entry.** Within the matched topic, cosine similarity
   against each existing thread entry's own vector. Above
   `DUPLICATE_THRESHOLD`, the article corroborates that entry (another
   outlet, same development). Otherwise it becomes a new thread entry — a
   genuine update to the story.
5. **Recompute.** The topic's centroid is recomputed as a recency-weighted
   average of its thread entries (`weightedCentroid` in `src/text.ts`, 3-day
   half-life), so matching drifts with where the story is now rather than
   staying anchored to how it started.

`ENTRY_THRESHOLD` and `DUPLICATE_THRESHOLD` are starting points from the
topic-detection-and-tracking literature (TF-weighted cosine over a rolling
window), not values tuned against this exact outlet set — watch the D1 data
after a few days and adjust if stories are merging that shouldn't, or staying
split that should merge.
