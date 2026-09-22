/* =========================================================
   PENALTYMIND - GAME.JS
   Version complète et robuste
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       OUTILS
       ===================================================== */

    const $ = (id) => document.getElementById(id);

    function safeClick(id, callback) {
        const element = $(id);

        if (!element) {
            console.warn(`Élément introuvable : #${id}`);
            return;
        }

        element.addEventListener("click", callback);
    }

    function showScreen(screenId) {
        document.querySelectorAll(".screen").forEach(screen => {
            screen.classList.add("hidden-screen");
        });

        const screen = $(screenId);

        if (screen) {
            screen.classList.remove("hidden-screen");
        } else {
            console.error(`Écran introuvable : #${screenId}`);
        }
    }

    /* =====================================================
       ÉLÉMENTS
       ===================================================== */

    const menuScreen = $("menuScreen");
    const gameScreen = $("gameScreen");
    const trainingScreen = $("trainingScreen");
    const dailyScreen = $("dailyScreen");
    const statsScreen = $("statsScreen");
    const settingsScreen = $("settingsScreen");

    const goal = $("goal");
    const keeper = $("keeper");
    const ball = $("ball");
    const result = $("result");

    const scoreText = $("scoreText");
    const shotText = $("shotText");
    const comboText = $("comboText");

    const resultTitle = $("resultTitle");
    const resultText = $("resultText");

    const powerBar = $("powerBar");
    const powerText = $("powerText");

    /* =====================================================
       ÉTAT DU JEU
       ===================================================== */

    const MAX_SHOTS = 10;

    let game = {
        shot: 0,
        score: 0,
        combo: 0,
        bestCombo: 0,
        locked: false,
        power: 50,
        aim: "center",
        training: false
    };

    /* =====================================================
       LOCAL STORAGE
       ===================================================== */

    function getNumber(key, defaultValue = 0) {
        const value = Number(localStorage.getItem(key));

        return Number.isFinite(value) ? value : defaultValue;
    }

    function setNumber(key, value) {
        localStorage.setItem(key, String(value));
    }

    let stats = {
        goals: getNumber("penaltyMindGoals"),
        saves: getNumber("penaltyMindSaves"),
        shots: getNumber("penaltyMindShots"),
        bestCombo: getNumber("penaltyMindBestCombo"),
        trainingGoals: getNumber("penaltyMindTrainingGoals"),
        trainingShots: getNumber("penaltyMindTrainingShots")
    };

    function saveStats() {
        setNumber("penaltyMindGoals", stats.goals);
        setNumber("penaltyMindSaves", stats.saves);
        setNumber("penaltyMindShots", stats.shots);
        setNumber("penaltyMindBestCombo", stats.bestCombo);
        setNumber("penaltyMindTrainingGoals", stats.trainingGoals);
        setNumber("penaltyMindTrainingShots", stats.trainingShots);
    }

    /* =====================================================
       XP / NIVEAUX
       ===================================================== */

    let xp = getNumber("penaltyMindXP");
    let level = getNumber("penaltyMindLevel", 1);

    if (level < 1) {
        level = 1;
    }

    function xpNeeded(currentLevel) {
        return currentLevel * 500;
    }

    function saveProgression() {
        setNumber("penaltyMindXP", xp);
        setNumber("penaltyMindLevel", level);
    }

    function addXP(amount) {
        xp += amount;

        let needed = xpNeeded(level);

        while (xp >= needed) {
            xp -= needed;
            level++;

            playSound("levelup");

            needed = xpNeeded(level);
        }

        saveProgression();
        updateXPDisplay();
    }

    function updateXPDisplay() {
        const xpElements = document.querySelectorAll(
            "#xpText, #menuXP, #xpValue"
        );

        xpElements.forEach(element => {
            element.textContent = `${xp} XP`;
        });

        const levelElements = document.querySelectorAll(
            "#levelText, #menuLevel, #levelValue"
        );

        levelElements.forEach(element => {
            element.textContent = `Niveau ${level}`;
        });

        const xpBars = document.querySelectorAll(
            "#xpBar, #xpProgress"
        );

        const percentage =
            Math.min(100, (xp / xpNeeded(level)) * 100);

        xpBars.forEach(bar => {
            if (bar.style) {
                bar.style.width = `${percentage}%`;
            }
        });
    }

    /* =====================================================
       SONS
       ===================================================== */

    let audioContext = null;

    function initAudio() {
        if (!audioContext) {
            try {
                audioContext = new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
            } catch (error) {
                console.warn("Audio non disponible.");
            }
        }

        if (
            audioContext &&
            audioContext.state === "suspended"
        ) {
            audioContext.resume().catch(() => {});
        }
    }

    function playTone(frequency, duration, type = "sine", volume = 0.08) {
        if (!audioContext) return;

        try {
            const oscillator =
                audioContext.createOscillator();

            const gain =
                audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.value = frequency;

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
        } catch (error) {
            console.warn("Erreur audio :", error);
        }
    }

    function playSound(type) {
        if (!audioEnabled) return;

        initAudio();

        if (type === "goal") {
            playTone(520, 0.12, "sine", 0.08);

            setTimeout(() => {
                playTone(700, 0.16, "sine", 0.07);
            }, 100);
        }

        if (type === "save") {
            playTone(180, 0.18, "sawtooth", 0.06);
        }

        if (type === "kick") {
            playTone(110, 0.08, "square", 0.05);
        }

        if (type === "levelup") {
            playTone(500, 0.1);
            setTimeout(() => playTone(650, 0.1), 100);
            setTimeout(() => playTone(800, 0.15), 200);
        }

        if (type === "click") {
            playTone(350, 0.04, "square", 0.025);
        }
    }

    let audioEnabled =
        localStorage.getItem("penaltyMindAudio") !== "off";

    /* =====================================================
       DÉFIS QUOTIDIENS
       ===================================================== */

    const challengePool = [
        {
            id: "goals5",
            title: "Finisseur",
            description: "Marquer 5 buts",
            type: "goals",
            target: 5,
            reward: 150
        },
        {
            id: "goals10",
            title: "Buteur",
            description: "Marquer 10 buts",
            type: "goals",
            target: 10,
            reward: 300
        },
        {
            id: "shots15",
            title: "Précision",
            description: "Tirer 15 penalties",
            type: "shots",
            target: 15,
            reward: 100
        },
        {
            id: "score1000",
            title: "Gros score",
            description: "Obtenir 1000 points",
            type: "score",
            target: 1000,
            reward: 250
        },
        {
            id: "combo4",
            title: "Série",
            description: "Faire un combo de 4",
            type: "combo",
            target: 4,
            reward: 200
        },
        {
            id: "combo6",
            title: "Machine",
            description: "Faire un combo de 6",
            type: "combo",
            target: 6,
            reward: 400
        }
    ];

    function getTodayString() {
        const date = new Date();

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function generateDailyChallenges() {
        const today = getTodayString();

        let hash = 0;

        for (let i = 0; i < today.length; i++) {
            hash =
                ((hash << 5) - hash) +
                today.charCodeAt(i);

            hash |= 0;
        }

        hash = Math.abs(hash);

        const selected = [];

        for (let i = 0; i < 3; i++) {
            const index =
                (hash + i * 7) %
                challengePool.length;

            selected.push({
                ...challengePool[index]
            });
        }

        return selected;
    }

    let dailyState;

    function loadDailyState() {
        const today = getTodayString();

        try {
            const saved =
                JSON.parse(
                    localStorage.getItem(
                        "penaltyMindDailyState"
                    )
                );

            if (
                saved &&
                saved.date === today
            ) {
                dailyState = saved;
                return;
            }
        } catch (error) {
            console.warn(
                "Sauvegarde des défis illisible."
            );
        }

        dailyState = {
            date: today,
            challenges: generateDailyChallenges(),
            goals: 0,
            shots: 0,
            score: 0,
            bestCombo: 0,
            completed: []
        };

        saveDailyState();
    }

    function saveDailyState() {
        localStorage.setItem(
            "penaltyMindDailyState",
            JSON.stringify(dailyState)
        );
    }

    function getChallengeProgress(challenge) {
        if (!challenge) return 0;

        if (challenge.type === "goals") {
            return dailyState.goals;
        }

        if (challenge.type === "shots") {
            return dailyState.shots;
        }

        if (challenge.type === "score") {
            return dailyState.score;
        }

        if (challenge.type === "combo") {
            return dailyState.bestCombo;
        }

        return 0;
    }

    function updateDailyChallenges() {
        if (!dailyState) return;

        dailyState.challenges.forEach(challenge => {

            const progress =
                getChallengeProgress(challenge);

            if (
                progress >= challenge.target &&
                !dailyState.completed.includes(challenge.id)
            ) {
                dailyState.completed.push(
                    challenge.id
                );

                addXP(challenge.reward);

                playSound("levelup");
            }
        });

        saveDailyState();
        renderDailyChallenges();
    }

    function renderDailyChallenges() {

        const container =
            document.querySelector(
                "#dailyChallenges"
            );

        if (!container || !dailyState) {
            return;
        }

        container.innerHTML = "";

        dailyState.challenges.forEach(challenge => {

            const progress =
                Math.min(
                    getChallengeProgress(challenge),
                    challenge.target
                );

            const completed =
                dailyState.completed.includes(
                    challenge.id
                );

            const card =
                document.createElement("div");

            card.className =
                completed
                    ? "daily-card completed"
                    : "daily-card";

            card.innerHTML = `
                <div>
                    <h3>${challenge.title}</h3>
                    <p>${challenge.description}</p>
                </div>

                <div>
                    <strong>
                        ${progress}/${challenge.target}
                    </strong>
                    <span>
                        +${challenge.reward} XP
                    </span>
                </div>
            `;

            container.appendChild(card);
        });
    }

    /* =====================================================
       STATS
       ===================================================== */

    function updateStatsScreen() {

        const mappings = {
            statsGoals: stats.goals,
            statsSaves: stats.saves,
            statsShots: stats.shots,
            statsBestCombo: stats.bestCombo,
            statsTrainingGoals: stats.trainingGoals,
            statsTrainingShots: stats.trainingShots
        };

        Object.entries(mappings).forEach(
            ([id, value]) => {

                const element = $(id);

                if (element) {
                    element.textContent = value;
                }
            }
        );

        const accuracy =
            stats.shots > 0
                ? Math.round(
                    (stats.goals / stats.shots) * 100
                )
                : 0;

        const accuracyElements =
            document.querySelectorAll(
                "#statsAccuracy, #accuracyText"
            );

        accuracyElements.forEach(element => {
            element.textContent = `${accuracy}%`;
        });
    }

    /* =====================================================
       JEU
       ===================================================== */

    function resetGame(training = false) {

        game = {
            shot: 0,
            score: 0,
            combo: 0,
            bestCombo: 0,
            locked: false,
            power: 50,
            aim: "center",
            training
        };

        if (result) {
            result.classList.add("hidden");
        }

        updateGameDisplay();
        resetBall();
        resetKeeper();
        resetPower();

        showScreen(
            training
                ? "trainingScreen"
                : "gameScreen"
        );
    }

    function updateGameDisplay() {

        if (scoreText) {
            scoreText.textContent =
                game.score;
        }

        if (shotText) {
            shotText.textContent =
                `${game.shot}/${MAX_SHOTS}`;
        }

        if (comboText) {
            comboText.textContent =
                `Combo : ${game.combo}`;
        }
    }

    function resetBall() {

        if (!ball) return;

        ball.style.transform =
            "translate(-50%, 0)";

        ball.classList.remove(
            "shooting",
            "goal",
            "miss"
        );
    }

    function resetKeeper() {

        if (!keeper) return;

        keeper.style.transform =
            "translateX(-50%)";

        keeper.classList.remove(
            "save",
            "dive"
        );
    }

    function resetPower() {

        game.power = 50;

        if (powerBar) {
            powerBar.style.width =
                "50%";
        }

        if (powerText) {
            powerText.textContent =
                "50%";
        }
    }

    /* =====================================================
       PUISSANCE
       ===================================================== */

    function setPower(value) {

        game.power =
            Math.max(
                0,
                Math.min(100, value)
            );

        if (powerBar) {
            powerBar.style.width =
                `${game.power}%`;
        }

        if (powerText) {
            powerText.textContent =
                `${Math.round(game.power)}%`;
        }
    }

    function randomizePower() {

        const power =
            Math.floor(
                Math.random() * 81
            ) + 20;

        setPower(power);
    }

    /* =====================================================
       TIR
       ===================================================== */

    function shoot(direction = "center") {

        if (game.locked) {
            return;
        }

        if (game.shot >= MAX_SHOTS) {
            finishGame();
            return;
        }

        initAudio();

        game.locked = true;
        game.aim = direction;

        game.shot++;

        stats.shots++;

        if (game.training) {
            stats.trainingShots++;
        }

        dailyState.shots++;

        randomizePower();

        playSound("kick");

        const keeperDirections = [
            "left",
            "center",
            "right"
        ];

        const keeperDirection =
            keeperDirections[
                Math.floor(
                    Math.random() *
                    keeperDirections.length
                )
            ];

        const baseChance =
            0.68;

        const powerBonus =
            game.power >= 45 &&
            game.power <= 85
                ? 0.15
                : 0;

        const directionBonus =
            direction === "center"
                ? 0
                : 0.05;

        let goalChance =
            baseChance +
            powerBonus +
            directionBonus;

        if (
            direction === keeperDirection
        ) {
            goalChance -= 0.35;
        }

        goalChance =
            Math.max(
                0.1,
                Math.min(
                    0.95,
                    goalChance
                )
            );

        const isGoal =
            Math.random() < goalChance;

        animateShot(
            direction,
            keeperDirection,
            isGoal
        );
    }

    function animateShot(
        direction,
        keeperDirection,
        isGoal
    ) {

        if (ball) {

            ball.classList.remove(
                "shooting",
                "goal",
                "miss"
            );

            ball.classList.add(
                "shooting"
            );

            const x =
                direction === "left"
                    ? "-130%"
                    : direction === "right"
                        ? "30%"
                        : "-50%";

            const y =
                direction === "center"
                    ? "-430px"
                    : "-360px";

            ball.style.transform =
                `translate(${x}, ${y})`;
        }

        if (keeper) {

            const x =
                keeperDirection === "left"
                    ? "-150%"
                    : keeperDirection === "right"
                        ? "50%"
                        : "-50%";

            keeper.style.transform =
                `translateX(${x})`;
        }

        setTimeout(() => {

            if (isGoal) {
                handleGoal();
            } else {
                handleSave();
            }

        }, 550);
    }

    /* =====================================================
       BUT
       ===================================================== */

    function handleGoal() {

        game.score +=
            100 + game.combo * 25;

        game.combo++;

        game.bestCombo =
            Math.max(
                game.bestCombo,
                game.combo
            );

        stats.goals++;

        if (game.training) {
            stats.trainingGoals++;
        }

        dailyState.goals++;

        dailyState.score =
            Math.max(
                dailyState.score,
                game.score
            );

        dailyState.bestCombo =
            Math.max(
                dailyState.bestCombo,
                game.combo
            );

        stats.bestCombo =
            Math.max(
                stats.bestCombo,
                game.combo
            );

        if (ball) {
            ball.classList.add("goal");
        }

        if (keeper) {
            keeper.classList.add("save");
        }

        playSound("goal");

        addXP(
            50 +
            game.combo * 10
        );

        showResult(
            "BUT ! ⚽",
            `+${100 + (game.combo - 1) * 25} points`
        );

        saveStats();
        saveDailyState();

        updateDailyChallenges();
        updateGameDisplay();

        game.locked = false;
    }

    /* =====================================================
       ARRÊT
       ===================================================== */

    function handleSave() {

        game.combo = 0;

        if (ball) {
            ball.classList.add("miss");
        }

        if (keeper) {
            keeper.classList.add("dive");
        }

        stats.saves++;

        playSound("save");

        showResult(
            "ARRÊT ! 🧤",
            "Le gardien repousse le tir."
        );

        saveStats();

        dailyState.shots++;

        saveDailyState();

        updateDailyChallenges();
        updateGameDisplay();

        game.locked = false;
    }

    /* =====================================================
       RÉSULTAT
       ===================================================== */

    function showResult(title, message) {

        if (resultTitle) {
            resultTitle.textContent =
                title;
        }

        if (resultText) {
            resultText.textContent =
                message;
        }

        if (result) {
            result.classList.remove(
                "hidden"
            );
        }
    }

    function hideResult() {

        if (result) {
            result.classList.add(
                "hidden"
            );
        }
    }

    function finishGame() {

        game.locked = true;

        addXP(
            Math.max(
                50,
                game.score
            )
        );

        saveStats();
        saveDailyState();

        updateDailyChallenges();

        showResult(
            "FIN DU MATCH 🏆",
            `Score final : ${game.score}`
        );
    }

    /* =====================================================
       CLIC SUR LE BUT
       ===================================================== */

    if (goal) {

        goal.addEventListener(
            "pointerdown",
            (event) => {

                event.preventDefault();

                if (game.locked) {
                    return;
                }

                const rect =
                    goal.getBoundingClientRect();

                const x =
                    event.clientX -
                    rect.left;

                const percentage =
                    x / rect.width;

                let direction =
                    "center";

                if (percentage < 0.33) {
                    direction = "left";
                } else if (
                    percentage > 0.66
                ) {
                    direction = "right";
                }

                shoot(direction);
            }
        );
    }

    /* =====================================================
       BOUTONS MENU
       ===================================================== */

    safeClick(
        "playButton",
        () => {
            initAudio();
            resetGame(false);
        }
    );

    safeClick(
        "trainingButton",
        () => {
            initAudio();
            resetGame(true);
        }
    );

    safeClick(
        "dailyButton",
        () => {
            renderDailyChallenges();
            showScreen("dailyScreen");
        }
    );

    safeClick(
        "statsButton",
        () => {
            updateStatsScreen();
            showScreen("statsScreen");
        }
    );

    safeClick(
        "settingsButton",
        () => {
            showScreen("settingsScreen");
        }
    );

    /* =====================================================
       RETOUR MENU
       ===================================================== */

    document
        .querySelectorAll(
            "[data-back-menu]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {
                    hideResult();
                    showScreen(
                        "menuScreen"
                    );
                }
            );
        });

    safeClick(
        "backMenuButton",
        () => {
            hideResult();
            showScreen("menuScreen");
        }
    );

    safeClick(
        "backButton",
        () => {
            hideResult();
            showScreen("menuScreen");
        }
    );

    /* =====================================================
       REJOUER
       ===================================================== */

    safeClick(
        "restartButton",
        () => {
            hideResult();

            resetGame(
                game.training
            );
        }
    );

    safeClick(
        "nextButton",
        () => {

            hideResult();

            if (
                game.shot >=
                MAX_SHOTS
            ) {
                finishGame();
                return;
            }

            resetBall();
            resetKeeper();
            resetPower();
        }
    );

    /* =====================================================
       AUDIO
       ===================================================== */

    safeClick(
        "soundButton",
        () => {

            audioEnabled =
                !audioEnabled;

            localStorage.setItem(
                "penaltyMindAudio",
                audioEnabled
                    ? "on"
                    : "off"
            );

            if (audioEnabled) {
                initAudio();
                playSound("click");
            }

            updateSoundButton();
        }
    );

    safeClick(
        "audioButton",
        () => {

            audioEnabled =
                !audioEnabled;

            localStorage.setItem(
                "penaltyMindAudio",
                audioEnabled
                    ? "on"
                    : "off"
            );

            if (audioEnabled) {
                initAudio();
                playSound("click");
            }

            updateSoundButton();
        }
    );

    function updateSoundButton() {

        const buttons =
            document.querySelectorAll(
                "#soundButton, #audioButton"
            );

        buttons.forEach(button => {
            button.textContent =
                audioEnabled
                    ? "🔊 Son : ON"
                    : "🔇 Son : OFF";
        });
    }

    /* =====================================================
       RESET PROGRESSION
       ===================================================== */

    safeClick(
        "resetButton",
        () => {

            const confirmed =
                window.confirm(
                    "Réinitialiser toute ta progression ?"
                );

            if (!confirmed) {
                return;
            }

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

            localStorage.removeItem(
                "penaltyMindXP"
            );

            localStorage.removeItem(
                "penaltyMindLevel"
            );

            localStorage.removeItem(
                "penaltyMindDailyState"
            );

            stats = {
                goals: 0,
                saves: 0,
                shots: 0,
                bestCombo: 0,
                trainingGoals: 0,
                trainingShots: 0
            };

            xp = 0;
            level = 1;

            loadDailyState();

            updateStatsScreen();
            updateXPDisplay();
            renderDailyChallenges();

            alert(
                "Progression réinitialisée !"
            );

            showScreen(
                "menuScreen"
            );
        }
    );

    /* =====================================================
       RACCOURCIS CLAVIER
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                game.locked ||
                game.shot >= MAX_SHOTS
            ) {
                return;
            }

            if (
                event.key === "ArrowLeft" ||
                event.key.toLowerCase() === "a"
            ) {
                shoot("left");
            }

            if (
                event.key === "ArrowRight" ||
                event.key.toLowerCase() === "d"
            ) {
                shoot("right");
            }

            if (
                event.key === "ArrowUp" ||
                event.key.toLowerCase() === "w"
            ) {
                shoot("center");
            }
        }
    );

    /* =====================================================
       INITIALISATION
       ===================================================== */

    loadDailyState();

    updateXPDisplay();
    updateStatsScreen();
    renderDailyChallenges();
    updateSoundButton();
    updateGameDisplay();

    showScreen("menuScreen");

    console.log(
        "✅ PenaltyMind initialisé correctement"
    );

});
