import { Link, useParams } from 'react-router-dom';
import { getWork } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { MusicNav } from '../../components/navigation/MusicNav';
import { SourceList } from '../../components/sources/SourceList';
import { DetailRow, FactList, FactRow } from '../../components/sources/FactRow';
import {
  Chip,
  DemoNotice,
  ErrorState,
  LoadingState,
  Section,
} from '../../components/ui/Primitives';
import { formatClockTime, formatPartialDate, PRECISION_LABEL } from '../../utils/date';
import {
  CLASSIFICATION_LABEL,
  CONTEXT_LABEL,
  FORMAT_LABEL,
  formatDuration,
  LANGUAGE_LABEL,
  MUSIC_TYPE_LABEL,
  RELEASE_TYPE_LABEL,
  ROLE_LABEL,
  WORK_TYPE_LABEL,
} from '../../utils/format';
import type { ClockTime, PartialDate } from '../../types/common';
import '../../styles/pages.css';

const RELATIONSHIP_LABEL: Record<string, string> = {
  'cover-of': 'Cover of',
  'remix-of': 'Remix of',
  reuses: 'Reuses material from',
  'sampled-in': 'Sampled in',
  'reissue-of': 'Reissue of',
  'companion-to': 'Companion to',
  'same-session': 'Same session as',
};

