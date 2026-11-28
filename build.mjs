#!/usr/bin/env node
// Builds the static site into dist/: one HTML page per language, sitemap.xml,
// llms.txt and the IndexNow key file. No dependencies; Node 20+.
//
//   node build.mjs            build
//   node build.mjs --check    validate the translations only
//
// The build fails rather than publish a page whose languages disagree.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const site = JSON.parse(read('src/site.json'));
const LANGS = Object.keys(site.langs);
const DEF = site.defaultLang;
const t = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(read(`src/i18n/${l}.json`))]));
const template = read('src/template.html');

// Only what the pages use is published; CLAUDE.md, docs/ and src/ never are.
const ASSETS = [
  'fonts/bricolage-latin.woff2', 'fonts/dmmono-400-latin.woff2', 'fonts/dmmono-500-latin.woff2',
  'logo-460.webp', 'logo-920.webp', 'logo-460.png',
  'favicon-32.png', 'favicon-192.png', 'apple-touch-icon.png',
  'demo-graph.html', 'demo-poster.webp', 'demo-poster-m.webp', 'demo-poster.png',
  'og.png',
];

const errors = [];
const fail = (m) => errors.push(m);

// ── validation ───────────────────────────────────────────────────────────
const used = new Map(); // key -> raw (true) or escaped (false)
for (const m of template.matchAll(/\{\{\{([\w.]+)\}\}\}|\{\{([\w.]+)\}\}/g)) {
  const key = m[1] ?? m[2];
  const raw = m[1] !== undefined;
  if (used.has(key) && used.get(key) !== raw) fail(`${key}: used both raw and escaped`);
  used.set(key, raw);
}

// Every figure a string carries, ignoring how each language groups digits.
const figures = (s) =>
  (String(s).replace(/<[^>]+>/g, ' ').match(/\d[\d.,\u00a0\u202f]*\d|\d/g) || [])
    .map((x) => x.replace(/[.,\u00a0\u202f]/g, ''))
    .sort()
    .join(' ');

for (const l of LANGS) {
  for (const k of Object.keys(t[DEF])) if (!(k in t[l])) fail(`${l}: missing key ${k}`);
  for (const k of Object.keys(t[l])) if (!(k in t[DEF])) fail(`${l}: extra key ${k}`);
  for (const k of Object.keys(t[DEF])) {
    if (k in t[l] && figures(t[l][k]) !== figures(t[DEF][k])) {
      fail(`${l}: ${k} does not carry the same figures as ${DEF}\n    ${DEF}: ${t[DEF][k]}\n    ${l}: ${t[l][k]}`);
    }
  }
  for (const [k, raw] of used) {
    if (!(k in t[l])) fail(`${l}: template uses unknown key ${k}`);
    else if (!raw && /<[a-z/]/i.test(t[l][k])) fail(`${l}: ${k} holds markup but the template escapes it`);
  }
  if (!t[l]['hero.badge'].includes(`v${site.version}`)) fail(`${l}: hero.badge does not name v${site.version}`);
  if (!t[l]['v1.label'].includes(site.version)) fail(`${l}: v1.label does not name ${site.version}`);
}
for (const k of Object.keys(t[DEF])) if (!used.has(k)) fail(`unused key ${k}`);

if (errors.length) {
  console.error(`build: ${errors.length} problem(s)\n- ` + errors.join('\n- '));
  process.exit(1);
}
if (process.argv.includes('--check')) {
  console.log(`ok: ${LANGS.length} languages, ${Object.keys(t[DEF]).length} keys, same figures in all`);
  process.exit(0);
}

// ── helpers ──────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urlOf = (l) => site.origin + site.base + (l === DEF ? '' : `${l}/`);
const dirOf = (l) => (l === DEF ? '' : `${l}/`);
const css = read('src/styles.css').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
const js = read('src/app.js').replace(/<\/script/gi, '<\\/script');

function lastmod() {
  if (process.env.SLURP_LASTMOD) return process.env.SLURP_LASTMOD;
  try {
    // the day the published pages last changed, not the day of the deployment
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', 'src', 'assets', 'build.mjs'], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (d) return d;
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

function jsonLd(l) {
  const id = urlOf(DEF) + '#software';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': id,
        name: site.name,
        alternateName: 'slurp-graph',
        description: t[l]['meta.description'],
        url: urlOf(l),
        applicationCategory: 'DeveloperApplication',
        softwareVersion: site.version,
        softwareRequirements: 'Python 3.12+',
        license: site.license,
        isAccessibleForFree: true,
        downloadUrl: site.pypi,
        installUrl: site.pypi,
        softwareHelp: site.usage,
        sameAs: [site.github, site.pypi],
        author: { '@type': 'Person', name: site.author.name, url: site.author.url },
        inLanguage: l,
      },
      {
        '@type': 'SoftwareSourceCode',
        name: site.name,
        codeRepository: site.github,
        programmingLanguage: 'Python',
        runtimePlatform: 'Python 3.12+',
        license: site.license,
        targetProduct: { '@id': id },
      },
    ],
  }).replace(/</g, '\\u003c');
}

