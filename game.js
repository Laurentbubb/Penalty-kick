// ============================================================
// PENALTYMIND
// Prototype complet
// ============================================================

const $ = (id) => document.getElementById(id);

const screens = {
    menu: $("mainMenu"),
    game: $("gameScreen"),
    training: $("trainingScreen"),
    daily: $("dailyScreen"),
    stats: $("statsScreen"),
    settings: $("settingsScreen")
};


// ============================================================
// DONNEES
// ============================================================

let save = JSON.parse(localStorage.getItem("penaltymind_save")) || {
    level: 1,
    xp: 0,
    bestScore: 0,

    goals: 0,
    saves: 0,
    shots: 0,
    bestCombo: 0,

    sound: true,

    daily: {
        goals: 0,
        shots: 0,
        perfect: 0
    }
};


let game = {
    shots: 0,
    maxShots: 5,
    score: 0,
    combo: 0,

    targetX: 50,
    targetY: 23,

    power: 50,

    playing: false,
    training: false,

    powerDirection: 1,
    powerTimer: null
};


// ============================================================
// SAUVEGARDE
// ============================================================

function saveGame() {
    localStorage.setItem(
        "penaltymind_save",
        JSON.stringify(save)
    );
}


// ============================================================
// ECRANS
// ============================================================

function showScreen(screen) {

    Object.values(screens).forEach(s => {
        if (s) s.classList.add("hidden");
    });

    screen.classList.remove("hidden");
}


function goMenu() {
    stopPower();
    game.playing = false;

    $("result").classList.add("hidden-result");

    showScreen(screens.menu);

    updateMenu();
}


// ============================================================
// XP
// ============================================================

function xpNeeded() {
    return save.level * 100;
}


function addXP(amount) {

    save.xp += amount;

    while (save.xp >= xpNeeded()) {
        save.xp -= xpNeeded();
        save.level++;

        showFloatingMessage(
            "LEVEL UP ! 🎉"
        );
    }

    saveGame();
    updateMenu();
}


function updateMenu() {

    $("menuLevel").textContent = save.level;

    $("menuXP").textContent = save.xp;

    $("menuXPNeeded").textContent = xpNeeded();

    const percentage =
        Math.min(100, (save.xp / xpNeeded()) * 100);

    $("menuXPFill").style.width =
        percentage + "%";

    $("menuBestScore").textContent =
        save.bestScore;

    updateStats();
    updateDaily();
}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    $("statBestScore").textContent =
        save.bestScore;

    $("statGoals").textContent =
        save.goals;

    $("statSaves").textContent =
        save.saves;

    $("statCombo").textContent =
        save.bestCombo;

    $("statShots").textContent =
        save.shots;

    const accuracy =
        save.shots === 0
            ? 0
            : Math.round(
                (save.goals / save.shots) * 100
            );

    $("statAccuracy").textContent =
        accuracy + "%";
}


// ============================================================
// QUETES
// ============================================================

function updateDaily() {

    const challenges = [

        {
            icon: "⚽",
            name: "Marquer 3 buts",
            progress: Math.min(save.daily.goals, 3),
            max: 3,
            xp: 50
        },

        {
            icon: "🎯",
            name: "Tirer 10 fois",
            progress: Math.min(save.daily.shots, 10),
            max: 10,
            xp: 40
        },

        {
            icon: "🔥",
            name: "Faire un tir parfait",
            progress: Math.min(save.daily.perfect, 1),
            max: 1,
            xp: 75
        }

    ];

    const container =
        $("dailyChallengesList");

    container.innerHTML = "";

    let completed = 0;

    challenges.forEach(challenge => {

        const done =
            challenge.progress >= challenge.max;

        if (done) {
            completed++;
        }

        const element =
            document.createElement("div");

        element.className =
            "challenge" +
            (done ? " done" : "");

        element.innerHTML = `

            <div class="challenge-info">

                <strong>
                    ${challenge.icon}
                    ${challenge.name}
                </strong>

                <small>
                    ${challenge.progress}/${challenge.max}
                    ${done ? " • TERMINÉ ✓" : ""}
                </small>

            </div>

            <div class="challenge-xp">
                +${challenge.xp} XP
            </div>
        `;

        container.appendChild(element);
    });

    $("dailyCompletedCount").textContent =
        completed;
}


// ============================================================
// JEU
// ============================================================

function startGame(training = false) {

    game.shots = 0;
    game.score = 0;
    game.combo = 0;
    game.playing = true;
    game.training = training;

    $("score").textContent = "0";
    $("combo").textContent = "0🔥";

    $("gameSubtitle").textContent =
        training
            ? "MODE ENTRAÎNEMENT"
            : "MODE CLASSIQUE";

    $("result").classList.add("hidden-result");

    showScreen(screens.game);

    nextShot();
}


