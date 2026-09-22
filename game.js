/* =========================================================
   PENALTYMIND
   Jeu + statistiques + entraînement + défis quotidiens + XP
========================================================= */


/* ================= ELEMENTS ================= */

const mainMenu = document.getElementById("mainMenu");
const gameScreen = document.getElementById("gameScreen");
const trainingScreen = document.getElementById("trainingScreen");
const dailyScreen = document.getElementById("dailyScreen");
const statsScreen = document.getElementById("statsScreen");
const settingsScreen = document.getElementById("settingsScreen");

const playButton = document.getElementById("playButton");
const trainingButton = document.getElementById("trainingButton");
const dailyButton = document.getElementById("dailyButton");
const statsButton = document.getElementById("statsButton");
const settingsButton = document.getElementById("settingsButton");

const backToMenuButton = document.getElementById("backToMenuButton");

const goal = document.getElementById("goal");
const keeper = document.getElementById("keeper");
const ball = document.getElementById("ball");
const player = document.getElementById("player");
const targetDot = document.getElementById("targetDot");

const message = document.getElementById("message");
const needle = document.getElementById("needle");

const shotNumber = document.getElementById("shotNumber");
const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");

const result = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const finalScore = document.getElementById("finalScore");
const bestScore = document.getElementById("bestScore");

const restartButton = document.getElementById("restartButton");
const resultMenuButton = document.getElementById("resultMenuButton");

const soundButton = document.getElementById("soundButton");
const settingsSoundButton = document.getElementById("settingsSoundButton");
const resetStatsButton = document.getElementById("resetStatsButton");

const startTrainingButton = document.getElementById("startTrainingButton");

const menuBestScore = document.getElementById("menuBestScore");

const statBestScore = document.getElementById("statBestScore");
const statGoals = document.getElementById("statGoals");
const statSaves = document.getElementById("statSaves");
const statCombo = document.getElementById("statCombo");
const statShots = document.getElementById("statShots");
const statAccuracy = document.getElementById("statAccuracy");

const trainingGoalsElement = document.getElementById("trainingGoals");
const trainingShotsElement = document.getElementById("trainingShots");

const menuLevel = document.getElementById("menuLevel");
const menuXP = document.getElementById("menuXP");
const menuXPNeeded = document.getElementById("menuXPNeeded");
const menuXPFill = document.getElementById("menuXPFill");

const dailyChallengesList = document.getElementById("dailyChallengesList");
const dailyCompletedCount = document.getElementById("dailyCompletedCount");


/* ================= ECRANS ================= */

const allScreens = [
  mainMenu,
  gameScreen,
  trainingScreen,
  dailyScreen,
  statsScreen,
  settingsScreen
];

function showScreen(screen) {

  allScreens.forEach(currentScreen => {
    currentScreen.classList.add("hidden-screen");
  });

  screen.classList.remove("hidden-screen");
}


/* ================= JEU ================= */

const MAX_SHOTS = 10;

const state = {
  shot: 1,
  score: 0,
  combo: 0,
  locked: true,
  aim: null,
  power: 0.5,
  training: false,
  best: Number(localStorage.getItem("penaltyMindBest") || 0)
};


/* ================= STATS ================= */

const stats = {
  goals: Number(localStorage.getItem("penaltyMindGoals") || 0),
  saves: Number(localStorage.getItem("penaltyMindSaves") || 0),
  shots: Number(localStorage.getItem("penaltyMindShots") || 0),
  bestCombo: Number(localStorage.getItem("penaltyMindBestCombo") || 0),

  trainingGoals: Number(
    localStorage.getItem("penaltyMindTrainingGoals") || 0
  ),

  trainingShots: Number(
    localStorage.getItem("penaltyMindTrainingShots") || 0
  )
};


