import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import PhysicsWorker from "./physicsWorker?worker";
import { initPhysics } from "./physics/physics";
import { wallScreenArea } from "./physics/wallFactory";
import { initWallGraphics } from "./draw/wallGraphics";

async function startGame() {
  const worker = new PhysicsWorker();

  const { app, stage } = new Renderer();
  const container = new PIXI.Container();

  stage.addChild(container);
  const g = new PIXI.Graphics();
  stage.addChild(g);

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
  };

  const setupWalls = () => {
    const thickness = 100;

    addGameObject({
      angle: 0,
      height: window.innerHeight,
      width: thickness,
      id: -1,
      type: "WALL",
      shape: "rect",
      graphics: {
        draw: true,
        line: 0x000000,
        fill: 0x555555,
      },
      x: 0,
      y: window.innerHeight / 2,
    });
    addGameObject({
      angle: 0,
      height: window.innerHeight,
      width: thickness,
      id: -1,
      type: "WALL",
      shape: "rect",
      graphics: {
        draw: true,
        line: 0x000000,
        fill: 0x555555,
      },
      x: window.innerWidth,
      y: window.innerHeight / 2,
    });
    addGameObject({
      angle: 0,
      height: thickness,
      width: window.innerWidth,
      id: -1,
      type: "WALL",
      shape: "rect",
      graphics: {
        draw: true,
        line: 0x000000,
        fill: 0x555555,
      },
      x: window.innerWidth / 2,
      y: window.innerHeight,
    });
    addGameObject({
      angle: 0,
      height: thickness,
      width: window.innerWidth,
      id: -1,
      type: "WALL",
      shape: "rect",
      graphics: {
        draw: true,
        line: 0x000000,
        fill: 0x555555,
      },
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
        // const texture = PIXI.Texture.from("square.png");
        // const sprite = new PIXI.Sprite(texture);
        // const { x, y, width, height, id }: GameObject = e.data.data;
        // sprite.anchor.set(0.5);
        // sprite.position.x = x;
        // sprite.position.y = y;
        // sprite.width = width;
        // sprite.height = height;
        // container.addChild(sprite);

        // gameObjects.push({
        //   id,
        //   x,
        //   y,
        //   type: "CRATE",
        //   shape: "rect",
        //   width,
        //   height,
        //   angle: 0,
        //   sprite,
        // });

        console.log(e.data.data);
        gameObjects.push(e.data.data);
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
      shape: "circle",
      graphics: {
        draw: true,
        line: 0xefefef,
        fill: 0xff5522,
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

  const drawObjects = () => {
    g.clear();
    for (const object of gameObjects) {
      // console.log(object);
      if (!object.graphics) return;

      g.beginFill(object.graphics.fill);
      g.lineStyle({ width: 1, color: object.graphics.line });
      if (object.shape == "circle") {
        g.drawCircle(
          object.x - object.width / 2,
          object.y - object.height / 2,
          object.width / 2
        );
      } else if (object.shape == "rect") {
        g.drawRect(
          object.x - object.width / 2,
          object.y - object.height / 2,
          object.width,
          object.height
        );
      }
      g.endFill();
    }
  };

  let start = performance.now();
  const gameLoop = () => {
    start = performance.now();
    drawObjects();
    app.render();
    lastSpawnAttempt += delta;

    delta = performance.now() - start;
    setTimeout(() => gameLoop(), 0);
  };

  gameLoop();
}

// startGame();

async function mainShooter() {
  // RENDERER
  const { app, stage } = new Renderer();
  const container = new PIXI.Container();
  stage.addChild(container);
  const { wallGraphics, drawWalls } = initWallGraphics();

  container.addChild(wallGraphics);

  // PHYSICS
  const physics = await initPhysics({ x: 0, y: 0 });
  const { RAPIER, step, world } = physics;

  let start = performance.now();
  let delta = 0;

  const walls = wallScreenArea(world, RAPIER, 50);

  const gameLoop = () => {
    start = performance.now();
    drawWalls(walls);
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
