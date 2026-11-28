# CLAUDE.md — slurp-web

## Qué es este proyecto

Landing page estática para **slurp** — una herramienta CLI open source de token-budget-aware graph navigation para AI coding agents.

Diseño actual: **«la barra de ramen»** (dirección C de `docs/rediseno.md`) — fondo oscuro, el bol grande, bandas naranjas y los totales como ticket de caja.

**Autor:** Juank (Juan Carlos Vallejo Ruiz) — Full-Stack Developer & AI entrepreneur, Terrassa, Barcelona.
**Repo slurp:** https://github.com/CarlosVallejoRuiz/slurp
**PyPI:** https://pypi.org/project/slurp-graph/

---

## La historia de slurp

Un knowledge graph es como un bowl de ramen — miles de nodos entrelazados. Tu LLM no necesita el bowl entero. Slurp puntúa cada nodo según tu query con matemática pura (PageRank + TF-IDF, sin llamar a ningún LLM, sin gastar un solo token extra) y sirve exactamente los noodles que necesita.

**Tagline:** *graphify builds the bowl. slurp serves exactly the noodles your LLM needs.* 🍜

---

## Fuente de verdad de las cifras

**Ninguna cifra sale de este fichero.** Todas las cifras y afirmaciones técnicas de la web salen
del `README.md` de slurp (`~/Desktop/Slurp/slurp/`) en el tag de la versión publicada, y de los
documentos que ese README enlaza en `docs/design/`. Antes de tocar una cifra, léela allí; si
algo de la web no tiene respaldo en el README, se quita o se pregunta al autor.

La web está al día con **slurp v1.5.0**. Las cifras de abajo son las de ese README (y de las
notas de la versión, `~/slurp-bench/v15/notas-v1.5.0.md`), como referencia rápida; si el README
cambia, manda el README.

## El problema que resuelve

- `slurp index` genera el grafo del codebase con análisis estático, sin LLM; graphify es
  opcional (slurp sirve su grafo en solo lectura)
- El grafo de graphify de PrismaStats tiene 2.111 nodos; impreso entero como lo imprime slurp
  son 117.828 tokens
- Inyectar el grafo completo en cada query a Claude Code es ineficiente y caro
- Slurp selecciona solo los nodos relevantes dentro de un presupuesto de tokens

---

## Números reales (README de slurp v1.5.0)

**Ahorro** (`slurp benchmark`, grafo de graphify de PrismaStats, grafo completo 117.828 tokens;
las tres consultas — "auth flow", "prisma schema", "database pool" — dan el mismo ahorro):

| Budget | Tokens usados | Ahorro |
|--------|---------------|--------|
| 2.000 | 1.964–1.968 | **98,3%** |
| 4.000 | 3.926–3.928 | **96,7%** |
| 8.000 | 7.841–7.847 | **93,3%** |

**Media: 96,1% · p50: 96,7% · Mejor caso: 98,3% · Peor caso: 93,3%**

**Orden de la v1.4** (recall a `--budget 4000` en markdown, seis proyectos de validación de un
banco de 1.525 preguntas de commits de 14 proyectos): media 0,543 → 0,674 con los mismos tokens.
**v1.5.0** (mismo banco, cada grafo reindexado): 0,674 → **0,677**, ningún proyecto baja —
excalidraw 0,583 → 0,599, prometheus 0,535 → 0,539; gin, click, ripgrep y commons-lang iguales.

**31 preguntas etiquetadas** (v1.3 → v1.4.0): markdown a 4000, PrismaStats 0,967 → 0,967 y
slurp 0,875 → 0,938; JSON a 4000, 0,900 → 0,867 y 0,812 → 0,750; markdown a 16000,
0,967 → 0,967 y 1,000 → 0,938; MRR de PrismaStats 0,405 → 0,337. v1.4.0 → v1.5.0, solo markdown
a 4000: PrismaStats 0,967 → 0,933 (pierde `arch-02`), slurp 0,938 → 0,938. Las pérdidas se muestran.

**React/JSX** (v1.5.0): `<Button />` es una arista `renders`, también con `forwardRef`/`memo`.
`slurp impact` sobre `Button` en PrismaStats (Next.js): LOW sin dependientes → HIGH con 32 de
producción (registro en `docs/design/jsx-v1.5.md` §8). De PrismaStats no se enseña código.
`slurp index` de PrismaStats con la v1.5.0: 1.638 nodos · 2.284 aristas · 185 ficheros.

**Instalación** (v1.5.0): 4 dependencias (click, networkx, rich, tiktoken). `slurp explain` con
Anthropic necesita `pip install "slurp-graph[llm-anthropic]"`; con OpenAI, `[llm-openai]`.

**Medición con agentes** (v1.3.0): 9 de 10 sesiones llamaron a slurp por su cuenta, 0
aprobaciones, 10 tareas completadas. Siempre con sus límites: n = 10, una sola ejecución.

**Tests:** 3.264 (notas de la v1.5.0 y `pytest --collect-only` en el tag; el badge del README
sigue diciendo 3082). **Visualizador de la demo** ("player stats", budget 4000, v1.4.0): 103/2111
nodos, 3.926/4.000 tokens, 96,7% ahorrado.

---

## Comandos principales

