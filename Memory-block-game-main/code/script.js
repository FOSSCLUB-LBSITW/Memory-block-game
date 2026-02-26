document.addEventListener("DOMContentLoaded", () => {
    // ── Theme state ──────────────────────────────────────────────────────────
    let themes = [];
    let activeTheme = null;

    // Emoji pool — fallback when theme has fewer characters than needed
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
  
    /* ── Sound setup (NEW) ───────────────────── */
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
        if (!isMuted) {
            sound.currentTime = 0;
            sound.play();
        }
    }
    /* ───────────────────────────────────────── */

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

    // ── Theme helpers ────────────────────────────────────────────────────────

    /** Load themes.json, then fetch each theme's manifest.json to discover images. */
    async function loadThemes() {
        try {
            const res = await fetch("./themes.json");
            themes = await res.json();
        } catch (e) {
            console.warn("Could not load themes.json — using emoji fallback.", e);
            themes = [];
        }

        // For each theme, fetch its folder/manifest.json to get the image list
        await Promise.all(themes.map(async (theme) => {
            try {
                const res = await fetch(`${theme.folder}/manifest.json`);
                const filenames = await res.json();
                theme.characters = filenames.map(f => ({
                    image: `${theme.folder}/${f}`
                }));
            } catch (e) {
                console.warn(`Could not load manifest for theme "${theme.id}":`, e);
                theme.characters = [];
            }
        }));

        const sel = document.getElementById("theme-select");
        sel.innerHTML = "";

        if (themes.length === 0) {
            sel.innerHTML = "<option value=''>No themes found</option>";
            activeTheme = null;
            return;
        }

        themes.forEach((theme) => {
            const opt = document.createElement("option");
            opt.value = theme.id;
            opt.textContent = theme.name;
            sel.appendChild(opt);
        });

        // Apply the first theme by default
        applyTheme(themes[0]);
        initializeBoard();
    }

    /** Apply visual theme (background, CSS accent colour) and store character list. */
    function applyTheme(theme) {
        activeTheme = theme;

        // Background
        document.body.style.backgroundImage = `url("${theme.backgroundUrl}")`;
        document.body.style.backgroundSize   = "cover";
        document.body.style.backgroundRepeat = "no-repeat";
        document.body.style.backgroundPosition = "center";    

        // CSS accent colour variables used by cards, buttons, indicator
        const root = document.documentElement;
        root.style.setProperty("--accent",      theme.accentColor     || "#1e3a8a");
        root.style.setProperty("--accent-dark", theme.accentColorDark || "#172554");
        root.style.setProperty("--title-color", theme.titleColor      || "#1e3a8a");
    }

    /** Lock / unlock the theme dropdown alongside other pre-game controls. */
    function lockThemeControl()   { document.getElementById("theme-select").disabled = true;  }
    function unlockThemeControl() { document.getElementById("theme-select").disabled = false; }

    // ── Grid size helpers ────────────────────────────────────────────────────
    function getGridDimensions() {
        const rows = parseInt(document.getElementById("rows-select").value);
        const cols = parseInt(document.getElementById("cols-select").value);
        return { rows, cols };
    }
  
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

        // Pick `totalPairs` characters from the active theme (shuffled),
        // cycling with emoji fallback when the theme doesn't have enough.
        const themeChars = activeTheme ? shuffle([...activeTheme.characters]) : [];

        // Build card-face descriptors indexed 1..totalPairs
        const cardFaces = [];
        for (let i = 0; i < totalPairs; i++) {
            if (i < themeChars.length) {
                cardFaces.push({ type: "image", src: themeChars[i].image, name: themeChars[i].name });
            } else {
                const eIdx = (i - themeChars.length) % EMOJI_POOL.length;
                cardFaces.push({ type: "emoji", ...EMOJI_POOL[eIdx] });
            }
        }

        // Each face appears twice, shuffle positions
        const shuffledFaces = shuffle([...cardFaces, ...cardFaces]);
        const pool = Array.from({ length: totalPairs }, (_, i) => i + 1);
        const shuffledIds = shuffle([...pool, ...pool]);

        generateGrid(rows, cols);
        blocks = document.querySelectorAll(".block");

        blocks.forEach((block, index) => {
            const face = shuffledFaces[index];
            block.classList.remove("flipped");
            const pairId = shuffledIds[index];
            block.className = "block";
            block.innerHTML = "";

            if (face.type === "image") {
                const img = document.createElement("img");
                img.src  = face.src;
                img.alt  = face.name || "Character";
                img.style.display = "none";
                block.appendChild(img);
                block.dataset.cardType = "image";
            } else {
                const emojiEl = document.createElement("div");
                emojiEl.classList.add("emoji-face");
                emojiEl.textContent = face.emoji;
                emojiEl.style.backgroundColor = face.color;
                emojiEl.style.display = "none";
                block.appendChild(emojiEl);
                block.dataset.cardType = "emoji";
            }

            // Store face src/emoji as the match key (reliable deduplication)
            block.dataset.matchKey = face.type === "image" ? face.src : face.emoji;

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
            container.innerHTML += `<div class="score-card">Player ${i}: <span id="score${i}">0</span></div>`;
        }

        currentPlayer = 1;
        document.getElementById("turn-indicator").textContent = "Player 1's Turn";
    }

    function flipBlock() {
        if (lockBoard || gameOver || this === firstBlock) return;

        if (!gameStarted) {
            gameStarted = true;
            document.getElementById("player-count").disabled = true;
            lockGridControls();
            lockThemeControl();
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
        const isMatch = firstBlock.dataset.matchKey === secondBlock.dataset.matchKey;
        isMatch ? disableBlocks() : unflipBlocks();
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

        document.getElementById("player-count").disabled = false;
        unlockGridControls();
        unlockThemeControl();
        clearGridHintError();
        document.getElementById("difficulty-select").disabled = false;
        rowsSelect.disabled = false;
        colsSelect.disabled = false;

        createScoreboard();
        initializeBoard();
        document.getElementById("congratulation-popup").style.display = "none";
    }

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

    document.getElementById("theme-select").addEventListener("change", function () {
        if (gameStarted) return;
        const selected = themes.find(t => t.id === this.value);
        if (selected) {
            applyTheme(selected);
            resetGame();
        }
    });

    // ── Bootstrap ────────────────────────────────────────────────────────────
    createScoreboard();
    // Themes are loaded first; loadThemes() calls initializeBoard() after
    loadThemes();
});
document.addEventListener("DOMContentLoaded", () => {

    /* ── THEME TOGGLE ─────────────────── */
    const themeBtn = document.getElementById("theme-toggle");
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeBtn.textContent = "☀️ Light Mode";
    }

    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const isDark = document.body.classList.contains("dark");
        themeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
    /* ────────────────────────────────── */

    // 🔊 Sound logic (your existing code can stay here)
    // 🎮 Game logic (unchanged)
});