import {
    getData , 
    getChunkKey ,
    getIndex , 
    getRelativePos ,
    getNeighborData ,
} from "./utils.js";

class World {
    //Context, width, height, chunk width, chunk height
    constructor(_ctx, _w, _h, _cw, _ch) {
        this.ctx                = _ctx;
        this.w                  = _w;
        this.h                  = _h;
        this.cw                 = _cw;
        this.ch                 = _ch;

        this.chunks             = [];
        for(let i = 0; i < this.w*this.h; i++) {
            console.log("add1")
            const p = getRelativePos(i, this.w);
            this.addChunk(p.x, p.y);
        }
        console.log(this.chunks);
    }

    addChunk(x, y) {
        this.chunks.push(new Chunk(this.ctx, this.cw, this.ch, x, y));
    }

    getChunk(x, y) {
        const key = getChunkKey(x, y);
        return this.chunks.find(c => c.key == key);
    }

    getNode(x, y) {
        const rx = x % this.cw;
        const ry = y % this.ch;
        const cx = (x - rx)/this.cw;
        const cy = (y - ry)/this.ch;
        const c = this.getChunk(cx, cy);
        const i = getIndex({x: rx, y: ry}, this.cw, this.ch);
        if(c) {return c.getNode(i)}
        else {return false}
    }
    getRenderPos(n, panx, pany, tile_width, tile_height, canvas, o, r) {
        //console.log(tile_width, tile_height)
        const theta = r/100;
        const dx = 2.5;
        const dy = 2.5;
        const rx = ((n.x-dx) * Math.cos(theta)) - ((n.y-dy) * Math.sin(theta));
        const ry = ((n.x-dx) * Math.sin(theta)) + ((n.y-dy) * Math.cos(theta));
        if(n === false) {return false}
        let x = (o.x + panx) + (canvas.clientWidth/2) + (rx * tile_width)  - (ry * tile_width); // + (n.c.x * tile_width * n.c.w);
        let y = (o.y + pany) + (200)                  + (ry * tile_height) + (rx * tile_height) - (n.h1* 0.1); // + (n.c.y * tile_height * n.c.h); 
        return {x: x, y: y, h1: n.h1}   
    }   
    
    renderTerrain(panx, pany, tile_width, tile_height, zoom, canvas, r) {
        const z_tile_width = tile_width * zoom;
        const z_tile_height = tile_height * zoom;
        for(let c = 0; c < this.chunks.length; c++) {
            let origin = {x: panx, y: pany};

            this.ctx.fillStyle = "gray";
            this.ctx.fillRect(origin.x+50, origin.y+50, 10, 10);

            for(let i = 0; i < this.cw*this.ch; i++) {

                const n = this.chunks[c].getNode(i);
                const corners = this.getCornersData(n);
                const t1 = this.getRenderPos(corners[0], panx, pany, z_tile_width, z_tile_height, canvas, origin, r);
                const t2 = this.getRenderPos(corners[1], panx, pany, z_tile_width, z_tile_height, canvas, origin, r);
                const t3 = this.getRenderPos(corners[2], panx, pany, z_tile_width, z_tile_height, canvas, origin, r);
                const t4 = this.getRenderPos(corners[3], panx, pany, z_tile_width, z_tile_height, canvas, origin, r);
                const t0 = this.getRenderPos(corners[4], panx, pany, z_tile_width, z_tile_height, canvas, origin, r);
                let faces = [
                    [t1,t2,t0],
                    [t2,t3,t0],
                    [t3,t4,t0],
                    [t4,t1,t0]
                ];
                faces = faces.filter(f => f.every(p => !Number.isNaN(p.x) && !Number.isNaN(p.y)));
                for(let f of faces) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(f[0].x, f[0].y);
                    for(let n of f) {this.ctx.lineTo(n.x, n.y)}
                    this.ctx.closePath();

                    const avg = f.reduce((a, b) => a += b.h1, 0)/f.length;
                    this.ctx.fillStyle = `rgb(${avg},${avg},${avg})`;
                    this.ctx.fill();

                    // BORDERS
                    // this.ctx.strokeStyle = "black";
                    // this.ctx.stroke();

                    // DEBUG
                    // this.ctx.fillStyle = "red";
                    // this.ctx.fillRect(t1.x-10, t1.y-10, 10, 10);
                    // this.ctx.fillStyle = "green";
                    // this.ctx.fillRect(t2.x, t2.y-10, 10, 10);
                    // this.ctx.fillStyle = "blue";
                    // this.ctx.fillRect(t3.x, t3.y, 10, 10);
                    // this.ctx.fillStyle = "yellow";
                    // this.ctx.fillRect(t4.x-10, t4.y, 10, 10);
                    // this.ctx.fillStyle = "orange";
                    // this.ctx.fillRect(t0.x-5, t0.y-5, 10, 10);
                }
            }
        }
    }
    getCornersData(t) {
        let corners = [
            t,
            getNeighborData(t, 1, 0, this),
            getNeighborData(t, 1, 1, this),
            getNeighborData(t, 0, 1, this)
        ];

        const trueCorners = corners.filter(a => a !== false);
        if(trueCorners.length == 4) {
            corners.push({
                x: t.x + 0.5,
                y: t.y +0.5,
                i: t.i+0.5, 
                c: t.c, 
                h1: trueCorners.reduce((a,b) => a += b.h1, t.h1)/(trueCorners.length)
            });
        } else {corners.push(false)}

        return corners;
    }
}

class Chunk {
    //Context, width, height
    constructor(_ctx, _w, _h, _x, _y) {
        this.ctx                = _ctx;
        this.w                  = _w;
        this.h                  = _h;

        this.x                  = _x;
        this.y                  = _y;

        this.key                = getChunkKey(this.x, this.y);
        console.log(this.key);

        this.h1                 = new Uint8Array(this.w * this.h);
        this.h1.fill(0);

        for(let i = 0; i < this.w * this.h; i ++) {
            this.h1[i] = Math.round((Math.random() * 255))
        }
    }

    getNode(i) {
        const p = getRelativePos(i, this.w);
        return {
            x: p.x + (this.x * this.w),
            y: p.y + (this.y * this.h),
            i: i,
            c: this,
            h1: this.h1[i]
        };
    }
}

export { World , Chunk };