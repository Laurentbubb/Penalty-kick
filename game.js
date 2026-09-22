"use strict";

/* =========================================================
   PENALTYMIND
   Jeu de penalties + XP + niveaux + défis quotidiens
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const mainMenu = $("mainMenu");
const gameScreen = $("gameScreen");
const trainingScreen = $("trainingScreen");
const dailyScreen = $("dailyScreen");
const statsScreen = $("statsScreen");
const settingsScreen = $("settingsScreen");

const playButton = $("playButton");
const trainingButton = $("trainingButton");
const dailyButton = $("dailyButton");
const statsButton = $("statsButton");
const settingsButton = $("settingsButton");

const backToMenuButton = $("backToMenuButton");
const soundButton = $("soundButton");

const goal = document.querySelector(".goal");
const keeper = $("keeper");
const ball = $("ball");
const targetDot = $("targetDot");
const needle = $("needle");
const message = $("message");

const result = $("result");
const resultTitle = $("resultTitle");
const finalScore = $("finalScore");
const bestScore = $("bestScore");
const restartButton = $("restartButton");
const resultMenuButton = $("resultMenuButton");

const startTrainingButton = $("startTrainingButton");

const dailyChallengesList = $("dailyChallengesList");
const dailyCompletedCount = $("dailyCompletedCount");

const settingsSoundButton = $("settingsSoundButton");
const resetStatsButton = $("resetStatsButton");


/* =========================================================
   ECRANS
   ========================================================= */

const allScreens = [
  mainMenu,
  gameScreen,
  trainingScreen,
  dailyScreen,
  statsScreen,
  settingsScreen
];

function showScreen(screen) {

  allScreens.forEach((current) => {
    current.classList.add("hidden-screen");
  });

  screen.classList.remove("hidden-screen");
}


/* =========================================================
   ETAT DU JEU
   ========================================================= */

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


/* =========================================================
   STATISTIQUES
   ========================================================= */

const stats = {
  goals: Number(localStorage.getItem("penaltyMindGoals") || 0),
  saves: Number(localStorage.getItem("penaltyMindSaves") || 0),
  shots: Number(localStorage.getItem("penaltyMindShots") || 0),
  bestCombo: Number(localStorage.getItem("penaltyMindBestCombo") || 0),
  trainingGoals: Number(localStorage.getItem("penaltyMindTrainingGoals") || 0),
  trainingShots: Number(localStorage.getItem("penaltyMindTrainingShots") || 0)
};

function saveStats() {

  localStorage.setItem("penaltyMindGoals", stats.goals);
  localStorage.setItem("penaltyMindSaves", stats.saves);
  localStorage.setItem("penaltyMindShots", stats.shots);
  localStorage.setItem("penaltyMindBestCombo", stats.bestCombo);
  localStorage.setItem("penaltyMindTrainingGoals", stats.trainingGoals);
  localStorage.setItem("penaltyMindTrainingShots", stats.trainingShots);
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

  localStorage.setItem("penaltyMindXP", progression.xp);
  localStorage.setItem("penaltyMindLevel", progression.level);
}

function addXP(amount) {

  if (amount <= 0) return;

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

    if (!state.locked) {

      message.textContent =
        `🆙 Niveau ${progression.level} atteint !`;

      message.className = "message goal-message";
    }
  }
}

function updateProgressionUI() {

  const needed = xpNeeded(progression.level);

  $("menuLevel").textContent = progression.level;
  $("menuXP").textContent = progression.xp;
  $("menuXPNeeded").textContent = needed;

  const percent = Math.min(
    100,
    (progression.xp / needed) * 100
  );

  $("menuXPFill").style.width = `${percent}%`;
}


/* =========================================================
   DATE
   ========================================================= */

function getTodayKey() {

  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}


/* =========================================================
   DEFIS QUOTIDIENS
   ========================================================= */

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


/* =========================================================
   CHARGEMENT DEFIS
   ========================================================= */

