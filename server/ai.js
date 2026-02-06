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
// Aggressive Cannon PST - encourages firing positions and central pressure
const PST_CA = [
    // y=0: Enemy back rank - high pressure positions
    [8, 12, 20, 30, 40, 30, 20, 12, 8],
    // y=1: Second rank - strong central pressure
    [8, 12, 18, 28, 35, 28, 18, 12, 8],
    // y=2: Third rank - prime firing positions
    [10, 15, 22, 30, 38, 30, 22, 15, 10],
    // y=3: Fourth rank - attacking zone
    [10, 15, 20, 28, 35, 28, 20, 15, 10],
    // y=4: River line - crossing bonus
    [8, 12, 18, 25, 30, 25, 18, 12, 8],
    // y=5: Own river side - neutral
    [5, 8, 10, 15, 18, 15, 10, 8, 5],
    // y=6: Own territory
    [2, 5, 8, 12, 15, 12, 8, 5, 2],
    // y=7: Development squares
    [0, 2, 5, 10, 12, 10, 5, 2, 0],
    // y=8: Back rank - slight penalty for stagnation
    [-2, 0, 2, 5, 8, 5, 2, 0, -2],
    // y=9: Corner penalty
    [-5, -2, 0, 2, 5, 2, 0, -2, -5]
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
        this.killers = new Array(40).fill(null).map(() => [null, null]); // Up to 40 ply for deeper search

        // Position history for repetition detection (stores last 50 position hashes)
        this.positionHistory = [];
        this.maxHistoryLength = 50;
    }

    reset() {
        this.ttHash.fill(0);
        this.ttInfo.fill(0);
        this.ttMove.fill(0);
        this.history.fill(0);
        this.killers.forEach(k => k.fill(null));
        this.positionHistory = []; // Clear repetition history
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

    // --- REPETITION DETECTION METHODS ---
    // Record a position hash in history (called after each actual move)
    recordPosition(hash) {
        this.positionHistory.push(hash);
        // Keep history bounded
        if (this.positionHistory.length > this.maxHistoryLength) {
            this.positionHistory.shift();
        }
    }

    // Count how many times a position hash appears in history
    countRepetitions(hash) {
        let count = 0;
        for (const h of this.positionHistory) {
            if (h === hash) count++;
        }
        return count;
    }

    // Check if a position is repeated (2+ times = considered repeated)
    isRepeatedPosition(hash) {
        return this.countRepetitions(hash) >= 2;
    }

    // Clear position history (call on new game)
    clearPositionHistory() {
        this.positionHistory = [];
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

            // Difficulty Configuration - Enhanced for smarter AI
            let maxDepth = 4;
            let randomness = 0;

            const profile = this.difficulty;

            if (profile === 'easy') { maxDepth = 4; randomness = 20; } // Beginner: Reasonable play with occasional mistakes
            if (profile === 'normal') { maxDepth = 6; randomness = 5; } // Intermediate: Solid tactical play
            if (profile === 'hard') {
                maxDepth = 20; // Champion level: very deep strategic thinking
                randomness = 0;
                this.searchTime = Math.min(timeLimitMs, 12000); // 12s budget for deep analysis
            }

            console.log(`\n[AI] Start Search. Level: ${profile}, Time: ${this.searchTime}ms, MaxDepth: ${maxDepth}`);

            // Iterative Deepening with dedicated root search
            let previousBestMove = null;
            let previousBestScore = 0;

            for (let depth = 1; depth <= maxDepth; depth++) {
                if (Date.now() - this.startTime >= this.searchTime) break;

                // Use dedicated root search that returns {move, score}
                const result = this.searchRoot(game, depth, maximize, hash, previousBestMove);

                if (this.timeout) {
                    // Use the previous completed iteration's move
                    console.log(`[AI] Timeout inside D${depth}, using D${depth - 1} result`);
                    break;
                }

                if (result && result.move) {
                    previousBestMove = result.move;
                    previousBestScore = result.score;
                    bestMove = result.move;
                    finalScore = result.score;
                    console.log(`[AI] Info Depth ${depth} Score ${finalScore} Nodes ${this.nodeCount} (${(this.nodeCount / (Date.now() - this.startTime) * 1000).toFixed(0)} nps) PV ${result.move.from.x},${result.move.from.y}->${result.move.to.x},${result.move.to.y}`);
                }

                if (Math.abs(finalScore) > 10000) break; // Mate found
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

            // === REPETITION AVOIDANCE ===
            // Check if best move would cause a repetition - if so, try to find alternative
            if (bestMove) {
                const resultHash = this.makeMoveHash(game, bestMove, hash);
                const repCount = this.countRepetitions(resultHash);

                if (repCount >= 1) {
                    // This move would cause repetition (already seen at least once before)
                    console.log(`[AI] Best move causes repetition (count: ${repCount}), seeking alternative...`);

                    // Try to find a non-repeating alternative
                    const moves = this.generateMoves(game, color);
                    this.scoreMoves(moves, bestMove, 0, game);
                    moves.sort((a, b) => b.score - a.score);

                    let alternativeFound = false;
                    for (const move of moves) {
                        if (this.sameMove(move, bestMove)) continue;

                        const altHash = this.makeMoveHash(game, move, hash);
                        if (this.countRepetitions(altHash) === 0) {
                            // Found a non-repeating move
                            // Verify it's not completely losing (within 300cp of best)
                            this.applyMove(game, move);
                            const altScore = this.evaluate(game);
                            this.undoMove(game, move);

                            // Accept if within reasonable margin
                            if (Math.abs(altScore - finalScore) < 300 || moves.indexOf(move) < 5) {
                                console.log(`[AI] Found alternative: ${move.from.x},${move.from.y}->${move.to.x},${move.to.y}`);
                                bestMove = move;
                                alternativeFound = true;
                                break;
                            }
                        }
                    }

                    if (!alternativeFound) {
                        console.log(`[AI] No good alternative found, using original move`);
                    }
                }

                // Record the final position for future repetition detection
                const finalHash = this.makeMoveHash(game, bestMove, hash);
                this.recordPosition(finalHash);
            }

            return bestMove;

        } catch (error) {
            console.error("[AI] Error:", error);
            if (error.stack) console.error(error.stack);
            return null;
        }
    }

    // Dedicated root search that returns the best move directly (not from TT)
    searchRoot(game, depth, maximize, hash, previousBestMove) {
        const color = maximize ? 'red' : 'black';
        let moves = this.generateMoves(game, color);

        if (moves.length === 0) {
            return { move: null, score: maximize ? -15000 : 15000 };
        }

        // Move ordering - prioritize previous best move
        this.scoreMoves(moves, previousBestMove, 0, game);
        moves.sort((a, b) => b.score - a.score);

        let bestMove = moves[0];
        let bestScore = maximize ? -Infinity : Infinity;
        let alpha = -20000;
        let beta = 20000;

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const moveKey = this.makeMoveHash(game, move, hash);
            this.applyMove(game, move);

            let score;
            if (i === 0) {
                // Full window for first move
                score = this.searchPVS(game, depth - 1, alpha, beta, !maximize, moveKey, 1, true);
            } else {
                // PVS: null window search first
                score = this.searchPVS(game, depth - 1, alpha, alpha + 1, !maximize, moveKey, 1, true);
                if (score > alpha && score < beta) {
                    // Re-search with full window
                    score = this.searchPVS(game, depth - 1, alpha, beta, !maximize, moveKey, 1, true);
                }
            }

            this.undoMove(game, move);

            if (this.timeout) {
                // Return partial result - use current best or first move
                return { move: bestMove, score: bestScore };
            }

            if (maximize) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                if (score > alpha) alpha = score;
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                if (score < beta) beta = score;
            }
        }

        // Store to TT for future use
        this.storeTT(hash, depth, TT_FLAG.EXACT, bestScore, bestMove);

        return { move: bestMove, score: bestScore };
    }

    // Principal Variation Search
    searchPVS(game, depth, alpha, beta, maximizingPlayer, hash, ply, canNull) {
        // More frequent timeout check (every 1024 nodes) for better time control
        if (this.nodeCount++ % 1024 === 0) {
            if (Date.now() - this.startTime > this.searchTime) this.timeout = true;
        }
        if (this.timeout) return alpha;

        // TT Probe - but DON'T return score cutoff at root (ply 0) to ensure proper search
        const ttEntry = this.probeTT(hash, depth, alpha, beta);
        let ttMove = null;
        if (ttEntry) {
            ttMove = ttEntry.move;
            // Only use TT score cutoff at non-root nodes
            if (ply > 0 && ttEntry.score !== null) {
                return ttEntry.score;
            }
        }

        // Repetition Detection - penalize repeated positions to avoid infinite loops
        // If this position was seen before, treat it as a slight disadvantage (draw-like)
        if (ply > 0 && this.isRepeatedPosition(hash)) {
            // Return a draw score with slight penalty for the side that caused repetition
            return maximizingPlayer ? -50 : 50;
        }

        const color = maximizingPlayer ? 'red' : 'black';

        // Check Extension - prevent horizon effect on checks
        const inCheck = this.isKingInCheck(game, color);
        if (inCheck && depth > 0) {
            depth += 1;
        }

        if (depth <= 0) {
            return this.quiescence(game, alpha, beta, maximizingPlayer);
        }

        // Static Null Move Pruning (Reverse Futility Pruning)
        if (depth < 3 && !inCheck && ply > 0) {
            const staticEval = this.evaluate(game);
            const margin = 150 * depth; // ~150 cp per ply
            if (maximizingPlayer) {
                if (staticEval - margin >= beta) return beta;
            } else {
                if (staticEval + margin <= alpha) return alpha;
            }
        }

        // Null Move Pruning (skip if in check)
        if (canNull && depth >= 3 && ply > 0 && !inCheck) {
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
                    // LMR - Conservative thresholds for strong play
                    let R = 0;
                    if (depth >= 3 && moveCount > 6 && !move.captured) {
                        R = 1;
                        if (depth > 6 && moveCount > 12) R = 2;
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
                    // LMR - Conservative thresholds for strong play
                    let R = 0;
                    if (depth >= 3 && moveCount > 6 && !move.captured) {
                        R = 1;
                        if (depth > 6 && moveCount > 12) R = 2;
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

        // Stand pat cutoff
        if (maximizingPlayer) {
            if (standPat >= beta) return beta;
            if (alpha < standPat) alpha = standPat;
        } else {
            if (standPat <= alpha) return alpha;
            if (beta > standPat) beta = standPat;
        }

        const color = maximizingPlayer ? 'red' : 'black';
        const moves = this.generateMoves(game, color, true); // Captures Only

        // Sort by victim value (MVV)
        moves.sort((a, b) => {
            const vicA = PIECE_VALS[a.captured.slice(1)] || 0;
            const vicB = PIECE_VALS[b.captured.slice(1)] || 0;
            return vicB - vicA;
        });

        // Delta pruning margin
        const DELTA_MARGIN = 200;

        if (maximizingPlayer) {
            for (const move of moves) {
                // Delta pruning: skip if capture can't possibly improve alpha
                const victimVal = PIECE_VALS[move.captured.slice(1)] || 0;
                if (standPat + victimVal + DELTA_MARGIN < alpha) continue;

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
                // Delta pruning for minimizer
                const victimVal = PIECE_VALS[move.captured.slice(1)] || 0;
                if (standPat - victimVal - DELTA_MARGIN > beta) continue;

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
        let redKingPos = null;
        let blackKingPos = null;

        // Piece tracking for coordination bonuses
        const redRooks = [];
        const blackRooks = [];
        const redCannons = [];
        const blackCannons = [];
        const redHorses = [];
        const blackHorses = [];
        const redPawns = [];
        const blackPawns = [];
        let redAdvisors = 0, blackAdvisors = 0;
        let redElephants = 0, blackElephants = 0;
        let totalPieces = 0;

        // First pass: find kings and collect piece positions
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = game.board[y][x];
                if (!piece) continue;
                totalPieces++;

                if (piece === 'rge') redKingPos = { x, y };
                else if (piece === 'bge') blackKingPos = { x, y };
                else if (piece === 'rro') redRooks.push({ x, y });
                else if (piece === 'bro') blackRooks.push({ x, y });
                else if (piece === 'rca') redCannons.push({ x, y });
                else if (piece === 'bca') blackCannons.push({ x, y });
                else if (piece === 'rma') redHorses.push({ x, y });
                else if (piece === 'bma') blackHorses.push({ x, y });
                else if (piece === 'rso') redPawns.push({ x, y });
                else if (piece === 'bso') blackPawns.push({ x, y });
                else if (piece === 'rad') redAdvisors++;
                else if (piece === 'bad') blackAdvisors++;
                else if (piece === 'rel') redElephants++;
                else if (piece === 'bel') blackElephants++;
            }
        }

        const isEndgame = totalPieces <= 14;

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
                let penalty = 0;
                let bonus = 0;

                const py = isRed ? y : (9 - y);

                switch (type) {
                    case 'so':
                        pst = PST_SO[py][x];
                        if (py <= 4) {
                            if (Math.abs(4 - x) <= 2) pst += 20;
                            if (py <= 1) pst += 30;
                        }
                        // Passed pawn bonus (no enemy pawns ahead)
                        const enemyPawns = isRed ? blackPawns : redPawns;
                        let isPassed = true;
                        for (const ep of enemyPawns) {
                            if (Math.abs(ep.x - x) <= 1 && (isRed ? ep.y < y : ep.y > y)) {
                                isPassed = false;
                                break;
                            }
                        }
                        if (isPassed && py <= 4) {
                            bonus += 15 + (4 - py) * 10; // Reduced: Closer to promotion = more valuable
                        }
                        // Connected pawns
                        const friendlyPawns = isRed ? redPawns : blackPawns;
                        for (const fp of friendlyPawns) {
                            if (fp.x !== x && Math.abs(fp.x - x) <= 1 && Math.abs(fp.y - y) <= 1) {
                                bonus += 8; // Reduced connected pawn support
                                break;
                            }
                        }
                        break;
                    case 'ma':
                        pst = PST_MA[py][x];
                        mobility += this.countHorseMobility(game, x, y) * 5;
                        // Centralization bonus
                        if (py >= 3 && py <= 6 && x >= 2 && x <= 6) {
                            bonus += 8; // Reduced centralization bonus
                        }
                        // Horse in endgame is stronger
                        if (isEndgame) bonus += 15; // Reduced endgame horse bonus
                        // Penalty: Horse on weak central palace squares
                        if (isRed && x === 4 && (y === 7 || y === 8)) {
                            penalty += 50;
                        }
                        if (!isRed && x === 4 && (y === 1 || y === 2)) {
                            penalty += 50;
                        }
                        break;
                    case 'ro':
                        pst = PST_RO[py][x];
                        mobility += this.countRookMobility(game, x, y) * 2;
                        // Rook on 7th rank (enemy's 2nd rank) bonus
                        if ((isRed && y <= 2) || (!isRed && y >= 7)) {
                            bonus += 40;
                        }
                        // Open file bonus
                        let openFile = true;
                        for (let ty = 0; ty < 10; ty++) {
                            if (ty !== y && game.board[ty][x] && game.board[ty][x].slice(1) === 'so') {
                                openFile = false;
                                break;
                            }
                        }
                        if (openFile) bonus += 25;
                        break;
                    case 'ca':
                        pst = PST_CA[py][x];
                        mobility += this.countRookMobility(game, x, y) * 2;
                        // Cannon needs screen pieces - penalty in endgame with few pieces
                        if (isEndgame) penalty += 40;
                        break;
                    case 'ge':
                        pst = PST_GE[py][x];
                        safety = this.evaluateKingSafety(game, x, y, isRed);
                        // Endgame king activity
                        if (isEndgame && py <= 7) bonus += 20;
                        break;
                    case 'el': pst = PST_EL[py][x]; break;
                    case 'ad': pst = PST_AD[py][x]; break;
                }

                const materialScore = val + pst + mobility + safety + bonus - penalty;
                if (isRed) score += materialScore;
                else score -= materialScore;
            }
        }

        // === PIECE COORDINATION BONUSES (reduced to prioritize tactics) ===

        // Double Rooks on same file or rank
        if (redRooks.length === 2) {
            if (redRooks[0].x === redRooks[1].x || redRooks[0].y === redRooks[1].y) {
                score += 30; // Reduced from 80
            }
            // Double rooks on enemy back rank ("Song xa áp thành")
            if (redRooks[0].y <= 2 && redRooks[1].y <= 2) {
                score += 50; // Reduced from 150
            }
        }
        if (blackRooks.length === 2) {
            if (blackRooks[0].x === blackRooks[1].x || blackRooks[0].y === blackRooks[1].y) {
                score -= 30;
            }
            if (blackRooks[0].y >= 7 && blackRooks[1].y >= 7) {
                score -= 50;
            }
        }

        // Cannon + Horse coordination (reduced)
        for (const cannon of redCannons) {
            for (const horse of redHorses) {
                if (Math.abs(cannon.x - horse.x) <= 2 && Math.abs(cannon.y - horse.y) <= 2) {
                    score += 20; // Reduced from 60
                }
            }
        }
        for (const cannon of blackCannons) {
            for (const horse of blackHorses) {
                if (Math.abs(cannon.x - horse.x) <= 2 && Math.abs(cannon.y - horse.y) <= 2) {
                    score -= 20;
                }
            }
        }

        // === TACTICAL PATTERNS ===

        // "Pháo đầu" - Cannon on same file as enemy General
        if (blackKingPos) {
            for (const cannon of redCannons) {
                if (cannon.x === blackKingPos.x && cannon.y < blackKingPos.y) {
                    // Check if there's exactly one screen piece
                    let screens = 0;
                    for (let ty = cannon.y + 1; ty < blackKingPos.y; ty++) {
                        if (game.board[ty][cannon.x]) screens++;
                    }
                    if (screens === 1) score += 100; // "Pháo đầu" threat
                    else if (screens === 0) score += 50; // Direct pressure
                }
            }
        }
        if (redKingPos) {
            for (const cannon of blackCannons) {
                if (cannon.x === redKingPos.x && cannon.y > redKingPos.y) {
                    let screens = 0;
                    for (let ty = redKingPos.y + 1; ty < cannon.y; ty++) {
                        if (game.board[ty][cannon.x]) screens++;
                    }
                    if (screens === 1) score -= 100;
                    else if (screens === 0) score -= 50;
                }
            }
        }

        // === ADVANCED KING SAFETY ===

        // Exposed general penalty - fewer defenders = more danger
        if (redKingPos) {
            if (redAdvisors === 0) score -= 80;
            if (redElephants === 0) score -= 40;
            if (redAdvisors === 0 && redElephants === 0) score -= 120; // Very exposed
        }
        if (blackKingPos) {
            if (blackAdvisors === 0) score += 80;
            if (blackElephants === 0) score += 40;
            if (blackAdvisors === 0 && blackElephants === 0) score += 120;
        }

        // "Pháo khống" (Cannon pin) detection
        if (redKingPos) {
            score -= this.detectCannonPin(game, redKingPos, 'red');
        }
        if (blackKingPos) {
            score += this.detectCannonPin(game, blackKingPos, 'black');
        }

        return score;
    }

    // Detect Cannon pin threat on the general - returns penalty value
    // "Pháo khống" - Cannon pins a piece to the general
    detectCannonPin(game, kingPos, kingColor) {
        const kx = kingPos.x;
        const ky = kingPos.y;
        const enemyPrefix = kingColor === 'red' ? 'b' : 'r';
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        let penalty = 0;

        for (const [dx, dy] of dirs) {
            let cx = kx + dx, cy = ky + dy;
            let screenPiece = null;
            let screenPos = null;
            let piecesFound = 0;

            // Scan outward from king
            while (cx >= 0 && cx <= 8 && cy >= 0 && cy <= 9) {
                const p = game.board[cy][cx];
                if (p) {
                    piecesFound++;
                    if (piecesFound === 1) {
                        // First piece is potential screen (pinned piece)
                        screenPiece = p;
                        screenPos = { x: cx, y: cy };
                    } else if (piecesFound === 2) {
                        // Second piece - check if enemy cannon
                        if (p.charAt(0) === enemyPrefix && p.slice(1) === 'ca') {
                            // Cannon pin detected!
                            // Penalty based on value of pinned piece
                            const pinnedType = screenPiece.slice(1);
                            const pinnedVal = PIECE_VALS[pinnedType] || 0;
                            // Higher penalty if pinning own valuable piece
                            if (screenPiece.charAt(0) !== enemyPrefix) {
                                penalty += 80 + Math.floor(pinnedVal * 0.15);
                            }
                        }
                        break;
                    }
                }
                cx += dx;
                cy += dy;
            }
        }
        return penalty;
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

    // Enhanced mobility counting full open lines, penalizes trapped pieces
    countRookMobility(game, x, y) {
        let mobility = 0;
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            let cx = x + dx, cy = y + dy;
            while (cx >= 0 && cx <= 8 && cy >= 0 && cy <= 9) {
                if (!game.board[cy][cx]) {
                    mobility++;
                } else {
                    break;
                }
                cx += dx;
                cy += dy;
            }
        }
        // Penalize trapped pieces (0 mobility is bad)
        if (mobility === 0) return -3;
        return mobility;
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

            // 1. TT Move: highest priority
            if (ttMove && this.sameMove(move, ttMove)) {
                move.score = 30000;
                continue;
            }

            // 2. Captures: MVV-LVA with win/loss distinction
            if (move.captured) {
                const victimVal = PIECE_VALS[move.captured.slice(1)] || 0;
                const attackerVal = PIECE_VALS[game.board[move.from.y][move.from.x].slice(1)] || 0;
                const mvvLva = victimVal * 10 - attackerVal;

                // Winning capture (victim >= attacker): priority 20000+
                // Losing capture (victim < attacker): priority -10000+
                if (victimVal >= attackerVal) {
                    move.score = 20000 + mvvLva;
                } else {
                    move.score = -10000 + mvvLva;
                }
                continue;
            }

            // 3. Killer moves: high priority for quiet moves
            if (this.killers[ply]) {
                if (this.killers[ply][0] && this.sameMove(move, this.killers[ply][0])) {
                    move.score = 9000;
                    continue;
                }
                if (this.killers[ply][1] && this.sameMove(move, this.killers[ply][1])) {
                    move.score = 8000;
                    continue;
                }
            }

            // 4. History heuristic: scale to 0-6000 range
            const hIdx = (move.from.y * 9 + move.from.x) * 90 + (move.to.y * 9 + move.to.x);
            if (this.history[hIdx]) {
                move.score += Math.min(this.history[hIdx], 6000);
            }
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
