const socket = io();

// State
let myRole = null; // 'red', 'black', 'spectator'
let currentRoom = null;
let boardState = []; // 10x9
let selectedSquare = null; // {x, y}
let isMyTurn = false;
let gameTurn = 'red';
let isBlackTop = true; // If I am red (or spec), Black is top. If I am black, Red is top (flipped).
let timeLeft = { red: 600000, black: 600000 };
let lastMoveTime = null;
let timerInterval = null;

// Audio Context for synthesized sounds
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(isCapture) {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (isCapture) {
        // "Thud" / Capture sound: Lower pitch, rapid decay
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } else {
        // "Clack" / Move sound: Higher pitch, very short
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }
}


// DOM Elements
const screens = {
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen')
};
const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const inputRoomId = document.getElementById('input-room-id');
const boardEl = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const timerTop = document.getElementById('timer-top'); // Added
const timerBottom = document.getElementById('timer-bottom'); // Added
const messageArea = document.getElementById('message-area');
const btnCopy = document.getElementById('btn-copy-link');
const btnLeave = document.getElementById('btn-leave');
const modal = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMsg = document.getElementById('modal-message');
const btnRestart = document.getElementById('btn-restart');
const btnHome = document.getElementById('btn-home');


// --- Helpers ---
function showScreen(name) {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    screens[name].classList.remove('hidden');
}

function getBoardPos(x, y) {
    let vicX = x;
    let vicY = y;

    if (!isBlackTop && myRole === 'black') {
        vicX = 8 - x;
        vicY = 9 - y;
    }

    return {
        left: `calc((${vicX} * 100%) / 9)`,
        top: `calc((${vicY} * 100%) / 10)`
    };
}

function renderBoard() {
    boardEl.innerHTML = '<div class="river">楚 河 &nbsp;&nbsp;&nbsp;&nbsp; 漢 界</div>'; // Clear but keep river

    // Draw pieces
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 9; x++) {
            const piece = boardState[y][x];
            if (piece) {
                const el = document.createElement('div');
                el.className = 'piece';
                el.innerHTML = getPieceSVG(piece);
                const pos = getBoardPos(x, y);
                el.style.left = pos.left;
                el.style.top = pos.top;

                // Click handler
                el.onclick = (e) => handleSquareClick(x, y);

                if (selectedSquare && selectedSquare.x === x && selectedSquare.y === y) {
                    el.classList.add('selected');
                }

                boardEl.appendChild(el);
            } else {
                // Invisible click target for empty squares
                if (selectedSquare) {
                    const el = document.createElement('div');
                    el.className = 'move-indicator'; // Invisible but clickable
                    el.style.cursor = 'pointer';
                    const pos = getBoardPos(x, y);
                    el.style.left = pos.left;
                    el.style.top = pos.top;
                    el.onclick = (e) => handleSquareClick(x, y);

                    // MVP: Just clickable.
                    boardEl.appendChild(el);
                }
            }
        }
    }
}

function handleSquareClick(x, y) {
    if (!isMyTurn) return;

    const piece = boardState[y][x];
    const isOwnPiece = piece && (
        (myRole === 'red' && piece.startsWith('r')) ||
        (myRole === 'black' && piece.startsWith('b'))
    );

    if (isOwnPiece) {
        // Select logic
        if (selectedSquare && selectedSquare.x === x && selectedSquare.y === y) {
            selectedSquare = null; // Deselect
        } else {
            selectedSquare = { x, y };
        }
        renderBoard();
    } else {
        // Move logic
        if (selectedSquare) {
            socket.emit('make_move', {
                roomId: currentRoom,
                from: selectedSquare,
                to: { x, y }
            });
            selectedSquare = null;
            renderBoard(); // Optimistic update? No, wait for server.
        }
    }
}

function updateStatus() {
    const isRedTurn = gameTurn === 'red';
    const turnText = isRedTurn ? "RED'S Turn" : "BLACK'S Turn";

    turnIndicator.innerText = turnText;
    turnIndicator.style.borderColor = isRedTurn ? '#d00' : '#000';
    turnIndicator.style.color = isRedTurn ? '#d00' : '#aaa';

    isMyTurn = (myRole === gameTurn);
}

