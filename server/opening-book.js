// server/opening-book.js
// Compact opening book for Xiangqi
// Format: "fen_or_zobrist": "move" (Simpler: just check board state or history)
// Since we don't have full FEN parser yet in Game, we'll use a simple "Move History" matching or Board Hash if possible.
// 
// For simplicity: We will match based on the FIRST FEW MOVES from 'startpos'.
// We represent moves as "x,y-tx,ty" strings.

const START_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";

// Standard Red Openings (as Red)
// 1. Central Cannon (Pháo Đầu): 4,2 -> 4,4 (Engine coord: x=4, y=7 -> 4,4? No. Red is bottom y=9.
// Code coords: Red home y=9. Central Cannon: (4, 7) -> (4, 4)? No. Cannon is at y=7.
// Red Cannon at (1, 7) and (7, 7).
// Central Cannon Move: (1, 7) -> (4, 7) or (7, 7) -> (4, 7).
// Let's stick to (x, y) coordinates of source/dest.
// Red Logic: y=9 is bottom.
// (1, 7) -> (4, 7) : Cheating? No, cannons are at y=7.
// Wait, in `game.js`, Initial Board:
// y=9: rro, rma, rel, rad, rge ...
// y=7: rca (1,7), rca (7,7)
// y=6: empty
// Target central file is x=4.
// So move is (7, 7) -> (4, 7) [Right Cannon Center]

/*
  Structure:
  key: "move1,move2" (joined by |)
  value: ["moveResponse1", "moveResponse2"] (weighted or random)
*/

const BOOK = {
    // RED OPENINGS (Empty history)
    "": [
        { from: { x: 7, y: 7 }, to: { x: 4, y: 7 } }, // Central Cannon (Right)
        { from: { x: 1, y: 7 }, to: { x: 4, y: 7 } }, // Central Cannon (Left)
        { from: { x: 2, y: 9 }, to: { x: 4, y: 7 } }, // Elephant to Center (Solid)
        { from: { x: 2, y: 9 }, to: { x: 0, y: 7 } }  // Elephant Edge (Defensive)
    ],

    // BLACK RESPONSES (After 1 move)
    // Red plays Central Cannon Right: (7,7)->(4,7)
    "7,7-4,7": [
        { from: { x: 7, y: 2 }, to: { x: 4, y: 2 } }, // Same Direction Cannons (Screen Horses)
        { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } }, // Horse to protect center pawn
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } }, // Other Horse
    ],
    // Red plays Central Cannon Left: (1,7)->(4,7)
    "1,7-4,7": [
        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 } },
        { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } },
    ],
    // Red plays Elephant (2,9)->(4,7)
    "2,9-4,7": [
        { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, // Pawn advance
        { from: { x: 1, y: 2 }, to: { x: 4, y: 2 } }, // Cannon center
    ]
};

function getBookMove(game) {
    // Reconstruct history string
    // Assuming game.history contains {from: {x,y}, to: {x,y}}
    // We only support first 1-2 moves for now to keep it light.
    if (game.history.length > 4) return null; // Only opening

    const historyKey = game.history.map(m => `${m.from.x},${m.from.y}-${m.to.x},${m.to.y}`).join('|');

    const options = BOOK[historyKey];
    if (options && options.length > 0) {
        // Pick random
        const idx = Math.floor(Math.random() * options.length);
        return options[idx];
    }
    return null;
}

module.exports = getBookMove;
