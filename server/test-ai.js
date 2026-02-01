const XiangqiGame = require('./game');
const AI = require('./ai');

function testAI() {
    console.log("Initializing Game...");
    const game = new XiangqiGame();

    // Simulate some moves to get out of opening (optional)
    // game.makeMove(...); 

    console.log("Testing AI Levels...");
    const levels = ['easy', 'normal', 'hard', 'extreme'];

    for (const level of levels) {
        console.log(`\n--- Level: ${level} ---`);
        const ai = new AI(level);
        const startTime = Date.now();

        try {
            const move = ai.getBestMove(game, 'red'); // Predict move for Red (first move)
            const duration = Date.now() - startTime;

            if (move) {
                console.log(`Move found: (${move.from.x},${move.from.y}) -> (${move.to.x},${move.to.y})`);
                console.log(`Time taken: ${duration}ms`);
            } else {
                console.log("No move found (Error?)");
            }
        } catch (e) {
            console.error("AI Error:", e);
        }
    }
}

testAI();
