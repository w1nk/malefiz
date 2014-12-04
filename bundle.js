(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./states.js":4}],2:[function(require,module,exports){
var Board = require('./board.js');
var STATE = require('./states.js');
var Player = require('./player.js');

var util = require('./util.js');

var STARTING_POOL = 5;

var board = [
             [0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0],
	     [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
             [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
             [2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2],
             [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0],
	     [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
             [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
             [0,0,0,0,1,1,2,1,1,1,2,1,1,0,0,0,0],
             [0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0],
             [0,0,0,0,0,0,1,1,2,1,1,0,0,0,0,0,0],
             [0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0],
             [1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1],
             [1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1],
             [1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1],
             [0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0]
	     ];


var Director = function(playercount, board) {
    var self = this;

    // load the board
    self.board = board = new Board(board);

    var starts = util.shuffleArray(board.getStartPositions());
    self.players = [];
    for(var i = 0; i < playercount; i++) {
	var startpos = starts.shift();
	var playerid = 200+i;

	var player = new Player(startpos, playerid, STARTING_POOL);

	self.players.push(player);
    }

    self.init();
};

Director.prototype.init = function() {
    var self = this;
    var board = self.board;
    self.turns = 0;
    //board.printBoard();
};

Director.prototype.takeTurn = function(renderer) {
    var self = this;
    var board = self.board;
    var players = self.players;

    var player = players.shift(); // next player
    players.push(player);
    console.log("player " + player.id + " starting at x: " + player.x + " y: " + player.y);

    var movement = [Math.floor((Math.random() * 6) + 1)];
    console.log("player rolled a " + movement);

    var availableMoves = [];
    // select piece

    player.selectPiece(board, movement, function(piece) {
		availableMoves = board.availableMoves(player, piece, movement);
	    var callback = function(move) {
			console.log(player.id + " player has chosen their turn ("+piece.id+"): " + JSON.stringify(move));

			var bumped = board.makeMove(player, piece, move);
			console.log("piece got bumped: " + bumped);

			// update player
			player.move(piece, move);
			if(bumped == STATE.BLOCKER) {
			    // player needs to drop blocker
			    // auto drop:
			    while(true) {
				var y = Math.floor((Math.random() * board.boardHeight));
				var x = Math.floor((Math.random() * board.boardWidth));
				console.log("x: " + x + " y: " + y);
				if(board.getPiece(x,y) == STATE.DEFAULT) {
				    console.log("drop blocker ("+x+","+y+")!");
				    board.setPiece(x,y,STATE.BLOCKER);
				    break;
				}
			    }
			} else if(bumped == STATE.FINISH) {
			    console.log(player.id + " has won the game!");
			} else {
			    for(var i = 0; i < players.length; i++) {
					if(players[i].id == bumped) {
					    console.log("player got bumped! reset their piece");
					    players[i].reset(move);
					}
			    }
			}

			//board.printBoard();

			//	players.push(player); // put player back
			self.turns++;
			console.log("finished turn " + self.turns);
			if(bumped != STATE.FINISH && self.turns < 10000) {
			    setTimeout(function() { self.tick(renderer) }, 250);
		    } else if (bumped == STATE.FINISH) {
		    	// temporary, wire up event emitting
		    	renderer();
		    	//setTimeout(function() { location.reload() }, 1000);
		    }
	    };

	    if(availableMoves.length > 0) 
		player.takeTurn(availableMoves, callback);
	    else
		self.tick(renderer);
	});
};

Director.prototype.tick = function(renderer) {
    var self = this;    
    self.takeTurn(renderer);
    if(renderer) renderer();
};

dir = new Director(4, board);
setTimeout(function() { dir.tick(drawboard); }, 1000);
//dir.tick();
},{"./board.js":1,"./player.js":3,"./states.js":4,"./util.js":5}],3:[function(require,module,exports){
var util = require('./util.js');

var Piece = function(x,y,id) {
    var self = this;
    self.x = x;
    self.y = y;
    self.id = id;
};


var Player = function(position, id, pieces) {
    var self = this;
    self.id = id;

    if(position) {
	self.x = position.x;
	self.y = position.y;
	self.start_x = self.x;
	self.start_y = self.y;
    }
    
    self.pool = [];
    for(var i = 0; i < pieces; i++) {
	var piece = new Piece(self.x, self.y, self.id + "" + (i+100));
	self.pool.push(piece);
    }
};

// can decouple here
Player.prototype.takeTurn = function(availableMoves, callback) {
    var self = this;

    var mosty = {x: 0, y: 0};
    for(var i = 0; i < availableMoves.length; i++) {
	if(availableMoves[i].y > mosty.y) mosty = availableMoves[i];
    }

    console.log(availableMoves);
    if(self.id == 199) {

        var choice = prompt("choose move: " + JSON.stringify(availableMoves));

        callback(availableMoves[choice]);
    } else {
        setTimeout(function() {callback(mosty)}, 1);
    }
    //    setTimeout(function() {callback(util.shuffleArray(availableMoves).shift()) }, 1);;
};

Player.prototype.selectPiece = function(board, movement, callback) {
    var self = this;
    var choice = Math.floor((Math.random() * (self.pool.length)) );
    if(self.id == 199) {
        choice = prompt("choose piece: " + JSON.stringify(self.pool));
        // emit into browser
    } else {
        availableMoves = board.availableMoves(self, self.pool[choice], movement);
        var tries = 0;
        while(availableMoves.length < 1 && tries < 10) {
           tries++;
           choice = Math.floor((Math.random() * (self.pool.length)) );
           availableMoves = board.availableMoves(self, self.pool[choice], movement);
        }
    }
    callback(self.pool[choice]);
};

Player.prototype.reset = function(piece) {
    var self = this;
    for(var i = 0; i < self.pool.length; i++) {
	if(self.pool[i].x == piece.x && self.pool[i].y == piece.y) {
	    self.pool[i].x = self.start_x;
	    self.pool[i].y = self.start_y;
	}
    }
};

Player.prototype.move = function(piece, move) {
    var self = this;

    for(var i = 0; i < self.pool.length; i++) {
	if(self.pool[i].id == piece.id) {
	    self.pool[i].x = move.x;
	    self.pool[i].y = move.y;
	    console.log("moved piece");
	}
    }

    self.x = move.x;
    self.y = move.y;
};

module.exports = Player;
},{"./util.js":5}],4:[function(require,module,exports){
module.exports = {
    IMPASS: 0,
    DEFAULT: 1,
    BLOCKER: 2,
    FINISH: 3,
    START: 4,
    PLAYER: 199,
};


},{}],5:[function(require,module,exports){
module.exports = {
    shuffleArray: function(array) {
	for (var i = array.length - 1; i > 0; i--) {
	    var j = Math.floor(Math.random() * (i + 1));
	    var temp = array[i];
	    array[i] = array[j];
	    array[j] = temp;
	}
	return array;
    }
};

},{}]},{},[2]);
