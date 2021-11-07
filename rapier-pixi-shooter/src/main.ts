import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import { initPhysics } from "./physics/physics";
import { wallScreenArea } from "./physics/wallFactory";
import { initWallGraphics } from "./draw/wallGraphics";
import { BallDefinition, spawnRandomBall } from "./physics/ballFactory";
import { initEnvBallGraphics } from "./draw/envBallGraphics";
import { RigidBody, Collider } from "@dimforge/rapier2d-compat";
import { setupPlayer } from "./player";

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

  const envBalls: {
    body: RigidBody;
    collider: Collider;
    definition: BallDefinition;
  }[] = [];

  for (let i = 0; i < 15; i++) {
    envBalls.push(spawnRandomBall(world, RAPIER));
  }

  const { playerGraphics, drawPlayer, updatePlayer } = setupPlayer(
    world,
    RAPIER
  );

  container.addChild(playerGraphics);

  app.ticker.add((delta) => {
    const d = delta * 0.1;

    if (Math.random() > 0.999) {
      const bouncyBall = spawnRandomBall(world, RAPIER);
      bouncyBall.collider.setRestitution(1);
      envBalls.push(bouncyBall);
    }
    updatePlayer();
    drawWalls(walls);
    drawEnvBalls(envBalls);
    drawPlayer();
    step(d);

    app.render();
  });
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
