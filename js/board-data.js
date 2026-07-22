// Sholo Guti board graph — 37 nodes, 76 edges.
// Extracted directly from the owner's reference board image (board.png):
// a 5x5 Alquerque grid (rows C-G) with a 6-point triangle fused to the
// top (rows A-B) and bottom (rows H-I) edges, converging into the
// square's center-top hub (C3) and center-bottom hub (G3).
//
// Coordinate system: square grid spacing = 40 units (col1..col5 = x 0..160,
// row C..G = y 0..160). Triangle rows sit above/below at the proportions
// measured from the reference image (not an arbitrary guess).

const BOARD_NODES = {
  // Top triangle
  A1: { x: 32, y: -50 }, A2: { x: 80, y: -50 }, A3: { x: 128, y: -50 },
  B1: { x: 55, y: -24 }, B2: { x: 80, y: -24 }, B3: { x: 105, y: -24 },

  // 5x5 square
  C1: { x: 0, y: 0 },   C2: { x: 40, y: 0 },   C3: { x: 80, y: 0 },   C4: { x: 120, y: 0 },   C5: { x: 160, y: 0 },
  D1: { x: 0, y: 40 },  D2: { x: 40, y: 40 },  D3: { x: 80, y: 40 },  D4: { x: 120, y: 40 },  D5: { x: 160, y: 40 },
  E1: { x: 0, y: 80 },  E2: { x: 40, y: 80 },  E3: { x: 80, y: 80 },  E4: { x: 120, y: 80 },  E5: { x: 160, y: 80 },
  F1: { x: 0, y: 120 }, F2: { x: 40, y: 120 }, F3: { x: 80, y: 120 }, F4: { x: 120, y: 120 }, F5: { x: 160, y: 120 },
  G1: { x: 0, y: 160 }, G2: { x: 40, y: 160 }, G3: { x: 80, y: 160 }, G4: { x: 120, y: 160 }, G5: { x: 160, y: 160 },

  // Bottom triangle
  H1: { x: 55, y: 184 }, H2: { x: 80, y: 184 }, H3: { x: 105, y: 184 },
  I1: { x: 32, y: 210 }, I2: { x: 80, y: 210 }, I3: { x: 128, y: 210 },
};

const BOARD_EDGES = [
  // --- Top triangle (10 edges) ---
  ['A1', 'A2'], ['A2', 'A3'],
  ['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'],
  ['B1', 'B2'], ['B2', 'B3'],
  ['B1', 'C3'], ['B2', 'C3'], ['B3', 'C3'],

  // --- Square: horizontal (20 edges) ---
  ['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'],
  ['D1', 'D2'], ['D2', 'D3'], ['D3', 'D4'], ['D4', 'D5'],
  ['E1', 'E2'], ['E2', 'E3'], ['E3', 'E4'], ['E4', 'E5'],
  ['F1', 'F2'], ['F2', 'F3'], ['F3', 'F4'], ['F4', 'F5'],
  ['G1', 'G2'], ['G2', 'G3'], ['G3', 'G4'], ['G4', 'G5'],

  // --- Square: vertical (20 edges) ---
  ['C1', 'D1'], ['C2', 'D2'], ['C3', 'D3'], ['C4', 'D4'], ['C5', 'D5'],
  ['D1', 'E1'], ['D2', 'E2'], ['D3', 'E3'], ['D4', 'E4'], ['D5', 'E5'],
  ['E1', 'F1'], ['E2', 'F2'], ['E3', 'F3'], ['E4', 'F4'], ['E5', 'F5'],
  ['F1', 'G1'], ['F2', 'G2'], ['F3', 'G3'], ['F4', 'G4'], ['F5', 'G5'],

  // --- Square: diagonals — exactly one per cell, alternating checkerboard-style (16 edges) ---
  ['C1', 'D2'], ['C3', 'D2'], ['C3', 'D4'], ['C5', 'D4'],
  ['D2', 'E1'], ['D2', 'E3'], ['D4', 'E3'], ['D4', 'E5'],
  ['E1', 'F2'], ['E3', 'F2'], ['E3', 'F4'], ['E5', 'F4'],
  ['F2', 'G1'], ['F2', 'G3'], ['F4', 'G3'], ['F4', 'G5'],

  // --- Bottom triangle (10 edges, mirrors the top) ---
  ['G3', 'H1'], ['G3', 'H2'], ['G3', 'H3'],
  ['H1', 'H2'], ['H2', 'H3'],
  ['H1', 'I1'], ['H2', 'I2'], ['H3', 'I3'],
  ['I1', 'I2'], ['I2', 'I3'],
];

