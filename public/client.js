const socket = io();

// State
let myRole = null; // 'red', 'black', 'spectator'
let currentRoom = null;
let boardState = []; // 10x9
let selectedSquare = null; // {x, y}
let lastMove = null; // {from: {x,y}, to: {x,y}}
let isMyTurn = false;
let gameTurn = 'red';
let isBlackTop = true; // If I am red (or spec), Black is top. If I am black, Red is top (flipped).
let timeLeft = { red: 600000, black: 600000 };
let lastMoveTime = null;
let timerInterval = null;

// Audio Context for synthesized sounds
let audioCtx = null;

// --- GAME RULES (Client Side) ---
const Rules = {
    getPiece(board, x, y) {
        if (x < 0 || x > 8 || y < 0 || y > 9) return null;
        return board[y][x];
    },

    countPiecesBetween(board, x1, y1, x2, y2) {
        let count = 0;
        const dx = Math.sign(x2 - x1);
        const dy = Math.sign(y2 - y1);
        let x = x1 + dx;
        let y = y1 + dy;

        while (x !== x2 || y !== y2) {
            if (this.getPiece(board, x, y)) count++;
            x += dx;
            y += dy;
        }
        return count;
    },

    isPathClear(board, x1, y1, x2, y2) {
        return this.countPiecesBetween(board, x1, y1, x2, y2) === 0;
    },

    isValidMove(board, fromX, fromY, toX, toY, color) {
        const piece = this.getPiece(board, fromX, fromY);
        if (!piece) return false;

        // Basic bounds
        if (toX < 0 || toX > 8 || toY < 0 || toY > 9) return false;
        if (fromX === toX && fromY === toY) return false;

        // Check ownership & target
        const pieceColor = piece.charAt(0) === 'r' ? 'red' : 'black';
        if (pieceColor !== color) return false;

        const target = this.getPiece(board, toX, toY);
        if (target) {
            const targetColor = target.charAt(0) === 'r' ? 'red' : 'black';
            if (targetColor === color) return false;
        }

        const type = piece.slice(1);
        const dx = toX - fromX;
        const dy = toY - fromY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        let valid = false;

        switch (type) {
            case 'ge': // General
                if ((absDx === 1 && absDy === 0) || (absDx === 0 && absDy === 1)) {
                    const inPalaceX = toX >= 3 && toX <= 5;
                    const inPalaceY = color === 'red' ? (toY >= 7 && toY <= 9) : (toY >= 0 && toY <= 2);
                    if (inPalaceX && inPalaceY) valid = true;
                }
                break;
            case 'ad': // Advisor
                if (absDx === 1 && absDy === 1) {
                    const inPalaceX = toX >= 3 && toX <= 5;
                    const inPalaceY = color === 'red' ? (toY >= 7 && toY <= 9) : (toY >= 0 && toY <= 2);
                    if (inPalaceX && inPalaceY) valid = true;
                }
                break;
            case 'el': // Elephant
                if (absDx === 2 && absDy === 2) {
                    const crossedRiver = color === 'red' ? toY < 5 : toY > 4;
                    if (!crossedRiver) {
                        const eyeX = fromX + dx / 2;
                        const eyeY = fromY + dy / 2;
                        if (!this.getPiece(board, eyeX, eyeY)) valid = true;
                    }
                }
                break;
            case 'ma': // Horse
                if ((absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1)) {
                    const legX = absDx === 2 ? fromX + dx / 2 : fromX;
                    const legY = absDy === 2 ? fromY + dy / 2 : fromY;
                    if (!this.getPiece(board, legX, legY)) valid = true;
                }
                break;
            case 'ro': // Rook
                if ((absDx > 0 && absDy === 0) || (absDx === 0 && absDy > 0)) {
                    if (this.isPathClear(board, fromX, fromY, toX, toY)) valid = true;
                }
                break;
            case 'ca': // Cannon
                if ((absDx > 0 && absDy === 0) || (absDx === 0 && absDy > 0)) {
                    const count = this.countPiecesBetween(board, fromX, fromY, toX, toY);
                    if (!target) {
                        if (count === 0) valid = true;
                    } else {
                        if (count === 1) valid = true;
                    }
                }
                break;
            case 'so': // Soldier
                const forward = color === 'red' ? -1 : 1;
                if (dx === 0 && dy === forward) {
                    valid = true;
                } else if (absDx === 1 && dy === 0) {
                    const crossedRiver = color === 'red' ? fromY <= 4 : fromY >= 5;
                    if (crossedRiver) valid = true;
                }
                break;
        }
        return valid;
    },

    getPossibleMoves(board, fromX, fromY, color) {
        const moves = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                if (this.isValidMove(board, fromX, fromY, x, y, color)) {
                    moves.push({ x, y });
                }
            }
        }
        return moves;
    }
};

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(isCapture) {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Wood Checkers / Chess Sound synthesis
    const t = audioCtx.currentTime;

    // Impact noise (short burst)
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = audioCtx.createGain();

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    // Tonal body (wood resonance)
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (isCapture) {
        // "Heavy Thud" 
        // Noise
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        noise.start(t);

        // Tone
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
        gainNode.gain.setValueAtTime(0.8, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.start(t);
        osc.stop(t + 0.2);
    } else {
        // "Quick Clack"
        // Noise (more treble)
        noiseFilter.frequency.value = 2000;
        noiseGain.gain.setValueAtTime(0.6, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
        noise.start(t);

        // Tone
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
        gainNode.gain.setValueAtTime(0.5, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        osc.start(t);
        osc.stop(t + 0.1);
    }
}

function playFanfare(isVictory) {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;
    const masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.setValueAtTime(0.5, t); // Volume control

    // Helper for note
    const playNote = (freq, time, dur, type = 'triangle') => {
        const osc = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = type;
        osc.connect(gn);
        gn.connect(masterGain);
        gn.gain.setValueAtTime(0, time);
        gn.gain.linearRampToValueAtTime(1, time + 0.05);
        gn.gain.exponentialRampToValueAtTime(0.01, time + dur);
        osc.start(time);
        osc.stop(time + dur);
    };

    if (isVictory) {
        // Major Arpeggio (C Major: C4, E4, G4, C5)
        playNote(261.63, t, 0.5); // C4
        playNote(329.63, t + 0.15, 0.5); // E4
        playNote(392.00, t + 0.3, 0.5); // G4
        playNote(523.25, t + 0.45, 1.5, 'sine'); // C5
    } else {
        // Sad Minor Descend
        playNote(392.00, t, 0.4); // G4
        playNote(311.13, t + 0.4, 0.4); // Eb4
        playNote(261.63, t + 0.8, 1.5, 'sawtooth'); // C4
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
const timerTop = document.getElementById('timer-top');
const timerBottom = document.getElementById('timer-bottom');
const messageArea = document.getElementById('message-area');
const btnCopy = document.getElementById('btn-copy-link');
const btnLeave = document.getElementById('btn-leave');
const modal = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMsg = document.getElementById('modal-message');
const modalInner = document.querySelector('.modal'); // Need to target inner for border styling
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
    boardEl.innerHTML = `
        <div class="river">楚 河 &nbsp;&nbsp;&nbsp;&nbsp; 漢 界</div>
        <div class="palace-top"></div>
        <div class="palace-bottom"></div>
    `;

    // Draw last move highlights
    if (lastMove) {
        // From
        const fromDiv = document.createElement('div');
        fromDiv.className = 'last-move-src';
        const posFrom = getBoardPos(lastMove.from.x, lastMove.from.y);
        fromDiv.style.left = `calc(${posFrom.left} + 5.55%)`; // Center it (11.11 / 2)
        fromDiv.style.top = `calc(${posFrom.top} + 5%)`;     // Center it (10 / 2)
        boardEl.appendChild(fromDiv);

        // To
        const toDiv = document.createElement('div');
        toDiv.className = 'last-move-dest';
        const posTo = getBoardPos(lastMove.to.x, lastMove.to.y);
        toDiv.style.left = `calc(${posTo.left} + 5.55%)`;
        toDiv.style.top = `calc(${posTo.top} + 5%)`;
        boardEl.appendChild(toDiv);
    }

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
            }
        }
    }

    // Indicators for VALID MOVES only
    if (selectedSquare && isMyTurn) {
        const moves = Rules.getPossibleMoves(boardState, selectedSquare.x, selectedSquare.y, myRole);

        moves.forEach(move => {
            const targetPiece = boardState[move.y][move.x];

            // Create indicator
            const el = document.createElement('div');
            el.className = 'move-indicator';

            const pos = getBoardPos(move.x, move.y);
            el.style.left = pos.left;
            el.style.top = pos.top;
            el.onclick = (e) => {
                e.stopPropagation(); // Prevent bubbling if needed
                handleSquareClick(move.x, move.y);
            };

            const dot = document.createElement('div');
            dot.className = targetPiece ? 'target' : 'dot';
            el.appendChild(dot);

            boardEl.appendChild(el);
        });
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
            // Validate client side first for instant feedback (optional but good)
            if (Rules.isValidMove(boardState, selectedSquare.x, selectedSquare.y, x, y, myRole)) {
                socket.emit('make_move', {
                    roomId: currentRoom,
                    from: selectedSquare,
                    to: { x, y }
                });
                selectedSquare = null;
                // No optimistic update, wait for server
            } else {
                // Shake or something?
                console.log("Invalid move prevented by client.");
            }
        }
    }
}

