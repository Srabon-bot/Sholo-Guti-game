// Mutable game state: board occupancy + whose turn it is + history needed
// for draw detection. Board data/graph lives in board-data.js; move/capture
// legality lives in rules-engine.js. This module owns the live state object
// and the single mutation entry point (applyTurn).

function createInitialState() {
  const board = {};
  for (const nodeId of Object.keys(BOARD_NODES)) {
    board[nodeId] = startingOwner(nodeId);
  }

  // First move is decided by a coin toss (owner-confirmed rule),
  // not a fixed "Red always starts".
  const currentPlayer = Math.random() < 0.5 ? 'red' : 'green';

  return {
    board,
    currentPlayer,
    noCaptureCount: 0,
    positionHistory: [],
    result: null, // set to {winner, reason} once the game ends
  };
}

function otherPlayer(player) {
  return player === 'red' ? 'green' : 'red';
}

// Applies one complete turn (a simple move OR a full mandatory capture
// chain) to the state in place, updates draw-detection bookkeeping, turn
// order, and game-end result. `turn` is either { from, to } (simple move)
// or a capture chain object from rules-engine ({ from, path, captured }).
function applyTurn(state, turn) {
  if (turn.captured) {
    state.board = turn.finalBoard;
    state.noCaptureCount = 0;
  } else {
    state.board = applySimpleMove(state.board, turn);
    state.noCaptureCount += 1;
  }

  state.currentPlayer = otherPlayer(state.currentPlayer);
  state.positionHistory.push(positionSignature(state.board, state.currentPlayer));

  const end = checkGameEnd(state);
  if (end.over) state.result = { winner: end.winner, reason: end.reason };
  return end;
}
