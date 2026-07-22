// App shell: screen routing, nav bar (sound/language/new game), home page,
// vs-AI setup, character design, tutorial wiring, and the win/draw overlay.
// Owns the one piece of cross-screen state (chosen piece skins) and the
// currently-active MatchController, if any.

const appState = {
  pieceSkin: { red: 'skin-classic', green: 'skin-classic' },
  customPieceImage: { red: null, green: null }, // data URLs, when pieceSkin[owner] === 'skin-custom'
  aiDifficulty: 'medium',
  aiHumanSide: 'red',
};

let activeMatch = null;
let tutorialSandbox = null;
let activeTurnPopupEl = null;
let activeTurnStatusEl = null;
let activeEndTurnBtn = null;
let turnPopupTimer = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function teardownActiveMatch() {
  if (activeMatch) {
    activeMatch.destroy();
    activeMatch = null;
  }
}

function goHome() {
  teardownActiveMatch();
  if (tutorialSandbox) { tutorialSandbox.destroy(); tutorialSandbox = null; }
  hideWinOverlay();
  showScreen('screen-home');
}

// ---------- Turn indicator / win overlay (shared by Local + vs AI) ----------

function resultMessage(result) {
  if (!result.winner) {
    return result.reason === 'draw-repetition'
      ? languageStore.t('drawRepetition')
      : languageStore.t('drawFiftyMove');
  }
  const winnerName = languageStore.t(result.winner);
  if (result.reason === 'stalemate') {
    const loserName = languageStore.t(result.winner === 'red' ? 'green' : 'red');
    return languageStore.t('winStalemate', { winner: winnerName, loser: loserName });
  }
  return languageStore.t('winElimination', { winner: winnerName });
}

// Transient "whose turn" toast — replaces the old always-on bar so that
// vertical space (freed by moving the piece tracker to the board's sides)
// goes to the board instead. Game-end messaging still goes through the
// win overlay below, so this only ever needs to announce a turn change.
function showTurnPopup(popupEl, match) {
  if (!popupEl || match.state.result) return;
  clearTimeout(turnPopupTimer);
  const cp = match.state.currentPlayer;
  popupEl.textContent = languageStore.t(cp === 'red' ? 'redTurn' : 'greenTurn');
  popupEl.className = `turn-popup show turn-${cp}`;
  turnPopupTimer = setTimeout(() => {
    popupEl.classList.remove('show');
  }, 1500);
}

// On a language switch, only refresh text if the popup happens to be
// visible right now — don't resurrect one that already faded out.
function refreshVisibleTurnPopup(popupEl, match) {
  if (!popupEl || !popupEl.classList.contains('show') || match.state.result) return;
  const cp = match.state.currentPlayer;
  popupEl.textContent = languageStore.t(cp === 'red' ? 'redTurn' : 'greenTurn');
}

// Persistent companion to the popup, pinned just above the footer — unlike
// the popup this never fades, so whose turn it is stays visible at a
// glance even long after the toast has gone.
function updateTurnStatus(statusEl, match) {
  if (!statusEl || match.state.result) return;
  const cp = match.state.currentPlayer;
  statusEl.textContent = languageStore.t(cp === 'red' ? 'redTurn' : 'greenTurn');
  statusEl.className = `turn-status turn-${cp}`;
}

function showWinOverlay(result) {
  const overlay = document.getElementById('win-overlay');
  document.getElementById('win-message').textContent = resultMessage(result);
  overlay.classList.remove('hidden');
  if (result.winner) {
    soundStore.win();
    launchConfetti();
  } else {
    soundStore.draw();
  }
}

function hideWinOverlay() {
  document.getElementById('win-overlay').classList.add('hidden');
}

function updateEndTurnButton(btnEl, match) {
  if (!btnEl) return;
  btnEl.classList.toggle('hidden', !match.hasActiveChain());
}

// ---------- Piece tracker (remaining beads + captured tally) ----------
// Purely presentational: reads nodesOwnedBy() off the live match state.
// Beads are built once per match start and then have a class toggled per
// update, so the CSS transition on `.bead` actually animates instead of
// snapping (a fresh element each render wouldn't transition).

