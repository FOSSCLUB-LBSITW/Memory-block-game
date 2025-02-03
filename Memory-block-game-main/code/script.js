document.addEventListener("DOMContentLoaded", () => {
    // Array of imagess
    const images = [
        "./images/img1.jpg",
        "./images/img1.jpg",
        "./images/img2.jpg",
        "./images/img2.jpg",
        "./images/img3.jpg",
        "./images/img3.jpg",
        "./images/img4.jpg",
        "./images/img4.jpg",
        "./images/img5.jpg",
        "./images/img5.jpg",
        "./images/img6.jpg",
        "./images/img6.jpg",
    ];

    //Fisher-Yates algorithm
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const shuffledImages = shuffle(images);

    // Select all blocks and assign shuffled images
    const blocks = document.querySelectorAll(".block");
    blocks.forEach((block, index) => {
        const img = document.createElement("img");
        img.src = shuffledImages[index];
        img.alt = "Memory Image";
        img.style.display = "none"; // Initially hidden
        block.appendChild(img);
        block.dataset.image = shuffledImages[index];
    });

    let matchedPairs = 0;
    let hasFlippedBlock = false;
    let lockBoard = false;
    let firstBlock, secondBlock;


    blocks.forEach(block => block.addEventListener("click", flipBlock));

    function flipBlock() {
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
        let isMatch = firstBlock.dataset.image === secondBlock.dataset.image;
        isMatch ? disableBlocks() : unflipBlocks();
    }

    function disableBlocks() {
        firstBlock.removeEventListener("click", flipBlock);
        secondBlock.removeEventListener("click", flipBlock);
        matchedPairs++;

        if (matchedPairs === blocks.length / 2) {
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
        const popup = document.getElementById("congratulation-popup");
        popup.style.display = "block";
        stopTimer();
    }

    function resetGame() {
        // Reset the matched pairs counter
        matchedPairs = 0;
        // Reset the timer
        timer(60)

        // Hide the popup
        const popup = document.getElementById("congratulation-popup");
        popup.style.display = "none";

        // Reset all blocks
        blocks.forEach(block => {
            block.classList.remove("flipped");
            block.querySelector("img").style.display = "none";
            block.addEventListener("click", flipBlock);
        });

        // Shuffle the images and reassign them to blocks
        const shuffledImages = shuffle(images);
        blocks.forEach((block, index) => {
            block.dataset.image = shuffledImages[index];
            block.querySelector("img").src = shuffledImages[index];
        });
    }

    const playAgainButton = document.getElementById("play-again");
    playAgainButton.addEventListener("click", resetGame);

    document.getElementById("reset").addEventListener("click", resetGame);


    let remainingTime;
    let interval;

    /**
     * Starts a countdown timer that updates the UI every second.
     * Displays remaining seconds modulo 60. Shows game-over popup when time expires.
     * @param {number} seconds - Initial countdown duration in seconds
     * @example
     * // Starts 60-second timer showing 0-59 repeatedly in #count element
     * timer(60);
     */
    function timer(seconds) {
        remainingTime = seconds;
        interval = setInterval(() => {
            let seg = remainingTime % 60;

            document.getElementById("count").textContent = seg;

            if (remainingTime === 0) {
                stopTimer();
                document.getElementById("game-over-popup").style.display = "block";
            } else {
                remainingTime--;
            }
        }, 1000);
    }

    /**
     * Halts the active countdown timer by clearing the interval.
     * Companion to timer() function for managing timed game sessions.
     */
    function stopTimer() {
        clearInterval(interval);
    }

    /**
     * Resets game state: hides popup, unflips blocks, reshuffles images.
     * Requires predefined 'blocks' array and 'shuffle' function in scope.
     * Reattaches click listeners to blocks for game interaction.
     */
    function tryAgain() {
        document.getElementById("game-over-popup").style.display = "none";
        timer(60)

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
    }

    // Event binding for game reset functionality
    document.getElementById("retry").addEventListener("click", tryAgain)

    // Initial game start with 60-second countdown (displays 0-59 due to modulo operation)
    timer(60)

});
