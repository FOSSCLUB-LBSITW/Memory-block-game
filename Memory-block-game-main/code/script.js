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