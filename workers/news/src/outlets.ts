export interface Outlet {
  id: string;
  name: string;
  homepage: string;
  feedUrl: string;
  region: string;
}

/**
 * Trusted, free, directly-published RSS feeds — no API key, no aggregator
 * proxy. Reuters and AP no longer publish free direct RSS (Reuters dropped
 * theirs in 2020), so they are deliberately not routed through a Google
 * News scrape workaround: that would be aggregator content wearing a
 * publisher's name. Five editorially independent outlets is enough for the
 * clustering layer to have real cross-source corroboration to find.
 */
export const OUTLETS: Outlet[] = [
  {
    id: 'bbc-world',
    name: 'BBC News',
    homepage: 'https://www.bbc.com/news',
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    region: 'UK',
  },
  {
    id: 'npr-news',
    name: 'NPR',
    homepage: 'https://www.npr.org',
    feedUrl: 'https://feeds.npr.org/1001/rss.xml',
    region: 'US',
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    homepage: 'https://www.aljazeera.com',
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    region: 'International',
  },
  {
    id: 'guardian-world',
    name: 'The Guardian',
    homepage: 'https://www.theguardian.com/world',
    feedUrl: 'https://www.theguardian.com/world/rss',
    region: 'UK',
  },
  {
    id: 'pbs-newshour',
    name: 'PBS NewsHour',
    homepage: 'https://www.pbs.org/newshour',
    feedUrl: 'https://www.pbs.org/newshour/feeds/rss/headlines',
    region: 'US',
  },
];

export const outletById = new Map(OUTLETS.map((outlet) => [outlet.id, outlet]));
