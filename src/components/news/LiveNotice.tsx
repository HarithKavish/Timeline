import type { NewsOutlet } from '../../types/news';
import './news.css';

/** The News domain's counterpart to `DemoNotice` — this domain is the one real pipeline in the build. */
export function LiveNotice({ outlets }: { outlets: NewsOutlet[] }) {
  const cityOutlets = outlets.filter((outlet) => outlet.category === 'city');
  return (
    <aside className="live-notice" aria-label="Data status">
      <span className="live-notice__tag mono">LIVE DATA</span>
      <p>
        Ingested every 5 minutes across four tiers — International (excluding India), National
        (India), State (Tamil Nadu) and City (Rajapalayam) — from {outlets.length || 'several'}
        {' '}outlets' own feeds, most articles linking straight to the real source. Topics and
        threads are grouped automatically by a similarity heuristic, not edited by hand, so
        occasional mis-groupings are expected.
        {cityOutlets.length > 0 ? (
          <>
            {' '}The City tier is currently empty: no outlet publishes a dedicated Rajapalayam
            feed, and the Google News search feed that would stand in for one is itself blocked
            for this worker's network range (confirmed — it succeeds from an ordinary
            connection). Not a timing issue; see the note in that section below.
          </>
        ) : null}{' '}
        See <code className="mono">workers/news/README.md</code> for how it works.
      </p>
    </aside>
  );
}
