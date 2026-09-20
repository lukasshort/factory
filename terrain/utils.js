//Returns the value at the tile, not the index in order for cross chunk neighbors
function getNeighbor(start, dx, dy, index, world, world_width, world_height, chunk_width, chunk_height) {
    const p = getPos(start, chunk_width);  
    const pn = {x: p.x+dx, y: p.y+dy}; //Position of the neighbor  
    const c = getPos(index, world_width) //Position of this chunk
    let nx = 0;
    let ny = 0;
    //{5, 1}, 1, 0, 9
    if(pn.x < 0 && c.x > 0) {pn.x = chunk_width-1; nx = -1} else if(pn.x < 0) {return false}
    if(pn.y < 0 && c.y > 0) {pn.y = chunk_height-1; ny = -1} else if(pn.y < 0) {return false}
    if(pn.x >= chunk_width && c.x < world_width-1) {pn.x = 0; nx = 1} else if(pn.x >= chunk_width) {return false}
    if(pn.y >= chunk_height && c.y < world_height-1) {pn.y = 0; ny = 1} else if(pn.y >= chunk_height) {return false}
    let chunk = getChunk(c, nx, ny, world, world_width, world_height);
    let index2 = getIndex(pn, chunk_width, chunk_height);
    return {c: getIndex({x: chunk.x, y: chunk.y},world_width, world_height), i: index2, h1: chunk.h1[index2], h2: chunk.h2[index2], v3: chunk.v3[index2]};
}

function getPos(index, chunk_width) {
    return {x: index % chunk_width, y: (index - index % chunk_width)/chunk_width}
}

function getIndex(pos, chunk_width, chunk_height) {
    if(pos.x < 0 || pos.y < 0 || pos.x >= chunk_width || pos.y >= chunk_height) {return false}
    else {return pos.x + pos.y * chunk_width}
}

//Taking indexes, returning num
function getDist(a, b) {
    return Math.hypot(a.x-b.x, a.y-b.y);
}

function genHeights(chunk, index, world, world_width, world_height, chunk_width, chunk_height) {
    let start = Math.floor(Math.random() * 200);
    for(let i = 0; i < chunk_width * chunk_height; i++) {
        const p1 = getNeighbor(i, -1, 0, index, world, world_width, world_height, chunk_width, chunk_height); //Neighbor to the left
        const p2 = getNeighbor(i, 0, -1, index, world, world_width, world_height, chunk_width, chunk_height);  //Neighbor to the top
        let parent = (p1!== false && p2!== false ? (p1.h1+p2.h1)/2 : (p1==false&&p2!==false? p2.h1 : (p2==false&&p1!==false ? p1.h1 : start)));
        let dif = 30;
        let r = parent - (Math.random() * dif) + (dif/2);
        if(r <= 0) {r = 1}
        if(r >= 200) {r = 200;}
        chunk.h1[i] = r;
    }
}

function genCorners(world, world_width, world_height, chunk_width, chunk_height) {
    let newWorld = world;
    for(let c = 0; c < world.length; c++) {
        for(let t = 0; t < chunk_width*chunk_height; t++) {
            let v2 = getNeighbor(t, 1, 0, c, world, world_width, world_height, chunk_width, chunk_height).h1;
            let v3 = getNeighbor(t, 1, 1, c, world, world_width, world_height, chunk_width, chunk_height).h1;
            let v4 = getNeighbor(t, 0, 1, c, world, world_width, world_height, chunk_width, chunk_height).h1;
            let v22 = getNeighbor(t, 0, -1, c, world, world_width, world_height, chunk_width, chunk_height).v3;
            let v42 = getNeighbor(t, -1, 0, c, world, world_width, world_height, chunk_width, chunk_height).v3;
            
            if(v22 === undefined) {v22 = world[c].h1[t]}
            if(v42 === undefined) {v42 = world[c].h1[t]}
            if(v2 === undefined) {v2 = v22}
            if(v4 === undefined) {v4 = v42}
            if(v3 === undefined) {v3 = (v2+v4)/2}
            newWorld[c].v2[t] = v2;
            newWorld[c].v3[t] = v3;
            newWorld[c].v4[t] = v4;
            newWorld[c].v0[t] = (v2+v3+v4)/3;
        }
    }
    return newWorld;
}

