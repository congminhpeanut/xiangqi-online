const XiangqiGame = require('./game');

// --- PIECE-SQUARE TABLES (PST) ---
// Values are usually for RED (bottom). Black uses the reversed table.
// Scale: Pawn ~ 30-40, Chariot ~ 600.
// Let's use a standard scale.
const MG = 0; // Middlegame
const EG = 1; // Endgame phase (not implemented fully, using MG for now)

const PIECE_VALS = {
    'ro': 900, 'ma': 450, 'ca': 500, 'el': 20, 'ad': 20, 'ge': 0, 'so': 30
};

// PST for Red (Bottom, y=9 is home rank)
// Higher value = better for Red.
// Top-left is (0,0) which is deep black territory. Bottom-left is (0,9) Red corner.
// Arrays are [y][x].

// Soldier (Red)
// Wants to move forward (decrease Y) and cross river (y<=4).
const PST_SO = [
    [10, 15, 20, 25, 20, 25, 20, 15, 10], // y=0 (Black Base)
    [10, 15, 25, 30, 35, 30, 25, 15, 10],
    [5, 10, 15, 20, 20, 20, 15, 10, 5],
    [5, 10, 10, 20, 25, 20, 10, 10, 5], // y=3
    [0, 5, 5, 10, 15, 10, 5, 5, 0], // y=4 River Line
    [0, 0, 0, 0, 0, 0, 0, 0, 0], // y=5 Red Bank
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]  // y=9 Red Base
];

// Chariot/Rook (Red)
// Wants open lines, control river.
const PST_RO = [
    [10, 10, 10, 10, 10, 10, 10, 10, 10],
    [10, 15, 15, 15, 15, 15, 15, 15, 10],
    [10, 15, 15, 15, 15, 15, 15, 15, 10],
    [10, 15, 15, 15, 15, 15, 15, 15, 10],
    [10, 15, 20, 20, 20, 20, 20, 15, 10], // River control
    [10, 20, 20, 20, 20, 20, 20, 20, 10],
    [0, 10, 10, 10, 10, 10, 10, 10, 0],
    [0, 10, 10, 10, 10, 10, 10, 10, 0],
    [0, 5, 5, 10, 10, 10, 5, 5, 0],
    [-2, 5, 5, 5, 5, 5, 5, 5, -2]
];

// Horse/Ma (Red)
// Weak in corners, better center.
const PST_MA = [
    [0, 0, 5, 5, 5, 5, 5, 0, 0],
    [0, 5, 15, 20, 20, 20, 15, 5, 0],
    [5, 10, 20, 30, 30, 30, 20, 10, 5],
    [5, 10, 20, 25, 25, 25, 20, 10, 5],
    [0, 5, 10, 15, 15, 15, 10, 5, 0],
    [0, 2, 8, 10, 10, 10, 8, 2, 0],
    [0, 0, 5, 8, 8, 8, 5, 0, 0],
    [0, 2, 2, 2, 2, 2, 2, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [-2, -2, -2, -2, -2, -2, -2, -2, -2] // Trapped at home
];

// Cannon (Red)
// Good deeply, river banks.
const PST_CA = [
    [5, 5, 10, 15, 20, 15, 10, 5, 5],
    [5, 5, 10, 10, 10, 10, 10, 5, 5],
    [5, 5, 10, 15, 15, 15, 10, 5, 5],
    [5, 5, 10, 10, 10, 10, 10, 5, 5],
    [5, 10, 10, 10, 10, 10, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 2, 2, 5, 10, 5, 2, 2, 2], // Home defense
    [2, 2, 2, 2, 5, 2, 2, 2, 2],
    [2, 2, 2, 2, 5, 2, 2, 2, 2]
];

// Guard/Advisor (Red) - Palace only
const PST_AD = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0], // y=7
    [0, 0, 0, 0, 5, 0, 0, 0, 0], // y=8
    [0, 0, 0, 0, 0, 0, 0, 0, 0]  // y=9
];

