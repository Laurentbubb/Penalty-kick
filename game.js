const MAX_SHOTS = 10;

const state = {
  shot: 1,
  score: 0,
  combo: 0,
  locked: false,
  aim: null,
  power: 0,
  direction: 1,
  best: Number(localStorage.getItem("penaltyMindBest") || 0)
};

// =========================
// ELEMENTS HTML
// =========================

const goal = document.getElementById("goal");
const ball = document.getElementById("ball");
const keeper = document.getElementById("keeper");
const targetDot = document.getElementById("targetDot");
const message = document.getElementById("message");
const needle = document.getElementById("needle");

const result = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const finalScore = document.getElementById("finalScore");
const bestScore = document.getElementById("bestScore");

const shotNumber = document.getElementById("shotNumber");
const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");

const restartButton = document.getElementById("restartButton");


// =========================
// INTERFACE
// =========================

function updateUI() {
  shotNumber.textContent = state.shot;
  scoreElement.textContent = state.score;
  comboElement.textContent = state.combo;
}

function setMessage(text) {
  message.textContent = text;
}


// =========================
// JAUGE DE PUISSANCE
// =========================

let lastTime = performance.now();

function animateMeter(now) {
  const delta = Math.min(
    (now - lastTime) / 1000,
    0.05
  );

  lastTime = now;

  if (!state.locked) {
    state.power += state.direction * delta * 0.95;

    if (state.power >= 1) {
      state.power = 1;
      state.direction = -1;
    }

    if (state.power <= 0) {
      state.power = 0;
      state.direction = 1;
    }

    if (needle) {
      needle.style.left = `${state.power * 100}%`;
    }
  }

  requestAnimationFrame(animateMeter);
}


// =========================
// BALLE
// =========================

function resetBall() {
  ball.style.left = "50%";
  ball.style.bottom = "17%";
  ball.style.transform = "translateX(-50%)";
}


// =========================
// GARDIEN
// =========================

function resetKeeper() {
  keeper.classList.remove(
    "dive-left",
    "dive-center",
    "dive-right"
  );

  keeper.style.left = "50%";
}

function getGoalkeeperChoice() {
  const random = Math.random();

  if (random < 0.34) {
    return "left";
  }

  if (random < 0.66) {
    return "center";
  }

  return "right";
}

function keeperPosition(direction) {
  if (direction === "left") {
    return 27;
  }

  if (direction === "right") {
    return 73;
  }

  return 50;
}


// =========================
// CIBLE
// =========================

