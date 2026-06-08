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

## El problema que resuelve

- graphify genera grafos de conocimiento del codebase (herramienta externa, muy popular, 58k stars)
- El grafo de PrismaStats tiene 2.111 nodos y pesa 69.418 tokens
- Inyectar el grafo completo en cada query a Claude Code es ineficiente y caro
- Slurp selecciona solo los nodos relevantes dentro de un presupuesto de tokens

---

## Números reales (benchmark sobre PrismaStats)

| Query | Budget | Tokens usados | Grafo completo | Ahorro |
|-------|--------|---------------|----------------|--------|
| "auth flow" | 2.000 | 2.000 | 69.418 | **97.1%** |
| "player stats" | 4.000 | 4.000 | 69.418 | **94.2%** |
| "database schema" | 8.000 | 8.000 | 69.418 | **88.5%** |

**Media: 93.3% de ahorro · Mejor caso: 97.1%**

---

## Comandos principales

```bash
# Instalar
pip install slurp-graph

# Query con visualizador
slurp "auth flow" --graph graphify-out/graph.json --budget 4000 --viz

# Configurar como MCP en Claude Code (.mcp.json)
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
2. **Generar el grafo con graphify** — `graphify extract . --backend claude`
3. **Configurar el MCP** — añadir `.mcp.json` al proyecto

A partir del paso 3, Claude Code llama a slurp automáticamente. El usuario no hace nada diferente.

---

## Assets disponibles

- Logo: `assets/SlurpLogo_SinFondo.png` — círculo naranja con grafo de nodos
- GIF demo: grabación de pantalla mostrando el visualizador abriéndose con el badge "💰 Saved ~101,551 tokens (96%)"
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
- Número grande destacado: **69,418 tokens** → **4,000 tokens**

### 3. Benchmark
- Tabla con los números reales
- Summary: Mean savings 93.3% · Best case 97.1%

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
- **Números grandes** — el 93.3% y el 97.1% deben ser visualmente prominentes
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