function updateStatus() {
    const isRedTurn = gameTurn === 'red';
    const turnText = isRedTurn ? "RED'S Turn" : "BLACK'S Turn";

    turnIndicator.innerText = turnText;
    // status styling updated in CSS
    turnIndicator.style.borderColor = isRedTurn ? '#e63946' : '#111';
    turnIndicator.style.color = isRedTurn ? '#e63946' : '#aaa';

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

    // Attempt to recover lastMove from data if available, or cleared
    if (data.lastMove) {
        lastMove = data.lastMove;
    } else {
        lastMove = null;
    }

    // Set board orientation
    // If I am Red, Black is Top (true).
    // If I am Black, Red is Top (false) -> I am at bottom.
    // Spec sees standard (Red at bottom -> Black at top -> true).
    if (myRole === 'black') {
        isBlackTop = false;
    } else {
        isBlackTop = true;
    }

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

    // Store last move for highlighting
    if (data.lastMove) {
        lastMove = data.lastMove;
    }

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
    let isVictory = false;
    modalTitle.innerText = "GAME OVER";
    modalInner.classList.remove('result-victory', 'result-defeat'); // Reset

    if (data.winner === myRole) {
        modalMsg.innerText = "VICTORY";
        modalTitle.innerText = "YOU WON!";
        modalTitle.style.color = 'var(--primary-color)';
        modalInner.classList.add('result-victory');
        isVictory = true;
    } else if (myRole === 'spectator') {
        modalMsg.innerText = `${data.winner.toUpperCase()} Won!`;
        modalTitle.style.color = '#fff';
    } else {
        modalMsg.innerText = "DEFEAT";
        modalTitle.innerText = "YOU LOST";
        modalTitle.style.color = 'var(--accent-red)';
        modalInner.classList.add('result-defeat');
        isVictory = false;
    }

    modal.classList.add('visible'); // Use visible class for opacity transition
    playFanfare(isVictory);

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
    // Simple toast
    const originalText = btnCopy.innerText;
    btnCopy.innerText = "Copied!";
    setTimeout(() => btnCopy.innerText = originalText, 2000);
};

btnLeave.onclick = () => {
    window.location.href = '/';
};

btnRestart.onclick = () => {
    socket.emit('restart_game', currentRoom);
    modal.classList.remove('visible');
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
