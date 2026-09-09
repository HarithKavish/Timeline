import type { NewsOutlet } from '../../types/news';
import './news.css';

/** The News domain's counterpart to `DemoNotice` — this domain is the one real pipeline in the build. */
export function LiveNotice({ outlets }: { outlets: NewsOutlet[] }) {
  return (
    <aside className="live-notice" aria-label="Data status">
      <span className="live-notice__tag mono">LIVE DATA</span>
      <p>
        Ingested every 20 minutes from {outlets.length || 'several'} outlets'
        {' '}own RSS feeds{outlets.length ? ` (${outlets.map((o) => o.name).join(', ')})` : ''} — every
        article links to the real source. Topics and threads are grouped automatically by a
        similarity heuristic, not edited by hand, so occasional mis-groupings are expected; see{' '}
        <code className="mono">workers/news/README.md</code> for how it works.
      </p>
    </aside>
  );
}
