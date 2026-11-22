import {useEffect, useRef} from "react";
import "./AutoSnake.css";

type Cell = {x: number; y: number};
type Game = {snake: Cell[]; food: Cell; direction: Cell; score: number};
const CELL = 24;
const TICK_MS = 155;
const DIRS: Cell[] = [{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}];
const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const key = (cell: Cell) => cell.x + "," + cell.y;

function randomFood(snake: Cell[], columns: number, rows: number): Cell {
    const occupied = new Set(snake.map(key));
    const available: Cell[] = [];
    for (let y=0;y<rows;y++) for(let x=0;x<columns;x++) {
        if (!occupied.has(x + "," + y)) available.push({x,y});
    }
    return available.length ? available[Math.floor(Math.random()*available.length)] : {x:0,y:0};
}

function newGame(columns: number, rows: number): Game {
    const x = Math.floor(columns/2);
    const y = Math.floor(rows/2);
    const snake = [{x,y},{x:x-1,y},{x:x-2,y}];
    return {snake, food:randomFood(snake,columns,rows), direction:DIRS[0],score:0};
}

function inBounds(cell: Cell, columns:number, rows:number) {
    return cell.x >= 0 && cell.y >= 0 && cell.x < columns && cell.y < rows;
}

/* Breadth-first pathfinding gives the background snake a goal rather than random wandering. */
function findDirection(game: Game, columns:number, rows:number): Cell | null {
    const head = game.snake[0];
    const blocked = new Set(game.snake.slice(0,-1).map(key));
    const queue: Cell[] = [head];
    const seen = new Set([key(head)]);
    const firstStep = new Map<string, Cell>();
    for (let index=0;index<queue.length;index++) {
        const current = queue[index];
        if (same(current,game.food)) return firstStep.get(key(current)) ?? game.direction;
        for (const dir of DIRS) {
            const next = {x:current.x+dir.x,y:current.y+dir.y};
            const nextKey = key(next);
            if (!inBounds(next,columns,rows) || blocked.has(nextKey) || seen.has(nextKey)) continue;
            seen.add(nextKey);
            firstStep.set(nextKey, firstStep.get(key(current)) ?? dir);
            queue.push(next);
        }
    }
    // If food is unreachable, choose a safe move before restarting.
    const safe = DIRS.filter(dir => {
        const next={x:head.x+dir.x,y:head.y+dir.y};
        return inBounds(next,columns,rows) && !blocked.has(key(next));
    });
    return safe.find(dir=>same(dir,game.direction)) ?? safe[0] ?? null;
}

function advance(game: Game, columns:number, rows:number): Game {
    const direction = findDirection(game,columns,rows);
    if (!direction) return newGame(columns,rows);
    const head={x:game.snake[0].x+direction.x,y:game.snake[0].y+direction.y};
    const eats=same(head,game.food);
    const blocked=new Set(game.snake.slice(0,eats ? undefined : -1).map(key));
    if (!inBounds(head,columns,rows) || blocked.has(key(head))) return newGame(columns,rows);
    const snake=[head,...game.snake.slice(0,eats ? undefined : -1)];
    if (snake.length >= columns*rows) return newGame(columns,rows);
    return {snake,food:eats ? randomFood(snake,columns,rows) : game.food,direction,score:game.score+Number(eats)};
}

function draw(ctx:CanvasRenderingContext2D,game:Game,columns:number,rows:number) {
    const width=columns*CELL, height=rows*CELL;
    ctx.clearRect(0,0,width,height);
    ctx.strokeStyle="rgba(140,173,148,.08)";
    ctx.lineWidth=1;
    for(let x=0;x<=columns;x++) {ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,height);ctx.stroke();}
    for(let y=0;y<=rows;y++) {ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(width,y*CELL);ctx.stroke();}
    game.snake.forEach((part,index)=>{
        ctx.fillStyle=index===0 ? "#b4e37b" : index%2 ? "#5c9c74" : "#75b78a";
        ctx.beginPath();
        ctx.roundRect(part.x*CELL+3,part.y*CELL+3,CELL-6,CELL-6,6);
        ctx.fill();
    });
    ctx.fillStyle="#ffae74";
    ctx.beginPath();ctx.arc(game.food.x*CELL+CELL/2,game.food.y*CELL+CELL/2,6,0,Math.PI*2);ctx.fill();
}

export default function AutoSnake() {
    const canvasRef=useRef<HTMLCanvasElement>(null);
    useEffect(()=>{
        const canvas=canvasRef.current;
        if (!canvas) return;
        const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        const ctx=canvas.getContext("2d");
        if (!ctx) return;
        let game:Game;
        let columns=0, rows=0;
        const resize=()=>{
            const pixelRatio=Math.min(window.devicePixelRatio || 1,2);
            const viewportWidth=window.innerWidth;
            const viewportHeight=window.innerHeight;
            columns=Math.max(9,Math.floor(viewportWidth/CELL));
            rows=Math.max(9,Math.floor(viewportHeight/CELL));
            canvas.width=Math.round(columns*CELL*pixelRatio);
            canvas.height=Math.round(rows*CELL*pixelRatio);
            ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
            game=newGame(columns,rows);
            draw(ctx,game,columns,rows);
        };
        resize();
        window.addEventListener("resize",resize);
        const timer=window.setInterval(()=>{
            if (reducedMotion || document.hidden) return;
            game=advance(game,columns,rows);
            draw(ctx,game,columns,rows);
        },TICK_MS);
        return ()=>{window.clearInterval(timer);window.removeEventListener("resize",resize);};
    },[]);
    return <div className="auto-snake-background" aria-hidden="true"><canvas ref={canvasRef}/></div>;
}
