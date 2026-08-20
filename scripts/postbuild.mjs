/**
 * Post-build step for GitHub Pages.
 *
 * Pages serves static files only: a direct request for /music/timeline has no
 * file behind it and falls through to 404.html. Copying the built index.html to
 * 404.html means that request still boots the app, at the URL the user typed,
 * and React Router takes it from there — so deep links and refreshes work.
 *
 * Also asserts that the Pages control files survived the build, because a
 * missing CNAME silently unsets the custom domain on the next deploy.
 */

import { copyFile, access, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

await copyFile(join(dist, 'index.html'), join(dist, '404.html'));
console.log('postbuild: 404.html written (SPA fallback for deep links)');

if (!(await exists(join(dist, '.nojekyll')))) {
  await writeFile(join(dist, '.nojekyll'), '');
  console.log('postbuild: .nojekyll written');
}

const cname = join(dist, 'CNAME');
if (await exists(cname)) {
  console.log('postbuild: CNAME present (timeline.harithkavish.com)');
} else {
  console.error('postbuild: CNAME missing from dist — the custom domain would be unset.');
  process.exitCode = 1;
}