```bash
# Instalar
pip install slurp-graph

# Setup guiado: crea el grafo, registra el MCP, lo aprueba para Claude Code
slurp init

# Query con visualizador
slurp "auth flow" --graph graphify-out/graph.json --budget 4000 --viz

# Configurar el MCP a mano (.mcp.json) — slurp init ya lo hace
{
  "mcpServers": {
    "slurp": {
      "command": "slurp",
      "args": ["serve", "--graph", "graphify-out/graph.json"]
    }
  }
}

# Benchmark
slurp benchmark --graph graph.json --queries "auth flow" --budget 4000

# Diff entre versiones
slurp diff old.json new.json --viz
```

---

## Flujo de uso (3 pasos)

1. **Instalar slurp** — `pip install slurp-graph`
2. **`slurp init`** (recomendado) — crea el grafo, registra el MCP, lo aprueba para Claude Code
   e indica al agente cuándo usar slurp
3. **Vía manual** — `slurp index .` y añadir `.mcp.json` al proyecto (así Claude Code pide
   aprobación)

Tras `slurp init`, Claude Code llama a slurp sin pedir aprobación y el grafo se refresca solo
antes de cada respuesta. El usuario no hace nada diferente.

---

## Cómo está hecha

- **HTML, CSS y JS sin frameworks ni dependencias.** Una plantilla y un fichero de textos por
  idioma; `node build.mjs` genera `dist/` con una página estática por idioma.
- **Fuentes de verdad:**
  - `src/template.html` — la estructura. `{{clave}}` inserta texto escapado, `{{{clave}}}`
    HTML; las cifras de las tablas van escritas en la plantilla.
  - `src/i18n/{en,es,it,fr,de}.json` — todos los textos. Los cinco deben tener las mismas
    claves y las mismas cifras: `node build.mjs --check` lo comprueba y el build falla si no.
  - `src/styles.css` y `src/app.js` — se incrustan en cada página.
  - `src/site.json` — versión, URLs, idiomas y la clave de IndexNow. **La versión se cambia
    aquí** (pie y JSON-LD) y en los textos `hero.badge`, `v1.label`, `v1.h2` y `v1.p`.
- **`dist/` no se versiona** y es lo único que se publica: `CLAUDE.md`, `docs/` y `src/` no.
- **La página funciona sin JavaScript.** El JS solo añade los botones de copiar, las estrellas
  de GitHub y la carga del visualizador dentro de la página.
- **No hay `index.html` en la raíz.** Las páginas solo existen en `dist/`, generadas.

## URLs

- Canónica: `https://imjuank.dev/slurp-web/` (inglés) y `/es/`, `/it/`, `/fr/`, `/de/`.
  `carlosvallejoruiz.github.io/slurp-web` redirige ahí.
- `sitemap.xml`, `llms.txt` y el fichero de la clave de IndexNow se generan en `dist/`.
- `robots.txt` no se puede servir desde aquí: va en la raíz del dominio, que es el repositorio
  de la web personal.

## Diseño

- **Colores:** fondo `#16110c`, texto crema `#f4ead8`, secundario `#bdb19c`, naranja `#f97316`,
  tinta `#1a120a`. Sobre naranja y sobre crema el texto es siempre tinta. Todo cumple AA.
- **Tipografía:** Bricolage Grotesque (titulares y texto) y DM Mono (datos y código),
  autoalojadas en `assets/fonts/`.
- **Las cifras mandan sobre la decoración.** Las tablas y los bloques medidos son planos, con
  los números a la derecha y sus límites al lado. Lo inclinado y lo festivo (el ticket) se
  reserva para los totales del hero.
- **Antes y después se muestran igual, suba o baje.** Nunca se tacha el valor antiguo. Las
  ganancias llevan ▲, las pérdidas ▼ y lo que no cambia =, con leyenda.
- **Sin animaciones** y sin nada que oculte contenido hasta que se ejecute un script.

## Assets

- `assets/SlurpLogo_SinFondo.png` es el original (2048 px, 2,7 MB): **no se enlaza nunca**.
  Se usan `logo-460.webp` / `logo-920.webp` y los favicons.
- `assets/demo-graph.html` — el visualizador. Si se regenera, hay que reaplicar su bloque
  `@media (max-width: 700px)` **y rehacer las carátulas** `demo-poster.webp`,
  `demo-poster-m.webp` y `demo-poster.png`, que son capturas suyas.
- `assets/og.png` — imagen para compartir (1200 × 630), hecha desde `src/og/og.html`. Lleva
  cifras: si cambian, se rehace.

## Lo que NO hacer

- ❌ No cambiar una cifra sin leerla en el README de slurp
- ❌ No añadir texto en un idioma sin añadirlo en los cinco
- ❌ No usar frameworks ni dependencias de build
- ❌ No poner formularios de email o capturas de leads
- ❌ No esconder contenido detrás de JavaScript
- ❌ No enlazar el logo original ni cargar el visualizador al entrar

## Despliegue

`.github/workflows/deploy.yml`: en cada push a `main` construye `dist/`, lo publica en GitHub
Pages y avisa a IndexNow de las páginas cuyo HTML ha cambiado (`scripts/changed-urls.mjs`,
`scripts/indexnow.mjs`). Requiere *Settings → Pages → Source: GitHub Actions*.

## Al empezar una sesión

1. Leer este CLAUDE.md completo
2. `node build.mjs` y abrir `dist/index.html`
3. Comprobar los cinco idiomas a 375 px y en escritorio antes de dar nada por terminado
