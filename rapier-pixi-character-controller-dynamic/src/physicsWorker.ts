import { GameObject, PositionSyncMap } from "./main";
import { getRapier } from "./rapier";

const maxFps = 500;
const deltaGoal = 1000 / maxFps;

const spawnQueue: any[] = [];

async function init() {
  const RAPIER = await getRapier();
  // Use the RAPIER module here.
  let gravity = { x: 0.0, y: 0.0 };
  let world = new RAPIER.World(gravity);

  const syncPositions = (delta: number) => {
    const syncObj: PositionSyncMap = {};

    let count = 0;

    world.forEachRigidBody((body) => {
      const { x, y } = body.translation();
      const rotation = body.rotation();
      syncObj[body.handle] = { x, y, rotation };

      count++;
    });

    self.postMessage({
      type: "BODY_SYNC",
      data: syncObj,
      delta,
    });
  };

  const outOfBoundCheck = () => {
    world.forEachRigidBody((body) => {
      const { x, y } = body.translation();

      if (Math.abs(x) + Math.abs(y) > 6000) {
        body.setTranslation(
          {
            x: 100,
            y: 100,
          },
          true
        );
      }
    });
  };

  let gameLoop = (delta = 16) => {
    const startTs = performance.now();

    while (spawnQueue.length > 0) {
      const b: GameObject = spawnQueue[0];

      let rigidBody;

      if (b.type == "WALL") {
        rigidBody = world.createRigidBody(
          RAPIER.RigidBodyDesc.newStatic().setTranslation(b.x, b.y)
        );
      } else {
        rigidBody = world.createRigidBody(
          RAPIER.RigidBodyDesc.newDynamic().setTranslation(b.x, b.y)
        );
      }

      let colliderDesc;

      if (b.shape == "CIRCLE") {
        colliderDesc = new RAPIER.ColliderDesc(
          new RAPIER.Ball(b.width / 2)
        ).setTranslation(0, 0);
      } else {
        colliderDesc = new RAPIER.ColliderDesc(
          new RAPIER.Cuboid(b.width / 2, b.height / 2)
        ).setTranslation(0, 0);
      }

      const bodyCollider = world.createCollider(colliderDesc, rigidBody.handle);

      spawnQueue.shift();

      b.id = bodyCollider.handle;

      self.postMessage({
        type: "BODY_CREATED",
        data: b,
      });
    }

    world.timestep = delta;

    world.step();
    syncPositions(delta);

    const currentDelta = performance.now() - startTs;

    // this bit limits max FPS to 60
    const deltaGoalDifference = Math.max(0, deltaGoal - currentDelta);
    const d = Math.max(currentDelta, deltaGoal);

    setTimeout(() => gameLoop(d), deltaGoalDifference);
  };
  gameLoop();

  self.postMessage({
    type: "PHYSICS_LOADED",
  });

  // once a second check for bodies out of bound
  setInterval(() => {
    // outOfBoundCheck();
  }, 1000);

  self.addEventListener("message", (e) => {
    const message = e.data || e;

    if (message.type == "ADD_BODY") {
      spawnQueue.push(message.data);
    }
  });
}

init();
