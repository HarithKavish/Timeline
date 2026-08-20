/**
 * Films.
 *
 * A Film is a first-class entity, not a string on a song. It is also the first
 * seam into the next domain: when Timeline opens `/movies`, these records grow
 * rather than get replaced.
 *
 * Demonstration data.
 */

import { fact, id, srcIds } from '../builders';
import type { Film } from '../../types/music';

interface FilmSeed {
  slug: string;
  title: string;
  titleNative?: string;
  year: number;
  directors: string[];
  soundtrack?: string;
  sources?: string[];
}

const seeds: FilmSeed[] = [
  {
    slug: 'annakili',
    title: 'Annakili',
    titleNative: 'அன்னக்கிளி',
    year: 1976,
    directors: ['bharathiraja'],
    soundtrack: 'annakili',
  },
  {
    slug: 'moondram-pirai',
    title: 'Moondram Pirai',
    titleNative: 'மூன்றாம் பிறை',
    year: 1982,
    directors: ['balu-mahendra'],
    soundtrack: 'moondram-pirai',
  },
  {
    slug: 'mouna-ragam',
    title: 'Mouna Ragam',
    titleNative: 'மௌன ராகம்',
    year: 1986,
    directors: ['mani-ratnam'],
    soundtrack: 'mouna-ragam',
  },
  {
    slug: 'nayakan',
    title: 'Nayakan',
    titleNative: 'நாயகன்',
    year: 1987,
    directors: ['mani-ratnam'],
    soundtrack: 'nayakan',
  },
  {
    slug: 'roja',
    title: 'Roja',
    titleNative: 'ரோஜா',
    year: 1992,
    directors: ['mani-ratnam'],
    soundtrack: 'roja',
  },
  {
    slug: 'thiruda-thiruda',
    title: 'Thiruda Thiruda',
    titleNative: 'திருடா திருடா',
    year: 1993,
    directors: ['mani-ratnam'],
    soundtrack: 'thiruda-thiruda',
  },
  {
    slug: 'bombay',
    title: 'Bombay',
    titleNative: 'பம்பாய்',
    year: 1995,
    directors: ['mani-ratnam'],
    soundtrack: 'bombay',
  },
  {
    slug: 'alaipayuthey',
    title: 'Alaipayuthey',
    titleNative: 'அலைபாயுதே',
    year: 2000,
    directors: ['mani-ratnam'],
    soundtrack: 'alaipayuthey',
  },
  {
    slug: 'kandukondain-kandukondain',
    title: 'Kandukondain Kandukondain',
    titleNative: 'கண்டுகொண்டேன் கண்டுகொண்டேன்',
    year: 2000,
    directors: ['rajiv-menon'],
    soundtrack: 'kandukondain-kandukondain',
  },
  {
    slug: 'vinnaithaandi-varuvaayaa',
    title: 'Vinnaithaandi Varuvaayaa',
    titleNative: 'விண்ணைத்தாண்டி வருவாயா',
    year: 2010,
    directors: ['gautham-vasudev-menon'],
    soundtrack: 'vinnaithaandi-varuvaayaa',
  },
  {
    slug: 'moonu',
    title: '3',
    titleNative: 'மூன்று',
    year: 2012,
    directors: ['aishwarya-rajinikanth'],
    soundtrack: 'moonu',
  },
  {
    slug: 'pizza',
    title: 'Pizza',
    titleNative: 'பீட்சா',
    year: 2012,
    directors: ['karthik-subbaraj'],
    soundtrack: 'pizza',
  },
  {
    slug: 'kabali',
    title: 'Kabali',
    titleNative: 'கபாலி',
    year: 2016,
    directors: ['pa-ranjith'],
    soundtrack: 'kabali',
  },
  {
    slug: 'jailer',
    title: 'Jailer',
    titleNative: 'ஜெயிலர்',
    year: 2023,
    directors: ['nelson-dilipkumar'],
    soundtrack: 'jailer',
  },
];

export const films: Film[] = seeds.map((seed) => ({
  id: id.film(seed.slug),
  slug: seed.slug,
  title: seed.title,
  ...(seed.titleNative ? { titleNative: seed.titleNative } : {}),
  language: 'ta' as const,
  releaseYear: fact(seed.year, 'source-reported', seed.sources ?? ['film-archive']),
  directorPersonIds: seed.directors.map(id.person),
  ...(seed.soundtrack ? { soundtrackReleaseId: id.release(seed.soundtrack) } : {}),
  sourceIds: srcIds(seed.sources ?? ['film-archive']),
}));

export const filmById = new Map(films.map((film) => [film.id, film]));
export const filmBySlug = new Map(films.map((film) => [film.slug, film]));
