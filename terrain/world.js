import {
    getData , 
    getChunkKey ,
    getNodeKey ,
    getIndex , 
    getRelativePos ,
    getNeighborData ,
} from "./utils.js";

class World {
    //Context, width, height, chunk width, chunk height
    constructor(_ctx, _w, _h, _cw, _ch, _l) {
        this.ctx                = _ctx;
        this.w                  = _w;
        this.h                  = _h;
        this.cw                 = _cw;
        this.ch                 = _ch;

        this.layers             = [];
        for(let i = 0; i < _l; i++) {
            this.layers.push(new NoiseLayer((this.cw)*Math.pow(2, i), 255*((i+1)/_l)));
            this.layers[i].addNode(0, 0);
        }

        this.chunks             = [];
        for(let i = 0; i < this.w*this.h; i++) {
            console.log("add1")
            const p = getRelativePos(i, this.w);
            this.addChunk(p.x, p.y);
        }
        console.log(this.chunks);
        this.debugCols          = ["green", "blue", "red", "yellow", "orange", "purple"];
    }

    addChunk(x, y) {
        this.chunks.push(new Chunk(this.ctx, this.cw, this.ch, x, y, this));
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
        let y = (o.y + pany) + (300)                  + (ry * tile_height) + (rx * tile_height) - (n.h1* 0.1); // + (n.c.y * tile_height * n.c.h); 
        return {x: x, y: y, h1: n.h1}   
    }   
    
    renderTerrain(panx, pany, tile_width, tile_height, zoom, canvas, r) {
        const z_tile_width = tile_width * zoom;
        const z_tile_height = tile_height * zoom;

        const origin = {x: panx, y: pany};

        this.ctx.fillStyle = "gray";
        this.ctx.fillRect(origin.x+50, origin.y+50, 10, 10);

        for(let c = 0; c < this.chunks.length; c++) {
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

        for(let l = 0; l < this.layers.length; l++) {
            for(let n = this.layers[l].nodes.length - 1; n >= 0; n--) {
                //console.log(l, n);
                const node = this.layers[l].nodes[n];
                
                const node_a = {x: node.x-0.5, y: node.y-0.5, h1: node.h1}
                // if(node.x <= 0) {node_a.x -= 0.5} else {node_a.x += 0.5}
                // if(node.y <= 0) {node_a.y -= 0.5} else {node_a.y += 0.5}
                
                const node_w = node.f*1.3 + 2;
                const color = this.debugCols[l];
                
                let t = this.getRenderPos(node_a, panx, pany, z_tile_width, z_tile_height, canvas, origin, r);
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(t.x - node_w/2, t.y - node_w/2, node_w, node_w);
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
                y: t.y + 0.5,
                i: t.i + 0.5, 
                c: t.c, 
                h1: trueCorners.reduce((a,b) => a += b.h1, t.h1)/(trueCorners.length)
            });
        } else {corners.push(false)}

        return corners;
    }
}

class Chunk {
    //Context, width, height
    constructor(_ctx, _w, _h, _x, _y, _world) {
        this.ctx                = _ctx;
        this.w                  = _w;
        this.h                  = _h;

        this.x                  = _x;
        this.y                  = _y;

        this.key                = getChunkKey(this.x, this.y);
        console.log(this.key);

        this.h1                 = new Uint8Array(this.w * this.h);
        this.h1.fill(0);

        //Initialize Chunk Nodes
        for(let i = 0; i < this.w * this.h; i ++) {
            let p = getRelativePos(i, this.w);
            p.x += (this.x * this.w);
            p.y += (this.y * this.h);
            console.log(_world);
            for(let l = 0; l < _world.layers.length; l ++) {
                const nodes = this.getLayerNodes(p.x, p.y, l+1, _world);
            }
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

    getLayerNodes(x, y, l, world) {
        const layer = world.layers[l-1];
        const nodes = [];
        const ox = x - x % layer.f;
        const oy = y - y % layer.f;
        for(let i = 0; i < 4; i ++) {
            const dx = i % 2;
            const dy = (i - dx) / 2;
            const nx = ox + ((layer.f)*dx);
            const ny = oy + ((layer.f)*dy);
            let node = layer.getNode(nx, ny);
            console.log(node);
            if(node === undefined) {
                node = new NoiseNode(nx, ny, layer.f, layer.a);
                layer.nodes.push(node);
            }
            nodes.push(node);
        }
        console.log(nodes);
        return nodes;
    }
}

class NoiseLayer {
    constructor(_f, _a) {
        this.f                  = _f;
        this.a                  = _a;

        this.nodes              = [];
        console.log("New Layer", this.f, this.a);
    }

    addNode(x, y) {
        this.nodes.push(new NoiseNode(x, y, this.f, this.a));
    }

    getNode(x, y) {
        const key = getNodeKey(x, y);
        return this.nodes.find(n => n.key == key);
    }

    removeNode(x, y) {

    }
}

class NoiseNode {
    constructor(_x, _y, _f, _a) {
        this.x                  = _x;
        this.y                  = _y;
        this.f                  = _f;
        this.a                  = _a;

        this.key                = getNodeKey(this.x, this.y);

        this.h1                 = Math.round(Math.random()*this.a);
        console.log("New Node", this.x, this.y, this.f, this.a);
    }
}

export { World , Chunk };