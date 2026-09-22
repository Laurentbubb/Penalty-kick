const $ = id => document.getElementById(id);

let game = {
    shot: 1,
    maxShots: 5,
    score: 0,
    power: 50,
    direction: 1,
    timer: null,
    playing: true
};


// ================= PUISSANCE =================

function startPower() {

    clearInterval(game.timer);

    game.power = 20;
    game.direction = 1;

    game.timer = setInterval(() => {

        game.power += game.direction * 2;

        if (game.power >= 100) {
            game.power = 100;
            game.direction = -1;
        }

        if (game.power <= 5) {
            game.power = 5;
            game.direction = 1;
        }

        $("needle").style.left =
            game.power + "%";

        $("power").textContent =
            Math.round(game.power) + "%";

    }, 25);
}


// ================= CIBLE =================

function moveTarget() {

    const x =
        28 + Math.random() * 44;

    const y =
        15 + Math.random() * 28;

    $("target").style.left =
        x + "%";

    $("target").style.top =
        y + "%";

    return { x, y };
}


// ================= GARDIEN =================

function resetKeeper() {

    $("keeper").style.transform =
        "translateX(-50%)";
}


// ================= TIR =================

function shoot() {

    if (!game.playing) return;

    clearInterval(game.timer);

    game.playing = false;

    const power = game.power;

    const target =
        moveTarget();

    const ball = $("ball");

    ball.style.left =
        target.x + "%";

    ball.style.bottom =
        "63%";

    ball.style.transform =
        "translateX(-50%) scale(.45)";


    // déplacement du gardien
    const keeperSide =
        Math.random() < .5 ? -1 : 1;

    const keeperMoves =
        Math.random() < .55;

    if (keeperMoves) {

        $("keeper").style.transform =
            `translateX(calc(-50% + ${keeperSide * 70}px)) rotate(${keeperSide * 12}deg)`;
    }


    setTimeout(() => {

        const saved =
            keeperMoves &&
            Math.random() < .55;

        if (saved) {

            $("message").textContent =
                "🧤 ARRÊT DU GARDIEN !";

        } else {

            let points = 100;

            if (
                power >= 78 &&
                power <= 92
            ) {
                points += 100;

                $("message").textContent =
                    "🎯 TIR PARFAIT !";
            } else {
                $("message").textContent =
                    "⚽ BUT !";
            }

            game.score += points;

            $("score").textContent =
                game.score;
        }


        setTimeout(() => {

            if (
                game.shot >= game.maxShots
            ) {
                finish();
                return;
            }

            game.shot++;

            $("shot").textContent =
                `${game.shot} / ${game.maxShots}`;

            resetShot();

        }, 800);

    }, 600);
}


// ================= NOUVEAU TIR =================

function resetShot() {

    game.playing = true;

    const ball = $("ball");

    ball.style.left = "50%";
    ball.style.bottom = "7%";

    ball.style.transform =
        "translateX(-50%) scale(1)";

    $("message").textContent =
        "🎯 Choisis ta zone de tir";

    resetKeeper();

    moveTarget();

    startPower();
}


// ================= FIN =================

function finish() {

    clearInterval(game.timer);

    $("finalScore").textContent =
        game.score;

    $("result").classList.remove(
        "hidden"
    );
}


// ================= REJOUER =================

function restart() {

    $("result").classList.add(
        "hidden"
    );

    game = {
        shot: 1,
        maxShots: 5,
        score: 0,
        power: 50,
        direction: 1,
        timer: null,
        playing: true
    };

    $("shot").textContent = "1 / 5";
    $("score").textContent = "0";

    resetShot();
}


// ================= EVENTS =================

$("shoot").addEventListener(
    "click",
    shoot
);

$("powerBar").addEventListener(
    "click",
    shoot
);

$("restart").addEventListener(
    "click",
    restart
);


// ================= START =================

resetShot();