function buildBeadsRow(el) {
  el.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const bead = document.createElement('span');
    bead.className = 'bead';
    el.appendChild(bead);
  }
}

function setupPieceTracker(prefix) {
  const refs = {
    beadsRed: document.getElementById(`${prefix}-beads-red`),
    beadsGreen: document.getElementById(`${prefix}-beads-green`),
    capturedRed: document.getElementById(`${prefix}-captured-red`),
    capturedGreen: document.getElementById(`${prefix}-captured-green`),
  };
  buildBeadsRow(refs.beadsRed);
  buildBeadsRow(refs.beadsGreen);
  return refs;
}

function bumpNumber(el, value) {
  if (el.textContent === String(value)) return;
  el.textContent = value;
  el.classList.remove('bump');
  void el.offsetWidth; // restart the animation
  el.classList.add('bump');
}

function updatePieceTracker(tracker, match) {
  if (!tracker || !match) return;
  const board = match.state.board;
  const redLeft = nodesOwnedBy(board, 'red').length;
  const greenLeft = nodesOwnedBy(board, 'green').length;

  const beadsRed = tracker.beadsRed.children;
  const beadsGreen = tracker.beadsGreen.children;
  for (let i = 0; i < 16; i++) {
    beadsRed[i].classList.toggle('captured', i >= redLeft);
    beadsGreen[i].classList.toggle('captured', i >= greenLeft);
  }

  bumpNumber(tracker.capturedRed, 16 - greenLeft);
  bumpNumber(tracker.capturedGreen, 16 - redLeft);
}

function makeEventHandler(popupEl, statusEl, endTurnBtn, tracker) {
  return (evt) => {
    if (evt.type === 'move') soundStore.move();
    if (evt.type === 'capture') soundStore.capture();
    if (evt.type === 'turn') {
      showTurnPopup(popupEl, activeMatch);
      updateTurnStatus(statusEl, activeMatch);
    }
    if (evt.type === 'gameover') showWinOverlay(evt.result);
    updateEndTurnButton(endTurnBtn, activeMatch);
    updatePieceTracker(tracker, activeMatch);
  };
}

// ---------- Local Play ----------

function startLocalMatch() {
  teardownActiveMatch();
  hideWinOverlay();
  const container = document.getElementById('local-board-container');
  const popup = document.getElementById('local-turn-popup');
  const status = document.getElementById('local-turn-status');
  const endTurnBtn = document.getElementById('local-end-turn-btn');
  const tracker = setupPieceTracker('local');
  activeTurnPopupEl = popup;
  activeTurnStatusEl = status;
  activeEndTurnBtn = endTurnBtn;
  activeMatch = new MatchController(container, {
    pieceSkin: appState.pieceSkin,
    pieceImages: appState.customPieceImage,
    onEvent: makeEventHandler(popup, status, endTurnBtn, tracker),
  });
  showTurnPopup(popup, activeMatch);
  updateTurnStatus(status, activeMatch);
  updateEndTurnButton(endTurnBtn, activeMatch);
  updatePieceTracker(tracker, activeMatch);
}

// ---------- vs AI ----------

function showAISetup() {
  document.getElementById('ai-setup-panel').classList.remove('hidden');
  document.getElementById('ai-board-wrap').classList.add('hidden');
}

function startAIMatch() {
  teardownActiveMatch();
  hideWinOverlay();
  document.getElementById('ai-setup-panel').classList.add('hidden');
  document.getElementById('ai-board-wrap').classList.remove('hidden');

  const container = document.getElementById('ai-board-container');
  const popup = document.getElementById('ai-turn-popup');
  const status = document.getElementById('ai-turn-status');
  const endTurnBtn = document.getElementById('ai-end-turn-btn');
  const tracker = setupPieceTracker('ai');
  activeTurnPopupEl = popup;
  activeTurnStatusEl = status;
  activeEndTurnBtn = endTurnBtn;
  const aiPlayer = otherPlayer(appState.aiHumanSide);
  activeMatch = new MatchController(container, {
    pieceSkin: appState.pieceSkin,
    pieceImages: appState.customPieceImage,
    aiPlayer,
    aiDifficulty: appState.aiDifficulty,
    onEvent: makeEventHandler(popup, status, endTurnBtn, tracker),
  });
  showTurnPopup(popup, activeMatch);
  updateTurnStatus(status, activeMatch);
  updateEndTurnButton(endTurnBtn, activeMatch);
  updatePieceTracker(tracker, activeMatch);
}