function nextShot() {

    if (!game.playing) return;

    if (
        !game.training &&
        game.shots >= game.maxShots
    ) {
        finishGame();
        return;
    }

    game.shots++;

    $("shotNumber").textContent =
        game.shots;

    $("message").textContent =
        "PLACE LA CIBLE DANS LA CAGE";

    resetBall();

    moveTarget();

    resetKeeper();

    startPower();

    updateDailyShots();
}


function resetBall() {

    const ball = $("ball");

    ball.style.left = "50%";
    ball.style.bottom = "7%";
    ball.style.transform =
        "translateX(-50%) scale(1)";

    ball.style.transition =
        "none";
}


function moveTarget() {

    // zone réellement atteignable dans la cage
    game.targetX =
        27 + Math.random() * 46;

    game.targetY =
        13 + Math.random() * 27;

    const target =
        $("targetDot");

    target.style.left =
        game.targetX + "%";

    target.style.top =
        game.targetY + "%";
}


function resetKeeper() {

    const keeper =
        $("keeper");

    keeper.style.transform =
        "translateX(-50%)";
}


// ============================================================
// JAUGE DE PUISSANCE
// ============================================================

function startPower() {

    stopPower();

    game.power = 20;
    game.powerDirection = 1;

    game.powerTimer =
        setInterval(() => {

            game.power +=
                game.powerDirection * 1.8;

            if (game.power >= 100) {
                game.power = 100;
                game.powerDirection = -1;
            }

            if (game.power <= 5) {
                game.power = 5;
                game.powerDirection = 1;
            }

            updatePower();

        }, 25);
}


function stopPower() {

    if (game.powerTimer) {
        clearInterval(game.powerTimer);
        game.powerTimer = null;
    }
}


function updatePower() {

    $("needle").style.left =
        game.power + "%";

    $("powerValue").textContent =
        Math.round(game.power) + "%";
}


// ============================================================
// TIR
// ============================================================

function shoot() {

    if (!game.playing) return;

    stopPower();

    const power =
        game.power;

    const perfect =
        power >= 78 &&
        power <= 92;

    const good =
        power >= 58 &&
        power <= 97;

    const target =
        $("targetDot");

    const ball =
        $("ball");

    // Le gardien choisit une zone
    // proche mais pas toujours parfaite
    const keeperDirection =
        Math.random();

    let keeperX;

    if (keeperDirection < .33) {
        keeperX = 28;
    } else if (keeperDirection < .66) {
        keeperX = 50;
    } else {
        keeperX = 72;
    }

    const distance =
        Math.abs(
            game.targetX - keeperX
        );

    let saved = false;

    // Le gardien a davantage de chances
    // si le tir arrive dans sa zone
    if (distance < 12) {

        const saveChance =
            perfect ? .18 : .48;

        saved =
            Math.random() < saveChance;
    }

    // animation cible
    target.style.opacity = "0";

    // animation du ballon
    ball.style.transition =
        "all .55s cubic-bezier(.15,.8,.25,1)";

    ball.style.left =
        game.targetX + "%";

    ball.style.bottom =
        "62%";

    ball.style.transform =
        "translateX(-50%) scale(.45)";

    // mouvement gardien
    const keeper =
        $("keeper");

    if (saved) {

        const direction =
            game.targetX < 50
                ? -1
                : 1;

        keeper.style.transform =
            `translateX(calc(-50% + ${direction * 75}px)) rotate(${direction * 15}deg)`;

    } else {

        keeper.style.transform =
            `translateX(-50%)`;
    }

    setTimeout(() => {

        target.style.opacity = "1";

        if (saved) {

            onSave();

        } else {

            onGoal(perfect, good);
        }

    }, 600);
}


// ============================================================
// BUT
// ============================================================

function onGoal(perfect, good) {

    game.combo++;

    save.goals++;
    save.shots++;

    if (game.combo > save.bestCombo) {
        save.bestCombo =
            game.combo;
    }

    let points = 100;

    if (good) {
        points += 50;
    }

    if (perfect) {
        points += 150;
        save.daily.perfect++;
    }

    points +=
        game.combo * 25;

    game.score += points;

    $("score").textContent =
        game.score;

    $("combo").textContent =
        game.combo + "🔥";

    $("message").textContent =
        perfect
            ? "🎯 TIR PARFAIT ! +"+points
            : "⚽ BUT ! +"+points;

    addXP(
        perfect ? 20 : 10
    );

    save.daily.goals++;

    saveGame();
    updateDaily();

    setTimeout(() => {

        if (game.training) {

            nextShot();

        } else {

            nextShot();
        }

    }, 850);
}


