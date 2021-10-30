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

const runner = (delta = 16) => {
  const startTs = performance.now();

  Engine.update(physics.engine, delta);

  physics.applyRandomForces();
  physics.outOfBoundCheck();

  self.postMessage({
    type: "BODY_SYNC",
    data: physics.getBodySyncData(),
    delta,
  });

  setTimeout(() => runner(performance.now() - startTs), 0);
};

runner();

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
