const MAX_SHOTS = 10;
const HISTORY_SIZE = 5;

const state = {
  shot: 1,
  score: 0,
  combo: 0,
  history: [],
  locked: false,
  bestScore: Number(localStorage.getItem("penaltyMindBest") || 0)
};

const keeper = document.getElementById("keeper");
const ball = document.getElementById("ball");
const message = document.getElementById("message");
const shotNumber = document.getElementById("shotNumber");
const scoreElement = document.getElementById("score");
const comboElement = document.getElementById("combo");
const controls = document.getElementById("controls");
const result = document.getElementById("result");
const finalScore = document.getElementById("finalScore");
const bestScore = document.getElementById("bestScore");
const resultTitle = document.getElementById("resultTitle");

const positions = {
  left: "27%",
  center: "50%",
  right: "73%"
};

function randomDirection() {
  const directions = ["left", "center", "right"];
  return directions[Math.floor(Math.random() * directions.length)];
}

function goalkeeperChooseDirection() {
  if (state.history.length === 0) {
    return randomDirection();
  }

  const counts = {
    left: 0,
    center: 0,
    right: 0
  };

  for (const direction of state.history) {
    counts[direction]++;
  }

  const max = Math.max(
    counts.left,
    counts.center,
    counts.right
  );

  const mostUsed = Object.keys(counts).filter(
    direction => counts[direction] === max
  );

  const predicted =
    mostUsed[Math.floor(Math.random() * mostUsed.length)];

  const learningStrength =
    Math.min(0.35 + state.shot * 0.055, 0.9);

  if (Math.random() < learningStrength) {
    return predicted;
  }

  return randomDirection();
}

function getPoints(direction) {
  const basePoints = direction === "center" ? 80 : 120;
  return basePoints + state.combo * 25;
}

function updateUI() {
  shotNumber.textContent = state.shot;
  scoreElement.textContent = state.score;
  comboElement.textContent = state.combo;
}

function disableButtons(value) {
  document.querySelectorAll(".shot-btn").forEach(button => {
    button.disabled = value;
  });
}

function resetBall() {
  ball.style.left = "50%";
  ball.style.bottom = "65px";
  ball.style.transform = "translateX(-50%)";

  keeper.style.left = "50%";
}

function shoot(direction) {
  if (state.locked || state.shot > MAX_SHOTS) {
    return;
  }

  state.locked = true;
  disableButtons(true);

  const goalkeeperDirection =
    goalkeeperChooseDirection();

  const scored =
    direction !== goalkeeperDirection;

  let points = 0;

  if (scored) {
    points = getPoints(direction);
    state.score += points;
    state.combo++;
  } else {
    state.combo = 0;
  }

  state.history.push(direction);

  if (state.history.length > HISTORY_SIZE) {
    state.history.shift();
  }

  // Animation du ballon
  ball.style.left = positions[direction];
  ball.style.bottom = "285px";
  ball.style.transform =
    "translateX(-50%) scale(0.7) rotate(360deg)";

  // Animation du gardien
  keeper.style.left = positions[goalkeeperDirection];

  if (scored) {
    message.textContent =
      `⚽ BUT ! +${points} points`;
  } else {
    message.textContent =
      "🧤 ARRÊT ! Le gardien t'a lu";
  }

  updateUI();

  setTimeout(() => {
    if (state.shot >= MAX_SHOTS) {
      finishGame();
      return;
    }

    state.shot++;

    state.locked = false;
    disableButtons(false);

    resetBall();

    message.textContent =
      `Tir ${state.shot} : choisis ta direction`;

    updateUI();

  }, 1100);
}

function finishGame() {
  state.locked = true;

  if (state.score > state.bestScore) {
    state.bestScore = state.score;

    localStorage.setItem(
      "penaltyMindBest",
      state.bestScore
    );

    resultTitle.textContent =
      "🏆 Nouveau record !";
  } else {
    resultTitle.textContent =
      "🏁 Fin de partie";
  }

  finalScore.textContent = state.score;
  bestScore.textContent = state.bestScore;

  controls.classList.add("hidden");
  result.classList.remove("hidden");

  message.textContent = "Partie terminée";
}

function restart() {
  state.shot = 1;
  state.score = 0;
  state.combo = 0;
  state.history = [];
  state.locked = false;

  result.classList.add("hidden");
  controls.classList.remove("hidden");

  disableButtons(false);
  resetBall();

  message.textContent =
    "Choisis une direction";

  updateUI();
}

document.querySelectorAll(".shot-btn").forEach(button => {
  button.addEventListener("click", () => {
    shoot(button.dataset.direction);
  });
});

document
  .getElementById("restartBtn")
  .addEventListener("click", restart);

updateUI();
