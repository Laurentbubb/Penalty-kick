/* =====================================================
   PENALTYMIND
===================================================== */


/* ================= ELEMENTS ================= */

const mainMenu = document.getElementById("mainMenu");
const gameScreen = document.getElementById("gameScreen");
const trainingScreen = document.getElementById("trainingScreen");
const statsScreen = document.getElementById("statsScreen");
const settingsScreen = document.getElementById("settingsScreen");

const goal = document.getElementById("goal");
const keeper = document.getElementById("keeper");
const ball = document.getElementById("ball");
const targetDot = document.getElementById("targetDot");
const message = document.getElementById("message");
const player = document.querySelector(".player");

const needle = document.getElementById("needle");

const shotNumber = document.getElementById("shotNumber");
const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");

const result = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const finalScore = document.getElementById("finalScore");
const bestScore = document.getElementById("bestScore");

const soundButton = document.getElementById("soundButton");
const settingsSoundButton =
  document.getElementById("settingsSoundButton");


/* ================= CONFIG ================= */

const MAX_SHOTS = 10;


/* ================= ETAT ================= */

const state = {

  shot: 1,
  score: 0,
  combo: 0,

  locked: false,

  aim: null,

  power: 0.5,

  training: false,

  best:
    Number(
      localStorage.getItem("penaltyMindBest") || 0
    )

};


/* ================= STATS ================= */

const stats = {

  goals:
    Number(
      localStorage.getItem("penaltyMindGoals") || 0
    ),

  saves:
    Number(
      localStorage.getItem("penaltyMindSaves") || 0
    ),

  shots:
    Number(
      localStorage.getItem("penaltyMindShots") || 0
    ),

  bestCombo:
    Number(
      localStorage.getItem("penaltyMindBestCombo") || 0
    ),

  trainingGoals:
    Number(
      localStorage.getItem("penaltyMindTrainingGoals") || 0
    ),

  trainingShots:
    Number(
      localStorage.getItem("penaltyMindTrainingShots") || 0
    )

};


function saveStats() {

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
  );

}


/* =====================================================
   NAVIGATION
===================================================== */

const allScreens = [
  mainMenu,
  gameScreen,
  trainingScreen,
  statsScreen,
  settingsScreen
];


function showScreen(screen) {

  allScreens.forEach(
    currentScreen => {

      currentScreen.classList.add(
        "hidden-screen"
      );

    }
  );


  screen.classList.remove(
    "hidden-screen"
  );

}


function showMenu() {

  state.training = false;
  state.locked = true;

  resetGameVisuals();

  showScreen(mainMenu);

  updateMenu();

}


/* =====================================================
   MENU
===================================================== */

document
  .getElementById("playButton")
  .addEventListener(
    "click",
    startClassicGame
  );


document
  .getElementById("trainingButton")
  .addEventListener(
    "click",
    () => {

      updateTrainingScreen();

      showScreen(trainingScreen);

    }
  );


document
  .getElementById("statsButton")
  .addEventListener(
    "click",
    () => {

      updateStatsScreen();

      showScreen(statsScreen);

    }
  );


document
  .getElementById("settingsButton")
  .addEventListener(
    "click",
    () => {

      updateSoundButtons();

      showScreen(settingsScreen);

    }
  );


document
  .querySelectorAll("[data-back-menu]")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        showMenu
      );

    }
  );


document
  .getElementById("backToMenuButton")
  .addEventListener(
    "click",
    showMenu
  );


document
  .getElementById("resultMenuButton")
  .addEventListener(
    "click",
    showMenu
  );


/* =====================================================
   JEU CLASSIQUE
===================================================== */

function startClassicGame() {

  state.training = false;

  state.shot = 1;
  state.score = 0;
  state.combo = 0;
  state.locked = false;
  state.aim = null;
  state.power = 0.5;

  result.classList.add("hidden");

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


/* =====================================================
   JAUGE
===================================================== */

let meterTime = 0;


function animateMeter() {

  if (!state.locked) {

    meterTime += 0.04;

    state.power =
      (
        Math.sin(meterTime) + 1
      ) / 2;

    needle.style.left =
      `${state.power * 100}%`;

  }

  requestAnimationFrame(
    animateMeter
  );

}


animateMeter();


/* =====================================================
   DIRECTION GARDIEN
===================================================== */

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


/* =====================================================
   PRECISION
===================================================== */

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


/* =====================================================
   BALLON
===================================================== */

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

  ball.style.left = "50%";
  ball.style.bottom = "6%";

  ball.style.transform =
    "translate(-50%,0) scale(1)";

}


/* =====================================================
   GARDIEN
===================================================== */

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


/* =====================================================
   EFFETS
===================================================== */

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


/* =====================================================
   TIR
===================================================== */

