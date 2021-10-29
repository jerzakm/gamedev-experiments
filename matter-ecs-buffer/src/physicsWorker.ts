import {
  Bodies,
  Engine,
  IChamferableBodyDefinition,
  Render,
  World,
} from "matter-js";
import { PhysicsRunner } from "./PhysicsMain";

const physics = new PhysicsRunner();

const runner = (last = 0) => {
  const now = performance.now();
  const delta = now - last;
  Engine.update(physics.engine, delta);

  self.postMessage("bodyData", physics.getBodySyncData());

  setTimeout(() => runner(now), 0);
};

runner();

self.addEventListener("message", (e) => {
  // add a body

  const message = e.data || e;

  if (message.type == "ADD_BODY") {
    const { x, y, width, height, options } = message.data;
    physics.addBody(x, y, width, height, {
      restitution: 0,
    });
  }
});
