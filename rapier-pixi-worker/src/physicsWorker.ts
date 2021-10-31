import { PositionSyncMap } from "./main";
import { getRapier } from "./rapier";

const maxFps = 500;
const deltaGoal = 1000 / maxFps;

async function init() {
  const RAPIER = await getRapier();
  console.log(RAPIER);
  // Use the RAPIER module here.
  let gravity = { x: 0.0, y: 0.0 };
  let world = new RAPIER.World(gravity);

  // Create the ground
  // let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1);
  // world.createCollider(groundColliderDesc);

  // Create a dynamic rigid-body.
  // let rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(
  //   0.0,
  //   1.0
  // );
  // let rigidBody = world.createRigidBody(rigidBodyDesc);

  // Create a cuboid collider attached to the dynamic rigidBody.

  // Game loop. Replace by your own game loop system.

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

  let gameLoop = (delta = 16) => {
    const startTs = performance.now();

    if (Math.random() > 0.3) {
      // physics.applyForceToRandomBody();
    }

    world.step();
    syncPositions(delta);

    // Get and print the rigid-body's position.
    // let position = rigidBody.translation();
    // console.log("Rigid-body position: ", position.x, position.y);

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
    // physics.outOfBoundCheck();
  }, 1000);

  self.addEventListener("message", (e) => {
    const message = e.data || e;

    if (message.type == "ADD_BODY") {
      const { x, y, width, height, options } = message.data;
      // const body = physics.addBody(x, y, width, height, options);

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
  });
}

init();