function shoot(x, y) {

  if (state.locked) {
    return;
  }

  state.locked = true;


  const accuracy =
    getAccuracy();

  const actual =
    chooseActualAim(x, y);

  const targetDirection =
    getAimDirection(actual.x);

  const keeperDirection =
    randomKeeperDirection();

  const saved =
    targetDirection === keeperDirection;


  let points = 0;


  /* ================= BUT ================= */

  if (!saved) {

    const accuracyBonus =
      Math.round(
        accuracy * 100
      );

    const centerBonus =
      targetDirection === "center"
        ? 25
        : 0;

    const comboBonus =
      state.combo * 20;

    points =
      100 +
      accuracyBonus +
      centerBonus +
      comboBonus;


    state.score +=
      points;

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


    playGoalSound();


  }

  /* ================= ARRET ================= */

  else {

    state.combo = 0;

    stats.saves++;

    playSaveSound();

  }


  stats.shots++;

  if (state.training) {
    stats.trainingShots++;
  }

  saveStats();


  /* ================= ANIMATION ================= */

  moveKeeper(
    keeperDirection
  );

  moveBall(
    actual.x,
    actual.y
  );

  ball.classList.add(
    "shooting"
  );


  targetDot.style.left =
    `${x * 100}%`;

  targetDot.style.top =
    `${(1 - y) * 100}%`;

  targetDot.classList.add(
    "visible"
  );


  if (saved) {

    message.textContent =
      "🧤 ARRÊT !";

    message.className =
      "message save";

    goal.classList.add(
      "goal-saved"
    );

    player.classList.add(
      "disappointed"
    );

  } else {

    message.textContent =
      `⚽ BUT ! +${points}`;

    message.className =
      "message goal-message";

    goal.classList.add(
      "goal-scored"
    );

    player.classList.add(
      "celebrate"
    );

  }


  updateGameUI();


  /* ================= SUITE ================= */

  setTimeout(
    () => {

      resetGameVisuals();

      state.aim = null;


      /* MODE ENTRAINEMENT */

      if (state.training) {

        state.locked = false;

        message.textContent =
          "🎯 Vise encore !";

        message.className =
          "message";

        return;

      }


      /* MODE NORMAL */

      state.shot++;


      if (
        state.shot >
        MAX_SHOTS
      ) {

        finishGame();

        return;

      }


      state.locked = false;

      message.textContent =
        "Vise la cage pour tirer ⚽";

      message.className =
        "message";

      updateGameUI();

    },
    1100
  );

}


/* =====================================================
   VISER LA CAGE
===================================================== */

