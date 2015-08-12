// AI methods

/* Variables
    board
    current
    currentX
    currentY
*/

var NUM_WEIGHTS = 4;

// mutation probabilities
var MUTATE = 0.05;

// features
var TOTAL_HEIGHT = 0;
var SUM_HEIGHT_DIFFS = 1; //total difference between neighbouring columns
var LINES_CLEARED = 2;
var NUM_HOLES = 3;

var MIN_SCORE = -10000000;

var allWeights = [];
var weights = [-0.5177346300965753, -0.3354374424714595, 0.76, -0.18813470738957924];
var allFitness = Array.apply(null, Array(1000)).map(Number.prototype.valueOf,0);
var wCounter = 0;
var numGenerations = 10000;

var bestFitness = 0;
var bestWeights = [];


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
                    //console.log("SCORE " + score);
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

function normalizeWeights(ws) {
    var norm = 0;
    for (var i = 0; i < ws.length; i++) {
        norm += ws[i] * ws[i];
    }
    norm = Math.sqrt(norm);
    for (var i = 0; i < ws.length; i++) {
        ws[i] /= norm;
    }
    return ws;
}

function generateInitialWeights() {
    var rand = 0;
    for (var j = 0; j < 1000; j++) {
        var ws = [];
        for (var i = 0; i < NUM_WEIGHTS; i++) {
            rand = Math.random();
            ws.push(rand);
        }
        ws = normalizeWeights(ws);
        allWeights.push(ws);
    }
    
}

function crossover(alpha1, alpha2, fitness1, fitness2) {
    var offspring = [];
    for (var i=0; i<alpha1.length; i++) {
        offspring[i] = alpha1[i]*fitness1 + alpha2[i]*fitness2;
    }
    offspring = normalizeWeights(offspring);

    var rand = Math.random();
    if (rand < 0.05) {
        var index = Math.floor(Math.random() * alpha1.length);
        var change = Math.random() * 0.4 - 0.2;
        offspring[index] += change;
        offspring = normalizeWeights(offspring);
    }
    return offspring;
}

function generateChildren() {
    var newWeights = [];
    var nextGen = [];
    var alpha1Fitness = -1, alpha2Fitness = -1;
    var alpha1 = -1, alpha2 = -1;
    var rand;
    for (var cases = 0; cases < 300; cases++) {
        for (var i = 0; i < 100; i ++) {
            rand = Math.floor(Math.random()* 1000);
            if (allFitness[rand] > alpha1Fitness) {
                alpha2Fitness = alpha1Fitness;
                alpha1Fitness = allFitness[rand];
                alpha2 = alpha1;
                alpha1 = rand;
            }
            else if (allFitness[rand] > alpha2Fitness) {
                alpha2Fitness = allFitness[rand];
                alpha2 = rand;
            }
            offspring = crossover(allFitness[alpha1], allFitness[alpha2], alpha1Fitness, alpha2Fitness);
            nextGen.push(offspring);
        }
        alpha1Fitness = -1;
        alpha2Fitness = -1;
        alpha1 = -1;
        alpha2 = -1;
    }
    rand = Math.random();
    newWeights.push(allWeights[alpha1]);
    
    if (alpha2 != -1) {
        rand = Math.random();
        if (rand < COPY_ALPHA2) {
            newWeights.push(allWeights[alpha2]);
        }
        for (var cr = 0; cr < 4; cr++) {
            child = allWeights[alpha1].slice(0);
            for (var i=0; i<4; i++) {
                rand = Math.random();
                child[i] = allWeights[alpha1][i]*allFitness[alpha1] + allWeights[alpha2][i] * allFitness[alpha2];
                child[i] /= (allFitness[alpha1] + allFitness[alpha2]);
            }   
            newWeights.push(child);
        }
    }
    //console.log("NEW WEIGHTS" + newWeights);
    allWeights = newWeights;
    allFitness = Array.apply(null, Array(newWeights.length)).map(Number.prototype.valueOf,0);
}

function newGame() {
    clearInterval(interval);
    if (wCounter >= allWeights.length) {
        if (numGenerations == 0) {
            clearInterval(interval);
            return;
        }
        numGenerations--;
        generateChildren();
        wCounter = 0;
    }
    lines = 0;
    weights = allWeights[wCounter];
    //console.log(weights);   
    init();
    newShape();
    lose = false;

    interval = setInterval(tick, 40);
   
}

generateInitialWeights();
newGame();
