const INITIAL_BOARD = [
    ['bro', 'bma', 'bel', 'bad', 'bge', 'bad', 'bel', 'bma', 'bro'],
    [null, null, null, null, null, null, null, null, null],
    [null, 'bca', null, null, null, null, null, 'bca', null],
    ['bso', null, 'bso', null, 'bso', null, 'bso', null, 'bso'],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    ['rso', null, 'rso', null, 'rso', null, 'rso', null, 'rso'],
    [null, 'rca', null, null, null, null, null, 'rca', null],
    [null, null, null, null, null, null, null, null, null],
    ['rro', 'rma', 'rel', 'rad', 'rge', 'rad', 'rel', 'rma', 'rro']
];

class XiangqiGame {
    constructor() {
        this.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        this.turn = 'red'; // Red moves first
        this.winner = null;
        this.history = [];

        // Timer settings (60 minutes in ms)
        this.timeLimit = 60 * 60 * 1000;
        this.timeLeft = {
            red: this.timeLimit,
            black: this.timeLimit
        };
        this.lastMoveTime = null; // Timestamp of the last move
    }

    // Call when the game actually starts (first move) or resumes
    startTimer() {
        this.lastMoveTime = Date.now();
    }

    // Deduct time for the current turn player
    // Returns true if time is left, false if timeout
    updateTimer() {
        if (!this.lastMoveTime) return true;

        const now = Date.now();
        const elapsed = now - this.lastMoveTime;

        this.timeLeft[this.turn] -= elapsed;
        this.lastMoveTime = now;

        if (this.timeLeft[this.turn] <= 0) {
            this.timeLeft[this.turn] = 0;
            return false; // Timeout
        }
        return true;
    }

    getPiece(x, y) {
        if (x < 0 || x > 8 || y < 0 || y > 9) return null;
        return this.board[y][x];
    }

    setPiece(x, y, piece) {
        this.board[y][x] = piece;
    }

    switchTurn() {
        this.turn = this.turn === 'red' ? 'black' : 'red';
    }

    isValidMove(fromX, fromY, toX, toY, color) {
        // Basic bounds check
        if (fromX < 0 || fromX > 8 || fromY < 0 || fromY > 9) return false;
        if (toX < 0 || toX > 8 || toY < 0 || toY > 9) return false;
        if (fromX === toX && fromY === toY) return false;

        const piece = this.getPiece(fromX, fromY);
        if (!piece) return false;

        // Check ownership
        const pieceColor = piece.charAt(0) === 'r' ? 'red' : 'black';
        if (pieceColor !== color) return false;

        // Check target (cannot capture own piece)
        const target = this.getPiece(toX, toY);
        if (target) {
            const targetColor = target.charAt(0) === 'r' ? 'red' : 'black';
            if (targetColor === color) return false;
        }

        // Piece-specific logic
        const type = piece.slice(1);
        const dx = toX - fromX;
        const dy = toY - fromY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        let valid = false;

        switch (type) {
            case 'ge': // General (King)
                // Orthogonal move 1 step
                if ((absDx === 1 && absDy === 0) || (absDx === 0 && absDy === 1)) {
                    // Must stay in palace
                    const inPalaceX = toX >= 3 && toX <= 5;
                    const inPalaceY = color === 'red' ? (toY >= 7 && toY <= 9) : (toY >= 0 && toY <= 2);
                    if (inPalaceX && inPalaceY) valid = true;
                }
                // "Flying General" rule: if generals face each other with no pieces between -> can capture? 
                // Usually implemented as "cannot make a move that leaves generals facing". 
                // Capturing the general directly is rarely a "move" since the game ends BEFORE that, but let's stick to movement rules first.
                break;

            case 'ad': // Advisor
                // Diagonal move 1 step
                if (absDx === 1 && absDy === 1) {
                    const inPalaceX = toX >= 3 && toX <= 5;
                    const inPalaceY = color === 'red' ? (toY >= 7 && toY <= 9) : (toY >= 0 && toY <= 2);
                    if (inPalaceX && inPalaceY) valid = true;
                }
                break;

            case 'el': // Elephant
                // Diagonal move 2 steps
                if (absDx === 2 && absDy === 2) {
                    // Cannot cross river
                    const crossedRiver = color === 'red' ? toY < 5 : toY > 4;
                    if (!crossedRiver) {
                        // Check for blocking "elephant eye"
                        const eyeX = fromX + dx / 2;
                        const eyeY = fromY + dy / 2;
                        if (!this.getPiece(eyeX, eyeY)) valid = true;
                    }
                }
                break;

            case 'ma': // Horse (Mao)
                // L-shape: 1 ortho + 1 diag (total 2 in one dir, 1 in other)
                if ((absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1)) {
                    // Check for blocking "horse leg"
                    // The leg is the adjacent intersection in the primary direction
                    const legX = absDx === 2 ? fromX + dx / 2 : fromX;
                    const legY = absDy === 2 ? fromY + dy / 2 : fromY;
                    if (!this.getPiece(legX, legY)) valid = true;
                }
                break;

            case 'ro': // Rook (Chariot)
                // Orthogonal, any distance
                if ((absDx > 0 && absDy === 0) || (absDx === 0 && absDy > 0)) {
                    // Check path is clear
                    if (this.isPathClear(fromX, fromY, toX, toY)) valid = true;
                }
                break;

            case 'ca': // Cannon
                // Move like rook if not capturing
                // Jump over ONE piece if capturing
                if ((absDx > 0 && absDy === 0) || (absDx === 0 && absDy > 0)) {
                    const count = this.countPiecesBetween(fromX, fromY, toX, toY);
                    if (!target) {
                        // Move: path must be clear
                        if (count === 0) valid = true;
                    } else {
                        // Capture: must jump exactly one piece (the screen)
                        if (count === 1) valid = true;
                    }
                }
                break;

            case 'so': // Soldier
                // Move forward 1 step.
                // If crossed river, can also move sideways 1 step.
                // Never backward.

                // Red moves UP (-y), Black moves DOWN (+y)
                const forward = color === 'red' ? -1 : 1;

                // Check forward move
                if (dx === 0 && dy === forward) {
                    valid = true;
                }
                // Check side move
                else if (absDx === 1 && dy === 0) {
                    const crossedRiver = color === 'red' ? fromY <= 4 : fromY >= 5;
                    if (crossedRiver) valid = true;
                }
                break;
        }

        return valid;
    }

