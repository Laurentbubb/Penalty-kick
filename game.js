/* ==================================================
   PENALTYMIND
   Menu + Jeu + Entraînement + Statistiques
================================================== */


/* ==================================================
   CONFIGURATION
================================================== */

const MAX_SHOTS = 10;


/* ==================================================
   ECRANS
================================================== */

const screens = {

  menu:
    document.getElementById("mainMenu"),

  game:
    document.getElementById("gameScreen"),

  training:
    document.getElementById("trainingScreen"),

  stats:
    document.getElementById("statsScreen"),

  settings:
    document.getElementById("settingsScreen")

};


/* ==================================================
   ELEMENTS DU JEU
================================================== */

const goal =
  document.getElementById("goal");

const keeper =
  document.getElementById("keeper");

const ball =
  document.getElementById("ball");

const targetDot =
  document.getElementById("targetDot");

const message =
  document.getElementById("message");

const player =
  document.querySelector(".player");

const needle =
  document.getElementById("needle");

const shotNumber =
  document.getElementById("shotNumber");

const scoreElement =
  document.getElementById("score");

const comboElement =
  document.getElementById("combo");

const result =
  document.getElementById("result");

const resultTitle =
  document.getElementById("resultTitle");

const finalScore =
  document.getElementById("finalScore");

const bestScore =
  document.getElementById("bestScore");

const restartButton =
  document.getElementById("restartButton");

const resultMenuButton =
  document.getElementById("resultMenuButton");

const soundButton =
  document.getElementById("soundButton");

const settingsSoundButton =
  document.getElementById("settingsSoundButton");


/* ==================================================
   ETAT DU JEU
================================================== */

const state = {

  shot: 1,

  score: 0,

  combo: 0,

  locked: false,

  aim: null,

  power: 0.5,

  best:
    Number(
      localStorage.getItem(
        "penaltyMindBest"
      ) || 0
    )

};


/* ==================================================
   STATISTIQUES SAUVEGARDEES
================================================== */

const statistics = {

  goals:
    Number(
      localStorage.getItem(
        "penaltyMindGoals"
      ) || 0
    ),

  saves:
    Number(
      localStorage.getItem(
        "penaltyMindSaves"
      ) || 0
    ),

  shots:
    Number(
      localStorage.getItem(
        "penaltyMindShots"
      ) || 0
    ),

  bestCombo:
    Number(
      localStorage.getItem(
        "penaltyMindBestCombo"
      ) || 0
    ),

  trainingGoals:
    Number(
      localStorage.getItem(
        "penaltyMindTrainingGoals"
      ) || 0
    ),

  trainingShots:
    Number(
      localStorage.getItem(
        "penaltyMindTrainingShots"
      ) || 0
    )

};


/* ==================================================
   SAUVEGARDE STATS
================================================== */

function saveStatistics() {

  localStorage.setItem(
    "penaltyMindGoals",
    statistics.goals
  );

  localStorage.setItem(
    "penaltyMindSaves",
    statistics.saves
  );

  localStorage.setItem(
    "penaltyMindShots",
    statistics.shots
  );

  localStorage.setItem(
    "penaltyMindBestCombo",
    statistics.bestCombo
  );

  localStorage.setItem(
    "penaltyMindTrainingGoals",
    statistics.trainingGoals
  );

  localStorage.setItem(
    "penaltyMindTrainingShots",
    statistics.trainingShots
  );

}


/* ==================================================
   SON
================================================== */

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
      "Audio non disponible."
    );

  }

}


function tone(
  frequency,
  duration,
  type = "sine",
  volume = 0.05,
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
      "Son impossible à jouer."
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
    .045
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
    .045
  );

  tone(
    1400,
    .12,
    "sine",
    .05,
    .1
  );

}


/* ==================================================
   BOUTON SON
================================================== */