// Starting layout (Section 4 of the PRD):
// Red fills rows A, B, C, D (16 pieces). Green fills rows F, G, H, I (16 pieces).
// Row E starts empty.
const RED_START_ROWS = ['A', 'B', 'C', 'D'];
const GREEN_START_ROWS = ['F', 'G', 'H', 'I'];

function buildAdjacency(edges) {
  const adj = {};
  for (const id of Object.keys(BOARD_NODES)) adj[id] = [];
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return adj;
}

function startingOwner(nodeId) {
  const row = nodeId[0];
  if (RED_START_ROWS.includes(row)) return 'red';
  if (GREEN_START_ROWS.includes(row)) return 'green';
  return null;
}

const BOARD_ADJACENCY = buildAdjacency(BOARD_EDGES);

// Capture map: JUMP_MAP[A][B] = C means a piece at A can jump over an
// adjacent enemy at B and land at C, IF A-B-C are collinear (a real
// straight line drawn on the board, not just "2 grid steps away").
// Computed geometrically from node coordinates rather than assumed,
// since the triangle regions have irregular (non-grid) spacing.
function buildJumpMap() {
  const map = {};
  const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
  const cross = (u, v) => u.x * v.y - u.y * v.x;
  const dot = (u, v) => u.x * v.x + u.y * v.y;

  for (const a of Object.keys(BOARD_NODES)) {
    for (const b of BOARD_ADJACENCY[a]) {
      const u = sub(BOARD_NODES[b], BOARD_NODES[a]);
      for (const c of BOARD_ADJACENCY[b]) {
        if (c === a) continue;
        const v = sub(BOARD_NODES[c], BOARD_NODES[b]);
        if (cross(u, v) === 0 && dot(u, v) > 0) {
          if (!map[a]) map[a] = {};
          map[a][b] = c;
        }
      }
    }
  }
  return map;
}

const JUMP_MAP = buildJumpMap();

// Owner-requested extension (confirmed against the reference board): where
// the triangle meets the square, the hub point (C3 at the top, G3 at the
// bottom) sits at a slight geometric bend relative to the triangle's outer
// points (B1/B3, H1/H3) — strict collinearity therefore misses B1-C3-D4,
// B3-C3-D2, H1-G3-F4, H3-G3-F2 as capture lines, even though players read
// them as one straight line on the rendered board. Added explicitly (both
// directions, matching how every other capture line already works both
// ways) rather than nudging node coordinates, so the board's visual layout
// stays exactly as measured from the reference image.
function addJumpMapEntry(map, from, over, to) {
  if (!map[from]) map[from] = {};
  map[from][over] = to;
}
addJumpMapEntry(JUMP_MAP, 'B1', 'C3', 'D4');
addJumpMapEntry(JUMP_MAP, 'D4', 'C3', 'B1');
addJumpMapEntry(JUMP_MAP, 'B3', 'C3', 'D2');
addJumpMapEntry(JUMP_MAP, 'D2', 'C3', 'B3');
addJumpMapEntry(JUMP_MAP, 'H1', 'G3', 'F4');
addJumpMapEntry(JUMP_MAP, 'F4', 'G3', 'H1');
addJumpMapEntry(JUMP_MAP, 'H3', 'G3', 'F2');
addJumpMapEntry(JUMP_MAP, 'F2', 'G3', 'H3');