// Elephant (Red) - Home side only
const PST_EL = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 5, 0, 0, 0, 5, 0, 0], // y=5
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 8, 0, 0, 0, 0], // y=7, best center defend
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

// King (Red) - Palace only
const PST_GE = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 2, 5, 2, 0, 0, 0], // Safe in middle
    [0, 0, 0, 5, 8, 5, 0, 0, 0]  // Safe at bottom
];

// --- AI CLASS ---

class AI {
    constructor(difficulty) {
        this.difficulty = difficulty || 'normal';
        this.timeout = false;
        this.nodeCount = 0;
    }

    getSearchTime(timeLimit) {
        // Reserve some time buffer (e.g. 50ms)
        return Math.max(100, timeLimit - 50);
    }

    getBestMove(game, color, timeLimitMs = 1500) {
        const startTime = Date.now();
        const searchTime = this.getSearchTime(timeLimitMs);
        this.timeout = false;
        this.nodeCount = 0;

        const maximize = (color === 'red');

        let bestMove = null;
        let globalBestScore = maximize ? -Infinity : Infinity;

        // Iterative Deepening
        // Cap depth based on difficulty to prevent blocking event loop
        let maxDepthAllowed = 8; // Extreme default
        if (this.difficulty === 'easy') maxDepthAllowed = 2;
        if (this.difficulty === 'normal') maxDepthAllowed = 4;
        if (this.difficulty === 'hard') maxDepthAllowed = 6;
        // Extreme uses 8 (default)

        console.log(`[AI] Start Search. Level: ${this.difficulty}, Time: ${searchTime}ms`);

        for (let depth = 1; depth <= maxDepthAllowed; depth++) {
            // Check time before starting new depth
            if (Date.now() - startTime >= searchTime) {
                console.log(`[AI] Timeout before depth ${depth}`);
                break;
            }

            let iterationBestMove = null;
            let iterationBestScore = maximize ? -Infinity : Infinity;

            // Alpha-Beta Search
            try {
                const result = this.alphaBeta(game, depth, -Infinity, Infinity, maximize, startTime, searchTime);

                if (this.timeout) {
                    console.log(`[AI] Search aborted at depth ${depth}`);
                    if (!bestMove) bestMove = result.move; // Salvage if we have nothing
                    break;
                }

                iterationBestMove = result.move;
                iterationBestScore = result.score;

                // Update global best
                bestMove = iterationBestMove;
                globalBestScore = iterationBestScore;

                console.log(`[AI] Depth ${depth} complete. Score: ${iterationBestScore}, Move: ${JSON.stringify(bestMove)}`);

                // If checkmate found, stop
                if (Math.abs(iterationBestScore) > 20000) {
                    console.log("[AI] Mate found!");
                    break;
                }

            } catch (e) {
                console.error("[AI] Error during search:", e);
                break;
            }
        }

        const duration = Date.now() - startTime;
        console.log(`[AI] Search finished. Nodes: ${this.nodeCount}, Time: ${duration}ms`);

        // FALLBACK: If we still have no move, generate one
        if (!bestMove) {
            console.log('[AI] WARNING: No best move found, generating fallback...');
            const moves = this.generateMoves(game, color);
            if (moves.length > 0) {
                bestMove = moves[0];
                console.log(`[AI] Fallback move: (${bestMove.from.x},${bestMove.from.y})->(${bestMove.to.x},${bestMove.to.y})`);
            }
        }

        return bestMove;
    }

