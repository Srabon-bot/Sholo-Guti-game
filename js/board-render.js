// Renders the Sholo Guti board (graph from board-data.js) as an SVG.
// Purely presentational: given a game state + a `ui` description (what's
// selected, what's highlighted), it draws the board. All legality logic
// lives in rules-engine.js / interaction.js.

const SVG_NS = 'http://www.w3.org/2000/svg';
const NODE_RADIUS = 9;
const PIECE_RADIUS = 9;
const PADDING = 40;
let clipIdCounter = 0;

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function computeViewBox() {
  const xs = Object.values(BOARD_NODES).map(n => n.x);
  const ys = Object.values(BOARD_NODES).map(n => n.y);
  const minX = Math.min(...xs) - PADDING;
  const maxX = Math.max(...xs) + PADDING;
  const minY = Math.min(...ys) - PADDING;
  const maxY = Math.max(...ys) + PADDING;
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

// ui = {
//   selected: nodeId|null,
//   canCaptureFrom: Set<nodeId>   (pieces with a capture available right now — informational, not mandatory),
//   movableFrom: Set<nodeId>      (pieces selectable this turn, capture or simple),
//   legalTo: Set<nodeId>          (destinations for the currently selected piece),
//   trapped: Set<nodeId>          (tutorial-only: pieces with no legal move at all, for the stalemate demo),
//   pieceSkin: { red: className, green: className } (optional, for Character Design)
//   pieceImages: { red: dataURL|null, green: dataURL|null } (custom photo, when skin is 'skin-custom')
// }
function renderBoard(container, state, ui = {}) {
  const selected = ui.selected || null;
  const canCaptureFrom = ui.canCaptureFrom || new Set();
  const movableFrom = ui.movableFrom || new Set();
  const legalTo = ui.legalTo || new Set();
  const trapped = ui.trapped || new Set();
  const pieceSkin = ui.pieceSkin || {};
  const pieceImages = ui.pieceImages || {};

  container.innerHTML = '';
  const vb = computeViewBox();
  const svg = svgEl('svg', {
    viewBox: `${vb.minX} ${vb.minY} ${vb.width} ${vb.height}`,
    class: 'board-svg',
    role: 'img',
    'aria-label': 'Sholo Guti board',
  });

  // Unique per render call: two board <svg>s (e.g. Local Play + vs AI) can
  // both be present in the DOM at once (hidden, not removed), so a fixed
  // id here would collide across trees and break cross-SVG clip-path
  // references in some browsers (image renders unclipped — square, not
  // circular — on whichever board didn't "win" the id lookup).
  const photoClipId = `piece-photo-clip-${clipIdCounter++}`;
  const defs = svgEl('defs', {});
  const clipPath = svgEl('clipPath', { id: photoClipId, clipPathUnits: 'objectBoundingBox' });
  clipPath.appendChild(svgEl('circle', { cx: 0.5, cy: 0.5, r: 0.5 }));
  defs.appendChild(clipPath);
  svg.appendChild(defs);

  const boardBg = svgEl('rect', {
    x: vb.minX, y: vb.minY, width: vb.width, height: vb.height,
    class: 'board-bg',
    rx: 18,
  });
  svg.appendChild(boardBg);

  const edgesGroup = svgEl('g', { class: 'board-edges' });
  for (const [a, b] of BOARD_EDGES) {
    const na = BOARD_NODES[a];
    const nb = BOARD_NODES[b];
    edgesGroup.appendChild(svgEl('line', {
      x1: na.x, y1: na.y, x2: nb.x, y2: nb.y,
      class: 'board-edge',
    }));
  }
  svg.appendChild(edgesGroup);

  const nodesGroup = svgEl('g', { class: 'board-nodes' });
  const piecesGroup = svgEl('g', { class: 'board-pieces' });
  const highlightGroup = svgEl('g', { class: 'board-highlights' });

  for (const [id, pos] of Object.entries(BOARD_NODES)) {
    const point = svgEl('circle', {
      cx: pos.x, cy: pos.y, r: NODE_RADIUS,
      class: 'board-point',
      'data-node': id,
      'data-role': 'point',
    });
    nodesGroup.appendChild(point);

    const owner = state.board[id];
    if (owner) {
      const skin = pieceSkin[owner] || 'skin-classic';
      const groupClasses = ['piece', `piece-${owner}`, skin];
      if (canCaptureFrom.has(id)) groupClasses.push('piece-can-capture');
      if (movableFrom.has(id)) groupClasses.push('piece-movable');
      if (selected === id) groupClasses.push('piece-selected');
      if (trapped.has(id)) groupClasses.push('piece-trapped');

      const pieceGroup = svgEl('g', {
        class: groupClasses.join(' '),
        'data-node': id,
        'data-owner': owner,
        'data-role': 'piece',
      });
      pieceGroup.appendChild(svgEl('circle', {
        cx: pos.x, cy: pos.y, r: PIECE_RADIUS, class: 'piece-base',
      }));
      if (skin === 'skin-ring') {
        pieceGroup.appendChild(svgEl('circle', {
          cx: pos.x, cy: pos.y, r: PIECE_RADIUS - 3.5, class: 'piece-ring', fill: 'none',
        }));
      } else if (skin === 'skin-medallion') {
        pieceGroup.appendChild(svgEl('circle', {
          cx: pos.x, cy: pos.y, r: PIECE_RADIUS * 0.42, class: 'piece-medallion',
        }));
      } else if (skin === 'skin-custom' && pieceImages[owner]) {
        const r = PIECE_RADIUS - 2;
        pieceGroup.appendChild(svgEl('image', {
          x: pos.x - r, y: pos.y - r, width: r * 2, height: r * 2,
          href: pieceImages[owner],
          'clip-path': `url(#${photoClipId})`,
          preserveAspectRatio: 'xMidYMid slice',
        }));
      }
      piecesGroup.appendChild(pieceGroup);
    }

    if (legalTo.has(id)) {
      highlightGroup.appendChild(svgEl('circle', {
        cx: pos.x, cy: pos.y, r: NODE_RADIUS + 4,
        class: 'legal-dest',
        'data-node': id,
        'data-role': 'dest',
      }));
    }
  }

  svg.appendChild(nodesGroup);
  svg.appendChild(piecesGroup);
  svg.appendChild(highlightGroup);
  container.appendChild(svg);
}

// Animates one hop of a piece already shown by the last renderBoard() call —
// used to slow the AI down to a human-visible speed instead of teleporting.
// Clones the real (already-styled) piece element and slides the clone from
// `from` to `to` via the SVG `transform` attribute (plain rAF easing, not a
// CSS transition — CSS transform units on SVG elements are unreliable across
// browsers, while the transform *attribute* uses the same user-space units
// as cx/cy). `over`, if given, is the jumped piece's node id: it plays a
// quick shrink-and-fade "captured" animation timed with the hop.
// Resolves once the animation finishes (or immediately if the expected DOM
// isn't there, e.g. a mid-flight teardown — never blocks the caller).
function animatePieceTravel(container, { from, to, over, duration = 380 }) {
  return new Promise((resolve) => {
    const svg = container.querySelector('svg');
    const fromPos = BOARD_NODES[from];
    const toPos = BOARD_NODES[to];
    const fromEl = svg && svg.querySelector(`[data-role="piece"][data-node="${from}"]`);
    if (!svg || !fromPos || !toPos || !fromEl) { resolve(); return; }

    if (over) {
      const overEl = svg.querySelector(`[data-role="piece"][data-node="${over}"]`);
      if (overEl) overEl.classList.add('piece-vanishing');
    }

    fromEl.style.visibility = 'hidden';

    const clone = fromEl.cloneNode(true);
    clone.classList.remove('piece-can-capture', 'piece-movable', 'piece-selected');
    clone.classList.add('piece-traveling');
    clone.style.visibility = 'visible';
    svg.querySelector('.board-pieces').appendChild(clone);

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const start = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function step(now) {
      if (!clone.isConnected) { resolve(); return; } // torn down mid-flight
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutCubic(t);
      clone.setAttribute('transform', `translate(${dx * e}, ${dy * e})`);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        clone.remove();
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}
