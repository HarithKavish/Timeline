import type { NewsCategory } from './types';

export interface Outlet {
  id: string;
  name: string;
  homepage: string;
  feedUrl: string;
  region: string;
  category: NewsCategory;
}

/**
 * Four geographic tiers, each sourced the most honestly available way:
 *
 * - **International** (excludes the home nation, India) — five trusted,
 *   free, directly-published outlet feeds. No API key, no aggregator proxy.
 *   Reuters and AP no longer publish free direct RSS (Reuters dropped
 *   theirs in 2020), so they are deliberately not routed through a Google
 *   News scrape workaround — that would be aggregator content wearing a
 *   publisher's name.
 * - **National** (India) and **State** (Tamil Nadu) — direct publisher
 *   feeds from established Indian outlets. The Hindu's feeds are NOT used
 *   here despite being real and correctly formatted: they return HTTP 403
 *   specifically to Cloudflare Workers' egress IP range (confirmed — the
 *   identical request with the identical User-Agent succeeds from a normal
 *   residential IP), so they can never actually be ingested from this
 *   Worker. Times of India and The New Indian Express do not block that
 *   range and are used instead.
 * - **City** (Rajapalayam, Tamil Nadu) — no outlet publishes a dedicated
 *   feed for a town this size, so there is no direct-publisher option here
 *   at all. A Google News search feed is the only real free source of
 *   Rajapalayam-specific coverage; it is noisier than the other tiers
 *   (product listings and unrelated pages can surface alongside genuine
 *   local news) and is used only because the alternative is no city tier.
 *   A Tamil-language query is included alongside the English one, since
 *   hyperlocal coverage of a Tamil-speaking town is more likely to exist
 *   in the Tamil press.
 */
export const OUTLETS: Outlet[] = [
  {
    id: 'bbc-world',
    name: 'BBC News',
    homepage: 'https://www.bbc.com/news',
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    region: 'UK',
    category: 'international',
  },
  {
    id: 'npr-news',
    name: 'NPR',
    homepage: 'https://www.npr.org',
    feedUrl: 'https://feeds.npr.org/1001/rss.xml',
    region: 'US',
    category: 'international',
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    homepage: 'https://www.aljazeera.com',
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    region: 'International',
    category: 'international',
  },
  {
    id: 'guardian-world',
    name: 'The Guardian',
    homepage: 'https://www.theguardian.com/world',
    feedUrl: 'https://www.theguardian.com/world/rss',
    region: 'UK',
    category: 'international',
  },
  {
    id: 'pbs-newshour',
    name: 'PBS NewsHour',
    homepage: 'https://www.pbs.org/newshour',
    feedUrl: 'https://www.pbs.org/newshour/feeds/rss/headlines',
    region: 'US',
    category: 'international',
  },
  {
    // Verified directly against ToI's own RSS directory (timesofindia.indiatimes.com/rss.cms)
    // after a first deploy revealed -296589292 is actually their "World" feed, not India —
    // it was quietly mixing UK/world stories into the National tier. -2128936835 is the real
    // one, labelled "India" there.
    id: 'toi-india',
    name: 'Times of India',
    homepage: 'https://timesofindia.indiatimes.com/india',
    feedUrl: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms',
    region: 'India',
    category: 'national',
  },
  {
    id: 'toi-chennai',
    name: 'Times of India',
    homepage: 'https://timesofindia.indiatimes.com/city/chennai',
    feedUrl: 'https://timesofindia.indiatimes.com/rssfeeds/2950623.cms',
    region: 'Chennai',
    category: 'state',
  },
  {
    id: 'nie-tamilnadu',
    name: 'The New Indian Express',
    homepage: 'https://www.newindianexpress.com/states/tamil-nadu/',
    feedUrl: 'https://www.newindianexpress.com/states/tamil-nadu/rssfeed/?id=170&getXmlFeed=true',
    region: 'Tamil Nadu',
    category: 'state',
  },
  {
    id: 'rajapalayam-en',
    name: 'Google News (Rajapalayam)',
    homepage: 'https://news.google.com/search?q=Rajapalayam',
    feedUrl: 'https://news.google.com/rss/search?q=Rajapalayam&hl=en-IN&gl=IN&ceid=IN:en',
    region: 'Rajapalayam',
    category: 'city',
  },
  {
    id: 'rajapalayam-ta',
    name: 'Google News (ராஜபாளையம்)',
    homepage: 'https://news.google.com/search?q=%E0%AE%B0%E0%AE%BE%E0%AE%9C%E0%AE%AA%E0%AE%BE%E0%AE%B3%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D',
    feedUrl:
      'https://news.google.com/rss/search?q=%E0%AE%B0%E0%AE%BE%E0%AE%9C%E0%AE%AA%E0%AE%BE%E0%AE%B3%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D&hl=ta-IN&gl=IN&ceid=IN:ta',
    region: 'Rajapalayam',
    category: 'city',
  },
];

export const outletById = new Map(OUTLETS.map((outlet) => [outlet.id, outlet]));
