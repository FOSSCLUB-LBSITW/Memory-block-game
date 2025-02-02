document.addEventListener("DOMContentLoaded", () => {
    const gameBoard = document.getElementById("game-board");
    const easyButton = document.getElementById("easy-level");
    const mediumButton = document.getElementById("medium-level");
    const resetButton = document.getElementById("reset");
    const popup = document.getElementById("congratulation-popup");
    const playAgainButton = document.getElementById("play-again");
    const levelSelection = document.querySelector(".level-selection");

    // Music control elements
    const toggleMusicButton = document.getElementById("toggle-music");
    const backgroundMusic = document.getElementById("background-music");

    let images, gridSize, currentLevel;
    let matchedPairs = 0;
    let hasFlippedBlock = false;
    let lockBoard = false;
    let firstBlock, secondBlock;
    let blocks;

    easyButton.addEventListener("click", () => startGame(6, "easy"));
    mediumButton.addEventListener("click", () => startGame(10, "medium"));
    resetButton.addEventListener("click", resetGame);
    playAgainButton.addEventListener("click", resetGame);

    // Music toggle functionality
    let isMusicPlaying = false;
    toggleMusicButton.addEventListener("click", () => {
        if (isMusicPlaying) {
            backgroundMusic.pause();
            toggleMusicButton.textContent = "Play Music";
        } else {
            backgroundMusic.play();
            toggleMusicButton.textContent = "Pause Music";
        }
        isMusicPlaying = !isMusicPlaying;
    });

    function startGame(numImages, level) {
        currentLevel = level;
        levelSelection.style.display = "none";
        gameBoard.innerHTML = "";
        matchedPairs = 0;

        if (numImages === 6) {
            images = [
                "./images/img1.jpg", "./images/img1.jpg",
                "./images/img2.jpg", "./images/img2.jpg",
                "./images/img3.jpg", "./images/img3.jpg",
                "./images/img4.jpg", "./images/img4.jpg",
                "./images/img5.jpg", "./images/img5.jpg",
                "./images/img6.jpg", "./images/img6.jpg"
            ];
            gridSize = 4;
            gameBoard.style.gridTemplateColumns = "repeat(4, 100px)";
            gameBoard.classList.add("easy");
        } else if (numImages === 10) {
            images = [
                "./images/img1.jpg", "./images/img1.jpg",
                "./images/img2.jpg", "./images/img2.jpg",
                "./images/img3.jpg", "./images/img3.jpg",
                "./images/img4.jpg", "./images/img4.jpg",
                "./images/img5.jpg", "./images/img5.jpg",
                "./images/img6.jpg", "./images/img6.jpg",
                "./images/img7.jpg", "./images/img7.jpg",
                "./images/img8.jpg", "./images/img8.jpg",
                "./images/img9.jpg", "./images/img9.jpg",
                "./images/img10.jpg", "./images/img10.jpg"
            ];
            gridSize = 5;
            gameBoard.style.gridTemplateColumns = "repeat(5, 100px)";
            gameBoard.classList.add("medium");
        }

        const shuffledImages = shuffle(images);

        for (let i = 0; i < images.length; i++) {
            const block = document.createElement("div");
            block.classList.add("block");
            block.dataset.image = shuffledImages[i];
            const img = document.createElement("img");
            img.src = shuffledImages[i];
            img.alt = "Memory Image";
            block.appendChild(img);
            gameBoard.appendChild(block);
        }

        blocks = document.querySelectorAll(".block");
        blocks.forEach(block => block.addEventListener("click", flipBlock));
        resetBoard();
    }

    function flipBlock() {
        if (lockBoard) return;
        if (this === firstBlock) return;

        this.classList.add("flipped");
        const img = this.querySelector("img");
        img.style.display = "block";

        if (!hasFlippedBlock) {
            hasFlippedBlock = true;
            firstBlock = this;
            return;
        }

        secondBlock = this;
        checkForMatch();
    }

    function checkForMatch() {
        let isMatch = firstBlock.dataset.image === secondBlock.dataset.image;
        if (isMatch) {
            disableBlocks();
        } else {
            unflipBlocks();
        }
    }

    function disableBlocks() {
        firstBlock.removeEventListener("click", flipBlock);
        secondBlock.removeEventListener("click", flipBlock);
        matchedPairs++;

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
            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        [hasFlippedBlock, lockBoard] = [false, false];
        [firstBlock, secondBlock] = [null, null];
    }

    function showCongratulations() {
        popup.style.display = "block";
    }

    function resetGame() {
        matchedPairs = 0;
        popup.style.display = "none";
        blocks.forEach(block => {
            block.classList.remove("flipped");
            block.querySelector("img").style.display = "none";
            block.addEventListener("click", flipBlock);
        });

        const shuffledImages = shuffle(images);
        blocks.forEach((block, index) => {
            block.dataset.image = shuffledImages[index];
            block.querySelector("img").src = shuffledImages[index];
        });
        resetBoard();

        if (currentLevel === "easy") {
            startGame(6, "easy");
        } else if (currentLevel === "medium") {
            startGame(10, "medium");
        }
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});
