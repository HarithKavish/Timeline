/**
 * Labels and other publishing entities. Demonstration data.
 *
 * `self-released` is modelled as a real label record rather than a null, so a
 * self-released work still has a publisher to attribute facts to.
 */

import { id, srcIds } from '../builders';
import type { Label } from '../../types/music';

interface LabelSeed {
  slug: string;
  name: string;
  founded?: number;
  sources?: string[];
}

const seeds: LabelSeed[] = [
  { slug: 'echo', name: 'Echo Recording Company', founded: 1985, sources: ['label-catalogue'] },
  { slug: 'saregama', name: 'Saregama India', founded: 1901, sources: ['label-catalogue'] },
  { slug: 'pyramid', name: 'Pyramid Audio', founded: 1990, sources: ['label-catalogue'] },
  { slug: 'sony-music-india', name: 'Sony Music India', sources: ['label-catalogue'] },
  { slug: 'think-music', name: 'Think Music India', founded: 2007, sources: ['label-catalogue'] },
  { slug: 'divo', name: 'Divo Music', founded: 2013, sources: ['label-catalogue'] },
  { slug: 'maajja', name: 'maajja', founded: 2020, sources: ['creator-official'] },
  {
    slug: 'self-released',
    name: 'Self-released',
    sources: ['creator-official'],
  },
];

export const labels: Label[] = seeds.map((seed) => ({
  id: id.label(seed.slug),
  slug: seed.slug,
  name: seed.name,
  ...(seed.founded ? { foundedYear: seed.founded } : {}),
  sourceIds: srcIds(seed.sources ?? []),
}));

export const labelById = new Map(labels.map((label) => [label.id, label]));
