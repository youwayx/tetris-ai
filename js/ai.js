// AI methods

/* Variables
    board
    current
    currentX
    currentY
*/


var NUM_WEIGHTS = 5;

// mutation probabilities
var MUTATE = 0.05;

// features
var TOTAL_HEIGHT = 0;
var SUM_HEIGHT_DIFFS = 1; //total difference between neighbouring columns
var LINES_CLEARED = 2;
var NUM_HOLES = 3;
var BARRIER_HEIGHT = 4;

var MIN_SCORE = -10000000;
var NUM_GENERATIONS = 1000;
var POPULATION_SIZE = 1000;

var allWeights = [];
var allFitness = Array.apply(null, Array(POPULATION_SIZE)).map(Number.prototype.valueOf,0);

var AI = function (allWeights, allFitness) {
    this.allWeights = allWeights;
    this.allFitness = allFitness;
    this.bestWeights = [];
    this.bestFitness = 0;

    this.count = 0;
}

AI.prototype.movePiece = function() {
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
                    score = this.getBoardScore(i, j-1, newCurrent);
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
        for (var i=0; i<rotations ;i++) {
            current = rotate(current);
        }
        currentX = bestX;
        currentY = bestY;
    }
    
    
}

AI.prototype.addPieceToAI = function(realX, realY, newCurrent) {
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

AI.prototype.removePieceFromAI = function(realX, realY, newCurrent) {
    for ( var y = 0; y < 4; ++y ) {
        for ( var x = 0; x < 4; ++x ) {
            if ( newCurrent[ y ][ x ] ) {
                boardAI[ y + realY ][ x + realX ] = 0;
            }
        }
    }
}

AI.prototype.getBoardScore = function(x, y, newCurrent) {
    if (!this.addPieceToAI(x, y, newCurrent)) {
        return MIN_SCORE
    }

    var score = 0;
    var heights = Array.apply(null, Array(COLS)).map(Number.prototype.valueOf,0);
    var maxHeight = 0;

    var scores = Array.apply(null, Array(NUM_WEIGHTS)).map(Number.prototype.valueOf,0);

    for (var i = 0; i < COLS; i++) {
        var lastBlock = -1;
        var heightFound = false;
        var containsBlock = false;
        var numBlocks = 0;
        var foundBarrier = false;
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
                if (!foundBarrier) {
                    scores[BARRIER_HEIGHT] += numBlocks;
                    foundBarrier = true;
                }
            }
            
            lastBlock = boardAI[j][i];
            if (lastBlock > 0) {
                containsBlock = true;
                numBlocks++;
            }
        }
        
    }
    var linesCleared = 0;
    for (var j = 0; j < ROWS; j++) {
        var lineCleared = true;
        for (var i = 0; i < COLS; i++) {
            if (boardAI[j][i] == 0) {
                lineCleared = false;
            }
            break;
        }
        if (lineCleared) {
            linesCleared++;
        }
    }
    scores[LINES_CLEARED] = linesCleared * linesCleared;
    
    for (var c = 0; c < COLS; c++) {
        scores[TOTAL_HEIGHT] += heights[c];
        if (c != COLS -1) {
            scores[SUM_HEIGHT_DIFFS] += Math.abs(heights[c] - heights[c+1]);
        }
    }

    for (var i = 0; i < NUM_WEIGHTS; i++) {
        score += scores[i] * this.allWeights[this.count][i];
    }

    this.removePieceFromAI(x, y, newCurrent);
    return score;
}

AI.prototype.insert = function(lines) {
    this.allFitness[this.count] = lines;
    for (var i = this.count-1; i>=0; i--) {
        if (lines < this.allFitness[i]) {
            var tempFitness = this.allFitness[i];
            var tempWeights = this.allWeights[i];
            this.allWeights[i] = this.allWeights[i+1];
            this.allFitness[i] = lines;
            this.allWeights[i+1] = tempWeights;
            this.allFitness[i+1] = tempFitness;
        }
    }
    this.count ++;
}

AI.prototype.normalizeWeights = function(ws) {
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

AI.prototype.generateInitialWeights = function() {
    var rand = 0;
    for (var j = 0; j < POPULATION_SIZE; j++) {
        var ws = [];
        for (var i = 0; i < NUM_WEIGHTS; i++) {
            rand = Math.random() * 2 - 1;
            ws[i] = rand;
        }
        ws = this.normalizeWeights(ws);
        this.allWeights[j] = ws;
    }
    
}

AI.prototype.crossover = function(alpha1, alpha2, fitness1, fitness2) {
    var offspring = [];
    for (var i=0; i<alpha1.length; i++) {
        offspring[i] = alpha1[i]*fitness1 + alpha2[i]*fitness2;
    }
    offspring = this.normalizeWeights(offspring);

    var rand = Math.random();
    if (rand < 0.05) {
        var index = Math.floor(Math.random() * alpha1.length);
        var change = Math.random() * 0.4 - 0.2;
        offspring[index] += change;
        offspring = this.normalizeWeights(offspring);
    }
    return offspring;
}

AI.prototype.generateChildren = function() {
    var nextGen = [];
    var alpha1Fitness = -1, alpha2Fitness = -1;
    var alpha1 = -1, alpha2 = -1;
    var rand;
    for (var j = 0; j < 300; j++) {
        for (var i = 0; i < 100; i ++) {
            rand = Math.floor(Math.random()* POPULATION_SIZE);
            if (this.allFitness[rand] > alpha1Fitness) {
                alpha2Fitness = alpha1Fitness;
                alpha1Fitness = this.allFitness[rand];
                alpha2 = alpha1;
                alpha1 = rand;
            }
            else if (this.allFitness[rand] > alpha2Fitness) {
                alpha2Fitness = this.allFitness[rand];
                alpha2 = rand;
            }
        }
        offspring = this.crossover(this.allWeights[alpha1], this.allWeights[alpha2], 
                                   alpha1Fitness, alpha2Fitness);
        nextGen[j] = offspring;
        alpha1Fitness = -1;
        alpha2Fitness = -1;
        alpha1 = -1;
        alpha2 = -1;
    }
    this.allWeights = this.allWeights.slice(300);
    this.allWeights = this.allWeights.concat(nextGen);
    this.allFitness = Array.apply(null, Array(allWeights.length)).map(Number.prototype.valueOf,0);
}

function newGame(ai) {
    if (ai.count >= ai.allWeights.length) {
        if (NUM_GENERATIONS == 0) {
            clearInterval(interval);
            return;
        }
        NUM_GENERATIONS--;
        ai.generateChildren();
        ai.count = 0;
    }
    lines = 0;
    init();
    newShape(ai);
    lose = false;

    interval = setInterval(function() { tick(ai); }, 1);
    return;
}

var ai = new AI(allWeights, allFitness);
ai.generateInitialWeights();
newGame(ai);
