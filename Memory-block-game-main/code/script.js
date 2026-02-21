document.addEventListener("DOMContentLoaded", () => {
    const images = [
        "./images/img1.jpg", "./images/img1.jpg",
        "./images/img2.jpg", "./images/img2.jpg",
        "./images/img3.jpg", "./images/img3.jpg",
        "./images/img4.jpg", "./images/img4.jpg",
        "./images/img5.jpg", "./images/img5.jpg",
        "./images/img6.jpg", "./images/img6.jpg",
    ];

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    let blocks = document.querySelectorAll(".block");

    let matchedPairs = 0;
    let hasFlippedBlock = false;
    let lockBoard = false;
    let firstBlock = null;
    let secondBlock = null;

    let totalPlayers = 2;
    let currentPlayer = 1;
    let scores = {};
    let gameStarted = false;

    // Tie-breaker variables
    let tieMode = false;
    let tiePlayers = [];

    function initializeBoard() {
        const shuffledImages = shuffle([...images]);
        blocks = document.querySelectorAll(".block");

        blocks.forEach((block, index) => {
            block.classList.remove("flipped");
            block.innerHTML = "";

            const img = document.createElement("img");
            img.src = shuffledImages[index];
            img.alt = "Memory Image";
            img.style.display = "none";

            block.appendChild(img);
            block.dataset.image = shuffledImages[index];

            block.removeEventListener("click", flipBlock);
            block.addEventListener("click", flipBlock);
        });

        resetBoard();
    }

    function createScoreboard() {
        const container = document.getElementById("scores-container");
        container.innerHTML = "";
        scores = {};

        for (let i = 1; i <= totalPlayers; i++) {
            scores[i] = 0;

            const div = document.createElement("div");
            div.classList.add("score-card");
            div.innerHTML = `Player ${i}: <span id="score${i}">0</span>`;
            container.appendChild(div);
        }

        currentPlayer = 1;
        document.getElementById("turn-indicator").textContent =
            `Player 1's Turn`;
    }

    function flipBlock() {

        if (!gameStarted) {
            gameStarted = true;
            document.getElementById("player-count").disabled = true;
        }

        if (lockBoard) return;
        if (this === firstBlock) return;

        this.classList.add("flipped");
        this.querySelector("img").style.display = "block";

        if (!hasFlippedBlock) {
            hasFlippedBlock = true;
            firstBlock = this;
            return;
        }

        secondBlock = this;
        checkForMatch();
    }

    function checkForMatch() {
        const isMatch =
            firstBlock.dataset.image === secondBlock.dataset.image;

        isMatch ? disableBlocks() : unflipBlocks();
    }

    function disableBlocks() {
        firstBlock.removeEventListener("click", flipBlock);
        secondBlock.removeEventListener("click", flipBlock);

        matchedPairs++;
        scores[currentPlayer]++;
        document.getElementById(`score${currentPlayer}`).textContent =
            scores[currentPlayer];

        // If in tie mode → first match wins instantly
        if (tieMode) {
            showTieWinner();
            return;
        }

        if (matchedPairs === images.length / 2) {
            showCongratulations();
        }

        resetBoard();
    }

    function unflipBlocks() {
        lockBoard = true;

        setTimeout(() => {
            firstBlock.classList.remove("flipped");
            firstBlock.querySelector("img").style.display = "none";

            secondBlock.classList.remove("flipped");
            secondBlock.querySelector("img").style.display = "none";

            currentPlayer++;
            if (currentPlayer > totalPlayers) {
                currentPlayer = 1;
            }

            document.getElementById("turn-indicator").textContent =
                `Player ${currentPlayer}'s Turn`;

            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        hasFlippedBlock = false;
        lockBoard = false;
        firstBlock = null;
        secondBlock = null;
    }

    function showCongratulations() {
        let maxScore = Math.max(...Object.values(scores));
        let winners = [];

        for (let player in scores) {
            if (scores[player] === maxScore) {
                winners.push(player);
            }
        }

        // Single winner
        if (winners.length === 1) {
            const popup = document.getElementById("congratulation-popup");
            popup.querySelector("p").textContent =
                `Player ${winners[0]} Wins! 🏆`;
            popup.style.display = "block";
            return;
        }

        // Tie detected
        tieMode = true;
        tiePlayers = winners;
        startTieBreaker();
    }

    function startTieBreaker() {
    alert(
        `Tie detected between Player ${tiePlayers.join(
            " & "
        )}! Starting sudden death round!`
    );

    matchedPairs = 0;
    totalPlayers = tiePlayers.length;

    let newScores = {};
    tiePlayers.forEach((player, index) => {
        newScores[index + 1] = 0;
    });

    scores = newScores;
    currentPlayer = 1;

    createScoreboard();
    initializeBoard();
}

    function showTieWinner() {
        const popup = document.getElementById("congratulation-popup");

        popup.querySelector("p").textContent =
            `Player ${currentPlayer} Wins the Tie-Breaker! 🏆`;

        popup.style.display = "block";

        tieMode = false;
    }

    function resetGame() {
        matchedPairs = 0;
        gameStarted = false;
        tieMode = false;
        tiePlayers = [];

        document.getElementById("player-count").disabled = false;

        createScoreboard();
        initializeBoard();

        document.getElementById("congratulation-popup").style.display =
            "none";
    }

    document
        .getElementById("play-again")
        .addEventListener("click", resetGame);

    document
        .getElementById("reset")
        .addEventListener("click", resetGame);

    document
        .getElementById("player-count")
        .addEventListener("change", function () {
            if (!gameStarted) {
                totalPlayers = parseInt(this.value);
                resetGame();
            }
        });

    createScoreboard();
    initializeBoard();
});