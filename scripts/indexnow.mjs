#!/usr/bin/env node
// Tells IndexNow (Bing and the engines that share it) which URLs changed.
//   URLS='["https://…/"]' node scripts/indexnow.mjs
// The key file lives under /slurp-web/, so keyLocation is sent with every
// notification: a key there is valid for the URLs below that path.
// 200 = received, 202 = received, key validation pending.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(ROOT, 'src/site.json'), 'utf8'));
const urlList = JSON.parse(process.env.URLS || '[]');
if (!urlList.length) { console.log('indexnow: nothing changed, nothing sent'); process.exit(0); }

const prefix = site.origin + site.base;
const bad = urlList.filter((u) => !u.startsWith(prefix));
if (bad.length) { console.error(`indexnow: outside ${prefix}: ${bad.join(', ')}`); process.exit(1); }

const keyLocation = `${prefix}${site.indexNowKey}.txt`;
// The key must be served before the notification is sent.
const k = await fetch(keyLocation);
if (!k.ok || (await k.text()).trim() !== site.indexNowKey) {
  console.error(`indexnow: key file not served at ${keyLocation} (HTTP ${k.status})`);
  process.exit(1);
}

const body = { host: new URL(site.origin).host, key: site.indexNowKey, keyLocation, urlList };
if (process.env.DRY_RUN) { console.log(JSON.stringify(body, null, 2)); process.exit(0); }

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
console.log(`indexnow: HTTP ${r.status} for ${urlList.length} URL(s)`);
if (r.status !== 200 && r.status !== 202) { console.error(await r.text()); process.exit(1); }
