import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import PhysicsWorker from "./physicsWorker?worker";
import { IChamferableBodyDefinition } from "matter-js";

const spawnerAmount = 1;
const spawnerTimer = 1000;
const spawnAtStart = 4500;

let bodySyncDelta = 0;
let rendererFps = 0;
let bodyCount = 0;
let statsUpdateFrequency = 500;

const initStats = () => {
  const statsDom = document.body.querySelector("#stats");

  if (!statsDom) return;

  statsDom.innerHTML = `
  <span>Bodies</span><span>${bodyCount}</span>
  <span>renderer_fps</span><span>${rendererFps.toFixed(0)}</span>
  <span>physics_fps</span><span>${(1000 / bodySyncDelta).toFixed(0)}</span>
  `;

  setTimeout(initStats, statsUpdateFrequency);
};

async function workerExample() {
  const worker = new PhysicsWorker();

  const { app, stage } = new Renderer();
  const container = new PIXI.Container();

  stage.addChild(container);

  const physicsObjects: IPhysicsSyncBody[] = [];

  const addBody = (
    x = 0,
    y = 0,
    width = 10,
    height = 10,
    options: IChamferableBodyDefinition = {
      restitution: 0,
    }
  ) => {
    const newBody = {
      x,
      y,
      width,
      height,
      options,
    };

    worker.postMessage({
      type: "ADD_BODY",
      data: newBody,
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
    addBody(x, y, size, size, options);
  };

  const setupWalls = () => {
    addBody(window.innerWidth / 2, 0, window.innerWidth, 50, {
      isStatic: true,
    });
    addBody(window.innerWidth / 2, window.innerHeight, window.innerWidth, 50, {
      isStatic: true,
    });
    addBody(0, window.innerHeight / 2, 50, window.innerHeight, {
      isStatic: true,
    });
    addBody(window.innerWidth, window.innerHeight / 2, 50, window.innerHeight, {
      isStatic: true,
    });
  };

  const initPhysicsHandler = () => {
    // Listener to handle data that worker passes to main thread
    worker.addEventListener("message", (e) => {
      if (e.data.type == "BODY_SYNC") {
        const physData = e.data.data;

        bodySyncDelta = e.data.delta;

        for (const obj of physicsObjects) {
          const { x, y, angle } = physData[obj.id];
          if (!obj.sprite) return;
          obj.sprite.position.x = x;
          obj.sprite.position.y = y;
          obj.sprite.rotation = angle;
        }
      }
      if (e.data.type == "BODY_CREATED") {
        const texture = PIXI.Texture.from("square.png");
        const sprite = new PIXI.Sprite(texture);
        const { x, y, width, height, id }: IPhysicsSyncBody = e.data.data;
        sprite.anchor.set(0.5);
        sprite.position.x = x;
        sprite.position.y = y;
        sprite.width = width;
        sprite.height = height;
        container.addChild(sprite);

        physicsObjects.push({
          id,
          x,
          y,
          width,
          height,
          angle: 0,
          sprite,
        });
      }
    });
  };

  const timedSpawner = () => {
    for (let i = 0; i < spawnerAmount; i++) {
      spawnRandomDynamicSquare();
    }

    setTimeout(() => {
      timedSpawner();
    }, spawnerTimer);
  };

  // Setup
  setupWalls();

  timedSpawner();
  initPhysicsHandler();

  // initial spawn
  for (let i = 0; i < spawnAtStart; i++) {
    spawnRandomDynamicSquare();
  }

  // gameloop
  let lastSpawnAttempt = 0;
  let delta = 0;

  app.ticker.stop();

  const gameLoop = () => {
    const start = performance.now();
    app.render();
    lastSpawnAttempt += delta;

    bodyCount = physicsObjects.length;
    rendererFps = 60 / delta;
    delta = performance.now() - start;
    console.log(delta);
    setTimeout(() => gameLoop(), 0);
  };

  gameLoop();

  app.ticker.add(() => {
    lastSpawnAttempt += delta;
    const start = performance.now();

    delta = performance.now() - start;
    bodyCount = physicsObjects.length;
    rendererFps = app.ticker.FPS;
  });
}

workerExample();
initStats();

interface IPhysicsSyncBody {
  id: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  sprite: PIXI.Sprite | undefined;
}
