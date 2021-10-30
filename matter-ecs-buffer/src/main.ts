import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import { PhysicsRunner } from "./PhysicsMain";
import PhysicsWorker from "./physicsWorker?worker";
import { Engine, IChamferableBodyDefinition } from "matter-js";

const spawnerAmount = 10;
const spawnerTimer = 1000;
const spawnAtStart = 3000;

let bodySyncDelta = 0;
let rendererFps = 0;
let bodyCount = 0;
let statsUpdateFrequency = 500;

const statsUpdate = () => {
  const statsDom = document.body.querySelector("#stats");

  if (!statsDom) return;

  statsDom.innerHTML = `
  <span>Bodies</span><span>${bodyCount}</span>
  <span>renderer_fps</span><span>${rendererFps.toFixed(0)}</span>
  <span>physics_fps</span><span>${(1000 / bodySyncDelta).toFixed(0)}</span>
  `;

  setTimeout(statsUpdate, statsUpdateFrequency);
};

const mainThreadExample = async () => {
  const physicsObjects: IPhysicsSyncBody[] = [];

  const setupWalls = (physics: PhysicsRunner) => {
    physics.addBody(window.innerWidth / 2, 0, window.innerWidth, 50, {
      isStatic: true,
    });
    physics.addBody(
      window.innerWidth / 2,
      window.innerHeight,
      window.innerWidth,
      50,
      {
        isStatic: true,
      }
    );
    physics.addBody(0, window.innerHeight / 2, 50, window.innerHeight, {
      isStatic: true,
    });
    physics.addBody(
      window.innerWidth,
      window.innerHeight / 2,
      50,
      window.innerHeight,
      {
        isStatic: true,
      }
    );
  };

  const spawnRandomDynamicSquare = () => {
    const x =
      window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth * 0.8;
    const y =
      window.innerHeight / 2 + (Math.random() - 0.5) * window.innerHeight * 0.8;
    const width = 6 + Math.random() * 10;
    const height = width;

    const id = physics.addBody(x, y, width, height, {
      restitution: 0,
    }).id;

    const texture = PIXI.Texture.from("square.png");
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.position.x = x;
    sprite.width = width;
    sprite.height = height;
    sprite.position.y = y;
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
  };

  const syncPhysicsRender = () => {
    const physData = physics.getBodySyncData();

    for (const obj of physicsObjects) {
      const { x, y, angle } = physData[obj.id];

      if (!obj.sprite) return;
      obj.sprite.position.x = x;
      obj.sprite.position.y = y;
      obj.sprite.rotation = angle;
    }
  };

  const { app, stage } = new Renderer();

  const physics = new PhysicsRunner();

  // physics.toggleDebugRenderer();
  setupWalls(physics);

  const container = new PIXI.Container();

  stage.addChild(container);

  for (let i = 0; i < spawnAtStart; i++) {
    spawnRandomDynamicSquare();
  }

  let lastSpawnAttempt = 0;

  let delta = 0;

  app.ticker.add(() => {
    const start = performance.now();
    Engine.update(physics.engine, delta);
    syncPhysicsRender();
    physics.applyForceToRandomBody();
    physics.outOfBoundCheck();

    lastSpawnAttempt += delta;
    if (lastSpawnAttempt > spawnerTimer) {
      Math.random() > 1 - spawnerAmount ? spawnRandomDynamicSquare() : "";
      lastSpawnAttempt = 0;
    }

    delta = performance.now() - start;

    bodySyncDelta = delta;
    bodyCount = physics.world.bodies.length;
    rendererFps = app.ticker.FPS;
  });
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

  setupWalls();

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

  setInterval(() => {
    spawnRandomDynamicSquare();
  }, spawnerTimer);

  const timedSpawner = () => {
    for (let i = 0; i < spawnerAmount; i++) {
      spawnRandomDynamicSquare();
    }

    setTimeout(() => {
      timedSpawner();
    }, spawnerTimer);
  };

  timedSpawner();

  for (let i = 0; i < spawnAtStart; i++) {
    spawnRandomDynamicSquare();
  }

  let lastSpawnAttempt = 0;

  let myDelta = 0;

  app.ticker.add((delta) => {
    lastSpawnAttempt += delta;
    const start = performance.now();

    myDelta = performance.now() - start;
    bodyCount = physicsObjects.length;
    rendererFps = app.ticker.FPS;
  });
}

// mainThreadExample();
workerExample();
statsUpdate();

interface IPhysicsSyncBody {
  id: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  sprite: PIXI.Sprite | undefined;
}