function noiseMap() {
    
}

function getChunk(start, dx, dy, world, world_width, world_height) {
    let p = start;
    let pn = {x: p.x + dx,y: p.y + dy};
    if(pn.x < 0 || pn.y < 0 || pn.x >= world_width || pn.y >= world_height) {return 3}
   
    return world[getIndex(pn, world_width, world_height)];
}

function convertTilePos(p, panx, pany, canvas, w, h, o, v = 0) {
    let x = (o.x) + (panx) + (canvas.clientWidth/4) + (p.x*(w/2))+(-p.y*(w/2));
    let y = (o.y) + (pany) + (canvas.clientHeight/2 + (-250)) + (p.x*(h/2))+(p.y*(h/2)) - (v/2);
    return {x: x, y: y}
}

function updateTile(value, index, chunk, world, world_width, world_height, chunk_width, chunk_height) {
    let chunkI = getIndex({x: chunk.x, y: chunk.y}, world_width, world_height);
    let clampedV = value;
    if(value > 200) {clampedV = 200}
    chunk.h1[index] = clampedV;
    console.log(chunk);
    let open = [];
    let closed = new Set();
    let openSet = new Set();
    let p = getPos(index, world_width);
    let start = {v: clampedV, c: chunkI, i:index, x: p.x, y: p.y};
    open.push(start);
    openSet.add(`${chunkI}:${p.x},${p.y}`);

    const dirs = [
        {x: -1, y: 0},
        {x: 1, y: 0},
        {x: 0, y: 1},
        {x: 0, y: -1},
    ];
    let steps = 0;
    let dif = 30;
    const MAX_STEPS = 20000; // safety net so a bad distance calc can't ever hang the tab
    while(open.length > 0 && steps < MAX_STEPS) {
        steps ++;
        let current = open.shift();
        openSet.delete(`${current.c}:${current.x},${current.y}`);
        for(let d of dirs) {
            let sPos = getGlobalPos(start.c, start.i, world_width, chunk_width, chunk_height);
            let cPos = getGlobalPos(current.c, current.i, world_width, chunk_width, chunk_height);
            const g = getDist(sPos, cPos, chunk_width*world_width);
            if(g > 10) {continue}
            let na = getNeighbor(current.i, d.x, d.y, current.c, world, world_width, world_height, chunk_width, chunk_height);
            if(na === false) {continue}
            let pos = getPos(na.i, chunk_width);
            let nkey = `${na.c}:${pos.x},${pos.y}`;

            if(!closed.has(nkey) && !openSet.has(nkey)) {
                let n = {v:na.h1, c: na.c, i: na.i, x: pos.x, y: pos.y};
                
                let newv = current.v - ((Math.random() * dif));
                if(n.v > newv) {closed.add(nkey);continue};
                open.push(n);
                openSet.add(nkey);
                world[n.c].h1[n.i] = newv;
                n.v = newv;
            }
        }
        closed.add(`${current.c}:${current.x},${current.y}`);
    }
    if (steps >= MAX_STEPS) {
        console.warn('updateTile: hit MAX_STEPS safety cap, propagation may be incomplete');
    }
    world = genCorners(world, world_width, world_height, chunk_width, chunk_height);
}

function getGlobalPos(c, i, world_width, chunk_width, chunk_height) {
    const cp = getPos(c, world_width);   // which chunk, in chunk-grid coords
    const tp = getPos(i, chunk_width);    // which tile, in local coords
    return {
        x: cp.x * chunk_width + tp.x,
        y: cp.y * chunk_height + tp.y
    };
}

function getGlobalIndex(pos, world_width, world_height, chunk_width, chunk_height) {
    return {
        c: (pos.x - (pos.x % chunk_width))/chunk_width + ((pos.y - (pos.y % chunk_height))/chunk_height)*world_width,
        i: pos.x % chunk_width + (pos.y % chunk_height) * chunk_width
    }
}

export { genHeights , genCorners, getNeighbor , convertTilePos , updateTile , getGlobalPos , getGlobalIndex};