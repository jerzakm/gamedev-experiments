import { Vector2, World } from "@dimforge/rapier2d-compat";
import { RAPIER } from "./core";

export const makeWall = (
  world: World,
  RAPIER: RAPIER,
  definition: WallDefinition
) => {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.newStatic().setTranslation(
      definition.position.x,
      definition.position.y
    )
  );
  let colliderDesc = new RAPIER.ColliderDesc(
    new RAPIER.Cuboid(definition.size.x / 2, definition.size.y / 2)
  ).setTranslation(0, 0);
  const collider = world.createCollider(colliderDesc, body.handle);

  return { body, collider, definition };
};

export const wallScreenArea = (
  world: World,
  RAPIER: RAPIER,
  thickness: number
) => {
  const walls = [];
  walls.push(
    makeWall(world, RAPIER, {
      angle: 0,
      size: { y: window.innerHeight, x: thickness },
      position: { x: 0, y: window.innerHeight / 2 },
    })
  );
  walls.push(
    makeWall(world, RAPIER, {
      angle: 0,
      size: { y: window.innerHeight, x: thickness },

      position: { x: window.innerWidth, y: window.innerHeight / 2 },
    })
  );
  walls.push(
    makeWall(world, RAPIER, {
      size: { y: thickness, x: window.innerWidth },
      position: { x: window.innerWidth / 2, y: window.innerHeight },
      angle: 0,
    })
  );
  walls.push(
    makeWall(world, RAPIER, {
      angle: 0,
      size: { y: thickness, x: window.innerWidth },

      position: { x: window.innerWidth / 2, y: 0 },
    })
  );

  return walls;
};

export interface WallDefinition {
  position: Vector2;
  size: Vector2;
  angle: number;
}
