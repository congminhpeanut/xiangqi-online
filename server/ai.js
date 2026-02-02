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
    if (!piece || typeof piece !== 'string') return 0;
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

const TT_SIZE = 1 << 20; // 1M entries, enough for ~150MB logic
const TT_FLAG = { NONE: 0, EXACT: 1, LOWERBOUND: 2, UPPERBOUND: 3 };

class AI {
    constructor(difficulty) {
        this.difficulty = difficulty || 'normal';
        this.timeout = false;
        this.nodeCount = 0;
        this.startTime = 0;
        this.searchTime = 0;

        // Structure of Arrays (SoA) for Transposition Table to minimize GC
        // ttHash: Stores the Zobrist hash (Int32)
        // ttInfo: Stores Packed Info [Score(16b) | Depth(8b) | Flag(8b)] (Int32)
        // ttMove: Stores Best Move [From(8b) | To(8b) | Unused(16b)] (Int32)
        this.ttHash = new Int32Array(TT_SIZE);
        this.ttInfo = new Int32Array(TT_SIZE);
        this.ttMove = new Int32Array(TT_SIZE);

        this.history = new Int32Array(90 * 90); // 8100 entries
        this.killers = new Array(30).fill(null).map(() => [null, null]); // Up to 30 ply
    }

    reset() {
        this.ttHash.fill(0);
        this.ttInfo.fill(0);
        this.ttMove.fill(0);
        this.history.fill(0);
        this.killers.forEach(k => k.fill(null));
    }

    // --- TT HELPER FUNCTIONS ---
    storeTT(hash, depth, flag, score, move) {
        const index = Math.abs(hash % TT_SIZE);

        // Always replace if new search is deeper or same depth, 
        // OR if the entry is old (naive replacement strategy).
        // Since we don't store age, we just favor depth.
        // Actually, for simple TT, just overwrite is often "okay" but depth-preferred is better.
        const existingInfo = this.ttInfo[index];
        const existingDepth = (existingInfo >> 16) & 0xFF; // Depth is bits 16-23

        // If existing entry is deeper and same hash, don't overwrite unless we have exact score?
        // Simple strategy: Overwrite if newDepth >= existingDepth OR existingHash != hash
        if (this.ttHash[index] !== hash || depth >= existingDepth) {
            this.ttHash[index] = hash;

            // Score packing: clamp to signed 16-bit [-32768, 32767]
            let packedScore = Math.max(-32767, Math.min(32767, score));

            // Pack Info: Score (low 16), Depth (next 8), Flag (high 8)
            // Note: TypedArrays are signed. We need to be careful with bitwise ops.
            // (Flag << 24) | (Depth << 16) | (Score & 0xFFFF)
            // Use logical shift for reading, standard for writing.
            const packedInfo = ((flag & 0xFF) << 24) | ((depth & 0xFF) << 16) | (packedScore & 0xFFFF);
            this.ttInfo[index] = packedInfo;

            if (move) {
                // Pack Move: From << 8 | To
                const fromIdx = move.from.y * 9 + move.from.x;
                const toIdx = move.to.y * 9 + move.to.x;
                this.ttMove[index] = (fromIdx << 8) | toIdx;
            } else {
                this.ttMove[index] = 0;
            }
        }
    }

    probeTT(hash, depth, alpha, beta) {
        const index = Math.abs(hash % TT_SIZE);
        if (this.ttHash[index] === hash) {
            const info = this.ttInfo[index];
            const moveData = this.ttMove[index];

            // Extract fields
            // Score is signed 16-bit. ((val & 0xFFFF) << 16) >> 16 sign extends.
            const ttScore = ((info & 0xFFFF) << 16) >> 16;
            const ttDepth = (info >>> 16) & 0xFF;
            const ttFlag = (info >>> 24) & 0xFF;

            let move = null;
            if (moveData !== 0) {
                const fromIdx = (moveData >>> 8) & 0xFF;
                const toIdx = moveData & 0xFF;
                move = {
                    from: { x: fromIdx % 9, y: Math.floor(fromIdx / 9) },
                    to: { x: toIdx % 9, y: Math.floor(toIdx / 9) }
                };
            }

            if (ttDepth >= depth) {
                if (ttFlag === TT_FLAG.EXACT) return { score: ttScore, move };
                if (ttFlag === TT_FLAG.LOWERBOUND && ttScore >= beta) return { score: ttScore, move };
                if (ttFlag === TT_FLAG.UPPERBOUND && ttScore <= alpha) return { score: ttScore, move };
            }

            // Return move for ordering even if depth is insufficient
            return { score: null, move };
        }
        return null;
    }