function wireChoiceGroup(groupEl, onPick) {
  groupEl.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      groupEl.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onPick(btn.dataset.value);
      soundStore.click();
    });
  });
}

// ---------- Tutorial ----------

function initTutorialScreen() {
  const container = document.getElementById('tutorial-board-container');
  const msgEl = document.getElementById('tutorial-practice-msg');
  tutorialSandbox = new TutorialSandbox(container, (kind) => {
    msgEl.textContent = kind === 'move'
      ? '✓ ' + languageStore.t('tutorialTryMove')
      : '✓ ' + languageStore.t('tutorialTryCapture');
  });
  tutorialSandbox.loadScenario('move');
  msgEl.textContent = '';
}

// ---------- Character Design ----------

const SKIN_IDS = ['skin-classic', 'skin-ring', 'skin-medallion', 'skin-custom'];
const SKIN_LABEL_KEYS = {
  'skin-classic': 'skinClassic',
  'skin-ring': 'skinRing',
  'skin-medallion': 'skinMedallion',
  'skin-custom': 'skinCustomPhoto',
};

function skinPreviewSVG(owner, skin, customImageUrl) {
  const fill = owner === 'red' ? '#b3311f' : '#3f6b2e';
  const stroke = owner === 'red' ? '#7a1c10' : '#294a1c';

  if (skin === 'skin-custom') {
    if (customImageUrl) {
      const clipId = `chardesign-preview-clip-${owner}`;
      return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs><clipPath id="${clipId}"><circle cx="20" cy="20" r="16"/></clipPath></defs>
        <circle cx="20" cy="20" r="15" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        <image x="5" y="5" width="30" height="30" href="${customImageUrl}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="15" fill="none" stroke="${stroke}" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M13 16.5 h2.6 l1.8-2.2 h5.2 l1.8 2.2 h2.6 v9.7 h-14 z" fill="none" stroke="${fill}" stroke-width="1.6"/>
      <circle cx="20" cy="21.3" r="3" fill="none" stroke="${fill}" stroke-width="1.6"/>
    </svg>`;
  }

  let inner = '';
  if (skin === 'skin-ring') inner = `<circle cx="20" cy="20" r="11" fill="none" stroke="rgba(255,240,210,0.75)" stroke-width="2.2"/>`;
  if (skin === 'skin-medallion') inner = `<circle cx="20" cy="20" r="7" fill="rgba(255,240,210,0.9)"/>`;
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="15" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    ${inner}
  </svg>`;
}

function buildSkinPicker(owner, containerId) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  for (const skin of SKIN_IDS) {
    const btn = document.createElement('button');
    btn.className = 'skin-option' + (appState.pieceSkin[owner] === skin ? ' active' : '');
    btn.innerHTML = skinPreviewSVG(owner, skin, appState.customPieceImage[owner]) + `<span data-i18n="${SKIN_LABEL_KEYS[skin]}"></span>`;

    if (skin === 'skin-custom') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.className = 'hidden';
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          appState.customPieceImage[owner] = reader.result;
          appState.pieceSkin[owner] = 'skin-custom';
          buildSkinPicker(owner, containerId);
          soundStore.click();
        };
        reader.readAsDataURL(file);
      });
      btn.appendChild(fileInput);
      btn.addEventListener('click', () => {
        // No photo yet, or re-clicking the already-selected tile: (re)upload.
        // Otherwise, a click just selects the previously uploaded photo.
        const alreadyActive = appState.pieceSkin[owner] === 'skin-custom';
        if (!appState.customPieceImage[owner] || alreadyActive) {
          fileInput.click();
          return;
        }
        appState.pieceSkin[owner] = skin;
        el.querySelectorAll('.skin-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        soundStore.click();
      });
    } else {
      btn.addEventListener('click', () => {
        appState.pieceSkin[owner] = skin;
        el.querySelectorAll('.skin-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        soundStore.click();
      });
    }

    el.appendChild(btn);
    applyI18n(languageStore.current);
  }
}

