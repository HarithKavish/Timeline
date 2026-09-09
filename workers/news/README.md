# Timeline News — ingestion worker

A Cloudflare Worker that is the *only* real (non-mock) backend in this
repository. On a Cron Trigger it pulls five trusted, free, directly-published
RSS feeds, dedupes and clusters what it finds into **topics** (the same
real-world story) made of chronological **thread entries** (the distinct
developments within it, each corroborated by whichever outlets reported it),
and stores the result in D1. A second entry point serves that data as a small
read-only JSON API.

See `../../src/services/newsService.ts` for the frontend that consumes this,
and the root README's News section for the product-level description and the
clustering algorithm write-up.

## Sources

| Outlet | Feed |
|---|---|
| BBC News (World) | `https://feeds.bbci.co.uk/news/world/rss.xml` |
| NPR | `https://feeds.npr.org/1001/rss.xml` |
| Al Jazeera | `https://www.aljazeera.com/xml/rss/all.xml` |
| The Guardian (World) | `https://www.theguardian.com/world/rss` |
| PBS NewsHour | `https://www.pbs.org/newshour/feeds/rss/headlines` |

All five are free, official, direct publisher feeds — no API key, no
aggregator proxy. Reuters and AP no longer publish free direct RSS (Reuters
dropped theirs in 2020) and are deliberately not substituted with a Google
News scrape, which would be aggregator content wearing a publisher's name.
Add more outlets by appending to `src/outlets.ts` — nothing else needs to
change; ingestion, storage and the API are all outlet-count-agnostic.

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

## Deploy

```bash
npm run deploy
```

This registers the Cron Trigger (`*/20 * * * *`, in `wrangler.toml`) and the
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

- `GET /topics?q=&outletId=&status=developing|settled&sort=newest|oldest&offset=&limit=`
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
