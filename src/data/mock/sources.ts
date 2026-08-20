/**
 * Provenance records.
 *
 * IMPORTANT: every record here is demonstration data. Nothing in this file was
 * retrieved from the organisation it names, and no locator is a real URL — the
 * `timeline-demo://` scheme exists precisely so a placeholder can never be
 * mistaken for a citation. Real ingestion happens in a later stage; the shape
 * of these records is what that stage will populate.
 */

import type { Source } from '../../types/common';

export const sources: Source[] = [
  {
    id: 'src:mb-demo',
    name: 'MusicBrainz (demo record)',
    type: 'database',
    urlPlaceholder: 'timeline-demo://database/musicbrainz/release/{mbid}',
    supports: ['release date', 'release type', 'track listing', 'duration'],
    confidence: 'high',
    status: 'mock',
    note: 'Stands in for the open music metadata database Timeline intends to reconcile against. No data was fetched for this build.',
  },
  {
    id: 'src:label-catalogue',
    name: 'Label catalogue entry (demo record)',
    type: 'label',
    urlPlaceholder: 'timeline-demo://label/{label-slug}/catalogue/{catalogue-no}',
    supports: ['release date', 'territory', 'format', 'classification'],
    confidence: 'high',
    status: 'mock',
    note: 'Represents a rights-holder catalogue listing — the strongest class of evidence for commercial release facts.',
  },
  {
    id: 'src:creator-official',
    name: 'Creator / official channel (demo record)',
    type: 'creator',
    urlPlaceholder: 'timeline-demo://creator/{creator-slug}/announcement/{id}',
    supports: ['credits', 'release date', 'independent status'],
    confidence: 'medium',
    status: 'mock',
    note: 'A statement published by the creator. Authoritative on credits, weaker on dates than a label catalogue.',
  },
  {
    id: 'src:streaming-metadata',
    name: 'Streaming platform metadata (demo record)',
    type: 'streaming',
    urlPlaceholder: 'timeline-demo://streaming/{platform}/album/{id}',
    supports: ['duration', 'digital release date', 'release time', 'track order'],
    confidence: 'medium',
    status: 'mock',
    note: 'Platform metadata often reflects the digital re-publication rather than the original release, so Timeline keeps the two distinct.',
  },
  {
    id: 'src:film-archive',
    name: 'Film archive listing (demo record)',
    type: 'archive',
    urlPlaceholder: 'timeline-demo://archive/film/{film-slug}',
    supports: ['film release year', 'soundtrack association', 'language'],
    confidence: 'medium',
    status: 'mock',
  },
  {
    id: 'src:press-archive',
    name: 'Press / periodical archive (demo record)',
    type: 'press',
    urlPlaceholder: 'timeline-demo://press/{publication}/{year}/{issue}',
    supports: ['release date', 'reception', 'credits'],
    confidence: 'medium',
    status: 'mock',
    note: 'Contemporary press is often the only witness for pre-digital release dates, and is frequently imprecise about the day.',
  },
  {
    id: 'src:physical-artifact',
    name: 'Physical release artifact (demo record)',
    type: 'archive',
    urlPlaceholder: 'timeline-demo://artifact/{format}/{catalogue-no}',
    supports: ['track listing', 'credits', 'label', 'format'],
    confidence: 'high',
    status: 'mock',
    note: 'Cassette and LP sleeves carry credits that no online database reproduces; they rarely carry a precise date.',
  },
  {
    id: 'src:community-wiki',
    name: 'Community catalogue (demo record)',
    type: 'other',
    urlPlaceholder: 'timeline-demo://community/{project}/entry/{id}',
    supports: ['credits', 'alternate titles', 'career dates'],
    confidence: 'low',
    status: 'mock',
    note: 'Retained because it is often the only witness for older credits, but never sufficient on its own to promote a fact to Known.',
  },
];

export const sourceById = new Map(sources.map((source) => [source.id, source]));
