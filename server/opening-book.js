// server/opening-book.js
// Deep Opening Book for Xiangqi - 15+ plies for professional lines
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
        { move: { from: { x: 7, y: 7 }, to: { x: 4, y: 7 } }, weight: 45 }, // Central Cannon (Right)
        { move: { from: { x: 1, y: 7 }, to: { x: 4, y: 7 } }, weight: 25 }, // Central Cannon (Left)
        { move: { from: { x: 2, y: 9 }, to: { x: 4, y: 7 } }, weight: 15 }, // Elephant to Center
        { move: { from: { x: 6, y: 9 }, to: { x: 4, y: 7 } }, weight: 10 }, // Elephant (Left)
        { move: { from: { x: 2, y: 6 }, to: { x: 2, y: 5 } }, weight: 3 },  // Pawn 3
        { move: { from: { x: 6, y: 6 }, to: { x: 6, y: 5 } }, weight: 2 }   // Pawn 7
    ],

    // =========================================================================
    // === 1. CENTRAL CANNON (RIGHT) vs SCREEN HORSE DEFENSE (15+ plies) ===
    // =========================================================================

    // Red: Central Cannon
    "7,7-4,7": [
        { move: { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } }, weight: 60 }, // Screen Horse (Standard)
        { move: { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } }, weight: 10 }, // Left Screen Horse
        { move: { from: { x: 7, y: 2 }, to: { x: 4, y: 2 } }, weight: 15 }, // Same Direction Cannon
        { move: { from: { x: 1, y: 2 }, to: { x: 4, y: 2 } }, weight: 15 }, // Opposite Direction Cannon
    ],

    // Ply 2: Red Central Cannon -> Black Right Screen Horse
    "7,7-4,7|7,0-6,2": [
        { move: { from: { x: 7, y: 9 }, to: { x: 6, y: 7 } }, weight: 80 }, // Red Right Horse out
        { move: { from: { x: 1, y: 9 }, to: { x: 2, y: 7 } }, weight: 10 }, // Red Left Horse
        { move: { from: { x: 8, y: 9 }, to: { x: 8, y: 8 } }, weight: 10 }, // Red Rook patrol
    ],

    // Ply 3: Black completes Screen Horse defense
    "7,7-4,7|7,0-6,2|7,9-6,7": [
        { move: { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } }, weight: 80 }, // Full Screen Horses
        { move: { from: { x: 8, y: 0 }, to: { x: 8, y: 1 } }, weight: 15 }, // Rook out
        { move: { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, weight: 5 },  // Central Pawn
    ],

    // Ply 4: Red develops Rook
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2": [
        { move: { from: { x: 8, y: 9 }, to: { x: 8, y: 8 } }, weight: 50 }, // Rook patrol
        { move: { from: { x: 4, y: 6 }, to: { x: 4, y: 5 } }, weight: 30 }, // Central Pawn
        { move: { from: { x: 6, y: 6 }, to: { x: 6, y: 5 } }, weight: 20 }, // 7th Pawn
    ],

    // Ply 5: Black responds with Rook
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8": [
        { move: { from: { x: 8, y: 0 }, to: { x: 8, y: 1 } }, weight: 60 }, // Black Rook match
        { move: { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, weight: 30 }, // Central Pawn advance
        { move: { from: { x: 0, y: 0 }, to: { x: 0, y: 1 } }, weight: 10 }, // Left Rook out
    ],

    // Ply 6: Red activates second Horse
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1": [
        { move: { from: { x: 1, y: 9 }, to: { x: 2, y: 7 } }, weight: 60 }, // Left Horse out
        { move: { from: { x: 8, y: 8 }, to: { x: 4, y: 8 } }, weight: 25 }, // Rook to center file
        { move: { from: { x: 4, y: 6 }, to: { x: 4, y: 5 } }, weight: 15 }, // Central Pawn
    ],

    // Ply 7: Black develops
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1|1,9-2,7": [
        { move: { from: { x: 8, y: 1 }, to: { x: 4, y: 1 } }, weight: 50 }, // Rook swing
        { move: { from: { x: 0, y: 0 }, to: { x: 0, y: 1 } }, weight: 30 }, // Other Rook
        { move: { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, weight: 20 }, // Pawn
    ],

    // Ply 8: Red advances center pawn
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1|1,9-2,7|8,1-4,1": [
        { move: { from: { x: 4, y: 6 }, to: { x: 4, y: 5 } }, weight: 60 }, // Central Pawn advance
        { move: { from: { x: 8, y: 8 }, to: { x: 8, y: 4 } }, weight: 30 }, // Rook forward
        { move: { from: { x: 6, y: 9 }, to: { x: 4, y: 7 } }, weight: 10 }, // Elephant
    ],

    // Ply 9: Black counters
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1|1,9-2,7|8,1-4,1|4,6-4,5": [
        { move: { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, weight: 50 }, // Pawn contest
        { move: { from: { x: 4, y: 1 }, to: { x: 4, y: 4 } }, weight: 30 }, // Rook captures
        { move: { from: { x: 7, y: 2 }, to: { x: 7, y: 4 } }, weight: 20 }, // Cannon repositions
    ],

    // Ply 10: Standard continuation
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1|1,9-2,7|8,1-4,1|4,6-4,5|4,3-4,4": [
        { move: { from: { x: 4, y: 5 }, to: { x: 4, y: 4 } }, weight: 50 }, // Pawn takes
        { move: { from: { x: 8, y: 8 }, to: { x: 4, y: 8 } }, weight: 30 }, // Rook centralize
        { move: { from: { x: 2, y: 7 }, to: { x: 3, y: 5 } }, weight: 20 }, // Horse jump
    ],

    // Ply 11
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1|1,9-2,7|8,1-4,1|4,6-4,5|4,3-4,4|4,5-4,4": [
        { move: { from: { x: 4, y: 1 }, to: { x: 4, y: 4 } }, weight: 60 }, // Rook recaptures
        { move: { from: { x: 2, y: 2 }, to: { x: 3, y: 4 } }, weight: 40 }, // Horse central
    ],

    // Ply 12
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1|1,9-2,7|8,1-4,1|4,6-4,5|4,3-4,4|4,5-4,4|4,1-4,4": [
        { move: { from: { x: 8, y: 8 }, to: { x: 4, y: 8 } }, weight: 50 }, // Rook to center
        { move: { from: { x: 6, y: 7 }, to: { x: 4, y: 6 } }, weight: 30 }, // Horse attacks
        { move: { from: { x: 2, y: 7 }, to: { x: 4, y: 6 } }, weight: 20 }, // Other Horse
    ],

    // Ply 13
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1|1,9-2,7|8,1-4,1|4,6-4,5|4,3-4,4|4,5-4,4|4,1-4,4|8,8-4,8": [
        { move: { from: { x: 6, y: 2 }, to: { x: 4, y: 3 } }, weight: 50 }, // Black Horse jumps in
        { move: { from: { x: 4, y: 4 }, to: { x: 4, y: 5 } }, weight: 30 }, // Rook retreats
        { move: { from: { x: 7, y: 2 }, to: { x: 4, y: 2 } }, weight: 20 }, // Cannon centralizes
    ],

    // Ply 14
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1|1,9-2,7|8,1-4,1|4,6-4,5|4,3-4,4|4,5-4,4|4,1-4,4|8,8-4,8|6,2-4,3": [
        { move: { from: { x: 6, y: 7 }, to: { x: 5, y: 5 } }, weight: 60 }, // Red Horse to strong square
        { move: { from: { x: 4, y: 7 }, to: { x: 4, y: 4 } }, weight: 40 }, // Cannon takes
    ],

    // Ply 15
    "7,7-4,7|7,0-6,2|7,9-6,7|1,0-2,2|8,9-8,8|8,0-8,1|1,9-2,7|8,1-4,1|4,6-4,5|4,3-4,4|4,5-4,4|4,1-4,4|8,8-4,8|6,2-4,3|6,7-5,5": [
        { move: { from: { x: 4, y: 3 }, to: { x: 3, y: 5 } }, weight: 50 }, // Black Horse jumps
        { move: { from: { x: 2, y: 2 }, to: { x: 4, y: 3 } }, weight: 30 }, // Other Horse
        { move: { from: { x: 0, y: 0 }, to: { x: 0, y: 2 } }, weight: 20 }, // Rook development
    ],

    // =========================================================================
    // === 2. ELEPHANT OPENING vs CENTRAL CANNON (15+ plies) ===
    // =========================================================================

    // Red: Elephant Opening
    "2,9-4,7": [
        { move: { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, weight: 50 }, // Central Pawn challenge
        { move: { from: { x: 1, y: 2 }, to: { x: 4, y: 2 } }, weight: 30 }, // Black Central Cannon
        { move: { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } }, weight: 20 }, // Screen Horse development
    ],

    // Ply 2: Black Central Cannon response
    "2,9-4,7|1,2-4,2": [
        { move: { from: { x: 7, y: 9 }, to: { x: 6, y: 7 } }, weight: 60 }, // Red Horse develops
        { move: { from: { x: 6, y: 9 }, to: { x: 4, y: 7 } }, weight: 40 }, // Double Elephant
    ],

    // Ply 3
    "2,9-4,7|1,2-4,2|7,9-6,7": [
        { move: { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } }, weight: 60 }, // Black Horse
        { move: { from: { x: 8, y: 0 }, to: { x: 8, y: 1 } }, weight: 40 }, // Black Rook
    ],

    // Ply 4
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2": [
        { move: { from: { x: 1, y: 9 }, to: { x: 2, y: 7 } }, weight: 50 }, // Red other Horse
        { move: { from: { x: 8, y: 9 }, to: { x: 8, y: 8 } }, weight: 50 }, // Red Rook patrol
    ],

    // Ply 5
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8": [
        { move: { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } }, weight: 50 }, // Full Screen Horses
        { move: { from: { x: 8, y: 0 }, to: { x: 8, y: 1 } }, weight: 50 }, // Rook out
    ],

    // Ply 6
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2": [
        { move: { from: { x: 6, y: 9 }, to: { x: 4, y: 7 } }, weight: 50 }, // Double Elephant solid
        { move: { from: { x: 1, y: 9 }, to: { x: 2, y: 7 } }, weight: 50 }, // Other Horse out
    ],

    // Ply 7
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|6,9-4,7": [
        { move: { from: { x: 8, y: 0 }, to: { x: 8, y: 2 } }, weight: 60 }, // Rook to 3rd rank
        { move: { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, weight: 40 }, // Central Pawn push
    ],

    // Ply 8
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|6,9-4,7|8,0-8,2": [
        { move: { from: { x: 8, y: 8 }, to: { x: 8, y: 2 } }, weight: 60 }, // Rook trade offer
        { move: { from: { x: 4, y: 6 }, to: { x: 4, y: 5 } }, weight: 40 }, // Central Pawn
    ],

    // Ply 9
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|6,9-4,7|8,0-8,2|8,8-8,2": [
        { move: { from: { x: 0, y: 0 }, to: { x: 0, y: 1 } }, weight: 50 }, // Black left Rook activates
        { move: { from: { x: 4, y: 2 }, to: { x: 4, y: 5 } }, weight: 50 }, // Cannon pressure
    ],

    // Ply 10
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|6,9-4,7|8,0-8,2|8,8-8,2|0,0-0,1": [
        { move: { from: { x: 0, y: 9 }, to: { x: 0, y: 8 } }, weight: 60 }, // Red Rook activates
        { move: { from: { x: 1, y: 9 }, to: { x: 2, y: 7 } }, weight: 40 }, // Horse development
    ],

    // Ply 11
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|6,9-4,7|8,0-8,2|8,8-8,2|0,0-0,1|0,9-0,8": [
        { move: { from: { x: 0, y: 1 }, to: { x: 4, y: 1 } }, weight: 60 }, // Black Rook swing
        { move: { from: { x: 6, y: 2 }, to: { x: 4, y: 3 } }, weight: 40 }, // Horse central
    ],

    // Ply 12
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|6,9-4,7|8,0-8,2|8,8-8,2|0,0-0,1|0,9-0,8|0,1-4,1": [
        { move: { from: { x: 0, y: 8 }, to: { x: 4, y: 8 } }, weight: 60 }, // Red Rook center
        { move: { from: { x: 1, y: 9 }, to: { x: 2, y: 7 } }, weight: 40 }, // Horse out
    ],

    // Ply 13
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|6,9-4,7|8,0-8,2|8,8-8,2|0,0-0,1|0,9-0,8|0,1-4,1|0,8-4,8": [
        { move: { from: { x: 2, y: 2 }, to: { x: 4, y: 3 } }, weight: 60 }, // Horse invasion
        { move: { from: { x: 4, y: 2 }, to: { x: 7, y: 2 } }, weight: 40 }, // Cannon repositions
    ],

    // Ply 14
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|6,9-4,7|8,0-8,2|8,8-8,2|0,0-0,1|0,9-0,8|0,1-4,1|0,8-4,8|2,2-4,3": [
        { move: { from: { x: 6, y: 7 }, to: { x: 4, y: 6 } }, weight: 60 }, // Red Horse counter-attacks
        { move: { from: { x: 7, y: 7 }, to: { x: 7, y: 4 } }, weight: 40 }, // Cannon forward
    ],

    // Ply 15
    "2,9-4,7|1,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|6,9-4,7|8,0-8,2|8,8-8,2|0,0-0,1|0,9-0,8|0,1-4,1|0,8-4,8|2,2-4,3|6,7-4,6": [
        { move: { from: { x: 4, y: 3 }, to: { x: 2, y: 4 } }, weight: 50 }, // Horse jumps
        { move: { from: { x: 4, y: 1 }, to: { x: 4, y: 4 } }, weight: 50 }, // Rook attacks
    ],

    // =========================================================================
    // === 3. SAME DIRECTION CANNONS (Aggressive Counter) (15+ plies) ===
    // =========================================================================

    // Red Central Cannon -> Black Same Direction Cannon
    "7,7-4,7|7,2-4,2": [
        { move: { from: { x: 7, y: 9 }, to: { x: 6, y: 7 } }, weight: 100 }, // Red Horse essential
    ],

    // Ply 3
    "7,7-4,7|7,2-4,2|7,9-6,7": [
        { move: { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } }, weight: 60 }, // Black Horse
        { move: { from: { x: 8, y: 0 }, to: { x: 8, y: 1 } }, weight: 40 }, // Black Rook
    ],

    // Ply 4
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2": [
        { move: { from: { x: 1, y: 9 }, to: { x: 2, y: 7 } }, weight: 50 }, // Red Horse
        { move: { from: { x: 8, y: 9 }, to: { x: 8, y: 8 } }, weight: 50 }, // Red Rook
    ],

    // Ply 5
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8": [
        { move: { from: { x: 1, y: 0 }, to: { x: 2, y: 2 } }, weight: 60 }, // Screen Horses
        { move: { from: { x: 8, y: 0 }, to: { x: 8, y: 1 } }, weight: 40 }, // Rook
    ],

    // Ply 6
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2": [
        { move: { from: { x: 8, y: 8 }, to: { x: 4, y: 8 } }, weight: 60 }, // Rook swing center
        { move: { from: { x: 1, y: 9 }, to: { x: 2, y: 7 } }, weight: 40 }, // Horse
    ],

    // Ply 7
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|8,8-4,8": [
        { move: { from: { x: 8, y: 0 }, to: { x: 8, y: 2 } }, weight: 60 }, // Black Rook 3rd rank
        { move: { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, weight: 40 }, // Pawn
    ],

    // Ply 8
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|8,8-4,8|8,0-8,2": [
        { move: { from: { x: 4, y: 6 }, to: { x: 4, y: 5 } }, weight: 60 }, // Central Pawn
        { move: { from: { x: 1, y: 9 }, to: { x: 2, y: 7 } }, weight: 40 }, // Horse
    ],

    // Ply 9
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|8,8-4,8|8,0-8,2|4,6-4,5": [
        { move: { from: { x: 4, y: 3 }, to: { x: 4, y: 4 } }, weight: 50 }, // Pawn contest
        { move: { from: { x: 8, y: 2 }, to: { x: 4, y: 2 } }, weight: 50 }, // Rook attack cannon
    ],

    // Ply 10
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|8,8-4,8|8,0-8,2|4,6-4,5|4,3-4,4": [
        { move: { from: { x: 4, y: 5 }, to: { x: 4, y: 4 } }, weight: 60 }, // Pawn takes
        { move: { from: { x: 6, y: 7 }, to: { x: 4, y: 6 } }, weight: 40 }, // Horse attacks
    ],

    // Ply 11
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|8,8-4,8|8,0-8,2|4,6-4,5|4,3-4,4|4,5-4,4": [
        { move: { from: { x: 4, y: 2 }, to: { x: 4, y: 4 } }, weight: 70 }, // Cannon takes pawn
        { move: { from: { x: 8, y: 2 }, to: { x: 4, y: 2 } }, weight: 30 }, // Rook swings
    ],

    // Ply 12
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|8,8-4,8|8,0-8,2|4,6-4,5|4,3-4,4|4,5-4,4|4,2-4,4": [
        { move: { from: { x: 4, y: 7 }, to: { x: 4, y: 4 } }, weight: 60 }, // Red Cannon exchange
        { move: { from: { x: 4, y: 8 }, to: { x: 4, y: 4 } }, weight: 40 }, // Rook takes
    ],

    // Ply 13
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|8,8-4,8|8,0-8,2|4,6-4,5|4,3-4,4|4,5-4,4|4,2-4,4|4,7-4,4": [
        { move: { from: { x: 8, y: 2 }, to: { x: 4, y: 2 } }, weight: 60 }, // Rook centralize
        { move: { from: { x: 6, y: 2 }, to: { x: 4, y: 3 } }, weight: 40 }, // Horse jump
    ],

    // Ply 14
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|8,8-4,8|8,0-8,2|4,6-4,5|4,3-4,4|4,5-4,4|4,2-4,4|4,7-4,4|8,2-4,2": [
        { move: { from: { x: 4, y: 8 }, to: { x: 4, y: 2 } }, weight: 60 }, // Red Rook trade
        { move: { from: { x: 6, y: 7 }, to: { x: 5, y: 5 } }, weight: 40 }, // Horse invasion
    ],

    // Ply 15
    "7,7-4,7|7,2-4,2|7,9-6,7|7,0-6,2|8,9-8,8|1,0-2,2|8,8-4,8|8,0-8,2|4,6-4,5|4,3-4,4|4,5-4,4|4,2-4,4|4,7-4,4|8,2-4,2|4,8-4,2": [
        { move: { from: { x: 6, y: 2 }, to: { x: 5, y: 4 } }, weight: 50 }, // Horse forward
        { move: { from: { x: 2, y: 2 }, to: { x: 4, y: 3 } }, weight: 50 }, // Other Horse
    ],

    // === PAWN OPENING (supplement) ===
    "2,6-2,5": [
        { move: { from: { x: 7, y: 2 }, to: { x: 4, y: 2 } }, weight: 50 }, // Central Cannon
        { move: { from: { x: 2, y: 3 }, to: { x: 2, y: 4 } }, weight: 40 }, // Parallel Pawn
        { move: { from: { x: 7, y: 0 }, to: { x: 6, y: 2 } }, weight: 10 }, // Screen Horse
    ]
};

function getBookMove(game) {
    // Use book for first 20 plies (10 moves each) - deep professional theory
    if (game.history.length > 20) return null;

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
