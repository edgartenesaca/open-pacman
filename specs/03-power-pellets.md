# 03 — Cuatro power pellets en las esquinas

**Estado:** aprobado
**Objetivo:** Añadir 4 power pellets, uno en cada esquina del laberinto, que al comerse den puntos y activen un modo asustado temporal en los fantasmas.

## Contexto actual

- `src/js/maze.js` usa tiles `1` pared, `2` dot, `3` puerta y `0` vacío; `parseTile` traduce desde `MAZE_STR`.
- `createGame` copia `MAZE` a `game.grid` y cuenta solo tiles `2` en `dotsRemaining`.
- `movePacman` come dots con `+10`; `drawDots` los pinta con radio 2.5.
- `update` comprueba colisiones fantasma/Pac-Man y descuenta vidas.
- Las esquinas `(1,1)`, `(26,1)`, `(1,29)` y `(26,29)` son celdas con dot, transitables.

**Dependencia:** implementar este spec sobre una rama que ya incluya el spec 02 (`spec-02-salida-escalonada-fantasmas`), porque ambos modifican `update`.

## Alcance

### Incluye

- Tile `4` (`'o'` en `MAZE_STR`) en `(1,1)`, `(26,1)`, `(1,29)` y `(26,29)`.
- `parseTile` reconoce `'o'` como `4`; la celda es transitable y comestible.
- Comer un pellet: `+50` puntos y descuenta de `dotsRemaining` (el nivel solo termina con dots y pellets comidos).
- Modo asustado: `game.frightened = 360` frames (~6 s a 60 fps); comer otro pellet reinicia el contador.
- Durante el modo asustado los fantasmas huyen (objetivo opuesto a Pac-Man respecto al centro) y se pintan de azul `#2121de`.
- Contacto en modo asustado: `+200` puntos y el fantasma vuelve a su celda inicial de la casa en lugar de quitar una vida.
- Power pellet dibujado más grande (radio 6) que un dot normal (2.5).

### Fuera de alcance

- Parpadeo de los fantasmas al final del modo asustado.
- Ojos volviendo a la casa por su cuenta.
- Reducción de velocidad de los fantasmas asustados.
- Inversión de dirección al activar el pellet.
- Sonidos y reaparición de pellets comidos.

## Decisiones

- **Base del tiempo:** frames, igual que el resto del motor (`FRIGHTENED_FRAMES = 360`).
- **Huida:** `getGhostTarget` devuelve el punto opuesto a Pac-Man respecto al centro del laberinto (`27 - px`, `30 - py`); si el fantasma está en la casa, la salida sigue teniendo prioridad.
- **Muerte y reinicio:** `resetPositions` pone `game.frightened = 0`.

## Plan de implementación

1. **Tile y posiciones (`src/js/maze.js`)**
   - Cambiar a `'o'` las celdas `x = 1` y `x = 26` de las filas 1 y 29.
   - `parseTile`: `'o'` → `4`; actualizar el comentario de códigos de tile.

2. **Pellet comestible y estado (`src/js/game.js`)**
   - Constantes `POWER_PELLET_SCORE = 50`, `FRIGHTENED_FRAMES = 360`, `EATEN_GHOST_SCORE = 200`.
   - `createGame`: contar tiles `2` y `4` en `dotsRemaining`; añadir `frightened: 0`.
   - `movePacman`: comer `4` suma 50, descuenta el contador y activa `game.frightened`.
   - `update`: decrementar `frightened`; `resetPositions` lo pone a 0.

3. **Huida y fantasmas comestibles (`src/js/game.js`)**
   - `getGhostTarget`: si `game.frightened > 0`, devolver el punto opuesto a Pac-Man (salvo si está en la casa).
   - Colisión: en modo asustado sumar 200 y devolver ese fantasma a su `GHOST_STARTS`; si no, comportamiento actual.

4. **Render (`src/js/render.js`)**
   - `drawDots`: dibujar los tiles `4` con radio 6.
   - `draw`: usar azul `#2121de` para todos los fantasmas mientras `game.frightened > 0`.

## Criterios de aceptación

- [ ] Al iniciar se ven 4 pellets más grandes en `(1,1)`, `(26,1)`, `(1,29)` y `(26,29)`.
- [ ] Comer un pellet suma 50, lo borra del tablero y descuenta de `dotsRemaining`.
- [ ] Al comer un pellet los fantasmas fuera de la casa se vuelven azules y huyen durante ~360 frames; después recuperan color y comportamiento.
- [ ] Tocar un fantasma azul suma 200 y lo devuelve a su celda inicial en la casa, sin quitar vidas.
- [ ] Comer otro pellet reinicia el contador del modo asustado.
- [ ] El nivel solo se gana cuando no quedan dots ni pellets.
- [ ] Se conservan personalidades, salida escalonada, puerta de un solo sentido, túnel, alineación y tamaño del canvas.
