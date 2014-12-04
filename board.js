var STATE = require('./states.js');

var Board = function Board(board) {
    var self = this;
    self._initialState = board;
    // board need to be 2d array, gaps should be defined as immovable spaces
    self.boardWidth = board[0].length;
    self.boardHeight = board.length;
    
    // snapshot wont work until the above
    self._currentState = self.snapshot(board);
    self._snapshotState = self.snapshot();

    console.log("width:  " + self.boardWidth + " height: " + self.boardHeight);
};

Board.prototype.snapshot = function(state) {
    var self = this;
    
    if(!state)
	state = self._currentState;

    var copy = new Array(state.length);
    for(var i = 0; i < state.length; i++) {
	var row = new Array(state[0].length);
	for(var j = 0; j < state[0].length; j++) {
	    row[j] = state[i][j];
	}
	copy[i] = row;
    }
    return copy;
}

Board.prototype.printBoard = function(pieces) {
    var self = this;
    
    var buf = "\t";
    for(var i = 0; i < self.boardWidth; i++) {
	buf += " " + i + ":\t";
    }

    console.log(buf);
    for(var i = self._currentState.length; i > 0; i--) {
	var row = self._currentState[i-1];
	var buf = "\t" + (i-1) +":\t";

	var y = i-1;

	for(var j = 0; j < row.length; j++) {
	    // check pieces array, if exists flag visually
	    var sep = "|";
	    var x = j;

	    if(pieces && pieces.length > 0) {
		for(var k = 0; k < pieces.length; k++) {
		    if(pieces[k].x == x && pieces[k].y == y) {
			sep = "*";
		    }
		}
	    }

	    buf += " " + sep + row[j] + sep + "\t";
	}
	console.log(buf);
    }
};

Board.prototype.makeMove = function(player, piece, to) {
    var self = this;
    
    var currentPiece = self.getPiece(to);
    var fromPiece = self.getPiece(piece);

    self._currentState[to.y][to.x] = player.id;//self._currentState[from.y][from.x]; // 'move' piece
    self._currentState[piece.y][piece.x] = (fromPiece == STATE.START) ? STATE.START : STATE.DEFAULT;

    return currentPiece; // return the bumped piece
};

Board.prototype.setPiece = function(position, y, val) {
    var self = this;

    var x = position;
    var y = y;
    var val = val;

    if( typeof(position) == "object") {
        x = position.x;
	val = y;
        y = position.y;
    }

    var old = self._currentState[y][x];
    self._currentState[y][x] = val;
    self._snapshot = self.snapshot();
    return old;
}

Board.prototype.getPiece = function (position, y) {
    var self = this;

    var x = position;
    var y = y;

    if( typeof(position) == "object") {
	x = position.x;
	y = position.y;
    }

    return self._currentState[y][x];
};

Board.prototype.availableMoves = function(player, piece, distance) {
    var self = this;
    var x = piece.x;
    var y = piece.y;

    var walkQueue = [];

    var terminalMoves = [];

    var bitboard = [];
    for(var i = 0; i < self.boardHeight; i++) {
	var row = new Array(self.boardWidth);
	bitboard.push(row);
    }

    walkQueue.push({x: x, y: y, step: 0}); // start
    // bfs search map
    while(walkQueue.length > 0) {
	var task = walkQueue.shift();

	// bounds check
	if(task.x < 0 || task.y < 0 || task.x >= self.boardWidth || task.y >= self.boardHeight) {
	    continue;
	}

	var length = Math.abs(task.x - piece.x) + Math.abs(task.y - piece.y);

	if(length > distance)
	    continue;

	if(bitboard[task.y][task.x] == 1) {
	    continue;
	}

	bitboard[task.y][task.x] = 1;
	
	// verify that the piece can move 'through' this spot, if step == distance, this is a landing
	var destination = self.getPiece(task.x,task.y);
	if(destination == STATE.IMPASS || (destination == STATE.BLOCKER && task.step != distance)) {
	    continue;
	}

	if(task.step == distance) { // out of moves, and we can land here
	    if(destination != STATE.IMPASS && destination != STATE.START && destination != player.id)
		terminalMoves.push(task);
	}

	walkQueue.push({ x: task.x, y: task.y-1, step: task.step+1});
	walkQueue.push({ x: task.x, y: task.y+1, step: task.step+1});
	walkQueue.push({ x: task.x-1, y: task.y, step: task.step+1});
	walkQueue.push({ x: task.x+1, y: task.y, step: task.step+1});
    }

    return terminalMoves;
};


Board.prototype.getStartPositions = function() {
    var self = this;

    var starts = [];
    // just walk the board and return all start position markers
    for(var i = 0; i < self.boardHeight; i++) {
	for(var j = 0; j < self.boardWidth; j++) {
	    if(self.getPiece(j,i) == STATE.START) {
		starts.push({x:j,y:i});
	    }
	}
    }
    return starts;
};

module.exports = Board;
