const XiangqiGame = require('./game');
const getBookMove = require('./opening-book');

// --- CONSTANTS & TABLES ---
const PIECE_VALS = {
    'ro': 900, 'ma': 450, 'ca': 500, 'el': 20, 'ad': 20, 'ge': 0, 'so': 30
};

// Piece-Square Tables (Red Bottom y=9)
const PST_SO = [
    [10, 15, 20, 25, 20, 25, 20, 15, 10], // y=0 (Enemy Base)
    [10, 15, 25, 30, 35, 30, 25, 15, 10],
    [5, 10, 15, 20, 20, 20, 15, 10, 5],
    [5, 10, 10, 20, 25, 20, 10, 10, 5],
    [0, 5, 5, 10, 15, 10, 5, 5, 0], // River y=4
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
];
const PST_RO = [
    [10, 10, 10, 10, 10, 10, 10, 10, 10],
    [10, 15, 15, 15, 15, 15, 15, 15, 10],
    [10, 15, 15, 15, 15, 15, 15, 15, 10],
    [10, 15, 15, 15, 15, 15, 15, 15, 10],
    [10, 15, 20, 20, 20, 20, 20, 15, 10],
    [10, 20, 20, 20, 20, 20, 20, 20, 10],
    [0, 10, 10, 10, 10, 10, 10, 10, 0],
    [0, 10, 10, 10, 10, 10, 10, 10, 0],
    [0, 5, 5, 10, 10, 10, 5, 5, 0],
    [-2, 5, 5, 5, 5, 5, 5, 5, -2]
];
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
    [-2, -2, -2, -2, -2, -2, -2, -2, -2]
];
const PST_CA = [
    [5, 5, 10, 15, 20, 15, 10, 5, 5],
    [5, 5, 10, 10, 10, 10, 10, 5, 5],
    [5, 5, 10, 15, 15, 15, 10, 5, 5],
    [5, 5, 10, 10, 10, 10, 10, 5, 5],
    [5, 10, 10, 10, 10, 10, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 2, 2, 5, 10, 5, 2, 2, 2],
    [2, 2, 2, 2, 5, 2, 2, 2, 2],
    [2, 2, 2, 2, 5, 2, 2, 2, 2]
];
const PST_AD = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 5, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
];
const PST_EL = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 5, 0, 0, 0, 5, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 8, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
];
const PST_GE = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 2, 5, 2, 0, 0, 0],
    [0, 0, 0, 5, 8, 5, 0, 0, 0]
];

// --- ZOBRIST KEYS ---
const ZOBRIST = {
    pieces: [],
    turn: Math.floor(Math.random() * 0xFFFFFFFF)
};

(function initZobrist() {
    for (let i = 0; i < 14 * 90; i++) {
        ZOBRIST.pieces.push(Math.floor(Math.random() * 0xFFFFFFFF));
    }
})();

function getZobristKey(piece, x, y) {
    if (!piece || typeof piece !== 'string') return 0; // Guard
    const colors = { 'r': 0, 'b': 1 };
    const types = { 'ro': 0, 'ma': 1, 'el': 2, 'ad': 3, 'ge': 4, 'ca': 5, 'so': 6 };

    const c = colors[piece.charAt(0)];
    const tStr = piece.slice(1);
    const t = types[tStr];

    if (c === undefined || t === undefined) return 0;

    const pieceIdx = c * 7 + t;
    const squareIdx = y * 9 + x;
    return ZOBRIST.pieces[pieceIdx * 90 + squareIdx];
}

// --- AI CLASS ---

const TT_SIZE = 1 << 18;
const TT_FLAG = { EXACT: 0, LOWERBOUND: 1, UPPERBOUND: 2 };

class AI {
    constructor(difficulty) {
        this.difficulty = difficulty || 'normal';
        this.timeout = false;
        this.nodeCount = 0;
        this.startTime = 0;
        this.searchTime = 0;

        this.tt = new Array(TT_SIZE).fill(null);
        // Correct History Table Size: 90 * 90 = 8100 
        // We will index [from_idx * 90 + to_idx] where idx = y*9 + x
        this.history = new Int32Array(8100);
        this.killers = new Array(20).fill(null).map(() => [null, null]);
    }

