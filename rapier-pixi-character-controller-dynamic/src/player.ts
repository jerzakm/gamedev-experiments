import { World } from "@dimforge/rapier2d-compat";
import { Graphics } from "pixi.js";
import { PLAYER } from "./draw/_colorTheme";
import { RAPIER } from "./physics/core";

const MOVE_SPEED = 100;
const ACCELERATION = 75;

export const setupPlayer = (world: World, RAPIER: RAPIER) => {
  const { body, collider } = makePlayerPhysicsBody(world, RAPIER);

  const playerGraphics = new Graphics();

  let x = 0;
  let y = 0;

  collider.setActiveHooks(RAPIER.ActiveHooks.FILTER_CONTACT_PAIRS);

  const applyVelocity = () => {
    const velocity = body.linvel();
    const accelerationX = (x * MOVE_SPEED - velocity.x) * ACCELERATION;
    const accelerationY = (y * MOVE_SPEED - velocity.y) * ACCELERATION;
    body.applyImpulse({ x: accelerationX, y: accelerationY }, true);
  };

  const drawPlayer = () => {
    playerGraphics.clear();
    playerGraphics.beginFill(PLAYER.fill, PLAYER.alpha);
    playerGraphics.lineStyle({
      alpha: PLAYER.alpha,
      color: PLAYER.stroke,
      width: PLAYER.strokeWidth,
    });
    const { x, y } = body.translation();
    const radius = collider.radius();
    playerGraphics.drawCircle(x, y, radius);
    playerGraphics.endFill();
  };

  const updatePlayer = () => {
    applyVelocity();
  };

  window.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "w": {
        y = -1;
        break;
      }
      case "s": {
        y = 1;
        break;
      }
      case "a": {
        x = -1;
        break;
      }
      case "d": {
        x = 1;
        break;
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.key) {
      case "w": {
        y = 0;
        break;
      }
      case "s": {
        y = 0;
        break;
      }
      case "a": {
        x = 0;
        break;
      }
      case "d": {
        x = 0;
        break;
      }
    }
  });

  return { playerGraphics, drawPlayer, updatePlayer };
};

const makePlayerPhysicsBody = (world: World, RAPIER: RAPIER) => {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.newDynamic()
      .setTranslation(window.innerWidth / 2, window.innerHeight / 2)
      .setCanSleep(false)
  );
  let colliderDesc = new RAPIER.ColliderDesc(
    new RAPIER.Ball(12)
  ).setTranslation(0, 0);

  const collider = world.createCollider(colliderDesc, body.handle);

  return { body, collider };
};
