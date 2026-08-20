/**
 * The in-memory catalogue.
 *
 * This module is the *only* place the shape of the mock store is known. The
 * service layer queries `db` through the indexes below; when a real backend
 * arrives, `db` disappears and the service functions change their bodies —
 * nothing above the service layer moves.
 */

import { catalogue } from './catalogue';
import { creators } from './creators';
import { films } from './films';
import { labels } from './labels';
import { persons } from './persons';
import { relationships } from './relationships';
import { sources } from './sources';
import type { EntityId } from '../../types/common';
import type { Credit, Recording, Release, ReleaseEvent } from '../../types/music';

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}

const { works, recordings, releases, events, credits } = catalogue;

/** Release ids carrying a given recording, in catalogue order. */
const releasesByRecording = new Map<EntityId, Release[]>();
for (const release of releases) {
  for (const trackId of release.trackIds) {
    const bucket = releasesByRecording.get(trackId);
    if (bucket) bucket.push(release);
    else releasesByRecording.set(trackId, [release]);
  }
}

export const db = {
  persons,
  creators,
  labels,
  films,
  works,
  recordings,
  releases,
  events,
  credits,
  relationships,
  sources,

  personById: new Map(persons.map((p) => [p.id, p])),
  personBySlug: new Map(persons.map((p) => [p.slug, p])),
  creatorById: new Map(creators.map((c) => [c.id, c])),
  creatorBySlug: new Map(creators.map((c) => [c.slug, c])),
  labelById: new Map(labels.map((l) => [l.id, l])),
  filmById: new Map(films.map((f) => [f.id, f])),
  filmBySlug: new Map(films.map((f) => [f.slug, f])),
  workById: new Map(works.map((w) => [w.id, w])),
  workBySlug: new Map(works.map((w) => [w.slug, w])),
  recordingById: new Map(recordings.map((r) => [r.id, r])),
  recordingBySlug: new Map(recordings.map((r) => [r.slug, r])),
  releaseById: new Map(releases.map((r) => [r.id, r])),
  releaseBySlug: new Map(releases.map((r) => [r.slug, r])),
  sourceById: new Map(sources.map((s) => [s.id, s])),

  recordingsByWork: groupBy<Recording, EntityId>(recordings, (r) => r.workId),
  eventsByRelease: groupBy<ReleaseEvent, EntityId>(events, (e) => e.releaseId),
  creditsBySubject: groupBy<Credit, EntityId>(credits, (c) => c.subjectId),
  creditsByCreator: groupBy<Credit, EntityId>(credits, (c) => c.creatorId),
  releasesByRecording,
} as const;

export type CatalogueDb = typeof db;
