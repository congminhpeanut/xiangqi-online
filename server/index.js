const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const XiangqiGame = require('./game');
const AI = require('./ai');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// Room management
const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (data) => {
        // Support both string (old) and object (new)
        let roomId, options = {};
        if (typeof data === 'string') {
            roomId = data;
        } else {
            roomId = data.roomId;
            options = data.options || {};
        }

        let room = rooms[roomId];

        // Create room if not exists
        if (!room) {
            room = {
                id: roomId,
                game: new XiangqiGame(),
                players: {
                    red: null,
                    black: null
                },
                spectators: [],
                mode: options.mode || 'pvp', // 'pvp' or 'ai'
                difficulty: options.difficulty || 'normal',
                ai: null
            };

            if (room.mode === 'ai') {
                room.ai = new AI(room.difficulty);
                room.players.black = 'AI'; // Reserve black for AI
            }

            rooms[roomId] = room;
        }

        // Assign Role
        let role = 'spectator';
        if (!room.players.red) {
            room.players.red = socket.id;
            role = 'red';
        } else if (!room.players.black) {
            room.players.black = socket.id;
            role = 'black';
        } else {
            room.spectators.push(socket.id);
        }

        socket.join(roomId);

        // Send initial state
        socket.emit('init', {
            role: role,
            room: roomId,
            fen: room.game.board, // We send the raw board array
            turn: room.game.turn,
            history: room.game.history,
            isBlackTop: true, // Standard view
            timeLeft: room.game.timeLeft,
            lastMoveTime: room.game.lastMoveTime,
            players: {
                red: !!room.players.red,
                black: !!room.players.black
            }
        });

        // Notify others
        io.to(roomId).emit('player_joined', { role: role });

        // If both players are present, start the timer (if not already started)
        if (room.players.red && room.players.black && !room.game.lastMoveTime && room.game.history.length === 0) {
            // room.game.startTimer(); // WAIT for first move
            io.to(roomId).emit('update', {
                board: room.game.board,
                turn: room.game.turn,
                history: room.game.history,
                timeLeft: room.game.timeLeft,
                lastMoveTime: room.game.lastMoveTime,
                players: {
                    red: !!room.players.red,
                    black: !!room.players.black
                }
            });
        }

        // Handle disconnect within room context
        socket.on('disconnect', () => {
            if (room.players.red === socket.id) {
                room.players.red = null;
                io.to(roomId).emit('player_left', { role: 'red' });
            } else if (room.players.black === socket.id) {
                room.players.black = null;
                io.to(roomId).emit('player_left', { role: 'black' });
            } else {
                room.spectators = room.spectators.filter(id => id !== socket.id);
            }
        });
    });

    socket.on('make_move', ({ roomId, from, to }) => {
        const room = rooms[roomId];
        if (!room) return;

        // Check if both players are present
        if (!room.players.red || !room.players.black) {
            socket.emit('error', 'Waiting for opponent to join!');
            return;
        }

        // Validation: Is it this player's turn?
        const playerRole = room.players.red === socket.id ? 'red' : (room.players.black === socket.id ? 'black' : 'spectator');

        if (playerRole !== room.game.turn) {
            socket.emit('error', 'Not your turn');
            return;
        }

        // Timer Check BEFORE move
        const timeOk = room.game.updateTimer();
        if (!timeOk) {
            io.to(roomId).emit('game_over', { winner: room.game.turn === 'red' ? 'black' : 'red', reason: 'timeout' });
            return;
        }

        const success = room.game.makeMove(from.x, from.y, to.x, to.y);

        if (success) {
            // Restart timer for next player (since turn checked in makeMove, we need to be careful)
            // makeMove switches turn. So now it is NEXT player's turn. 
            // We need to set startTimer() to marks the beginning of their turn.
            room.game.startTimer();

            io.to(roomId).emit('update', {
                board: room.game.board,
                turn: room.game.turn,
                lastMove: { from, to },
                history: room.game.history,
                timeLeft: room.game.timeLeft,
                lastMoveTime: room.game.lastMoveTime,
                players: {
                    red: !!room.players.red,
                    black: !!room.players.black
                }
            });

            if (room.game.winner) {
                io.to(roomId).emit('game_over', { winner: room.game.winner });
            }
        } else {
            socket.emit('invalid_move');
        }

        // --- AI TURN HANDLING ---
        if (success && room.mode === 'ai' && !room.game.winner && room.game.turn === 'black') {
            // Slight delay for realism
            setTimeout(() => {
                handleAIMove(roomId);
            }, 500);
        }
    });

    const handleAIMove = (roomId) => {
        const room = rooms[roomId];
        if (!room || !room.ai) {
            console.log('[AI Handler] No room or AI found');
            return;
        }

        // Check if game over already (e.g. player mated AI in previous turn logic?)
        // The previous block handles game_over check, but let's be safe.
        if (room.game.winner) {
            console.log('[AI Handler] Game already has winner');
            return;
        }

        // Timer Check for AI?
        // We can just update it.
        room.game.updateTimer();

        // Calculate Move
        const startTime = Date.now();

        // Determine Time Limit based on difficulty
        // Keep times short to avoid blocking event loop
        let timeLimit = 20000; // Extreme: 20s (max safe blocking time)
        if (room.difficulty === 'hard') timeLimit = 10000; // Hard: 10s
        if (room.difficulty === 'normal') timeLimit = 5000; // Normal: 5s
        if (room.difficulty === 'easy') timeLimit = 2000; // Easy: 2s

        console.log(`[AI Handler] Starting AI search for room ${roomId}, difficulty: ${room.difficulty}`);

        const move = room.ai.getBestMove(room.game, 'black', timeLimit);

        const endTime = Date.now();
        const thinkTime = endTime - startTime;

        console.log(`[AI Handler] AI returned move:`, move, `in ${thinkTime}ms`);

        // Deduct AI thinking time
        room.game.deductTime('black', thinkTime);

        if (move) {
            console.log(`[AI Handler] Executing move: (${move.from.x},${move.from.y}) -> (${move.to.x},${move.to.y})`);
            const moveSuccess = room.game.makeMove(move.from.x, move.from.y, move.to.x, move.to.y);
            console.log(`[AI Handler] makeMove result: ${moveSuccess}`);

            if (!moveSuccess) {
                console.error('[AI Handler] Move failed! Trying to recover...');
                // The move was invalid - this shouldn't happen but let's handle it
                return;
            }

            room.game.startTimer(); // Restart timer for human (sets lastMoveTime to NOW)

            console.log(`[AI Handler] Emitting update to room ${roomId}`);
            io.to(roomId).emit('update', {
                board: room.game.board,
                turn: room.game.turn,
                lastMove: move,
                history: room.game.history,
                timeLeft: room.game.timeLeft,
                lastMoveTime: room.game.lastMoveTime,
                players: {
                    red: !!room.players.red,
                    black: true // AI is always present
                }
            });

            if (room.game.winner) {
                io.to(roomId).emit('game_over', { winner: room.game.winner });
            }
        } else {
            // No move found? Should be stalemate/mate, which game.js handles?
            // If getBestMove returns null, it means no moves. 
            // game.makeMove checks for winner at end of turn.
            // If AI cannot move, it is lost.
            console.log('[AI Handler] No move found, AI loses');
            room.game.winner = 'red';
            io.to(roomId).emit('game_over', { winner: 'red' });
        }
    };

    socket.on('restart_game', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        // Only players can restart
        if (room.players.red !== socket.id && room.players.black !== socket.id) return;

        room.game = new XiangqiGame();

        // If both players still here, start timer
        if (room.players.red && room.players.black) {
            // room.game.startTimer(); // WAIT
        }

        io.to(roomId).emit('update', {
            board: room.game.board,
            turn: room.game.turn,
            history: [],
            restart: true,
            timeLeft: room.game.timeLeft,
            lastMoveTime: room.game.lastMoveTime,
            players: {
                red: !!room.players.red,
                black: !!room.players.black
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
