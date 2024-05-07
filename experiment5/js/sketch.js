// sketch.js - sketch code for evolutionary impressions
// Author: Ichiro Sugimoto
// Date: 5/7/2024
/* exported preload, setup, draw */
/* global memory, dropper, restart, rate, slider, activeScore, bestScore, fpsCounter */
/* global p4_inspirations, p4_initialize, p4_render, p4_mutate */

let bestDesign;
let currentDesign;
let currentScore;
let currentInspiration;
let currentCanvas;
let currentInspirationPixels;

function preload() {
  

  let allInspirations = p4_inspirations();

  for (let i = 0; i < allInspirations.length; i++) {
    let insp = allInspirations[i];
    insp.image = loadImage(insp.assetUrl);
    let option = document.createElement("option");
    option.value = i;
    option.innerHTML = insp.name;
    dropper.appendChild(option);
  }
  dropper.onchange = e => inspirationChanged(allInspirations[e.target.value]);
  currentInspiration = allInspirations[0];

  restart.onclick = () =>
    inspirationChanged(allInspirations[dropper.value]);
}

function inspirationChanged(nextInspiration) {
  currentInspiration = nextInspiration;
  currentDesign = undefined;
  memory.innerHTML = "";
  setup();
}

function setup() {
  currentCanvas = createCanvas(width, height);
  currentCanvas.parent(document.getElementById("active"));
  currentScore = Number.NEGATIVE_INFINITY;
  currentDesign = p4_initialize(currentInspiration);
  bestDesign = currentDesign;
  image(currentInspiration.image, 0,0, width, height);
  loadPixels();
  currentInspirationPixels = pixels;
}

function evaluate() {
  loadPixels();

  let error = 0;
  let n = pixels.length;
  
  for (let i = 0; i < n; i++) {
    error += sq(pixels[i] - currentInspirationPixels[i]);
  }
  return 1/(1+error/n);
}



function memorialize() {
  let url = currentCanvas.canvas.toDataURL();

  let img = document.createElement("img");
  img.classList.add("memory");
  img.src = url;
  img.width = width;
  img.heigh = height;
  img.title = currentScore;

  document.getElementById("best").innerHTML = "";
  document.getElementById("best").appendChild(img.cloneNode());

  img.width = width / 2;
  img.height = height / 2;

  memory.insertBefore(img, memory.firstChild);

  if (memory.childNodes.length > memory.dataset.maxItems) {
    memory.removeChild(memory.lastChild);
  }
}

let mutationCount = 0;

function draw() {
  
  if(!currentDesign) {
    return;
  }
  randomSeed(mutationCount++);
  currentDesign = JSON.parse(JSON.stringify(bestDesign));
  rate.innerHTML = slider.value;
  p4_mutate(currentDesign, currentInspiration, slider.value/100.0);
  
  randomSeed(0);
  p4_render(currentDesign, currentInspiration);
  let nextScore = evaluate();
  activeScore.innerHTML = nextScore;
  if (nextScore > currentScore) {
    currentScore = nextScore;
    bestDesign = currentDesign;
    memorialize();
    bestScore.innerHTML = currentScore;
  }
  
  fpsCounter.innerHTML = Math.round(frameRate());
}

function p4_inspirations() {
  return [
    {
      name: "Wave",
      scale: 16,
      color: "bw",
      layer: 100,
      num: 0,
      assetUrl: "ocean_bw.jpg",
      credit: "https://i.pinimg.com/originals/6b/68/f8/6b68f85c57886fdd19e944917cec683d.jpg"
    },
    {
      name: "Hill",
      scale: 2,
      color: "color",
      layer: 100,
      num: 1,
      assetUrl: "hill.jpg",
      credit: "https://t4.ftcdn.net/jpg/04/41/86/63/360_F_441866384_OnZoKXpqKJ5Qgym8ZGC1E0d5uPHGbuZz.jpg"
    },
    {
      name: "Desert",
      scale: 1,
      color: "color",
      layer: 3,
      num: 2,
      assetUrl: "desert.jpg",
      credit: "https://sevennaturalwonders.org/wp-content/uploads/2023/11/Sahara-Desert-sand-dunes.jpg"
    }
  ];
}

function p4_initialize(inspiration) {
  resizeCanvas(inspiration.image.width / inspiration.scale, inspiration.image.height / inspiration.scale);
  
  let design = {
    bg: [155, 155, 155, 255],
    fg: []
  }
  
  for(let i = 0; i < inspiration.layer; i++) {
    let x = ((inspiration.layer - i) / 20) + 1;
    if(inspiration.num == 0){
      let layer = {
        fill: [155, 155, 155, 255],
        coordinate: [0.1 * x, 0.1 * x, 0.1 * x, 0.1 * x, 0.1 * x, 0.1 * x]
      }
      design.fg.push(layer)
    }else if(inspiration.num == 1){
      let layer = {
        fill: [124, 252, 0, 155],
        coordinate: [0.5, 0.55, 0.6, 0.55, 0.5]
      }
      design.fg.push(layer)
    }else if(inspiration.num == 2){
      let layer = {
        fill: [155, 155, 155, 255],
        coordinate: [0.1 * x, 0.1 * x, 0.1 * x, 0.1 * x, 0.1 * x, 0.1 * x, 0.1 * x]
      }
      design.fg.push(layer)
    }
  }
  return design;
}

function p4_render(design, inspiration) {
  background(design.bg);
  noStroke();
  for(let layer of design.fg) {
    fill(layer.fill);
    
    beginShape();
    vertex(0, height);
    for(let i = 0; i < layer.coordinate.length; i++) {
      vertex(
        (width * i) / (layer.coordinate.length - 1),
        (1 - layer.coordinate[i]) * height
      )
    }
    vertex(width, height);
    endShape(CLOSE);
  }
}

function p4_mutate(design, inspiration, rate) {
  design.bg = mut(design.bg, 2 * rate, inspiration.color);
  for(let layer of design.fg) {
    layer.fill = mut(layer.fill, 2 * rate, inspiration.color);
    for(let i = 0; i < layer.coordinate.length; i++){
      layer.coordinate[i] += 0.01 * randomGaussian(0, 1) * rate;
      layer.coordinate[i] = constrain(layer.coordinate[i], 0, 1);
    }
  }

}

function mut(rgb, rate, color) {
  if(color == "bw"){
    rgb[0] += rate * randomGaussian(0, 1);
    rgb[1] = rgb[0];
    rgb[2] = rgb[1];
  } else {
    rgb [0] += rate * randomGaussian(0, 1);
    rgb[1] += rate * randomGaussian(0, 1);
    rgb[2] += rate * randomGaussian(0, 1);
    rgb[3] += rate * randomGaussian(0, 1);
  }
  return rgb;
}