    reset() {
        this.tt.fill(null);
        this.history.fill(0);
        this.killers.forEach(k => k.fill(null));
    }

    getBestMove(game, color, timeLimitMs = 1500) {
        try {
            // 1. Opening Book
            const bookMove = getBookMove(game);
            if (bookMove) {
                console.log(`[AI] Book Move: (${bookMove.from.x},${bookMove.from.y})->(${bookMove.to.x},${bookMove.to.y})`);
                return bookMove;
            }

            this.startTime = Date.now();
            this.searchTime = Math.max(100, timeLimitMs - 100);
            this.timeout = false;
            this.nodeCount = 0;

            const maximize = (color === 'red');
            let bestMove = null;
            let finalScore = 0;

            // Calculate Initial Zobrist Hash
            let hash = 0;
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 9; x++) {
                    const p = game.board[y][x];
                    if (p) hash ^= getZobristKey(p, x, y);
                }
            }
            if (!maximize) hash ^= ZOBRIST.turn;

            // Difficulty Depth & Params
            let maxDepth = 4;
            let randomness = 0; // 0-100 scale

            if (this.difficulty === 'easy') { maxDepth = 2; randomness = 30; }
            if (this.difficulty === 'normal') { maxDepth = 4; randomness = 10; }
            if (this.difficulty === 'hard') { maxDepth = 8; randomness = 0; }
            // Extreme: try to go deep.
            if (this.difficulty === 'extreme') { maxDepth = 24; randomness = 0; }

            console.log(`[AI] Start Search. Level: ${this.difficulty}, Time: ${this.searchTime}ms, MaxDepth: ${maxDepth}`);

            // Iterative Deepening
            for (let depth = 1; depth <= maxDepth; depth++) {
                if (Date.now() - this.startTime >= this.searchTime) break;

                // Aspiration Windows (Optimistic search window)
                let alpha = -Infinity;
                let beta = Infinity;
                if (depth > 4) {
                    alpha = finalScore - 500;
                    beta = finalScore + 500;
                }

                let score = this.alphaBeta(game, depth, alpha, beta, maximize, hash, 0, true);

                // If fell out of window, re-search with full window
                if (alpha !== -Infinity && beta !== Infinity) {
                    if (score <= alpha || score >= beta) {
                        console.log(`[AI] Aspiration Fail at depth ${depth} (Score: ${score}), re-searching full width.`);
                        score = this.alphaBeta(game, depth, -Infinity, Infinity, maximize, hash, 0, true);
                    }
                }

                if (this.timeout) {
                    console.log(`[AI] Timeout at depth ${depth}`);
                    break;
                }

                const entry = this.tt[Math.abs(hash % TT_SIZE)];
                if (entry && entry.hash === hash && entry.move) {
                    bestMove = entry.move;
                    finalScore = entry.score;
                    console.log(`[AI] Depth ${depth} Score: ${finalScore} Move: ${bestMove.from.x},${bestMove.from.y}->${bestMove.to.x},${bestMove.to.y}`);
                }

                // Mate detected
                if (Math.abs(score) > 20000) break;
            }

            if (!bestMove) {
                console.log("[AI] No best move found, generating random.");
                const moves = this.generateMoves(game, color);
                if (moves.length > 0) bestMove = moves[Math.floor(Math.random() * moves.length)];
            } else if (randomness > 0) {
                // Weighted randomness: sometimes pick the 2nd best or just blunder?
                if (Math.random() * 100 < randomness) {
                    console.log(`[AI] Making a "mistake" due to difficulty ${this.difficulty}`);
                    const moves = this.generateMoves(game, color);
                    if (moves.length > 1) {
                        // Pick a random legal move instead of best
                        bestMove = moves[Math.floor(Math.random() * moves.length)];
                    }
                }
            }

            const duration = Date.now() - this.startTime;
            console.log(`[AI] Finished. Nodes: ${this.nodeCount}, Time: ${duration}ms, NPS: ${Math.round(this.nodeCount / ((duration + 1) / 1000))}`);

