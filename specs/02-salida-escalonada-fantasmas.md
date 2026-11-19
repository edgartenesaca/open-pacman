# 02 — Salida escalonada de los fantasmas

**Estado:** Aprobado
**Objetivo:** Al iniciar la partida, los 4 fantasmas aparecen alineados horizontalmente y salen de la casa uno por uno, con aproximadamente un segundo entre cada salida.

## Contexto actual

- `GHOST_STARTS` en `src/js/maze.js` coloca a los 4 fantasmas en dos filas (`y = 13` y `y = 14`).
- `update` en `src/js/game.js` mueve a todos los fantasmas en cada frame, así que salen de la casa casi al mismo tiempo.
- El motor es por frames: velocidades en celdas/frame (`0.1`, `0.125`) y decisiones solo con el actor alineado a una celda.
- La casa interior abarca `x ∈ [11..16]`, `y ∈ [13..15]`; la puerta está en `y = 12`, `x ∈ [13,14]`.

## Alcance

### Incluye

- `GHOST_STARTS` en línea recta horizontal: misma `y`, cuatro `x` consecutivas dentro de la casa.
- Reloj de ronda (`game.clock`) que empieza en 0 y avanza un frame por actualización.
- Cada fantasma permanece quieto hasta que le toca: `index * GHOST_RELEASE_FRAMES <= game.clock`; después se mueve con normalidad.
- Reinicio del reloj en `resetPositions`, para que tras perder una vida la fila y la salida escalonada se repitan.

### Fuera de alcance

- Cambiar velocidades, personalidades del spec 01 o el tamaño del canvas.
- Migrar el motor a tiempo real (delta time): se mantiene el modelo por frames.
- Animaciones o efectos visuales de aparición.
- Cambios en `main.js`, `render.js` o `index.html`.

## Decisiones

- **Base del tiempo:** frames. `GHOST_RELEASE_FRAMES = 60` equivale a ~1 segundo a 60 fps, igual que el resto del motor (las velocidades también son por frame).
- **Orden de salida:** izquierda a derecha según `GHOST_STARTS` (`hunter`, `ambusher`, `patrol`, `shy`). El `hunter` arranca en el primer frame.
- **Después de morir:** la salida escalonada se repite, porque `resetPositions` pone `game.clock = 0`.

## Plan de implementación

1. **Fila horizontal (`src/js/maze.js`)**
   - `GHOST_STARTS`: `(12,14) hunter`, `(13,14) ambusher`, `(14,14) patrol`, `(15,14) shy`.
   - Ajustar el comentario para indicar que el orden del arreglo define el turno de salida.

2. **Turnos de salida (`src/js/game.js`)**
   - Añadir la constante `GHOST_RELEASE_FRAMES = 60`.
   - En `createGame`, añadir `clock: 0` al estado de la partida.
   - En `update`, incrementar `game.clock` y mover solo los fantasmas liberados; los que esperan conservan su celda de la fila.
   - En `resetPositions`, reiniciar `game.clock = 0`.

## Criterios de aceptación

- [ ] Al empezar, los 4 fantasmas se ven alineados en la misma fila horizontal, sin solaparse.
- [ ] El `hunter` arranca de inmediato; cada uno de los otros tres empieza a moverse ~60 frames después del anterior.
- [ ] Ningún fantasma se mueve antes de su turno; los que esperan quedan quietos en su celda.
- [ ] Los 4 salen por la puerta y no vuelven a entrar (comportamiento del spec 01 intacto).
- [ ] Al perder una vida, los fantasmas vuelven a la fila y repiten la salida escalonada.
- [ ] Se mantiene la alineación de celdas, el cruce por el túnel y el tamaño del canvas.
