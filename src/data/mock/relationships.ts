/**
 * Typed edges between entities.
 *
 * These are *structural* links — "this single preceded that soundtrack", "this
 * compilation draws on that release". The dataset deliberately does not assert
 * musicological claims (that one piece quotes another) about real recordings;
 * where such a link is shown, it is between the fictional demonstration works.
 */

import { srcIds } from '../builders';
import type { Relationship } from '../../types/common';

export const relationships: Relationship[] = [
  {
    id: 'rel:kolaveri-single-to-soundtrack',
    type: 'companion-to',
    fromId: 'release:why-this-kolaveri-di-single',
    toId: 'release:moonu',
    note: 'The single preceded the soundtrack by roughly two months; both carry the same recording.',
    sourceIds: srcIds(['press-archive', 'label-catalogue']),
  },
  {
    id: 'rel:kaavaalaa-single-to-soundtrack',
    type: 'companion-to',
    fromId: 'release:kaavaalaa-single',
    toId: 'release:jailer',
    note: 'Lead single, later carried by the soundtrack release.',
    sourceIds: srcIds(['label-catalogue']),
  },
  {
    id: 'rel:compilation-draws-on-mouna-ragam',
    type: 'companion-to',
    fromId: 'release:instrumental-selections-vol-1',
    toId: 'release:mouna-ragam',
    note: 'Compilation carrying a recording first issued on this release.',
    sourceIds: srcIds(['label-catalogue']),
  },
  {
    id: 'rel:compilation-draws-on-nayakan',
    type: 'companion-to',
    fromId: 'release:instrumental-selections-vol-1',
    toId: 'release:nayakan',
    note: 'Compilation carrying a recording first issued on this release.',
    sourceIds: srcIds(['label-catalogue']),
  },
  {
    id: 'rel:maya-nadhi-reprise',
    type: 'companion-to',
    fromId: 'rec:maya-nadhi-reprise',
    toId: 'rec:maya-nadhi',
    note: 'A second recording of the same work, issued independently. Both resolve to one Work.',
    sourceIds: srcIds(['creator-official']),
  },
  {
    id: 'rel:kk-ii-companion',
    type: 'companion-to',
    fromId: 'work:kaadhal-kadhaigal-ii',
    toId: 'work:kaadhal-kadhaigal-i',
    note: 'Demonstration link between two fictional works.',
    sourceIds: srcIds(['creator-official']),
  },
  {
    id: 'rel:kk-iii-reuses-i',
    type: 'reuses',
    fromId: 'work:kaadhal-kadhaigal-iii',
    toId: 'work:kaadhal-kadhaigal-i',
    note: 'Demonstration link between two fictional works, showing how a reuse relationship is rendered.',
    sourceIds: srcIds(['creator-official']),
  },
];