            return bestMove;

        } catch (error) {
            console.error("[AI] CRITICAL ERROR:", error);
            if (error.stack) console.error(error.stack);
            return null;
        }
    }

    alphaBeta(game, depth, alpha, beta, maximizingPlayer, hash, ply, canNull) {
        if (this.nodeCount++ % 2048 === 0) {
            if (Date.now() - this.startTime > this.searchTime) this.timeout = true;
        }
        if (this.timeout) return maximizingPlayer ? -30000 : 30000;

        const ttIndex = Math.abs(hash % TT_SIZE);
        const ttEntry = this.tt[ttIndex];
        let ttMove = null;

        if (ttEntry && ttEntry.hash === hash && ttEntry.depth >= depth) {
            if (ttEntry.flag === TT_FLAG.EXACT) return ttEntry.score;
            if (ttEntry.flag === TT_FLAG.LOWERBOUND) alpha = Math.max(alpha, ttEntry.score);
            else if (ttEntry.flag === TT_FLAG.UPPERBOUND) beta = Math.min(beta, ttEntry.score);
            if (alpha >= beta) return ttEntry.score;
            if (ttEntry.move) ttMove = ttEntry.move; // PV Move
        }
        if (ttEntry && ttEntry.hash === hash) ttMove = ttEntry.move;

        // Leaf / Quiescence
        if (depth <= 0) {
            return this.quiescence(game, alpha, beta, maximizingPlayer);
        }

        const color = maximizingPlayer ? 'red' : 'black';

        // --- NULL MOVE PRUNING ---
        // Conditions: Not in check, depth >= 3, not root (ply>0)
        // We assume valid "not in check" if strict logic holds.
        // For simplicity: skip if ply is small or endgame.
        if (canNull && ply > 0 && depth >= 3 && !this.isKingInCheck(game, color)) {
            // Make Null Move (Swap turn)
            // In Xiangqi, passing is illegal. But we simulate it for pruning.
            // We pass current color's turn without changing board.
            // Search with reduced depth.
            // R = 2
            const R = 2;
            const nullHash = hash ^ ZOBRIST.turn;
            // Note: flip maximizingPlayer because turn skipped
            const score = -this.alphaBeta(game, depth - 1 - R, -beta, -beta + 1, !maximizingPlayer, nullHash, ply + 1, false);
            if (score >= beta) return beta;
        }


        let moves = this.generateMoves(game, color);
        if (moves.length === 0) return maximizingPlayer ? -30000 + ply : 30000 - ply;

        this.scoreMoves(moves, ttMove, ply, game);
        moves.sort((a, b) => b.score - a.score);

        let bestMove = null;
        let bestScore = maximizingPlayer ? -Infinity : Infinity;
        let alphaOriginal = alpha;

        let moveCount = 0;

        // PVS (Principal Variation Search)
        if (maximizingPlayer) {
            for (const move of moves) {
                const movingPiece = game.board[move.from.y][move.from.x];
                const captured = game.board[move.to.y][move.to.x];

                let nextHash = hash;
                nextHash ^= getZobristKey(movingPiece, move.from.x, move.from.y);
                if (captured) nextHash ^= getZobristKey(captured, move.to.x, move.to.y);
                nextHash ^= getZobristKey(movingPiece, move.to.x, move.to.y);
                nextHash ^= ZOBRIST.turn;

                this.applyMove(game, move);

                let score;
                if (moveCount === 0) {
                    // Full window search for first move (PV Node)
                    score = this.alphaBeta(game, depth - 1, alpha, beta, false, nextHash, ply + 1, true);
                } else {
                    let R = 0;
                    if (depth >= 3 && moveCount > 3 && !move.captured) {
                        R = 1;
                        if (moveCount > 10) R = 2;
                        if (depth > 6 && moveCount > 8) R = 3;
                    }

                    // Scout with LMR
                    score = this.alphaBeta(game, depth - 1 - R, alpha, alpha + 1, false, nextHash, ply + 1, true);

                    if (score > alpha && score < beta) {
                        // Fail High in Scout
                        if (R > 0) {
                            // Re-search scout with full depth
                            score = this.alphaBeta(game, depth - 1, alpha, alpha + 1, false, nextHash, ply + 1, true);
                        }
                        if (score > alpha && score < beta) {
                            // Re-search full window
                            score = this.alphaBeta(game, depth - 1, alpha, beta, false, nextHash, ply + 1, true);
                        }
                    }
                }

                this.undoMove(game, move);

                moveCount++;

                if (this.timeout) return bestScore;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, score);
                if (beta <= alpha) {
                    if (!move.captured) {
                        this.updateHistory(move, depth, ply);
                    }
                    break;
                }
            }
        } else {
            for (const move of moves) {
                const movingPiece = game.board[move.from.y][move.from.x];
                const captured = game.board[move.to.y][move.to.x];

                let nextHash = hash;
                nextHash ^= getZobristKey(movingPiece, move.from.x, move.from.y);
                if (captured) nextHash ^= getZobristKey(captured, move.to.x, move.to.y);
                nextHash ^= getZobristKey(movingPiece, move.to.x, move.to.y);
                nextHash ^= ZOBRIST.turn;

                this.applyMove(game, move);

                let score;
                if (moveCount === 0) {
                    score = this.alphaBeta(game, depth - 1, alpha, beta, true, nextHash, ply + 1, true);
                } else {
                    let R = 0;
                    if (depth >= 3 && moveCount > 3 && !move.captured) {
                        R = 1;
                        if (moveCount > 10) R = 2;
                        if (depth > 6 && moveCount > 8) R = 3;
                    }

                    score = this.alphaBeta(game, depth - 1 - R, beta - 1, beta, true, nextHash, ply + 1, true);

                    if (score < beta && score > alpha) {
                        if (R > 0) {
                            score = this.alphaBeta(game, depth - 1, beta - 1, beta, true, nextHash, ply + 1, true);
                        }
                        if (score < beta && score > alpha) {
                            score = this.alphaBeta(game, depth - 1, alpha, beta, true, nextHash, ply + 1, true);
                        }
                    }
                }

                this.undoMove(game, move);
                moveCount++;

                if (this.timeout) return bestScore;

                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                beta = Math.min(beta, score);
                if (beta <= alpha) {
                    if (!move.captured) {
                        this.updateHistory(move, depth, ply);
                    }
                    break;
                }
            }
        }

        let flag = TT_FLAG.EXACT;
        if (bestScore <= alphaOriginal) flag = TT_FLAG.UPPERBOUND;
        else if (bestScore >= beta) flag = TT_FLAG.LOWERBOUND;

        this.tt[ttIndex] = {
            hash: hash,
            depth: depth,
            score: bestScore,
            flag: flag,
            move: bestMove
        };

        return bestScore;
    }

    updateHistory(move, depth, ply) {
        if (this.killers[ply]) {
            this.killers[ply][1] = this.killers[ply][0];
            this.killers[ply][0] = move;
        }
        const hIdx = (move.from.y * 9 + move.from.x) * 90 + (move.to.y * 9 + move.to.x);
        if (this.history[hIdx] !== undefined) this.history[hIdx] += (depth * depth);
    }

    quiescence(game, alpha, beta, maximizingPlayer) {
        if (this.nodeCount++ % 2048 === 0) {
            if (Date.now() - this.startTime > this.searchTime) this.timeout = true;
        }
        if (this.timeout) return this.evaluate(game);

        const standPat = this.evaluate(game);

        if (maximizingPlayer) {
            if (standPat >= beta) return beta;
            if (alpha < standPat) alpha = standPat;
        } else {
            if (standPat <= alpha) return alpha;
            if (beta > standPat) beta = standPat;
        }

        const color = maximizingPlayer ? 'red' : 'black';
        // Generate Captures Only
        const moves = this.generateMoves(game, color, true);

        // MVV-LVA Sorting
        for (const move of moves) {
            const captured = game.board[move.to.y][move.to.x];
            const victimVal = captured ? (PIECE_VALS[captured.slice(1)] || 0) : 0;
            const attackerVal = PIECE_VALS[game.board[move.from.y][move.from.x].slice(1)] || 0;
            move.score = 1000 + victimVal * 10 - attackerVal;
        }
        moves.sort((a, b) => b.score - a.score);

        if (maximizingPlayer) {
            for (const move of moves) {
                this.applyMove(game, move);
                const score = this.quiescence(game, alpha, beta, false);
                this.undoMove(game, move);

                if (this.timeout) return alpha;

                if (score > alpha) {
                    alpha = score;
                    if (beta <= alpha) break;
                }
            }
            return alpha;
        } else {
            for (const move of moves) {
                this.applyMove(game, move);
                const score = this.quiescence(game, alpha, beta, true);
                this.undoMove(game, move);

                if (this.timeout) return beta;

                if (score < beta) {
                    beta = score;
                    if (beta <= alpha) break;
                }
            }
            return beta;
        }
    }

    scoreMoves(moves, ttMove, ply, game) {
        for (const move of moves) {
            move.score = 0;
            if (ttMove && this.sameMove(move, ttMove)) {
                move.score += 20000;
                continue;
            }
            if (move.captured) {
                const victimVal = PIECE_VALS[move.captured.slice(1)] || 0;
                move.score += 1000 + victimVal;
            }
            // Prioritize Checks (Simple check: if move ends near enemy King?)
            // Too expensive to calculate isCheck for every move here.

            if (this.killers[ply]) {
                if ((this.killers[ply][0] && this.sameMove(move, this.killers[ply][0])) ||
                    (this.killers[ply][1] && this.sameMove(move, this.killers[ply][1]))) {
                    move.score += 900;
                }
            }
            const hIdx = (move.from.y * 9 + move.from.x) * 90 + (move.to.y * 9 + move.to.x);
            if (this.history[hIdx]) move.score += this.history[hIdx] / 1000;
        }
    }

    sameMove(a, b) {
        return a.from.x === b.from.x && a.from.y === b.from.y && a.to.x === b.to.x && a.to.y === b.to.y;
    }

    generateMoves(game, color, capturesOnly = false) {
        const moves = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = game.board[y][x];
                if (!piece) continue;
                if (piece.charAt(0) !== (color === 'red' ? 'r' : 'b')) continue;
                const type = piece.slice(1);

                switch (type) {
                    case 'so': this.genSoldierMoves(game, x, y, color, moves, capturesOnly); break;
                    case 'ca': this.genCannonMoves(game, x, y, color, moves, capturesOnly); break;
                    case 'ro': this.genRookMoves(game, x, y, color, moves, capturesOnly); break;
                    case 'ma': this.genHorseMoves(game, x, y, color, moves, capturesOnly); break;
                    case 'el': this.genElephantMoves(game, x, y, color, moves, capturesOnly); break;
                    case 'ad': this.genAdvisorMoves(game, x, y, color, moves, capturesOnly); break;
                    case 'ge': this.genGeneralMoves(game, x, y, color, moves, capturesOnly); break;
                }
            }
        }

        const legalMoves = [];
        for (const move of moves) {
            // Apply
            const captured = game.board[move.to.y][move.to.x];
            game.board[move.to.y][move.to.x] = game.board[move.from.y][move.from.x];
            game.board[move.from.y][move.from.x] = null;

            // Check
            if (!this.isKingInCheck(game, color)) {
                move.captured = captured;
                legalMoves.push(move);
            }

            // Revert
            game.board[move.from.y][move.from.x] = game.board[move.to.y][move.to.x];
            game.board[move.to.y][move.to.x] = captured;
        }
        return legalMoves;
    }

    checkAndAdd(game, fx, fy, tx, ty, color, moves, capturesOnly) {
        const target = game.board[ty][tx];
        // If query capturesOnly, MUST have target
        if (capturesOnly && !target) return;

        if (!target || target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
            moves.push({ from: { x: fx, y: fy }, to: { x: tx, y: ty } });
        }
    }

    genSoldierMoves(game, x, y, color, moves, capturesOnly) {
        const forward = color === 'red' ? -1 : 1;
        const fy = y + forward;
        if (fy >= 0 && fy <= 9) this.checkAndAdd(game, x, y, x, fy, color, moves, capturesOnly);
        const crossed = color === 'red' ? (y <= 4) : (y >= 5);
        if (crossed) {
            if (x > 0) this.checkAndAdd(game, x, y, x - 1, y, color, moves, capturesOnly);
            if (x < 8) this.checkAndAdd(game, x, y, x + 1, y, color, moves, capturesOnly);
        }
    }
    genRookMoves(game, x, y, color, moves, capturesOnly) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            let cx = x + dx, cy = y + dy;
            while (cx >= 0 && cx <= 8 && cy >= 0 && cy <= 9) {
                const target = game.board[cy][cx];
                if (!target) {
                    if (!capturesOnly) moves.push({ from: { x, y }, to: { x: cx, y: cy } });
                } else {
                    if (target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
                        moves.push({ from: { x, y }, to: { x: cx, y: cy } });
                    }
                    break;
                }
                cx += dx;
                cy += dy;
            }
        }
    }
    genCannonMoves(game, x, y, color, moves, capturesOnly) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            let cx = x + dx, cy = y + dy;
            let screenFound = false;
            while (cx >= 0 && cx <= 8 && cy >= 0 && cy <= 9) {
                const target = game.board[cy][cx];
                if (!screenFound) {
                    if (!target) {
                        if (!capturesOnly) moves.push({ from: { x, y }, to: { x: cx, y: cy } });
                    } else screenFound = true;
                } else {
                    if (target) {
                        if (target.charAt(0) !== (color === 'red' ? 'r' : 'b')) {
                            moves.push({ from: { x, y }, to: { x: cx, y: cy } });
                        }
                        break;
                    }
                }
                cx += dx;
                cy += dy;
            }
        }
    }
    genHorseMoves(game, x, y, color, moves, capturesOnly) {
        const jumps = [
            { dx: 1, dy: -2, lx: 0, ly: -1 }, { dx: -1, dy: -2, lx: 0, ly: -1 },
            { dx: 1, dy: 2, lx: 0, ly: 1 }, { dx: -1, dy: 2, lx: 0, ly: 1 },
            { dx: 2, dy: -1, lx: 1, ly: 0 }, { dx: 2, dy: 1, lx: 1, ly: 0 },
            { dx: -2, dy: -1, lx: -1, ly: 0 }, { dx: -2, dy: 1, lx: -1, ly: 0 }
        ];
        for (const j of jumps) {
            const tx = x + j.dx, ty = y + j.dy;
            if (tx >= 0 && tx <= 8 && ty >= 0 && ty <= 9) {
                if (!game.board[y + j.ly][x + j.lx]) {
                    this.checkAndAdd(game, x, y, tx, ty, color, moves, capturesOnly);
                }
            }
        }
    }
    genElephantMoves(game, x, y, color, moves, capturesOnly) {
        const dirs = [{ dx: 2, dy: 2, ex: 1, ey: 1 }, { dx: 2, dy: -2, ex: 1, ey: -1 },
        { dx: -2, dy: 2, ex: -1, ey: 1 }, { dx: -2, dy: -2, ex: -1, ey: -1 }];
        for (const d of dirs) {
            const tx = x + d.dx, ty = y + d.dy;
            if (color === 'red' && ty < 5) continue;
            if (color !== 'red' && ty > 4) continue;
            if (tx >= 0 && tx <= 8 && ty >= 0 && ty <= 9) {
                if (!game.board[y + d.ey][x + d.ex]) {
                    this.checkAndAdd(game, x, y, tx, ty, color, moves, capturesOnly);
                }
            }
        }
    }
    genAdvisorMoves(game, x, y, color, moves, capturesOnly) {
        const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dx, dy] of dirs) {
            const tx = x + dx, ty = y + dy;
            if (tx >= 3 && tx <= 5) {
                const inPalace = color === 'red' ? (ty >= 7 && ty <= 9) : (ty >= 0 && ty <= 2);
                if (inPalace) this.checkAndAdd(game, x, y, tx, ty, color, moves, capturesOnly);
            }
        }
    }
    genGeneralMoves(game, x, y, color, moves, capturesOnly) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const tx = x + dx, ty = y + dy;
            if (tx >= 3 && tx <= 5) {
                const inPalace = color === 'red' ? (ty >= 7 && ty <= 9) : (ty >= 0 && ty <= 2);
                if (inPalace) this.checkAndAdd(game, x, y, tx, ty, color, moves, capturesOnly);
            }
        }
    }

    isKingInCheck(game, color) {
        let kx, ky;
        const kingType = color === 'red' ? 'rge' : 'bge';
        const yStart = color === 'red' ? 7 : 0, yEnd = color === 'red' ? 9 : 2;
        let found = false;
        for (let y = yStart; y <= yEnd; y++) {
            for (let x = 3; x <= 5; x++) {
                if (game.board[y][x] === kingType) { kx = x; ky = y; found = true; break; }
            }
            if (found) break;
        }
        if (!found) return true;

        const enemyPrefix = color === 'red' ? 'b' : 'r';

        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            let cx = kx + dx, cy = ky + dy;
            let screen = false;
            while (cx >= 0 && cx <= 8 && cy >= 0 && cy <= 9) {
                const p = game.board[cy][cx];
                if (p) {
                    if (p.charAt(0) === enemyPrefix) {
                        const t = p.slice(1);
                        if (!screen) {
                            if (t === 'ro' || t === 'ge') return true;
                            if (t === 'so') {
                                if (color === 'red') {
                                    if (cy === ky - 1 && cx === kx) return true;
                                    if (cy === ky && Math.abs(cx - kx) === 1) return true;
                                } else {
                                    if (cy === ky + 1 && cx === kx) return true;
                                    if (cy === ky && Math.abs(cx - kx) === 1) return true;
                                }
                            }
                        } else {
                            if (t === 'ca') return true;
                        }
                    }
                    if (!screen) screen = true; else break;
                }
                cx += dx; cy += dy;
            }
        }

        const hJumps = [
            { dx: 1, dy: -2, lx: 0, ly: -1 }, { dx: -1, dy: -2, lx: 0, ly: -1 },
            { dx: 1, dy: 2, lx: 0, ly: 1 }, { dx: -1, dy: 2, lx: 0, ly: 1 },
            { dx: 2, dy: -1, lx: 1, ly: 0 }, { dx: 2, dy: 1, lx: 1, ly: 0 },
            { dx: -2, dy: -1, lx: -1, ly: 0 }, { dx: -2, dy: 1, lx: -1, ly: 0 }
        ];
        for (const j of hJumps) {
            const hx = kx - j.dx, hy = ky - j.dy;
            if (hx >= 0 && hx <= 8 && hy >= 0 && hy <= 9) {
                const p = game.board[hy][hx];
                if (p && p.charAt(0) === enemyPrefix && p.slice(1) === 'ma') {
                    if (!game.board[hy + j.ly][hx + j.lx]) return true;
                }
            }
        }
        return false;
    }

    applyMove(game, move) {
        if (move.captured === undefined) move.captured = game.board[move.to.y][move.to.x];
        game.board[move.to.y][move.to.x] = game.board[move.from.y][move.from.x];
        game.board[move.from.y][move.from.x] = null;
    }
    undoMove(game, move) {
        game.board[move.from.y][move.from.x] = game.board[move.to.y][move.to.x];
        game.board[move.to.y][move.to.x] = move.captured;
    }

    evaluate(game) {
        let score = 0;

        // Material & PST
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = game.board[y][x];
                if (!piece) continue;

                const isRed = (piece.charAt(0) === 'r');
                const type = piece.slice(1);
                let val = PIECE_VALS[type] || 0;
                let pst = 0;
                let mobility = 0;
                let structure = 0;

                const py = isRed ? y : (9 - y);

                switch (type) {
                    case 'so':
                        pst = PST_SO[py][x];
                        // Bonus for approaching palace key points in endgame
                        if (py <= 4) { // Across river
                            if (Math.abs(4 - x) <= 2) structure += 20; // Closer to center
                            if (py <= 1) structure += 30; // Close to palace
                        }
                        break;
                    case 'ro':
                        pst = PST_RO[py][x];
                        // Mobility: Check 4 dirs simplified (just immediate squares free?)
                        // Better: Count how many open squares in 4 dirs? Too slow.
                        // Medium: Check if blocked.
                        // Just checking standard mobility (if not trapped).
                        mobility = 5;
                        break;
                    case 'ma':
                        pst = PST_MA[py][x];
                        // Important: Check if blocked (horse leg).
                        // If center horse blocked?
                        break;
                    case 'ca': pst = PST_CA[py][x]; break;
                    case 'ge': pst = PST_GE[py][x]; break;
                    case 'ad': pst = PST_AD[py][x]; break;
                    case 'el': pst = PST_EL[py][x]; break;
                }

                if (isRed) score += val + pst + mobility + structure;
                else score -= (val + pst + mobility + structure);
            }
        }

        // King Safety
        // If General is exposed (-50)
        // Check if Advisors exist
        // Note: this is expensive to query whole board again.
        // We relied on PST for General (center is good).

        return score;
    }
}

module.exports = AI;
