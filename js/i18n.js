// Localization: English, Bangla, Korean. Every UI string lives here;
// elements with data-i18n="key" get their textContent set on languageStore
// change. Elements needing an attribute (placeholder, aria-label) use
// data-i18n-attr="attrName:key".

const TRANSLATIONS = {
  en: {
    appTitle: 'Sholo Guti',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Off',
    newGame: 'New Game',
    navHome: 'Home',

    homeTagline: 'A traditional Bangladeshi strategy game — 16 pieces, one board, no mercy.',
    homeTutorialTitle: 'Tutorial',
    homeTutorialDesc: 'Learn the board, the moves, and the rules — with a practice board.',
    homeLocalTitle: 'Local Play',
    homeLocalDesc: 'Two players, one device, pass-and-play.',
    homeAiTitle: 'vs AI',
    homeAiDesc: 'Play against the computer. Pick your difficulty.',
    homeCharTitle: 'Character Design',
    homeCharDesc: 'Customize the look of your pieces.',

    turnPrefix: "turn",
    redTurn: "Red's turn",
    greenTurn: "Green's turn",
    redMovesFirst: 'Red moves first',
    greenMovesFirst: 'Green moves first',
    winElimination: '{winner} wins — all enemy pieces captured!',
    winStalemate: '{winner} wins — {loser} has no legal move!',
    drawRepetition: 'Draw — position repeated three times',
    drawFiftyMove: 'Draw — 50 moves without a capture',
    red: 'Red',
    green: 'Green',
    backToHome: '← Back to Home',
    endTurn: 'End Turn (stop capturing)',

    aiDifficultyLabel: 'Difficulty',
    aiEasy: 'Easy',
    aiMedium: 'Medium',
    aiHard: 'Hard',
    aiYourSide: 'You play',
    startMatch: 'Start Match',
    playAgain: 'Play Again',

    tutorialIntro: 'Sholo Guti ("Sixteen Pieces") is played on a 37-point board — a 5×5 grid with a 6-point triangle fused to the top and bottom. Each player starts with 16 pieces.',
    tutorialSetupTitle: '1. Setup',
    tutorialSetupBody: 'Red fills the top triangle and the first two rows of the grid (16 pieces). Green mirrors this on the bottom. The middle row starts empty. Who moves first is decided by a coin toss.',
    tutorialMoveTitle: '2. Moving',
    tutorialMoveBody: 'On your turn, move one piece one step along a drawn line — forward, backward, sideways, or diagonally — to an adjacent empty point. You can only follow lines that are actually drawn on the board.',
    tutorialCaptureTitle: '3. Capturing',
    tutorialCaptureBody: 'Jump over an adjacent enemy piece, in a straight line, to land on the empty point directly beyond it. The jumped piece is removed. Capturing is optional — even when a capture is available, you may choose a simple move instead.',
    tutorialChainTitle: '4. Chain Captures',
    tutorialChainBody: 'If, after landing, the same piece can capture again immediately, you may continue jumping with it — or stop and end your turn right there. The choice is always yours, at every step.',
    tutorialWinTitle: '5. Winning',
    tutorialWinBody: 'Capture all 16 of your opponent’s pieces, or leave them with no legal move, and you win. (Digital-only addition: the game is a draw after 50 moves with no capture, or if the same position repeats three times.)',
    tutorialTryTitle: 'Try it yourself',
    tutorialTryBody: 'This mini board is a free sandbox — click a piece, then click a highlighted destination. Try a simple move, then reset and try the capture scenario.',
    tutorialTryMove: 'Practice: a simple move',
    tutorialTryCapture: 'Practice: a capture',
    resetPractice: 'Reset',

    charDesignTitle: 'Character Design',
    charDesignBody: 'Pick a visual style for each side’s pieces. Purely cosmetic — the rules never change.',
    charRedLabel: 'Red pieces',
    charGreenLabel: 'Green pieces',
    skinClassic: 'Classic',
    skinRing: 'Terracotta Ring',
    skinMedallion: 'Sun Medallion',
    skinCustomPhoto: 'Custom Photo',
    applyAndPlay: 'Apply & Play Local',
    applyAndPlayAI: 'Apply & Play vs AI',
  },

  bn: {
    appTitle: 'ষোল গুটি',
    soundOn: 'শব্দ: চালু',
    soundOff: 'শব্দ: বন্ধ',
    newGame: 'নতুন খেলা',
    navHome: 'হোম',

    homeTagline: 'ঐতিহ্যবাহী বাংলাদেশী কৌশলের খেলা — ১৬টি গুটি, একটি বোর্ড, কোনো ছাড় নেই।',
    homeTutorialTitle: 'শিক্ষা',
    homeTutorialDesc: 'বোর্ড, চাল এবং নিয়ম শিখুন — অনুশীলন বোর্ড সহ।',
    homeLocalTitle: 'স্থানীয় খেলা',
    homeLocalDesc: 'দুই খেলোয়াড়, একটি ডিভাইস, পালা করে খেলুন।',
    homeAiTitle: 'কম্পিউটারের বিরুদ্ধে',
    homeAiDesc: 'কম্পিউটারের বিরুদ্ধে খেলুন। কঠিনতা বেছে নিন।',
    homeCharTitle: 'চরিত্র ডিজাইন',
    homeCharDesc: 'আপনার গুটির চেহারা কাস্টমাইজ করুন।',

    redTurn: 'লালের পালা',
    greenTurn: 'সবুজের পালা',
    redMovesFirst: 'লাল প্রথমে চাল দেবে',
    greenMovesFirst: 'সবুজ প্রথমে চাল দেবে',
    winElimination: '{winner} জয়ী — সমস্ত প্রতিপক্ষের গুটি ধরা হয়েছে!',
    winStalemate: '{winner} জয়ী — {loser}-এর কোনো বৈধ চাল নেই!',
    drawRepetition: 'ড্র — অবস্থান তিনবার পুনরাবৃত্তি হয়েছে',
    drawFiftyMove: 'ড্র — ৫০ চালে কোনো ধরা হয়নি',
    red: 'লাল',
    green: 'সবুজ',
    backToHome: '← হোমে ফিরুন',
    endTurn: 'পালা শেষ করুন (ধরা বন্ধ করুন)',

    aiDifficultyLabel: 'কঠিনতা',
    aiEasy: 'সহজ',
    aiMedium: 'মাঝারি',
    aiHard: 'কঠিন',
    aiYourSide: 'আপনি খেলবেন',
    startMatch: 'খেলা শুরু করুন',
    playAgain: 'আবার খেলুন',

    tutorialIntro: 'ষোল গুটি খেলা হয় ৩৭টি বিন্দুর বোর্ডে — ৫×৫ গ্রিডের উপরে ও নিচে ৬টি বিন্দুর ত্রিভুজ যুক্ত। প্রতিটি খেলোয়াড়ের ১৬টি গুটি দিয়ে শুরু হয়।',
    tutorialSetupTitle: '১. প্রস্তুতি',
    tutorialSetupBody: 'লাল উপরের ত্রিভুজ এবং গ্রিডের প্রথম দুই সারি পূর্ণ করে (১৬টি গুটি)। সবুজ নিচে একই রকম সাজায়। মাঝের সারি খালি থাকে। কে প্রথমে চাল দেবে তা টস করে ঠিক হয়।',
    tutorialMoveTitle: '২. চাল দেওয়া',
    tutorialMoveBody: 'আপনার পালায়, একটি গুটি আঁকা রেখা বরাবর এক ধাপ সরান — সামনে, পেছনে, পাশে বা কোণাকুণি — পাশের খালি বিন্দুতে। শুধুমাত্র বোর্ডে সত্যিই আঁকা রেখা অনুসরণ করা যাবে।',
    tutorialCaptureTitle: '৩. গুটি ধরা',
    tutorialCaptureBody: 'পাশের প্রতিপক্ষের গুটির উপর দিয়ে সরলরেখায় লাফ দিয়ে তার ঠিক পরের খালি বিন্দুতে নামুন। ডিঙানো গুটিটি সরিয়ে ফেলা হয়। গুটি ধরা ঐচ্ছিক — ধরার সুযোগ থাকলেও আপনি চাইলে সাধারণ চাল দিতে পারেন।',
    tutorialChainTitle: '৪. পরপর ধরা',
    tutorialChainBody: 'নামার পর একই গুটি দিয়ে আবার ধরা সম্ভব হলে, আপনি চাইলে সেই গুটি দিয়ে ধরা চালিয়ে যেতে পারেন, অথবা সেখানেই থেমে আপনার পালা শেষ করতে পারেন — সিদ্ধান্ত সম্পূর্ণ আপনার।',
    tutorialWinTitle: '৫. জয়',
    tutorialWinBody: 'প্রতিপক্ষের ১৬টি গুটিই ধরে ফেললে, অথবা তার কোনো বৈধ চাল না থাকলে আপনি জয়ী হবেন। (ডিজিটাল সংযোজন: ৫০ চালে কোনো ধরা না হলে বা একই অবস্থান তিনবার পুনরাবৃত্তি হলে খেলা ড্র হয়।)',
    tutorialTryTitle: 'নিজে চেষ্টা করুন',
    tutorialTryBody: 'এই ছোট বোর্ডটি একটি মুক্ত অনুশীলন — একটি গুটিতে ক্লিক করুন, তারপর একটি হাইলাইট করা গন্তব্যে ক্লিক করুন।',
    tutorialTryMove: 'অনুশীলন: একটি সাধারণ চাল',
    tutorialTryCapture: 'অনুশীলন: একটি ধরা',
    resetPractice: 'রিসেট',

    charDesignTitle: 'চরিত্র ডিজাইন',
    charDesignBody: 'প্রতিটি পক্ষের গুটির জন্য একটি ভিজ্যুয়াল স্টাইল বেছে নিন। সম্পূর্ণ প্রসাধনী — নিয়ম কখনো পরিবর্তন হয় না।',
    charRedLabel: 'লাল গুটি',
    charGreenLabel: 'সবুজ গুটি',
    skinClassic: 'ক্লাসিক',
    skinRing: 'টেরাকোটা রিং',
    skinMedallion: 'সূর্য পদক',
    skinCustomPhoto: 'নিজের ছবি',
    applyAndPlay: 'প্রয়োগ করুন ও খেলুন',
    applyAndPlayAI: 'প্রয়োগ করুন ও কম্পিউটারের সাথে খেলুন',
  },

  ko: {
    appTitle: '숄로 구티',
    soundOn: '소리: 켜짐',
    soundOff: '소리: 꺼짐',
    newGame: '새 게임',
    navHome: '홈',

    homeTagline: '전통 방글라데시 전략 게임 — 말 16개, 보드 하나, 자비는 없다.',
    homeTutorialTitle: '튜토리얼',
    homeTutorialDesc: '보드, 이동, 규칙을 연습 보드와 함께 배워보세요.',
    homeLocalTitle: '로컬 대전',
    homeLocalDesc: '한 기기로 두 명이 번갈아 플레이합니다.',
    homeAiTitle: 'AI 대전',
    homeAiDesc: '컴퓨터와 대결하세요. 난이도를 선택할 수 있습니다.',
    homeCharTitle: '캐릭터 디자인',
    homeCharDesc: '말의 외형을 커스터마이즈하세요.',

    redTurn: '빨강 차례',
    greenTurn: '초록 차례',
    redMovesFirst: '빨강이 먼저 시작합니다',
    greenMovesFirst: '초록이 먼저 시작합니다',
    winElimination: '{winner} 승리 — 상대 말을 모두 잡았습니다!',
    winStalemate: '{winner} 승리 — {loser}이(가) 둘 수 있는 수가 없습니다!',
    drawRepetition: '무승부 — 같은 상황이 세 번 반복되었습니다',
    drawFiftyMove: '무승부 — 50수 동안 잡은 말이 없습니다',
    red: '빨강',
    green: '초록',
    backToHome: '← 홈으로',
    endTurn: '턴 종료 (그만 잡기)',

    aiDifficultyLabel: '난이도',
    aiEasy: '쉬움',
    aiMedium: '보통',
    aiHard: '어려움',
    aiYourSide: '내가 플레이할 편',
    startMatch: '대전 시작',
    playAgain: '다시 하기',

    tutorialIntro: '숄로 구티("16개의 말")는 37개의 점으로 이루어진 보드에서 진행됩니다 — 5×5 격자에 위아래로 6개 점짜리 삼각형이 붙어 있습니다. 각 플레이어는 말 16개로 시작합니다.',
    tutorialSetupTitle: '1. 배치',
    tutorialSetupBody: '빨강은 위쪽 삼각형과 격자의 첫 두 줄을 채웁니다(말 16개). 초록은 아래쪽에 대칭으로 배치됩니다. 가운데 줄은 비어 있습니다. 누가 먼저 둘지는 동전 던지기로 정합니다.',
    tutorialMoveTitle: '2. 이동',
    tutorialMoveBody: '자기 차례에 말 하나를 그려진 선을 따라 한 칸 — 앞, 뒤, 옆, 또는 대각선으로 — 인접한 빈 점으로 옮깁니다. 실제로 보드에 그려진 선만 따라갈 수 있습니다.',
    tutorialCaptureTitle: '3. 잡기',
    tutorialCaptureBody: '인접한 상대 말을 직선으로 뛰어넘어 바로 그 너머의 빈 점에 착지하면 상대 말이 제거됩니다. 잡기는 선택 사항입니다 — 잡을 수 있는 수가 있어도 원한다면 일반 이동을 선택할 수 있습니다.',
    tutorialChainTitle: '4. 연속 잡기',
    tutorialChainBody: '착지 후 같은 말로 즉시 또 잡을 수 있다면, 계속 잡아도 되고 그 자리에서 멈춰 턴을 끝내도 됩니다 — 선택은 항상 당신의 몫입니다.',
    tutorialWinTitle: '5. 승리',
    tutorialWinBody: '상대의 말 16개를 모두 잡거나 상대가 둘 수 있는 수가 없게 만들면 승리합니다. (디지털 전용 규칙: 50수 동안 잡은 말이 없거나 같은 상황이 세 번 반복되면 무승부입니다.)',
    tutorialTryTitle: '직접 해보세요',
    tutorialTryBody: '이 작은 보드는 자유 연습 공간입니다 — 말을 클릭한 다음 강조 표시된 목적지를 클릭하세요.',
    tutorialTryMove: '연습: 일반 이동',
    tutorialTryCapture: '연습: 잡기',
    resetPractice: '초기화',

    charDesignTitle: '캐릭터 디자인',
    charDesignBody: '각 편의 말에 어울리는 스타일을 골라보세요. 순전히 장식용이며 규칙은 절대 바뀌지 않습니다.',
    charRedLabel: '빨강 말',
    charGreenLabel: '초록 말',
    skinClassic: '클래식',
    skinRing: '테라코타 링',
    skinMedallion: '태양 메달',
    skinCustomPhoto: '내 사진',
    applyAndPlay: '적용하고 로컬 플레이',
    applyAndPlayAI: '적용하고 AI와 대전',
  },
};

const languageStore = {
  current: 'en',
  listeners: [],
  set(lang) {
    if (!TRANSLATIONS[lang]) return;
    this.current = lang;
    this.listeners.forEach(fn => fn(lang));
    applyI18n(lang);
  },
  onChange(fn) {
    this.listeners.push(fn);
  },
  t(key, vars) {
    let str = (TRANSLATIONS[this.current] && TRANSLATIONS[this.current][key]) || TRANSLATIONS.en[key] || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v);
    }
    return str;
  },
};

function applyI18n(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = languageStore.t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const [attr, key] = el.getAttribute('data-i18n-attr').split(':');
    el.setAttribute(attr, languageStore.t(key));
  });
  document.documentElement.lang = lang;
}