function updateSoundButtons() {

  const text =
    soundEnabled
      ? "🔊 Son"
      : "🔇 Son";

  soundButton.textContent =
    text;

  soundButton.setAttribute(
    "aria-pressed",
    String(soundEnabled)
  );


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

    playKickSound();

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


/* ==================================================
   NAVIGATION
================================================== */

function showScreen(screen) {

  Object.values(screens)
    .forEach(
      currentScreen => {

        currentScreen.classList.remove(
          "active-screen"
        );

      }
    );


  screen.classList.add(
    "active-screen"
  );

}


function showMenu() {

  /*
    On remet le jeu proprement
    lorsque l'on revient au menu.
  */

  state.locked = true;

  resetEffects();

  resetBall();

  result.classList.add(
    "hidden"
  );

  targetDot.classList.remove(
    "visible"
  );

  showScreen(
    screens.menu
  );

  updateMenu();

}


/* ==================================================
   BOUTONS DU MENU
================================================== */

document
  .getElementById("playButton")
  .addEventListener(
    "click",
    () => {

      startClassicGame();

    }
  );


document
  .getElementById("trainingButton")
  .addEventListener(
    "click",
    () => {

      updateTrainingScreen();

      showScreen(
        screens.training
      );

    }
  );


document
  .getElementById("statsButton")
  .addEventListener(
    "click",
    () => {

      updateStatsScreen();

      showScreen(
        screens.stats
      );

    }
  );


document
  .getElementById("settingsButton")
  .addEventListener(
    "click",
    () => {

      updateSoundButtons();

      showScreen(
        screens.settings
      );

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


resultMenuButton.addEventListener(
  "click",
  showMenu
);


/* ==================================================
   JEU CLASSIQUE
================================================== */

function startClassicGame() {

  state.shot = 1;

  state.score = 0;

  state.combo = 0;

  state.locked = false;

  state.aim = null;

  state.power = .5;


  result.classList.add(
    "hidden"
  );


  resetEffects();

  resetBall();


  message.textContent =
    "Vise la cage pour tirer ⚽";

  message.className =
    "message";


  updateUI();


  showScreen(
    screens.game
  );


  playWhistleSound();

}


/* ==================================================
   JAUGE
================================================== */

let meterTime = 0;


function animateMeter() {

  if (!state.locked) {

    meterTime += .04;

    state.power =
      (
        Math.sin(meterTime) +
        1
      ) / 2;


    needle.style.left =
      `${state.power * 100}%`;

  }


  requestAnimationFrame(
    animateMeter
  );

}


animateMeter();


/* ==================================================
   DIRECTIONS
================================================== */

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

  if (x < .34) {

    return "left";

  }

  if (x > .66) {

    return "right";

  }

  return "center";

}


/* ==================================================
   PRECISION
================================================== */

function getAccuracy() {

  const distance =
    Math.abs(
      state.power -
      .5
    );


  return Math.max(
    .15,
    1 -
      distance *
      1.7
  );

}


function chooseActualAim(
  x,
  y
) {

  const accuracy =
    getAccuracy();


  const error =
    (1 - accuracy) *
    .20;


  return {

    x:
      Math.max(
        .12,
        Math.min(
          .88,
          x +
            (
              Math.random() -
              .5
            ) *
            error
        )
      ),

    y:
      Math.max(
        .15,
        Math.min(
          .78,
          y +
            (
              Math.random() -
              .5
            ) *
            error
        )
      )

  };

}


/* ==================================================
   BALLON
================================================== */

function moveBall(
  x,
  y
) {

  const safeX =
    12 +
    x *
    76;


  const safeY =
    10 +
    y *
    58;


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


  clearKeeperAnimation();

}


/* ==================================================
   GARDIEN
================================================== */

function clearKeeperAnimation() {

  keeper.classList.remove(
    "dive-left",
    "dive-center",
    "dive-right"
  );

}


function moveKeeper(
  direction
) {

  clearKeeperAnimation();

  void keeper.offsetWidth;

  keeper.classList.add(
    `dive-${direction}`
  );

}


/* ==================================================
   EFFETS
================================================== */

function resetEffects() {

  goal.classList.remove(
    "goal-scored",
    "goal-saved"
  );

  player.classList.remove(
    "celebrate",
    "disappointed"
  );

}


/* ==================================================
   TIR
================================================== */

function shoot() {

  if (
    state.locked ||
    !state.aim ||
    state.shot > MAX_SHOTS
  ) {

    return;

  }


  state.locked = true;


  const accuracy =
    getAccuracy();


  const actual =
    chooseActualAim(
      state.aim.x,
      state.aim.y
    );


  const targetDirection =
    getAimDirection(
      actual.x
    );


  const keeperDirection =
    randomKeeperDirection();


  const saved =
    targetDirection ===
    keeperDirection;


  let points = 0;


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
      state.combo *
      20;


    points =
      100 +
      accuracyBonus +
      centerBonus +
      comboBonus;


    state.score +=
      points;


    state.combo++;


    statistics.goals++;


    if (
      state.combo >
      statistics.bestCombo
    ) {

      statistics.bestCombo =
        state.combo;

    }


    playGoalSound();


  } else {

    state.combo = 0;

    statistics.saves++;

    playSaveSound();

  }


  statistics.shots++;

  saveStatistics();


  resetEffects();


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
    `${state.aim.x * 100}%`;

  targetDot.style.top =
    `${(1 - state.aim.y) * 100}%`;

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


  updateUI();


  setTimeout(
    () => {

      state.shot++;


      if (
        state.shot >
        MAX_SHOTS
      ) {

        finishGame();

        return;

      }


      resetEffects();

      resetBall();


      targetDot.classList.remove(
        "visible"
      );


      message.textContent =
        "Vise la cage pour tirer ⚽";

      message.className =
        "message";


      state.aim = null;

      state.locked = false;


      updateUI();

    },
    1100
  );

}


/* ==================================================
   VISER
================================================== */

function aim(event) {

  if (
    state.locked ||
    state.shot > MAX_SHOTS
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


  x =
    Math.max(
      .08,
      Math.min(
        .92,
        x
      )
    );


  y =
    Math.max(
      .10,
      Math.min(
        .85,
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


  shoot();

}


goal.addEventListener(
  "pointerdown",
  aim
);


/* ==================================================
   FIN DU MATCH
================================================== */

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
      String(state.best)
    );

  }


  finalScore.textContent =
    state.score;


  bestScore.textContent =
    state.best;


  if (
    state.score >=
    1000
  ) {

    resultTitle.textContent =
      "🏆 Énorme performance !";

  } else if (
    state.score > 0
  ) {

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


  updateUI();

}


/* ==================================================
   UI DU JEU
================================================== */

function updateUI() {

  shotNumber.textContent =
    Math.min(
      state.shot,
      MAX_SHOTS
    );

  scoreElement.textContent =
    state.score;

  comboElement.textContent =
    state.combo;

}


/* ==================================================
   REJOUER
================================================== */

restartButton.addEventListener(
  "click",
  () => {

    startClassicGame();

  }
);


/* ==================================================
   STATISTIQUES
================================================== */

function updateStatsScreen() {

  document.getElementById(
    "statBestScore"
  ).textContent =
    state.best;


  document.getElementById(
    "statGoals"
  ).textContent =
    statistics.goals;


  document.getElementById(
    "statSaves"
  ).textContent =
    statistics.saves;


  document.getElementById(
    "statCombo"
  ).textContent =
    statistics.bestCombo;


  document.getElementById(
    "statShots"
  ).textContent =
    statistics.shots;


  const accuracy =
    statistics.shots > 0
      ? Math.round(
          (
            statistics.goals /
            statistics.shots
          ) *
          100
        )
      : 0;


  document.getElementById(
    "statAccuracy"
  ).textContent =
    `${accuracy}%`;

}


/* ==================================================
   MENU
================================================== */

function updateMenu() {

  document.getElementById(
    "menuBestScore"
  ).textContent =
    state.best;

}


/* ==================================================
   ENTRAINEMENT
================================================== */

let trainingMode = false;

let trainingShots = 0;

let trainingGoals = 0;


function updateTrainingScreen() {

  document.getElementById(
    "trainingGoals"
  ).textContent =
    statistics.trainingGoals;


  document.getElementById(
    "trainingShots"
  ).textContent =
    statistics.trainingShots;

}


document
  .getElementById(
    "startTrainingButton"
  )
  .addEventListener(
    "click",
    startTraining
  );


function startTraining() {

  trainingMode = true;

  trainingShots = 0;

  trainingGoals = 0;


  /*
    On réutilise exactement
    la même cage et les mêmes
    animations que le mode normal.
  */

  state.shot = 1;

  state.score = 0;

  state.combo = 0;

  state.locked = false;

  state.aim = null;


  result.classList.add(
    "hidden"
  );


  message.textContent =
    "🎯 Entraînement : vise la cage !";

  message.className =
    "message";


  resetEffects();

  resetBall();

  updateUI();


  document.getElementById(
    "gameSubtitle"
  ).textContent =
    "Mode entraînement • tirs libres";


  showScreen(
    screens.game
  );


  playWhistleSound();

}


/* ==================================================
   MODIFICATION DU TIR POUR L'ENTRAINEMENT
================================================== */

/*
  On remplace temporairement le
  comportement de fin de tir.

  Après chaque tir, le joueur peut
  immédiatement recommencer.
*/

const originalShoot =
  shoot;


/*
  On utilise un wrapper afin de
  conserver le gameplay classique.
*/

function handleTrainingAfterShot(
  saved
) {

  trainingShots++;

  statistics.trainingShots++;


  if (!saved) {

    trainingGoals++;

    statistics.trainingGoals++;

  }


  saveStatistics();


  setTimeout(
    () => {

      resetEffects();

      resetBall();

      targetDot.classList.remove(
        "visible"
      );


      message.textContent =
        "🎯 Vise encore !";


      message.className =
        "message";


      state.aim = null;

      state.locked = false;

    },
    1100
  );

}


/* ==================================================
   MODE ENTRAINEMENT : TIR
================================================== */

function trainingAim(event) {

  if (!trainingMode) {

    return;

  }


  if (state.locked) {

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


  x =
    Math.max(
      .08,
      Math.min(
        .92,
        x
      )
    );


  y =
    Math.max(
      .10,
      Math.min(
        .85,
        y
      )
    );


  state.locked = true;


  const accuracy =
    getAccuracy();


  const actual =
    chooseActualAim(
      x,
      y
    );


  const targetDirection =
    getAimDirection(
      actual.x
    );


  const keeperDirection =
    randomKeeperDirection();


  const saved =
    targetDirection ===
    keeperDirection;


  state.aim = {
    x,
    y
  };


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


  resetEffects();


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

    playSaveSound();

  } else {

    const points =
      Math.round(
        accuracy * 100
      );


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

    playGoalSound();

  }


  handleTrainingAfterShot(
    saved
  );

}


/*
  Le listener normal est remplacé
  selon le mode.
*/

goal.removeEventListener(
  "pointerdown",
  aim
);


goal.addEventListener(
  "pointerdown",
  event => {

    if (trainingMode) {

      trainingAim(event);

    } else {

      aim(event);

    }

  }
);


/* ==================================================
   RETOUR MENU
================================================== */

document
  .getElementById(
    "backToMenuButton"
  )
  .addEventListener(
    "click",
    () => {

      trainingMode = false;

      showMenu();

    }
  );


resultMenuButton.addEventListener(
  "click",
  () => {

    trainingMode = false;

    showMenu();

  }
);


/* ==================================================
   RESET STATS
================================================== */

document
  .getElementById(
    "resetStatsButton"
  )
  .addEventListener(
    "click",
    () => {

      const confirmed =
        window.confirm(
          "Réinitialiser toutes tes statistiques ?"
        );


      if (!confirmed) {

        return;

      }


      statistics.goals = 0;

      statistics.saves = 0;

      statistics.shots = 0;

      statistics.bestCombo = 0;

      statistics.trainingGoals = 0;

      statistics.trainingShots = 0;


      state.best = 0;


      localStorage.removeItem(
        "penaltyMindBest"
      );


      saveStatistics();


      updateStatsScreen();

      updateTrainingScreen();

      updateMenu();

    }
  );


/* ==================================================
   INITIALISATION
================================================== */

updateSoundButtons();

updateMenu();

updateStatsScreen();

updateTrainingScreen();

bestScore.textContent =
  state.best;

resetBall();

updateUI();

showScreen(
  screens.menu
);
