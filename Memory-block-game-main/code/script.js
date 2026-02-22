document.addEventListener("DOMContentLoaded", () => {
    const REAL_IMAGES = 18;

    // Emoji pool (for testing)
    const EMOJI_POOL = [
        { emoji: "🦊", color: "#f97316" }, { emoji: "🐬", color: "#0ea5e9" },
        { emoji: "🌸", color: "#ec4899" }, { emoji: "🍀", color: "#22c55e" },
        { emoji: "⚡", color: "#eab308" }, { emoji: "🎸", color: "#8b5cf6" },
        { emoji: "🔥", color: "#ef4444" }, { emoji: "🌊", color: "#3b82f6" },
        { emoji: "🎯", color: "#14b8a6" }, { emoji: "🏆", color: "#f59e0b" },
        { emoji: "🎲", color: "#6366f1" }, { emoji: "🍉", color: "#10b981" },
        { emoji: "🚀", color: "#64748b" }, { emoji: "🦋", color: "#a855f7" },
        { emoji: "🐉", color: "#dc2626" }, { emoji: "🌙", color: "#1d4ed8" },
        { emoji: "🎪", color: "#db2777" }, { emoji: "🦄", color: "#9333ea" },
        { emoji: "🌴", color: "#15803d" }, { emoji: "🎭", color: "#b45309" },
        { emoji: "🍕", color: "#c2410c" }, { emoji: "🎠", color: "#0369a1" },
        { emoji: "🦁", color: "#92400e" }, { emoji: "🌈", color: "#7c3aed" },
        { emoji: "🐙", color: "#be185d" }, { emoji: "🎆", color: "#1e40af" },
    ];

    let images = [];
    let blocks = [];

    let matchedPairs = 0;
    let totalPairs = 0;
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
    let originalTiePlayers = [];

    // ── Grid size helpers ────────────────────────────────────────────────────
    function getGridDimensions() {
        const rows = parseInt(document.getElementById("rows-select").value);
        const cols = parseInt(document.getElementById("cols-select").value);
        return { rows, cols };
    }

    function isValidGrid(rows, cols) {
        return (rows * cols) % 2 === 0;   // need even total tiles
    }

    /** Compute a block size (px) so the grid fits nicely in the viewport. */
    function computeBlockSize(cols) {
        const maxFromViewport = Math.floor((window.innerWidth * 0.60) / cols) - 15;
        return Math.min(120, Math.max(50, maxFromViewport));
    }

    // ── Dynamic grid generation ──────────────────────────────────────────────
    function generateGrid(rows, cols) {
        const gameDiv = document.getElementById("game-grid");
        gameDiv.innerHTML = "";

        const blockSize = computeBlockSize(cols);

        // Set CSS custom properties for columns and block size
        gameDiv.style.setProperty("--cols", cols);
        gameDiv.style.setProperty("--block-size", `${blockSize}px`);

        for (let i = 0; i < rows * cols; i++) {
            const block = document.createElement("div");
            block.classList.add("block");
            gameDiv.appendChild(block);
        }
    }

    // ── Shuffle ──────────────────────────────────────────────────────────────
    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // ── Board initialisation ─────────────────────────────────────────────────
    function initializeBoard() {
        const { rows, cols } = getGridDimensions();
        const totalTiles = rows * cols;
        totalPairs = totalTiles / 2;

        // Build a shuffled array of pair IDs (1..totalPairs, each appearing twice)
        const pool = Array.from({ length: totalPairs }, (_, i) => i + 1);
        const shuffledIds = shuffle([...pool, ...pool]);

        generateGrid(rows, cols);

        blocks = document.querySelectorAll(".block");

        blocks.forEach((block, index) => {
            const pairId = shuffledIds[index];
            block.classList.remove("flipped");
            block.innerHTML = "";
            block.dataset.pairId = pairId;

            if (pairId <= REAL_IMAGES) {
                // Real image card
                const img = document.createElement("img");
                img.src = `./images/img${pairId}.jpg`;
                img.alt = "Memory Image";
                img.style.display = "none";
                block.appendChild(img);
                block.dataset.cardType = "image";
            } else {
                // Emoji / colour placeholder card
                const eIdx = (pairId - REAL_IMAGES - 1) % EMOJI_POOL.length;
                const { emoji, color } = EMOJI_POOL[eIdx];
                const face = document.createElement("div");
                face.classList.add("emoji-face");
                face.textContent = emoji;
                face.style.backgroundColor = color;
                face.style.display = "none";
                block.appendChild(face);
                block.dataset.cardType = "emoji";
            }

            block.removeEventListener("click", flipBlock);
            block.addEventListener("click", flipBlock);
        });

        resetBoard();
    }

    // ── Scoreboard ───────────────────────────────────────────────────────────
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
        document.getElementById("turn-indicator").textContent = `Player 1's Turn`;
    }

    // ── Grid controls: lock / unlock ─────────────────────────────────────────
    function lockGridControls() {
        document.getElementById("rows-select").disabled = true;
        document.getElementById("cols-select").disabled = true;
    }

    function unlockGridControls() {
        document.getElementById("rows-select").disabled = false;
        document.getElementById("cols-select").disabled = false;
    }

    // ── Flip logic ───────────────────────────────────────────────────────────
    function flipBlock() {
        if (!gameStarted) {
            gameStarted = true;
            document.getElementById("player-count").disabled = true;
            lockGridControls();
        }

        if (lockBoard) return;
        if (this === firstBlock) return;

        this.classList.add("flipped");
        const face = this.querySelector("img, .emoji-face");
        if (face) face.style.display = face.classList.contains("emoji-face") ? "flex" : "block";

        if (!hasFlippedBlock) {
            hasFlippedBlock = true;
            firstBlock = this;
            return;
        }

        secondBlock = this;
        checkForMatch();
    }

    function checkForMatch() {
        const isMatch = firstBlock.dataset.pairId === secondBlock.dataset.pairId;
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

        if (matchedPairs === totalPairs) {
            showCongratulations();
        }

        resetBoard();
    }

    function unflipBlocks() {
        lockBoard = true;

        setTimeout(() => {
            firstBlock.classList.remove("flipped");
            const f1 = firstBlock.querySelector("img, .emoji-face");
            if (f1) f1.style.display = "none";

            secondBlock.classList.remove("flipped");
            const f2 = secondBlock.querySelector("img, .emoji-face");
            if (f2) f2.style.display = "none";

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

    function disableBoardInteraction() {
        lockBoard = true;
        blocks.forEach(block => {
            block.removeEventListener("click", flipBlock);
        });
    }

    // ── End-of-game ──────────────────────────────────────────────────────────
    function showCongratulations() {
        disableBoardInteraction();
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
        originalTiePlayers = [...tiePlayers];
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
        disableBoardInteraction();
        const popup = document.getElementById("congratulation-popup");

        popup.querySelector("p").textContent =
            `Player ${originalTiePlayers[currentPlayer - 1]} Wins the Tie-Breaker! 🏆`

        popup.style.display = "block";

        tieMode = false;
    }

    // ── Reset / New Game ─────────────────────────────────────────────────────
    function resetGame() {
        matchedPairs = 0;
        gameStarted = false;
        tieMode = false;
        tiePlayers = [];

        document.getElementById("player-count").disabled = false;
        unlockGridControls();
        clearGridHintError();

        createScoreboard();
        initializeBoard();

        document.getElementById("congratulation-popup").style.display = "none";
    }

    // ── Grid size validation hint ────────────────────────────────────────────
    function clearGridHintError() {
        const hint = document.getElementById("grid-hint");
        hint.classList.remove("error");
        hint.textContent = "At least one of rows or columns must be even.";
    }

    function validateAndApplyGrid() {
        if (gameStarted) return;   // can't change mid-game
        const { rows, cols } = getGridDimensions();
        const hint = document.getElementById("grid-hint");

        if (!isValidGrid(rows, cols)) {
            hint.classList.add("error");
            hint.textContent = `⚠ ${rows}×${cols} = ${rows * cols} tiles (odd). Please make at least one dimension even.`;
        } else {
            clearGridHintError();
            // Live-preview the new grid without resetting scores / game state
            resetGame();
        }
    }

    // ── Event Listeners ──────────────────────────────────────────────────────
    document.getElementById("play-again").addEventListener("click", resetGame);
    document.getElementById("reset").addEventListener("click", resetGame);

    document.getElementById("player-count").addEventListener("change", function () {
        if (!gameStarted) {
            totalPlayers = parseInt(this.value);
            resetGame();
        }
    });

    document.getElementById("rows-select").addEventListener("change", validateAndApplyGrid);
    document.getElementById("cols-select").addEventListener("change", validateAndApplyGrid);

    // ── Bootstrap ────────────────────────────────────────────────────────────
    createScoreboard();
    initializeBoard();
});
