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
             [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
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