    getBestMove(game, color, timeLimitMs = 1500) {
        try {
            // 1. Opening Book
            const bookMove = getBookMove(game);
            if (bookMove) {
                console.log(`[AI] Book Move`);
                return bookMove;
            }

            this.startTime = Date.now();
            this.searchTime = Math.max(100, timeLimitMs - 100);
            this.timeout = false;
            this.nodeCount = 0;

            const maximize = (color === 'red');
            let bestMove = null;
            let finalScore = 0;

            // Initial Hash
            let hash = 0;
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 9; x++) {
                    const p = game.board[y][x];
                    if (p) hash ^= getZobristKey(p, x, y);
                }
            }
            if (!maximize) hash ^= ZOBRIST.turn;

            // Difficulty Configuration
            let maxDepth = 4;
            let randomness = 0;

            const profile = this.difficulty;
            if (profile === 'easy') { maxDepth = 3; randomness = 30; } // The Blunderer (Better 3 plies but errors)
            if (profile === 'normal') { maxDepth = 5; randomness = 10; } // The Tactician
            if (profile === 'hard') { maxDepth = 10; randomness = 0; } // The Strategist
            if (profile === 'extreme') { maxDepth = 24; randomness = 0; } // The Grandmaster

            console.log(`\n[AI] Start Search. Level: ${profile}, Time: ${this.searchTime}ms, MaxDepth: ${maxDepth}`);

            // Iterative Deepening
            for (let depth = 1; depth <= maxDepth; depth++) {
                if (Date.now() - this.startTime >= this.searchTime) break;

                // Aspiration Windows
                let alpha = -20000;
                let beta = 20000;
                let windowSize = 50;

                if (depth > 4 && bestMove) { // Only aspirate if we have a guess
                    alpha = finalScore - windowSize;
                    beta = finalScore + windowSize;
                }

                let score = this.searchPVS(game, depth, alpha, beta, maximize, hash, 0, true);

                // Fail Low/High Handling
                if ((score <= alpha || score >= beta) && !this.timeout) {
                    if (depth > 4) {
                        console.log(`[AI] Aspiration Fail at D${depth} (${score}), re-searching full width.`);
                        alpha = -20000;
                        beta = 20000;
                        score = this.searchPVS(game, depth, alpha, beta, maximize, hash, 0, true);
                    }
                }

                if (this.timeout) {
                    // Try to preserve previous best move if timeout occurred mid-iteration
                    console.log(`[AI] Timeout inside D${depth}`);
                    break;
                }

                // Retrieve PV from TT for best move
                const probe = this.probeTT(hash, depth, -Infinity, Infinity);
                if (probe && probe.move) {
                    bestMove = probe.move;
                    finalScore = score;
                    console.log(`[AI] Info Depth ${depth} Score ${finalScore} Nodes ${this.nodeCount} (${(this.nodeCount / (Date.now() - this.startTime) * 1000).toFixed(0)} nps) PV ${probe.move.from.x},${probe.move.from.y}->${probe.move.to.x},${probe.move.to.y}`);
                }

                if (Math.abs(score) > 10000) break; // Mate found
            }

            // Blunder Logic via Entropy
            if (bestMove && randomness > 0) {
                if (Math.random() * 100 < randomness) {
                    console.log(`[AI] Entropy Triggered: Replacing best move with sub-optimal.`);
                    const moves = this.generateMoves(game, color);
                    if (moves.length > 1) {
                        // Sort by score (approx) or just pick random?
                        // Let's pick 2nd or 3rd random legal move
                        bestMove = moves[Math.floor(Math.random() * moves.length)];
                    }
                }
            }

