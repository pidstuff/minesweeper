"use strict";

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var game;

const EMPT = 0;
const BOMB = 9;

const MARGIN = 3;
const GRID_COLS = 10;
const GRID_ROWS = 10;
const BLOCK_WIDTH = canvas.width / GRID_COLS;
const BLOCK_HEIGHT = canvas.height / GRID_ROWS;
const DICT = {
  0: " ",
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: "B",
};

function Game() {
  this.grid = [];
  this.numberOfBombs;
  this.ongoing = true;
  this.hasInitialClick = false;
  this.remainingBlocks = GRID_COLS * GRID_ROWS;
}

Game.prototype.revealAllBlocks = function() {
  this.grid.forEach( function(blocks, row) {
    blocks.forEach( function(block, col) {
      block.reveal();
    });
  });
}

Game.prototype.won = function() {
  this.ongoing = false;
  this.revealAllBlocks();
  alert("You have won");
}

Game.prototype.lost = function() {
  this.ongoing = false;
  this.revealAllBlocks();
  alert("The game is lost");
}

Game.prototype.insertBombsExceptIn = function(col, row) {
  var bombInput = document.getElementById("bombs").value;
  this.numberOfBombs = bombInput;
  while (bombInput > 0) {
    var bombX = Math.floor(Math.random() * (GRID_COLS));
    var bombY = Math.floor(Math.random() * (GRID_ROWS));
    
    if (col == bombX && row == bombY) {
      continue
    } else if (this.grid[bombY][bombX].value != BOMB) {
      let bombBlock = this.grid[bombY][bombX]
      bombBlock.value = BOMB;
      let surroundingBlocks = bombBlock.getSurroundingBlocks();
      surroundingBlocks.forEach( function(block) {
        if (block.value != BOMB) {
          block.value++;
        }
      });
      bombInput--;
    }
  }
}

function Block(col, row, x, y) {
  this.col = col;
  this.row = row;
  this.startX = x;
  this.startY = y;
  this.endX = (x + BLOCK_WIDTH) - MARGIN;
  this.endY = (y + BLOCK_HEIGHT) - MARGIN;
  this.revealed = false;
  this.value = EMPT;
}

Block.prototype.drawBlock = function(bgColor) {
  context.beginPath();
  context.rect(
    this.startX,
    this.startY,
    BLOCK_WIDTH - MARGIN,
    BLOCK_HEIGHT - MARGIN
    );
  context.fillStyle = bgColor;
  context.fill();
  context.closePath();
  
  context.fillStyle = function(block) {
    let maxColorValue = 255;
    let r = block.value * (maxColorValue / 9);
    let g = (maxColorValue / 2) - (block.value * (maxColorValue / 9));
    let b = maxColorValue - (block.value * (maxColorValue / 9));
    return "rgb("+ r +", "+ g +", "+ b +")";
  }(this);
  context.font = "25px Ubuntu";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    DICT[this.value],
    this.startX + (BLOCK_WIDTH / 2),
    this.startY + (BLOCK_HEIGHT / 2)
    );
}

Block.prototype.reveal = function() {
  if (this.revealed) { return }
  
  game.remainingBlocks--;
  this.revealed = true;
  this.drawBlock("#CCCCCC");
  
  if (this.value == EMPT) {
    let surroundingBlocks = this.getSurroundingBlocks();
    surroundingBlocks.forEach( function(block) {
      block.reveal();
    });
  }
  
  if (this.value == BOMB && game.ongoing) {
    this.drawBlock("#FF9999");
    game.lost();
    
  } else if (game.remainingBlocks == game.numberOfBombs && game.ongoing) {
    game.won();
  }
}

Block.prototype.getSurroundingBlocks = function() {
  var surroundingBlocks = [];
  for (let x=-1; x<=1; x++) {
    for (let y=-1; y<=1; y++) {
      if ((x == 0) && (y == 0)) { continue }
      let validX = ((this.col + x) >= 0) && ((this.col + x) < GRID_COLS);
      let validY = ((this.row + y) >= 0) && ((this.row + y) < GRID_ROWS);
      if (validX && validY) {
        surroundingBlocks.push(game.grid[this.row + y][this.col + x]);
      }
    }
  }
  return surroundingBlocks;
}


function init(game) {
  /* Initializes the Minesweeper grid */
  var startX = 0;
  var startY = 0;
  for (let y=0; y<GRID_ROWS; y++) {
    startX = 0;
    
    game.grid.push([]);
    for (let x=0; x<GRID_COLS; x++) {
      game.grid[y].push(new Block(x, y, startX, startY));
      context.rect(startX, startY, BLOCK_WIDTH - MARGIN, BLOCK_HEIGHT - MARGIN);
      context.fillStyle = "#000000";
      context.fill();
      startX += BLOCK_WIDTH;
    }
    startY += BLOCK_HEIGHT;
  }
}

canvas.addEventListener("click", function(event) {
  /* Listens for clicks within the canvas */
  if (!game) { return }
  
  var click = {
    x: event.clientX - canvas.getBoundingClientRect().left,
    y: event.clientY - canvas.getBoundingClientRect().top,
  };

  game.grid.forEach( function(blocks, row) {
    blocks.forEach( function(block, col) {
      let inBlockX = (click.x >= block.startX && click.x <= block.endX);
      let inBlockY = (click.y >= block.startY && click.y <= block.endY);
      if (inBlockX && inBlockY) {
      
        if (!game.hasInitialClick) {
          game.insertBombsExceptIn(col, row)
          game.hasInitialClick = true;
        }
        
        block.reveal();
      }
    });
  });
});

document.getElementById("start").addEventListener("click", function(event) {
  game = new Game();
  init(game);
});
