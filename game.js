document.addEventListener("DOMContentLoaded", function () {

    console.log("PenaltyMind game.js OK");

    var currentScreen = null;

    var score = 0;
    var shots = 0;
    var combo = 0;
    var trainingMode = false;
    var gameFinished = false;

    var xp = Number(localStorage.getItem("pm_xp")) || 0;
    var bestScore = Number(localStorage.getItem("pm_best_score")) || 0;
    var totalGoals = Number(localStorage.getItem("pm_goals")) || 0;
    var totalSaves = Number(localStorage.getItem("pm_saves")) || 0;
    var totalShots = Number(localStorage.getItem("pm_shots")) || 0;
    var bestCombo = Number(localStorage.getItem("pm_best_combo")) || 0;
    var trainingGoals = Number(localStorage.getItem("pm_training_goals")) || 0;
    var trainingShots = Number(localStorage.getItem("pm_training_shots")) || 0;

    var soundEnabled =
        localStorage.getItem("pm_sound") !== "off";


    /* =========================
       OUTILS
    ========================= */

    function get(id) {
        return document.getElementById(id);
    }

    function showScreen(id) {

        var screens = document.querySelectorAll(".screen");

        for (var i = 0; i < screens.length; i++) {
            screens[i].classList.remove("active");
        }

        var screen = get(id);

        if (screen) {
            screen.classList.add("active");
            currentScreen = id;
        }
    }


    /* =========================
       SAUVEGARDE
    ========================= */

    function saveData() {

        localStorage.setItem("pm_xp", xp);
        localStorage.setItem("pm_best_score", bestScore);
        localStorage.setItem("pm_goals", totalGoals);
        localStorage.setItem("pm_saves", totalSaves);
        localStorage.setItem("pm_shots", totalShots);
        localStorage.setItem("pm_best_combo", bestCombo);
        localStorage.setItem("pm_training_goals", trainingGoals);
        localStorage.setItem("pm_training_shots", trainingShots);
    }


    /* =========================
       XP / NIVEAU
    ========================= */

    function getLevel() {
        return Math.floor(xp / 500) + 1;
    }

    function updateXP() {

        var level = getLevel();
        var currentXP = xp % 500;
        var percent = (currentXP / 500) * 100;

        if (get("menuLevel")) {
            get("menuLevel").textContent = level;
        }

        if (get("menuXP")) {
            get("menuXP").textContent = currentXP;
        }

        if (get("menuXPNeeded")) {
            get("menuXPNeeded").textContent = "500";
        }

        if (get("menuXPFill")) {
            get("menuXPFill").style.width = percent + "%";
        }
    }

    function addXP(amount) {
        xp += amount;
        saveData();
        updateXP();
    }


    /* =========================
       MENU
    ========================= */

    function updateMenu() {

        updateXP();

        if (get("menuBestScore")) {
            get("menuBestScore").textContent = bestScore;
        }
    }


    /* =========================
       JEU
    ========================= */

    function startGame(training) {

        trainingMode = training;
        gameFinished = false;

        score = 0;
        shots = 0;
        combo = 0;

        if (get("gameSubtitle")) {

            if (trainingMode) {
                get("gameSubtitle").textContent =
                    "Entraînement : tirs illimités";
            } else {
                get("gameSubtitle").textContent =
                    "10 tirs pour faire le meilleur score";
            }
        }

        if (get("result")) {
            get("result").classList.remove("active");
        }

        updateGameDisplay();
        resetField();

        showScreen("gameScreen");
    }


    function updateGameDisplay() {

        if (get("shotNumber")) {
            get("shotNumber").textContent =
                trainingMode ? shots + 1 : Math.min(shots + 1, 10);
        }

        if (get("score")) {
            get("score").textContent = score;
        }

        if (get("combo")) {
            get("combo").textContent = combo;
        }
    }


    function resetField() {

        if (get("ball")) {
            get("ball").style.left = "50%";
            get("ball").style.bottom = "25px";
        }

        if (get("keeper")) {
            get("keeper").style.left = "50%";
        }

        if (get("message")) {
            get("message").textContent =
                "Vise la cage pour tirer ⚽";
        }
    }


    /* =========================
       TIR
    ========================= */

    function shoot(event) {

        if (gameFinished) {
            return;
        }

        if (event && event.target) {

            if (
                event.target.closest("button") ||
                event.target.closest(".result-card")
            ) {
                return;
            }
        }

        var goal = get("goal");

        if (!goal) {
            return;
        }

        var rect = goal.getBoundingClientRect();

        var clickX = event
            ? event.clientX - rect.left
            : rect.width / 2;

        var clickY = event
            ? event.clientY - rect.top
            : rect.height / 2;

        var percentX =
            (clickX / rect.width) * 100;

        var percentY =
            (clickY / rect.height) * 100;

        if (percentX < 0) {
            percentX = 0;
        }

        if (percentX > 100) {
            percentX = 100;
        }

        if (percentY < 0) {
            percentY = 0;
        }

        if (percentY > 100) {
            percentY = 100;
        }

        shots++;
        totalShots++;

        var keeperPositions = [
            20,
            50,
            80
        ];

        var keeperPosition =
            keeperPositions[
                Math.floor(
                    Math.random() * keeperPositions.length
                )
            ];

        var distance =
            Math.abs(percentX - keeperPosition);

        var isGoal = distance > 16;

        if (get("ball")) {

            get("ball").style.left =
                percentX + "%";

            get("ball").style.bottom =
                "55%";
        }

        if (get("keeper")) {

            get("keeper").style.left =
                keeperPosition + "%";
        }

        if (get("message")) {
            get("message").textContent =
                "Tir en cours...";
        }

        setTimeout(function () {

            if (isGoal) {

                var points = 100 + combo * 25;

                score += points;
                combo++;

                totalGoals++;

                if (combo > bestCombo) {
                    bestCombo = combo;
                }

                addXP(25);

                if (get("message")) {
                    get("message").textContent =
                        "BUT ! +" + points + " points ⚽";
                }

                showResult(
                    "BUT ! ⚽",
                    "+" + points + " points"
                );

            } else {

                combo = 0;
                totalSaves++;

                if (get("message")) {
                    get("message").textContent =
                        "ARRÊT ! 🧤";
                }

                showResult(
                    "ARRÊT ! 🧤",
                    "Le gardien a arrêté ton tir."
                );
            }

            saveData();
            updateGameDisplay();

            if (!trainingMode && shots >= 10) {

                setTimeout(function () {
                    finishGame();
                }, 900);
            }

        }, 500);
    }


    /* =========================
       RESULTAT
    ========================= */

    function showResult(title, text) {

        if (get("resultTitle")) {
            get("resultTitle").textContent = title;
        }

        if (get("finalScore")) {
            get("finalScore").textContent = score;
        }

        if (get("bestScore")) {
            get("bestScore").textContent =
                Math.max(bestScore, score);
        }

        if (get("result")) {
            get("result").classList.add("active");
        }
    }


    function hideResult() {

        if (get("result")) {
            get("result").classList.remove("active");
        }

        resetField();
    }


    function finishGame() {

        gameFinished = true;

        if (score > bestScore) {
            bestScore = score;
        }

        saveData();

        if (get("finalScore")) {
            get("finalScore").textContent = score;
        }

        if (get("bestScore")) {
            get("bestScore").textContent = bestScore;
        }

        if (get("resultTitle")) {
            get("resultTitle").textContent =
                "Fin de la partie !";
        }

        if (get("result")) {
            get("result").classList.add("active");
        }

        updateMenu();
    }


    /* =========================
       STATS
    ========================= */

    function updateStats() {

        if (get("statBestScore")) {
            get("statBestScore").textContent =
                bestScore;
        }

        if (get("statGoals")) {
            get("statGoals").textContent =
                totalGoals;
        }

        if (get("statSaves")) {
            get("statSaves").textContent =
                totalSaves;
        }

        if (get("statCombo")) {
            get("statCombo").textContent =
                bestCombo;
        }

        if (get("statShots")) {
            get("statShots").textContent =
                totalShots;
        }

        var accuracy = 0;

        if (totalShots > 0) {
            accuracy =
                Math.round(
                    (totalGoals / totalShots) * 100
                );
        }

        if (get("statAccuracy")) {
            get("statAccuracy").textContent =
                accuracy + "%";
        }

        if (get("trainingGoals")) {
            get("trainingGoals").textContent =
                trainingGoals;
        }

        if (get("trainingShots")) {
            get("trainingShots").textContent =
                trainingShots;
        }
    }


    /* =========================
       DEFIS
    ========================= */

    function updateDailyChallenges() {

        var list = get("dailyChallengesList");

        if (!list) {
            return;
        }

        var goalsDone =
            Math.min(totalGoals, 3);

        var shotsDone =
            Math.min(totalShots, 5);

        var comboDone =
            Math.min(bestCombo, 3);

        var completed = 0;

        if (goalsDone >= 3) {
            completed++;
        }

        if (shotsDone >= 5) {
            completed++;
        }

        if (comboDone >= 3) {
            completed++;
        }

        if (get("dailyCompletedCount")) {
            get("dailyCompletedCount").textContent =
                completed + "/3";
        }

        list.innerHTML =
            '<div class="challenge">' +
                '<strong>⚽ Marquer 3 buts</strong>' +
                '<br>' +
                '<span>' +
                goalsDone +
                '/3' +
                '</span>' +
            '</div>' +

            '<div class="challenge">' +
                '<strong>🎯 Faire 5 tirs</strong>' +
                '<br>' +
                '<span>' +
                shotsDone +
                '/5' +
                '</span>' +
            '</div>' +

            '<div class="challenge">' +
                '<strong>🔥 Faire un combo de 3</strong>' +
                '<br>' +
                '<span>' +
                comboDone +
                '/3' +
                '</span>' +
            '</div>';
    }


    /* =========================
       BOUTONS MENU
    ========================= */

    get("playButton").addEventListener(
        "click",
        function () {
            startGame(false);
        }
    );

    get("trainingButton").addEventListener(
        "click",
        function () {
            showScreen("trainingScreen");
            updateStats();
        }
    );

    get("dailyButton").addEventListener(
        "click",
        function () {
            updateDailyChallenges();
            showScreen("dailyScreen");
        }
    );

    get("statsButton").addEventListener(
        "click",
        function () {
            updateStats();
            showScreen("statsScreen");
        }
    );

    get("settingsButton").addEventListener(
        "click",
        function () {
            showScreen("settingsScreen");
        }
    );


    /* =========================
       ENTRAINEMENT
    ========================= */

    get("startTrainingButton").addEventListener(
        "click",
        function () {
            startGame(true);
        }
    );


    /* =========================
       RETOUR MENU
    ========================= */

    var backButtons =
        document.querySelectorAll("[data-back-menu]");

    for (var i = 0; i < backButtons.length; i++) {

        backButtons[i].addEventListener(
            "click",
            function () {
                updateMenu();
                showScreen("mainMenu");
            }
        );
    }


    get("backToMenuButton").addEventListener(
        "click",
        function () {
            hideResult();
            showScreen("mainMenu");
            updateMenu();
        }
    );


    get("resultMenuButton").addEventListener(
        "click",
        function () {
            hideResult();
            showScreen("mainMenu");
            updateMenu();
        }
    );


    /* =========================
       REJOUER
    ========================= */

    get("restartButton").addEventListener(
        "click",
        function () {
            hideResult();
            startGame(trainingMode);
        }
    );


    /* =========================
       CLIC TERRAIN
    ========================= */

    get("goal").addEventListener(
        "click",
        function (event) {
            shoot(event);
        }
    );


    /* =========================
       SON
    ========================= */

    function updateSoundButton() {

        var text =
            soundEnabled
                ? "🔊 Son : activé"
                : "🔇 Son : désactivé";

        if (get("settingsSoundButton")) {
            get("settingsSoundButton").textContent =
                text;
        }

        if (get("soundButton")) {
            get("soundButton").textContent =
                soundEnabled ? "🔊" : "🔇";
        }
    }


    get("soundButton").addEventListener(
        "click",
        function () {

            soundEnabled = !soundEnabled;

            localStorage.setItem(
                "pm_sound",
                soundEnabled ? "on" : "off"
            );

            updateSoundButton();
        }
    );


    get("settingsSoundButton").addEventListener(
        "click",
        function () {

            soundEnabled = !soundEnabled;

            localStorage.setItem(
                "pm_sound",
                soundEnabled ? "on" : "off"
            );

            updateSoundButton();
        }
    );


    /* =========================
       RESET
    ========================= */

    get("resetStatsButton").addEventListener(
        "click",
        function () {

            localStorage.removeItem("pm_xp");
            localStorage.removeItem("pm_best_score");
            localStorage.removeItem("pm_goals");
            localStorage.removeItem("pm_saves");
            localStorage.removeItem("pm_shots");
            localStorage.removeItem("pm_best_combo");
            localStorage.removeItem("pm_training_goals");
            localStorage.removeItem("pm_training_shots");

            xp = 0;
            bestScore = 0;
            totalGoals = 0;
            totalSaves = 0;
            totalShots = 0;
            bestCombo = 0;
            trainingGoals = 0;
            trainingShots = 0;

            updateMenu();
            updateStats();
            updateDailyChallenges();

            alert("Données réinitialisées !");
        }
    );


    /* =========================
       INITIALISATION
    ========================= */

    updateMenu();
    updateStats();
    updateDailyChallenges();
    updateSoundButton();

    showScreen("mainMenu");

});
