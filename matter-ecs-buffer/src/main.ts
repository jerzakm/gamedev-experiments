import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import { PhysicsMain } from "./PhysicsMain";
import MyWorker from "./worker?worker";
import { Engine } from "matter-js";

const setupWalls = (physics: PhysicsMain) => {
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

const start = async () => {
  const { app, stage } = new Renderer();

  const physics = new PhysicsMain();
  physics.toggleDebugRenderer();

  setupWalls(physics);

  const physicsObjects: PhysicsSyncBody[] = [];

  const spawnRandomObject = () => {
    const x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
    const y = window.innerHeight / 2 + (Math.random() - 0.5) * 100;
    const width = 6;
    const height = 6;

    const id = physics.addBody(x, y, width, height, { restitution: 0.1 });

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

    console.log(physicsObjects.length);
  };

  const syncPhysicsRender = () => {
    const physData = physics.getBodySyncData();

    for (const obj of physicsObjects) {
      const { x, y, angle } = physData[obj.id];
      obj.sprite.position.x = x;
      obj.sprite.position.y = y;
      obj.sprite.rotation = angle;
    }
  };

  const container = new PIXI.Container();

  stage.addChild(container);

  app.ticker.add((delta) => {
    Engine.update(physics.engine, delta);
    syncPhysicsRender();

    Math.random() > 0.5 ? spawnRandomObject() : "";
  });
};

start();

async function initWorker() {
  const worker = new MyWorker();
  worker.postMessage("message");
}

interface PhysicsSyncBody {
  id: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  sprite: PIXI.Sprite;
}
