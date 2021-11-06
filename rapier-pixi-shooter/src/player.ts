import { World } from "@dimforge/rapier2d-compat";
import { Graphics } from "pixi.js";
import { PLAYER } from "./draw/_colorTheme";
import { RAPIER } from "./physics/physics";

const MOVE_SPEED = 100;

export const setupPlayer = (world: World, RAPIER: RAPIER) => {
  const { body, collider } = makePlayerPhysicsBody(world, RAPIER);

  const playerGraphics = new Graphics();

  let x = 0;
  let y = 0;

  const applyVelocity = () => {
    body.setLinvel({ x: x * MOVE_SPEED, y: y * MOVE_SPEED }, true);
    body.applyImpulse({ x: x * MOVE_SPEED, y: y * MOVE_SPEED }, true);
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
    world.contactsWith(collider.handle, (c2) => {
      console.log(c2);
    });
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
    RAPIER.RigidBodyDesc.newKinematicVelocityBased()
      .setTranslation(window.innerWidth / 2, window.innerHeight / 2)
      .setCanSleep(false)
  );
  let colliderDesc = new RAPIER.ColliderDesc(
    new RAPIER.Ball(32)
  ).setTranslation(0, 0);

  const collider = world.createCollider(colliderDesc, body.handle);

  return { body, collider };
};

// I'm working on a character controller (2d), but I'm having some issues. I'm used to manipulating a body's velocity vector to move the player and NPCs around. From what I can see, controlling body's velocity makes it not collide with other Dynamic bodies. I suppose I have to roll my own resolver?

// Did anyone work on something similar and could share? I've searched through this discord and already picked up a few useful tips but I'm not quite there yet :p
