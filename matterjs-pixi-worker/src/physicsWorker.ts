import {
  Bodies,
  Engine,
  IChamferableBodyDefinition,
  Render,
  Runner,
  World,
} from "matter-js";
import { PhysicsRunner } from "./PhysicsMain";

const physics = new PhysicsRunner();

let counter = 0;

const maxFps = 60;
const deltaGoal = 1000 / maxFps;

const runner = (delta = 16) => {
  // console.log(delta);
  const startTs = performance.now();

  Engine.update(physics.engine, delta);

  if (Math.random() > 0.5) {
    physics.applyForceToRandomBody();
  }

  self.postMessage({
    type: "BODY_SYNC",
    data: physics.getBodySyncData(),
    delta,
  });

  const currentDelta = performance.now() - startTs;
  const goalDiff = Math.max(0, deltaGoal - currentDelta);

  const d = Math.max(currentDelta, deltaGoal);

  counter++;

  setTimeout(() => runner(d), goalDiff);
};

runner();

// once a second check for bodies out of bound
setInterval(() => {
  physics.outOfBoundCheck();
}, 1000);

self.addEventListener("message", (e) => {
  // add a body

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
