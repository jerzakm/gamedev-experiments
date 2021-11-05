import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import PhysicsWorker from "./physicsWorker?worker";
import { initPhysics } from "./physics/physics";
import { wallScreenArea } from "./physics/wallFactory";
import { initWallGraphics } from "./draw/wallGraphics";
import { spawnRandomBall } from "./physics/ballFactory";
import { initEnvBallGraphics } from "./draw/envBallGraphics";

async function mainShooter() {
  // RENDERER
  const { app, stage } = new Renderer();
  const container = new PIXI.Container();
  stage.addChild(container);
  const { wallGraphics, drawWalls } = initWallGraphics();
  const { envBallGraphics, drawEnvBalls } = initEnvBallGraphics();

  container.addChild(wallGraphics);
  container.addChild(envBallGraphics);

  // PHYSICS
  const physics = await initPhysics({ x: 0, y: 0 });
  const { RAPIER, step, world } = physics;

  let start = performance.now();
  let delta = 0;

  const walls = wallScreenArea(world, RAPIER, 50);

  const envBalls: any = [];

  for (let i = 0; i < 15; i++) {
    envBalls.push(spawnRandomBall(world, RAPIER));
  }

  const gameLoop = () => {
    start = performance.now();
    drawWalls(walls);
    drawEnvBalls(envBalls);
    app.render();
    step(delta);
    delta = performance.now() - start;
    setTimeout(() => gameLoop(), delta);
  };

  gameLoop();
}

mainShooter();

export interface GameObject {
  id: string | number;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  shape: string;
  sprite?: PIXI.Sprite | undefined;
  graphics?: {
    draw: boolean;
    line: number;
    fill?: number;
  };
}

export type PositionSyncMap = {
  [key: number]: {
    x: number;
    y: number;
    rotation: number;
  };
};

export interface PhysicsObjectOptions {
  isStatic: boolean;
}

export enum MessageType {
  SPAWN_PLAYER,
}
