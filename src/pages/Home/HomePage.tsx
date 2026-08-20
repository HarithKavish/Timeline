import { Link } from 'react-router-dom';
import { getMusicOverview } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { domains } from '../../data/domains';
import { SearchLauncher } from '../../components/search/SearchLauncher';
import {
  Chip,
  DemoNotice,
  LoadingState,
  Section,
  Stat,
  StatGrid,
} from '../../components/ui/Primitives';
import { CreatorCard, CreatorGrid } from '../../components/creators/CreatorCard';
import { ChevronRightIcon, LayersIcon, PeopleIcon, TimelineIcon } from '../../components/ui/Icon';
import { formatPartialDate } from '../../utils/date';
import { CONTEXT_LABEL, RELEASE_TYPE_LABEL } from '../../utils/format';
import type { YearBucket } from '../../types/api';
import '../../styles/pages.css';

const CHAIN = ['What', 'Who', 'When', 'Relationships', 'Sources'];

export function HomePage() {
  const state = useQuery(() => getMusicOverview(), []);
  const overview = state.data;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1 className="hero__title display">Everything, in the order it happened.</h1>
          <p className="hero__lede">
            Timeline is a catalogue of creative works arranged by when they appeared — and a
            record of where every date, credit and claim came from.
          </p>

          <p className="hero__chain">
            {CHAIN.map((step, index) => (
              <span key={step}>
                {index > 0 ? <span className="hero__chain-arrow"> → </span> : null}
                <span className="hero__chain-step">{step}</span>
              </span>
            ))}
          </p>

          <div className="hero__search">
            <SearchLauncher size="large" />
          </div>
        </div>

        <figure className="hero__figure">
          <ChronoStrip histogram={overview?.histogram ?? []} span={overview?.span ?? null} />
        </figure>
      </section>

      <div style={{ marginTop: 'var(--space-5)' }}>
        <DemoNotice />
      </div>

      <Section
        eyebrow="Start here"
        title="Choose a domain"
        description="Music is catalogued. The rest are declared now because the model — work, creator, release, source — is meant to carry them without being rebuilt."
      >
        <div className="domain-grid">
          {domains.map((domain) => {
            const available = domain.status === 'available';
            return (
              <Link
                key={domain.id}
                to={domain.path}
                className={`domain-card${available ? ' domain-card--available' : ''}`}
              >
                <span className="domain-card__name display">
                  {domain.label}
                  {available ? <ChevronRightIcon size={16} /> : null}
                </span>
                <span className="domain-card__blurb">{domain.blurb}</span>
                <span className="domain-card__status">
                  {available ? 'Catalogued' : 'Planned'}
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      {state.status === 'loading' ? (
        <LoadingState />
      ) : overview ? (
        <>
          <Section
            eyebrow="The catalogue so far"
            title="Tamil music, 1976 onward"
            description="Counts from the demonstration dataset. Recordings are counted once at first publication; later appearances are kept, but not double-counted."
            action={
              <Link className="link" to="/music">
                Open Music
              </Link>
            }
          >
            <StatGrid>
              <Stat label="Works" value={overview.totals.works} hint="compositions" />
              <Stat label="Recordings" value={overview.totals.recordings} hint="realisations" />
              <Stat label="Releases" value={overview.totals.releases} hint="published packages" />
              <Stat label="Creators" value={overview.totals.creators} />
              <Stat label="Films" value={overview.totals.films} />
              <Stat
                label="Span"
                value={`${overview.span.from}–${overview.span.to}`}
                hint="years covered"
              />
            </StatGrid>
          </Section>

          <Section
            eyebrow="Discovery"
            title="Ways in"
            description="Every entry point below is the same timeline with a different filter applied — filters live in the URL, so any view can be shared."
          >
            <div className="entry-grid">
              <EntryCard
                to="/music/timeline"
                icon={<TimelineIcon size={16} />}
                title="The full chronology"
                desc="Every catalogued entry from the earliest to the most recent, filterable on ten dimensions."
              />
              <EntryCard
                to="/music/creators"
                icon={<PeopleIcon size={16} />}
                title="Creators"
                desc="Composers, lyricists and vocalists, with the span of their catalogued output."
              />
              <EntryCard
                to="/music/timeline?ctx=non-film&class=independent"
                icon={<LayersIcon size={16} />}
                title="Independent, non-film"
                desc="Work released outside the film-soundtrack pipeline."
              />
              <EntryCard
                to="/music/timeline?music=instrumental,background-score"
                icon={<LayersIcon size={16} />}
                title="Instrumental & score"
                desc="Pieces with no vocal line, including cues catalogued as score."
              />
            </div>
          </Section>

          <Section
            eyebrow="Most recently dated"
            title="Latest in the catalogue"
            action={
              <Link className="link" to="/music/timeline?sort=desc">
                Newest first
              </Link>
            }
          >
            <ol className="compact-list">
              {overview.recent.map((entry) => (
                <li key={entry.id}>
                  <Link className="compact-row" to={`/music/work/${entry.workSlug}`}>
                    <span className="compact-row__date mono">
                      {formatPartialDate(entry.date.value, { short: true })}
                    </span>
                    <span className="compact-row__title">
                      {entry.title}
                      <span className="subtle"> · {entry.releaseTitle}</span>
                    </span>
                    <span className="compact-row__meta">
                      {RELEASE_TYPE_LABEL[entry.releaseType]} · {CONTEXT_LABEL[entry.context]}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </Section>

          <Section
            eyebrow="People"
            title="Creators with the most catalogued work"
            action={
              <Link className="link" to="/music/creators">
                All creators
              </Link>
            }
          >
            <CreatorGrid>
              {overview.featuredCreators.map((summary) => (
                <CreatorCard key={summary.creator.id} summary={summary} />
              ))}
            </CreatorGrid>
          </Section>

          <Section
            eyebrow="Method"
            title="What Timeline records, and what it refuses to"
          >
            <div className="entry-grid">
              <article className="entry-card">
                <h3 className="entry-card__title">Known</h3>
                <p className="entry-card__desc">
                  Two or more independent source records agree. Shown plainly, with the sources
                  attached to the individual fact rather than the whole page.
                </p>
              </article>
              <article className="entry-card">
                <h3 className="entry-card__title">Source reported</h3>
                <p className="entry-card__desc">
                  One source asserts it. Recorded and attributed, but never presented as
                  established — the distinction is visible in the interface.
                </p>
              </article>
              <article className="entry-card">
                <h3 className="entry-card__title">Unknown</h3>
                <p className="entry-card__desc">
                  Nothing establishes it, so nothing is invented. A release with no recorded
                  time reads <em>Unknown</em>, not midnight; a year-only date stays a year.
                </p>
              </article>
              <article className="entry-card">
                <h3 className="entry-card__title">Chip these apart</h3>
                <p className="entry-card__desc">
                  A work, a recording of it, and a release carrying that recording are three
                  different things. Collapsing them is how catalogues lose their reissues.
                </p>
              </article>
            </div>
          </Section>
        </>
      ) : null}
    </div>
  );
}

function EntryCard({
  to,
  title,
  desc,
  icon,
}: {
  to: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link to={to} className="entry-card">
      <span className="entry-card__title">
        {icon}
        {title}
      </span>
      <span className="entry-card__desc">{desc}</span>
    </Link>
  );
}

/**
 * The home page's picture of chronology: a decade-by-decade density read of the
 * catalogue. Deliberately unlabelled per-bar — it is an invitation, and the
 * real numbers live one click away on the timeline.
 */
function ChronoStrip({
  histogram,
  span,
}: {
  histogram: YearBucket[];
  span: { from: number; to: number } | null;
}) {
  if (!span || histogram.length === 0) {
    return (
      <div className="chrono-strip">
        <p className="subtle" style={{ fontSize: 'var(--text-xs)' }}>
          Loading the shape of the catalogue…
        </p>
      </div>
    );
  }

  const decades = new Map<number, number>();
  for (const bucket of histogram) {
    const decade = Math.floor(bucket.year / 10) * 10;
    decades.set(decade, (decades.get(decade) ?? 0) + bucket.count);
  }
  const rows = [...decades.entries()].sort((a, b) => a[0] - b[0]);
  const max = Math.max(...rows.map(([, count]) => count));

  return (
    <div className="chrono-strip">
      <div className="chrono-strip__head">
        <span className="eyebrow">Entries by decade</span>
        <span className="mono subtle" style={{ fontSize: 'var(--text-2xs)' }}>
          {span.from}–{span.to}
        </span>
      </div>
      <div className="chrono-strip__rows">
        {rows.map(([decade, count]) => (
          <Link key={decade} className="chrono-strip__row" to={`/music/timeline?from=${decade}&to=${decade + 9}`}>
            <span className="chrono-strip__year mono">{decade}s</span>
            <span className="chrono-strip__bar">
              <span
                className="chrono-strip__fill"
                style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
              />
            </span>
          </Link>
        ))}
      </div>
      <p className="chrono-strip__foot">
        Click a decade to open it in the timeline. <Chip tone="accent">demo data</Chip>
      </p>
    </div>
  );
}
