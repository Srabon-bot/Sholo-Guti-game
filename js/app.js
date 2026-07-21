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
let activeIndicatorEl = null;
let activeEndTurnBtn = null;

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

function updateTurnIndicator(indicatorEl, match) {
  indicatorEl.className = 'turn-indicator';
  if (match.state.result) {
    indicatorEl.textContent = resultMessage(match.state.result);
    if (match.state.result.winner) indicatorEl.classList.add(`turn-${match.state.result.winner}`);
    return;
  }
  const cp = match.state.currentPlayer;
  indicatorEl.textContent = languageStore.t(cp === 'red' ? 'redTurn' : 'greenTurn');
  indicatorEl.classList.add(`turn-${cp}`);
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

function makeEventHandler(indicatorEl, endTurnBtn) {
  return (evt) => {
    if (evt.type === 'move') soundStore.move();
    if (evt.type === 'capture') soundStore.capture();
    if (evt.type === 'turn' || evt.type === 'gameover') updateTurnIndicator(indicatorEl, activeMatch);
    if (evt.type === 'gameover') showWinOverlay(evt.result);
    updateEndTurnButton(endTurnBtn, activeMatch);
  };
}

// ---------- Local Play ----------

function startLocalMatch() {
  teardownActiveMatch();
  hideWinOverlay();
  const container = document.getElementById('local-board-container');
  const indicator = document.getElementById('local-turn-indicator');
  const endTurnBtn = document.getElementById('local-end-turn-btn');
  activeIndicatorEl = indicator;
  activeEndTurnBtn = endTurnBtn;
  activeMatch = new MatchController(container, {
    pieceSkin: appState.pieceSkin,
    pieceImages: appState.customPieceImage,
    onEvent: makeEventHandler(indicator, endTurnBtn),
  });
  updateTurnIndicator(indicator, activeMatch);
  updateEndTurnButton(endTurnBtn, activeMatch);
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
  const indicator = document.getElementById('ai-turn-indicator');
  const endTurnBtn = document.getElementById('ai-end-turn-btn');
  activeIndicatorEl = indicator;
  activeEndTurnBtn = endTurnBtn;
  const aiPlayer = otherPlayer(appState.aiHumanSide);
  activeMatch = new MatchController(container, {
    pieceSkin: appState.pieceSkin,
    pieceImages: appState.customPieceImage,
    aiPlayer,
    aiDifficulty: appState.aiDifficulty,
    onEvent: makeEventHandler(indicator, endTurnBtn),
  });
  updateTurnIndicator(indicator, activeMatch);
  updateEndTurnButton(endTurnBtn, activeMatch);
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

  // Win overlay
  document.getElementById('win-play-again-btn').addEventListener('click', () => {
    hideWinOverlay();
    const onLocal = !document.getElementById('screen-local').classList.contains('hidden');
    if (onLocal) startLocalMatch(); else startAIMatch();
  });
  document.getElementById('win-home-btn').addEventListener('click', goHome);

  languageStore.onChange(() => {
    if (activeMatch && activeIndicatorEl) updateTurnIndicator(activeIndicatorEl, activeMatch);
    const overlay = document.getElementById('win-overlay');
    if (!overlay.classList.contains('hidden') && activeMatch && activeMatch.state.result) {
      document.getElementById('win-message').textContent = resultMessage(activeMatch.state.result);
    }
  });

  applyI18n('en');
  showScreen('screen-home');
});
