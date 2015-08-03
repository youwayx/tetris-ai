// AI methods

/* Variables
    board
    current
    currentX
    currentY
*/
weights = [2, 9];

var COLS = 10;
var ROWS = 20;
console.log(ROWS + " " + COLS);
function movePiece() {
    var minScore = 100000000;
    var score = 0;
    var bestX = 0, bestY = 0;
    var lastY;
    for (var i = 0; i < COLS; i++) {
        lastY = -1;
        for (var j = currentY; j < ROWS; j++) {
            if (!valid(i-currentX, j-currentY)) {
                console.log("COL" + i);
                console.log("ROW" + j);
                if (j == 0) {
                    break;
                }
                score = getBoardScore(i, lastY);
                console.log("SCORE " + score);
                if (score < minScore) {
                    minScore = score;
                    bestX = i;
                    bestY = lastY;
                }
            }
            lastY = j;
        }
    }
    currentX = bestX;
    currentY = bestY;
    
}

function addPieceToAI(realX, realY) {
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( current[ y ][ x ] ) {
                boardAI[ y + realY ][ x + realX ] = current[ y ][ x ];
            }
        }
    }
}
function removePieceFromAI(realX, realY) {
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( current[ y ][ x ] ) {
                boardAI[ y + realY ][ x + realX ] = 0;
            }
        }
    }
}
function getBoardScore(x, y) {
    addPieceToAI(x, y);
    var score = 0;
    var lastBlock = -1;
    var lastHeight = -1;

    for (var i = 0; i < COLS; i++) {
        for (var j = 0; j < ROWS; j++) {
            // punish bigger block holes later
            if (lastBlock > 0 && boardAI[j][i] == 0) {
                lastBlock = boardAI[j][i];
                score += weights[1];
            }

            if (lastHeight >=0) {
                score += weights[0] * abs(lastHeight - (ROWS - j - 1))
                lastHeight = ROWS - j - 1;
            }
        }
    }
    removePieceFromAI(x, y);
    return score;
}
