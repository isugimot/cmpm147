// sketch.js - sketch code for infinite world generators
// Author: Ichiro Sugimoto
// Date: 4/30/2024
"use strict";

//Galaxy
new p5((g) => {
  let tile_width_step_main;
  let tile_height_step_main;
  let tile_rows, tile_columns;
  let camera_offset;
  let camera_velocity;
  let worldSeed1;
  let clicks1 = {};
  let expsize1 = {};
  let check1 = {};
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

  g.preload = () => {
    if (g.p3_preload) {
      g.p3_preload();
    }
  }
  let canvas;
  g.setup = () => {
    canvas = g.createCanvas(800, 400);
    canvas.parent("container1");
    canvas.mouseClicked(g._mouseClicked);

    camera_offset = new p5.Vector(-g.width / 2, g.height / 2);
    camera_velocity = new p5.Vector(0, 0);

    if (g.p3_setup) {
      g.p3_setup();
    }

    let label = g.createP();
    label.html("World key: ");
    label.parent("container1");

    let input = g.createInput("xyzzy");
    input.parent(label);
    input.input(() => {
      rebuildWorld(input.value());
    });

    g.createP("Arrow keys scroll. Clicking changes tiles.").parent("container1");

    rebuildWorld(input.value());
  }

  function rebuildWorld(key) {
    if (g.p3_worldKeyChanged) {
      g.p3_worldKeyChanged(key);
    }
    tile_width_step_main = g.p3_tileWidth ? g.p3_tileWidth() : 32;
    tile_height_step_main = g.p3_tileHeight ? g.p3_tileHeight() : 14.5;
    tile_columns = Math.ceil(g.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil(g.height / (tile_height_step_main * 2));
  }

  g._mouseClicked = () => {
    let world_pos = screenToWorld(
      [0 - g.mouseX, g.mouseY],
      [camera_offset.x, camera_offset.y]
    );

    if (g.p3_tileClicked) {
      g.p3_tileClicked(world_pos[0], world_pos[1]);
    }
    return false;
  }

  g.draw = () => {
    // Keyboard controls!
    if (g.keyIsDown(g.LEFT_ARROW)) {
      camera_velocity.x -= 1;
    }
    if (g.keyIsDown(g.RIGHT_ARROW)) {
      camera_velocity.x += 1;
    }
    if (g.keyIsDown(g.DOWN_ARROW)) {
      camera_velocity.y -= 1;
    }
    if (g.keyIsDown(g.UP_ARROW)) {
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
      [0 - g.mouseX, g.mouseY],
      [camera_offset.x, camera_offset.y]
    );
    let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

    g.background(100);

    if (g.p3_drawBefore) {
      g.p3_drawBefore();
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

    if (g.p3_drawAfter) {
      g.p3_drawAfter();
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
    g.push();
    g.translate(screen_x, screen_y);
    if (g.p3_drawSelectedTile) {
      g.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
    }
    g.pop();
  }

  // Draw a tile, mostly by calling the user's drawing code.
  function drawTile([world_x, world_y], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    g.push();
    g.translate(0 - screen_x, screen_y);
    if (g.p3_drawTile) {
      g.p3_drawTile(world_x, world_y, -screen_x, screen_y);
    }
    g.pop();
  }
  //World.js
   g.p3_preload = () => {}

  g.p3_setup = () => {}
  g.p3_worldKeyChanged = (key) => {
    worldSeed1 = XXH.h32(key, 0);
    g.noiseSeed(worldSeed1);
    g.randomSeed(worldSeed1);
    clicks1 = {};
    expsize1 = {};
    check1 = {};
  }

  function p3_tileWidth() {
    return 32;
  }
  function p3_tileHeight() {
    return 16;
  }
  
  let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

  g.p3_tileClicked = (i, j) => {
    let key = [i, j];
    clicks1[key] = 1 + (clicks1[key] | 0);
    expsize1[key] = 0;
    check1[key] = 1;
  }

  g.p3_drawBefore = () => {
    g.noStroke();
    g.noFill();
    g.fill(51);

    g.push();
    g.beginShape();
    g.vertex(-tw, 0);
    g.vertex(0, th);
    g.vertex(tw, 0);
    g.vertex(0, -th);
    g.endShape(g.CLOSE);
    g.pop();
  }

  g.p3_drawTile = (i, j) => {
    g.noStroke();
    g.noFill();
    g.fill(51);
    
    g.push();
    g.beginShape();
    g.vertex(-tw, 0);
    g.vertex(0, th);
    g.vertex(tw, 0);
    g.vertex(0, -th);
    g.endShape(g.CLOSE);
    g.pop();

    let num = 1;
    let mod = 2;
    let hash = XXH.h32("tile:" + [i, j], worldSeed1);
    if (hash % 4 == 0) {
      g.fill(255, 150);
      num = 2;
      mod = ((i * j + 53 * hash)%(2*hash)) + 53;
    } else if(hash % 3) {
      g.fill(200, 200, 0, 150);
      num = 7;
      mod = ((i * j + 101 * hash) % (hash)) + 101;
    } else {
      g.fill(100, 100, 255, 150);
      num = 4;
      mod = ((i + j + 199 * hash) % (hash/2)) + 199;
    }
    if (hash % 95 == 0 && clicks1[[i, j]] == null) {
      g.p3_tileClicked(i, j);
    }

    g.push();

    for (let l = 0; l < num; l++) {
      let x = ((worldSeed1 * (l + 1)) % mod) % tw;
      if (x % 3 == 0) {
        x = x * -1;
      }
      let y = ((worldSeed1 * (l + 1)) % mod) % th;
      if (x % 2 != 0) {
        y = y * -1;
      }
      g.ellipse(x, y, 2);
    }
    g.noFill();
    let n = clicks1[[i, j]] | 0;
    let b = (i * j * hash) % 155;
    if (n % 2 == 1) {
      g.translate(0, -10);
      g.fill(255, 255, 50 + b);
      g.ellipse(0, 0, 10, 10);
    } else if (n % 2 != 1 && n >= 2 && check1[[i, j]] == 1) {
      g.noFill();
      g.fill(255, 255, 100 + b, 255 - expsize1[[i, j]] * 8.5);
      if (expsize1[[i, j]] < 30) {
        expsize1[[i, j]] += 1;
        g.translate(0, -10);
        g.ellipse(0, 0, expsize1[[i, j]] + 10);
        g.fill(255, 165, b, 255 - expsize1[[i, j]] * 8.5);
        g.ellipse(0, 0, expsize1[[i, j]] + 5);
        g.fill(255, 0, b, 255 - expsize1[[i, j]] * 8.5);
        g.ellipse(0, 0, expsize1[[i, j]]);
        for (let l = 0; l < 8; l++) {
          let x = ((g.millis() * (l)) % mod) % (expsize1[[i,j]]/2);
          if (x % 3 == 0) {
            x = x * -1;
          }
          let y = ((g.millis() / (l)) % mod) % (expsize1[[i,j]]/2);
          if (x % 2 != 0) {
            y = y * -1;
          }
          g.fill(255, 255, 50 + b, 255 - expsize1[[i, j]] * 8.5);
          g.ellipse(x, y, 2);
        }
      }
      if (expsize1[[i, j]] >= 30) {
        expsize1[[i, j]] = 0;
        check1[[i, j]] = 0;
      }
    }
    g.pop();
  }

  g.p3_drawSelectedTile = (i, j) => {
    g.noFill();
    g.stroke(0, 255, 0, 128);

    g.beginShape();
    g.vertex(-tw, 0);
    g.vertex(0, th);
    g.vertex(tw, 0);
    g.vertex(0, -th);
    g.endShape(g.CLOSE);

    g.noStroke();
    g.fill(240);
    g.text("tile " + [i, j], 0, 0);
  }

  g.p3_drawAfter = () => {}


}, 'p5sketch');

//Glitch Screen
new p5((n) => {
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

  n.preload = () => {
    if (n.p3_preload) {
      n.p3_preload();
    }
  }
  let canvas;
  n.setup = () => {
    canvas = n.createCanvas(800, 400);
    canvas.parent("container2");
    canvas.mouseClicked(n._mouseClicked);

    camera_offset = new p5.Vector(-n.width / 2, n.height / 2);
    camera_velocity = new p5.Vector(0, 0);

    if (n.p3_setup) {
      n.p3_setup();
    }

    let label = n.createP();
    label.html("World key: ");
    label.parent("container2");

    let input = n.createInput("xyzzy");
    input.parent(label);
    input.input(() => {
      rebuildWorld(input.value());
    });

    n.createP("Arrow keys scroll. Clicking changes tiles and gives sound.").parent("container2");

    rebuildWorld(input.value());
  }

  function rebuildWorld(key) {
    if (n.p3_worldKeyChanged) {
      n.p3_worldKeyChanged(key);
    }
    tile_width_step_main = n.p3_tileWidth ? n.p3_tileWidth() : 32;
    tile_height_step_main = n.p3_tileHeight ? n.p3_tileHeight() : 14.5;
    tile_columns = Math.ceil(n.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil(n.height / (tile_height_step_main * 2));
  }

  n._mouseClicked = () => {
    let world_pos = screenToWorld(
      [0 - n.mouseX, n.mouseY],
      [camera_offset.x, camera_offset.y]
    );

    if (n.p3_tileClicked) {
      n.p3_tileClicked(world_pos[0], world_pos[1]);
    }
    return false;
  }

  n.draw = () => {
    // Keyboard controls!
    if (n.keyIsDown(n.LEFT_ARROW)) {
      camera_velocity.x -= 1;
    }
    if (n.keyIsDown(n.RIGHT_ARROW)) {
      camera_velocity.x += 1;
    }
    if (n.keyIsDown(n.DOWN_ARROW)) {
      camera_velocity.y -= 1;
    }
    if (n.keyIsDown(n.UP_ARROW)) {
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
      [0 - n.mouseX, n.mouseY],
      [camera_offset.x, camera_offset.y]
    );
    let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

    n.background(100);

    if (n.p3_drawBefore) {
      n.p3_drawBefore();
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

    if (n.p3_drawAfter) {
      n.p3_drawAfter();
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
    n.push();
    n.translate(screen_x, screen_y);
    if (n.p3_drawSelectedTile) {
      n.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
    }
    n.pop();
  }

  // Draw a tile, mostly by calling the user's drawing code.
  function drawTile([world_x, world_y], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    n.push();
    n.translate(0 - screen_x, screen_y);
    if (n.p3_drawTile) {
      n.p3_drawTile(world_x, world_y, -screen_x, screen_y);
    }
    n.pop();
  }
  //World.js
  n.p3_preload = () => {}

  n.p3_setup = ()  => {}

  let worldSeed;
  let maxF

  n.p3_worldKeyChanged = (key) => {
    worldSeed = XXH.h32(key, 0);
    maxF = 6666 * ((worldSeed % 3) + 1);
    n.noiseSeed(worldSeed);
    n.randomSeed(worldSeed);
    click = {};
    selectedr = {};
    selectedg = {};
    selectedb = {};
  }

  function p3_tileWidth() {
    return 32;
  }
  function p3_tileHeight() {
    return 16;
  }

  let [tw, th] = [p3_tileWidth(), p3_tileHeight()];
  let click = {};
  let selectedr = {};
  let selectedg = {};
  let selectedb = {};
  let freq = {};

  n.p3_tileClicked = (i, j) => {
    const audio = new(window.AudioContext || window.webkitAudioContext)();
    let check = freq[[i, j]]|0;
    if(check == 0){
      freq[[i, j]] = n.noise(i, j) * (maxF - 20) + 20;
    }
    const frequency = freq[[i, j]];
    const oscillator = audio.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.connect(audio.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audio.close();
    }, 1000);
    click[[i, j]] = 1 + (click[[i, j]] | 0);
    if(click[[i, j]] == 1){
      selectedr[[i, j]] = (frequency) % 256;
      selectedg[[i, j]] = (Math.abs(frequency - (maxF/2))) % 256;
      selectedb[[i, j]] = (Math.floor(frequency / 3)) % 256;
    }
  }

  n.p3_drawBefore = () =>{}

  n.p3_drawTile = (i, j) => {
    let hash = XXH.h32("tile:" + [i, j], worldSeed);
    if(hash % 9 == 0){
      click[[i, j]] = 1;
      freq[[i, j]] = n.noise(i, j) * (maxF - 20) + 20;
      let frequency = freq[[i, j]];
      selectedr[[i, j]] = (frequency) % 256;
      selectedg[[i, j]] = (Math.abs(frequency - (maxF/2))) % 256;
      selectedb[[i, j]] = (Math.floor(frequency / 3)) % 256;
    }
    let check = click[[i, j]]|0
    if(check == 0 && hash % 2 == 0){
      freq[[i, j]] = n.random() * (maxF - 20) + 20;
      let frequency = freq[[i, j]];
      selectedr[[i, j]] = (frequency) % 256;
      selectedg[[i, j]] = (Math.abs(frequency - (maxF/2))) % 256;
      selectedb[[i, j]] = (Math.floor(frequency / 3)) % 256;
    }
    
    let rcolor;
    if(!selectedr[[i, j]]){
      rcolor = 255;    
    } else {
      rcolor = selectedr[[i, j]];
    }
    let gcolor;
    if(!selectedg[[i, j]]){
      gcolor = 255;    
    } else {
      gcolor = selectedg[[i, j]];
    }
    let bcolor;
    if(!selectedb[[i, j]]){
      bcolor = 255;    
    } else {
      bcolor = selectedb[[i, j]];
    }
    n.fill(rcolor, gcolor, bcolor);
    
    n.push();
    n.beginShape();
    n.vertex(-tw, 0);
    n.vertex(0, th);
    n.vertex(tw, 0);
    n.vertex(0, -th);
    n.endShape(n.CLOSE);
    n.pop();
  }

  n.p3_drawSelectedTile = (i, j) => {
    n.noFill();
    n.stroke(0, 255, 0, 128);

    n.beginShape();
    n.vertex(-tw, 0);
    n.vertex(0, th);
    n.vertex(tw, 0);
    n.vertex(0, -th);
    n.endShape(n.CLOSE);

    n.noStroke();
    n.fill(50);
    n.text("tile " + [i, j] + ", freq " + freq[[i, j]], 0, 0);
  }

  n.p3_drawAfter = () => {}


}, 'p5sketch2');

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
  let canvas;
  w.setup = () => {
    canvas = w.createCanvas(800, 400);
    canvas.parent("container3");
    canvas.mouseClicked(w._mouseClicked)

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

    w.createP("Arrow keys scroll. Clicking moves character.").parent("container3");

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

  w._mouseClicked = () => {
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

  w.p3_worldKeyChanged = (key) => {
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
  if(wolf[[i, j]] == 1 && (i != 0) && (j != 0)){
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
      w.image(wolfTileSet, -32, -32, area, area, 64 * w.floor(wa), 64 * direction, 64, 64); //Change this later
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


}, 'p5sketch3');