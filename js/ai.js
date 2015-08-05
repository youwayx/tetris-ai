// AI methods

/* Variables
    board
    current
    currentX
    currentY
*/


// mutation probabilities
var MUTATE_ALPHA1 = .1;
var MUTATE_ALPHA2 = .2;
var COPY_ALPHA1 = .6;
var COPY_ALPHA2 = .5;
var CROSSOVER = .6;

// features
var TOTAL_HEIGHT = 0;
var SUM_HEIGHT_DIFFS = 1; //total difference between neighbouring columns
var LINES_CLEARED = 2;
var NUM_HOLES = 3;

var MIN_SCORE = -10000000;

var allWeights = [[-0.51, -0.356, 0.76, -0.184]];
var weights = [-0.51, -0.356, 0.76, -0.184];
var allFitness = [0];


function movePiece() {
    var maxScore = MIN_SCORE
    var score = 0;
    var bestX = 0, bestY = 0;
    var rotations = 0;
    var newCurrent = current.slice(0);
    for (var k = 1; k <= 4; k++) {
        newCurrent = rotate(newCurrent);
        for (var i = 0; i < COLS; i++) {
            for (var j = currentY + 1; j < ROWS; j++) {
                if (!valid(i-currentX, j-currentY, newCurrent)) {
                    if (j-1 <=0) {
                        break;
                    }
                    //console.log("COL" + i);
                    //console.log("ROW" + (j-1));
                    score = getBoardScore(i, j-1, newCurrent);
                    console.log("SCORE " + score);
                    if (score > maxScore) {
                        maxScore = score;
                        bestX = i;
                        bestY = j-1;
                        rotations = k;
                    }
                    break;
                }
            }
        }
    }

    if (maxScore == MIN_SCORE) {
        gameOver();
    }
    else {
        // console.log("current "+current);
        // console.log("before X+Y " + currentX + " " + currentY);
        // for (var i=0; i<ROWS; i++) {
        //     console.log("board: " + board[i]);
        // }
        for (var i=0; i<rotations ;i++) {
            current = rotate(current);
        }
        currentX = bestX;
        currentY = bestY;
        // console.log("after X+Y " + currentX + " " + currentY);
    }
    
    
}

function addPieceToAI(realX, realY, newCurrent) {
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( newCurrent[ y ][ x ] ) {
                if (boardAI[ y + realY ][ x + realX ] > 0) {
                    return false;
                }
                boardAI[ y + realY ][ x + realX ] = newCurrent[ y ][ x ];
            }
        }
    }
    return true;
}

function removePieceFromAI(realX, realY, newCurrent) {
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( newCurrent[ y ][ x ] ) {
                boardAI[ y + realY ][ x + realX ] = 0;
            }
        }
    }
}

function getBoardScore(x, y, newCurrent) {
    if (!addPieceToAI(x, y, newCurrent)) {
        return MIN_SCORE
    }

    var score = 0;
    var heights = Array.apply(null, Array(COLS)).map(Number.prototype.valueOf,0);
    var maxHeight = 0;

    var scores = [0,0,0,0];

    for (var i = 0; i < COLS; i++) {
        var lastBlock = -1;
        var heightFound = false;
        var containsBlock = false;
        for (var j = 0; j < ROWS; j++) {
            if (lastBlock == 0 && boardAI[j][i] > 0 && !heightFound) {
                height = ROWS - j;
                heights[i] = height;
                heightFound = true;

                if (heights[i] > maxHeight) {
                    maxHeight = heights[i];
                }
            }

            if (containsBlock && boardAI[j][i] == 0) {
                scores[NUM_HOLES] ++;
            }
            
            lastBlock = boardAI[j][i];
            if (lastBlock > 0) {
                containsBlock = true;
            }
        }
        
    }
    for (var j = 0; j < ROWS; j++) {
        var lineCleared = true;
        for (var i = 0; i < COLS; i++) {
            if (boardAI[j][i] == 0) {
                lineCleared = false;
            }
            break;
        }
        if (lineCleared) {
            scores[LINES_CLEARED]++;
        }
    }
    for (var c = 0; c < COLS; c++) {
        scores[TOTAL_HEIGHT] += heights[c];
        if (c != COLS -1) {
            scores[SUM_HEIGHT_DIFFS] += Math.abs(heights[c] - heights[c+1]);
        }
    }

    for (var i = 0; i < 4; i++) {
        score += scores[i] * weights[i];
    }
    //console.log("maxHeight: "+maxHeight)
    //console.log(heights);
    removePieceFromAI(x, y, newCurrent);
    return score;
}

function generateChildren() {
    var newWeights = []
    var alpha1Fitness = -1, alpha2Fitness = -1;
    var alpha1 = -1, alpha2 = -1;
    for (var i = 0; i < allFitness.length; i++) {
        if (allFitness[i] > alpha1Fitness) {
            alpha2Fitness = alpha1Fitness;
            alpha1Fitness = allFitness[i];
            alpha2 = alpha1;
            alpha1 = i;
        }
        else if (allFitness[i] > alpha2Fitness) {
            alpha2Fitness = allFitness[i];
            alpha2 = i;
        }
    }
    var rand = Math.random();
    var child;
    for (var i = 0; i < 4; i++) {
        rand = Math.random();
        if (rand < MUTATE_ALPHA1) {
            child = allWeights[alpha1].splice(0);
            child[i] *= 9/10;
            newWeights.push(child);
            child = allWeights[alpha1].splice(0);
            child[i] *= 11/10;
            newWeights.push(child);
        }
        rand = Math.random();
        if (alpha2!=-1 && rand < MUTATE_ALPHA2) {
            child = allWeights[alpha2].splice(0);
            child[i] *= 9/10;
            newWeights.push(child);
            child = allWeights[alpha2].splice(0);
            child[i] *= 11/10;
            newWeights.push(child);
        }
    }

    rand = Math.random();
    if (rand < MUTATE_ALPHA1) {
        newWeights.push(allWeights[alpha1]);
    }
    
    if (alpha2 != -1) {
        rand = Math.random();
        if (rand < MUTATE_ALPHA2) {
            newWeights.push(allWeights[alpha2]);
        }
        for (var i=0; i<4; i++) {
            child = allWeights[alpha1].splice(0);
            rand = Math.random();
            if (rand > CROSSOVER) {
                child[i] = allWeights[alpha2][i];
            }
        }   
    }
    newWeights.push(child);
    allWeights = newWeights;
    allFitness = [];
}

for (var i=0; i<2; i++) {
    generateChildren();
    console.log("ALLWEIGHTS " + allWeights);
    for (var j = 0; j < allWeights.length; j++) {
        weights = allWeights[j];
        newGame();
    }
    
}
