import { Engine } from "matter-js";
import { PhysicsRunner } from "./PhysicsMain";

const physics = new PhysicsRunner();

const maxFps = 60;
const deltaGoal = 1000 / maxFps;

const runner = (delta = 16) => {
  const startTs = performance.now();

  Engine.update(physics.engine, delta);

  if (Math.random() > 0.3) {
    physics.applyForceToRandomBody();
  }

  self.postMessage({
    type: "BODY_SYNC",
    data: physics.getBodySyncData(),
    delta,
  });

  const currentDelta = performance.now() - startTs;

  // this bit limits max FPS to 60
  const deltaGoalDifference = Math.max(0, deltaGoal - currentDelta);
  const d = Math.max(currentDelta, deltaGoal);

  setTimeout(() => runner(d), deltaGoalDifference);
};

runner();

// once a second check for bodies out of bound
setInterval(() => {
  physics.outOfBoundCheck();
}, 1000);

self.addEventListener("message", (e) => {
  const message = e.data || e;

  if (message.type == "ADD_BODY") {
    const { x, y, width, height, options } = message.data;
    const body = physics.addBody(x, y, width, height, options);

    self.postMessage({
      type: "BODY_CREATED",
      data: {
        id: body.id,
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
