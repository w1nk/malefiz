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