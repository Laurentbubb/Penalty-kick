/* ==================================================
   PENALTYMIND
   Jeu de penalty - PC / tablette / téléphone
================================================== */


/* ==================================================
   CONFIGURATION
================================================== */

const MAX_SHOTS = 10;


/* ==================================================
   ELEMENTS HTML
================================================== */

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

const restartButton = document.getElementById("restartButton");
const soundButton = document.getElementById("soundButton");


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

  best: Number(
    localStorage.getItem("penaltyMindBest") || 0
  )

};


/* ==================================================
   SON
================================================== */

let audioContext = null;

let soundEnabled =
  localStorage.getItem("penaltyMindSound") !== "off";


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

      audioContext = new AudioContext();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

  } catch (error) {

    console.warn("Audio non disponible.");

  }

}


function tone(
  frequency,
  duration,
  type = "sine",
  volume = 0.05,
  delay = 0
) {

  if (!soundEnabled || !audioContext) {
    return;
  }

  try {

    const now = audioContext.currentTime + delay;

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();


    oscillator.type = type;

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
    gain.connect(audioContext.destination);


    oscillator.start(now);

    oscillator.stop(
      now + duration + 0.03
    );

  } catch (error) {

    console.warn("Impossible de jouer le son.");

  }

}


/* -------------------------------
   Sons
-------------------------------- */

function playKickSound() {

  initAudio();

  tone(
    180,
    0.08,
    "triangle",
    0.08
  );

  tone(
    90,
    0.12,
    "sine",
    0.05,
    0.03
  );

}


function playGoalSound() {

  initAudio();

  tone(
    523,
    0.12,
    "sine",
    0.06
  );

  tone(
    659,
    0.12,
    "sine",
    0.06,
    0.12
  );

  tone(
    784,
    0.18,
    "sine",
    0.07,
    0.24
  );

}


function playSaveSound() {

  initAudio();

  tone(
    160,
    0.12,
    "sawtooth",
    0.045
  );

  tone(
    110,
    0.18,
    "triangle",
    0.06,
    0.08
  );

}


function playWhistleSound() {

  initAudio();

  tone(
    1000,
    0.08,
    "sine",
    0.045
  );

  tone(
    1400,
    0.12,
    "sine",
    0.05,
    0.1
  );

}


/* ==================================================
   BOUTON SON
================================================== */

function updateSoundButton() {

  if (soundEnabled) {

    soundButton.textContent = "🔊 Son";

  } else {

    soundButton.textContent = "🔇 Son";

  }

  soundButton.setAttribute(
    "aria-pressed",
    String(soundEnabled)
  );

}


soundButton.addEventListener(
  "click",
  () => {

    soundEnabled = !soundEnabled;

    localStorage.setItem(
      "penaltyMindSound",
      soundEnabled ? "on" : "off"
    );

    if (soundEnabled) {
      initAudio();
      playKickSound();
    }

    updateSoundButton();

  }
);


/* ==================================================
   JAUGE DE PUISSANCE
================================================== */

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
      Math.random() * directions.length
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


/* ==================================================
   PRECISION DU TIR
================================================== */

function getAccuracy() {

  const distance =
    Math.abs(state.power - 0.5);

  return Math.max(
    0.15,
    1 - distance * 1.7
  );

}


/* ==================================================
   PETITE ERREUR NATURELLE DU TIR
================================================== */

function chooseActualAim(x, y) {

  const accuracy =
    getAccuracy();

  const error =
    (1 - accuracy) * 0.20;


  const actualX =
    Math.max(
      0.12,
      Math.min(
        0.88,
        x +
          (Math.random() - 0.5) *
          error
      )
    );


  const actualY =
    Math.max(
      0.15,
      Math.min(
        0.78,
        y +
          (Math.random() - 0.5) *
          error
      )
    );


  return {
    x: actualX,
    y: actualY
  };

}


/* ==================================================
   POSITION DU BALLON
================================================== */

function moveBall(x, y) {

  /*
    On convertit les coordonnées
    en position interne à la cage.

    Les limites empêchent le ballon
    de sortir visuellement.
  */

  const safeX =
    12 + x * 76;

  const safeY =
    10 + y * 58;


  ball.style.left =
    `${safeX}%`;

  ball.style.bottom =
    `${safeY}%`;

  ball.style.transform =
    "translate(-50%, 0) scale(.72)";

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


function moveKeeper(direction) {

  clearKeeperAnimation();

  /*
    Force le navigateur à recalculer
    l'élément pour permettre de rejouer
    la même animation deux fois.
  */

  void keeper.offsetWidth;


  keeper.classList.add(
    `dive-${direction}`
  );

}


/* ==================================================
   RESET BALLON
================================================== */

function resetBall() {

  ball.classList.remove("shooting");

  ball.style.left = "50%";

  ball.style.bottom = "6%";

  ball.style.transform =
    "translate(-50%, 0) scale(1)";


  clearKeeperAnimation();

}


/* ==================================================
   RESET DES EFFETS
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
    getAimDirection(actual.x);


  const keeperDirection =
    randomKeeperDirection();


  const saved =
    targetDirection === keeperDirection;


  /*
    Calcul des points
  */

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
      state.combo * 20;


    points =
      100 +
      accuracyBonus +
      centerBonus +
      comboBonus;


    state.score += points;

    state.combo++;

  } else {

    state.combo = 0;

  }


  /* -------------------------------
     Animations
  -------------------------------- */

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


  /* -------------------------------
     Résultat
  -------------------------------- */

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


  updateUI();


  /* -------------------------------
     Tir suivant
  -------------------------------- */

  setTimeout(
    () => {

      state.shot++;


      if (state.shot > MAX_SHOTS) {

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


  /*
    Empêche le scroll accidentel
    sur tablette/téléphone.
  */

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


  /*
    Limites de sécurité.
  */

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


  /*
    Le tir part immédiatement.
  */

  shoot();

}


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


  updateUI();

}


/* ==================================================
   MISE A JOUR INTERFACE
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
   RECOMMENCER
================================================== */

function restartGame() {

  state.shot = 1;

  state.score = 0;

  state.combo = 0;

  state.locked = false;

  state.aim = null;

  state.power = 0.5;


  result.classList.add(
    "hidden"
  );


  targetDot.classList.remove(
    "visible"
  );


  message.textContent =
    "Vise la cage pour tirer ⚽";


  message.className =
    "message";


  resetEffects();

  resetBall();

  updateUI();


  playWhistleSound();

}


/* ==================================================
   EVENEMENTS
================================================== */


/*
  Pointerdown fonctionne avec :

  - souris
  - stylet
  - tablette
  - téléphone
  - écran tactile
*/

goal.addEventListener(
  "pointerdown",
  aim
);


restartButton.addEventListener(
  "click",
  restartGame
);


/* ==================================================
   INITIALISATION
================================================== */

updateSoundButton();

bestScore.textContent =
  state.best;

resetBall();

updateUI();
