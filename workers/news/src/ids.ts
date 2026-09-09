const TRACKING_PARAM_PREFIXES = ['utm_', 'fbclid', 'gclid', 'ito', 'cmp', 'at_medium', 'at_campaign', 'ns_'];

/** Strips tracking params and fragments so the same article via two campaign links dedupes to one row. */
export function canonicalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM_PREFIXES.some((prefix) => key.toLowerCase().startsWith(prefix))) {
        url.searchParams.delete(key);
      }
    }
    const path = url.pathname.replace(/\/$/, '');
    const query = url.search;
    return `${url.protocol}//${url.hostname}${path}${query}`;
  } catch {
    return raw;
  }
}

export async function hashId(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 24);
}
