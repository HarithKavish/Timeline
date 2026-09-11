import type { NewsCategory } from './types';

export interface Outlet {
  id: string;
  name: string;
  homepage: string;
  feedUrl: string;
  region: string;
  category: NewsCategory;
  /** Source language of this feed's own text. Drives auto-translation — see src/translate.ts. */
  language: 'en' | 'ta';
}

/**
 * Five geographic tiers, each sourced the most honestly available way:
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
 * - **District** (Virudhunagar) and **City** (Rajapalayam within it) —
 *   no outlet publishes a dedicated feed at either granularity, so there is
 *   no direct-publisher option here at all. A Google News search feed is
 *   the only real free source of coverage this local; it is noisier than
 *   the other tiers (product listings and unrelated pages can surface
 *   alongside genuine local news) and is used only because the alternative
 *   is no coverage at all. District searches across the district's main
 *   towns (Virudhunagar, Rajapalayam, Sivakasi, Srivilliputhur,
 *   Aruppukkottai, Sattur) rather than just the district's name, since most
 *   local reporting names the specific town, not the district. A
 *   Tamil-language query is included alongside the English one for both
 *   tiers, since hyperlocal coverage of Tamil-speaking towns is more likely
 *   to exist in the Tamil press. Both are also the two tiers most exposed
 *   to the same Cloudflare-egress block described above for The Hindu —
 *   `news.google.com/rss/search` has returned HTTP 503 to this Worker's
 *   network range in testing; see workers/news/README.md for the current
 *   status.
 */
