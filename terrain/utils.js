//Returns the value at the tile, not the index in order for cross chunk neighbors
function getNeighborData(t, dx, dy, world) {
    return world.getNode(t.x + dx, t.y + dy);
}

function getChunkKey(x, y) {
    return `C${x}_${y}`;
}

function getData(i, c, world) {
    //const pos = getPos(c, world.width);
    const src = world.chunks[c];
    return {
        i: i,
        c: c,
        h1: src.h1[i]}
}

function getRelativePos(index, chunk_width) {
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

function genHeights(index, chunk, world) {
    const start = Math.floor(Math.random() * 200);
    const n = {i: index, c: chunk, h1: false};
    for(let i = 0; i < world.chunk_width * world.chunk_height; i++) {
        const p1 = getNeighborData(n, -1, 0, world); //Neighbor to the left
        const p2 = getNeighborData(n, 0, -1, world);  //Neighbor to the top
        let parent = (p1!== false && p2!== false ? (p1.h1+p2.h1)/2 : (p1==false&&p2!==false? p2.h1 : (p2==false&&p1!==false ? p1.h1 : start)));
        let dif = 40;
        let r = vary(parent, dif);
        chunk.h1[i] = clamp(r, 1, 200);
    }
}

function vary(parent, dif) {
    return parent - (Math.random() * dif) + (dif/2);
}

function clamp(a, min, max) {
    let b = a;
    if(a < min) {b = min}
    if(a > max) {b = max}
    return b;
}

function noiseMap(w, h, cw, ch) {
    let noise = {
        chunks: [],
        width: w,
        height: h,
        chunk_width: cw,
        chunk_height: ch
    };
    //Layer 1
    
}

function getGlobalPos(c, i, world) {
    const cp = getPos(c, world.width);   // which chunk, in chunk-grid coords
    const tp = getPos(i, world.chunk_width);    // which tile, in local coords
    return {
        x: cp.x * world.chunk_width + tp.x,
        y: cp.y * world.chunk_height + tp.y
    };
}

function getGlobalIndex(pos, world) {
    return {
        c: (pos.x - (pos.x % world.chunk_width))/world.chunk_width + ((pos.y - (pos.y % world.chunk_height))/world.chunk_height)*world.width,
        i: pos.x % world.chunk_width + (pos.y % world.chunk_height) * world.chunk_width
    }
}

export { 
    getNeighborData ,
    getChunkKey ,
    genHeights , 
    getGlobalPos , 
    getGlobalIndex , 
    getData ,
    getIndex ,
    getRelativePos 
};
