import { db } from '../src/data/mock';
import { getTimeline, getCreator, getWork, search, getMusicOverview, listCreators } from '../src/services/musicService';

const problems: string[] = [];
const ids = new Set<string>();
for (const group of [db.persons, db.creators, db.works, db.recordings, db.releases, db.films, db.labels, db.sources, db.events, db.credits, db.relationships]) {
  for (const item of group as Array<{ id: string }>) {
    if (ids.has(item.id)) problems.push(`duplicate id ${item.id}`);
    ids.add(item.id);
  }
}
for (const credit of db.credits) {
  if (!db.creatorById.has(credit.creatorId)) problems.push(`credit -> missing creator ${credit.creatorId}`);
  if (!ids.has(credit.subjectId)) problems.push(`credit -> missing subject ${credit.subjectId}`);
  for (const s of credit.sourceIds) if (!db.sourceById.has(s)) problems.push(`credit -> missing source ${s}`);
}
for (const creator of db.creators) {
  if (creator.personId && !db.personById.has(creator.personId)) problems.push(`creator ${creator.slug} -> missing person`);
}
for (const release of db.releases) {
  if (release.labelId && !db.labelById.has(release.labelId)) problems.push(`release ${release.slug} -> missing label`);
  if (release.filmId && !db.filmById.has(release.filmId)) problems.push(`release ${release.slug} -> missing film`);
  for (const t of release.trackIds) if (!db.recordingById.has(t)) problems.push(`release ${release.slug} -> missing track ${t}`);
  if (!db.eventsByRelease.has(release.id)) problems.push(`release ${release.slug} -> no event`);
}
for (const film of db.films) {
  if (film.soundtrackReleaseId && !db.releaseById.has(film.soundtrackReleaseId)) problems.push(`film ${film.slug} -> missing soundtrack release`);
  for (const p of film.directorPersonIds) if (!db.personById.has(p)) problems.push(`film ${film.slug} -> missing director ${p}`);
}
for (const rel of db.relationships) {
  if (!ids.has(rel.fromId)) problems.push(`relationship ${rel.id} -> missing from ${rel.fromId}`);
  if (!ids.has(rel.toId)) problems.push(`relationship ${rel.id} -> missing to ${rel.toId}`);
}
for (const recording of db.recordings) {
  if (!db.workById.has(recording.workId)) problems.push(`recording ${recording.slug} -> missing work`);
  if (!db.releasesByRecording.has(recording.id)) problems.push(`recording ${recording.slug} -> on no release`);
}

const overview = await getMusicOverview();
const all = await getTimeline({ limit: 500 });
const withLater = await getTimeline({ limit: 500, includeSubsequentReleases: true });
const rahman = await getCreator('ar-rahman');
const raaja = await getCreator('ilaiyaraaja');
const filtered = await getTimeline({ creatorId: 'creator:ar-rahman', musicTypes: ['instrumental'], limit: 100 });
const combo = await getTimeline({ creatorId: 'creator:santhosh-narayanan', contexts: ['non-film'], classifications: ['independent'], limit: 100 });
const mayaNadhi = await getWork('maya-nadhi');
const kolaveri = await getWork('why-this-kolaveri-di');
const hits = await search('rahman');
const creators = await listCreators({ role: 'composer' });

console.log('problems:', problems.length ? problems : 'none');
console.log('entities:', { works: db.works.length, recordings: db.recordings.length, releases: db.releases.length, events: db.events.length, credits: db.credits.length, creators: db.creators.length });
console.log('timeline: total', all.total, '| with later appearances', withLater.total, '| undated', all.undatedCount, '| span', all.span);
console.log('overview totals', overview.totals, 'featured', overview.featuredCreators.map(c => `${c.creator.name}:${c.workCount}`));
console.log('rahman works', rahman.workCount, 'span', rahman.activeSpan, 'films', rahman.films.length, 'collabs', rahman.collaborators.slice(0,3).map(c=>`${c.name}/${c.role}:${c.count}`));
console.log('raaja works', raaja.workCount, 'span', raaja.activeSpan);
console.log('rahman+instrumental:', filtered.items.map(i => `${i.year} ${i.title}`));
console.log('santhosh independent non-film:', combo.items.map(i => `${i.year} ${i.title}`));
console.log('maya nadhi recordings:', mayaNadhi.recordings.map(r => `${r.recording.title}${r.recording.versionLabel ? ' ('+r.recording.versionLabel+')' : ''} -> ${r.appearances.map(a=>a.release.title).join(', ')}`));
console.log('kolaveri appearances:', kolaveri.recordings[0].appearances.map(a => `${a.release.title} [${a.release.type}] ${a.event?.date.value?.year}`));
console.log('kolaveri sources:', kolaveri.sources.map(s=>s.id));
console.log('search rahman groups:', hits.groups.map(g => `${g.label}:${g.hits.length}`));
console.log('composers listed:', creators.items.length);
const enjoy = await getWork('enjoy-enjaami');
const ev = enjoy.recordings[0].appearances[0].event;
console.log('enjoy enjaami time fact:', ev?.time.value, ev?.time.certainty);
const undated = withLater.items.filter(i => i.year === null).map(i => i.title);
console.log('undated entries:', undated);
