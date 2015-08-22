// AI methods

/* Variables
    board
    current
    currentX
    currentY
*/

/*  BEST WEIGHTS

    ws1 = [[0.34924694669437517, 0.5803650995173933, -0.6909010796575941, -0.2527026308030708],
    [0.6682113173888461, 0.386572604467001, 0.5687688214178988, 0.28382615202260114],
    [-0.6052861693084857, -0.4661926401325355, 0.4853610272770064, -0.4251091021499359],
    [-0.463039161207222, 0.18720100141689808, 0.7481262616822968, 0.43687254072360115],
    [-0.15400370928524448, -0.050865544093023185, -0.13113841227769013, 0.9780072958704311]];

    ws2 = [0.41996735413022135, -0.4812385951303207, 0.6345433106326172, 0.4347809596711693, 0.018898149662634582];
*/
var NUM_WEIGHTS = 4;

// mutation probabilities
var MUTATE = 0.05;

// features
var TOTAL_HEIGHT = 0;
var SUM_HEIGHT_DIFFS = 1; //total difference between neighbouring columns
var LINES_CLEARED = 2;
var NUM_HOLES = 3;

// Layers
var L0 = 4;
var L1 = 5;
var L2 = 1;

var MIN_SCORE = -10000000;

var ws1 = [];
var ws2 = [];
var allFitness = Array.apply(null, Array(100)).map(Number.prototype.valueOf,0);
var numGenerations = 500;

var AI = function (ws1, ws2, allFitness) {
    this.ws1 = ws1;
    this.ws2 = ws2;
    this.allFitness = allFitness;
    this.bestWs1 = [];
    this.bestWs2 = [];
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

AI.prototype.feedForward = function(scores) {
    a1 = Array.apply(null, Array(L1)).map(Number.prototype.valueOf,0);
    for (var i = 0; i < L1; i++) {
        for (var j = 0; j < L0; j++) {
            a1[i] += scores[j] * this.ws1[this.count][i][j];
        }
    }
    a2 = Array.apply(null, Array(L2)).map(Number.prototype.valueOf,0);
    for (var i = 0; i < L2; i++) {
        for (var j = 0; j < L1; j++) {
            a2[i] += a1[j] * this.ws2[this.count][i][j];
        }
    }
    return a2[0];
}

AI.prototype.getBoardScore = function(x, y, newCurrent) {
    if (!this.addPieceToAI(x, y, newCurrent)) {
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

    //console.log(this.allWeights.length);
    //console.log(this.count);
    score = this.feedForward(scores);
    //console.log(score);

    this.removePieceFromAI(x, y, newCurrent);
    return score;
}

AI.prototype.insert = function(lines) {
    this.allFitness[this.count] = lines;
    for (var i = this.count-1; i>=0; i--) {
        if (lines < this.allFitness[i]) {
            var tempFitness = this.allFitness[i];
            var tempWs1 = this.ws1[i];
            var tempWs2 = this.ws2[i];
            this.ws1[i] = this.ws1[i+1];
            this.ws2[i] = this.ws2[i+1];
            this.allFitness[i] = lines;
            this.ws1[i+1] = tempWs1;
            this.ws2[i+1] = tempWs2;
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
    for (var i = 0; i < 100; i++) {
        var w1 = [];
        var nodeWeights;
        for (var k = 0; k < L1; k++) {
            nodeWeights = [];
            for (var j = 0; j < L0; j++) {
                rand = Math.random() * 2 - 1;
                nodeWeights.push(rand);
            }
            nodeWeights = this.normalizeWeights(nodeWeights);
            w1.push(nodeWeights);
        }
        this.ws1[i] = w1;
        var w2 = [];
        for (var k = 0; k < L2; k++) {
            nodeWeights = [];
            for (var j = 0; j < L1; j++) {
                rand = Math.random() * 2 - 1;
                nodeWeights.push(rand);
            }
            nodeWeights = this.normalizeWeights(nodeWeights);
            w2.push(nodeWeights);
        }
        this.ws2[i] = w2;
    }
    
}

AI.prototype.crossover = function(alpha1, alpha2, fitness1, fitness2) {
    var offspring = [];
    for (var i=0; i<alpha1.length; i++) {
        offspring[i] = [];
        for (var j = 0; j < alpha1[0].length; j++) {
            offspring[i][j] = alpha1[i][j]*fitness1 + alpha2[i][j]*fitness2;
        
        }
        offspring[i] = this.normalizeWeights(offspring[i]);
        var rand = Math.random();
        if (rand < 0.05) {
            var index = Math.floor(Math.random() * alpha1[0].length);
            var change = Math.random() * 0.4 - 0.2;
            offspring[i][index] += change;
            offspring[i] = this.normalizeWeights(offspring[i]);
        }
    }
    return offspring;
}

AI.prototype.generateChildren = function() {
    var nextWs1 = [];
    var nextWs2 = [];
    var alpha1Fitness = -1, alpha2Fitness = -1;
    var alpha1 = -1, alpha2 = -1;
    var rand;
    for (var j = 0; j < 30; j++) {
        for (var i = 0; i < 10; i ++) {
            rand = Math.floor(Math.random() * 100);
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
        offspring1 = this.crossover(this.ws1[alpha1], this.ws1[alpha2], 
                                    alpha1Fitness, alpha2Fitness);
        offspring2 = this.crossover(this.ws2[alpha1], this.ws2[alpha2], 
                                    alpha1Fitness, alpha2Fitness);

        nextWs1[j] = offspring1;
        nextWs2[j] = offspring2;
        alpha1Fitness = -1;
        alpha2Fitness = -1;
        alpha1 = -1;
        alpha2 = -1;
    }
    this.ws1 = this.ws1.slice(30);
    this.ws2 = this.ws2.slice(30);
    this.ws1 = this.ws1.concat(nextWs1);
    this.ws2 = this.ws2.concat(nextWs2);

    this.allFitness = Array.apply(null, Array(this.ws1.length)).map(Number.prototype.valueOf,0);
}

function newGame(ai) {
    if (ai.count >= ai.ws1.length) {
        if (numGenerations == 0) {
            clearInterval(interval);
            return;
        }
        numGenerations--;
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

var ai = new AI(ws1, ws2, allFitness);
ai.generateInitialWeights();
newGame(ai);