export const OUTLETS: Outlet[] = [
  {
    id: 'bbc-world',
    name: 'BBC News',
    homepage: 'https://www.bbc.com/news',
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    region: 'UK',
    category: 'international',
    language: 'en',
  },
  {
    id: 'npr-news',
    name: 'NPR',
    homepage: 'https://www.npr.org',
    feedUrl: 'https://feeds.npr.org/1001/rss.xml',
    region: 'US',
    category: 'international',
    language: 'en',
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    homepage: 'https://www.aljazeera.com',
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    region: 'International',
    category: 'international',
    language: 'en',
  },
  {
    id: 'guardian-world',
    name: 'The Guardian',
    homepage: 'https://www.theguardian.com/world',
    feedUrl: 'https://www.theguardian.com/world/rss',
    region: 'UK',
    category: 'international',
    language: 'en',
  },
  {
    id: 'pbs-newshour',
    name: 'PBS NewsHour',
    homepage: 'https://www.pbs.org/newshour',
    feedUrl: 'https://www.pbs.org/newshour/feeds/rss/headlines',
    region: 'US',
    category: 'international',
    language: 'en',
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
    language: 'en',
  },
  {
    id: 'toi-chennai',
    name: 'Times of India',
    homepage: 'https://timesofindia.indiatimes.com/city/chennai',
    feedUrl: 'https://timesofindia.indiatimes.com/rssfeeds/2950623.cms',
    region: 'Chennai',
    category: 'state',
    language: 'en',
  },
  {
    id: 'nie-tamilnadu',
    name: 'The New Indian Express',
    homepage: 'https://www.newindianexpress.com/states/tamil-nadu/',
    feedUrl: 'https://www.newindianexpress.com/states/tamil-nadu/rssfeed/?id=170&getXmlFeed=true',
    region: 'Tamil Nadu',
    category: 'state',
    language: 'en',
  },
  {
    id: 'virudhunagar-district-en',
    name: 'Google News (Virudhunagar district)',
    homepage:
      'https://news.google.com/search?q=Virudhunagar%20OR%20Rajapalayam%20OR%20Sivakasi%20OR%20Srivilliputhur%20OR%20Aruppukkottai%20OR%20Sattur',
    feedUrl:
      'https://news.google.com/rss/search?q=Virudhunagar%20OR%20Rajapalayam%20OR%20Sivakasi%20OR%20Srivilliputhur%20OR%20Aruppukkottai%20OR%20Sattur&hl=en-IN&gl=IN&ceid=IN:en',
    region: 'Virudhunagar district',
    category: 'district',
    language: 'en',
  },
  {
    id: 'virudhunagar-district-ta',
    name: 'Google News (விருதுநகர் மாவட்டம்)',
    homepage:
      'https://news.google.com/search?q=%E0%AE%B5%E0%AE%BF%E0%AE%B0%E0%AF%81%E0%AE%A4%E0%AF%81%E0%AE%A8%E0%AE%95%E0%AE%B0%E0%AF%8D%20OR%20%E0%AE%B0%E0%AE%BE%E0%AE%9C%E0%AE%AA%E0%AE%BE%E0%AE%B3%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D%20OR%20%E0%AE%9A%E0%AE%BF%E0%AE%B5%E0%AE%95%E0%AE%BE%E0%AE%9A%E0%AE%BF%20OR%20%E0%AE%B8%E0%AF%8D%E0%AE%B0%E0%AF%80%E0%AE%B5%E0%AE%BF%E0%AE%B2%E0%AF%8D%E0%AE%B2%E0%AE%BF%E0%AE%AA%E0%AF%81%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AF%82%E0%AE%B0%E0%AF%8D%20OR%20%E0%AE%85%E0%AE%B0%E0%AF%81%E0%AE%AA%E0%AF%8D%E0%AE%AA%E0%AF%81%E0%AE%95%E0%AF%8D%E0%AE%95%E0%AF%8B%E0%AE%9F%E0%AF%8D%E0%AE%9F%E0%AF%88%20OR%20%E0%AE%9A%E0%AE%BE%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AF%82%E0%AE%B0%E0%AF%8D',
    feedUrl:
      'https://news.google.com/rss/search?q=%E0%AE%B5%E0%AE%BF%E0%AE%B0%E0%AF%81%E0%AE%A4%E0%AF%81%E0%AE%A8%E0%AE%95%E0%AE%B0%E0%AF%8D%20OR%20%E0%AE%B0%E0%AE%BE%E0%AE%9C%E0%AE%AA%E0%AE%BE%E0%AE%B3%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D%20OR%20%E0%AE%9A%E0%AE%BF%E0%AE%B5%E0%AE%95%E0%AE%BE%E0%AE%9A%E0%AE%BF%20OR%20%E0%AE%B8%E0%AF%8D%E0%AE%B0%E0%AF%80%E0%AE%B5%E0%AE%BF%E0%AE%B2%E0%AF%8D%E0%AE%B2%E0%AE%BF%E0%AE%AA%E0%AF%81%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AF%82%E0%AE%B0%E0%AF%8D%20OR%20%E0%AE%85%E0%AE%B0%E0%AF%81%E0%AE%AA%E0%AF%8D%E0%AE%AA%E0%AF%81%E0%AE%95%E0%AF%8D%E0%AE%95%E0%AF%8B%E0%AE%9F%E0%AF%8D%E0%AE%9F%E0%AF%88%20OR%20%E0%AE%9A%E0%AE%BE%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AF%82%E0%AE%B0%E0%AF%8D&hl=ta-IN&gl=IN&ceid=IN:ta',
    region: 'Virudhunagar district',
    category: 'district',
    language: 'ta',
  },
  {
    id: 'rajapalayam-en',
    name: 'Google News (Rajapalayam)',
    homepage: 'https://news.google.com/search?q=Rajapalayam',
    feedUrl: 'https://news.google.com/rss/search?q=Rajapalayam&hl=en-IN&gl=IN&ceid=IN:en',
    region: 'Rajapalayam',
    category: 'city',
    language: 'en',
  },
  {
    id: 'rajapalayam-ta',
    name: 'Google News (ராஜபாளையம்)',
    homepage: 'https://news.google.com/search?q=%E0%AE%B0%E0%AE%BE%E0%AE%9C%E0%AE%AA%E0%AE%BE%E0%AE%B3%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D',
    feedUrl:
      'https://news.google.com/rss/search?q=%E0%AE%B0%E0%AE%BE%E0%AE%9C%E0%AE%AA%E0%AE%BE%E0%AE%B3%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D&hl=ta-IN&gl=IN&ceid=IN:ta',
    region: 'Rajapalayam',
    category: 'city',
    language: 'ta',
  },
];

export const outletById = new Map(OUTLETS.map((outlet) => [outlet.id, outlet]));
