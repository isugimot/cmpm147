// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file
let seed = 0;

const skyColor = "#527b9c";
const cloudColor = "#cccccc";
const branchColor = "#3d2e06";

function resizeScreen() {
  centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  // redrawCanvas(); // Redraw everything based on new size
}

$("#reimagine").click(function() {
  seed++;
});

// setup() function is called once when the program starts
function setup() {
  // place our canvas, making it fit our container
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");
  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();
}

// draw() function is called repeatedly, it's the main animation loop
function draw() {
  randomSeed(seed);

  background(255);
  noStroke()
  fill(skyColor);
  rect(0, 0, width, height);

  stroke("#858290")
  strokeWeight(2)
  fill(cloudColor);
  const clouds = 20 * random(6, 8);
  const scrub = mouseX/width;
  for (let i = 0; i < clouds; i++){
    let z = random();
    let w = random(0, 3*width/4);
    let h = random(10, 20);
    let x = width * ((random() + (scrub/50 + millis() / 500000.0) / z) % 2);
    let t = height/h;
    let y = random(i * height/clouds, (i + 1) * height/clouds);
    ellipse(x, y, width - w, t);
  }
  
  noStroke()
  fill(branchColor);
  beginShape();
  vertex(width, height);
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    let x = width - random(i * 10 , (i+1) * 10);
    let y = height - random((i * height/2/steps), ((i * height/2/steps)));
    vertex(x, y);
    let check = i
    let ran = random(1, 10);
    if(check%3 == 0 && ran > 5){ 
      vertex(x + width/5, y - height/10);
    }
  }
  for (let i = steps; i > 0; i--) {
    let x = width - 50 - random(i * 5 , (i+1) * 5);
    let y = height - random((i * height/2/steps), ((i * height/2/steps)));
    vertex(x, y);
    let check = i
    let ran = random(1, 10);
    if(check%3 == 0 && ran > 5){ 
      vertex(x - width/5, y - height/10);
    }
  }
  vertex(4*width/5, height);
  endShape(CLOSE);
  
  fill(219, 157, 0, 15);
  rect(0, 0, width, height);
}