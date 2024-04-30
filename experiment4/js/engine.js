//Open world
new p5((w) => {
    let tile_width_step_main;
    let tile_height_step_main;
    let tile_rows, tile_columns;
    let camera_offset;
    let camera_velocity;
    /////////////////////////////
    // Transforms between coordinate systems
    // These are actually slightly weirder than in full 3d...
    /////////////////////////////
    function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
      let i = (world_x - world_y) * tile_width_step_main;
      let j = (world_x + world_y) * tile_height_step_main;
      return [i + camera_x, j + camera_y];
    }
  
    function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
      let i = (world_x - world_y) * tile_width_step_main;
      let j = (world_x + world_y) * tile_height_step_main;
      return [i, j];
    }
  
    function tileRenderingOrder(offset) {
      return [offset[1] - offset[0], offset[0] + offset[1]];
    }
  
    function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
      screen_x -= camera_x;
      screen_y -= camera_y;
      screen_x /= tile_width_step_main * 2;
      screen_y /= tile_height_step_main * 2;
      screen_y += 0.5;
      return [Math.floor(screen_y + screen_x), Math.floor(screen_y - screen_x)];
    }
  
    function cameraToWorldOffset([camera_x, camera_y]) {
      let world_x = camera_x / (tile_width_step_main * 2);
      let world_y = camera_y / (tile_height_step_main * 2);
      return { x: Math.round(world_x), y: Math.round(world_y) };
    }
  
    function worldOffsetToCamera([world_x, world_y]) {
      let camera_x = world_x * (tile_width_step_main * 2);
      let camera_y = world_y * (tile_height_step_main * 2);
      return new p5.Vector(camera_x, camera_y);
    }
  
    w.preload = () => {
      if (w.p3_preload) {
        w.p3_preload();
      }
    }
  
    w.setup = () => {
      let canvas = w.createCanvas(800, 400);
      canvas.parent("container3");
  
      camera_offset = new p5.Vector(-w.width / 2, w.height / 2);
      camera_velocity = new p5.Vector(0, 0);
  
      if (w.p3_setup) {
        w.p3_setup();
      }
  
      let label = w.createP();
      label.html("World key: ");
      label.parent("container3");
  
      let input = w.createInput("xyzzy");
      input.parent(label);
      input.input(() => {
        rebuildWorld(input.value());
      });
  
      w.createP("Arrow keys scroll. Clicking changes tiles.").parent("container3");
  
      rebuildWorld(input.value());
    }
  
    function rebuildWorld(key) {
      if (w.p3_worldKeyChanged) {
        w.p3_worldKeyChanged(key);
      }
      tile_width_step_main = w.p3_tileWidth ? w.p3_tileWidth() : 32;
      tile_height_step_main = w.p3_tileHeight ? w.p3_tileHeight() : 14.5;
      tile_columns = Math.ceil(w.width / (tile_width_step_main * 2));
      tile_rows = Math.ceil(w.height / (tile_height_step_main * 2));
    }
  
    w.mouseClicked = () => {
      let world_pos = screenToWorld(
        [0 - w.mouseX, w.mouseY],
        [camera_offset.x, camera_offset.y]
      );
  
      if (w.p3_tileClicked) {
        w.p3_tileClicked(world_pos[0], world_pos[1]);
      }
      return false;
    }
  
    w.draw = () => {
      // Keyboard controls!
      if (w.keyIsDown(w.LEFT_ARROW)) {
        camera_velocity.x -= 1;
      }
      if (w.keyIsDown(w.RIGHT_ARROW)) {
        camera_velocity.x += 1;
      }
      if (w.keyIsDown(w.DOWN_ARROW)) {
        camera_velocity.y -= 1;
      }
      if (w.keyIsDown(w.UP_ARROW)) {
        camera_velocity.y += 1;
      }
  
      let camera_delta = new p5.Vector(0, 0);
      camera_velocity.add(camera_delta);
      camera_offset.add(camera_velocity);
      camera_velocity.mult(0.95); // cheap easing
      if (camera_velocity.mag() < 0.01) {
        camera_velocity.setMag(0);
      }
  
      let world_pos = screenToWorld(
        [0 - w.mouseX, w.mouseY],
        [camera_offset.x, camera_offset.y]
      );
      let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);
  
      w.background(100);
  
      if (w.p3_drawBefore) {
        w.p3_drawBefore();
      }
  
      let overdraw = 0.1;
  
      let y0 = Math.floor((0 - overdraw) * tile_rows);
      let y1 = Math.floor((1 + overdraw) * tile_rows);
      let x0 = Math.floor((0 - overdraw) * tile_columns);
      let x1 = Math.floor((1 + overdraw) * tile_columns);
  
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [
            camera_offset.x,
            camera_offset.y
          ]); // odd row
        }
        for (let x = x0; x < x1; x++) {
          drawTile(
            tileRenderingOrder([
              x + 0.5 + world_offset.x,
              y + 0.5 - world_offset.y
            ]),
            [camera_offset.x, camera_offset.y]
          ); // even rows are offset horizontally
        }
      }
  
      describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);
  
      if (w.p3_drawAfter) {
        w.p3_drawAfter();
      }
    }
  
    // Display a discription of the tile at world_x, world_y.
    function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
      let [screen_x, screen_y] = worldToScreen(
        [world_x, world_y],
        [camera_x, camera_y]
      );
      drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
    }
  
    function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
      w.push();
      w.translate(screen_x, screen_y);
      if (w.p3_drawSelectedTile) {
        w.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
      }
      w.pop();
    }
  
    // Draw a tile, mostly by calling the user's drawing code.
    function drawTile([world_x, world_y], [camera_x, camera_y]) {
      let [screen_x, screen_y] = worldToScreen(
        [world_x, world_y],
        [camera_x, camera_y]
      );
      w.push();
      w.translate(0 - screen_x, screen_y);
      if (w.p3_drawTile) {
        w.p3_drawTile(world_x, world_y, -screen_x, screen_y);
      }
      w.pop();
    }
    //World.js
    let tilesetImage;
    let fieldTileSet;
    let wolfTileSet;

    w.p3_preload = () => {
    tilesetImage = w.loadImage(
        "Small-8-Direction-Characters_by_AxulArt.png"
    );
    fieldTileSet = w.loadImage(
        "spritesheet.png"
    );
    wolfTileSet = w.loadImage(
        "wolf-idle.png"
    );
    }

    w.p3_setup = () => {}

    let worldSeed;

    fw.p3_worldKeyChanged = (key) => {
    worldSeed = XXH.h32(key, 0);
    w.noiseSeed(worldSeed);
    w.randomSeed(worldSeed);
    code = 1;
    previ = 0;
    prevj = 0;
    wolf = {};
    ta = 1;
    wa = 1;
    wd = 0;
    keep = {};
    }

    function p3_tileWidth() {
    return 32;
    }
    function p3_tileHeight() {
    return 16;
    }

    let [tw, th] = [p3_tileWidth(), p3_tileHeight()];
    let code = 1;
    let previ = 0;
    let prevj = 0;
    let wolf = {};

    w.p3_tileClicked = (i, j) => {
    if((i == previ + 1 || i == previ - 1 || i == previ) && (j == prevj + 1 | j == prevj - 1 || j == prevj) && !(prevj == j && previ == i)){
        if(previ == i && prevj - 1 == j){
        code = 7;
        }else if(previ == i && prevj + 1 == j){
        code = 3;
        }else if(previ - 1 == i && prevj == j){
        code = 1;
        }else if(previ + 1 == i && prevj == j){
        code = 5;
        }else if(previ + 1 == i && prevj + 1 == j){
        code = 4;
        }else if(previ - 1 == i && prevj - 1 == j){
        code = 0;
        }else if(previ - 1 == i && prevj + 1 == j){
        code = 2;
        }else if(previ + 1 == i && prevj - 1 == j){
        code = 6;
        }
        previ = i;
        prevj = j;
        if(wolf[[i, j]] == 1){
        wolf[[i, j]] = 2;
        }
    }
    }

    w.p3_drawBefore = () => {}

    const lookup = [
    [0], // up
    [1], // up right
    [2], // right
    [3], // down right
    [4], //down
    [5], //down left
    [6], //left
    [7], //up left
    ];

    let ta = 1;
    //0 = gray
    //120 = blue
    //192 = orange
    let wa = 1;
    let wd = 0;
    let keep = {};

    w.p3_drawTile = (i, j) => {
    w.noStroke();
    w.push();
    let select = XXH.h32("tile:" + [i, j], worldSeed);
    let area = 64;
    w.image(fieldTileSet, 0, -10, area, area, 32 * w.floor(select % 3), 96, 32, 32);
    const [ti] = lookup[code];
    if(previ == i && prevj == j){
        ta = (ta + 0.1) % 4;
        if(ta < 1){
        ta = 1;
        }
        let charCol = 0
        if(worldSeed % 3 == 0){
        charCol = 96
        }else if(worldSeed % 3 == 1){
        charCol = 192;
        }
        w.image(tilesetImage, -16, -34, 32, 48, 16 * ti, 24 * w.floor(ta) + charCol, 15, 24);
    }
    if(w.noise(select) > 0.5){
        w.image(fieldTileSet, 0, -10, area, area, 32 * w.floor(select % 4), 128, 32, 32);
    }
    let enemy = wolf[[i, j]]|0
    if(select % 11 == 0 && enemy == 0){
        wolf[[i, j]] = 1;
    }
    if(wolf[[i, j]] == 1 && (i != previ) && (j != prevj)){
        wa = (wa + 0.005) % 4;
        if(wa < 1){
        wa = 1;
        }
        let direction = keep[[i, j]]|0;
        wd = (wd + 0.005) % 4;
        if(wd < 1){
        direction = w.floor(w.random(0, 4));
        keep[[i, j]] = direction;
        wd = 1;
        }
        w.image(wolfTileSet, -32, -32, area, area, 64 * floor(wa), 64 * direction, 64, 64); //Change this later
    }
    w.pop();
    }

    w.p3_drawSelectedTile = (i, j) => {
    w.noFill();
    w.stroke(255, 0, 0, 128);
    if((i == previ + 1 || i == previ - 1 || i == previ) && (j == prevj + 1 | j == prevj - 1 || j == prevj) && !(prevj == j && previ == i)){
        w.stroke(0, 255, 0);
    }
    w.beginShape();
    w.vertex(-tw, 0);
    w.vertex(0, th);
    w.vertex(tw, 0);
    w.vertex(0, -th);
    w.endShape(w.CLOSE);

    w.noStroke();
    w.fill(50);
    w.text("tile " + [i, j], 0, 0);
    }

    w.p3_drawAfter = () => {}
  
  
  }, 'p5sketch');