export function WorkPage() {
  const { slug = '' } = useParams();
  const state = useQuery(() => getWork(slug), [slug]);

  if (state.status === 'loading') {
    return (
      <div className="page">
        <LoadingState label="Loading work…" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="page">
        <ErrorState error={state.error} />
      </div>
    );
  }

  const { work, film, recordings, credits, relatedWorks, related, sources } = state.data;
  const firstAppearance = recordings[0]?.appearances[0];

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Timeline</Link>
        <span className="breadcrumbs__sep">/</span>
        <Link to="/music">Music</Link>
        <span className="breadcrumbs__sep">/</span>
        <Link to="/music/timeline">Chronology</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>{work.title}</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow page-head__eyebrow">
          {WORK_TYPE_LABEL[work.type]} · {LANGUAGE_LABEL[work.language]}
          {film ? ` · from ${film.title}` : ' · non-film'}
        </p>
        <h1 className="page-head__title display">{work.title}</h1>
        {work.titleNative ? (
          <p className="creator-head__native display subtle">{work.titleNative}</p>
        ) : null}
        <p className="page-head__lede">
          {recordings.length === 1
            ? 'One catalogued recording'
            : `${recordings.length} catalogued recordings`}
          {' · '}
          {recordings.reduce((total, entry) => total + entry.appearances.length, 0)} release
          {recordings.reduce((total, entry) => total + entry.appearances.length, 0) === 1
            ? ''
            : 's'}
          {firstAppearance?.event
            ? ` · first published ${formatPartialDate(firstAppearance.event.date.value)}`
            : ''}
        </p>
      </header>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <MusicNav />
      </div>

      <DemoNotice compact />

      <div className="work-layout">
        <main>
          <Section eyebrow="The work" title="Composition">
            <FactList>
              <DetailRow label="Type">{WORK_TYPE_LABEL[work.type]}</DetailRow>
              <DetailRow label="Language">{LANGUAGE_LABEL[work.language]}</DetailRow>
              <DetailRow label="Production">
                {film ? (
                  <>
                    Film music ·{' '}
                    <Link className="link" to={`/music/timeline?q=${encodeURIComponent(film.title)}`}>
                      {film.title}
                    </Link>{' '}
                    <span className="subtle mono">({film.releaseYear.value ?? 'year unknown'})</span>
                  </>
                ) : (
                  'Non-film'
                )}
              </DetailRow>
              <FactRow<PartialDate>
                label="Written"
                fact={work.writtenIn}
                render={(value) => formatPartialDate(value)}
                sources={sources}
                unknownLabel="Unknown"
              />
              {credits.work.map((group) => (
                <div className="credit-group" key={`work-${group.role}`}>
                  <span className="credit-group__role">{ROLE_LABEL[group.role]}</span>
                  <span className="credit-group__names">
                    {group.entries.map((entry) => (
                      <Link key={entry.creatorId} className="link" to={`/music/creator/${entry.slug}`}>
                        {entry.name}
                        {entry.detail ? <span className="subtle"> ({entry.detail})</span> : null}
                      </Link>
                    ))}
                  </span>
                </div>
              ))}
              {credits.work.every((group) => group.role !== 'lyricist') ? (
                <div className="credit-group">
                  <span className="credit-group__role">Lyricist</span>
                  <span className="credit-group__names">
                    <span className="fact__unknown">
                      Not recorded in this dataset
                    </span>
                  </span>
                </div>
              ) : null}
            </FactList>
          </Section>

          <Section
            eyebrow="Realisations"
            title={recordings.length === 1 ? 'The recording' : 'Recordings of this work'}
            description={
              recordings.length > 1
                ? 'Separate recordings of one composition. They stay attached to the same work rather than being catalogued as different songs.'
                : undefined
            }
          >
            {recordings.map(({ recording, appearances }) => (
              <article className="recording-block" key={recording.id}>
                <header className="recording-block__head">
                  <h3 className="recording-block__title display">
                    {recording.title}
                    {recording.versionLabel ? (
                      <span className="subtle"> · {recording.versionLabel}</span>
                    ) : null}
                  </h3>
                  <span className="chip-row">
                    <Chip>{MUSIC_TYPE_LABEL[recording.musicType]}</Chip>
                    <Chip>{formatDuration(recording.durationSeconds.value)}</Chip>
                  </span>
                </header>

                <div className="recording-block__body">
                  <FactList>
                    <FactRow<number>
                      label="Duration"
                      fact={recording.durationSeconds}
                      render={(value) => `${formatDuration(value)} (${value}s)`}
                      sources={sources}
                    />
                    <FactRow<PartialDate>
                      label="Recorded"
                      fact={recording.recordedIn}
                      render={(value) => formatPartialDate(value)}
                      sources={sources}
                    />
                    <DetailRow label="Music type">
                      {MUSIC_TYPE_LABEL[recording.musicType]}
                    </DetailRow>
                  </FactList>

                  <h4 className="panel__title" style={{ marginTop: 'var(--space-4)' }}>
                    Appearances ({appearances.length})
                  </h4>

                  {appearances.map((appearance) => (
                    <div className="appearance" key={appearance.release.id}>
                      <div className="appearance__head">
                        <span className="appearance__title display">
                          {appearance.release.title}
                        </span>
                        <span className="appearance__track mono">
                          track {appearance.trackNumber}
                        </span>
                        <span className="chip-row">
                          <Chip>{RELEASE_TYPE_LABEL[appearance.release.type]}</Chip>
                          <Chip tone={appearance.release.context === 'film' ? 'film' : 'neutral'}>
                            {CONTEXT_LABEL[appearance.release.context]}
                          </Chip>
                          <Chip
                            tone={
                              appearance.release.classification === 'commercial'
                                ? 'neutral'
                                : 'independent'
                            }
                          >
                            {CLASSIFICATION_LABEL[appearance.release.classification]}
                          </Chip>
                        </span>
                      </div>

                      <FactList>
                        <FactRow<PartialDate>
                          label="Release date"
                          fact={
                            appearance.event?.date ?? {
                              value: null,
                              certainty: 'unknown',
                              sourceIds: [],
                            }
                          }
                          render={(value) => (
                            <>
                              {formatPartialDate(value)}
                              {appearance.event ? (
                                <span className="subtle">
                                  {' '}
                                  · {PRECISION_LABEL[appearance.event.datePrecision].toLowerCase()}
                                </span>
                              ) : null}
                            </>
                          )}
                          sources={sources}
                        />
                        <FactRow<ClockTime>
                          label="Release time"
                          fact={
                            appearance.event?.time ?? {
                              value: null,
                              certainty: 'unknown',
                              sourceIds: [],
                            }
                          }
                          render={(value) => formatClockTime(value)}
                          sources={sources}
                        />
                        {appearance.label ? (
                          <DetailRow label="Label">{appearance.label.name}</DetailRow>
                        ) : null}
                        {appearance.event ? (
                          <DetailRow label="Format & territory">
                            {FORMAT_LABEL[appearance.event.format]} · {appearance.event.territory}
                          </DetailRow>
                        ) : null}
                      </FactList>

                      {appearance.release.note ? (
                        <p className="related-list__note" style={{ marginTop: 'var(--space-2)' }}>
                          {appearance.release.note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </Section>

          <Section
            eyebrow="Credits"
            title="Everyone credited"
            description="Credits attach to the level they belong to: writing to the work, performance to the recording, production and billing to the release."
          >
            <CreditColumn title="On the work" groups={credits.work} />
            <CreditColumn title="On the recordings" groups={credits.recording} />
            <CreditColumn title="On the releases" groups={credits.release} />
          </Section>
        </main>

        <aside className="work-aside">
          <div className="panel">
            <h2 className="panel__title">At a glance</h2>
            <ul className="related-list">
              <li className="related-list__item">
                <span className="subtle">Work id</span>
                <span className="mono" style={{ fontSize: 'var(--text-2xs)' }}>
                  {work.id}
                </span>
              </li>
              <li className="related-list__item">
                <span className="subtle">Recordings</span>
                <span className="mono">{recordings.length}</span>
              </li>
              <li className="related-list__item">
                <span className="subtle">Releases</span>
                <span className="mono">
                  {recordings.reduce((total, entry) => total + entry.appearances.length, 0)}
                </span>
              </li>
              <li className="related-list__item">
                <span className="subtle">Source records</span>
                <a className="mono link" href="#sources">
                  {sources.length}
                </a>
              </li>
            </ul>
          </div>

          {relatedWorks.length > 0 ? (
            <div className="panel">
              <h2 className="panel__title">Recorded relationships</h2>
              <ul className="related-list">
                {relatedWorks.map(({ relationship, work: other, direction }) => (
                  <li key={relationship.id}>
                    <div className="related-list__item">
                      <Link className="link" to={`/music/work/${other.slug}`}>
                        {other.title}
                      </Link>
                      <span className="collaborator__role">
                        {direction === 'outgoing'
                          ? (RELATIONSHIP_LABEL[relationship.type] ?? relationship.type)
                          : 'Referenced by'}
                      </span>
                    </div>
                    {relationship.note ? (
                      <p className="related-list__note">{relationship.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {related.sameRelease.length > 0 ? (
            <div className="panel">
              <h2 className="panel__title">Also on the same release</h2>
              <ul className="related-list">
                {related.sameRelease.slice(0, 8).map((item) => (
                  <li className="related-list__item" key={item.workSlug}>
                    <Link className="link" to={`/music/work/${item.workSlug}`}>
                      {item.title}
                    </Link>
                    <span className="collaborator__count">{item.releaseTitle}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {related.sameCreator.length > 0 ? (
            <div className="panel">
              <h2 className="panel__title">By the same composer</h2>
              <ul className="related-list">
                {related.sameCreator.map((item) => (
                  <li className="related-list__item" key={item.workSlug}>
                    <Link className="link" to={`/music/work/${item.workSlug}`}>
                      {item.title}
                    </Link>
                    <span className="collaborator__count mono">{item.year ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      <Section
        eyebrow="Provenance"
        title="Sources"
        description="Which record supports which fact. Every locator below is a placeholder in the timeline-demo:// scheme — nothing here is a citation."
        id="sources"
      >
        <SourceList sources={sources} />
      </Section>
    </div>
  );
}

function CreditColumn({
  title,
  groups,
}: {
  title: string;
  groups: Array<{
    role: string;
    entries: Array<{ creatorId: string; slug: string; name: string; detail?: string }>;
  }>;
}) {
  if (groups.length === 0) return null;
  return (
    <div style={{ marginBottom: 'var(--space-5)' }}>
      <h3 className="panel__title">{title}</h3>
      <div>
        {groups.map((group) => (
          <div className="credit-group" key={`${title}-${group.role}`}>
            <span className="credit-group__role">
              {ROLE_LABEL[group.role as keyof typeof ROLE_LABEL] ?? group.role}
            </span>
            <span className="credit-group__names">
              {group.entries.map((entry) => (
                <Link key={entry.creatorId} className="link" to={`/music/creator/${entry.slug}`}>
                  {entry.name}
                  {entry.detail ? <span className="subtle"> ({entry.detail})</span> : null}
                </Link>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
