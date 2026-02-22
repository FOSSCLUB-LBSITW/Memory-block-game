const board = document.getElementById("board");
const movesEl = document.getElementById("moves");
const timeEl = document.getElementById("time");
const pairsEl = document.getElementById("pairs");
const newGameBtn = document.getElementById("newGame");
const modes = document.querySelectorAll(".mode");

const modal = document.getElementById("winModal");
const finalStats = document.getElementById("finalStats");
const playAgain = document.getElementById("playAgain");

const icons = ["🐶","🐱","🦊","🐼","🐸","🦁","🐵","🐷","🐰","🐨","🐯","🦄"];

let grid = 4;
let first=null, second=null, lock=false;
let moves=0, pairs=0;
let timer, seconds=0;

// -------- TIMER ----------
function startTimer(){
  clearInterval(timer);
  seconds=0;
  timer=setInterval(()=>{
    seconds++;
    const m=Math.floor(seconds/60);
    const s=seconds%60;
    timeEl.textContent=`${m}:${s<10?'0':''}${s}`;
  },1000);
}

// -------- GAME ----------
function createBoard(){
  board.innerHTML="";
  const total=grid*4;
  board.style.gridTemplateColumns=`repeat(${grid},110px)`;
  const pick=icons.slice(0,total/2);
  const cards=[...pick,...pick].sort(()=>Math.random()-0.5);

  cards.forEach(icon=>{
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`
      <div class="inner">
        <div class="front">?</div>
        <div class="back">${icon}</div>
      </div>`;
    card.dataset.icon=icon;
    card.onclick=()=>flip(card);
    board.appendChild(card);
  });

  moves=0; pairs=0;
  movesEl.textContent=0;
  pairsEl.textContent=`0/${total/2}`;
  startTimer();
}

// -------- FLIP ----------
function flip(card){
  if(lock || card===first || card.classList.contains("matched")) return;

  card.classList.add("flipped");

  if(!first){
    first=card;
    return;
  }

  second=card;
  moves++;
  movesEl.textContent=moves;
  check();
}

function check(){
  if(first.dataset.icon===second.dataset.icon){
    first.classList.add("matched");
    second.classList.add("matched");
    pairs++;
    pairsEl.textContent=`${pairs}/${(grid*4)/2}`;
    reset();
    if(pairs===(grid*4)/2) win();
  }else{
    lock=true;
    setTimeout(()=>{
      first.classList.remove("flipped");
      second.classList.remove("flipped");
      reset();
    },800);
  }
}

function reset(){
  first=null;
  second=null;
  lock=false;
}

// -------- WIN ----------
function win(){
  clearInterval(timer);
  modal.classList.remove("hidden");
  finalStats.textContent=`Moves: ${moves} | Time: ${timeEl.textContent}`;
}

// -------- CONTROLS ----------
modes.forEach(btn=>{
  btn.onclick=()=>{
    modes.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    grid=parseInt(btn.dataset.size);
    modal.classList.add("hidden");
    createBoard();
  }
});

newGameBtn.onclick=()=>{ modal.classList.add("hidden"); createBoard(); }
playAgain.onclick=()=>{ modal.classList.add("hidden"); createBoard(); }

createBoard();
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
    let originalTiePlayers = [];

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
    function disableBoardInteraction() {
    lockBoard = true;
    blocks.forEach(block => {
        block.removeEventListener("click", flipBlock);
        });
    }
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
