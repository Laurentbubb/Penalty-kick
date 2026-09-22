const MAX_SHOTS = 10;

const state = {
  shot: 1,
  score: 0,
  combo: 0,
  locked: false,

  aim: null,
  power: 0.5,

  best: Number(localStorage.getItem("penaltyMindBest") || 0)
};


// ===============================
// ELEMENTS
// ===============================

const goal = document.getElementById("goal");
const ball = document.getElementById("ball");
const keeper = document.getElementById("keeper");
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


// ===============================
// JAUGE
// ===============================

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


// ===============================
// DIRECTION DU GARDIEN
// ===============================

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


// ===============================
// DIRECTION DU TIR
// ===============================

function getAimDirection(x) {

  if (x < 0.34) {
    return "left";
  }

  if (x > 0.66) {
    return "right";
  }

  return "center";
}


// ===============================
// PRECISION
// ===============================

function getAccuracy() {

  const distance =
    Math.abs(state.power - 0.5);

  /*
    Plus la jauge est proche du centre,
    plus le tir est précis.
  */

  return Math.max(
    0.15,
    1 - distance * 1.7
  );
}


// ===============================
// ERREUR DU TIR
// ===============================

function chooseActualAim(x, y) {

  const accuracy = getAccuracy();

  /*
    Plus accuracy est faible,
    plus la balle s'écarte du clic.
  */

  const error =
    (1 - accuracy) * 0.20;

  const randomX =
    (Math.random() - 0.5) * error;

  const randomY =
    (Math.random() - 0.5) * error;

  return {

    x: Math.max(
      0.12,
      Math.min(0.88, x + randomX)
    ),

    y: Math.max(
      0.15,
      Math.min(0.78, y + randomY)
    )
  };
}


// ===============================
// POSITION DE LA BALLE
// ===============================

function moveBall(x, y) {

  /*
    IMPORTANT :

    .ball est enfant de .goal.

    Donc les pourcentages ci-dessous
    correspondent à la cage et NON
    au terrain entier.
  */

  const safeX =
    12 + x * 76;

  /*
    On limite volontairement la hauteur
    pour que l'emoji ne puisse jamais
    sortir par le haut de la cage.
  */

  const safeY =
    10 + y * 58;

  ball.style.left =
    `${safeX}%`;

  ball.style.bottom =
    `${safeY}%`;

  ball.style.transform =
    "translate(-50%, 0) scale(.72)";
}


// ===============================
// ANIMATION GARDIEN
// ===============================

function moveKeeper(direction) {

  keeper.classList.remove(
    "dive-left",
    "dive-right",
    "dive-center"
  );

  void keeper.offsetWidth;

  if (direction === "left") {

    keeper.classList.add(
      "dive-left"
    );

  } else if (direction === "right") {

    keeper.classList.add(
      "dive-right"
    );

  } else {

    keeper.classList.add(
      "dive-center"
    );
  }
}


// ===============================
// TIR
// ===============================

