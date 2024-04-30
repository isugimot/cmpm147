// sketch.js - sketch code for alternate worlds
// Author: Ichiro Sugimoto
// Date: 4/24/2024

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

let seed = 0;
let seed2 = 0;
let tilesetImage;
let tilesetImage2;
let currentGrid = [];
let currentGrid2 = [];
let numRows, numCols;
let numRows2, numCols2;



//Dungeon generator

var myp5 = new p5((d) => {
  d.preload = () => {
    tilesetImage = d.loadImage(
      "tilesetP8.png"
    );
  }

  function placeTile(i, j, ti, tj) {
    d.image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
  }

  function reseed() {
    seed = (seed | 0) + 1109;
    d.randomSeed(seed);
    d.noiseSeed(seed);
    d.select("#seedReport").html("seed " + seed);
    regenerateGrid();
  }

  function regenerateGrid() {
    d.select("#asciiBox").value(gridToString(generateGrid(numCols, numRows)));
    reparseGrid();
  }
  
  function reparseGrid() {
    currentGrid = stringToGrid(d.select("#asciiBox").value());
  }
  
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

  d.setup = () => {
  numCols = d.select("#asciiBox").attribute("rows") | 0;
  numRows = d.select("#asciiBox").attribute("cols") | 0;

  d.createCanvas(16 * numCols, 16 * numRows).parent("canvas-container1");
  d.select('canvas').elt.getContext("2d").imageSmoothingEnabled = false;

  d.select("#reseedButton").mousePressed(reseed);
  d.select("#asciiBox").input(reparseGrid);

  reseed();
  };

  d.draw = () => {
    d.randomSeed(seed);
    drawGrid(currentGrid);
  }

  function generateGrid(numCols, numRows) {
    //Determines which side is smaller to pick the maximum
    //and the minimum size of rooms
    let smaller = 1;
    if (numCols >= numRows){
      smaller = numRows;
    } else {
      smaller = numCols;
    }
    //The size and number of rooms
    let maxSize = d.floor(d.random(smaller/5, smaller/4));
    let minSize = d.floor(d.random(smaller/10, maxSize));
    let numRooms = d.floor(d.random(5, 10));
    //The grid with the background areas
    let grid = [];
    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        if(d.noise(i/10, j/10) > 0.5){
          row.push("-")
        }
        else{
          row.push("_");
        }
      }
      grid.push(row);
    }
    //This randomly locates and create rooms depending on the min and max size.
    let rooms = [];
    for (let i = 0; i < numRooms; i++){
      const roomRows = d.floor(d.random() * (maxSize - minSize)) + minSize;
      const roomCols = d.floor(d.random() * (maxSize - minSize)) + minSize;
      const x = d.floor(d.random() * numCols - roomCols) + 1;
      const y = d.floor(d.random() * numRows - roomRows) + 1;
      const room = {x: x, y: y, width: roomCols, height: roomRows};
      //This checks if the room is overlapping. If it is, the room is rebuilt before it is pushed to the sets of rooms
      //to keep track the used spaces.
      for(const r of rooms){
        if(room.x < r.x + r.width && room.x + room.width > r.x && room.y < r.y + r.height && room.y + room.height > r.y){
          i--;
          continue;
        }
      }
      rooms.push(room);
      //This prints out the room into the grid.
      for (let j = y; j < y + roomRows; j++){
        for (let l = x; l < x + roomCols; l++){
          grid[j][l] = ".";
        }
      }
      
      //This creates a passage between rooms, which creates an passage connecting the center of the room
      //and the center of the room created previously
      if (i > 0) {
        const prevRoom = rooms[i - 1];
        let prevCenterX = d.floor(prevRoom.x + prevRoom.width / 2);
        let prevCenterY = d.floor(prevRoom.y + prevRoom.height / 2);
        const centerX = d.floor(room.x + room.width / 2);
        const centerY = d.floor(room.y + room.height / 2);
        
        while (prevCenterX !== centerX) {
          grid[prevCenterY][prevCenterX] = ".";
          if (prevCenterX < centerX) prevCenterX++;
          else prevCenterX--;
        }
        while (prevCenterY !== centerY) {
          grid[prevCenterY][prevCenterX] = ".";
          if (prevCenterY < centerY) prevCenterY++;
          else prevCenterY--;
        }
      }
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
    d.background(128);
    let entry = false;
    let entryx;
    let entryy;
    let exitx;
    let exity;
    let exitdist = 0;
    for(let i = 0; i < grid.length; i++) {
      for(let j = 0; j < grid[i].length; j++) {
        //Drawing lavas with animations by millis()
        if (grid[i][j] == '_') {
          let ti = d.floor(d.random(9, 11))
          let tj = d.floor(d.random(18, 19))
          placeTile(i, j, ti, tj);
          placeTile(i, j, 9 + (d.millis()%((i+1)*(j+1)%7 * 1000) < (i*j%5 * 25) ? -1 : -2), 18 + (d.millis()%((i+1)*(j+1)%19 * 700) < (i*j%5 + 250) ? 1 : 2));
        }
        else if (grid[i][j] == '-') {
          let ti = (d.floor(d.random(1, 3)))
          let tj = d.floor(d.random(18, 19))
          placeTile(i, j, ti, tj);
          placeTile(i, j, 5 + (d.millis()%((i+1)*(j+1)%11 * 1000) > (i*j%5 * 50 + 400) ? 1 : 0), 19 + (d.millis()%((i+1)*(j+1)%13 * 1000) < (i*j%5 + 250) ? -1 : 0));
        }
        //Drawing the dungeon
        if(gridCheck(grid, i, j, ".")){
          placeTile(i, j, (d.floor(d.random(4))), 9);
          //Adding extra treasure boxes as well.
          if(gridCode(grid, i, j, ".") == 15 && d.random() < 0.05){
            placeTile(i, j, 2, 30);
          }
          //Taking the farthest coordinate from the entance door where a door can be located.
          if(gridCode(grid, i, j, ".") == 15 && gridCheck(grid, i-1, j-1, ".") && gridCheck(grid, i-1, j+1, ".") && 
             gridCheck(grid, i+1, j-1, ".") && gridCheck(grid, i + 1, j + 1, ".") &&
             entry == true){
            if(exitdist < Math.sqrt(Math.pow(entryx - j, 2) + Math.pow(entryy - i, 2))){
              exitdist = Math.sqrt(Math.pow(entryx - j, 2) + Math.pow(entryy - i, 2));
              exitx = j;
              exity = i
            }
          }
          //Adding in entrance door once.
          if(gridCode(grid, i, j, ".") == 15 && gridCheck(grid, i-1, j-1, ".") && gridCheck(grid, i-1, j+1, ".") && 
             gridCheck(grid, i+1, j-1, ".") && gridCheck(grid, i + 1, j + 1, ".") &&
             entry == false){
            placeTile(i, j, 26, 26);
            entry = true
            entryx = j;
            entryy = i;
          }
        } else {
          //Drawing the edges and also adding in some extra terrains in the lava.
          drawContext(grid, i, j, ".", 0, 9);
          if(gridCode(grid, i, j, ".") == 0 && d.random() > 0.99){
            placeTile(i, j, 14, 9);
          }
        }
      }
    }
    //Placing the exit door to a location far as possible from the entrance.
    placeTile(exity, exitx, 27, 26);
  }

}, 'p5sketch');