    // Alpha-Beta with Negamax-style simplification could be cleaner, but keeping explicit min/max for clarity
    alphaBeta(game, depth, alpha, beta, maximizingPlayer, startTime, timeLimit) {
        // Check timeout every 100 nodes for responsiveness
        if (this.nodeCount++ % 100 === 0) {
            if (Date.now() - startTime > timeLimit) {
                this.timeout = true;
            }
        }
        if (this.timeout) return { score: this.evaluate(game), move: null };

        // Leaf Node
        if (depth === 0) {
            // QSearch could go here
            return { score: this.evaluate(game), move: null };
            // return { score: this.quiescence(game, alpha, beta, maximizingPlayer), move: null };
        }

        const moves = this.generateMoves(game, maximizingPlayer ? 'red' : 'black');

        if (moves.length === 0) {
            // No moves? Check for stalemate/mate
            // In Xiangqi, no moves usually = Loss
            return { score: maximizingPlayer ? -30000 : 30000, move: null };
        }

        // Order Moves (Heuristic: Captures first)
        // A full move ordering would check hash table, killer moves, etc.
        // For now: prioritize captures (MVV-LVA simplified)
        moves.sort((a, b) => {
            const valA = a.captured ? PIECE_VALS[a.captured.slice(1)] : 0;
            const valB = b.captured ? PIECE_VALS[b.captured.slice(1)] : 0;
            return valB - valA;
        });

        let bestMove = moves[0];

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                // Apply Move
                this.applyMove(game, move);

                const evalResult = this.alphaBeta(game, depth - 1, alpha, beta, false, startTime, timeLimit);
                const evalScore = evalResult.score;

                // Undo Move
                this.undoMove(game, move);

                if (this.timeout) return { score: maxEval, move: bestMove };

                if (evalScore > maxEval) {
                    maxEval = evalScore;
                    bestMove = move;
                }
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                this.applyMove(game, move);

                const evalResult = this.alphaBeta(game, depth - 1, alpha, beta, true, startTime, timeLimit);
                const evalScore = evalResult.score;

                this.undoMove(game, move);

                if (this.timeout) return { score: minEval, move: bestMove };

                if (evalScore < minEval) {
                    minEval = evalScore;
                    bestMove = move;
                }
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return { score: minEval, move: bestMove };
        }
    }

    // --- MOVE GENERATION ---
    generateMoves(game, color) {
        const moves = [];

        // Loop board to find pieces
        // Optimization: Maintain piece list in Game state? 
        // For now, explicit scan O(90) which is better than O(90*90) old method
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = game.board[y][x];
                if (!piece) continue;
                if (piece.charAt(0) !== (color === 'red' ? 'r' : 'b')) continue;

                const type = piece.slice(1);

                // Generate Pseudo-Legal Moves based on type
                switch (type) {
                    case 'so': this.genSoldierMoves(game, x, y, color, moves); break;
                    case 'ca': this.genCannonMoves(game, x, y, color, moves); break;
                    case 'ro': this.genRookMoves(game, x, y, color, moves); break;
                    case 'ma': this.genHorseMoves(game, x, y, color, moves); break;
                    case 'el': this.genElephantMoves(game, x, y, color, moves); break;
                    case 'ad': this.genAdvisorMoves(game, x, y, color, moves); break;
                    case 'ge': this.genGeneralMoves(game, x, y, color, moves); break;
                }
            }
        }

        // Filter King Safety (Costly but necessary)
        // We do this by actually applying the move and checking check
        const legalMoves = [];
        for (const move of moves) {
            // Apply
            const captured = game.board[move.to.y][move.to.x];
            game.board[move.to.y][move.to.x] = game.board[move.from.y][move.from.x];
            game.board[move.from.y][move.from.x] = null;

            // Check
            if (!this.isKingInCheck(game, color)) {
                move.captured = captured; // Store capture for sorting
                legalMoves.push(move);
            }

            // Revert
            game.board[move.from.y][move.from.x] = game.board[move.to.y][move.to.x];
            game.board[move.to.y][move.to.x] = captured;
        }

        return legalMoves;
    }

    applyMove(game, move) {
        // move.captured MUST be stored in move object or passed
        // We assume move.captured was set during generation or we read it
        if (move.captured === undefined) {
            move.captured = game.board[move.to.y][move.to.x];
        }
        game.board[move.to.y][move.to.x] = game.board[move.from.y][move.from.x];
        game.board[move.from.y][move.from.x] = null;
    }

    undoMove(game, move) {
        game.board[move.from.y][move.from.x] = game.board[move.to.y][move.to.x];
        game.board[move.to.y][move.to.x] = move.captured;
    }

    // --- PIECE MOVES ---
    addMove(moves, x, y, tx, ty) {
        moves.push({ from: { x, y }, to: { x: tx, y: ty } });
    }

    genSoldierMoves(game, x, y, color, moves) {
        const forward = color === 'red' ? -1 : 1;
        // Forward
        const fy = y + forward;
        if (fy >= 0 && fy <= 9) {
            const target = game.board[fy][x];
            if (!target || target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
                this.addMove(moves, x, y, x, fy);
            }
        }
        // Sideways (only if crossed river)
        // Red river line is y=4. If red at y<=4, crossed.
        // Black river line is y=5. If black at y>=5, crossed.
        const crossed = color === 'red' ? (y <= 4) : (y >= 5);
        if (crossed) {
            // Left
            if (x > 0) {
                const target = game.board[y][x - 1];
                if (!target || target.charAt(0) !== (color === 'red' ? 'r' : 'b')) this.addMove(moves, x, y, x - 1, y);
            }
            // Right
            if (x < 8) {
                const target = game.board[y][x + 1];
                if (!target || target.charAt(0) !== (color === 'red' ? 'r' : 'b')) this.addMove(moves, x, y, x + 1, y);
            }
        }
    }

    genRookMoves(game, x, y, color, moves) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            let cx = x + dx, cy = y + dy;
            while (cx >= 0 && cx <= 8 && cy >= 0 && cy <= 9) {
                const target = game.board[cy][cx];
                if (!target) {
                    this.addMove(moves, x, y, cx, cy);
                } else {
                    if (target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
                        this.addMove(moves, x, y, cx, cy);
                    }
                    break; // Blocked
                }
                cx += dx;
                cy += dy;
            }
        }
    }

    genCannonMoves(game, x, y, color, moves) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            let cx = x + dx, cy = y + dy;
            let screenFound = false;
            while (cx >= 0 && cx <= 8 && cy >= 0 && cy <= 9) {
                const target = game.board[cy][cx];
                if (!screenFound) {
                    if (!target) {
                        this.addMove(moves, x, y, cx, cy);
                    } else {
                        screenFound = true;
                    }
                } else {
                    // Have screen, looking for capture
                    if (target) {
                        if (target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
                            this.addMove(moves, x, y, cx, cy);
                        }
                        break; // Cannot jump more than one
                    }
                }
                cx += dx;
                cy += dy;
            }
        }
    }

    genHorseMoves(game, x, y, color, moves) {
        // 8 targets
        const jumps = [
            { dx: 1, dy: -2, lx: 0, ly: -1 }, { dx: -1, dy: -2, lx: 0, ly: -1 },
            { dx: 1, dy: 2, lx: 0, ly: 1 }, { dx: -1, dy: 2, lx: 0, ly: 1 },
            { dx: 2, dy: -1, lx: 1, ly: 0 }, { dx: 2, dy: 1, lx: 1, ly: 0 },
            { dx: -2, dy: -1, lx: -1, ly: 0 }, { dx: -2, dy: 1, lx: -1, ly: 0 }
        ];

        for (const j of jumps) {
            const tx = x + j.dx;
            const ty = y + j.dy;
            if (tx >= 0 && tx <= 8 && ty >= 0 && ty <= 9) {
                // Check Leg
                const legX = x + j.lx;
                const legY = y + j.ly;
                if (!game.board[legY][legX]) {
                    const target = game.board[ty][tx];
                    if (!target || target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
                        this.addMove(moves, x, y, tx, ty);
                    }
                }
            }
        }
    }

    genElephantMoves(game, x, y, color, moves) {
        // 4 targets, cannot cross river
        const dirs = [
            { dx: 2, dy: 2, ex: 1, ey: 1 }, { dx: 2, dy: -2, ex: 1, ey: -1 },
            { dx: -2, dy: 2, ex: -1, ey: 1 }, { dx: -2, dy: -2, ex: -1, ey: -1 }
        ];

        for (const d of dirs) {
            const tx = x + d.dx;
            const ty = y + d.dy;

            // River check
            if (color === 'red') { if (ty < 5) continue; }
            else { if (ty > 4) continue; }

            if (tx >= 0 && tx <= 8 && ty >= 0 && ty <= 9) {
                // Eye check
                const ex = x + d.ex;
                const ey = y + d.ey;
                if (!game.board[ey][ex]) {
                    const target = game.board[ty][tx];
                    if (!target || target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
                        this.addMove(moves, x, y, tx, ty);
                    }
                }
            }
        }
    }

    genAdvisorMoves(game, x, y, color, moves) {
        const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dx, dy] of dirs) {
            const tx = x + dx;
            const ty = y + dy;
            // Palace Limit
            if (tx >= 3 && tx <= 5) {
                const inPalaceY = color === 'red' ? (ty >= 7 && ty <= 9) : (ty >= 0 && ty <= 2);
                if (inPalaceY) {
                    const target = game.board[ty][tx];
                    if (!target || target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
                        this.addMove(moves, x, y, tx, ty);
                    }
                }
            }
        }
    }

    genGeneralMoves(game, x, y, color, moves) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx >= 3 && tx <= 5) {
                const inPalaceY = color === 'red' ? (ty >= 7 && ty <= 9) : (ty >= 0 && ty <= 2);
                if (inPalaceY) {
                    const target = game.board[ty][tx];
                    if (!target || target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
                        this.addMove(moves, x, y, tx, ty);
                    }
                }
            }
        }
    }

    // --- CHECK DETECTION ---
    isKingInCheck(game, color) {
        // Find King
        let kx, ky;
        const kingType = color === 'red' ? 'rge' : 'bge';
        let found = false;

        // Scan Palace
        const yStart = color === 'red' ? 7 : 0;
        const yEnd = color === 'red' ? 9 : 2;

        for (let y = yStart; y <= yEnd; y++) {
            for (let x = 3; x <= 5; x++) {
                if (game.board[y][x] === kingType) {
                    kx = x; ky = y; found = true; break;
                }
            }
            if (found) break;
        }
        if (!found) return true; // King missing? Lost.

        const enemyColor = color === 'red' ? 'black' : 'red';
        const prefix = color === 'red' ? 'b' : 'r';

        // Check attacks ON (kx, ky)

        // 1. Check Orthogonal (Rook, Cannon, Soldier, General)
        // Check Vert/Horiz lines
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            let cx = kx + dx;
            let cy = ky + dy;
            let screen = false;
            while (cx >= 0 && cx <= 8 && cy >= 0 && cy <= 9) {
                const p = game.board[cy][cx];
                if (p) {
                    const sameColor = p.charAt(0) !== prefix; // p is OWN piece
                    const type = p.slice(1);

                    if (!screen) {
                        // Immediate threat: Rook, Soldier (close), General (Flying)
                        if (!sameColor) {
                            if (type === 'ro') return true;
                            if (type === 'ge') return true; // Flying General
                            if (type === 'so') {
                                // Soldier must be in attack range
                                // Red soldier attacks 'down' (-y for move, but here checking incoming)
                                // If I am RED, enemy is BLACK (moves DOWN, +y).
                                // So black soldier must be at (kx, ky-1) to attack? No.
                                // Black soldier at (kx, ky) attacks (kx, ky+1).
                                // Wait, we are at King (kx, ky).
                                // Black soldier attacks from (kx, ky-1) [Forward] or (kx+/-1, ky) [Side]

                                if (color === 'red') {
                                    // Enemy Black moves +1 Y.
                                    // Attacking from y-1?
                                    if (cy === ky - 1 && cx === kx) return true; // Front attack
                                    if (cy === ky && Math.abs(cx - kx) === 1) return true; // Side attack
                                } else {
                                    // I am Black. Enemy Red moves -1 Y.
                                    // Attacking from y+1?
                                    if (cy === ky + 1 && cx === kx) return true;
                                    if (cy === ky && Math.abs(cx - kx) === 1) return true;
                                }
                            }
                        }
                        screen = true;
                    } else {
                        // Screened threat: Cannon
                        if (!sameColor && type === 'ca') return true;
                        break; // Blocked by second piece
                    }
                }
                cx += dx;
                cy += dy;
            }
        }

        // 2. Check Horses
        const hJumps = [
            { dx: 1, dy: -2, lx: 0, ly: -1 }, { dx: -1, dy: -2, lx: 0, ly: -1 },
            { dx: 1, dy: 2, lx: 0, ly: 1 }, { dx: -1, dy: 2, lx: 0, ly: 1 },
            { dx: 2, dy: -1, lx: 1, ly: 0 }, { dx: 2, dy: 1, lx: 1, ly: 0 },
            { dx: -2, dy: -1, lx: -1, ly: 0 }, { dx: -2, dy: 1, lx: -1, ly: 0 }
        ];
        for (const j of hJumps) {
            const hx = kx - j.dx; // Reverse vector to find attacking horse
            const hy = ky - j.dy;
            if (hx >= 0 && hx <= 8 && hy >= 0 && hy <= 9) {
                const p = game.board[hy][hx];
                if (p && p.charAt(0) === prefix && p.slice(1) === 'ma') {
                    // Check leg (blocking eye)
                    // The leg is at (hx + lx, hy + ly) relative to HORSE
                    // Leg for horse at (hx, hy) attacking (kx, ky)? 
                    // Move is (dx, dy). Leg is (lx, ly).
                    // So leg pos is hx + lx, hy + ly.
                    const legX = hx + j.lx;
                    const legY = hy + j.ly;
                    if (!game.board[legY][legX]) return true;
                }
            }
        }

        return false;
    }

    // --- EVALUATION ---
    evaluate(game) {
        // Simple Material + PST
        let score = 0;

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = game.board[y][x];
                if (!piece) continue;

                const color = piece.charAt(0);
                const type = piece.slice(1);
                const isRed = (color === 'r');

                let val = PIECE_VALS[type] || 0;
                let pst = 0;

                // PST Lookup
                if (isRed) {
                    // Direct lookup
                    switch (type) {
                        case 'so': pst = PST_SO[y][x]; break;
                        case 'ro': pst = PST_RO[y][x]; break;
                        case 'ma': pst = PST_MA[y][x]; break;
                        case 'ca': pst = PST_CA[y][x]; break;
                        case 'ge': pst = PST_GE[y][x]; break;
                        case 'ad': pst = PST_AD[y][x]; break;
                        case 'el': pst = PST_EL[y][x]; break;
                    }
                } else {
                    // Mirror lookup for Black
                    // Black View: y=0 is Home. Red View y=9 is Home.
                    // To map Black(x, y) to Red PST:
                    // x' = x (Symmetry? No, PST is left-right symmetric usually, but let's be safe: mirroring x is good if PST is symmetric)
                    // y' = 9 - y.
                    // Our PSTs are assumed symmetric or oriented for Red at bottom.
                    const ry = 9 - y;
                    const rx = x; // Symmetric
                    switch (type) {
                        case 'so': pst = PST_SO[ry][rx]; break;
                        case 'ro': pst = PST_RO[ry][rx]; break;
                        case 'ma': pst = PST_MA[ry][rx]; break;
                        case 'ca': pst = PST_CA[ry][rx]; break;
                        case 'ge': pst = PST_GE[ry][rx]; break;
                        case 'ad': pst = PST_AD[ry][rx]; break;
                        case 'el': pst = PST_EL[ry][rx]; break;
                    }
                }

                if (isRed) score += val + pst;
                else score -= (val + pst);
            }
        }

        return score;
    }
}

module.exports = AI;