            if (!bestMove) {
                // Fallback
                const moves = this.generateMoves(game, color);
                if (moves.length > 0) bestMove = moves[0];
            }

            return bestMove;

        } catch (error) {
            console.error("[AI] Error:", error);
            if (error.stack) console.error(error.stack);
            return null;
        }
    }

    // Principal Variation Search
    searchPVS(game, depth, alpha, beta, maximizingPlayer, hash, ply, canNull) {
        if (this.nodeCount++ % 2048 === 0) {
            if (Date.now() - this.startTime > this.searchTime) this.timeout = true;
        }
        if (this.timeout) return alpha;

        // TT Probe
        const ttEntry = this.probeTT(hash, depth, alpha, beta);
        if (ttEntry && ttEntry.score !== null) return ttEntry.score;
        const ttMove = ttEntry ? ttEntry.move : null;

        if (depth <= 0) {
            return this.quiescence(game, alpha, beta, maximizingPlayer);
        }

        const color = maximizingPlayer ? 'red' : 'black';

        // Null Move Pruning
        if (canNull && depth >= 3 && ply > 0 && !this.isKingInCheck(game, color)) {
            const R = 2;
            const nullHash = hash ^ ZOBRIST.turn; // Pass turn
            const score = -this.searchPVS(game, depth - 1 - R, -beta, -beta + 1, !maximizingPlayer, nullHash, ply + 1, false);
            if (score >= beta) return beta;
        }

        let moves = this.generateMoves(game, color);
        if (moves.length === 0) {
            return maximizingPlayer ? -15000 + ply : 15000 - ply;
        }

        // Move Ordering
        this.scoreMoves(moves, ttMove, ply, game);
        moves.sort((a, b) => b.score - a.score);

        // --- PVS Logic with Explicit Max/Min ---
        // Adapting PVS to non-NegaMax is slightly verbose but safer for this codebase style.

        let bestScore = maximizingPlayer ? -Infinity : Infinity;
        let bestMove = null;
        let moveCount = 0;

        if (maximizingPlayer) {
            let currentAlpha = alpha;
            for (const move of moves) {
                const moveKey = this.makeMoveHash(game, move, hash);
                this.applyMove(game, move);

                let score;
                if (moveCount === 0) {
                    score = this.searchPVS(game, depth - 1, currentAlpha, beta, false, moveKey, ply + 1, true);
                } else {
                    // LMR
                    let R = 0;
                    if (depth >= 3 && moveCount > 4 && !move.captured) {
                        R = 1;
                        if (depth > 6 && moveCount > 10) R = 2;
                    }

                    // PVS Scout
                    // Search with null window [alpha, alpha+1]
                    // If LMR, reduce depth
                    score = this.searchPVS(game, depth - 1 - R, currentAlpha, currentAlpha + 1, false, moveKey, ply + 1, true);

                    if (score > currentAlpha && R > 0) {
                        // Re-search at full depth if LMR failed
                        score = this.searchPVS(game, depth - 1, currentAlpha, currentAlpha + 1, false, moveKey, ply + 1, true);
                    }

                    if (score > currentAlpha && score < beta) {
                        // Fail high on null window -> full window re-search
                        score = this.searchPVS(game, depth - 1, currentAlpha, beta, false, moveKey, ply + 1, true);
                    }
                }

                this.undoMove(game, move);
                moveCount++;

                if (this.timeout) return currentAlpha;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                if (score > currentAlpha) {
                    currentAlpha = score;
                }
                if (currentAlpha >= beta) {
                    if (!move.captured) this.updateHistory(move, depth, ply);
                    break;
                }
            }

            // Store TT
            let flag = TT_FLAG.EXACT;
            if (bestScore <= alpha) flag = TT_FLAG.UPPERBOUND;
            else if (bestScore >= beta) flag = TT_FLAG.LOWERBOUND;
            this.storeTT(hash, depth, flag, bestScore, bestMove);
            return bestScore;

        } else {
            // Minimizing
            let currentBeta = beta;
            bestScore = Infinity; // Corrected

            for (const move of moves) {
                const moveKey = this.makeMoveHash(game, move, hash);
                this.applyMove(game, move);

                let score;
                if (moveCount === 0) {
                    score = this.searchPVS(game, depth - 1, alpha, currentBeta, true, moveKey, ply + 1, true);
                } else {
                    let R = 0;
                    if (depth >= 3 && moveCount > 4 && !move.captured) {
                        R = 1;
                        if (depth > 6 && moveCount > 10) R = 2;
                    }

                    // Scout with Null Window [beta-1, beta]
                    score = this.searchPVS(game, depth - 1 - R, currentBeta - 1, currentBeta, true, moveKey, ply + 1, true);

                    if (score < currentBeta && R > 0) {
                        score = this.searchPVS(game, depth - 1, currentBeta - 1, currentBeta, true, moveKey, ply + 1, true);
                    }

                    if (score < currentBeta && score > alpha) {
                        score = this.searchPVS(game, depth - 1, alpha, currentBeta, true, moveKey, ply + 1, true);
                    }
                }

                this.undoMove(game, move);
                moveCount++;

                if (this.timeout) return currentBeta;

                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                if (score < currentBeta) {
                    currentBeta = score;
                }
                if (currentBeta <= alpha) {
                    if (!move.captured) this.updateHistory(move, depth, ply);
                    break;
                }
            }

            let flag = TT_FLAG.EXACT;
            if (bestScore >= beta) flag = TT_FLAG.LOWERBOUND;
            else if (bestScore <= alpha) flag = TT_FLAG.UPPERBOUND;
            this.storeTT(hash, depth, flag, bestScore, bestMove);
            return bestScore;
        }
    }

    quiescence(game, alpha, beta, maximizingPlayer) {
        if (this.nodeCount++ % 2048 === 0) {
            if (Date.now() - this.startTime > this.searchTime) this.timeout = true;
        }
        if (this.timeout) return maximizingPlayer ? -15000 : 15000;

        const standPat = this.evaluate(game);
        if (maximizingPlayer) {
            if (standPat >= beta) return beta;
            if (alpha < standPat) alpha = standPat;
        } else {
            if (standPat <= alpha) return alpha;
            if (beta > standPat) beta = standPat;
        }

        const color = maximizingPlayer ? 'red' : 'black';
        const moves = this.generateMoves(game, color, true); // Captures Only

        moves.sort((a, b) => {
            const vicA = PIECE_VALS[a.captured.slice(1)] || 0;
            const vicB = PIECE_VALS[b.captured.slice(1)] || 0;
            return vicB - vicA;
        });

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

    evaluate(game) {
        let score = 0;

        // Full evaluation with mobility and king safety
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = game.board[y][x];
                if (!piece) continue;

                const isRed = (piece.charAt(0) === 'r');
                const type = piece.slice(1);
                let val = PIECE_VALS[type] || 0;
                let pst = 0;
                let mobility = 0;
                let safety = 0;

                const py = isRed ? y : (9 - y);

                switch (type) {
                    case 'so':
                        pst = PST_SO[py][x];
                        if (py <= 4) {
                            if (Math.abs(4 - x) <= 2) pst += 20;
                            if (py <= 1) pst += 30;
                        }
                        break;
                    case 'ma':
                        pst = PST_MA[py][x];
                        mobility += this.countHorseMobility(game, x, y) * 5;
                        break;
                    case 'ro':
                        pst = PST_RO[py][x];
                        mobility += this.countRookMobility(game, x, y) * 2;
                        break;
                    case 'ca':
                        pst = PST_CA[py][x];
                        mobility += this.countRookMobility(game, x, y) * 2;
                        break;
                    case 'ge':
                        pst = PST_GE[py][x];
                        safety = this.evaluateKingSafety(game, x, y, isRed);
                        break;
                    case 'el': pst = PST_EL[py][x]; break;
                    case 'ad': pst = PST_AD[py][x]; break;
                }

                const materialScore = val + pst + mobility + safety;
                if (isRed) score += materialScore;
                else score -= materialScore;
            }
        }
        return score;
    }

    countHorseMobility(game, x, y) {
        const jumps = [
            { dx: 1, dy: -2, lx: 0, ly: -1 }, { dx: -1, dy: -2, lx: 0, ly: -1 },
            { dx: 1, dy: 2, lx: 0, ly: 1 }, { dx: -1, dy: 2, lx: 0, ly: 1 },
            { dx: 2, dy: -1, lx: 1, ly: 0 }, { dx: 2, dy: 1, lx: 1, ly: 0 },
            { dx: -2, dy: -1, lx: -1, ly: 0 }, { dx: -2, dy: 1, lx: -1, ly: 0 }
        ];
        let moves = 0;
        for (const j of jumps) {
            const tx = x + j.dx, ty = y + j.dy;
            if (tx >= 0 && tx <= 8 && ty >= 0 && ty <= 9) {
                if (!game.board[y + j.ly][x + j.lx]) moves++;
            }
        }
        return moves;
    }

    countRookMobility(game, x, y) {
        let free = 0;
        if (x > 0 && !game.board[y][x - 1]) free++;
        if (x < 8 && !game.board[y][x + 1]) free++;
        if (y > 0 && !game.board[y - 1][x]) free++;
        if (y < 9 && !game.board[y + 1][x]) free++;
        return free;
    }

    evaluateKingSafety(game, kx, ky, isRed) {
        let shield = 0;
        // Advisors
        const palaceY = isRed ? [7, 8, 9] : [0, 1, 2];
        const palaceX = [3, 4, 5];
        const myAd = isRed ? 'rad' : 'bad';
        const myEl = isRed ? 'rel' : 'bel';

        for (let py of palaceY) {
            for (let px of palaceX) {
                if (game.board[py][px] === myAd) shield += 15;
            }
        }
        return shield;
    }

    scoreMoves(moves, ttMove, ply, game) {
        for (const move of moves) {
            move.score = 0;
            if (ttMove && this.sameMove(move, ttMove)) {
                move.score = 20000;
                continue;
            }
            if (move.captured) {
                const victimVal = PIECE_VALS[move.captured.slice(1)] || 0;
                const attackerVal = PIECE_VALS[game.board[move.from.y][move.from.x].slice(1)] || 0;
                move.score = 1000 + victimVal * 10 - attackerVal;
            }
            if (this.killers[ply]) {
                if ((this.killers[ply][0] && this.sameMove(move, this.killers[ply][0]))) move.score += 900;
                else if ((this.killers[ply][1] && this.sameMove(move, this.killers[ply][1]))) move.score += 800;
            }
            const hIdx = (move.from.y * 9 + move.from.x) * 90 + (move.to.y * 9 + move.to.x);
            if (this.history[hIdx]) move.score += this.history[hIdx];
        }
    }

    updateHistory(move, depth, ply) {
        if (this.killers[ply]) {
            if (!this.sameMove(move, this.killers[ply][0])) {
                this.killers[ply][1] = this.killers[ply][0];
                this.killers[ply][0] = move;
            }
        }
        const hIdx = (move.from.y * 9 + move.from.x) * 90 + (move.to.y * 9 + move.to.x);
        if (this.history[hIdx] < 1000000) {
            this.history[hIdx] += depth * depth;
        }
    }

    makeMoveHash(game, move, currentHash) {
        const movingPiece = game.board[move.from.y][move.from.x];
        const captured = game.board[move.to.y][move.to.x];

        let nextHash = currentHash;
        nextHash ^= getZobristKey(movingPiece, move.from.x, move.from.y);
        if (captured) nextHash ^= getZobristKey(captured, move.to.x, move.to.y);
        nextHash ^= getZobristKey(movingPiece, move.to.x, move.to.y);
        nextHash ^= ZOBRIST.turn;
        return nextHash;
    }

    sameMove(a, b) {
        if (!a || !b) return false;
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
            const captured = game.board[move.to.y][move.to.x];
            game.board[move.to.y][move.to.x] = game.board[move.from.y][move.from.x];
            game.board[move.from.y][move.from.x] = null;
            if (!this.isKingInCheck(game, color)) {
                move.captured = captured;
                legalMoves.push(move);
            }
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

    // King Check (reused but ensures availability)
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
}

module.exports = AI;
