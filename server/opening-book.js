// server/opening-book.js
// Expanded Opening Book for Xiangqi
// Uses a move-string format: "fromX,fromY-toX,toY"
// Key is the Move History joined by '|'
// Coordinates:
// Red (First Move) Starts at Bottom (y=7,8,9).
// Black Starts at Top (y=0,1,2).
// x=0 is Left, x=8 is Right.
// Red's "Left Cannon" is at (1,7). "Right Cannon" at (7,7).
// Black's "Left Cannon" is at (1,2). "Right Cannon" at (7,2).

const BOOK = {
    // === START OF GAME (RED TO MOVE) ===
    "": [
        { move: { from: { x: 7, y: 7 }, to: { x: 4, y: 7 } }, weight: 50 }, // Central Cannon (Right) - Most aggressive
        { move: { from: { x: 1, y: 7 }, to: { x: 4, y: 7 } }, weight: 20 }, // Central Cannon (Left)
        { move: { from: { x: 2, y: 9 }, to: { x: 4, y: 7 } }, weight: 15 }, // Elephant to Center (Solid)
        { move: { from: { x: 6, y: 9 }, to: { x: 4, y: 7 } }, weight: 10 }, // Elephant (Left)
        { move: { from: { x: 2, y: 9 }, to: { x: 0, y: 7 } }, weight: 5 }   // Elephant Edge (Defensive)
    ],

    // === 1. CENTRAL CANNON (RIGHT) RESPONSE ===
    // Red: 7,7 -> 4,7
    "7,7-4,7": [
        { move: { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } }, weight: 60 }, // Screen Horse (Standard Defense)
        { move: { from: { x: 7, y: 2 }, to: { x: 4, y: 2 } }, weight: 20 }, // Same Direction Cannon (Aggressive)
        { move: { from: { x: 1, y: 2 }, to: { x: 4, y: 2 } }, weight: 20 }, // Opposite Direction Cannon (Counter)
    ],

    // 1.1 Red Central Cannon -> Black Screen Horse
    // R: 7,7-4,7 | B: 7,0-6,2
    "7,7-4,7|7,0-6,2": [
        { move: { from: { x: 7, y: 9 }, to: { x: 6, y: 7 } }, weight: 80 }, // Red Horse out (Standard)
        { move: { from: { x: 1, y: 7 }, to: { x: 4, y: 7 } }, weight: 10 }, // Double Central Cannon (Risky)
    ],

    // 1.1.1 Red Horse -> Black Horse (Screen Horses complete)
    // R: 7,7-4,7 | B: 7,0-6,2 | R: 7,9-6,7
    "7,7-4,7|7,0-6,2|7,9-6,7": [
        { move: { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } }, weight: 90 }, // Black Second Horse (Full Screen Horses)
        { move: { from: { x: 8, y: 0 }, to: { x: 8, y: 1 } }, weight: 10 }, // Rook file opening
    ],

    // 1.1.1.1 Full Screen Horses -> Red Pawn
    // R: 7,7-4,7 | B: 7,0-6,2 | R: 7,9-6,7 | B: 1,0-2,2
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2": [
        { move: { from: { x: 4, y: 6 }, to: { x: 4, y: 5 } }, weight: 50 }, // Center Pawn Advance
        { move: { from: { x: 8, y: 9 }, to: { x: 8, y: 8 } }, weight: 30 }, // Rook 1 step
        { move: { from: { x: 6, y: 6 }, to: { x: 6, y: 5 } }, weight: 20 }, // 7th Pawn Advance
    ],

    // === 2. SAME DIRECTION CANNONS ===
    // R: 7,7-4,7 | B: 7,2-4,2
    "7,7-4,7|7,2-4,2": [
        { move: { from: { x: 7, y: 9 }, to: { x: 6, y: 7 } }, weight: 100 }, // Red Horse
    ],

    // === 3. ELEPHANT OPENING ===
    // Red: 2,9 -> 4,7
    "2,9-4,7": [
        { move: { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, weight: 50 }, // Black Central Pawn (Standard counter)
        { move: { from: { x: 1, y: 2 }, to: { x: 4, y: 2 } }, weight: 30 }, // Black Central Cannon
    ],

    // 3.1 Elephant -> Pawn
    // R: 2,9-4,7 | B: 4,3-4,4
    "2,9-4,7|4,3-4,4": [
        { move: { from: { x: 7, y: 9 }, to: { x: 6, y: 7 } }, weight: 60 }, // Red develops Horse
        { move: { from: { x: 6, y: 9 }, to: { x: 4, y: 7 } }, weight: 40 }, // Double Elephant
    ],

    // === BLACK STARTING RESPONSES (If User plays Red) ===
    // Note: The history might look like "move1". This file handles lookups.
};

function getBookMove(game) {
    // Only use book for first 8 plies (4 moves each)
    if (game.history.length > 8) return null;

    const historyKey = game.history.map(m => `${m.from.x},${m.from.y}-${m.to.x},${m.to.y}`).join('|');
    const options = BOOK[historyKey];

    if (options && options.length > 0) {
        // Weighted Random Selection
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let random = Math.random() * totalWeight;

        for (const opt of options) {
            random -= opt.weight;
            if (random <= 0) {
                return opt.move;
            }
        }
        return options[0].move; // Fallback
    }

    // Symmetry Handling (Mirror Left/Right if not found)
    // TODO: Advanced symmetry logic would double the book size effectively.
    // For now, simpler is better.

    return null;
}

module.exports = getBookMove;
