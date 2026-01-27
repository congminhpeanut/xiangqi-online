const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const XiangqiGame = require('./game');

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

    socket.on('join_room', (roomId) => {
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
                spectators: []
            };
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
            lastMoveTime: room.game.lastMoveTime
        });

        // Notify others
        io.to(roomId).emit('player_joined', { role: role });

        // If both players are present, start the timer (if not already started)
        if (room.players.red && room.players.black && !room.game.lastMoveTime && room.game.history.length === 0) {
            room.game.startTimer();
            io.to(roomId).emit('update', {
                board: room.game.board,
                turn: room.game.turn,
                history: room.game.history,
                timeLeft: room.game.timeLeft,
                lastMoveTime: room.game.lastMoveTime
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
                lastMoveTime: room.game.lastMoveTime
            });

            if (room.game.winner) {
                io.to(roomId).emit('game_over', { winner: room.game.winner });
            }
        } else {
            socket.emit('invalid_move'); // Client should mostly prevent this, but just in case
        }
    });

    socket.on('restart_game', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        // Only players can restart
        if (room.players.red !== socket.id && room.players.black !== socket.id) return;

        room.game = new XiangqiGame();

        // If both players still here, start timer
        if (room.players.red && room.players.black) {
            room.game.startTimer();
        }

        io.to(roomId).emit('update', {
            board: room.game.board,
            turn: room.game.turn,
            history: [],
            restart: true,
            timeLeft: room.game.timeLeft,
            lastMoveTime: room.game.lastMoveTime
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
