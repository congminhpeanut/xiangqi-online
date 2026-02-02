const XiangqiGame = require('./game');
const AI = require('./ai');

// Test AI for BLACK player (as server calls it)
console.log("=== Test AI for Black Player (HARD MODE) ===\n");

const game = new XiangqiGame();

// First make a Red move to create realistic scenario
console.log("Making initial Red move...");
game.makeMove(0, 9, 0, 8); // Red Chariot moves forward

console.log("Current turn:", game.turn);
console.log("Testing Hard mode...\n");

const ai = new AI('hard');
const move = ai.getBestMove(game, 'black', 4000);

if (move) {
    console.log(`\n=== SUCCESS ===`);
    console.log(`AI Move: (${move.from.x},${move.from.y}) -> (${move.to.x},${move.to.y})`);

    // Verify move is valid
    const piece = game.board[move.from.y][move.from.x];
    console.log(`Piece at from: ${piece}`);
} else {
    console.log("\n=== FAIL ===");
    console.log("No move returned!");
}
