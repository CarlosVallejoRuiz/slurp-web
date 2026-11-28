# CLAUDE.md — slurp-web

## Qué es este proyecto

Landing page estática para **slurp** — una herramienta CLI open source de token-budget-aware graph navigation para AI coding agents.

La web debe tener el mismo estilo que la landing de DebugDuck y la de `npx autoskill` — minimalista, dark, con personalidad técnica pero accesible.

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

La web está al día con **slurp v1.4.0**. Las cifras de abajo son las de ese README, como
referencia rápida; si el README cambia, manda el README.

## El problema que resuelve

- `slurp index` genera el grafo del codebase con análisis estático, sin LLM; graphify es
  opcional (slurp sirve su grafo en solo lectura)
- El grafo de graphify de PrismaStats tiene 2.111 nodos; impreso entero como lo imprime slurp
  son 117.828 tokens
- Inyectar el grafo completo en cada query a Claude Code es ineficiente y caro
- Slurp selecciona solo los nodos relevantes dentro de un presupuesto de tokens

---

## Números reales (README de slurp v1.4.0)

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

**31 preguntas etiquetadas** (v1.3 → v1.4.0): markdown a 4000, PrismaStats 0,967 → 0,967 y
slurp 0,875 → 0,938; JSON a 4000, 0,900 → 0,867 y 0,812 → 0,750; markdown a 16000,
0,967 → 0,967 y 1,000 → 0,938; MRR de PrismaStats 0,405 → 0,337. Las pérdidas se muestran.

**Medición con agentes** (v1.3.0): 9 de 10 sesiones llamaron a slurp por su cuenta, 0
aprobaciones, 10 tareas completadas. Siempre con sus límites: n = 10, una sola ejecución.

**Tests:** 3.082. **Visualizador de la demo** ("player stats", budget 4000, v1.4.0): 103/2111
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

## Assets disponibles

- Logo: `assets/SlurpLogo_SinFondo.png` — círculo naranja con grafo de nodos
- GIF demo: `assets/Slurp_Linkedin.gif`, grabación antigua del visualizador; sus cifras son de una versión vieja, no citarlas
- Demo en vivo: `assets/demo-graph.html`, generado con `slurp "player stats" --budget 4000 --viz-output` sobre el grafo de graphify de PrismaStats. Lleva un bloque `@media (max-width: 700px)` añadido a mano: hay que reaplicarlo cada vez que se regenera
- Capturas: tabla del benchmark en terminal, visualizador interactivo

---

## Stack técnico de la web

- **HTML + CSS + JS vanilla** — sin frameworks, archivo único
- **Sin dependencias externas** — máximo un CDN para fuentes
- **Dark theme** — fondo #0d1117 (GitHub dark), acentos en naranja (#f97316) que es el color del logo
- **Responsive** — funciona en móvil y desktop
- **Desplegada en GitHub Pages** del repo `slurp-web`

---

## Estructura de la página (en orden)

### 1. Hero
- Logo de slurp centrado (usar el PNG del logo)
- Título: **slurp**
- Tagline en cursiva: *graphify builds the bowl. slurp serves exactly the noodles your LLM needs.* 🍜
- Comando de instalación grande con botón de copiar: `pip install slurp-graph`
- Dos botones: [GitHub →] [PyPI →]

### 2. El problema
- Título: "Your LLM doesn't need the whole bowl"
- 2-3 líneas explicando el problema de los tokens
- Número grande destacado: **117,828 tokens** → **4,000 tokens**

### 3. Benchmark
- Tabla con los números reales
- Summary: Mean savings 96.1% · Best case 98.3%
- Bloques de recall: el orden de la v1.4, las 31 preguntas etiquetadas (con sus pérdidas) y la guía de presupuesto

### 4. Demo visual
- El GIF de la demo (visualizador abriéndose)
- Caption: "slurp --viz opens an interactive subgraph explorer"

### 5. Cómo funciona
- 3 pasos con iconos simples
- Modo automático (MCP) explicado en 2 líneas
- Snippet del .mcp.json

### 6. Features
- Lista de 6 features principales con iconos
- --viz, --inject-code, slurp diff, slurp benchmark, slurp export, MCP server

### 7. Footer
- Links: GitHub · PyPI · MIT License
- "Built by Juank · Terrassa, Barcelona"

---

## Principios de diseño

- **Minimalista** — mucho espacio en blanco (negro), sin elementos decorativos innecesarios
- **Código como protagonista** — los snippets de código deben verse bien, con syntax highlighting simple
- **Números grandes** — el 96.1% y el 98.3% deben ser visualmente prominentes
- **Una sola acción principal** — el comando `pip install slurp-graph` es el CTA más importante
- **Sin animaciones pesadas** — máximo fade-in suave al hacer scroll

---

## Lo que NO hacer

- ❌ No usar frameworks (React, Vue, etc.)
- ❌ No usar colores brillantes excepto el naranja del logo (#f97316)
- ❌ No añadir más secciones de las especificadas
- ❌ No poner formularios de email o capturas de leads
- ❌ No usar imágenes de stock
- ❌ No hacer animaciones complejas que ralenticen la página

---

## Despliegue

GitHub Pages desde el repo `slurp-web`.
El archivo principal es `index.html` en la raíz.
URL final: `https://carlosvallejoruiz.github.io/slurp-web`

---

## Primera sesión con Claude Code

Al inicio de cada sesión:
1. Leer este CLAUDE.md completo
2. El objetivo es un único archivo `index.html` autocontenido
3. CSS y JS van dentro del mismo HTML
4. Construir sección por sección, empezando por Hero
5. Verificar que se ve bien en móvil antes de dar por terminada cada sección