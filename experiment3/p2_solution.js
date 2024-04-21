/* exported generateGrid, drawGrid */
/* global placeTile */

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
    let maxSize = floor(random(smaller/5, smaller/4));
    let minSize = floor(random(smaller/10, maxSize));
    let numRooms = floor(random(5, 10));
    //The grid with the background areas
    let grid = [];
    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        if(noise(i/10, j/10) > 0.5){
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
      const roomRows = floor(random() * (maxSize - minSize)) + minSize;
      const roomCols = floor(random() * (maxSize - minSize)) + minSize;
      const x = floor(random() * numCols - roomCols) + 1;
      const y = floor(random() * numRows - roomRows) + 1;
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
        let prevCenterX = floor(prevRoom.x + prevRoom.width / 2);
        let prevCenterY = floor(prevRoom.y + prevRoom.height / 2);
        const centerX = floor(room.x + room.width / 2);
        const centerY = floor(room.y + room.height / 2);
        
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
    background(128);
    for(let i = 0; i < grid.length; i++) {
      for(let j = 0; j < grid[i].length; j++) {
        //Drawing lavas with animations by millis()
        if (grid[i][j] == '_') {
          let ti = floor(random(9, 11))
          let tj = floor(random(18, 19))
          placeTile(i, j, ti, tj);
          placeTile(i, j, 9 + (millis()%3000 < 250 ? -1 : -2), 18 + (millis()%700 < 250 ? 1 : 2));
        }
        else if (grid[i][j] == '-') {
          let ti = (floor(random(1, 3)))
          let tj = floor(random(18, 19))
          placeTile(i, j, ti, tj);
          placeTile(i, j, 5 + (millis()%1000 > 800 ? 1 : 0), 19 + (millis()%2000 < 250 ? -1 : 0));
        }
        //Drawing the dungeon
        if(gridCheck(grid, i, j, ".")){
          placeTile(i, j, (floor(random(4))), 9);
          //Adding extra treasure boxes as well.
          if(random() < 0.01){
            placeTile(i, j, 2, 30);
          }
        } else {
          //Drawing the edges and also adding in some extra terrains in the lava.
          drawContext(grid, i, j, ".", 0, 9);
          if(gridCode(grid, i, j, ".") == 0 && random() > 0.99){
            placeTile(i, j, 14, 9);
          }
        }
      }
    }
  }