// ---------- Boot ----------

document.addEventListener('DOMContentLoaded', () => {
  // Nav bar
  document.getElementById('sound-toggle').addEventListener('click', (e) => {
    const on = soundStore.toggle();
    e.currentTarget.setAttribute('data-i18n', on ? 'soundOn' : 'soundOff');
    applyI18n(languageStore.current);
    if (on) soundStore.click();
  });
  document.getElementById('lang-select').addEventListener('change', (e) => {
    languageStore.set(e.target.value);
  });
  document.getElementById('new-game-btn').addEventListener('click', goHome);
  document.getElementById('topbar-title-btn').addEventListener('click', goHome);

  // Home cards
  document.getElementById('card-tutorial').addEventListener('click', () => {
    showScreen('screen-tutorial');
    initTutorialScreen();
  });
  document.getElementById('card-local').addEventListener('click', () => {
    showScreen('screen-local');
    startLocalMatch();
  });
  document.getElementById('card-ai').addEventListener('click', () => {
    showScreen('screen-vsai');
    showAISetup();
  });
  document.getElementById('card-chardesign').addEventListener('click', () => {
    showScreen('screen-chardesign');
    buildSkinPicker('red', 'skin-picker-red');
    buildSkinPicker('green', 'skin-picker-green');
  });

  // Back links
  document.querySelectorAll('.back-home-link').forEach(btn => btn.addEventListener('click', goHome));

  // Tutorial practice controls
  document.getElementById('practice-move-btn').addEventListener('click', () => {
    tutorialSandbox.loadScenario('move');
    document.getElementById('tutorial-practice-msg').textContent = '';
  });
  document.getElementById('practice-capture-btn').addEventListener('click', () => {
    tutorialSandbox.loadScenario('capture');
    document.getElementById('tutorial-practice-msg').textContent = '';
  });
  document.getElementById('practice-reset-btn').addEventListener('click', () => {
    tutorialSandbox.loadScenario(tutorialSandbox.kind);
    document.getElementById('tutorial-practice-msg').textContent = '';
  });

  // vs AI setup controls
  wireChoiceGroup(document.getElementById('ai-difficulty-group'), (v) => { appState.aiDifficulty = v; });
  wireChoiceGroup(document.getElementById('ai-side-group'), (v) => { appState.aiHumanSide = v; });
  document.getElementById('start-match-btn').addEventListener('click', startAIMatch);

  // End Turn (stop an optional capture chain early)
  document.getElementById('local-end-turn-btn').addEventListener('click', () => {
    if (activeMatch) activeMatch.endTurn();
  });
  document.getElementById('ai-end-turn-btn').addEventListener('click', () => {
    if (activeMatch) activeMatch.endTurn();
  });

  // Character design
  document.getElementById('chardesign-play-btn').addEventListener('click', () => {
    showScreen('screen-local');
    startLocalMatch();
  });
  document.getElementById('chardesign-play-ai-btn').addEventListener('click', () => {
    showScreen('screen-vsai');
    showAISetup();
  });

  // Win overlay
  document.getElementById('win-play-again-btn').addEventListener('click', () => {
    hideWinOverlay();
    const onLocal = !document.getElementById('screen-local').classList.contains('hidden');
    if (onLocal) startLocalMatch(); else startAIMatch();
  });
  document.getElementById('win-home-btn').addEventListener('click', goHome);

  languageStore.onChange(() => {
    if (activeMatch && activeTurnPopupEl) refreshVisibleTurnPopup(activeTurnPopupEl, activeMatch);
    if (activeMatch && activeTurnStatusEl) updateTurnStatus(activeTurnStatusEl, activeMatch);
    const overlay = document.getElementById('win-overlay');
    if (!overlay.classList.contains('hidden') && activeMatch && activeMatch.state.result) {
      document.getElementById('win-message').textContent = resultMessage(activeMatch.state.result);
    }
  });

  applyI18n('en');
  showScreen('screen-home');
});
