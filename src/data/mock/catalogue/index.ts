import { buildCatalogue } from '../../builders';
import { contemporaryReleases } from './contemporary';
import { earlyEraReleases } from './early-era';
import { rahmanEraReleases } from './rahman-era';

/**
 * Order matters only for readability — the builder resolves cross-release
 * references (`sameRecordingAs`, `sameWorkAs`) in the order the specs appear,
 * so a recording must be defined before it is re-used.
 */
export const catalogue = buildCatalogue([
  ...earlyEraReleases,
  ...rahmanEraReleases,
  ...contemporaryReleases,
]);
