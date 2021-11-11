import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import { initPhysics } from "./physics/core";
import { wallScreenArea } from "./physics/wallFactory";
import { initWallGraphics } from "./draw/wallGraphics";
import { BallDefinition, spawnRandomBall } from "./physics/ballFactory";
import { initEnvBallGraphics } from "./draw/envBallGraphics";
import { RigidBody, Collider } from "@dimforge/rapier2d-compat";
import { setupPlayer } from "./player";

const BALL_COUNT = 100;

async function start() {
  // setup the renderer
  const { app, stage } = new Renderer();
  const container = new PIXI.Container();
  stage.addChild(container);

  // individual graphics for walls and balls
  const { wallGraphics, drawWalls } = initWallGraphics();
  const { envBallGraphics, drawEnvBalls } = initEnvBallGraphics();
  container.addChild(wallGraphics);
  container.addChild(envBallGraphics);

  // physics setup
  const physics = await initPhysics({ x: 0, y: 0 });
  const { RAPIER, step, world } = physics;

  // add walls to the physics world
  const walls = wallScreenArea(world, RAPIER, 50);

  // add balls to the physics world
  const envBalls: {
    body: RigidBody;
    collider: Collider;
    definition: BallDefinition;
  }[] = [];

  for (let i = 0; i < BALL_COUNT; i++) {
    envBalls.push(spawnRandomBall(world, RAPIER));
  }

  // setup player - physics, graphics & update function
  const { playerGraphics, drawPlayer, updatePlayer } = setupPlayer(
    world,
    RAPIER
  );
  container.addChild(playerGraphics);

  app.ticker.add((delta) => {
    const d = delta * 0.1;

    // Uncomment to spawn more balls over time
    /*
    if (Math.random() > 0.99) {
      const bouncyBall = spawnRandomBall(world, RAPIER);
      bouncyBall.collider.setRestitution(1);
      envBalls.push(bouncyBall);
    }
    */
    updatePlayer(); // Player movement logic from player.ts happens here
    drawWalls(walls);
    drawEnvBalls(envBalls);
    drawPlayer(delta);
    step(d); // step physics
    app.render(); // pixi render
  });
}

start();

export interface PhysicsObjectOptions {
  isStatic: boolean;
}

export enum MessageType {
  SPAWN_PLAYER,
}
