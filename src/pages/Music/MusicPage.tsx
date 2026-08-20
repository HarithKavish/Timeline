import { Link } from 'react-router-dom';
import { getMusicOverview } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { MusicNav } from '../../components/navigation/MusicNav';
import { SearchLauncher } from '../../components/search/SearchLauncher';
import {
  Chip,
  DemoNotice,
  ErrorState,
  LoadingState,
  Section,
  Stat,
  StatGrid,
} from '../../components/ui/Primitives';
import { CreatorCard, CreatorGrid } from '../../components/creators/CreatorCard';
import { formatPartialDate } from '../../utils/date';
import {
  CLASSIFICATION_LABEL,
  CONTEXT_LABEL,
  LANGUAGE_LABEL,
  RELEASE_TYPE_LABEL,
} from '../../utils/format';
import '../../styles/pages.css';

export function MusicPage() {
  const state = useQuery(() => getMusicOverview(), []);

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Timeline</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>Music</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow page-head__eyebrow">Domain · Music</p>
        <h1 className="page-head__title display">
          A chronological catalogue of Tamil music
        </h1>
        <p className="page-head__lede">
          Not a listening service. Timeline records what was written, who realised it, when it
          was published, how the publications relate to each other, and which source says so.
          Playback is somebody else&rsquo;s job.
        </p>
        <div style={{ marginTop: 'var(--space-4)', maxWidth: '32rem' }}>
          <SearchLauncher />
        </div>
      </header>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <MusicNav />
      </div>

      <DemoNotice compact />

      {state.status === 'loading' ? (
        <LoadingState />
      ) : state.status === 'error' ? (
        <ErrorState error={state.error} />
      ) : (
        <>
          <Section eyebrow="Scale" title="What is catalogued">
            <StatGrid>
              <Stat label="Works" value={state.data.totals.works} hint="compositions" />
              <Stat
                label="Recordings"
                value={state.data.totals.recordings}
                hint="realisations of those works"
              />
              <Stat
                label="Releases"
                value={state.data.totals.releases}
                hint="albums, singles, EPs, compilations"
              />
              <Stat label="Creators" value={state.data.totals.creators} />
              <Stat label="Films" value={state.data.totals.films} />
              <Stat label="Source records" value={state.data.totals.sources} hint="all demo" />
            </StatGrid>
          </Section>

          <Section
            eyebrow="Language"
            title="Tamil first, by design"
            description="Language is a property of the work, not of the release that carries it — which is why a Malayalam track on a Tamil soundtrack is catalogued as Malayalam."
          >
            <div className="entry-grid">
              {state.data.languages.map(({ language, count }) => (
                <Link
                  key={language}
                  className="entry-card"
                  to={`/music/timeline?lang=${language}`}
                >
                  <span className="entry-card__title">
                    {LANGUAGE_LABEL[language]}
                    <span className="mono subtle" style={{ fontSize: 'var(--text-xs)' }}>
                      {count}
                    </span>
                  </span>
                  <span className="entry-card__desc">
                    {count} {count === 1 ? 'entry' : 'entries'} in the catalogue
                  </span>
                </Link>
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Cross-sections"
            title="Film, non-film, and everything issued independently"
            description="Production context and commercial classification are separate axes. Independent music is not automatically non-film, and a soundtrack is not automatically commercial."
          >
            <div className="entry-grid">
              {state.data.byContext.map(({ context, count }) => (
                <Link
                  key={context}
                  className="entry-card"
                  to={`/music/timeline?ctx=${context}`}
                >
                  <span className="entry-card__title">
                    {CONTEXT_LABEL[context]} music
                    <span className="mono subtle" style={{ fontSize: 'var(--text-xs)' }}>
                      {count}
                    </span>
                  </span>
                  <span className="entry-card__desc">
                    {context === 'film'
                      ? 'Written for a film and published alongside it.'
                      : 'Standing on its own, outside a film production.'}
                  </span>
                </Link>
              ))}
              <Link className="entry-card" to="/music/timeline?class=independent,self-released">
                <span className="entry-card__title">
                  Independent &amp; self-released
                  <Chip tone="independent">classification</Chip>
                </span>
                <span className="entry-card__desc">
                  Releases issued outside a commercial label arrangement.
                </span>
              </Link>
            </div>
          </Section>

          <Section
            eyebrow="Release types"
            title="Albums, singles, EPs, compilations"
            description="A single that later appears on a soundtrack is one recording with two releases — the catalogue keeps both without inventing a second song."
          >
            <ul className="compact-list">
              {state.data.byReleaseType.map(({ type, count }) => (
                <li key={type}>
                  <Link className="compact-row" to={`/music/timeline?type=${type}`}>
                    <span className="compact-row__date mono">{count}</span>
                    <span className="compact-row__title">{RELEASE_TYPE_LABEL[type]}</span>
                    <span className="compact-row__meta">view in timeline →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            eyebrow="Chronology"
            title="Both ends of the catalogue"
            description="The earliest and most recent dated entries currently held."
            action={
              <Link className="link" to="/music/timeline">
                Open the timeline
              </Link>
            }
          >
            <div className="entry-grid">
              <div>
                <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
                  Earliest
                </p>
                <ol className="compact-list">
                  {state.data.earliest.map((entry) => (
                    <li key={entry.id}>
                      <Link className="compact-row" to={`/music/work/${entry.workSlug}`}>
                        <span className="compact-row__date mono">
                          {formatPartialDate(entry.date.value, { short: true })}
                        </span>
                        <span className="compact-row__title">{entry.title}</span>
                        <span className="compact-row__meta">
                          {CLASSIFICATION_LABEL[entry.classification]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
                  Most recent
                </p>
                <ol className="compact-list">
                  {state.data.recent.slice(0, 4).map((entry) => (
                    <li key={entry.id}>
                      <Link className="compact-row" to={`/music/work/${entry.workSlug}`}>
                        <span className="compact-row__date mono">
                          {formatPartialDate(entry.date.value, { short: true })}
                        </span>
                        <span className="compact-row__title">{entry.title}</span>
                        <span className="compact-row__meta">
                          {CLASSIFICATION_LABEL[entry.classification]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Section>

          <Section
            eyebrow="People"
            title="Creator discovery"
            action={
              <Link className="link" to="/music/creators">
                All creators
              </Link>
            }
          >
            <CreatorGrid>
              {state.data.featuredCreators.map((summary) => (
                <CreatorCard key={summary.creator.id} summary={summary} />
              ))}
            </CreatorGrid>
          </Section>
        </>
      )}
    </div>
  );
}
