// Sholo Guti rules engine — pure functions over a board state, no DOM.
// State shape: { board: {nodeId: 'red'|'green'|null}, currentPlayer, noCaptureCount, positionHistory }
//
// House rule (owner-directed deviation from the traditional ruleset):
// capturing is entirely OPTIONAL. A player may make a simple move even when
// a capture is available, and once a capture starts, may stop after any hop
// even if another capture is immediately available for that piece — free
// choice at every step, not just among branches.

function nodesOwnedBy(board, player) {
  return Object.keys(board).filter(n => board[n] === player);
}

function getSimpleMoves(board, player) {
  const moves = [];
  for (const from of nodesOwnedBy(board, player)) {
    for (const to of BOARD_ADJACENCY[from]) {
      if (board[to] === null) moves.push({ from, to });
    }
  }
  return moves;
}

// Single-step captures available right now for the piece at `node`.
function getImmediateCaptures(board, node) {
  const player = board[node];
  if (!player) return [];
  const opponent = otherPlayer(player);
  const overMap = JUMP_MAP[node] || {};
  const results = [];
  for (const over of Object.keys(overMap)) {
    const to = overMap[over];
    if (board[over] === opponent && board[to] === null) {
      results.push({ over, to });
    }
  }
  return results;
}

// Whether the piece at `node` has ANY legal move at all (capture or simple).
function pieceIsMovable(board, node) {
  if (getImmediateCaptures(board, node).length > 0) return true;
  return BOARD_ADJACENCY[node].some(n => board[n] === null);
}

// Whether `player` has any legal move anywhere on the board. Cheaper than
// full getLegalMoves — used for stalemate detection, which only needs a
// yes/no answer, not the full (possibly large) set of capture sequences.
function hasAnyLegalMove(board, player) {
  if (getSimpleMoves(board, player).length > 0) return true;
  return nodesOwnedBy(board, player).some(n => getImmediateCaptures(board, n).length > 0);
}

// Enumerates every POSSIBLE capture sequence starting at `startNode` — i.e.
// every node visited while recursively chaining jumps, not just maximal
// leaves, because a player may voluntarily stop after any hop. A sequence
// of length k (k captures) therefore also implies valid sequences of length
// 1..k-1 ending at each intermediate landing square; all are recorded.
//
// `limit`/`counter` bound the search: real board positions never come
// close to the default (Infinity, i.e. exact/unbounded — verified by
// self-play testing), but the AI's minimax explores many hypothetical
// future positions that need not be realistic, and a handful of those can
// have pathologically large branching capture trees. Internal search calls
// pass a modest limit so one exotic node can't stall the whole search;
// this never affects the real game, only the AI's own lookahead quality.
function enumerateCaptureSequences(board, startNode, limit = Infinity, counter = { count: 0 }) {
  const player = board[startNode];
  const opponent = otherPlayer(player);
  const results = [];

  function recurse(currentNode, currentBoard, path, captured) {
    if (counter.count >= limit) return;
    if (captured.length > 0) {
      results.push({ from: startNode, path: [...path], captured: [...captured], finalBoard: currentBoard });
      counter.count++;
    }
    const overMap = JUMP_MAP[currentNode] || {};
    for (const over of Object.keys(overMap)) {
      if (counter.count >= limit) return;
      const to = overMap[over];
      if (currentBoard[over] === opponent && currentBoard[to] === null) {
        const nextBoard = { ...currentBoard, [currentNode]: null, [over]: null, [to]: player };
        recurse(to, nextBoard, [...path, to], [...captured, over]);
      }
    }
  }

  recurse(startNode, board, [startNode], []);
  return results;
}

function getAllCaptureMoves(board, player, limit = Infinity) {
  const sequences = [];
  const counter = { count: 0 };
  for (const node of nodesOwnedBy(board, player)) {
    if (counter.count >= limit) break;
    sequences.push(...enumerateCaptureSequences(board, node, limit, counter));
  }
  return sequences;
}

// All legal turns for `player`: every capture sequence (including partial,
// voluntarily-stopped ones) plus every simple move. Nothing is mandatory —
// this is the full menu of choices, used by the AI's search. The
// interactive UI does NOT use this (see interaction.js), since it only
// ever needs one hop or one adjacency check at a time.
function getLegalMoves(board, player, limit = Infinity) {
  const captures = getAllCaptureMoves(board, player, limit);
  const simples = getSimpleMoves(board, player);
  return { moves: [...captures, ...simples] };
}

function applySimpleMove(board, move) {
  const next = { ...board };
  next[move.to] = next[move.from];
  next[move.from] = null;
  return next;
}

function positionSignature(board, player) {
  const cells = Object.keys(board).sort().map(k => board[k] ? board[k][0] : '.').join('');
  return `${cells}:${player}`;
}

function checkGameEnd(state) {
  const redCount = nodesOwnedBy(state.board, 'red').length;
  const greenCount = nodesOwnedBy(state.board, 'green').length;
  if (redCount === 0) return { over: true, winner: 'green', reason: 'elimination' };
  if (greenCount === 0) return { over: true, winner: 'red', reason: 'elimination' };

  if (!hasAnyLegalMove(state.board, state.currentPlayer)) {
    return { over: true, winner: otherPlayer(state.currentPlayer), reason: 'stalemate' };
  }

  if (state.noCaptureCount >= 50) {
    return { over: true, winner: null, reason: 'draw-50-move' };
  }
  const sig = positionSignature(state.board, state.currentPlayer);
  const occurrences = state.positionHistory.filter(s => s === sig).length;
  if (occurrences >= 3) {
    return { over: true, winner: null, reason: 'draw-repetition' };
  }

  return { over: false };
}
