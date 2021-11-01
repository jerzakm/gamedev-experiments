import { PositionSyncMap } from "./main";
import { getRapier } from "./rapier";

const maxFps = 500;
const deltaGoal = 1000 / maxFps;

const bodyAddQueue: any[] = [];

async function init() {
  const RAPIER = await getRapier();
  // Use the RAPIER module here.
  let gravity = { x: 0.0, y: 0.0 };
  let world = new RAPIER.World(gravity);

  const applyForceToRandomBody = () => {
    const bodyCount = world.bodies.len();

    if (bodyCount == 0) return;
    const bodyIndex = Math.round(Math.random() * bodyCount);

    const body = world.getRigidBody(bodyIndex);
    if (!body) return;
    const mass = body.mass();

    body.applyImpulse(
      {
        x: (Math.random() - 0.5) * mass ** 2 * 0.5,
        y: (Math.random() - 0.5) * mass ** 2 * 0.5,
      },
      true
    );
  };

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

    if (Math.random() > 0.3) {
      applyForceToRandomBody();
    }

    while (bodyAddQueue.length > 0) {
      const { x, y, width, height, options } = bodyAddQueue[0];

      let rigidBody;

      if (options.isStatic) {
        rigidBody = world.createRigidBody(
          RAPIER.RigidBodyDesc.newStatic().setTranslation(x, y)
        );
      } else {
        rigidBody = world.createRigidBody(
          RAPIER.RigidBodyDesc.newDynamic().setTranslation(x, y)
        );
      }

      const colliderDesc = new RAPIER.ColliderDesc(
        new RAPIER.Cuboid(width / 2, height / 2)
      ).setTranslation(0, 0);

      const bodyCollider = world.createCollider(colliderDesc, rigidBody.handle);

      bodyAddQueue.shift();

      self.postMessage({
        type: "BODY_CREATED",
        data: {
          id: bodyCollider.handle,
          x,
          y,
          width,
          height,
          angle: 0,
          sprite: undefined,
        },
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
      bodyAddQueue.push(message.data);
    }
  });
}

init();
