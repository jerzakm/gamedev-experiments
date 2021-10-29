import {
  Bodies,
  Engine,
  IChamferableBodyDefinition,
  Render,
  World,
} from "matter-js";

const engine = Engine.create();
const world = engine.world;
engine.gravity.x = 0;
engine.gravity.y = 20;

self.addEventListener("message", (e) => {
  const message = e.data || e;

  console.log(message);

  console.log("ok");
});
