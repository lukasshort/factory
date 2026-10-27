// import { 
//     genHeights , 
//     getNeighborData , 
//     getGlobalPos , 
//     getGlobalIndex ,
//     getData ,
//     getIndex ,
//     getRelativePos ,
// } from "./terrain/utils.js";

import { World , Chunk } from "./terrain/world.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let mouse = {
    x: 0,
    y: 0
}
let hover = {
    x: 20,
    y: 20,
    z: 100
};

let panx = 0;
let pany = 0;

let panleft = false;
let panright = false;
let panup = false;
let pandown = false;

let zoomin = false;
let zoomout = false;

let rotate = false;

let r = 0;

let zoom = 2;

const TILE_WIDTH = 35;
const TILE_HEIGHT = 15;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("keypress", keyPressHandler);
document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
document.addEventListener("mousedown", () => {
    //let gIndex = getGlobalIndex({x:Math.floor(hover.x), y:Math.floor(hover.y)}, world);
    //updateTile(hover.z + 30, gIndex.i, world.chunks[gIndex.c], world);
});

const chunk_width = 6;
const chunk_height = 6;

const world_width = 4;
const world_height = 4;

//Initialize chunk
let world = new World(ctx, world_width, world_height, chunk_width, chunk_height, 4);

//last time
let lt = window.performance.now();

function step(timestamp) {
    //delta time
    let dt = (timestamp - lt) / 1000;
    dt = Math.min(dt, 0.1);
    lt = timestamp;
    draw(dt);
    requestAnimationFrame(step);
}

function draw(dt) {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    world.renderTerrain(panx, pany, TILE_WIDTH, TILE_HEIGHT, zoom, canvas, r);
    update();
}

function update() {
    // let nx = (mouse.x - panx*2 - canvas.clientWidth/2)/TILE_WIDTH;
    // let ny = (mouse.y - pany*2 +20)/tile_height;
    // hover.x = nx + ny;
    // hover.y = ny - nx;
    // if(hover.x < 0) {hover.x = 0}
    // if(hover.y < 0) {hover.y = 0}
    // if(hover.x > (world.width)*world.chunk_width-1) {hover.x = (world.width)*world.chunk_width-1}
    // if(hover.y > (world.height)*world.chunk_height-1) {hover.y = (world.height)*world.chunk_height-1}
    // const gIndex = getGlobalIndex({x:Math.floor(hover.x),y:Math.floor(hover.y)}, world);
    // if(gIndex !== undefined){hover.z = world.chunks[gIndex.c].h1[gIndex.i]};

    if(panleft) {panx -= 2}
    if(panright) {panx += 2}
    if(panup) {pany -= 1}
    if(pandown) {pany += 1}

    if(rotate) {r += 1}

    if(zoomin) {zoom -= 0.05}
    if(zoomout) {zoom += 0.05}
    
}


function keyDownHandler(e) {
    switch(e.key.toLowerCase()) {
        case "a":
            panleft = true;
            break;
        case "d":
            panright = true;
            break;
        case "w":
            panup = true;
            break;
        case "s":
            pandown = true;
            break;
        case "z":
            rotate = true;
            break;
        case "q":
            zoomin = true;
            break;
        case "e":
            zoomout = true;
            break;
    }
}
function keyUpHandler(e) {
    switch(e.key.toLowerCase()) {
        case "a":
            panleft = false;
            break;
        case "d":
            panright = false;
            break;
        case "w":
            panup = false;
            break;
        case "s":
            pandown = false;
            break;
        case "z":
            rotate = false;
            break;
        case "q":
            zoomin = false;
            break;
        case "e":
            zoomout = false;
            break;
    }
}
function keyPressHandler(e) {
    switch(e.key.toLowerCase()) {
        case "c":
            break;
    }
}

requestAnimationFrame(step);