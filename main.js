import { genHeights , genCorners, getNeighbor , convertTilePos , updateTile , getGlobalPos , getGlobalIndex } from "./terrain/utils.js";
import { Tile } from "./Tile.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let mousex = 0;
let mousey = 0;
let hover = {
        x: 20,
        y: 20,
        z: 100
    };

let panx = 0;
let pany = 0;
//let zoom = 1;

let panleft = false;
let panright = false;
let panup = false;
let pandown = false;

let zoom = 1;

const tile_width = 30*zoom;
const tile_height = 15*zoom;
const tile_gap = 0;
const full_tile = tile_width + tile_gap;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("keypress", keyPressHandler);
document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mousex = e.clientX - rect.left;
    mousey = e.clientY - rect.top;

    let nx = (mousex - panx*2 - canvas.clientWidth/2)/tile_width;
    let ny = (mousey - pany*2 -50)/tile_height;
    hover.x = nx + ny;
    hover.y = ny - nx;
    let gIndex = getGlobalIndex({x:Math.floor(hover.x), y: Math.floor(hover.y)}, world_width, world_height, chunk_width, chunk_height);
    //console.log(gIndex);
    if(gIndex !== undefined){hover.z = world[gIndex.c].h1[gIndex.i]};
});
document.addEventListener("mousedown", () => {
    let gIndex = getGlobalIndex({x:Math.floor(hover.x), y:Math.floor(hover.y)}, world_width, world_height, chunk_width, chunk_height);
    console.log(gIndex);
    updateTile(hover.z + 2, gIndex.i, world[gIndex.c], world, world_width, world_height, chunk_width, chunk_height);
});

const chunk_width = 8;
const chunk_height = 8;

const world_width = 4;
const world_height = 4;

//Initialize chunk
let world = [];
for(let i = 0; i < world_width*world_height; i++) {
    let chunk = {
        x: i % world_width,
        y: (i - i % world_width) /world_height,
        h1: new Uint8Array(chunk_width * chunk_height),
        h2: new Uint8Array(chunk_width * chunk_height),
        v0: new Uint8Array(chunk_width * chunk_height),
        v2: new Uint8Array(chunk_width * chunk_height),
        v3: new Uint8Array(chunk_width * chunk_height),
        v4: new Uint8Array(chunk_width * chunk_height)
    }
    world.push(chunk);
    genHeights(chunk, i, world, world_width, world_height, chunk_width, chunk_height);
}
world = genCorners(world, world_width, world_height, chunk_width, chunk_height);

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
    renderTerrain();
    update();
}

function update() {
    if(panleft) {panx -= 2}
    if(panright) {panx += 2}
    if(panup) {pany -= 1}
    if(pandown) {pany += 1}
}

function getPos(i, chunk_width, chunk_height) {
    return {x: i % chunk_width, y: (i - i % chunk_width)/chunk_height};
}

function getIndex(p, chunk_width) {
    return p.x + p.y * chunk_width;
}
function renderTerrain() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    let size = 15;
    for(let c = 0; c < world.length; c++) {
        for(let i = 0; i < chunk_width*chunk_height; i++) {
            let x = ((c % world_width)*chunk_width + (i % chunk_width));
            let y = (Math.floor(c/world_width)*chunk_width + Math.floor(i/chunk_width));
            ctx.fillStyle = `rgb(${world[c].h1[i]},${world[c].h1[i]},${world[c].h1[i]})`;
            ctx.fillRect(x*size, y*size, size, size);
        }
        //let o = convertTilePos({x: world[c].x, y: world[c].y}, panx, pany, canvas, chunk_width*tile_width, chunk_width*tile_height, {x: 0, y: 0});
        // for(let i = 0; i < chunk_width*chunk_height; i++) {
        //     let gPos = getGlobalPos(c, i, world_width, chunk_width, chunk_height);
        //     let v = world[c].h1[i] *1;
        //     let p = getPos(i, chunk_width, chunk_height);
        //     let t = convertTilePos(p, panx, pany, canvas, tile_width, tile_height, o, v);
        //     let v2 = world[c].v2[i];
        //     let v3 = world[c].v3[i];
        //     let v4 = world[c].v4[i];
        //     let v0 = world[c].v0[i];
        //     let t2 = convertTilePos({x:p.x+1,y:p.y}, panx, pany, canvas, tile_width, tile_height, o, v2);
        //     let t3 = convertTilePos({x:p.x+1,y:p.y+1}, panx, pany, canvas, tile_width, tile_height, o, v3);
        //     let t4 = convertTilePos({x:p.x,y:p.y+1}, panx, pany, canvas, tile_width, tile_height, o, v4);
        //     let t0 = convertTilePos({x:p.x+0.5,y:p.y+0.5}, panx, pany, canvas, tile_width, tile_height, o, v0);
        //     let g2 = convertTilePos({x:p.x+1,y:p.y}, panx, pany, canvas, tile_width, tile_height, o, 0);
        //     let g3 = convertTilePos({x:p.x+1,y:p.y+1}, panx, pany, canvas, tile_width, tile_height, o, 0);
        //     let g4 = convertTilePos({x:p.x,y:p.y+1}, panx, pany, canvas, tile_width, tile_height, o, 0);
        //     let tiles = [t0,t,t2,t3,t4,g2,g3,g4];
        //     let vals = [v0,v,v2,v3,v4,0,0,0];
        //     let faces = [[1,0,2],[2,0,3],[3,0,4],[4,0,1]];
        //     if(world[c].x*chunk_width + p.x >= world_width*chunk_width-1) {faces.push([2,5,6,3])}
        //     if(world[c].y*chunk_height + p.y >= world_height*chunk_height-1) {faces.push([3,6,7,4])}
        //     for(let f = 0; f < faces.length; f++) {
        //         ctx.beginPath();
        //         ctx.moveTo(tiles[faces[f][0]].x, tiles[faces[f][0]].y);
        //         for(let n = 1; n < faces[f].length; n++) {
        //             ctx.lineTo(tiles[faces[f][n]].x, tiles[faces[f][n]].y);
        //         }
        //         ctx.closePath();
        //         let avg = (vals[faces[f][0]]+vals[faces[f][1]]+vals[faces[f][2]])/3;
        //         ctx.fillStyle = `rgb(${avg},${avg},${avg})`;
        //         if(Math.floor(hover.x) == gPos.x && Math.floor(hover.y) == gPos.y) {ctx.fillStyle = "rgba(146, 36, 36, 1)"}
        //         ctx.fill();
        //     }
        // }
    }
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
    }
}
function keyPressHandler(e) {
    switch(e.key.toLowerCase()) {
        case "c":
            break;
    }
}

requestAnimationFrame(step);