function shoot() {

  if (state.locked) {
    return;
  }

  if (!state.aim) {
    return;
  }

  if (state.shot > MAX_SHOTS) {
    return;
  }

  state.locked = true;


  // ============================
  // PRECISION
  // ============================

  const accuracy =
    getAccuracy();


  // ============================
  // POSITION REELLE
  // ============================

  const actual =
    chooseActualAim(
      state.aim.x,
      state.aim.y
    );


  // ============================
  // DIRECTION
  // ============================

  const targetDirection =
    getAimDirection(actual.x);


  const keeperDirection =
    randomKeeperDirection();


  // ============================
  // SAUVE / BUT
  // ============================

  const saved =
    targetDirection === keeperDirection;


  // ============================
  // POINTS
  // ============================

  let points = 0;

  if (!saved) {

    points = 100;

    if (accuracy > 0.85) {
      points += 50;
    }

    if (targetDirection === "center") {
      points += 25;
    }

    state.combo++;

    points += state.combo * 10;

  } else {

    state.combo = 0;
  }


  // ============================
  // ANIMATION
  // ============================

  moveKeeper(
    keeperDirection
  );

  moveBall(
    actual.x,
    actual.y
  );


  // ============================
  // CIBLE
  // ============================

  targetDot.style.left =
    `${state.aim.x * 100}%`;

  targetDot.style.top =
    `${(1 - state.aim.y) * 100}%`;

  targetDot.classList.add(
    "visible"
  );


  // ============================
  // RESULTAT
  // ============================

  if (saved) {

    message.textContent =
      "🧤 ARRÊT !";

    message.classList.add(
      "save"
    );

  } else {

    state.score += points;

    message.textContent =
      `⚽ BUT ! +${points}`;

    message.classList.add(
      "goal-message"
    );
  }


  scoreElement.textContent =
    state.score;

  comboElement.textContent =
    state.combo;


  // ============================
  // PROCHAIN TIR
  // ============================

  setTimeout(() => {

    state.shot++;

    if (state.shot > MAX_SHOTS) {

      finishGame();

      return;
    }

    resetBall();

    state.locked = false;

    state.aim = null;

    targetDot.classList.remove(
      "visible"
    );

    message.classList.remove(
      "save",
      "goal-message"
    );

    message.textContent =
      "Clique dans la cage pour tirer ⚽";

    shotNumber.textContent =
      state.shot;

  }, 1100);
}


// ===============================
// CLIC DANS LA CAGE
// ===============================

function aim(event) {

  if (state.locked) {
    return;
  }

  if (state.shot > MAX_SHOTS) {
    return;
  }


  const rect =
    goal.getBoundingClientRect();


  /*
    Coordonnées du clic
    entre 0 et 1.
  */

  const x =
    (event.clientX - rect.left)
    / rect.width;

  const y =
    1 -
    (
      (event.clientY - rect.top)
      / rect.height
    );


  /*
    On empêche le clic sur les
    bords de sortir de la zone.
  */

  const safeX =
    Math.max(
      0.08,
      Math.min(0.92, x)
    );

  const safeY =
    Math.max(
      0.10,
      Math.min(0.85, y)
    );


  state.aim = {
    x: safeX,
    y: safeY
  };


  // Affiche la cible

  targetDot.style.left =
    `${safeX * 100}%`;

  targetDot.style.top =
    `${(1 - safeY) * 100}%`;

  targetDot.classList.add(
    "visible"
  );


  /*
    Tir AUTOMATIQUE.
  */

  shoot();
}


// ===============================
// RESET BALLE
// ===============================

function resetBall() {

  ball.style.left =
    "50%";

  ball.style.bottom =
    "6%";

  ball.style.transform =
    "translate(-50%, 0) scale(1)";


  keeper.classList.remove(
    "dive-left",
    "dive-right",
    "dive-center"
  );
}


// ===============================
// FIN DU MATCH
// ===============================

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


  resultTitle.textContent =
    state.score > 0
      ? "🏆 Match terminé !"
      : "🏁 Match terminé";


  result.classList.remove(
    "hidden"
  );
}


// ===============================
// RESTART
// ===============================

function restartGame() {

  state.shot = 1;
  state.score = 0;
  state.combo = 0;
  state.locked = false;
  state.aim = null;
  state.power = 0.5;


  shotNumber.textContent = "1";
  scoreElement.textContent = "0";
  comboElement.textContent = "0";


  result.classList.add(
    "hidden"
  );


  targetDot.classList.remove(
    "visible"
  );


  message.classList.remove(
    "save",
    "goal-message"
  );


  message.textContent =
    "Clique dans la cage pour tirer ⚽";


  resetBall();
}


// ===============================
// EVENEMENTS
// ===============================

goal.addEventListener(
  "click",
  aim
);

restartButton.addEventListener(
  "click",
  restartGame
);


// ===============================
// INITIALISATION
// ===============================

resetBall();

bestScore.textContent =
  state.best;
