/**
 * People. A Person is a human being; it is not a credit and not a billing name
 * — those live on Creator. Keeping them apart is what will later let Timeline
 * hold "the same person, credited under three names, across four domains".
 *
 * Demonstration data. Biographical facts are recorded at the precision the
 * dataset actually carries (usually year only) and are never sharpened.
 */

import { dateFact, id, srcIds, unknown } from '../builders';
import type { Person } from '../../types/music';
import type { PartialDate } from '../../types/common';

interface PersonSeed {
  slug: string;
  name: string;
  sortName: string;
  nameNative?: string;
  alternateNames?: string[];
  born?: number;
  died?: number;
  birthPlace?: string;
  sources?: string[];
}

const seeds: PersonSeed[] = [
  {
    slug: 'ilaiyaraaja',
    name: 'Ilaiyaraaja',
    sortName: 'Ilaiyaraaja',
    nameNative: 'இளையராஜா',
    alternateNames: ['Gnanathesikan Rasaiya', 'Raaja', 'Isaignani'],
    born: 1943,
    birthPlace: 'Pannaipuram, Tamil Nadu',
    sources: ['community-wiki', 'press-archive'],
  },
  {
    slug: 'ar-rahman',
    name: 'A. R. Rahman',
    sortName: 'Rahman, A. R.',
    nameNative: 'ஏ. ஆர். ரகுமான்',
    alternateNames: ['A. S. Dileep Kumar', 'Allah Rakha Rahman', 'Rahman'],
    born: 1967,
    birthPlace: 'Madras, Tamil Nadu',
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'yuvan-shankar-raja',
    name: 'Yuvan Shankar Raja',
    sortName: 'Raja, Yuvan Shankar',
    nameNative: 'யுவன் சங்கர் ராஜா',
    alternateNames: ['Yuvan', 'U1'],
    born: 1979,
    sources: ['community-wiki'],
  },
  {
    slug: 'harris-jayaraj',
    name: 'Harris Jayaraj',
    sortName: 'Jayaraj, Harris',
    born: 1975,
    sources: ['community-wiki'],
  },
  {
    slug: 'anirudh-ravichander',
    name: 'Anirudh Ravichander',
    sortName: 'Ravichander, Anirudh',
    nameNative: 'அனிருத் ரவிச்சந்தர்',
    alternateNames: ['Anirudh'],
    born: 1990,
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'santhosh-narayanan',
    name: 'Santhosh Narayanan',
    sortName: 'Narayanan, Santhosh',
    nameNative: 'சந்தோஷ் நாராயணன்',
    alternateNames: ['SaNa'],
    born: 1983,
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'govind-vasantha',
    name: 'Govind Vasantha',
    sortName: 'Vasantha, Govind',
    alternateNames: ['Govind Menon'],
    sources: ['community-wiki'],
  },
  {
    slug: 'sean-roldan',
    name: 'Sean Roldan',
    sortName: 'Roldan, Sean',
    alternateNames: ['Deepak Sean Roldan'],
    sources: ['community-wiki'],
  },
  {
    slug: 'sp-balasubrahmanyam',
    name: 'S. P. Balasubrahmanyam',
    sortName: 'Balasubrahmanyam, S. P.',
    nameNative: 'எஸ். பி. பாலசுப்பிரமணியம்',
    alternateNames: ['SPB', 'Balu'],
    born: 1946,
    died: 2020,
    sources: ['community-wiki', 'press-archive'],
  },
  {
    slug: 'ks-chithra',
    name: 'K. S. Chithra',
    sortName: 'Chithra, K. S.',
    alternateNames: ['Chithra', 'Chinna Kuyil'],
    born: 1963,
    sources: ['community-wiki'],
  },
  {
    slug: 's-janaki',
    name: 'S. Janaki',
    sortName: 'Janaki, S.',
    alternateNames: ['Janaki'],
    born: 1938,
    sources: ['community-wiki'],
  },
  {
    slug: 'hariharan',
    name: 'Hariharan',
    sortName: 'Hariharan',
    born: 1955,
    sources: ['community-wiki'],
  },
  {
    slug: 'unnikrishnan',
    name: 'P. Unnikrishnan',
    sortName: 'Unnikrishnan, P.',
    alternateNames: ['Unnikrishnan'],
    born: 1966,
    sources: ['community-wiki'],
  },
  {
    slug: 'minmini',
    name: 'Minmini',
    sortName: 'Minmini',
    sources: ['community-wiki'],
  },
  {
    slug: 'shreya-ghoshal',
    name: 'Shreya Ghoshal',
    sortName: 'Ghoshal, Shreya',
    born: 1984,
    sources: ['community-wiki'],
  },
  {
    slug: 'sid-sriram',
    name: 'Sid Sriram',
    sortName: 'Sriram, Sid',
    born: 1990,
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'chinmayi',
    name: 'Chinmayi',
    sortName: 'Chinmayi',
    alternateNames: ['Chinmayi Sripaada'],
    born: 1984,
    sources: ['community-wiki'],
  },
  {
    slug: 'karthik',
    name: 'Karthik',
    sortName: 'Karthik',
    alternateNames: ['Karthik Kumar'],
    born: 1980,
    sources: ['community-wiki'],
  },
  {
    slug: 'pradeep-kumar',
    name: 'Pradeep Kumar',
    sortName: 'Kumar, Pradeep',
    sources: ['community-wiki'],
  },
  {
    slug: 'dhee',
    name: 'Dhee',
    sortName: 'Dhee',
    alternateNames: ['Dhee Wickham'],
    sources: ['creator-official'],
  },
  {
    slug: 'arivu',
    name: 'Arivu',
    sortName: 'Arivu',
    nameNative: 'அறிவு',
    alternateNames: ['Kalaiyarasan Arivu'],
    sources: ['creator-official'],
  },
  {
    slug: 'andrea-jeremiah',
    name: 'Andrea Jeremiah',
    sortName: 'Jeremiah, Andrea',
    born: 1985,
    sources: ['community-wiki'],
  },
  {
    slug: 'vairamuthu',
    name: 'Vairamuthu',
    sortName: 'Vairamuthu',
    nameNative: 'வைரமுத்து',
    born: 1953,
    sources: ['community-wiki'],
  },
  {
    slug: 'vaali',
    name: 'Vaali',
    sortName: 'Vaali',
    nameNative: 'வாலி',
    alternateNames: ['T. S. Rangarajan'],
    born: 1931,
    died: 2013,
    sources: ['community-wiki'],
  },
  {
    slug: 'thamarai',
    name: 'Thamarai',
    sortName: 'Thamarai',
    alternateNames: ['Uma Devi'],
    sources: ['community-wiki'],
  },
  {
    slug: 'na-muthukumar',
    name: 'Na. Muthukumar',
    sortName: 'Muthukumar, Na.',
    born: 1975,
    died: 2016,
    sources: ['community-wiki'],
  },
  {
    slug: 'panchu-arunachalam',
    name: 'Panchu Arunachalam',
    sortName: 'Arunachalam, Panchu',
    born: 1941,
    died: 2019,
    sources: ['community-wiki'],
  },
  {
    slug: 'kannadasan',
    name: 'Kannadasan',
    sortName: 'Kannadasan',
    nameNative: 'கண்ணதாசன்',
    alternateNames: ['Muthiah', 'Kaviarasu'],
    born: 1927,
    died: 1981,
    sources: ['community-wiki'],
  },
  {
    slug: 'dhanush',
    name: 'Dhanush',
    sortName: 'Dhanush',
    alternateNames: ['Venkatesh Prabhu'],
    born: 1983,
    sources: ['community-wiki', 'creator-official'],
  },
  {
    slug: 'mani-ratnam',
    name: 'Mani Ratnam',
    sortName: 'Ratnam, Mani',
    born: 1956,
    sources: ['film-archive'],
  },
  {
    slug: 'balu-mahendra',
    name: 'Balu Mahendra',
    sortName: 'Mahendra, Balu',
    born: 1939,
    died: 2014,
    sources: ['film-archive'],
  },
  {
    slug: 'bharathiraja',
    name: 'Bharathiraja',
    sortName: 'Bharathiraja',
    born: 1941,
    sources: ['film-archive'],
  },
  {
    slug: 'karthik-subbaraj',
    name: 'Karthik Subbaraj',
    sortName: 'Subbaraj, Karthik',
    born: 1983,
    sources: ['film-archive'],
  },
  {
    slug: 'rajiv-menon',
    name: 'Rajiv Menon',
    sortName: 'Menon, Rajiv',
    born: 1963,
    sources: ['film-archive'],
  },
  {
    slug: 'nelson-dilipkumar',
    name: 'Nelson Dilipkumar',
    sortName: 'Dilipkumar, Nelson',
    sources: ['film-archive'],
  },
  {
    slug: 'pa-ranjith',
    name: 'Pa. Ranjith',
    sortName: 'Ranjith, Pa.',
    born: 1982,
    sources: ['film-archive'],
  },
  {
    slug: 'gautham-vasudev-menon',
    name: 'Gautham Vasudev Menon',
    sortName: 'Menon, Gautham Vasudev',
    born: 1973,
    sources: ['film-archive'],
  },
  {
    slug: 'aishwarya-rajinikanth',
    name: 'Aishwarya Rajinikanth',
    sortName: 'Rajinikanth, Aishwarya',
    sources: ['film-archive'],
  },
  {
    slug: 'harish-sivaramakrishnan',
    name: 'Harish Sivaramakrishnan',
    sortName: 'Sivaramakrishnan, Harish',
    sources: ['creator-official'],
  },
];

export const persons: Person[] = seeds.map((seed) => ({
  id: id.person(seed.slug),
  slug: seed.slug,
  name: seed.name,
  sortName: seed.sortName,
  ...(seed.nameNative ? { nameNative: seed.nameNative } : {}),
  alternateNames: seed.alternateNames ?? [],
  bornOn: seed.born
    ? dateFact([seed.born], 'partial', seed.sources ?? [], 'Known to the year only.')
    : unknown<PartialDate>('Birth year is not carried by the sources in this dataset.'),
  ...(seed.died
    ? {
        diedOn: dateFact(
          [seed.died],
          'partial',
          seed.sources ?? [],
          'Known to the year only.',
        ),
      }
    : {}),
  ...(seed.birthPlace
    ? { birthPlace: { value: seed.birthPlace, certainty: 'source-reported' as const, sourceIds: srcIds(seed.sources ?? []) } }
    : {}),
  sourceIds: srcIds(seed.sources ?? []),
}));

export const personBySlug = new Map(persons.map((person) => [person.slug, person]));
export const personById = new Map(persons.map((person) => [person.id, person]));
