console.log("PENALTYMIND JS CHARGE");

document.addEventListener("DOMContentLoaded", () => {
    const playButton = document.getElementById("playButton");

    if (!playButton) {
        console.error("ERREUR : playButton introuvable");
        return;
    }

    playButton.addEventListener("click", () => {
        alert("ÇA MARCHE ! Le JavaScript est bien connecté.");
    });

    console.log("Bouton Play connecté");
});