function formatTime(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateTimers() {
    // Only update if we have a lastMoveTime (game started)
    let redTime = timeLeft.red;
    let blackTime = timeLeft.black;

    if (lastMoveTime) {
        const now = Date.now();
        const elapsed = now - lastMoveTime;
        if (gameTurn === 'red') redTime -= elapsed;
        else blackTime -= elapsed;
    }

    // Determine who is top/bottom
    let bottomTime, topTime;

    if (myRole === 'black') {
        bottomTime = blackTime;
        topTime = redTime;
    } else {
        bottomTime = redTime;
        topTime = blackTime;
    }

    timerBottom.innerText = formatTime(bottomTime);
    timerTop.innerText = formatTime(topTime);

    // Styling for low time
    if (bottomTime < 30000) timerBottom.classList.add('low');
    else timerBottom.classList.remove('low');

    if (topTime < 30000) timerTop.classList.add('low');
    else timerTop.classList.remove('low');
}

function startCountdown() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        updateTimers();
    }, 100); // 100ms for smoothness
}

// --- Socket Events ---

socket.on('init', (data) => {
    myRole = data.role;
    currentRoom = data.room;
    boardState = data.fen;
    gameTurn = data.turn;

    if (data.timeLeft) timeLeft = data.timeLeft;
    if (data.lastMoveTime) lastMoveTime = data.lastMoveTime;

    // Set board orientation
    isBlackTop = true; // This matches "Red at bottom"

    // Update UI info
    const me = document.querySelector('#bottom-player .name');
    const op = document.querySelector('#top-player .name');

    if (myRole === 'spectator') {
        me.innerText = 'Spectator';
        op.innerText = 'Players';
    } else {
        me.innerText = `You (${myRole.toUpperCase()})`;
        op.innerText = 'Opponent';
    }

    showScreen('game');
    renderBoard();
    updateStatus();
    startCountdown();

    // URL
    history.pushState({}, '', `?room=${currentRoom}`);
});

socket.on('update', (data) => {
    boardState = data.board;
    gameTurn = data.turn;

    if (data.timeLeft) timeLeft = data.timeLeft;
    if (data.lastMoveTime) lastMoveTime = data.lastMoveTime;

    renderBoard();
    updateStatus();

    // Play sound
    if (data.lastMove) {
        playSound(data.lastMove.captured);
    }
});

socket.on('player_joined', (data) => {
    messageArea.innerText = `Player ${data.role} joined!`;
    setTimeout(() => messageArea.innerText = '', 3000);
});

socket.on('player_left', (data) => {
    messageArea.innerText = `Player ${data.role} disconnected!`;
});

socket.on('error', (msg) => {
    alert(msg);
});

socket.on('game_over', (data) => {
    modalTitle.innerText = "Game Over";
    if (data.winner === myRole) {
        modalMsg.innerText = "Congratulations! You Won!";
    } else if (myRole === 'spectator') {
        modalMsg.innerText = `${data.winner.toUpperCase()} Won!`;
    } else {
        modalMsg.innerText = "You Lost. Better luck next time!";
    }
    modal.classList.remove('hidden');
    if (timerInterval) clearInterval(timerInterval);
});

// --- UI Listeners ---

btnCreate.onclick = () => {
    initAudio();
    const uuid = Math.random().toString(36).substring(2, 8); // Simple ID
    socket.emit('join_room', uuid);
};

btnJoin.onclick = () => {
    initAudio();
    const id = inputRoomId.value.trim();
    if (id) socket.emit('join_room', id);
};

btnCopy.onclick = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Copied to clipboard!");
};

btnLeave.onclick = () => {
    window.location.href = '/';
};

btnRestart.onclick = () => {
    socket.emit('restart_game', currentRoom);
    modal.classList.add('hidden');
};

btnHome.onclick = () => {
    window.location.href = '/';
};

// Check URL params
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam) {
    inputRoomId.value = roomParam;
    // Auto join? Maybe just fill input
    // socket.emit('join_room', roomParam); 
}
