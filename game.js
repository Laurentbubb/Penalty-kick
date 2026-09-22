document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    console.log("PenaltyMind : nouveau game.js chargé");

    /* =========================
       OUTILS
    ========================= */

    function get(id) {
        return document.getElementById(id);
    }

    function onClick(id, callback) {
        const element = get(id);

        if (!element) {
            console.warn("Bouton absent :", id);
            return;
        }

        element.addEventListener("click", callback);
    }

    function show(id) {
        document.querySelectorAll(".screen").forEach(function (screen) {
            screen.classList.add("hidden-screen");
        });

        const screen = get(id);

        if (screen) {
            screen.classList.remove("hidden-screen");
        }
    }

    /* =========================
       ÉTAT
    ========================= */

    let score = 0;
    let shots = 0;
    let combo = 0;
    let bestCombo = 0;
    let trainingMode = false;
    let shooting = false;

    const MAX_SHOTS = 10;

    /* =========================
       STATS
    ========================= */

    let totalGoals =
        Number(localStorage.getItem("pm_goals")) || 0;

    let totalShots =
        Number(localStorage.getItem("pm_shots")) || 0;

    let totalSaves =
        Number(localStorage.getItem("pm_saves")) || 0;

    let globalBestCombo =
        Number(localStorage.getItem("pm_best_combo")) || 0;

    function saveStats() {
        localStorage.setItem("pm_goals", totalGoals);
        localStorage.setItem("pm_shots", totalShots);
        localStorage.setItem("pm_saves", totalSaves);
        localStorage.setItem("pm_best_combo", globalBestCombo);
    }

    /* =========================
       XP
    ========================= */

    let xp =
        Number(localStorage.getItem("pm_xp")) || 0;

    let level =
        Number(localStorage.getItem("pm_level")) || 1;

    function saveXP() {
        localStorage.setItem("pm_xp", xp);
        localStorage.setItem("pm_level", level);
    }

    function addXP(amount) {
        xp += amount;

        const needed = level * 500;

        if (xp >= needed) {
            xp -= needed;
            level++;

            playSound("level");
        }

        saveXP();
        updateXP();
    }

    function updateXP() {
        const levelElements = [
            get("levelText"),
            get("menuLevel"),
            get("levelValue")
        ];

        levelElements.forEach(function (element) {
            if (element) {
                element.textContent = "Niveau " + level;
            }
        });

        const xpElements = [
            get("xpText"),
            get("menuXP"),
            get("xpValue")
        ];

        xpElements.forEach(function (element) {
            if (element) {
                element.textContent = xp + " XP";
            }
        });

        const bars = [
            get("xpBar"),
            get("xpProgress")
        ];

        bars.forEach(function (bar) {
            if (bar) {
                const percentage =
                    Math.min(
                        100,
                        (xp / (level * 500)) * 100
                    );

                bar.style.width =
                    percentage + "%";
            }
        });
    }

    /* =========================
       AUDIO
    ========================= */

    let audioContext = null;

    let audioEnabled =
        localStorage.getItem("pm_audio") !== "off";

    function startAudio() {
        if (!audioEnabled) {
            return;
        }

        if (!audioContext) {
            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;

            if (AudioContext) {
                audioContext =
                    new AudioContext();
            }
        }

        if (
            audioContext &&
            audioContext.state === "suspended"
        ) {
            audioContext.resume();
        }
    }

    function tone(frequency, duration) {
        if (!audioEnabled || !audioContext) {
            return;
        }

        try {
            const oscillator =
                audioContext.createOscillator();

            const gain =
                audioContext.createGain();

            oscillator.frequency.value =
                frequency;

            oscillator.type = "sine";

            gain.gain.value = 0.06;

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start();

            oscillator.stop(
                audioContext.currentTime +
                duration
            );
        } catch (error) {
            console.log("Audio indisponible");
        }
    }

    function playSound(type) {
        startAudio();

        if (type === "goal") {
            tone(500, 0.12);

            setTimeout(function () {
                tone(700, 0.15);
            }, 100);
        }

        if (type === "save") {
            tone(160, 0.2);
        }

        if (type === "kick") {
            tone(100, 0.08);
        }

        if (type === "level") {
            tone(500, 0.1);

            setTimeout(function () {
                tone(700, 0.1);
            }, 100);

            setTimeout(function () {
                tone(900, 0.15);
            }, 200);
        }
    }

    /* =========================
       ELEMENTS DU JEU
    ========================= */

    const goal = get("goal");
    const ball = get("ball");
    const keeper = get("keeper");

    /* =========================
       AFFICHAGE JEU
    ========================= */

    function updateGame() {
        if (get("scoreText")) {
            get("scoreText").textContent =
                score;
        }

        if (get("shotText")) {
            get("shotText").textContent =
                shots + "/" + MAX_SHOTS;
        }

        if (get("comboText")) {
            get("comboText").textContent =
                "Combo : " + combo;
        }
    }

    /* =========================
       RESET
    ========================= */

    function resetGame(training) {
        score = 0;
        shots = 0;
        combo = 0;
        bestCombo = 0;
        shooting = false;
        trainingMode = !!training;

        hideResult();

        resetBall();
        resetKeeper();

        updateGame();

        if (trainingMode) {
            show("trainingScreen");
        } else {
            show("gameScreen");
        }
    }

    function resetBall() {
        if (!ball) {
            return;
        }

        ball.style.transform =
            "translate(-50%, 0)";

        ball.classList.remove(
            "shooting",
            "goal",
            "miss"
        );
    }

    function resetKeeper() {
        if (!keeper) {
            return;
        }

        keeper.style.transform =
            "translateX(-50%)";

        keeper.classList.remove(
            "dive",
            "save"
        );
    }

    /* =========================
       TIR
    ========================= */

    function shoot(direction) {
        if (shooting) {
            return;
        }

        if (shots >= MAX_SHOTS) {
            finishGame();
            return;
        }

        shooting = true;

        startAudio();
        playSound("kick");

        shots++;
        totalShots++;

        let keeperDirection =
            Math.floor(Math.random() * 3);

        const keeperNames = [
            "left",
            "center",
            "right"
        ];

        keeperDirection =
            keeperNames[keeperDirection];

        let chance = 0.72;

        if (
            direction === keeperDirection
        ) {
            chance = 0.30;
        }

        const scored =
            Math.random() < chance;

        animateShot(
            direction,
            keeperDirection,
            scored
        );
    }

    function animateShot(
        direction,
        keeperDirection,
        scored
    ) {
        if (ball) {
            let x = "-50%";

            if (direction === "left") {
                x = "-120%";
            }

            if (direction === "right") {
                x = "20%";
            }

            ball.style.transform =
                "translate(" +
                x +
                ", -300px)";
        }

        if (keeper) {
            let x = "-50%";

            if (keeperDirection === "left") {
                x = "-140%";
            }

            if (keeperDirection === "right") {
                x = "40%";
            }

            keeper.style.transform =
                "translateX(" +
                x +
                ")";
        }

        setTimeout(function () {
            if (scored) {
                goalScored();
            } else {
                goalSaved();
            }
        }, 600);
    }

    /* =========================
       BUT
    ========================= */

    function goalScored() {
        const points =
            100 + combo * 25;

        score += points;

        combo++;

        bestCombo =
            Math.max(
                bestCombo,
                combo
            );

        totalGoals++;

        globalBestCombo =
            Math.max(
                globalBestCombo,
                combo
            );

        addXP(50);

        playSound("goal");

        if (ball) {
            ball.classList.add("goal");
        }

        updateGame();

        showResult(
            "⚽ BUT !",
            "+" + points + " points"
        );

        saveStats();

        setTimeout(function () {
            nextShot();
        }, 900);
    }

    /* =========================
       ARRÊT
    ========================= */

    function goalSaved() {
        combo = 0;

        totalSaves++;

        playSound("save");

        if (ball) {
            ball.classList.add("miss");
        }

        if (keeper) {
            keeper.classList.add("dive");
        }

        updateGame();

        showResult(
            "🧤 ARRÊT !",
            "Le gardien a arrêté ton tir."
        );

        saveStats();

        setTimeout(function () {
            nextShot();
        }, 900);
    }

    /* =========================
       TIR SUIVANT
    ========================= */

    function nextShot() {
        hideResult();

        resetBall();
        resetKeeper();

        shooting = false;

        if (shots >= MAX_SHOTS) {
            finishGame();
            return;
        }

        updateGame();
    }

    /* =========================
       FIN
    ========================= */

    function finishGame() {
        shooting = true;

        saveStats();

        addXP(
            Math.max(
                50,
                score
            )
        );

        showResult(
            "🏆 MATCH TERMINÉ",
            "Score final : " + score
        );
    }

    /* =========================
       RESULTAT
    ========================= */

    function showResult(title, message) {
        const result = get("result");

        if (!result) {
            return;
        }

        if (get("resultTitle")) {
            get("resultTitle").textContent =
                title;
        }

        if (get("resultText")) {
            get("resultText").textContent =
                message;
        }

        result.classList.remove("hidden");
    }

    function hideResult() {
        const result = get("result");

        if (result) {
            result.classList.add("hidden");
        }
    }

    /* =========================
       CLIC SUR LE BUT
    ========================= */

    if (goal) {
        goal.addEventListener(
            "pointerdown",
            function (event) {
                event.preventDefault();

                const rectangle =
                    goal.getBoundingClientRect();

                const position =
                    (
                        event.clientX -
                        rectangle.left
                    ) / rectangle.width;

                let direction =
                    "center";

                if (position < 0.33) {
                    direction = "left";
                }

                if (position > 0.66) {
                    direction = "right";
                }

                shoot(direction);
            }
        );
    }

    /* =========================
       MENU
    ========================= */

    onClick(
        "playButton",
        function () {
            resetGame(false);
        }
    );

    onClick(
        "trainingButton",
        function () {
            resetGame(true);
        }
    );

    onClick(
        "dailyButton",
        function () {
            renderDaily();
            show("dailyScreen");
        }
    );

    onClick(
        "statsButton",
        function () {
            updateStats();
            show("statsScreen");
        }
    );

    onClick(
        "settingsButton",
        function () {
            show("settingsScreen");
        }
    );

    /* =========================
       RETOUR MENU
    ========================= */

    document
        .querySelectorAll(
            "[data-back-menu]"
        )
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    hideResult();
                    show("menuScreen");
                }
            );
        });

    onClick(
        "backButton",
        function () {
            hideResult();
            show("menuScreen");
        }
    );

    onClick(
        "backMenuButton",
        function () {
            hideResult();
            show("menuScreen");
        }
    );

    /* =========================
       RESTART
    ========================= */

    onClick(
        "restartButton",
        function () {
            resetGame(trainingMode);
        }
    );

    onClick(
        "nextButton",
        function () {
            nextShot();
        }
    );

    /* =========================
       SON
    ========================= */

    function updateSoundButton() {
        const text =
            audioEnabled
                ? "🔊 Son : ON"
                : "🔇 Son : OFF";

        if (get("soundButton")) {
            get("soundButton").textContent =
                text;
        }

        if (get("audioButton")) {
            get("audioButton").textContent =
                text;
        }
    }

    function toggleAudio() {
        audioEnabled =
            !audioEnabled;

        localStorage.setItem(
            "pm_audio",
            audioEnabled
                ? "on"
                : "off"
        );

        if (audioEnabled) {
            startAudio();
        }

        updateSoundButton();
    }

    onClick(
        "soundButton",
        toggleAudio
    );

    onClick(
        "audioButton",
        toggleAudio
    );

    /* =========================
       STATS
    ========================= */

    function updateStats() {
        const values = {
            statsGoals: totalGoals,
            statsSaves: totalSaves,
            statsShots: totalShots,
            statsBestCombo: globalBestCombo
        };

        Object.keys(values).forEach(
            function (id) {
                const element = get(id);

                if (element) {
                    element.textContent =
                        values[id];
                }
            }
        );

        const accuracy =
            totalShots > 0
                ? Math.round(
                    totalGoals /
                    totalShots *
                    100
                )
                : 0;

        if (get("statsAccuracy")) {
            get("statsAccuracy")
                .textContent =
                accuracy + "%";
        }
    }

    /* =========================
       DÉFIS
    ========================= */

    function renderDaily() {
        const container =
            get("dailyChallenges");

        if (!container) {
            return;
        }

        const challenges = [
            {
                title: "⚽ Buteur",
                text: "Marque 5 buts",
                progress: totalGoals,
                target: 5
            },
            {
                title: "🎯 Tireur",
                text: "Tire 10 penalties",
                progress: totalShots,
                target: 10
            },
            {
                title: "🔥 Combo",
                text: "Atteins un combo de 4",
                progress: globalBestCombo,
                target: 4
            }
        ];

        container.innerHTML = "";

        challenges.forEach(
            function (challenge) {
                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "daily-card";

                const progress =
                    Math.min(
                        challenge.progress,
                        challenge.target
                    );

                card.innerHTML = `
                    <div>
                        <h3>${challenge.title}</h3>
                        <p>${challenge.text}</p>
                    </div>

                    <div>
                        <strong>
                            ${progress}/${challenge.target}
                        </strong>
                        <span>
                            +100 XP
                        </span>
                    </div>
                `;

                if (
                    progress >=
                    challenge.target
                ) {
                    card.classList.add(
                        "completed"
                    );
                }

                container.appendChild(card);
            }
        );
    }

    /* =========================
       RESET PROGRESSION
    ========================= */

    onClick(
        "resetButton",
        function () {
            const confirmation =
                window.confirm(
                    "Veux-tu vraiment supprimer toute ta progression ?"
                );

            if (!confirmation) {
                return;
            }

            localStorage.removeItem(
                "pm_goals"
            );

            localStorage.removeItem(
                "pm_shots"
            );

            localStorage.removeItem(
                "pm_saves"
            );

            localStorage.removeItem(
                "pm_best_combo"
            );

            localStorage.removeItem(
                "pm_xp"
            );

            localStorage.removeItem(
                "pm_level"
            );

            totalGoals = 0;
            totalShots = 0;
            totalSaves = 0;
            globalBestCombo = 0;
            xp = 0;
            level = 1;

            updateXP();
            updateStats();
            renderDaily();

            show("menuScreen");
        }
    );

    /* =========================
       CLAVIER
    ========================= */

    document.addEventListener(
        "keydown",
        function (event) {
            if (shooting) {
                return;
            }

            if (event.key === "ArrowLeft") {
                shoot("left");
            }

            if (event.key === "ArrowUp") {
                shoot("center");
            }

            if (event.key === "ArrowRight") {
                shoot("right");
            }
        }
    );

    /* =========================
       DÉMARRAGE
    ========================= */

    updateXP();
    updateStats();
    renderDaily();
    updateSoundButton();
    updateGame();

    show("menuScreen");

    console.log(
        "PenaltyMind : jeu prêt"
    );
});
