import { Link } from 'react-router-dom';
import type { TimelineEntry } from '../../types/music';
import {
  CLASSIFICATION_LABEL,
  CONTEXT_LABEL,
  formatDuration,
  LANGUAGE_LABEL,
  MUSIC_TYPE_LABEL,
  RELEASE_TYPE_LABEL,
} from '../../utils/format';
import { formatPartialDate } from '../../utils/date';
import { Chip } from '../ui/Primitives';
import { SourceCount } from '../sources/SourceList';
import './timeline.css';

function creditNames(entry: TimelineEntry, role: 'composer' | 'vocalist' | 'lyricist') {
  const seen = new Set<string>();
  return entry.credits.filter((credit) => {
    if (credit.role !== role || seen.has(credit.creatorId)) return false;
    seen.add(credit.creatorId);
    return true;
  });
}

/**
 * One catalogued appearance of a recording. Dense by design: everything a
 * researcher scans for — when, who, on what, how long, how well sourced —
 * without opening the entry.
 */
export function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const composers = creditNames(entry, 'composer');
  const vocalists = creditNames(entry, 'vocalist');
  const date = entry.date.value;

  return (
    <li className="tl-row">
      <div className="tl-row__date">
        <span className="tl-row__date-main mono">
          {date ? formatPartialDate(date, { short: true }) : 'Undated'}
        </span>
        {entry.datePrecision !== 'day' && date ? (
          <span className="tl-row__precision" title={`Known to ${entry.datePrecision} precision`}>
            {entry.datePrecision === 'year' ? 'year only' : 'month only'}
          </span>
        ) : null}
      </div>

      <div className="tl-row__spine" aria-hidden="true">
        <span className={`tl-row__node${date ? '' : ' tl-row__node--undated'}`} />
      </div>

      <div className="tl-row__body">
        <h3 className="tl-row__title">
          <Link className="tl-row__link display" to={`/music/work/${entry.workSlug}`}>
            {entry.title}
          </Link>
          {entry.versionLabel ? (
            <span className="tl-row__version subtle"> · {entry.versionLabel}</span>
          ) : null}
          {entry.isSubsequentRelease ? (
            <span className="tl-row__reappearance" title="A later appearance of a recording first issued elsewhere">
              later appearance
            </span>
          ) : null}
        </h3>

        {entry.titleNative ? <p className="tl-row__native subtle">{entry.titleNative}</p> : null}

        <p className="tl-row__credits">
          {composers.length > 0 ? (
            <>
              {composers.map((credit, index) => (
                <span key={credit.creatorId}>
                  {index > 0 ? ', ' : ''}
                  <Link className="link" to={`/music/creator/${credit.creatorSlug}`}>
                    {credit.creatorName}
                  </Link>
                </span>
              ))}
            </>
          ) : (
            <span className="subtle">Composer not recorded</span>
          )}
          {vocalists.length > 0 ? (
            <span className="muted">
              {' · voc. '}
              {vocalists.map((credit) => credit.creatorName).join(', ')}
            </span>
          ) : null}
        </p>

        <p className="tl-row__release muted">
          {entry.filmTitle ? (
            <>
              <span className="tl-row__film">{entry.filmTitle}</span>
              {entry.releaseTitle !== entry.filmTitle ? (
                <span className="subtle"> · {entry.releaseTitle}</span>
              ) : null}
            </>
          ) : (
            entry.releaseTitle
          )}
        </p>

        <div className="tl-row__meta">
          <Chip>{RELEASE_TYPE_LABEL[entry.releaseType]}</Chip>
          <Chip tone={entry.context === 'film' ? 'film' : 'neutral'}>
            {CONTEXT_LABEL[entry.context]}
          </Chip>
          <Chip tone={entry.classification === 'commercial' ? 'neutral' : 'independent'}>
            {CLASSIFICATION_LABEL[entry.classification]}
          </Chip>
          <Chip>{MUSIC_TYPE_LABEL[entry.musicType]}</Chip>
          <Chip>{LANGUAGE_LABEL[entry.language]}</Chip>
          <span className="tl-row__duration mono" title={
            entry.durationSeconds.value === null
              ? 'No source states a duration'
              : `${entry.durationSeconds.value} seconds`
          }>
            {formatDuration(entry.durationSeconds.value)}
          </span>
          <SourceCount count={entry.sourceIds.length} />
        </div>
      </div>
    </li>
  );
}
