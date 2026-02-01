const XiangqiGame = require('./game');

// --- CONSTANTS ---

// Piece material values (Standard informal values)
const PIECE_VALUES = {
    'ge': 10000,
    'ad': 20,
    'el': 20,
    'ma': 45,
    'ro': 90,
    'ca': 50,
    'so': 10
};

// Simplified Position Bonuses (just to encourage center control and advancement)
// Ideally these would be 10x9 arrays for each piece type.
// For MVP, we will use simple logic in evaluation, or small tables.

// 0-9 (rows), 0-8 (cols). 
// Red is at bottom (rows 5-9), Black at top (rows 0-4).
// Black pawn advances: increases row index.
// Red pawn advances: decreases row index.

const PAWN_TABLE_RED = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0], // promoted? usually pawns don't reach end and stick around, but high value if they do
    [2, 2, 2, 2, 2, 2, 2, 2, 2], // near general
    [2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2], // river crossed
    [-1, 0, -1, 0, -1, 0, -1, 0, -1], // river bank
    [-1, 0, -1, 0, -1, 0, -1, 0, -1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const PAWN_TABLE_BLACK = [...PAWN_TABLE_RED].reverse(); // Flip for Black? 
// No, PAWN_TABLE_RED assumes row 0 is TOP.
// If Red is at current row y, we look up PAWN_TABLE_RED[y][x].
// Red moves UP (row decreases). So high logic should be at LOW indices.
// Wait, Red starts at row 6/7. 
// So index 0 is deep in Black territory. That should be HIGH value.
// My table above: index 0 is 0? That's wrong. 
// Let's redo.

// Red Goal: Reach Row 0.
const PST_RED_SOLDIER = [
    [10, 10, 10, 10, 10, 10, 10, 10, 10], // In the palace!
    [10, 10, 11, 15, 20, 15, 11, 10, 10], // Threatening palace
    [8, 8, 10, 13, 13, 13, 10, 8, 8],
    [5, 5, 5, 7, 10, 7, 5, 5, 5], // Crossed river
    [2, 2, 2, 5, 5, 5, 2, 2, 2], // River line
    [0, 0, 0, 0, 1, 0, 0, 0, 0], // Own bank
    [0, 0, -1, 0, -1, 0, -1, 0, 0], // Starting lines
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

// Black Goal: Reach Row 9.
const PST_BLACK_SOLDIER = [...PST_RED_SOLDIER].reverse();

// --- AI CLASS ---

class AI {
    constructor(difficulty) {
        this.difficulty = difficulty || 'normal';
    }

    getDepth() {
        switch (this.difficulty) {
            case 'easy': return 2;
            case 'normal': return 3;
            case 'hard': return 4;
            case 'extreme': return 5;
            default: return 3;
        }
    }

    // Main entry point
    getBestMove(game, color) {
        const depth = this.getDepth();
        const maximize = (color === 'red'); // Red wants +Score, Black wants -Score

        let bestMove = null;
        let bestScore = maximize ? -Infinity : Infinity;

        // Generate all possible moves for root
        const moves = this.getAllMoves(game, color);

        // Simpler ordering for root: captures first? Use naive sort or just shuffle to avoid repetition
        moves.sort(() => Math.random() - 0.5);

        for (const move of moves) {
            // Test move
            const captured = game.board[move.to.y][move.to.x];
            game.makeMove(move.from.x, move.from.y, move.to.x, move.to.y); // This switches turn inside

            // Eval
            const score = this.minimax(game, depth - 1, -Infinity, Infinity, !maximize);

            // Undo
            this.undoMove(game, move, captured);

            if (maximize) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
        }

        return bestMove;
    }

    minimax(game, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || game.winner) {
            return this.evaluate(game);
        }

        const color = maximizingPlayer ? 'red' : 'black';
        const moves = this.getAllMoves(game, color);

        if (moves.length === 0) {
            // No moves? Lost.
            return maximizingPlayer ? -100000 : 100000;
        }

        // Move Ordering: Captures first (MVV/LVA simplified)
        // Helps pruning significantly
        moves.sort((a, b) => {
            const captA = game.board[a.to.y][a.to.x] ? 10 : 0;
            const captB = game.board[b.to.y][b.to.x] ? 10 : 0;
            return captB - captA;
        });

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const captured = game.board[move.to.y][move.to.x];

                // --- MANUAL MAKE MOVE TO AVOID SIDE EFFECTS OF game.makeMove() ---
                // We need to bypass Turn check and History push for speed/safety if possible, 
                // but game.makeMove does validation. 
                // Since 'moves' are generated as VALID, we can just apply board changes.
                // However, game.makeMove also handles "Winner" logic (no moves).
                // Let's manually apply board changes for speed.

                game.board[move.to.y][move.to.x] = game.board[move.from.y][move.from.x];
                game.board[move.from.y][move.from.x] = null;
                // Note: We are NOT switching game.turn here because minimax tracks 'maximizingPlayer'

                // IMPORTANT: Check for Check?
                // `getAllMoves` already filtered legal moves (including checking self-check).
                // But we need to know if we won? 
                // We evaluate at leaf. 

                const evalScore = this.minimax(game, depth - 1, alpha, beta, false);

                // Undo
                game.board[move.from.y][move.from.x] = game.board[move.to.y][move.to.x];
                game.board[move.to.y][move.to.x] = captured;

                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break; // Prune
            }
            return maxEval;

        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const captured = game.board[move.to.y][move.to.x];

                // Execute
                game.board[move.to.y][move.to.x] = game.board[move.from.y][move.from.x];
                game.board[move.from.y][move.from.x] = null;

                const evalScore = this.minimax(game, depth - 1, alpha, beta, true);

                // Undo
                game.board[move.from.y][move.from.x] = game.board[move.to.y][move.to.x];
                game.board[move.to.y][move.to.x] = captured;

                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    // Helper to revert state if we used real game.makeMove (which we didn't in recursion, but did in root)
    undoMove(game, move, captured) {
        // Reverse board
        game.board[move.from.y][move.from.x] = game.board[move.to.y][move.to.x];
        game.board[move.to.y][move.to.x] = captured;

        // Reverse history
        game.history.pop();

        // Reverse turn
        game.switchTurn();

        // Reset winner if it was set
        game.winner = null;
    }

    getAllMoves(game, color) {
        const moves = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = game.board[y][x];
                if (piece && piece.startsWith(color === 'red' ? 'r' : 'b')) {
                    // Optimized: Don't use game.getPossibleMoves which iterates everything
                    // Instead, manual check for this piece
                    for (let ty = 0; ty < 10; ty++) {
                        for (let tx = 0; tx < 9; tx++) {
                            // 1. Basic Valid
                            if (game.isValidMove(x, y, tx, ty, color)) {
                                // 2. King Safety
                                if (game.testMove(x, y, tx, ty, color)) {
                                    moves.push({ from: { x, y }, to: { x: tx, y: ty } });
                                }
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    evaluate(game) {
        if (game.winner === 'red') return 100000;
        if (game.winner === 'black') return -100000;

        let score = 0;

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = game.board[y][x];
                if (!piece) continue;

                const color = piece.charAt(0);
                const type = piece.slice(1);
                const val = PIECE_VALUES[type];

                // Positional Bonus
                let pst = 0;
                if (type === 'so') {
                    if (color === 'r') pst = PST_RED_SOLDIER[y][x];
                    else pst = PST_BLACK_SOLDIER[y][x];
                }

                if (color === 'r') {
                    score += val + pst;
                } else {
                    score -= (val + pst);
                }
            }
        }
        return score;
    }
}

module.exports = AI;
