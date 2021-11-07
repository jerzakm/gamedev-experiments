import { Vector2, World } from "@dimforge/rapier2d-compat";
import { RAPIER } from "./core";

export const makeBall = (
  world: World,
  RAPIER: RAPIER,
  definition: BallDefinition
) => {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.newDynamic().setTranslation(
      definition.position.x,
      definition.position.y
    )
  );
  let colliderDesc = new RAPIER.ColliderDesc(new RAPIER.Ball(definition.radius))
    .setTranslation(0, 0)
    .setRestitution(1.0);

  const collider = world.createCollider(colliderDesc, body.handle);

  return { body, collider, definition };
};

export const spawnRandomBall = (
  world: World,
  RAPIER: RAPIER,
  maxRadius?: number
) => {
  if (!maxRadius) {
    maxRadius = Math.random();
  }

  const definition: BallDefinition = {
    position: {
      x: (0.05 + Math.random() * 0.8) * window.innerWidth,
      y: (0.05 + Math.random() * 0.8) * window.innerHeight,
    },
    radius: 10 + Math.random() * 10,
  };

  return makeBall(world, RAPIER, definition);
};

export interface BallDefinition {
  position: Vector2;
  radius: number;
}