function page(l) {
  const root = l === DEF ? '' : '../';
  const hreflangs = [
    ...LANGS.map((x) => `<link rel="alternate" hreflang="${x}" href="${urlOf(x)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${urlOf(DEF)}" />`,
  ].join('\n');
  const ogAlts = LANGS.filter((x) => x !== l)
    .map((x) => `<meta property="og:locale:alternate" content="${site.langs[x].ogLocale}" />`)
    .join('\n');
  const langNav = LANGS.map((x) => {
    const href = root + dirOf(x) || './';
    const cur = x === l ? ' aria-current="page"' : '';
    return `<a href="${href}" hreflang="${x}" lang="${x}" title="${esc(site.langs[x].name)}"${cur}><span aria-hidden="true">${x.toUpperCase()}</span><span class="vh">${esc(site.langs[x].name)}</span></a>`;
  }).join('');

  let html = template
    .replace(/\{\{\{([\w.]+)\}\}\}/g, (_, k) => t[l][k])
    .replace(/\{\{([\w.]+)\}\}/g, (_, k) => esc(t[l][k]));
  const vars = {
    LANG: l,
    CANONICAL: urlOf(l),
    HREFLANGS: hreflangs,
    OGLOCALE: site.langs[l].ogLocale,
    OGALTS: ogAlts,
    OGIMAGE: site.origin + site.base + 'assets/og.png',
    LANGNAV: langNav,
    VERSION: site.version,
    JSONLD: jsonLd(l),
    CSS: css,
    JS: js,
  };
  html = html.replace(/%([A-Z]+)%/g, (m, k) => (k in vars ? vars[k] : m));
  return html.replace(/%ROOT%/g, root);
}

// ── write ────────────────────────────────────────────────────────────────
const DIST = join(ROOT, 'dist');
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'assets/fonts'), { recursive: true });

for (const a of ASSETS) {
  const from = join(ROOT, 'assets', a);
  if (!existsSync(from)) { console.error(`build: missing asset assets/${a}`); process.exit(1); }
  cpSync(from, join(DIST, 'assets', a));
}

for (const l of LANGS) {
  const out = join(DIST, dirOf(l));
  mkdirSync(out, { recursive: true });
  const html = page(l);
  const left = html.match(/\{\{[^}]*\}\}|%[A-Z]+%/);
  if (left) { console.error(`build: unresolved placeholder ${left[0]} in ${l}`); process.exit(1); }
  writeFileSync(join(out, 'index.html'), html);
}

const mod = lastmod();
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    LANGS.map(
      (l) =>
        `  <url>\n    <loc>${urlOf(l)}</loc>\n    <lastmod>${mod}</lastmod>\n` +
        LANGS.map((x) => `    <xhtml:link rel="alternate" hreflang="${x}" href="${urlOf(x)}" />\n`).join('') +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf(DEF)}" />\n  </url>\n`,
    ).join('') +
    `</urlset>\n`,
);

// llms.txt is a proposed convention (llmstxt.org), not a standard. It only
// repeats what slurp's README says and points at the Markdown sources.
const raw = 'https://raw.githubusercontent.com/CarlosVallejoRuiz/slurp/main';
const blob = `${site.github}/blob/main`;
writeFileSync(
  join(DIST, 'llms.txt'),
  `# slurp

> Token-budget-aware graph navigation for AI coding agents. slurp scores every node of a codebase knowledge graph against a query and selects the highest-relevance subgraph that fits within a token budget. It is an open-source (MIT) Python CLI and MCP server; install it with \`pip install slurp-graph\` (Python 3.12+; 4 dependencies: click, networkx, rich and tiktoken).

slurp works standalone (\`slurp index\` builds the graph with static analysis, no LLM) or as a companion to graphify. The current version is ${site.version}. This site is a landing page; the README is the reference for every command, flag and measured figure.

Since 1.5.0, a JSX usage of a React component (\`<Button />\`) is a \`renders\` edge, components wrapped in \`forwardRef\` or \`memo\` included, so the components that render it count as its dependants in \`slurp explain\`, \`slurp impact\` and \`slurp diff\`. \`slurp explain\` with Anthropic models needs the extra: \`pip install "slurp-graph[llm-anthropic]"\`; with OpenAI models, \`pip install "slurp-graph[llm-openai]"\`. Ollama and OpenAI-compatible endpoints need no extra, and with no provider it answers from the graph alone.

## Docs

- [README](${raw}/README.md): commands, flags, benchmark, MCP integration and upgrade notes
- [Usage guide](${raw}/USAGE.md): automatic MCP mode and manual CLI use
- [Upgrading to v1.5.0](${site.github}#upgrading-to-v150): what changes for existing users

## Project

- [Source code](${site.github}): GitHub repository
- [PyPI package](${site.pypi}): slurp-graph
- [Website](${urlOf(DEF)}): also in ${LANGS.filter((l) => l !== DEF).map((l) => `[${site.langs[l].name}](${urlOf(l)})`).join(', ')}

## Optional

- [Measured with agents](${site.github}/blob/v1.3.0/docs/design/mcp-autonomo/resultados/conclusiones.md): the v1.3.0 measurement and its limits, in Spanish
- [Budget study](${blob}/docs/design/presupuesto-optimo/resultados/conclusiones.md): conclusions, in Spanish
- [v1.4 ranking validation](${blob}/docs/design/orden-v1.4/resultados/validacion.md): in Spanish
- [v1.4 latency](${blob}/docs/design/orden-v1.4/resultados/latencia-optimizada.md): in Spanish
- [v1.5 JSX design](${blob}/docs/design/jsx-v1.5.md): in Spanish
- [v1.5 bank results](${blob}/docs/design/jsx-v1.5/resultados/banco-real.md): in Spanish
`,
);

writeFileSync(join(DIST, `${site.indexNowKey}.txt`), site.indexNowKey);

console.log(`built ${LANGS.length} pages (${LANGS.join(', ')}) · lastmod ${mod} · dist/`);
