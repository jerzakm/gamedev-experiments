import { Vector2 } from "@dimforge/rapier2d";
import { getRapier } from "../rapier";
export type RAPIER =
  typeof import("D:/gamedev-experiments/rapier-pixi-shooter/node_modules/@dimforge/rapier2d-compat/exports");

export const initPhysics = async (gravity: Vector2) => {
  const RAPIER = await getRapier();
  // Use the RAPIER module here.

  const world = new RAPIER.World(gravity);

  const step = (delta?: number) => {
    if (delta) {
      world.timestep = delta;
    }
    world.step();
  };

  return { RAPIER, step, world };
};
