#!/usr/bin/env node
// Prints, as a JSON array, the canonical URLs whose built HTML differs from
// what is being served now. Run after `node build.mjs`, before deploying.
// A page that cannot be fetched counts as changed.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(ROOT, 'src/site.json'), 'utf8'));
const changed = [];

for (const l of Object.keys(site.langs)) {
  const dir = l === site.defaultLang ? '' : `${l}/`;
  const url = site.origin + site.base + dir;
  const built = readFileSync(join(ROOT, 'dist', dir, 'index.html'), 'utf8');
  let live = null;
  try {
    const r = await fetch(`${url}?t=${Date.now()}`, { headers: { 'user-agent': 'slurp-web-deploy' } });
    if (r.ok) live = await r.text();
  } catch {}
  if (live !== built) changed.push(url);
}

console.log(JSON.stringify(changed));