function handleAim(event) {

  if (
    state.locked ||
    !gameScreen.classList.contains(
      "hidden-screen"
    ) === false
  ) {
    /* Le jeu doit être l'écran visible. */
  }

  if (
    state.locked ||
    !state.aim &&
    false
  ) {
    return;
  }


  event.preventDefault();


  initAudio();

  playKickSound();


  const rect =
    goal.getBoundingClientRect();


  let x =
    (
      event.clientX -
      rect.left
    ) /
    rect.width;


  let y =
    1 -
    (
      (
        event.clientY -
        rect.top
      ) /
      rect.height
    );


  x = Math.max(
    0.08,
    Math.min(
      0.92,
      x
    )
  );


  y = Math.max(
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


/* =====================================================
   FIN DU MATCH
===================================================== */

function finishGame() {

  state.locked = true;


  if (
    state.score >
    state.best
  ) {

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


  if (state.score >= 1000) {

    resultTitle.textContent =
      "🏆 Énorme performance !";

  } else if (state.score > 0) {

    resultTitle.textContent =
      "⚽ Match terminé !";

  } else {

    resultTitle.textContent =
      "🏁 Match terminé";

  }


  result.classList.remove(
    "hidden"
  );

  playWhistleSound();

  updateMenu();

}


/* =====================================================
   REJOUER
===================================================== */

document
  .getElementById("restartButton")
  .addEventListener(
    "click",
    startClassicGame
  );


/* =====================================================
   ENTRAINEMENT
===================================================== */

document
  .getElementById("startTrainingButton")
  .addEventListener(
    "click",
    startTraining
  );


function startTraining() {

  state.training = true;

  state.shot = 1;
  state.score = 0;
  state.combo = 0;
  state.locked = false;
  state.aim = null;
  state.power = 0.5;


  result.classList.add(
    "hidden"
  );


  resetGameVisuals();


  document.getElementById(
    "gameSubtitle"
  ).textContent =
    "Mode entraînement • tirs libres";


  message.textContent =
    "🎯 Vise la cage !";

  message.className =
    "message";


  updateGameUI();

  showScreen(gameScreen);

  playWhistleSound();

}


/* =====================================================
   UI
===================================================== */

function updateGameUI() {

  shotNumber.textContent =
    state.training
      ? "∞"
      : Math.min(
          state.shot,
          MAX_SHOTS
        );

  scoreElement.textContent =
    state.score;

  comboElement.textContent =
    state.combo;

}


function updateMenu() {

  document.getElementById(
    "menuBestScore"
  ).textContent =
    state.best;

}


function updateStatsScreen() {

  document.getElementById(
    "statBestScore"
  ).textContent =
    state.best;

  document.getElementById(
    "statGoals"
  ).textContent =
    stats.goals;

  document.getElementById(
    "statSaves"
  ).textContent =
    stats.saves;

  document.getElementById(
    "statCombo"
  ).textContent =
    stats.bestCombo;

  document.getElementById(
    "statShots"
  ).textContent =
    stats.shots;


  const accuracy =
    stats.shots > 0
      ? Math.round(
          stats.goals /
          stats.shots *
          100
        )
      : 0;


  document.getElementById(
    "statAccuracy"
  ).textContent =
    `${accuracy}%`;

}


function updateTrainingScreen() {

  document.getElementById(
    "trainingGoals"
  ).textContent =
    stats.trainingGoals;

  document.getElementById(
    "trainingShots"
  ).textContent =
    stats.trainingShots;

}


/* =====================================================
   RESET STATS
===================================================== */

document
  .getElementById("resetStatsButton")
  .addEventListener(
    "click",
    () => {

      const confirmation =
        confirm(
          "Réinitialiser toutes les statistiques ?"
        );

      if (!confirmation) {
        return;
      }


      stats.goals = 0;
      stats.saves = 0;
      stats.shots = 0;
      stats.bestCombo = 0;
      stats.trainingGoals = 0;
      stats.trainingShots = 0;


      state.best = 0;


      localStorage.removeItem(
        "penaltyMindBest"
      );


      saveStats();


      updateMenu();
      updateStatsScreen();
      updateTrainingScreen();

    }
  );


/* =====================================================
   AUDIO
===================================================== */

let audioContext = null;

let soundEnabled =
  localStorage.getItem(
    "penaltyMindSound"
  ) !== "off";


function initAudio() {

  if (!soundEnabled) {
    return;
  }


  try {

    if (!audioContext) {

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        return;
      }

      audioContext =
        new AudioContext();

    }


    if (
      audioContext.state ===
      "suspended"
    ) {

      audioContext.resume();

    }

  } catch (error) {

    console.warn(
      "Audio indisponible."
    );

  }

}


function tone(
  frequency,
  duration,
  type,
  volume,
  delay = 0
) {

  if (
    !soundEnabled ||
    !audioContext
  ) {
    return;
  }


  try {

    const now =
      audioContext.currentTime +
      delay;


    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();


    oscillator.type =
      type;

    oscillator.frequency.setValueAtTime(
      frequency,
      now
    );


    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );


    oscillator.connect(gain);
    gain.connect(
      audioContext.destination
    );


    oscillator.start(now);

    oscillator.stop(
      now +
      duration +
      0.03
    );

  } catch (error) {

    console.warn(
      "Erreur audio."
    );

  }

}


function playKickSound() {

  initAudio();

  tone(
    180,
    .08,
    "triangle",
    .08
  );

  tone(
    90,
    .12,
    "sine",
    .05,
    .03
  );

}


function playGoalSound() {

  initAudio();

  tone(
    523,
    .12,
    "sine",
    .06
  );

  tone(
    659,
    .12,
    "sine",
    .06,
    .12
  );

  tone(
    784,
    .18,
    "sine",
    .07,
    .24
  );

}


function playSaveSound() {

  initAudio();

  tone(
    160,
    .12,
    "sawtooth",
    .05
  );

  tone(
    110,
    .18,
    "triangle",
    .06,
    .08
  );

}


function playWhistleSound() {

  initAudio();

  tone(
    1000,
    .08,
    "sine",
    .05
  );

  tone(
    1400,
    .12,
    "sine",
    .05,
    .1
  );

}


/* =====================================================
   BOUTONS SON
===================================================== */

function updateSoundButtons() {

  const text =
    soundEnabled
      ? "🔊 Son"
      : "🔇 Son";


  soundButton.textContent =
    text;


  settingsSoundButton.textContent =
    soundEnabled
      ? "ON"
      : "OFF";


  settingsSoundButton.style.background =
    soundEnabled
      ? "#2fbf71"
      : "#555d68";

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


  if (soundEnabled) {
    initAudio();
  }


  updateSoundButtons();

}


soundButton.addEventListener(
  "click",
  toggleSound
);


settingsSoundButton.addEventListener(
  "click",
  toggleSound
);


/* =====================================================
   INITIALISATION
===================================================== */

updateSoundButtons();

updateMenu();

updateStatsScreen();

updateTrainingScreen();

updateGameUI();

resetGameVisuals();


/*
   IMPORTANT :
   Le menu est affiché
   directement au démarrage.
*/

showScreen(mainMenu);