// ============================================================
// ARRET
// ============================================================

function onSave() {

    game.combo = 0;

    save.saves++;
    save.shots++;

    $("combo").textContent =
        "0🔥";

    $("message").textContent =
        "🧤 ARRÊT DU GARDIEN !";

    saveGame();

    setTimeout(() => {
        nextShot();
    }, 850);
}


// ============================================================
// FIN DE PARTIE
// ============================================================

function finishGame() {

    game.playing = false;

    stopPower();

    if (
        game.score >
        save.bestScore
    ) {
        save.bestScore =
            game.score;

        $("resultTitle").textContent =
            "🏆 NOUVEAU RECORD !";

    } else {

        $("resultTitle").textContent =
            "BIEN JOUÉ !";
    }

    $("finalScore").textContent =
        game.score;

    $("bestScore").textContent =
        save.bestScore;

    saveGame();

    updateMenu();

    $("result").classList.remove(
        "hidden-result"
    );
}


// ============================================================
// MESSAGE
// ============================================================

function showFloatingMessage(text) {

    $("message").textContent =
        text;
}


// ============================================================
// QUETES
// ============================================================

function updateDailyShots() {

    save.daily.shots++;

    saveGame();
    updateDaily();
}


// ============================================================
// SON
// ============================================================

let audioContext = null;

function playSound(type) {

    if (!save.sound) return;

    try {

        if (!audioContext) {
            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
        }

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        if (type === "goal") {

            oscillator.frequency.value = 620;

        } else {

            oscillator.frequency.value = 180;
        }

        gain.gain.value = .04;

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + .12
        );

    } catch (e) {}
}


// ============================================================
// EVENEMENTS MENU
// ============================================================

$("playButton").addEventListener(
    "click",
    () => startGame(false)
);

$("trainingButton").addEventListener(
    "click",
    () => showScreen(screens.training)
);

$("dailyButton").addEventListener(
    "click",
    () => {
        updateDaily();
        showScreen(screens.daily);
    }
);

$("statsButton").addEventListener(
    "click",
    () => {
        updateStats();
        showScreen(screens.stats);
    }
);

$("settingsButton").addEventListener(
    "click",
    () => showScreen(screens.settings)
);


// ============================================================
// RETOURS MENU
// ============================================================

$("backToMenuButton").addEventListener(
    "click",
    goMenu
);

document
    .querySelectorAll("[data-back-menu]")
    .forEach(button => {

        button.addEventListener(
            "click",
            goMenu
        );
    });

$("resultMenuButton").addEventListener(
    "click",
    goMenu
);


// ============================================================
// REJOUER
// ============================================================

$("restartButton").addEventListener(
    "click",
    () => startGame(game.training)
);


// ============================================================
// TIR
// ============================================================

$("shootButton").addEventListener(
    "click",
    shoot
);

$("powerMeter").addEventListener(
    "click",
    shoot
);


// ============================================================
// ENTRAINEMENT
// ============================================================

$("startTrainingButton").addEventListener(
    "click",
    () => startGame(true)
);


// ============================================================
// SON
// ============================================================

$("soundButton").addEventListener(
    "click",
    () => {

        save.sound =
            !save.sound;

        saveGame();

        $("soundButton").textContent =
            save.sound ? "🔊" : "🔇";
    }
);

$("settingsSoundButton").addEventListener(
    "click",
    () => {

        save.sound =
            !save.sound;

        saveGame();

        $("settingsSoundButton").textContent =
            save.sound
                ? "🔊 SON : ACTIVÉ"
                : "🔇 SON : DÉSACTIVÉ";
    }
);


// ============================================================
// RESET
// ============================================================

$("resetStatsButton").addEventListener(
    "click",
    () => {

        const confirmed =
            confirm(
                "Réinitialiser toute ta progression ?"
            );

        if (!confirmed) return;

        save = {
            level: 1,
            xp: 0,
            bestScore: 0,

            goals: 0,
            saves: 0,
            shots: 0,
            bestCombo: 0,

            sound: true,

            daily: {
                goals: 0,
                shots: 0,
                perfect: 0
            }
        };

        saveGame();
        updateMenu();

        alert(
            "Progression réinitialisée."
        );
    }
);


// ============================================================
// INITIALISATION
// ============================================================

updateMenu();

showScreen(screens.menu);
