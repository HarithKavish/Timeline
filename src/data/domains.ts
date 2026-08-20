import type { DomainDescriptor } from '../types/common';

/**
 * The domain register. Music is the only implemented domain; the others are
 * declared now because navigation, search scoping and routing all read from
 * this list rather than hard-coding "music".
 */
export const domains: DomainDescriptor[] = [
  {
    id: 'music',
    label: 'Music',
    blurb: 'Works, recordings and releases, dated and attributed. Tamil first.',
    status: 'available',
    path: '/music',
  },
  {
    id: 'film',
    label: 'Movies',
    blurb: 'Films as first-class works, with production and release chronology.',
    status: 'planned',
    path: '/movies',
  },
  {
    id: 'games',
    label: 'Games',
    blurb: 'Releases, ports and revisions across platforms and regions.',
    status: 'planned',
    path: '/games',
  },
  {
    id: 'books',
    label: 'Books',
    blurb: 'Editions, translations and printings distinguished from the work.',
    status: 'planned',
    path: '/books',
  },
  {
    id: 'software',
    label: 'Software',
    blurb: 'Versions and their release history, treated as a chronology.',
    status: 'planned',
    path: '/software',
  },
  {
    id: 'technology',
    label: 'Technology',
    blurb: 'Devices, standards and specifications, dated and sourced.',
    status: 'planned',
    path: '/technology',
  },
];

export const availableDomains = domains.filter((domain) => domain.status === 'available');
export const plannedDomains = domains.filter((domain) => domain.status === 'planned');
export const domainByPath = new Map(domains.map((domain) => [domain.path, domain]));
