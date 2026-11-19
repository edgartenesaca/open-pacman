// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames
const GHOST_SPEED = 0.1;    // 1/10 celda/frame
const GHOST_RELEASE_FRAMES = 60; // espera entre salidas (~1s a 60 fps)

// Casa de los fantasmas y su salida al pasillo superior (celda sobre la puerta).
// Incluye la fila de la puerta (y = 12) para que no oscilen bajo ella.
const PEN = { minX: 11, maxX: 16, minY: 12, maxY: 15 };
const PEN_EXIT = { x: 13, y: 11 };
const AMBUSH_LEAD = 4; // celdas que el emboscador se adelanta a Pacman
const PATROL_LEAD = 2; // celdas de pivote para el flanqueo
const SHY_RADIUS = 8;  // distancia a la que el timido deja de perseguir
const SHY_CORNER = { x: 1, y: 29 };

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let dots = 0;
  for ( const row of grid ) for ( const v of row ) if ( v === 2 ) dots++;

  return {
    state: 'start',
    score: 0,
    lives: 3,
    dotsRemaining: dots,
    clock: 0,
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g ) => ( {
      x: g.x,
      y: g.y,
      dir: 'up',
      speed: GHOST_SPEED,
      kind: g.kind,
    } ) ),
  };
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman: bloqueado por pared (1) y puerta (3)
//   ghost:  bloqueado solo por pared (1)
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 && actor === 'pacman' ) return true;
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  // La puerta solo se cruza hacia arriba: los fantasmas salen, no vuelven a entrar.
  if ( actor === 'ghost' && dir === 'down' && grid[ ty ] && grid[ ty ][ tx ] === 3 ) return false;
  return !isWall( grid, tx, ty, actor );
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    // Comer dot.
    if ( grid[ p.y ][ p.x ] === 2 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += 10;
      game.dotsRemaining--;
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

function manhattan( ax, ay, bx, by ) {
  return Math.abs( ax - bx ) + Math.abs( ay - by );
}

// Celda 'distance' celdas delante de Pacman, en su direccion actual.
// Puede caer fuera del laberinto: solo se usa como heuristica de distancia.
function cellAhead( pacman, distance ) {
  const d = DIRS[ pacman.dir ];
  return {
    x: Math.round( pacman.x ) + d.x * distance,
    y: Math.round( pacman.y ) + d.y * distance,
  };
}

function inPen( g ) {
  const x = Math.round( g.x );
  const y = Math.round( g.y );
  return x >= PEN.minX && x <= PEN.maxX && y >= PEN.minY && y <= PEN.maxY;
}

// Celda que cada personalidad intenta alcanzar.
function getGhostTarget( game, g ) {
  // Dentro de la casa el unico objetivo es salir por la puerta.
  if ( inPen( g ) ) return PEN_EXIT;

  const p = game.pacman;
  const px = Math.round( p.x );
  const py = Math.round( p.y );

  if ( g.kind === 'ambusher' ) return cellAhead( p, AMBUSH_LEAD );

  if ( g.kind === 'patrol' ) {
    const hunter = game.ghosts.find( ( o ) => o.kind === 'hunter' );
    if ( !hunter ) return { x: px, y: py };
    // Punto reflejado del hunter respecto al pivote delante de Pacman.
    const pivot = cellAhead( p, PATROL_LEAD );
    return {
      x: pivot.x * 2 - Math.round( hunter.x ),
      y: pivot.y * 2 - Math.round( hunter.y ),
    };
  }

  const gx = Math.round( g.x );
  const gy = Math.round( g.y );
  if ( g.kind === 'shy' && manhattan( gx, gy, px, py ) <= SHY_RADIUS ) return SHY_CORNER;

  // hunter (persecucion directa) y fallback para tipos desconocidos.
  return { x: px, y: py };
}

// Direccion valida que mas acerca al fantasma a la celda objetivo.
function pickBestDir( g, choices, targetX, targetY ) {
  let best = choices[ 0 ];
  let bestDist = Infinity;
  for ( const dir of choices ) {
    const d = DIRS[ dir ];
    const dist = manhattan( g.x + d.x, g.y + d.y, targetX, targetY );
    if ( dist < bestDist ) {
      bestDist = dist;
      best = dir;
    }
  }
  return best;
}

function decideGhost( game, g ) {
  const grid = game.grid;

  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  // Sin salida (callejon): permitir el giro de 180.
  const choices = options.length ? options : [ OPPOSITE[ g.dir ] ];

  const target = getGhostTarget( game, g );
  g.dir = pickBestDir( g, choices, target.x, target.y );
}

function moveGhost( game, g ) {
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );
    decideGhost( game, g );
    if ( !canMove( grid, g.x, g.y, g.dir, 'ghost' ) ) return;
  }

  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.clock = 0; // rearma la salida escalonada
  game.ghosts.forEach( ( g, i ) => {
    g.x = GHOST_STARTS[ i ].x;
    g.y = GHOST_STARTS[ i ].y;
    g.dir = 'up';
  } );
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game ) {
  game.clock++;
  movePacman( game );
  game.ghosts.forEach( ( g, i ) => {
    // Los que esperan su turno siguen quietos en la fila de salida.
    if ( i * GHOST_RELEASE_FRAMES <= game.clock ) moveGhost( game, g );
  } );

  for ( const g of game.ghosts ) {
    if ( collides( game.pacman, g ) ) {
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.dotsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