function saveStats() {

  localStorage.setItem(
    "penaltyMindBest",
    state.best
  );

  localStorage.setItem(
    "penaltyMindGoals",
    stats.goals
  );

  localStorage.setItem(
    "penaltyMindSaves",
    stats.saves
  );

  localStorage.setItem(
    "penaltyMindShots",
    stats.shots
  );

  localStorage.setItem(
    "penaltyMindBestCombo",
    stats.bestCombo
  );

  localStorage.setItem(
    "penaltyMindTrainingGoals",
    stats.trainingGoals
  );

  localStorage.setItem(
    "penaltyMindTrainingShots",
    stats.trainingShots
}


/* =========================================================
   XP / NIVEAUX
========================================================= */

let progression = {
  xp: Number(localStorage.getItem("penaltyMindXP") || 0),
  level: Number(localStorage.getItem("penaltyMindLevel") || 1)
};


function xpNeeded(level) {
  return level * 500;
}


function saveProgression() {

  localStorage.setItem(
    "penaltyMindXP",
    progression.xp
  );

  localStorage.setItem(
    "penaltyMindLevel",
    progression.level
  );
}


function addXP(amount) {

  let leveledUp = false;

  progression.xp += amount;

  while (progression.xp >= xpNeeded(progression.level)) {

    progression.xp -= xpNeeded(progression.level);

    progression.level++;

    leveledUp = true;
  }

  saveProgression();
  updateProgressionUI();

  if (leveledUp) {
    playLevelUpSound();

    if (!state.locked && !state.training) {
      message.textContent =
        `🆙 Niveau ${progression.level} atteint !`;

      message.className = "message goal-message";
    }
  }
}


function updateProgressionUI() {

  const needed = xpNeeded(progression.level);

  menuLevel.textContent = progression.level;
  menuXP.textContent = progression.xp;
  menuXPNeeded.textContent = needed;

  const percentage =
    Math.min(100, (progression.xp / needed) * 100);

  menuXPFill.style.width = `${percentage}%`;
}


/* =========================================================
   DATE / DEFIS QUOTIDIENS
========================================================= */

function getTodayKey() {

  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}


function hashDate(dateString) {

  let hash = 0;

  for (let i = 0; i < dateString.length; i++) {

    hash =
      (hash * 31 + dateString.charCodeAt(i)) >>> 0;
  }

  return hash;
}


function seededRandom(seed) {

  return () => {

    seed =
      (seed * 1664525 + 1013904223) >>> 0;

    return seed / 4294967296;
  };
}


function shuffleWithSeed(array, seed) {

  const random = seededRandom(seed);
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {

    const j = Math.floor(random() * (i + 1));

    [result[i], result[j]] =
      [result[j], result[i]];
  }

  return result;
}


/* ================= POOL DE DEFIS ================= */

const DAILY_CHALLENGE_POOL = [

  {
    id: "goals5",
    icon: "⚽",
    title: "Buteur",
    text: "Marque 5 buts",
    type: "goals",
    target: 5,
    xp: 100
  },

  {
    id: "goals10",
    icon: "🥅",
    title: "Finisseur",
    text: "Marque 10 buts",
    type: "goals",
    target: 10,
    xp: 180
  },

  {
    id: "shots15",
    icon: "🎯",
    title: "Tireur",
    text: "Effectue 15 tirs",
    type: "shots",
    target: 15,
    xp: 100
  },

  {
    id: "score1000",
    icon: "🏆",
    title: "Gros score",
    text: "Atteins 1 000 points",
    type: "score",
    target: 1000,
    xp: 150
  },

  {
    id: "combo4",
    icon: "🔥",
    title: "En feu",
    text: "Atteins un combo de 4",
    type: "bestCombo",
    target: 4,
    xp: 150
  },

  {
    id: "combo6",
    icon: "💥",
    title: "Imparable",
    text: "Atteins un combo de 6",
    type: "bestCombo",
    target: 6,
    xp: 220
  }
];


let dailyState = {
  date: getTodayKey(),
  goals: 0,
  shots: 0,
  score: 0,
  bestCombo: 0,
  completed: []
};


let dailyChallenges = [];


function saveDailyState() {

  localStorage.setItem(
    "penaltyMindDailyState",
    JSON.stringify(dailyState)
  );

  localStorage.setItem(
    "penaltyMindDailyChallenges",
    JSON.stringify(dailyChallenges)
  );
}


function loadDailyState() {

  const today = getTodayKey();

  let savedState = null;
  let savedChallenges = null;

  try {

    savedState =
      JSON.parse(
        localStorage.getItem(
          "penaltyMindDailyState"
        ) || "null"
      );

    savedChallenges =
      JSON.parse(
        localStorage.getItem(
          "penaltyMindDailyChallenges"
        ) || "null"
      );

  } catch (error) {

    savedState = null;
    savedChallenges = null;
  }


  if (
    !savedState ||
    savedState.date !== today ||
    !Array.isArray(savedState.completed)
  ) {

    dailyState = {
      date: today,
      goals: 0,
      shots: 0,
      score: 0,
      bestCombo: 0,
      completed: []
    };

    const seed = hashDate(today);

    dailyChallenges =
      shuffleWithSeed(
        DAILY_CHALLENGE_POOL,
        seed
      ).slice(0, 3);

    saveDailyState();

  } else {

    dailyState = savedState;

    if (
      Array.isArray(savedChallenges) &&
      savedChallenges.length === 3
    ) {

      dailyChallenges = savedChallenges;

    } else {

      const seed = hashDate(today);

      dailyChallenges =
        shuffleWithSeed(
          DAILY_CHALLENGE_POOL,
          seed
        ).slice(0, 3);

      saveDailyState();
    }
  }
}


function getChallengeProgress(challenge) {

  switch (challenge.type) {

    case "goals":
      return dailyState.goals;

    case "shots":
      return dailyState.shots;

    case "score":
      return dailyState.score;

    case "bestCombo":
      return dailyState.bestCombo;

    default:
      return 0;
  }
}


function updateDailyProgress() {

  let changed = false;

  dailyChallenges.forEach(challenge => {

    if (
      dailyState.completed.includes(
        challenge.id
      )
    ) {
      return;
    }

    const progress =
      getChallengeProgress(challenge);

    if (progress >= challenge.target) {

      dailyState.completed.push(
        challenge.id
      );

      addXP(challenge.xp);

      changed = true;
    }
  });


  saveDailyState();

  if (changed) {

    renderDailyChallenges();

    updateDailyMenuIndicator();
  }
}


function renderDailyChallenges() {

  dailyChallengesList.innerHTML = "";

  let completedCount = 0;

  dailyChallenges.forEach(challenge => {

    const progress =
      getChallengeProgress(challenge);

    const completed =
      dailyState.completed.includes(
        challenge.id
      );

    if (completed) {
      completedCount++;
    }

    const percentage =
      Math.min(
        100,
        (progress / challenge.target) * 100
      );

    const displayedProgress =
      Math.min(
        progress,
        challenge.target
      );

    const card =
      document.createElement("div");

    card.className =
      `daily-card${completed ? " completed" : ""}`;

    card.innerHTML = `

      <div class="daily-card-top">

        <div class="daily-icon">
          ${challenge.icon}
        </div>

        <div class="daily-info">

          <h3>
            ${challenge.title}
          </h3>

          <p>
            ${challenge.text}
          </p>

        </div>

        <div class="daily-xp">
          +${challenge.xp} XP
        </div>

      </div>

      <div class="daily-progress-text">

        <span>
          Progression
        </span>

        <span>
          ${displayedProgress} / ${challenge.target}
        </span>

      </div>

      <div class="daily-progress">

        <div
          class="daily-progress-fill"
          style="width:${percentage}%"
        ></div>

      </div>

      ${
        completed
          ? `<div class="daily-complete">
               ✓ Défi terminé
             </div>`
          : ""
      }

    `;

    dailyChallengesList.appendChild(card);
  });

  dailyCompletedCount.textContent =
    `${completedCount} / ${dailyChallenges.length}`;
}


function updateDailyMenuIndicator() {

  const completed =
    dailyState.completed.length;

  if (completed === 3) {

    dailyButton.textContent =
      "📅 Défis du jour ✓";

  } else {

    dailyButton.textContent =
      `📅 Défis du jour (${completed}/3)`;
  }
}


/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

let soundEnabled =
  localStorage.getItem("penaltyMindSound") !== "false";


function initAudio() {

  if (!soundEnabled) {
    return;
  }

  if (!audioContext) {

    audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();
  }

  if (
    audioContext.state ===
    "suspended"
  ) {

    audioContext.resume();
  }
}


function tone(
  frequency,
  duration,
  type = "sine",
  volume = 0.05
) {

  if (!soundEnabled) {
    return;
  }

  initAudio();

  if (!audioContext) {
    return;
  }

  const oscillator =
    audioContext.createOscillator();

  const gain =
    audioContext.createGain();

  oscillator.type = type;

  oscillator.frequency.value =
    frequency;

  gain.gain.setValueAtTime(
    volume,
    audioContext.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();

  oscillator.stop(
    audioContext.currentTime + duration
  );
}


function playKickSound() {

  tone(120, .08, "square", .04);
}


function playGoalSound() {

  tone(523, .12, "sine", .06);

  setTimeout(() => {
    tone(659, .12, "sine", .06);
  }, 90);

  setTimeout(() => {
    tone(784, .18, "sine", .06);
  }, 180);
}


function playSaveSound() {

  tone(170, .18, "sawtooth", .05);

  setTimeout(() => {
    tone(100, .2, "sawtooth", .04);
  }, 100);
}


function playWhistleSound() {

  tone(900, .12, "sine", .05);

  setTimeout(() => {
    tone(1200, .18, "sine", .05);
  }, 130);
}


function playLevelUpSound() {

  tone(523, .1, "sine", .05);

  setTimeout(() => {
    tone(659, .1, "sine", .05);
  }, 100);

  setTimeout(() => {
    tone(784, .1, "sine", .05);
  }, 200);

  setTimeout(() => {
    tone(1046, .25, "sine", .06);
  }, 300);
}


function updateSoundButtons() {

  const text =
    soundEnabled
      ? "🔊"
      : "🔇";

  soundButton.textContent = text;

  settingsSoundButton.textContent =
    soundEnabled
      ? "Activés"
      : "Désactivés";
}


function toggleSound() {

  soundEnabled = !soundEnabled;

  localStorage.setItem(
    "penaltyMindSound",
    soundEnabled
  );

  updateSoundButtons();

  if (soundEnabled) {
    initAudio();
    playKickSound();
  }
}


/* =========================================================
   NAVIGATION
========================================================= */

function showMenu() {

  state.training = false;
  state.locked = true;

  resetGameVisuals();

  showScreen(mainMenu);

  updateMenu();
}


function updateMenu() {

  menuBestScore.textContent =
    state.best;

  updateProgressionUI();
  updateDailyMenuIndicator();
}


playButton.addEventListener(
  "click",
  () => {

    initAudio();
    startClassicGame();
  }
);


trainingButton.addEventListener(
  "click",
  () => {

    updateTrainingScreen();

    showScreen(trainingScreen);
  }
);


dailyButton.addEventListener(
  "click",
  () => {

    renderDailyChallenges();

    showScreen(dailyScreen);
  }
);


statsButton.addEventListener(
  "click",
  () => {

    updateStatsScreen();

    showScreen(statsScreen);
  }
);


settingsButton.addEventListener(
  "click",
  () => {

    updateSoundButtons();

    showScreen(settingsScreen);
  }
);


document
  .querySelectorAll("[data-back-menu]")
  .forEach(button => {

    button.addEventListener(
      "click",
      showMenu
    );
  });


backToMenuButton.addEventListener(
  "click",
  showMenu
);


resultMenuButton.addEventListener(
  "click",
  showMenu
);


/* =========================================================
   JEU CLASSIQUE
========================================================= */

function startClassicGame() {

  state.training = false;
  state.shot = 1;
  state.score = 0;
  state.combo = 0;
  state.locked = false;
  state.aim = null;
  state.power = 0.5;

  result.classList.add(
    "hidden-result"
  );

  resetGameVisuals();

  message.textContent =
    "Vise la cage pour tirer ⚽";

  message.className =
    "message";

  document.getElementById(
    "gameSubtitle"
  ).textContent =
    "Vise la cage et trompe le gardien";

  updateGameUI();

  showScreen(gameScreen);

  playWhistleSound();
}


/* =========================================================
   PUISSANCE
========================================================= */

let meterTime = 0;


function animateMeter() {

  if (!state.locked) {

    meterTime += 0.04;

    state.power =
      (Math.sin(meterTime) + 1) / 2;

    needle.style.left =
      `${state.power * 100}%`;
  }

  requestAnimationFrame(
    animateMeter
  );
}


animateMeter();


/* =========================================================
   GARDIEN
========================================================= */

function randomKeeperDirection() {

  const directions = [
    "left",
    "center",
    "right"
  ];

  return directions[
    Math.floor(
      Math.random() *
      directions.length
    )
  ];
}


function getAimDirection(x) {

  if (x < 0.34) {
    return "left";
  }

  if (x > 0.66) {
    return "right";
  }

  return "center";
}


function resetKeeper() {

  keeper.classList.remove(
    "dive-left",
    "dive-center",
    "dive-right"
  );
}


function moveKeeper(direction) {

  resetKeeper();

  void keeper.offsetWidth;

  keeper.classList.add(
    `dive-${direction}`
  );
}


/* =========================================================
   PRECISION
========================================================= */

function getAccuracy() {

  const distance =
    Math.abs(
      state.power - 0.5
    );

  return Math.max(
    0.15,
    1 - distance * 1.7
  );
}


function chooseActualAim(x, y) {

  const accuracy =
    getAccuracy();

  const error =
    (1 - accuracy) * 0.20;

  return {

    x: Math.max(
      0.12,
      Math.min(
        0.88,
        x +
        (Math.random() - 0.5) *
        error
      )
    ),

    y: Math.max(
      0.15,
      Math.min(
        0.78,
        y +
        (Math.random() - 0.5) *
        error
      )
    )
  };
}


/* =========================================================
   BALLE
========================================================= */

function moveBall(x, y) {

  const safeX =
    12 + x * 76;

  const safeY =
    10 + y * 58;

  ball.style.left =
    `${safeX}%`;

  ball.style.bottom =
    `${safeY}%`;

  ball.style.transform =
    "translate(-50%,0) scale(.72)";
}


function resetBall() {

  ball.classList.remove(
    "shooting"
  );

  ball.style.left =
    "50%";

  ball.style.bottom =
    "6%";

  ball.style.transform =
    "translate(-50%,0) scale(1)";
}


/* =========================================================
   RESET VISUEL
========================================================= */

function resetGameVisuals() {

  goal.classList.remove(
    "goal-scored",
    "goal-saved"
  );

  player.classList.remove(
    "celebrate",
    "disappointed"
  );

  targetDot.classList.remove(
    "visible"
  );

  resetBall();
  resetKeeper();
}


/* =========================================================
   TIR
========================================================= */

function shoot(x, y) {

  if (state.locked) {
    return;
  }

  state.locked = true;

  const actualAim =
    chooseActualAim(x, y);

  const keeperDirection =
    randomKeeperDirection();

  const playerDirection =
    getAimDirection(
      actualAim.x
    );

  const saved =
    keeperDirection ===
    playerDirection;

  const accuracy =
    getAccuracy();


  moveKeeper(
    keeperDirection
  );

  ball.classList.add(
    "shooting"
  );

  moveBall(
    actualAim.x,
    actualAim.y
  );


  let points = 0;


  if (!saved) {

    const accuracyBonus =
      Math.round(
        accuracy * 80
      );

    const centerBonus =
      playerDirection === "center"
        ? 25
        : 0;

    const comboBonus =
      state.combo * 20;

    points =
      100 +
      accuracyBonus +
      centerBonus +
      comboBonus;

    state.score += points;

    state.combo++;

    stats.goals++;

    if (
      state.combo >
      stats.bestCombo
    ) {

      stats.bestCombo =
        state.combo;
    }

    if (state.training) {
      stats.trainingGoals++;
    }


    dailyState.goals++;

    dailyState.score += points;

    if (
      state.combo >
      dailyState.bestCombo
    ) {

      dailyState.bestCombo =
        state.combo;
    }


    message.textContent =
      `⚽ BUT ! +${points} points`;

    message.className =
      "message goal-message";

    player.classList.add(
      "celebrate"
    );

    playGoalSound();

  } else {

    state.combo = 0;

    stats.saves++;

    message.textContent =
      "🧤 ARRÊT DU GARDIEN !";

    message.className =
      "message save-message";

    player.classList.add(
      "disappointed"
    );

    playSaveSound();
  }


  stats.shots++;

  dailyState.shots++;


  if (state.training) {
    stats.trainingShots++;
  }


  saveStats();

  saveDailyState();

  updateDailyProgress();

  updateGameUI();

  setTimeout(() => {

    resetGameVisuals();

    if (state.training) {

      state.locked = false;

      message.textContent =
        "Vise la cage pour continuer ⚽";

      message.className =
        "message";

      updateGameUI();

      return;
    }


    state.shot++;


    if (
      state.shot >
      MAX_SHOTS
    ) {

      finishGame();

    } else {

      state.locked = false;

      message.textContent =
        "Vise la cage pour tirer ⚽";

      message.className =
        "message";

      updateGameUI();
    }

  }, 1100);
}


/* =========================================================
   CLIC / TACTILE
========================================================= */

function handleAim(event) {

  if (state.locked) {
    return;
  }

  if (
    gameScreen.classList.contains(
      "hidden-screen"
    )
  ) {
    return;
  }

  event.preventDefault();

  initAudio();

  playKickSound();

  const rect =
    goal.getBoundingClientRect();

  let x =
    (event.clientX - rect.left) /
    rect.width;

  let y =
    1 -
    (
      (event.clientY - rect.top) /
      rect.height
    );

  x =
    Math.max(
      0.08,
      Math.min(
        0.92,
        x
      )
    );

  y =
    Math.max(
      0.10,
      Math.min(
        0.85,
        y
      )
    );


  state.aim = {
    x,
    y
  };


  targetDot.style.left =
    `${x * 100}%`;

  targetDot.style.top =
    `${(1 - y) * 100}%`;

  targetDot.classList.add(
    "visible"
  );


  shoot(x, y);
}


goal.addEventListener(
  "pointerdown",
  handleAim
);


/* =========================================================
   FIN DE PARTIE
========================================================= */

function finishGame() {

  if (
    state.score >
    state.best
  ) {

    state.best =
      state.score;

    saveStats();
  }


  finalScore.textContent =
    state.score;

  bestScore.textContent =
    state.best;


  if (state.score >= 1300) {

    resultTitle.textContent =
      "🔥 Performance incroyable !";

  } else if (state.score >= 900) {

    resultTitle.textContent =
      "🏆 Très belle partie !";

  } else if (state.score >= 500) {

    resultTitle.textContent =
      "⚽ Bien joué !";

  } else {

    resultTitle.textContent =
      "💪 Continue !";
  }


  result.classList.remove(
    "hidden-result"
  );

  playWhistleSound();

  updateMenu();
}


/* =========================================================
   UI JEU
========================================================= */

function updateGameUI() {

  shotNumber.textContent =
    state.training
      ? "∞"
      : `${state.shot} / ${MAX_SHOTS}`;

  scoreElement.textContent =
    state.score;

  comboElement.textContent =
    state.combo;
}


/* =========================================================
   ENTRAINEMENT
========================================================= */

function startTraining() {

  state.training = true;

  state.shot = 1;
  state.score = 0;
  state.combo = 0;
  state.locked = false;
  state.aim = null;
  state.power = 0.5;

  result.classList.add(
    "hidden-result"
  );

  resetGameVisuals();

  document.getElementById(
    "gameSubtitle"
  ).textContent =
    "Entraînement — tirs illimités";

  message.textContent =
    "Vise la cage pour t'entraîner 🎯";

  message.className =
    "message";

  updateGameUI();

  showScreen(gameScreen);

  playWhistleSound();
}


startTrainingButton.addEventListener(
  "click",
  () => {

    initAudio();

    startTraining();
  }
);


function updateTrainingScreen() {

  trainingGoalsElement.textContent =
    stats.trainingGoals;

  trainingShotsElement.textContent =
    stats.trainingShots;
}


/* =========================================================
   STATS
========================================================= */

function updateStatsScreen() {

  statBestScore.textContent =
    state.best;

  statGoals.textContent =
    stats.goals;

  statSaves.textContent =
    stats.saves;

  statCombo.textContent =
    stats.bestCombo;

  statShots.textContent =
    stats.shots;


  const accuracy =
    stats.shots > 0
      ? Math.round(
          (stats.goals /
            stats.shots) *
          100
        )
      : 0;


  statAccuracy.textContent =
    `${accuracy}%`;
}


/* =========================================================
   BOUTONS
========================================================= */

soundButton.addEventListener(
  "click",
  toggleSound
);


settingsSoundButton.addEventListener(
  "click",
  toggleSound
);


restartButton.addEventListener(
  "click",
  () => {

    initAudio();

    startClassicGame();
  }
);


resetStatsButton.addEventListener(
  "click",
  () => {

    const confirmed =
      window.confirm(
        "Réinitialiser toutes les statistiques ?"
      );

    if (!confirmed) {
      return;
    }


    localStorage.removeItem(
      "penaltyMindBest"
    );

    localStorage.removeItem(
      "penaltyMindGoals"
    );

    localStorage.removeItem(
      "penaltyMindSaves"
    );

    localStorage.removeItem(
      "penaltyMindShots"
    );

    localStorage.removeItem(
      "penaltyMindBestCombo"
    );

    localStorage.removeItem(
      "penaltyMindTrainingGoals"
    );

    localStorage.removeItem(
      "penaltyMindTrainingShots"
    );


    state.best = 0;

    stats.goals = 0;
    stats.saves = 0;
    stats.shots = 0;
    stats.bestCombo = 0;
    stats.trainingGoals = 0;
    stats.trainingShots = 0;


    updateStatsScreen();
    updateTrainingScreen();
    updateMenu();
  }
);


/* =========================================================
   INITIALISATION
========================================================= */

loadDailyState();

updateSoundButtons();

updateMenu();

updateStatsScreen();

updateTrainingScreen();

updateProgressionUI();

renderDailyChallenges();

updateDailyMenuIndicator();

updateGameUI();

resetGameVisuals();

showScreen(mainMenu);
