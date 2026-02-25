let isPaused = false;
let pausedTime = 0;

document.addEventListener("DOMContentLoaded", () => {
    const REAL_IMAGES = 18;

    const EMOJI_POOL = [
        { emoji: "🦊", color: "#f97316" }, { emoji: "🐬", color: "#0ea5e9" },
        { emoji: "🌸", color: "#ec4899" }, { emoji: "🍀", color: "#22c55e" },
        { emoji: "⚡", color: "#eab308" }, { emoji: "🎸", color: "#8b5cf6" },
        { emoji: "🔥", color: "#ef4444" }, { emoji: "🌊", color: "#3b82f6" },
        { emoji: "🎯", color: "#14b8a6" }, { emoji: "🏆", color: "#f59e0b" },
        { emoji: "🎲", color: "#6366f1" }, { emoji: "🍉", color: "#10b981" },
        { emoji: "🚀", color: "#64748b" }, { emoji: "🦋", color: "#a855f7" },
        { emoji: "🐉", color: "#dc2626" }, { emoji: "🌙", color: "#1d4ed8" },
        { emoji: "🎪", color: "#db2777" }, { emoji: "🦄", color: "#9333ea" }
    ];

    /* ── Sound setup ───────────────────── */
    const flipSound = document.getElementById("flip-sound");
    const matchSound = document.getElementById("match-sound");
    const wrongSound = document.getElementById("wrong-sound");

    const muteBtn = document.getElementById("mute-btn");
    const volumeSlider = document.getElementById("volume-slider");

    let isMuted = false;

    volumeSlider.addEventListener("input", () => {
        const volume = volumeSlider.value;
        [flipSound, matchSound, wrongSound].forEach(s => s.volume = volume);
    });

    muteBtn.addEventListener("click", () => {
        isMuted = !isMuted;
        [flipSound, matchSound, wrongSound].forEach(s => s.muted = isMuted);
        muteBtn.textContent = isMuted ? "🔇 Unmute" : "🔊 Mute";
    });

    function playSound(sound) {
        if (!isMuted && !isPaused) {
            sound.currentTime = 0;
            sound.play();
        }
    }
    /* ─────────────────────────────────── */

    let blocks = [];
    let matchedPairs = 0;
    let totalPairs = 0;
    let hasFlippedBlock = false;
    let lockBoard = false;
    let firstBlock = null;
    let secondBlock = null;
    let gameOver = false;
    let totalPlayers = 2;
    let currentPlayer = 1;
    let scores = {};
    let gameStarted = false;

    let difficulty = "medium";
    let unflipDelay = 1000;

    const rowsSelect = document.getElementById("rows-select");
    const colsSelect = document.getElementById("cols-select");

    function applyDifficulty(level) {
        difficulty = level;

        if (level === "easy") {
            rowsSelect.value = 2;
            colsSelect.value = 4;
            unflipDelay = 1200;
        }
        if (level === "medium") {
            rowsSelect.value = 3;
            colsSelect.value = 4;
            unflipDelay = 1000;
        }
        if (level === "hard") {
            rowsSelect.value = 4;
            colsSelect.value = 6;
            unflipDelay = 700;
        }
        resetGame();
    }

    function getGridDimensions() {
        return {
            rows: parseInt(rowsSelect.value),
            cols: parseInt(colsSelect.value)
        };
    }

    function computeBlockSize(cols) {
        const maxFromViewport = Math.floor((window.innerWidth * 0.6) / cols) - 15;
        return Math.min(120, Math.max(50, maxFromViewport));
    }

    function generateGrid(rows, cols) {
        const gameDiv = document.getElementById("game-grid");
        gameDiv.innerHTML = "";

        const blockSize = computeBlockSize(cols);
        gameDiv.style.setProperty("--cols", cols);
        gameDiv.style.setProperty("--block-size", `${blockSize}px`);

        for (let i = 0; i < rows * cols; i++) {
            const block = document.createElement("div");
            block.classList.add("block");
            gameDiv.appendChild(block);
        }
    }

    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function initializeBoard() {
        const { rows, cols } = getGridDimensions();
        totalPairs = (rows * cols) / 2;

        const pool = Array.from({ length: totalPairs }, (_, i) => i + 1);
        const shuffledIds = shuffle([...pool, ...pool]);

        generateGrid(rows, cols);
        blocks = document.querySelectorAll(".block");

        blocks.forEach((block, index) => {
            const pairId = shuffledIds[index];
            block.className = "block";
            block.innerHTML = "";
            block.dataset.pairId = pairId;

            const e = EMOJI_POOL[(pairId - 1) % EMOJI_POOL.length];
            const face = document.createElement("div");
            face.className = "emoji-face";
            face.textContent = e.emoji;
            face.style.backgroundColor = e.color;
            face.style.display = "none";
            block.appendChild(face);

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
            container.innerHTML += `<div class="score-card">Player ${i}: <span id="score${i}">0</span></div>`;
        }

        currentPlayer = 1;
        document.getElementById("turn-indicator").textContent = "Player 1's Turn";
    }

    function flipBlock() {
        if (isPaused || lockBoard || gameOver || this === firstBlock) return;

        if (!gameStarted) {
            gameStarted = true;
            document.getElementById("player-count").disabled = true;
            document.getElementById("difficulty-select").disabled = true;
            rowsSelect.disabled = true;
            colsSelect.disabled = true;
        }

        this.classList.add("flipped");
        this.querySelector(".emoji-face").style.display = "flex";
        playSound(flipSound);

        if (!hasFlippedBlock) {
            hasFlippedBlock = true;
            firstBlock = this;
            return;
        }

        secondBlock = this;
        checkForMatch();
    }

    function checkForMatch() {
        firstBlock.dataset.pairId === secondBlock.dataset.pairId
            ? disableBlocks()
            : unflipBlocks();
    }

    function disableBlocks() {
        firstBlock.removeEventListener("click", flipBlock);
        secondBlock.removeEventListener("click", flipBlock);

        matchedPairs++;
        scores[currentPlayer]++;
        document.getElementById(`score${currentPlayer}`).textContent = scores[currentPlayer];

        playSound(matchSound);

        if (matchedPairs === totalPairs) {
            document.getElementById("congratulation-popup").style.display = "block";
            gameOver = true;
        }

        resetBoard();
    }

    function unflipBlocks() {
        lockBoard = true;
        playSound(wrongSound);

        setTimeout(() => {
            if (isPaused) return;

            [firstBlock, secondBlock].forEach(block => {
                block.classList.remove("flipped");
                block.querySelector(".emoji-face").style.display = "none";
            });

            currentPlayer = (currentPlayer % totalPlayers) + 1;
            document.getElementById("turn-indicator").textContent =
                `Player ${currentPlayer}'s Turn`;

            resetBoard();
        }, unflipDelay);
    }

    function resetBoard() {
        [hasFlippedBlock, lockBoard, firstBlock, secondBlock] = [false, false, null, null];
    }

    function resetGame() {
        matchedPairs = 0;
        gameStarted = false;
        gameOver = false;
        isPaused = false;

        document.getElementById("player-count").disabled = false;
        document.getElementById("difficulty-select").disabled = false;
        rowsSelect.disabled = false;
        colsSelect.disabled = false;

        createScoreboard();
        initializeBoard();
        document.getElementById("congratulation-popup").style.display = "none";
    }

    /* ── Pause / Resume button ───────────── */
    const pauseBtn = document.getElementById("pause-btn");

    if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
            isPaused = !isPaused;
            pauseBtn.textContent = isPaused ? "▶ Resume" : "⏸ Pause";
        });
    }
    /* ───────────────────────────────────── */

    document.getElementById("reset").addEventListener("click", resetGame);
    document.getElementById("play-again").addEventListener("click", resetGame);

    document.getElementById("player-count").addEventListener("change", e => {
        if (!gameStarted) {
            totalPlayers = +e.target.value;
            resetGame();
        }
    });

    document.getElementById("difficulty-select").addEventListener("change", e => {
        if (!gameStarted) applyDifficulty(e.target.value);
    });

    createScoreboard();
    initializeBoard();
});