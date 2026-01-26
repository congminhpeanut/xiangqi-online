const socket = io();

// State
let myRole = null; // 'red', 'black', 'spectator'
let currentRoom = null;
let boardState = []; // 10x9
let selectedSquare = null; // {x, y}
let isMyTurn = false;
let gameTurn = 'red';
let isBlackTop = true; // If I am red (or spec), Black is top. If I am black, Red is top (flipped).

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
                // Invisible click target for empty squares ? 
                // Better approach: We need to handle clicks on empty squares for MOVING.
                // We'll create a grid of "cells" or handle click on board and calculate coord?
                // Handling click on board is tricky with % positioning. 
                // Let's create invisible "ghost" pieces for empty spots if selected.
                if (selectedSquare) {
                    const el = document.createElement('div');
                    el.className = 'move-indicator'; // Invisible but clickable
                    el.style.cursor = 'pointer';
                    const pos = getBoardPos(x, y);
                    el.style.left = pos.left;
                    el.style.top = pos.top;
                    el.onclick = (e) => handleSquareClick(x, y);

                    // Optional: Show dot if valid move? (Requires simulating logic or server hint)
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

// --- Socket Events ---

socket.on('init', (data) => {
    myRole = data.role;
    currentRoom = data.room;
    boardState = data.fen;
    gameTurn = data.turn;

    // Set board orientation
    // Default isBlackTop=true (Red at bottom)
    // If I am black, I want Red at top (isBlackTop=false concept, but basically inverted)
    // Actually simpler: 
    // If I am Red (or Spec), view is Normal (Red Bottom).
    // If I am Black, view is Inverted (Black Bottom).
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

    // URL
    history.pushState({}, '', `?room=${currentRoom}`);
});

socket.on('update', (data) => {
    boardState = data.board;
    gameTurn = data.turn;
    renderBoard();
    updateStatus();

    // Play sound?
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
});

// --- UI Listeners ---

btnCreate.onclick = () => {
    const uuid = Math.random().toString(36).substring(2, 8); // Simple ID
    socket.emit('join_room', uuid);
};

btnJoin.onclick = () => {
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
