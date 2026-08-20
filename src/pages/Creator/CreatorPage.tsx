import { Link, useParams } from 'react-router-dom';
import { getCreator } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { MusicNav } from '../../components/navigation/MusicNav';
import { TimelineExplorer } from '../../components/timeline/TimelineExplorer';
import { CareerRidge } from '../../components/creators/CreatorCard';
import { SourceList } from '../../components/sources/SourceList';
import { FactList, FactRow } from '../../components/sources/FactRow';
import {
  Chip,
  DemoNotice,
  ErrorState,
  LoadingState,
  Section,
  Stat,
  StatGrid,
} from '../../components/ui/Primitives';
import { formatPartialDate } from '../../utils/date';
import { LANGUAGE_LABEL, ROLE_LABEL } from '../../utils/format';
import type { PartialDate } from '../../types/common';
import '../../styles/pages.css';

export function CreatorPage() {
  const { slug = '' } = useParams();
  const state = useQuery(() => getCreator(slug), [slug]);

  if (state.status === 'loading') {
    return (
      <div className="page">
        <LoadingState label="Loading creator…" />
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

  const { creator, person, activeSpan, histogram } = state.data;
  const span =
    activeSpan.from !== null && activeSpan.to !== null
      ? { from: activeSpan.from, to: activeSpan.to }
      : null;

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Timeline</Link>
        <span className="breadcrumbs__sep">/</span>
        <Link to="/music">Music</Link>
        <span className="breadcrumbs__sep">/</span>
        <Link to="/music/creators">Creators</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>{creator.name}</span>
      </nav>

      <header className="creator-head">
        <div className="creator-head__top">
          <div>
            <p className="eyebrow">
              {creator.kind === 'group' ? 'Group' : 'Person'} · Music · {creator.languages
                .map((language) => LANGUAGE_LABEL[language])
                .join(', ')}
            </p>
            <h1 className="creator-head__name display">{creator.name}</h1>
            {creator.nameNative ? (
              <p className="creator-head__native display subtle">{creator.nameNative}</p>
            ) : null}
            {creator.alternateNames.length > 0 ? (
              <p className="creator-head__alt muted">
                Also credited as: {creator.alternateNames.join(' · ')}
              </p>
            ) : null}
          </div>

          {span && histogram.length > 1 ? (
            <div style={{ textAlign: 'right' }}>
              <p className="eyebrow" style={{ marginBottom: 'var(--space-1)' }}>
                Output per year
              </p>
              <CareerRidge histogram={histogram} span={span} height={34} />
              <p className="mono subtle" style={{ fontSize: 'var(--text-2xs)' }}>
                {span.from}–{span.to}
              </p>
            </div>
          ) : null}
        </div>

        <p className="creator-head__summary">{creator.summary}</p>

        <div className="creator-head__roles">
          {creator.roles.map((role) => (
            <Chip key={role} tone={role === 'composer' ? 'accent' : 'neutral'}>
              {ROLE_LABEL[role]}
            </Chip>
          ))}
        </div>
      </header>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <MusicNav />
      </div>

      <DemoNotice compact />

      <Section eyebrow="Catalogue" title="In this catalogue">
        <StatGrid>
          <Stat label="Works" value={state.data.workCount} hint="first appearances" />
          <Stat label="Releases" value={state.data.releaseCount} />
          <Stat label="Films" value={state.data.filmCount} />
          <Stat
            label="Active span"
            value={span ? `${span.from}–${span.to}` : '—'}
            hint="dated entries"
          />
          <Stat
            label="Credited as"
            value={state.data.topRoles.length}
            hint={state.data.topRoles.map((role) => ROLE_LABEL[role]).join(', ')}
          />
        </StatGrid>
      </Section>

      <Section eyebrow="Record" title="Catalogued facts">
        <FactList>
          <FactRow<PartialDate>
            label="Active from"
            fact={creator.activeFrom}
            render={(value) => formatPartialDate(value)}
            sources={state.data.sources}
          />
          <FactRow<PartialDate>
            label="Active until"
            fact={creator.activeUntil}
            render={(value) => formatPartialDate(value)}
            sources={state.data.sources}
            unknownLabel="No end date recorded"
          />
          {person ? (
            <>
              <FactRow<PartialDate>
                label="Born"
                fact={person.bornOn}
                render={(value) => formatPartialDate(value)}
                sources={state.data.sources}
              />
              {person.diedOn ? (
                <FactRow<PartialDate>
                  label="Died"
                  fact={person.diedOn}
                  render={(value) => formatPartialDate(value)}
                  sources={state.data.sources}
                />
              ) : null}
              {person.birthPlace ? (
                <FactRow<string>
                  label="Birth place"
                  fact={person.birthPlace}
                  render={(value) => value}
                  sources={state.data.sources}
                />
              ) : null}
            </>
          ) : null}
        </FactList>
      </Section>

      {state.data.films.length > 0 ? (
        <Section eyebrow="Films" title="Films with catalogued music">
          <div className="film-list">
            {state.data.films.map((film) => (
              <Link
                key={film.id}
                className="film-pill"
                to={`/music/timeline?q=${encodeURIComponent(film.title)}`}
              >
                {film.title}
                <span className="film-pill__year mono">{film.releaseYear.value ?? '—'}</span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {state.data.collaborators.length > 0 ? (
        <Section
          eyebrow="Relationships"
          title="Most frequent collaborators"
          description="Counted across catalogued first appearances, by the role the collaborator was credited in."
        >
          <ul className="collaborators">
            {state.data.collaborators.map((collaborator) => (
              <li key={`${collaborator.creatorId}-${collaborator.role}`}>
                <Link className="collaborator" to={`/music/creator/${collaborator.slug}`}>
                  <span>{collaborator.name}</span>
                  <span className="collaborator__role">{ROLE_LABEL[collaborator.role]}</span>
                  <span className="collaborator__count mono">{collaborator.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section
        eyebrow="Chronology"
        title={`Everything by ${creator.name}, in order`}
        description="Filters apply within this creator's catalogue. Use the credited-role filter to see, for example, only the entries where they are the composer."
      >
        <TimelineExplorer
          base={{ creatorId: creator.id }}
          emptyHint="No entries credited to this creator match the current filters."
        />
      </Section>

      <Section
        eyebrow="Provenance"
        title="Sources behind this page"
        description="Every record below is a demonstration placeholder, kept to show how fact-level attribution will be presented."
        id="sources"
      >
        <SourceList sources={state.data.sources} />
      </Section>
    </div>
  );
}
