// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;

function preload() {
  tilesetImage = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

function resizeScreen() {
  centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  redrawCanvas(); // Redraw everything based on new size
}

/*$("#reseedButton").click(function() {
  seed++;
});*/

// setup() function is called once when the program starts
function setup() {
  // place our canvas, making it fit our container
  /*canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");*/
  numCols = select("#asciiBox").attribute("rows") | 0;
  numRows = select("#asciiBox").attribute("cols") | 0;

  createCanvas(16 * numCols, 16 * numRows).parent("canvasContainer");
  select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

  select("#reseedButton").mousePressed(reseed);
  select("#asciiBox").input(reparseGrid);

  reseed();

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();
}

/*function setup() {
  numCols = select("#asciiBox").attribute("rows") | 0;
  numRows = select("#asciiBox").attribute("cols") | 0;

  createCanvas(16 * numCols, 16 * numRows).parent("canvasContainer");
  select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

  select("#reseedButton").mousePressed(reseed);
  select("#asciiBox").input(reparseGrid);

  reseed();
}*/

function gridToString(grid) {
  let rows = [];
  for (let i = 0; i < grid.length; i++) {
    rows.push(grid[i].join(""));
  }
  return rows.join("\n");
}

function stringToGrid(str) {
  let grid = [];
  let lines = str.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let row = [];
    let chars = lines[i].split("");
    for (let j = 0; j < chars.length; j++) {
      row.push(chars[j]);
    }
    grid.push(row);
  }
  return grid;
}

function draw() {
  randomSeed(seed);
  drawGrid(currentGrid);
}

function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

function generateGrid(numCols, numRows) {
  //The grid with the different biomes and items
  let grid = [];
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      if(noise(i/10, j/10) > 0.5){
        row.push("-");
      }
      else if(noise(i/10, j/10) < 0.3){
        row.push("W");
      }
      else{
        row.push("_");
      }
    }
    grid.push(row);
  }
  return grid;
}

// [1, 21] is dungeon wall
// [0, 9] is dungeon floor
const lookup = [
  [5, 1], //0000 blank
  [5, 0], //0001 up
  [6, 1], //0010 right
  [6, 0], //0011 up right
  [5, 2], //0100 down
  [5, 1], //0101 down & up 
  [6, 2], //0110 down right
  [5, 1], //0111 down, up, and right
  [4, 1], //1000 left
  [4, 0], //1001 up left
  [5, 1], //1010 left right 10
  [5, 1], //1011 left right up
  [4, 2], //1100 down left
  [5, 1], //1101 down left up
  [5, 1], //1110 down left right
  [5, 1] //1111 all direction
];

//Check the coordination if it is in the area and if it is the target
function gridCheck(grid, i, j, target) {
  if(i < 0 || j < 0 || i >= grid.length || j >= grid[i].length){
    return false;
  }
  if(grid[i][j] == target){
    return true;
  }
  return false;
}

//Adds in to a string depending on if the target object is located around the coordinate.
//The string(binary) is converted into decimal and returned
function gridCode(grid, i, j, target) {
  let binary = '';
  binary += gridCheck(grid, i, j - 1, target) ? "1":"0";
  binary += gridCheck(grid, i + 1, j, target)  ? "1":"0";
  binary += gridCheck(grid, i, j + 1, target)  ? "1":"0";
  binary += gridCheck(grid, i - 1, j, target)  ? "1":"0";
  const index = parseInt(binary, 2);
  return index
}

//Gets the index number from gridCode and place tiles depending what the value is.
function drawContext(grid, i, j, target, dti, dtj) {
  const code = gridCode(grid, i, j, target)
  if(code == 5){
    placeTile(i, j, dti + 5, dtj + 2);
    placeTile(i, j, dti + 5, dtj);
  } else if(code == 7){
    placeTile(i, j, dti + 5, dtj + 2);
    placeTile(i, j, dti + 6, dtj);
  } else if (code == 10){
    placeTile(i, j, dti + 4, dtj + 1);
    placeTile(i, j, dti + 6, dtj + 1);
  } else if (code == 11){
    placeTile(i, j, dti + 4, dtj + 1);
    placeTile(i, j, dti + 6, dtj);
  } else if (code == 13){
    placeTile(i, j, dti + 4, dtj + 2);
    placeTile(i, j, dti + 5, dtj);
  } else if (code == 14){
    placeTile(i, j, dti + 4, dtj + 2);
    placeTile(i, j, dti + 6, dtj + 1);
  } else if (code == 15){
    placeTile(i, j, dti + 4, dtj + 2);
    placeTile(i, j, dti + 6, dtj);
  }
  else{
    const [tiOffset, tjOffset] = lookup[code];
    placeTile(i, j, dti + tiOffset, dtj + tjOffset);
  }
}

//Drawing grids.
function drawGrid(grid) {
  background(128);
  for(let i = 0; i < grid.length; i++) {
    for(let j = 0; j < grid[i].length; j++) {
      //Drawing the water, andl also animating it using % operators and millis().
      if(grid[i][j] == 'W'){
        placeTile(i, j, 0, 13);
        
        placeTile(i, j, 0 + (millis()% (((i * j) % 17) * 5000) < (((i * j) % 5) + 5) * 50 ? 3 : 0), 13);
      }
      //Drawing the low lands
      if(grid[i][j] == '-'){
        placeTile(i, j, floor(random(0, 4)), 1);
      }
      else{
        drawContext(grid, i, j, "-", 0, 6);
      }
      //Drawing the high lands with the houses and towers.
      //Also drawing the trees in the low lands
      //Drawing ground
      if (grid[i][j] == '_') {
        let ti = floor(random(4))
        let tj = 0
        placeTile(i, j, ti, tj);
        //Drawing the houses
        if(gridCode(grid, i, j, "_") == 15 && random() > 0.9){
          placeTile(i, j, 26, 0);
        }
      }
      else{
        //Drawing the edges
        drawContext(grid, i, j, "_", 5, 0)
        //Drawing the trees
        if(gridCode(grid, i, j, "_") == 0 && grid[i][j] != "W"){
          let ti = 14
          let tj = floor(random(3))
          placeTile(i, j, ti, tj);
        }
      }
      //Drawing the towers
      if(gridCode(grid, i, j, "_") == 15 && random() > 0.99){
        placeTile(i, j, 28, 1);
        placeTile(i - 1, j, 28, 0);
      }
    }
  }
}

function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  select("#seedReport").html("seed " + seed);
  regenerateGrid();
}

function regenerateGrid() {
  select("#asciiBox").value(gridToString(generateGrid(numCols, numRows)));
  reparseGrid();
}

function reparseGrid() {
  currentGrid = stringToGrid(select("#asciiBox").value());
}