    isPathClear(x1, y1, x2, y2) {
        return this.countPiecesBetween(x1, y1, x2, y2) === 0;
    }

    countPiecesBetween(x1, y1, x2, y2) {
        let count = 0;
        const dx = Math.sign(x2 - x1);
        const dy = Math.sign(y2 - y1);
        let x = x1 + dx;
        let y = y1 + dy;

        while (x !== x2 || y !== y2) {
            if (this.getPiece(x, y)) count++;
            x += dx;
            y += dy;
        }
        return count;
    }

    // Is the King of 'color' currently in check?
    isInCheck(color) {
        // Find King position
        let kx, ky;
        const kingType = color === 'red' ? 'rge' : 'bge'; // Red General / Black General

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                if (this.board[y][x] === kingType) {
                    kx = x;
                    ky = y;
                    break;
                }
            }
        }
        if (kx === undefined) return true; // Should not happen, but effectively lost

        // Check if any opponent piece can reach (kx, ky)
        // Simplified: iterate all enemy pieces and see if they can capture King
        const opponentColor = color === 'red' ? 'black' : 'red';
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const p = this.board[y][x];
                if (p && (p.startsWith(color === 'red' ? 'b' : 'r'))) {
                    // Check if this piece can capture king
                    // Note: We use basic move validation. 
                    // Special case: Flying General. 
                    // If p is the opposing General, validMove logic handles it? 
                    // Wait, validMove(General) limits it to palace. 
                    // Flying general is a special rule: Generarls cannot face each other on same file with no pieces.
                    if (this.isValidMove(x, y, kx, ky, opponentColor)) return true;
                }
            }
        }

        // Flying General Special Check:
        // If Kings are on same column with no pieces between -> Illegal state usually, 
        // but depending on whose turn it is, it might be a Check.
        // Actually, the player cannot MAKE a move that leaves Kings facing.
        // So this isInCheck is called AFTER a move to see if that move was legal (didn't expose own King) 
        // OR to see if it put enemy in check.
        // Let's implement explicitly:
        // Find other king
        let okx, oky;
        const otherKing = color === 'red' ? 'bge' : 'rge';
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                if (this.board[y][x] === otherKing) {
                    okx = x;
                    oky = y;
                    break;
                }
            }
        }

        if (kx === okx) {
            // Check pieces between
            if (this.countPiecesBetween(kx, ky, okx, oky) === 0) {
                return true; // Generals facing each other
            }
        }

        return false;
    }

    // Try a move to see if it leaves own King in check
    testMove(fromX, fromY, toX, toY, color) {
        const savedTarget = this.board[toY][toX];
        const savedSource = this.board[fromY][fromX];

        // Execute
        this.board[toY][toX] = savedSource;
        this.board[fromY][fromX] = null;

        const inCheck = this.isInCheck(color);

        // Revert
        this.board[fromY][fromX] = savedSource;
        this.board[toY][toX] = savedTarget;

        return !inCheck;
    }

    makeMove(fromX, fromY, toX, toY) {
        if (this.winner) return false;

        // 1. Basic Validation
        if (!this.isValidMove(fromX, fromY, toX, toY, this.turn)) return false;

        // 2. King Safety (Cannot expose self to check)
        if (!this.testMove(fromX, fromY, toX, toY, this.turn)) return false;

        // Execute Move
        const captured = this.board[toY][toX];
        this.board[toY][toX] = this.board[fromY][fromX];
        this.board[fromY][fromX] = null;
        this.history.push({ from: { x: fromX, y: fromY }, to: { x: toX, y: toY }, captured });

        // Check if Enemy is Checkmated (or Stalemated - in Xiangqi stalemate IS a loss usually? No, Stalemate is usually a draw or loss depending on rule set, but standard is Loss for the one who cannot move)
        // Switch turn first to check opponent's status
        const nextColor = this.turn === 'red' ? 'black' : 'red';

        // "Flying General" check happens in isInCheck

        this.switchTurn();

        // Check for Game Over (No legal moves for current player)
        // Check for Game Over (No legal moves for current player)
        if (!this.hasLegalMoves(this.turn)) {
            // The player who cannot move loses. The OTHER player wins.
            this.winner = this.turn === 'red' ? 'black' : 'red';
        }

        return true;
    }

    hasLegalMoves(color) {
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = this.board[y][x];
                if (piece && piece.startsWith(color === 'red' ? 'r' : 'b')) {
                    // Try all possible moves for this piece
                    // Optimization: We don't need all, just ONE valid move
                    // We can iterate board...
                    for (let ty = 0; ty < 10; ty++) {
                        for (let tx = 0; tx < 9; tx++) {
                            if (this.isValidMove(x, y, tx, ty, color)) {
                                if (this.testMove(x, y, tx, ty, color)) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
}

module.exports = XiangqiGame;
