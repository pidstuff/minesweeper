"use strict";

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
var game;

const EMPT = 0;
const BOMB = 9;
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

class Game {
  constructor() {
    this.grid = [];
    this.grid_margin = 3;
    this.grid_cols = 10;
    this.grid_rows = 10;
    this.numberOfBombs;
    this.minBombs = 5;
    this.maxBombs = 30;
    this.ongoing = true;
    this.hasInitialClick = false;
    this.remainingBlocks = this.grid_cols * this.grid_rows;
  }
  
  revealAllBlocks() {
    this.grid.forEach( (blocks, row) => {
      blocks.forEach( (block, col) => {
        block.reveal();
      });
    });
  }
  
  won() {
    this.ongoing = false;
    this.revealAllBlocks();
    alert("You have won");
  }
  
  lost() {
    this.ongoing = false;
    this.revealAllBlocks();
    alert("The game is lost");
  }
  
  insertBombsExceptIn(col, row) {
    let bombInput = document.getElementById("bombs").value;
    this.numberOfBombs = bombInput;
    while (bombInput > 0) {
      let bombX = Math.floor(Math.random() * (this.grid_cols));
      let bombY = Math.floor(Math.random() * (this.grid_rows));
      
      if (col == bombX && row == bombY) {
        continue
      } else if (!this.grid[bombY][bombX].isBomb()) {
        let bombBlock = this.grid[bombY][bombX];
        bombBlock.value = BOMB;
        let surroundingBlocks = bombBlock.getSurroundingBlocks();
        surroundingBlocks.forEach( (block) => {
          if (!block.isBomb()) {
            block.value++;
          }
        });
        bombInput--;
      }
    }
  }
}

class Block {
  constructor(col, row, x, y) {
    this.col = col;
    this.row = row;
    this.width = canvas.width / game.grid_cols;
    this.height = canvas.height / game.grid_rows;
    this.startX = x;
    this.startY = y;
    this.endX = (x + this.width) - game.grid_margin;
    this.endY = (y + this.height) - game.grid_margin;
    this.revealed = false;
    this.value = EMPT;
  }
  
  isBomb() {
    if (this.value == BOMB) {
      return true;
    }
    return false;
  }
  
  drawBlock(bgColor) {
    context.beginPath();
    context.rect(
      this.startX,
      this.startY,
      this.width - game.grid_margin,
      this.height - game.grid_margin
    );
    context.fillStyle = bgColor;
    context.fill();
    context.closePath();
    
    context.fillStyle = function(block) {
      const maxColorValue = 255;
      const r = block.value * (maxColorValue / 9);
      const g = (maxColorValue / 2) - (block.value * (maxColorValue / 9));
      const b = maxColorValue - (block.value * (maxColorValue / 9));
      return `rgb(${r}, ${g}, ${b})`;
    }(this);
    context.font = "25px Ubuntu";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      DICT[this.value],
      this.startX + (this.width / 2),
      this.startY + (this.height / 2),
    );
  }
  
  reveal() {
    if (this.revealed) { return }
    
    game.remainingBlocks--;
    this.revealed = true;
    this.drawBlock("#CCCCCC");
    
    if (this.value == EMPT) {
      const surroundingBlocks = this.getSurroundingBlocks();
      surroundingBlocks.forEach( (block) => {
        block.reveal();
      });
    }
    
    if (this.isBomb() && game.ongoing) {
      this.drawBlock("#FF9999");
      game.lost();
    } else if (game.remainingBlocks == game.numberOfBombs && game.ongoing) {
      game.won();
    }
  }
  
  getSurroundingBlocks() {
    let surroundingBlocks = [];
    for (let x=-1; x<=1; x++) {
      for (let y=-1; y<=1; y++) {
        if ((x == 0) && (y == 0)) { continue }
        let validX = ((this.col + x) >= 0) && ((this.col + x) < game.grid_cols);
        let validY = ((this.row + y) >= 0) && ((this.row + y) < game.grid_rows);
        if (validX && validY) {
          surroundingBlocks.push(game.grid[this.row + y][this.col + x]);
        }
      }
    }
    return surroundingBlocks;
  }
}

function validateInputs() {
  let isValid = true;
  let notice = document.createElement("div");
  let bombInput = parseFloat(document.getElementById("bombs").value);
  
  notice.setAttribute("id", "notice");
  if (!Number.isInteger(bombInput)) {
    notice.innerHTML = `The input for Bombs must be an integer between ${game.minBombs} and ${game.maxBombs}`;
    isValid = false;
  }
  else if (bombInput < game.minBombs) {
    notice.innerHTML = `The input for Bombs must be larger than ${game.minBombs}`;
    isValid = false;
  }
  else if (bombInput > game.maxBombs) {
    notice.innerHTML = `The input for Bombs must be smaller than ${game.maxBombs}`;
    isValid = false;
  }
  document.getElementById("notice").replaceWith(notice);
  return isValid;
}

function init(game) {
  /* Initializes the Minesweeper grid */
  let startX = 0;
  let startY = 0;
  let block_height = 0;
  let block_width = 0;
  let margin = game.grid_margin;
  
  for (let y=0; y<game.grid_rows; y++) {
    startX = 0;
    
    game.grid.push([]);
    for (let x=0; x<game.grid_cols; x++) {
      game.grid[y].push(new Block(x, y, startX, startY));
      block_height = game.grid[y][x].height;
      block_width = game.grid[y][x].width;
      context.rect(startX, startY, block_width - margin, block_height - margin);
      context.fillStyle = "#000000";
      context.fill();
      startX += block_width;
    }
    startY += block_height;
  }
}

canvas.addEventListener("click", (event) => {
  /* Listens for clicks within the canvas */
  if (!game) { return }
  
  let click = {
    x: event.clientX - canvas.getBoundingClientRect().left,
    y: event.clientY - canvas.getBoundingClientRect().top,
  };

  game.grid.forEach( (blocks, row) => {
    blocks.forEach( (block, col) => {
      let inBlockX = (click.x >= block.startX && click.x <= block.endX);
      let inBlockY = (click.y >= block.startY && click.y <= block.endY);
      if (inBlockX && inBlockY) {
      
        if (!game.hasInitialClick) {
          game.insertBombsExceptIn(col, row);
          game.hasInitialClick = true;
        }
        block.reveal();
      }
    });
  });
});

document.getElementById("start").addEventListener("click", (event) => {
  game = new Game();
  if (validateInputs()) {
    init(game);
  }
});
