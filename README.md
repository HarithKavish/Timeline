# Timeline

A source-backed chronological catalogue of creative works and the people who made them.

**What → Who → When → Relationships → Sources.**

Production site: **https://timeline.harithkavish.com**

> **Stage 1 — frontend only, with one exception.** The Music domain runs entirely on a
> demonstration dataset held in memory: no backend, no database, no ingestion. Work, film and
> creator names are real; **dates, durations, credits and every source record are
> placeholders**, and no locator is a real URL. The **News domain is the exception**: it is a
> real pipeline (`workers/news`) doing live RSS ingestion, cross-source dedup and topic/thread
> clustering against five real outlets, and every article link is real. See
> [News](#news) below.

---

## What the product is

Timeline is a research and discovery catalogue, not a streaming service. It answers questions
of the shape *"everything by this creator, in the order it appeared, with what is actually
known about each entry"* — and it tells you where each fact came from.

Music (Tamil first) is the implemented domain. Movies, games, books, software and technology
are declared in the domain register and routed, but not catalogued: the model is meant to
carry them without being rewritten.

Three principles run through the whole build:

1. **Chronology is the structure**, not a sort order. Years, decades and density are the
   navigation.
2. **Absence is data.** A release with no recorded time reads `Unknown`, never `12:00 AM`. A
   year-only date stays a year. Undated entries are catalogued and findable, but held out of
   the chronology rather than assigned a guessed position.
3. **Provenance is per fact, not per page.** Every value carries a certainty
   (*Known* / *Source reported* / *Partial* / *Disputed* / *Unknown*) and the source records
   supporting it.

---

## Routes

| Route | Page |
|---|---|
| `/` | Home — the concept, domain register, catalogue shape, entry points |
| `/music` | Music domain overview — scale, languages, cross-sections, release types |
| `/music/timeline` | The chronology — the core discovery surface, all filters |
| `/music/creators` | Creator discovery, filterable by credited role |
| `/music/creator/:slug` | Creator detail — e.g. `/music/creator/ar-rahman` |
| `/music/work/:slug` | Work detail — e.g. `/music/work/kannalane` |
| `/search` | Addressable search results (the ⌘K / `/` dialog is available everywhere) |
| `/news` | News timeline — live topics, filterable by outlet, status and search |
| `/news/topic/:id` | A topic's full thread — every development, chronological, with sources |
| `/movies`, `/games`, `/books`, `/software`, `/technology` | Declared, not yet catalogued |

---

## Architecture

```text
src/
  types/          domain model — the contract everything else agrees on
    common.ts       EntityId, Domain, Fact<T>, Certainty, PartialDate, Source, Relationship
    music.ts        Person, Creator, Work, Recording, Release, ReleaseEvent, Credit, Film, Label
    news.ts         NewsOutlet, NewsArticle, NewsTopic, NewsThreadEntry — real, not mock
    api.ts          request/response shapes — the future HTTP contract
  data/
    builders.ts     compact authoring specs → normalised entities
    domains.ts      the domain register (music and news available, the rest planned)
    mock/           the demonstration catalogue + an indexed in-memory store (`db`)
  services/       THE boundary. Async functions, one per future endpoint
    endpoints.ts    the HTTP paths stage 2 will implement, plus the News worker's paths
    musicService.ts the in-memory implementation of the music endpoints
    newsService.ts  real `fetch` calls against workers/news — see the News section below
  hooks/          useQuery, useTimelineFilters / useNewsFilters (URL-backed), useTheme
  components/     navigation/ search/ timeline/ filters/ works/ creators/ sources/ news/ ui/
  pages/          Home/ Music/ Timeline/ Creator/ Work/ Search/ Domain/ News/ NotFound/
  styles/         tokens.css (design tokens, light + dark), base.css, pages.css
  utils/          date, duration, label and news-timestamp formatting

workers/
  news/           the Cloudflare Worker + D1 ingestion and API — see workers/news/README.md
```

### The data model, and why it is not a list of songs

The entities are kept separate on purpose:

- **Work** — the composition. Written once.
- **Recording** — a realisation of a work. A reprise is a *second recording of the same work*,
  not a different song.
- **Release** — a published package (album, single, EP, compilation, soundtrack).
- **ReleaseEvent** — a dated publication of a release, in one territory and format. A 2013
  digital reissue of a 1992 soundtrack is a second event, not a second soundtrack.
- **Credit** — attaches a **Creator** to a work, a recording or a release, in a **role**. The
  same person can be lyricist and vocalist on one recording; the catalogue indexes the role.
- **Person** vs **Creator** — a person is a human; a creator is the entity that appears in
  credits. That is what lets a band (`agam`) and a solo artist behave identically.
- **Source** — a provenance record. **Fact\<T\>** carries `value`, `certainty` and the
  `sourceIds` supporting *that* value.

Because a recording can appear on several releases, chronological rows are `release × recording`
pairs. Later appearances are marked and hidden by default, so a recording is counted once at
first publication and reissues never inflate a creator's output.

`TimelineEntry` — the denormalised row the timeline renders — is **derived in the service
layer** and never stored. That keeps the catalogue normalised and the UI flat.

### The service boundary

Components never touch `db`. They call `src/services`:

```ts
getMusicOverview()                  // GET /api/music/overview
search(query)                       // GET /api/music/search?q=…
getTimeline(query: TimelineQuery)   // GET /api/music/timeline?…
listCreators({ q, role })           // GET /api/music/creators
getCreator(slug)                    // GET /api/music/creators/:slug
getWork(slug)                       // GET /api/music/works/:slug
```

Every function is async, returns the shapes in `src/types/api.ts`, and simulates a short
latency so loading states are real. Stage 2 replaces each body with a `fetch` against the paths
in `src/services/endpoints.ts`. **No component changes.**

Filter state lives in the URL query string (`?ctx=non-film&class=independent&from=2010`), and
that query string is deliberately the same vocabulary `GET /api/music/timeline` will accept —
so a shared link and an API call already agree.

### Design

Timeline wears the **Harith Kavish house theme**, so it reads as a sibling of
[harithkavish.com](https://harithkavish.com) and [Nexus](https://nexus.harithkavish.com)
rather than as a separate product. The canonical stylesheet those sites share is
`https://harithkavish.com/style.css`; `src/styles/tokens.css` mirrors its values:

- **Palette** — cool blue-grey ground (`#f4f9fb` light, `#0b1014` dark) with the house radial
  wash, deep-teal accent `#123f50` inverting to pale ice `#cedfe6` in dark, and the house
  status colours (live green, in-progress amber) carrying Timeline's certainty states.
- **Type** — the house system stack, `Aptos, "Segoe UI", "Helvetica Neue", Arial`. No
  webfonts are loaded, matching the house sites. Headings run heavy and tight (weight 650,
  `-0.03em`; the hero at `-0.05em`). A mono face is kept for dates and counts only, because
  tabular figures are what hold the chronology in column.
- **Geometry** — house radii: soft `12–16px` cards with low-opacity shadows, and fully-round
  pills for chips, buttons, filter tags and the search field, matching the house `.pill`.
- **Surfaces** — translucent panels over the ground, with a blurred sticky header and footer.

Only the theme layer is house-branded. Spacing, type scale, layout widths and every grid are
untouched, so the chronology keeps its alignment and density.

- Light and dark are both authored, using the same `[data-theme]` mechanism as the house
  sites, with a three-state control (system / light / dark) and a pre-paint script so the
  palette never flashes.

- Mobile is designed, not shrunk: filters become a bottom sheet, timeline rows restack, the
  year-density strip rescales to the viewport.
- The year-density chart is the range selector — click a year, shift-click a second for a
  span — and ships a screen-reader table of the same numbers.

---

## News

The one domain in this build backed by something real instead of `src/data/mock`: a Cloudflare
Worker + D1 pipeline (`workers/news/`) that ingests RSS feeds every 5 minutes across four
geographic tiers, dedupes and clusters what it finds, and serves the result over a small JSON API
that `src/services/newsService.ts` calls with a plain `fetch` — the same service-boundary pattern
the Music domain is staged for, just implemented now instead of later.

**Four tiers** — the News homepage (`/news`) shows the latest 3 topics in each, newest first, not
a search box first:

- **International** (excludes India) — BBC News, NPR, Al Jazeera, The Guardian, PBS NewsHour.
  Free, official, direct publisher RSS; none require a key. Reuters and AP no longer offer free
  direct RSS (Reuters dropped theirs in 2020) and are deliberately not replaced with a Google
  News scrape, which would be aggregator content wearing a publisher's name.
- **National** (India) — Times of India.
- **State** (Tamil Nadu) — Times of India (Chennai edition), The New Indian Express.
- **City** (Rajapalayam) — **currently empty.** No outlet publishes a dedicated feed for a town
  this size, so a Google News search feed (English and Tamil) is the only real free source of
  Rajapalayam-specific coverage — but Google returns HTTP 503 specifically to this worker's
  Cloudflare network range (confirmed: 200 from an ordinary connection, 503 from here, across
  multiple cron cycles). The News homepage says this plainly in the City section rather than
  showing a misleadingly generic empty state.

**The Hindu is deliberately not used**, despite being the obvious choice for National and State:
its feeds are real and correctly formatted but return HTTP 403 to this same Cloudflare network
range — verified the identical way. This is a real constraint of running ingestion from
Cloudflare Workers specifically, not a code bug; see `workers/news/README.md` for the full
picture and what fixing City would actually require.

Clustering is scoped per category, so stories from different tiers never merge into each other
just because they share vocabulary — see `workers/news/README.md`.

**Topics and threads** — a *topic* is a cluster of articles judged to report the same real-world
story; its *thread* is the chronological list of distinct developments within it, and each
development lists every outlet that corroborated it. The clustering is TF-weighted cosine
similarity over a rolling time window (the classic topic-detection-and-tracking approach), not a
trained model — see `workers/news/README.md` for the full write-up, the exact thresholds, and
what corroboration vs. a genuinely new development means for the algorithm.

**Running it locally**

```bash
npm --prefix workers/news install
npm --prefix workers/news run db:apply     # local D1 schema
npm --prefix workers/news run dev          # serves the API on :8787

cp .env.example .env                        # VITE_NEWS_API_BASE defaults to :8787
npm run dev                                 # the News tab now shows live data
```

Nothing under `workers/news` ships to GitHub Pages — it deploys separately (`npm run deploy`
inside that directory), to Cloudflare, on its own cron. See `workers/news/README.md` for one-time
setup (`wrangler login`, `wrangler d1 create`) and deploy steps.

---

## Local development

```bash
npm install
npm run dev              # http://localhost:5173

npm run typecheck        # tsc, strict, no `any` escapes
npm run validate:data    # catalogue integrity: dangling ids, orphan credits, duplicate slugs
npm run build            # typecheck + production build + Pages post-build
npm run preview          # serve the production build on http://localhost:4173
```

`npm run validate:data` is worth running after editing anything in `src/data/mock` — it walks
every relationship in the catalogue (credits → creators, releases → tracks, films → directors,
recordings → works) and fails on the first dangling reference.

---

## GitHub Pages deployment

The repository deploys from GitHub Actions — `.github/workflows/deploy.yml` runs on every push
to `main`, typechecks, validates the catalogue, builds, and publishes `dist/` to Pages.

**One-time repository setup**

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Pages → Custom domain:** `timeline.harithkavish.com`, then enable
   *Enforce HTTPS* once the certificate is issued.

**DNS**

Add a **CNAME record** at your DNS provider:

| Type | Name | Value |
|---|---|---|
| CNAME | `timeline` | `<github-username>.github.io.` |

The record points at the GitHub Pages *host* — never at a repository path, and never at the
`github.com` URL. GitHub resolves which site to serve from the `CNAME` file in the published
artifact, which is why `public/CNAME` is committed: if it went missing, the next deploy would
silently unset the custom domain. The post-build step fails the build if it is absent.

**Deep links**

Pages serves static files, so a direct request for `/music/timeline` has no file behind it.
`scripts/postbuild.mjs` copies the built `index.html` to `404.html`, so that request still
boots the app at the URL the user typed and React Router takes over. `.nojekyll` stops Pages
from processing the build output.

**Base path**

`vite.config.ts` reads `TIMELINE_BASE` (default `/`), and the router derives its basename from
`import.meta.env.BASE_URL`. To publish to a project path instead of the custom domain, build
with `TIMELINE_BASE=/timeline/` — nothing else changes.

**Secrets**

There are none, and there must not be any. This is a public static frontend; keys belong to the
backend stage, behind the API boundary.

---

## The next stage (not in this repository)

The boundary is already drawn, so the next stage is additive:

1. **Backend** implementing `src/services/endpoints.ts` over **Neon PostgreSQL**, with the
   entity separation above as the schema.
2. **Source ingestion and reconciliation** — records arriving with provenance attached instead
   of being authored by hand, and `Fact<T>.certainty` computed from corroboration rather than
   asserted.
3. **Further domains**, reusing the same work/creator/release/source model.

Until then, everything here is demonstration data, and the interface says so on every page.