//Overworld generator
var myp5 = new p5((o) => {
  o.preload = () => {
    tilesetImage2 = o.loadImage(
      "tilesetP8.png"
    );
  }

  function placeTile2(i, j, ti, tj) {
    o.image(tilesetImage2, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
  }

  function reseed2() {
    seed2 = (seed2 | 0) + 1109;
    o.randomSeed(seed2);
    o.noiseSeed(seed2);
    o.select("#seedReport2").html("seed " + seed2);
    regenerateGrid2();
  }

  function regenerateGrid2() {
    o.select("#asciiBox2").value(gridToString2(generateWorldGrid(numCols2, numRows2)));
    reparseGrid2();
  }
  
  function reparseGrid2() {
    currentGrid2 = stringToGrid2(o.select("#asciiBox2").value());
  }
  
  function gridToString2(grid) {
    let rows2 = [];
    for (let i = 0; i < grid.length; i++) {
      rows2.push(grid[i].join(""));
    }
    return rows2.join("\n");
  }
  
  function stringToGrid2(str) {
    let grid2 = [];
    let lines2 = str.split("\n");
    for (let i = 0; i < lines2.length; i++) {
      let row2 = [];
      let chars2 = lines2[i].split("");
      for (let j = 0; j < chars2.length; j++) {
        row2.push(chars2[j]);
      }
      grid2.push(row2);
    }
    return grid2;
  }

  o.setup = () => {
  numCols2 = o.select("#asciiBox2").attribute("rows") | 0;
  numRows2 = o.select("#asciiBox2").attribute("cols") | 0;

  o.createCanvas(16 * numCols2, 16 * numRows2).parent("canvas-container2");
  o.select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

  o.select("#reseedButton2").mousePressed(reseed2);
  o.select("#asciiBox2").input(reparseGrid2);

  reseed2();
  };

  o.draw = () => {
    o.randomSeed(seed2);
    drawWorldGrid(currentGrid2);
  }

  function generateWorldGrid(numCols, numRows) {
    //The grid with the different biomes and items
    let grid = [];
    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        if(o.noise(i/10, j/10) > 0.5){
          row.push("-");
        }
        else if(o.noise(i/10, j/10) < 0.3){
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
      placeTile2(i, j, dti + 5, dtj + 2);
      placeTile2(i, j, dti + 5, dtj);
    } else if(code == 7){
      placeTile2(i, j, dti + 5, dtj + 2);
      placeTile2(i, j, dti + 6, dtj);
    } else if (code == 10){
      placeTile2(i, j, dti + 4, dtj + 1);
      placeTile2(i, j, dti + 6, dtj + 1);
    } else if (code == 11){
      placeTile2(i, j, dti + 4, dtj + 1);
      placeTile2(i, j, dti + 6, dtj);
    } else if (code == 13){
      placeTile2(i, j, dti + 4, dtj + 2);
      placeTile2(i, j, dti + 5, dtj);
    } else if (code == 14){
      placeTile2(i, j, dti + 4, dtj + 2);
      placeTile2(i, j, dti + 6, dtj + 1);
    } else if (code == 15){
      placeTile2(i, j, dti + 4, dtj + 2);
      placeTile2(i, j, dti + 6, dtj);
    }
    else{
      const [tiOffset, tjOffset] = lookup[code];
      placeTile2(i, j, dti + tiOffset, dtj + tjOffset);
    }
  }
  
  //Drawing grids.
  function drawWorldGrid(grid) {
    o.background(128);
    for(let i = 0; i < grid.length; i++) {
      for(let j = 0; j < grid[i].length; j++) {
        //Drawing the water, andl also animating it using % operators and millis().
        if(grid[i][j] == 'W'){
          placeTile2(i, j, 0, 13);
        
          placeTile2(i, j, 0 + (o.millis()% (((i * j) % 17) * 5000) < (((i * j) % 5) + 5) * 50 ? 3 : 0), 13);
        }
        //Drawing the low lands
        if(grid[i][j] == '-'){
          placeTile2(i, j, o.floor(o.random(0, 4)), 1);
        }
        else{
          drawContext(grid, i, j, "-", 0, 6);
        }
        //Drawing the high lands with the houses and towers.
        //Also drawing the trees in the low lands
        //Drawing ground
        if (grid[i][j] == '_') {
          let ti = o.floor(o.random(4))
          let tj = 0
          placeTile2(i, j, ti, tj);
          //Drawing the houses
          if(gridCode(grid, i, j, "_") == 15 && o.random() > 0.9){
            placeTile2(i, j, 26, 0);
          }
        }
        else{
          //Drawing the edges
          drawContext(grid, i, j, "_", 5, 0)
          //Drawing the trees
          if(gridCode(grid, i, j, "_") == 0 && grid[i][j] != "W"){
            let ti = 14
            let tj = o.floor(o.random(3))
            placeTile2(i, j, ti, tj);
          }
        }
        //Drawing the towers
        if(gridCode(grid, i, j, "_") == 15 && o.random() > 0.99){
          placeTile2(i, j, 28, 1);
          placeTile2(i - 1, j, 28, 0);
        }
      }
    }
  }

}, 'p5sketch');