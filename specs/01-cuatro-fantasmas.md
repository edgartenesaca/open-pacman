# 01 — Cuatro fantasmas con personalidades distintas

**Estado:** Aprobado
**Objetivo:** Ampliar el juego de 2 a 4 fantasmas, cada uno con un algoritmo de decisión propio y diferenciable, incluyendo un perseguidor agresivo.

## Contexto actual

- `GHOST_STARTS` en `src/js/maze.js` define 2 fantasmas (`hunter`, `random`) en la pen.
- `decideGhost` en `src/js/game.js` elige dirección local por celda alineada: el `hunter` minimiza distancia Manhattan a Pac-Man y el resto elige al azar.
- `src/js/render.js` colorea por índice con `GHOST_COLORS` (4 colores ya disponibles).
- La casa interior de la pen abarca `x ∈ [11..16]`, `y ∈ [13..15]`; la puerta está en `y = 12`, `x ∈ [13,14]` (`tile === 3`).
- `TUNNEL_ROW = 14`; los actores se mueven a velocidades recíprocas de enteros (`0.1`).

## Alcance

### Incluye

- Definir 4 posiciones y tipos iniciales en `GHOST_STARTS`: `hunter`, `ambusher`, `patrol`, `shy` (se elimina `random`).
- Implementar la selección de celda objetivo (`getGhostTarget`) por tipo de fantasma en `src/js/game.js`.
- Refactorizar `decideGhost` para elegir, entre las direcciones válidas (sin giro de 180° salvo callejón sin salida), la que minimiza la distancia Manhattan al objetivo del fantasma.
- Forzar la salida de la pen: mientras un fantasma esté dentro de la casa su objetivo es la celda de salida y no puede volver a entrar por la puerta.
- Asociar un color fijo por `kind` en `src/js/render.js` para identificar visualmente cada personalidad.

### Fuera de alcance

- Modos globales Scatter / Frightened (power pellets).
- Pathfinding completo (BFS/A*); se mantiene la decisión local por celda alineada.
- Temporizadores de salida escalonada: los fantasmas salen en cuanto alcanzan la puerta.
- Cambios de dificultad por velocidad: los 4 fantasmas mantienen `GHOST_SPEED = 0.1`.

## Comportamientos

| Tipo      | Color     | Objetivo                                                                   |
| --------- | --------- | -------------------------------------------------------------------------- |
| `hunter`  | `#ff0000` | Celda actual de Pac-Man. Perseguidor agresivo.                             |
| `ambusher`| `#ffb8ff` | 4 celdas delante de Pac-Man según `pacman.dir`.                            |
| `patrol`  | `#00ffff` | Celda reflejada del `hunter` respecto a 2 celdas delante de Pac-Man.       |
| `shy`     | `#ffb852` | Pac-Man si la distancia Manhattan es `> 8`; esquina `(1, 29)` si es `<= 8`. |

- `ambusher` y `patrol` calculan coordenadas objetivo que pueden caer fuera del laberinto o dentro de paredes: es válido, solo se usa como heurística de distancia.
- Si no existiera un fantasma `hunter`, `patrol` usa la celda de Pac-Man como pivote.

## Plan de implementación

1. **Configurar los 4 fantasmas en el laberinto (`src/js/maze.js`)**
   - Actualizar `GHOST_STARTS` con 4 entradas dentro de la casa: `(13,13) hunter`, `(14,13) ambusher`, `(12,14) patrol`, `(15,14) shy`.

2. **Implementar personalidades en la lógica de juego (`src/js/game.js`)**
   - Añadir helper `manhattan(ax, ay, bx, by)`.
   - Añadir helper `pickBestDir(g, choices, targetX, targetY)` que elige la dirección cuya celda vecina minimiza la distancia Manhattan al objetivo (primer candidato en caso de empate).
   - Añadir `getGhostTarget(game, g)` con las 4 reglas de la tabla y el forzado de salida de la pen.
   - Actualizar `decideGhost` para usar `getGhostTarget` + `pickBestDir`; eliminar la rama aleatoria.
   - Añadir a `canMove` el bloqueo de la puerta (`tile === 3`) para fantasmas que vienen desde abajo (`dir === 'up'`), de modo que no entren a la casa.

3. **Mapear colores por personalidad (`src/js/render.js`)**
   - Reemplazar el arreglo `GHOST_COLORS` indexado por un mapa por `kind` con los colores de la tabla.
   - En `draw`, pasar `GHOST_COLORS[g.kind]` (con fallback al rojo) a `drawGhost`.

## Criterios de aceptación

- [ ] Al iniciar partida aparecen 4 fantasmas de colores distintos (rojo, rosa, cian, naranja) dentro de la casa y todos salen por la puerta.
- [ ] El fantasma rojo (`hunter`) toma en cada intersección el camino que reduce la distancia Manhattan hacia Pac-Man.
- [ ] El rosa apunta delante de Pac-Man, el cian flanquea según el vector del perseguidor y el naranja se aleja a la esquina inferior izquierda cuando está a 8 celdas o menos.
- [ ] Los 4 fantasmas se comportan de forma observablemente distinta entre sí en una misma partida.
- [ ] Ningún fantasma se queda atrapado rebotando dentro de la casa al inicio ni puede volver a entrar en ella.
- [ ] Al perder una vida (`resetPositions`), los 4 fantasmas vuelven a sus coordenadas iniciales en `GHOST_STARTS`.
- [ ] Se mantiene la alineación de celdas y el cruce por el túnel (`TUNNEL_ROW = 14`) sin cambios en `MAZE` ni en el tamaño del canvas.
