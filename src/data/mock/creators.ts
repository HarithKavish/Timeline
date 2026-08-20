/**
 * Creators — the entities that appear in credits.
 *
 * Most are backed by a Person; `agam` shows the other case, a group that is
 * credited as a unit. Downstream code always resolves credits through Creator,
 * never through Person, so bands and solo artists behave identically.
 *
 * Demonstration data.
 */

import { dateFact, id, srcIds, unknown } from '../builders';
import type { Creator, CreatorKind, CreatorRole, Language } from '../../types/music';
import type { PartialDate } from '../../types/common';

interface CreatorSeed {
  slug: string;
  name: string;
  kind?: CreatorKind;
  /** Person backing this creator; defaults to the same slug. */
  person?: string | null;
  nameNative?: string;
  alternateNames?: string[];
  roles: CreatorRole[];
  languages?: Language[];
  from?: number;
  until?: number;
  summary: string;
  sources?: string[];
}

const ACTIVE_NOTE = 'No end date recorded; the catalogue treats this creator as active.';

const seeds: CreatorSeed[] = [
  {
    slug: 'ilaiyaraaja',
    name: 'Ilaiyaraaja',
    nameNative: 'இளையராஜா',
    alternateNames: ['Raaja', 'Isaignani'],
    roles: ['composer', 'conductor', 'arranger', 'lyricist', 'vocalist'],
    languages: ['ta', 'te', 'ml', 'kn'],
    from: 1976,
    summary:
      'Composer whose film work from the mid-1970s onward folded Tamil folk idiom into orchestral and light-classical arrangement. The catalogue treats his film scores and songs as separate works sharing a production context.',
    sources: ['community-wiki', 'press-archive'],
  },
  {
    slug: 'ar-rahman',
    name: 'A. R. Rahman',
    nameNative: 'ஏ. ஆர். ரகுமான்',
    alternateNames: ['A. S. Dileep Kumar', 'Rahman'],
    roles: ['composer', 'producer', 'arranger', 'vocalist'],
    languages: ['ta', 'hi', 'en', 'te'],
    from: 1992,
    summary:
      'Composer and producer whose 1992 debut soundtrack marked a shift in Tamil film music production practice. Credited across composing, arrangement, production and, on a number of recordings, vocals.',
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'yuvan-shankar-raja',
    name: 'Yuvan Shankar Raja',
    nameNative: 'யுவன் சங்கர் ராஜா',
    alternateNames: ['Yuvan', 'U1'],
    roles: ['composer', 'producer', 'vocalist'],
    languages: ['ta'],
    from: 1997,
    summary:
      'Composer and producer working mainly in Tamil film, noted for background score and for hip-hop and electronic textures in song production.',
    sources: ['community-wiki'],
  },
  {
    slug: 'harris-jayaraj',
    name: 'Harris Jayaraj',
    roles: ['composer', 'arranger'],
    languages: ['ta', 'te'],
    from: 2001,
    summary: 'Film composer, active in Tamil and Telugu cinema from the early 2000s.',
    sources: ['community-wiki'],
  },
  {
    slug: 'anirudh-ravichander',
    name: 'Anirudh Ravichander',
    nameNative: 'அனிருத் ரவிச்சந்தர்',
    alternateNames: ['Anirudh'],
    roles: ['composer', 'vocalist', 'producer'],
    languages: ['ta', 'hi', 'te'],
    from: 2011,
    summary:
      'Composer, producer and vocalist. His catalogue is unusually useful for chronology because several works were issued as singles before the soundtrack that later carried them.',
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'santhosh-narayanan',
    name: 'Santhosh Narayanan',
    nameNative: 'சந்தோஷ் நாராயணன்',
    alternateNames: ['SaNa'],
    roles: ['composer', 'producer', 'arranger', 'vocalist'],
    languages: ['ta'],
    from: 2012,
    summary:
      'Composer and producer whose catalogue spans film soundtracks and independent, non-film releases — the clearest case in this dataset for separating production context from release classification.',
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'govind-vasantha',
    name: 'Govind Vasantha',
    alternateNames: ['Govind Menon'],
    roles: ['composer', 'performer', 'arranger', 'vocalist'],
    languages: ['ta'],
    from: 2016,
    summary:
      'Composer and violinist; also credited as a performing member of the band Agam.',
    sources: ['community-wiki'],
  },
  {
    slug: 'sean-roldan',
    name: 'Sean Roldan',
    roles: ['composer', 'vocalist', 'producer'],
    languages: ['ta'],
    from: 2013,
    summary: 'Composer and vocalist working across film and independent releases.',
    sources: ['community-wiki'],
  },
  {
    slug: 'agam',
    name: 'Agam',
    kind: 'group',
    person: null,
    roles: ['performer', 'composer'],
    languages: ['ta', 'en'],
    from: 2003,
    summary:
      'Carnatic progressive rock band. Recorded as a group rather than under an individual billing, which is why the catalogue models it as a group creator rather than a person.',
    sources: ['creator-official', 'community-wiki'],
  },
  {
    slug: 'sp-balasubrahmanyam',
    name: 'S. P. Balasubrahmanyam',
    nameNative: 'எஸ். பி. பாலசுப்பிரமணியம்',
    alternateNames: ['SPB'],
    roles: ['vocalist', 'composer', 'producer'],
    languages: ['ta', 'te', 'kn', 'hi'],
    from: 1966,
    until: 2020,
    summary: 'Playback vocalist with credits across five decades of South Indian film music.',
    sources: ['community-wiki', 'press-archive'],
  },
  {
    slug: 'ks-chithra',
    name: 'K. S. Chithra',
    alternateNames: ['Chithra'],
    roles: ['vocalist'],
    languages: ['ta', 'ml', 'te', 'kn'],
    from: 1979,
    summary: 'Playback vocalist, widely credited across Tamil and Malayalam film music.',
    sources: ['community-wiki'],
  },
  {
    slug: 's-janaki',
    name: 'S. Janaki',
    roles: ['vocalist'],
    languages: ['ta', 'te', 'kn', 'ml'],
    from: 1957,
    until: 2016,
    summary: 'Playback vocalist active from the late 1950s.',
    sources: ['community-wiki'],
  },
  {
    slug: 'hariharan',
    name: 'Hariharan',
    roles: ['vocalist'],
    languages: ['ta', 'hi'],
    from: 1977,
    summary: 'Playback and ghazal vocalist.',
    sources: ['community-wiki'],
  },
  {
    slug: 'unnikrishnan',
    name: 'P. Unnikrishnan',
    roles: ['vocalist'],
    languages: ['ta'],
    from: 1994,
    summary: 'Carnatic and playback vocalist.',
    sources: ['community-wiki'],
  },
  {
    slug: 'minmini',
    name: 'Minmini',
    roles: ['vocalist'],
    languages: ['ta'],
    from: 1991,
    summary: 'Playback vocalist.',
    sources: ['community-wiki'],
  },
  {
    slug: 'shreya-ghoshal',
    name: 'Shreya Ghoshal',
    roles: ['vocalist'],
    languages: ['ta', 'hi', 'te', 'ml'],
    from: 2002,
    summary: 'Playback vocalist credited across several Indian film industries.',
    sources: ['community-wiki'],
  },
  {
    slug: 'sid-sriram',
    name: 'Sid Sriram',
    roles: ['vocalist', 'composer'],
    languages: ['ta', 'te', 'en'],
    from: 2013,
    summary: 'Vocalist and composer working in film playback and independent release.',
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'chinmayi',
    name: 'Chinmayi',
    roles: ['vocalist'],
    languages: ['ta', 'te'],
    from: 2002,
    summary: 'Playback vocalist and dubbing artist.',
    sources: ['community-wiki'],
  },
  {
    slug: 'karthik',
    name: 'Karthik',
    roles: ['vocalist', 'composer'],
    languages: ['ta', 'te'],
    from: 2001,
    summary: 'Playback vocalist and composer.',
    sources: ['community-wiki'],
  },
  {
    slug: 'pradeep-kumar',
    name: 'Pradeep Kumar',
    roles: ['vocalist', 'composer'],
    languages: ['ta'],
    from: 2012,
    summary: 'Vocalist and composer, credited across film and independent work.',
    sources: ['community-wiki'],
  },
  {
    slug: 'dhee',
    name: 'Dhee',
    roles: ['vocalist'],
    languages: ['ta', 'en'],
    from: 2018,
    summary: 'Vocalist working across independent and film releases.',
    sources: ['creator-official'],
  },
  {
    slug: 'arivu',
    name: 'Arivu',
    nameNative: 'அறிவு',
    roles: ['lyricist', 'vocalist', 'performer'],
    languages: ['ta'],
    from: 2016,
    summary:
      'Lyricist, rapper and performer. Credited in this dataset as both lyricist and vocalist on the same recording, which is why credits are modelled per role rather than per person.',
    sources: ['creator-official'],
  },
  {
    slug: 'andrea-jeremiah',
    name: 'Andrea Jeremiah',
    roles: ['vocalist', 'performer'],
    languages: ['ta'],
    from: 2005,
    summary: 'Vocalist and performer.',
    sources: ['community-wiki'],
  },
  {
    slug: 'kannadasan',
    name: 'Kannadasan',
    nameNative: 'கண்ணதாசன்',
    alternateNames: ['Kaviarasu'],
    roles: ['lyricist'],
    languages: ['ta'],
    from: 1949,
    until: 1981,
    summary: 'Poet and film lyricist; credits continued to appear on releases issued after his death.',
    sources: ['community-wiki'],
  },
  {
    slug: 'dhanush',
    name: 'Dhanush',
    roles: ['vocalist', 'lyricist', 'performer'],
    languages: ['ta'],
    from: 2002,
    summary: 'Actor credited in this dataset as lyricist and vocalist — a case where the credited role, not the person, is what the catalogue indexes.',
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'vairamuthu',
    name: 'Vairamuthu',
    nameNative: 'வைரமுத்து',
    roles: ['lyricist'],
    languages: ['ta'],
    from: 1980,
    summary: 'Poet and film lyricist with credits across four decades of Tamil cinema.',
    sources: ['community-wiki'],
  },
  {
    slug: 'vaali',
    name: 'Vaali',
    nameNative: 'வாலி',
    roles: ['lyricist'],
    languages: ['ta'],
    from: 1964,
    until: 2013,
    summary: 'Film lyricist and poet.',
    sources: ['community-wiki'],
  },
  {
    slug: 'thamarai',
    name: 'Thamarai',
    roles: ['lyricist'],
    languages: ['ta'],
    from: 2000,
    summary: 'Film lyricist.',
    sources: ['community-wiki'],
  },
  {
    slug: 'na-muthukumar',
    name: 'Na. Muthukumar',
    roles: ['lyricist'],
    languages: ['ta'],
    from: 1999,
    until: 2016,
    summary: 'Film lyricist and poet.',
    sources: ['community-wiki'],
  },
  {
    slug: 'panchu-arunachalam',
    name: 'Panchu Arunachalam',
    roles: ['lyricist', 'producer'],
    languages: ['ta'],
    from: 1970,
    until: 2019,
    summary: 'Lyricist, screenwriter and producer.',
    sources: ['community-wiki'],
  },
  {
    slug: 'harish-sivaramakrishnan',
    name: 'Harish Sivaramakrishnan',
    roles: ['vocalist', 'performer'],
    languages: ['ta', 'en'],
    from: 2003,
    summary: 'Vocalist; credited as the frontman of Agam.',
    sources: ['creator-official'],
  },
];

export const creators: Creator[] = seeds.map((seed) => {
  const personSlug = seed.person === null ? undefined : (seed.person ?? seed.slug);
  return {
    id: id.creator(seed.slug),
    slug: seed.slug,
    kind: seed.kind ?? 'person',
    ...(personSlug ? { personId: id.person(personSlug) } : {}),
    name: seed.name,
    ...(seed.nameNative ? { nameNative: seed.nameNative } : {}),
    alternateNames: seed.alternateNames ?? [],
    roles: seed.roles,
    languages: seed.languages ?? ['ta'],
    activeFrom: seed.from
      ? dateFact([seed.from], 'partial', seed.sources ?? [], 'Known to the year only.')
      : unknown<PartialDate>('No source in this dataset states a career start.'),
    activeUntil: seed.until
      ? dateFact([seed.until], 'partial', seed.sources ?? [], 'Known to the year only.')
      : unknown<PartialDate>(ACTIVE_NOTE),
    summary: seed.summary,
    sourceIds: srcIds(seed.sources ?? []),
  };
});

export const creatorBySlug = new Map(creators.map((creator) => [creator.slug, creator]));
export const creatorById = new Map(creators.map((creator) => [creator.id, creator]));