function loadDailyState() {

  const saved = localStorage.getItem(
    "penaltyMindDailyState"
  );

  if (saved) {

    try {

      dailyState = JSON.parse(saved);

    } catch (error) {

      console.warn("Données quotidiennes invalides.");
    }
  }

  if (dailyState.date !== getTodayKey()) {

    dailyState = {
      date: getTodayKey(),
      goals: 0,
      shots: 0,
      score: 0,
      bestCombo: 0,
      completed: []
    };
  }

  saveDailyState();
  generateDailyChallenges();
}

function saveDailyState() {

  localStorage.setItem(
    "penaltyMindDailyState",
    JSON.stringify(dailyState)
  );
}


/* =========================================================
   GENERATION DES 3 DEFIS
   ========================================================= */

function seededRandom(seed) {

  let value = 0;

  for (let i = 0; i < seed.length; i++) {
    value = (value * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return () => {

    value = (value * 1664525 + 1013904223) >>> 0;

    return value / 4294967296;
  };
}

function generateDailyChallenges() {

  const random = seededRandom(getTodayKey());

  const pool = [...DAILY_CHALLENGE_POOL];

  for (let i = pool.length - 1; i > 0; i--) {

    const j = Math.floor(random() * (i + 1));

    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  dailyChallenges = pool.slice(0, 3);

  localStorage.setItem(
    "penaltyMindDailyChallenges",
    JSON.stringify(dailyChallenges.map(c => c.id))
  );
}


/* =========================================================
   PROGRESSION DEFIS
   ========================================================= */

function getDailyValue(challenge) {

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

function isDailyCompleted(challenge) {

  return dailyState.completed.includes(challenge.id);
}

function updateDailyProgress() {

  let changed = false;

  dailyChallenges.forEach((challenge) => {

    if (
      !isDailyCompleted(challenge) &&
      getDailyValue(challenge) >= challenge.target
    ) {

      dailyState.completed.push(challenge.id);

      addXP(challenge.xp);

      changed = true;
    }
  });

  if (changed) {
    saveDailyState();
  }

  renderDailyChallenges();
  updateDailyMenuIndicator();
}


/* =========================================================
   AFFICHAGE DES DEFIS
   ========================================================= */

function renderDailyChallenges() {

  if (!dailyChallengesList) return;

  dailyChallengesList.innerHTML = "";

  dailyChallenges.forEach((challenge) => {

    const current = Math.min(
      getDailyValue(challenge),
      challenge.target
    );

    const percent =
      (current / challenge.target) * 100;

    const completed =
      isDailyCompleted(challenge);

    const card = document.createElement("div");

    card.className =
      `daily-card${completed ? " completed" : ""}`;

    card.innerHTML = `

      <div class="daily-card-top">

        <div class="daily-icon">
          ${challenge.icon}
        </div>

        <div class="daily-info">

          <strong>${challenge.title}</strong>

          <span>${challenge.text}</span>

        </div>

        <div class="daily-xp">
          +${challenge.xp} XP
        </div>

      </div>

      <div class="daily-progress-text">
        ${current} / ${challenge.target}
      </div>

      <div class="daily-progress">

        <div
          class="daily-progress-fill"
          style="width:${percent}%"
        ></div>

      </div>

      ${
        completed
          ? `<div class="daily-complete">✓ Défi terminé !</div>`
          : ""
      }

    `;

    dailyChallengesList.appendChild(card);
  });

  const completedCount =
    dailyChallenges.filter(isDailyCompleted).length;

  dailyCompletedCount.textContent =
    `${completedCount}/3`;
}

function updateDailyMenuIndicator() {

  const completedCount =
    dailyChallenges.filter(isDailyCompleted).length;

  if (completedCount >= 3) {

    dailyButton.innerHTML = `
      <span class="button-icon">✓</span>
      <span>
        <strong>Défis du jour</strong>
        <small>Tous les défis sont terminés !</small>
      </span>
    `;

  } else {

    dailyButton.innerHTML = `
      <span class="button-icon">📅</span>
      <span>
        <strong>Défis du jour (${completedCount}/3)</strong>
        <small>Gagne de l'XP chaque jour</small>
      </span>
    `;
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

  $("menuBestScore").textContent =
    state.best;

  updateProgressionUI();
  updateDailyMenuIndicator();
}

playButton.addEventListener("click", () => {

  startClassicGame();

});

trainingButton.addEventListener("click", () => {

  updateTrainingScreen();

  showScreen(trainingScreen);

});

dailyButton.addEventListener("click", () => {

  loadDailyState();
  renderDailyChallenges();
  updateDailyMenuIndicator();

  showScreen(dailyScreen);

});

statsButton.addEventListener("click", () => {

  updateStatsScreen();

  showScreen(statsScreen);

});

settingsButton.addEventListener("click", () => {

  updateSoundButtons();

  showScreen(settingsScreen);

});

document
  .querySelectorAll("[data-back-menu]")
  .forEach((button) => {

    button.addEventListener("click", showMenu);
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

  initAudio();

  state.training = false;
  state.shot = 1;
  state.score = 0;
  state.combo = 0;
  state.locked = false;
  state.aim = null;
  state.power = 0.5;

  result.classList.add("hidden-result");

  resetGameVisuals();

  message.textContent =
    "Vise la cage pour tirer ⚽";

  message.className = "message";

  $("gameSubtitle").textContent =
    "Vise la cage et trompe le gardien";

  updateGameUI();

  showScreen(gameScreen);

  playWhistleSound();
}


/* =========================================================
   JEU / INTERFACE
   ========================================================= */

function updateGameUI() {

  $("shotNumber").textContent =
    Math.min(state.shot, MAX_SHOTS);

  $("score").textContent =
    state.score;

  $("combo").textContent =
    state.combo;
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

  requestAnimationFrame(animateMeter);
}

animateMeter();


/* =========================================================
   PRECISION
   ========================================================= */

function getAccuracy() {

  const distance =
    Math.abs(state.power - 0.5);

  return Math.max(
    0.15,
    1 - distance * 1.7
  );
}

function chooseActualAim(x, y) {

  const accuracy = getAccuracy();

  const error =
    (1 - accuracy) * 0.20;

  return {

    x: Math.max(
      0.12,
      Math.min(
        0.88,
        x + (Math.random() - 0.5) * error
      )
    ),

    y: Math.max(
      0.15,
      Math.min(
        0.78,
        y + (Math.random() - 0.5) * error
      )
    )
  };
}


/* =========================================================
   DIRECTION
   ========================================================= */

function randomKeeperDirection() {

  const directions = [
    "left",
    "center",
    "right"
  ];

  return directions[
    Math.floor(Math.random() * directions.length)
  ];
}

function getAimDirection(x) {

  if (x < 0.34) return "left";

  if (x > 0.66) return "right";

  return "center";
}


/* =========================================================
   GARDIEN
   ========================================================= */

function moveKeeper(direction) {

  if (direction === "left") {

    keeper.style.left = "18%";
    keeper.style.transform =
      "translateX(-50%) rotate(-12deg)";

  } else if (direction === "right") {

    keeper.style.left = "82%";
    keeper.style.transform =
      "translateX(-50%) rotate(12deg)";

  } else {

    keeper.style.left = "50%";
    keeper.style.transform =
      "translateX(-50%)";
  }
}

function resetKeeper() {

  keeper.style.left = "50%";

  keeper.style.transform =
    "translateX(-50%)";
}


/* =========================================================
   BALL
   ========================================================= */

function moveBall(x, y) {

  const safeX = 12 + x * 76;
  const safeY = 10 + y * 58;

  ball.style.left =
    `${safeX}%`;

  ball.style.bottom =
    `${safeY}%`;

  ball.style.transform =
    "translate(-50%, 0) scale(.72)";
}

function resetBall() {

  ball.style.left = "50%";

  ball.style.bottom = "6%";

  ball.style.transform =
    "translate(-50%, 0) scale(1)";
}


/* =========================================================
   RESET VISUEL
   ========================================================= */

function resetGameVisuals() {

  resetBall();
  resetKeeper();

  targetDot.classList.remove("visible");

  message.className = "message";
}


/* =========================================================
   TIR
   ========================================================= */

function shoot(x, y) {

  if (state.locked) return;

  state.locked = true;

  const actualAim =
    chooseActualAim(x, y);

  const playerDirection =
    getAimDirection(actualAim.x);

  const keeperDirection =
    randomKeeperDirection();

  const accuracy =
    getAccuracy();

  targetDot.style.left =
    `${actualAim.x * 100}%`;

  targetDot.style.top =
    `${(1 - actualAim.y) * 100}%`;

  targetDot.classList.add("visible");

  moveKeeper(keeperDirection);

  moveBall(
    actualAim.x,
    actualAim.y
  );

  const saved =
    playerDirection === keeperDirection;

  if (!saved) {

    const accuracyBonus =
      Math.round(accuracy * 100);

    const centerBonus =
      playerDirection === "center"
        ? 50
        : 0;

    const comboBonus =
      state.combo * 25;

    const points =
      100 +
      accuracyBonus +
      centerBonus +
      comboBonus;

    state.score += points;
    state.combo++;

    stats.goals++;

    if (state.combo > stats.bestCombo) {
      stats.bestCombo = state.combo;
    }

    if (state.training) {
      stats.trainingGoals++;
    }

    dailyState.goals++;
    dailyState.score += points;

    dailyState.bestCombo =
      Math.max(
        dailyState.bestCombo,
        state.combo
      );

    message.textContent =
      `⚽ BUT ! +${points} points`;

    message.className =
      "message goal-message";

    playGoalSound();

    addXP(
      state.training
        ? 10
        : 25
    );

  } else {

    state.combo = 0;

    stats.saves++;

    message.textContent =
      "🧤 Arrêt du gardien !";

    message.className =
      "message save-message";

    keeper.classList.remove("shake");

    void keeper.offsetWidth;

    keeper.classList.add("shake");

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

    if (state.training) {

      state.locked = false;

      state.aim = null;

      resetGameVisuals();

      message.textContent =
        "Nouveau tir 🎯";

      message.className =
        "message";

      return;
    }

    if (state.shot >= MAX_SHOTS) {

      finishGame();

      return;
    }

    state.shot++;

    state.locked = false;
    state.aim = null;

    resetGameVisuals();

    message.textContent =
      `Tir ${state.shot} — À toi ⚽`;

    message.className =
      "message";

    updateGameUI();

  }, 1100);
}


/* =========================================================
   CLIC / TACTILE SUR LA CAGE
   ========================================================= */

function handleAim(event) {

  if (state.locked) return;

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

  x = Math.max(
    0.08,
    Math.min(0.92, x)
  );

  y = Math.max(
    0.10,
    Math.min(0.85, y)
  );

  state.aim = {
    x,
    y
  };

  targetDot.style.left =
    `${x * 100}%`;

  targetDot.style.top =
    `${(1 - y) * 100}%`;

  targetDot.classList.add("visible");

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

  state.locked = true;

  if (state.score > state.best) {

    state.best =
      state.score;

    localStorage.setItem(
      "penaltyMindBest",
      state.best
    );
  }

  finalScore.textContent =
    state.score;

  bestScore.textContent =
    state.best;

  if (state.score >= 1500) {

    resultTitle.textContent =
      "🔥 Performance incroyable !";

  } else if (state.score >= 1000) {

    resultTitle.textContent =
      "🏆 Excellent match !";

  } else if (state.score >= 600) {

    resultTitle.textContent =
      "⚽ Bien joué !";

  } else {

    resultTitle.textContent =
      "🎯 Continue à t'entraîner !";
  }

  result.classList.remove(
    "hidden-result"
  );

  playWhistleSound();

  updateMenu();
}


/* =========================================================
   REJOUER
   ========================================================= */

restartButton.addEventListener(
  "click",
  () => {

    result.classList.add(
      "hidden-result"
    );

    startClassicGame();
  }
);


/* =========================================================
   ENTRAINEMENT
   ========================================================= */

function startTraining() {

  initAudio();

  state.training = true;
  state.shot = 1;
  state.score = 0;
  state.combo = 0;
  state.locked = false;
  state.aim = null;

  result.classList.add(
    "hidden-result"
  );

  resetGameVisuals();

  $("gameSubtitle").textContent =
    "Mode entraînement — tirs illimités";

  message.textContent =
    "Entraîne-toi 🎯";

  message.className =
    "message";

  updateGameUI();

  showScreen(gameScreen);

  playWhistleSound();
}

startTrainingButton.addEventListener(
  "click",
  startTraining
);


/* =========================================================
   STATISTIQUES
   ========================================================= */

function updateStatsScreen() {

  $("statBestScore").textContent =
    state.best;

  $("statGoals").textContent =
    stats.goals;

  $("statSaves").textContent =
    stats.saves;

  $("statCombo").textContent =
    stats.bestCombo;

  $("statShots").textContent =
    stats.shots;

  const accuracy =
    stats.shots > 0
      ? Math.round(
          (stats.goals / stats.shots) * 100
        )
      : 0;

  $("statAccuracy").textContent =
    `${accuracy}%`;
}


/* =========================================================
   STATS ENTRAINEMENT
   ========================================================= */

function updateTrainingScreen() {

  $("trainingGoals").textContent =
    stats.trainingGoals;

  $("trainingShots").textContent =
    stats.trainingShots;
}


/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;

let soundEnabled =
  localStorage.getItem(
    "penaltyMindSound"
  ) !== "off";

function initAudio() {

  if (!soundEnabled) return;

  if (!audioContext) {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) return;

    audioContext =
      new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(
  frequency,
  duration,
  type = "sine",
  volume = 0.08
) {

  if (!soundEnabled) return;

  initAudio();

  if (!audioContext) return;

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

  playTone(
    120,
    0.08,
    "square",
    0.05
  );
}

function playGoalSound() {

  playTone(
    520,
    0.12,
    "sine",
    0.07
  );

  setTimeout(() => {

    playTone(
      720,
      0.18,
      "sine",
      0.07
    );

  }, 90);
}

function playSaveSound() {

  playTone(
    180,
    0.18,
    "sawtooth",
    0.05
  );
}

function playWhistleSound() {

  playTone(
    900,
    0.16,
    "sine",
    0.06
  );
}

function playLevelUpSound() {

  playTone(
    500,
    0.12,
    "sine",
    0.07
  );

  setTimeout(() => {

    playTone(
      800,
      0.18,
      "sine",
      0.07
    );

  }, 120);
}


/* =========================================================
   SON ON / OFF
   ========================================================= */

function updateSoundButtons() {

  if (soundEnabled) {

    soundButton.textContent = "🔊";

    settingsSoundButton.textContent =
      "🔊 Son : activé";

  } else {

    soundButton.textContent = "🔇";

    settingsSoundButton.textContent =
      "🔇 Son : désactivé";
  }
}

function toggleSound() {

  soundEnabled =
    !soundEnabled;

  localStorage.setItem(
    "penaltyMindSound",
    soundEnabled
      ? "on"
      : "off"
  );

  updateSoundButtons();

  if (soundEnabled) {

    initAudio();
    playTone(
      600,
      0.12,
      "sine",
      0.06
    );
  }
}

soundButton.addEventListener(
  "click",
  toggleSound
);

settingsSoundButton.addEventListener(
  "click",
  toggleSound
);


/* =========================================================
   RESET DES DONNEES
   ========================================================= */

resetStatsButton.addEventListener(
  "click",
  () => {

    const confirmation =
      confirm(
        "Réinitialiser toutes tes statistiques, ton XP, ton niveau et tes défis ?"
      );

    if (!confirmation) return;

    const keys = [
      "penaltyMindBest",
      "penaltyMindGoals",
      "penaltyMindSaves",
      "penaltyMindShots",
      "penaltyMindBestCombo",
      "penaltyMindTrainingGoals",
      "penaltyMindTrainingShots",
      "penaltyMindXP",
      "penaltyMindLevel",
      "penaltyMindDailyState",
      "penaltyMindDailyChallenges"
    ];

    keys.forEach((key) => {
      localStorage.removeItem(key);
    });

    location.reload();
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