function resetTarget() {
  state.aim = null;
  targetDot.classList.remove("visible");
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


// =========================
// PRECISION
// =========================

function getAccuracy() {
  const distance = Math.abs(state.power - 0.5);

  const greenHalfWidth = 0.15;

  if (distance <= greenHalfWidth) {
    return 1 - distance / greenHalfWidth;
  }

  const orangeHalfWidth = 0.33;

  const progress = Math.max(
    0,
    1 -
      (distance - greenHalfWidth) /
        (orangeHalfWidth - greenHalfWidth)
  );

  return progress * 0.55;
}

function chooseActualAim() {
  const accuracy = getAccuracy();

  const desiredX = state.aim.x;

  const maxError = (1 - accuracy) * 0.30;

  const error =
    (Math.random() * 2 - 1) *
    maxError;

  return Math.max(
    0.03,
    Math.min(
      0.97,
      desiredX + error
    )
  );
}


// =========================
// TIR
// =========================

function shoot() {
  if (
    state.locked ||
    !state.aim ||
    state.shot > MAX_SHOTS
  ) {
    return;
  }

  state.locked = true;

  const accuracy = getAccuracy();
  const actualX = chooseActualAim();

  const targetDirection =
    getAimDirection(actualX);

  const keeperDirection =
    getGoalkeeperChoice();

  const saved =
    targetDirection === keeperDirection &&
    Math.random() < 0.82;

  let points = 0;

  // =========================
  // ARRÊT
  // =========================

  if (saved) {
    state.combo = 0;

    setMessage(
      "🧤 ARRÊT ! Le gardien plonge au bon endroit."
    );
  }

  // =========================
  // BUT
  // =========================

  else {
    const precisionBonus =
      Math.round(accuracy * 80);

    const comboBonus =
      state.combo * 25;

    points =
      100 +
      precisionBonus +
      comboBonus;

    state.score += points;
    state.combo++;

    setMessage(
      `⚽ BUT ! +${points} points`
    );
  }

  // =========================
  // ANIMATION GARDIEN
  // =========================

  keeper.style.left =
    `${keeperPosition(keeperDirection)}%`;

  if (keeperDirection === "left") {
    keeper.classList.add("dive-left");
  }

  else if (keeperDirection === "right") {
    keeper.classList.add("dive-right");
  }

  else {
    keeper.classList.add("dive-center");
  }

  // =========================
  // ANIMATION BALLE
  // =========================

  const targetY = state.aim.y;

  ball.style.left =
    `${actualX * 100}%`;

  ball.style.bottom =
    `${Math.max(
      47,
      67 - targetY * 28
    )}%`;

  ball.style.transform =
    "translateX(-50%) scale(.62)";

  // =========================
  // AFFICHER LA CIBLE
  // =========================

  targetDot.style.left =
    `${state.aim.x * 100}%`;

  targetDot.style.top =
    `${state.aim.y * 100}%`;

  targetDot.classList.add("visible");

  updateUI();

  // =========================
  // TIR SUIVANT
  // =========================

  setTimeout(() => {

    if (state.shot >= MAX_SHOTS) {
      finishGame();
      return;
    }

    state.shot++;
    state.locked = false;

    resetBall();
    resetKeeper();
    resetTarget();

    setMessage(
      "Clique dans la cage pour tirer ⚽"
    );

    updateUI();

  }, 1150);
}


// =========================
// CLIC DANS LA CAGE
// =========================

function aim(event) {
  if (state.locked) {
    return;
  }

  const rect =
    goal.getBoundingClientRect();

  const x =
    Math.max(
      0,
      Math.min(
        1,
        (event.clientX - rect.left) /
          rect.width
      )
    );

  const y =
    Math.max(
      0,
      Math.min(
        1,
        (event.clientY - rect.top) /
          rect.height
      )
    );

  state.aim = {
    x,
    y
  };

  targetDot.style.left =
    `${x * 100}%`;

  targetDot.style.top =
    `${y * 100}%`;

  targetDot.classList.add("visible");

  // Le clic déclenche directement le tir
  shoot();
}


// =========================
// FIN DE PARTIE
// =========================

function finishGame() {
  state.locked = true;

  if (state.score > state.best) {
    state.best = state.score;

    localStorage.setItem(
      "penaltyMindBest",
      String(state.best)
    );

    resultTitle.textContent =
      "🏆 Nouveau record !";
  }

  else {
    resultTitle.textContent =
      "🏁 Fin du match";
  }

  finalScore.textContent =
    state.score;

  bestScore.textContent =
    state.best;

  result.classList.remove("hidden");

  setMessage(
    "Match terminé !"
  );
}


// =========================
// RESTART
// =========================

function restart() {
  state.shot = 1;
  state.score = 0;
  state.combo = 0;
  state.locked = false;
  state.aim = null;
  state.power = 0;
  state.direction = 1;

  result.classList.add("hidden");

  resetBall();
  resetKeeper();
  resetTarget();

  setMessage(
    "Clique dans la cage pour tirer ⚽"
  );

  updateUI();
}


// =========================
// EVENEMENTS
// =========================

// Clic dans la cage = tir
goal.addEventListener(
  "click",
  aim
);

// Bouton recommencer
restartButton.addEventListener(
  "click",
  restart
);


// =========================
// INITIALISATION
// =========================

updateUI();

setMessage(
  "Clique dans la cage pour tirer ⚽"
);

resetBall();
resetKeeper();
resetTarget();

requestAnimationFrame(
  animateMeter
);
