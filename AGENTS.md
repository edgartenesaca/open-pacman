# AGENTS.md

Pac-Man clone in vanilla JS/CSS/HTML. Part of the `/home/edgar/OpenCode` collection (see root `AGENTS.md`).

## Run / verify

- There is **no build, no package.json, no tests, no lint, and no dev server**. Do not invent `npm`/`bun` commands.
- Verify by opening `src/index.html` in a browser, or `npx serve src` if `file://` is an issue.
- The only check available is manual play: arrows move, dots get eaten, ghosts chase/randomize, win and lose overlays appear.

## Spec-driven workflow (the point of this project)

- Implementation comes from `specs/NN-slug.md`, not from ad-hoc requests. `specs/` and `specs/.spec-config.yml` **do not exist yet** — create them when the first spec is written.
- `/spec-impl` lives in `.agents/skills/spec-impl/SKILL.md` (locked in `skills-lock.json`). It refuses any spec whose status is not "Approved"/"Aprobado", creates branch `spec-NN-slug`, and pauses after each step.
- Per-step commits (`spec-NN-step-MM`) are **off by default**; never commit unless the user asks.

## Script loading — easiest thing to break

- `src/index.html` loads plain `<script>` tags in a fixed order: `maze.js` → `game.js` → `render.js` → `main.js`.
- No modules, no imports/exports, no bundler. Files expose globals via `window.X` at the bottom; earlier files are depended on by later ones. Adding a file means adding a `<script>` tag in the right position.
- Any new top-level function used across files must be attached to `window`.

## Maze / game model

- `MAZE` in `src/js/maze.js` is **pristine and must never be mutated**. `createGame()` copies it into `game.grid`; rendering reads `game.grid` (so eaten dots disappear). Render never reads `MAZE`.
- Tile codes: `1` wall, `2` dot, `3` ghost-pen door (Pac-Man blocked, ghosts pass), `0` empty walkable.
- Maze is 28×31 cells, `TILE = 20` in `render.js`, so canvas must stay 560×620. Changing the maze dimensions requires updating the canvas in `index.html` and `#game-wrap` in `style.css`.
- `TUNNEL_ROW = 14` is the only row that wraps horizontally.
- Actors store **fractional cell coordinates**. Direction changes, dot eating, and ghost decisions only happen when `aligned()` (within 1e-3 of an integer cell).
- Speeds are reciprocals of integers (`0.125` = 1/8, `0.1` = 1/10) so actors land exactly on cells. Any other speed breaks the alignment logic — keep this constraint.
- `MAZE_STR` is 31 readable strings of 28 chars; edit the ASCII art, not the parsed numbers.

## Conventions

- Code identifiers in English; UI strings and comments in Spanish (e.g. `VIDAS`, `GANASTE`, `PERDISTE`).
- No dependencies or external assets; the "Press Start 2P" font is only a fallback name, nothing is downloaded.
- Commit messages are in Spanish.
