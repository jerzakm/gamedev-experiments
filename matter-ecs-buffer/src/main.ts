import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import { PhysicsRunner } from "./PhysicsMain";
import PhysicsWorker from "./physicsWorker?worker";
import { Engine } from "matter-js";

const mainThreadExample = async () => {
  const physicsObjects: PhysicsSyncBody[] = [];

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

  const spawnRandomObject = () => {
    const x =
      window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth * 0.6;
    const y =
      window.innerHeight / 2 + (Math.random() - 0.5) * window.innerHeight * 0.6;
    const width = 6 + Math.random() * 10;
    const height = width;

    const id = physics.addBody(x, y, width, height, {
      restitution: 0,
    });

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

    // console.log(physicsObjects.length);
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

  physics.toggleDebugRenderer();
  setupWalls(physics);

  const container = new PIXI.Container();

  stage.addChild(container);

  app.ticker.add((delta) => {
    Engine.update(physics.engine, delta);
    syncPhysicsRender();
    physics.applyRandomForces();

    Math.random() > 0.5 ? spawnRandomObject() : "";
  });
};

async function workerExample() {
  const worker = new PhysicsWorker();

  const { app, stage } = new Renderer();
  const container = new PIXI.Container();

  stage.addChild(container);

  const physicsObjects: PhysicsSyncBody[] = [];

  const spawnRandomObject = () => {
    const x =
      window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth * 0.6;
    const y =
      window.innerHeight / 2 + (Math.random() - 0.5) * window.innerHeight * 0.6;
    const width = 6 + Math.random() * 10;
    const height = width;

    // const id = physics.addBody(x, y, width, height, {
    //   restitution: 0,
    // });

    const texture = PIXI.Texture.from("square.png");
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.position.x = x;
    sprite.width = width;
    sprite.height = height;
    sprite.position.y = y;
    container.addChild(sprite);

    const newBody: PhysicsSyncBody = {
      id: physicsObjects.length + 1,
      x,
      y,
      width,
      height,
      angle: 0,
      sprite: undefined,
    };

    worker.postMessage({
      type: "ADD_BODY",
      data: newBody,
    });

    newBody.sprite = sprite;

    physicsObjects.push(newBody);
  };

  app.ticker.add((delta) => {
    Math.random() > 0.5 ? spawnRandomObject() : "";
  });

  worker.postMessage("message");
}

// mainThreadExample();
workerExample();

interface PhysicsSyncBody {
  id: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  sprite: PIXI.Sprite | undefined;
}
