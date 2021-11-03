import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import PhysicsWorker from "./physicsWorker?worker";

async function startGame() {
  const worker = new PhysicsWorker();

  const { app, stage } = new Renderer();
  const container = new PIXI.Container();

  stage.addChild(container);

  const gameObjects: GameObject[] = [];

  const addGameObject = (object: GameObject) => {
    worker.postMessage({
      type: "ADD_BODY",
      data: object,
    });
  };

  const spawnRandomDynamicSquare = () => {
    const x =
      window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth * 0.8;
    const y =
      window.innerHeight / 2 + (Math.random() - 0.5) * window.innerHeight * 0.8;

    const options = {
      restitution: 0,
    };

    const size = 4 + 10 * Math.random();
    addGameObject(x, y, size, size, options);
  };

  const setupWalls = () => {
    const thickness = 50;

    addGameObject({
      angle: 0,
      height: window.innerHeight,
      width: thickness,
      id: -1,
      type: "WALL",
      x: 0,
      y: window.innerHeight / 2,
    });
    addGameObject({
      angle: 0,
      height: window.innerHeight,
      width: thickness,
      id: -1,
      type: "WALL",
      x: window.innerWidth,
      y: window.innerHeight / 2,
    });
    addGameObject({
      angle: 0,
      height: thickness,
      width: window.innerWidth,
      id: -1,
      type: "WALL",
      x: window.innerWidth / 2,
      y: window.innerHeight,
    });
    addGameObject({
      angle: 0,
      height: thickness,
      width: window.innerWidth,
      id: -1,
      type: "WALL",
      x: window.innerWidth / 2,
      y: 0,
    });
  };

  const initPhysicsHandler = () => {
    // Listener to handle data that worker passes to main thread
    worker.addEventListener("message", (e) => {
      if (e.data.type == "BODY_SYNC") {
        const physData = e.data.data;
        for (const obj of gameObjects) {
          const { x, y, rotation } = physData[obj.id];
          if (!obj.sprite) return;
          obj.sprite.position.x = x;
          obj.sprite.position.y = y;
          obj.sprite.rotation = rotation;
        }
      }
      if (e.data.type == "BODY_CREATED") {
        const texture = PIXI.Texture.from("square.png");
        const sprite = new PIXI.Sprite(texture);
        const { x, y, width, height, id }: GameObject = e.data.data;
        sprite.anchor.set(0.5);
        sprite.position.x = x;
        sprite.position.y = y;
        sprite.width = width;
        sprite.height = height;
        container.addChild(sprite);

        gameObjects.push({
          id,
          x,
          y,
          type: "CRATE",
          width,
          height,
          angle: 0,
          sprite,
        });
      }
      if (e.data.type == "PHYSICS_LOADED") {
        // initial spawn
        setupWalls();
        spawnPlayer();
      }
    });
  };

  const spawnPlayer = () => {
    const player: GameObject = {
      angle: 0,
      height: 32,
      width: 32,
      id: -1,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      type: "PLAYER",
      graphics: {
        draw: true,
        shape: "circle",
        line: 0xefefef,
      },
    };
    worker.postMessage({
      type: "ADD_BODY",
      data: player,
    });
  };

  initPhysicsHandler();

  // gameloop
  let lastSpawnAttempt = 0;
  let delta = 0;

  app.ticker.stop();

  let start = performance.now();
  const gameLoop = () => {
    start = performance.now();
    app.render();
    lastSpawnAttempt += delta;

    delta = performance.now() - start;
    setTimeout(() => gameLoop(), 0);
  };

  gameLoop();
}

startGame();

export interface GameObject {
  id: string | number;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  sprite?: PIXI.Sprite | undefined;
  graphics?: {
    draw: boolean;
    shape: string;
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

export enum Shape {
  SQUARE,
  CIRCLE,
}

export enum MessageType {
  SPAWN_PLAYER,
}
