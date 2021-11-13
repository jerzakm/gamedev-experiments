import { World, Vector2 } from "@dimforge/rapier2d-compat";
import { Graphics } from "pixi.js";
import { PLAYER } from "./draw/_colorTheme";
import { RAPIER } from "./physics/core";

const MOVE_SPEED = 80;
const ACCELERATION = 40;

export const setupPlayer = (world: World, RAPIER: RAPIER) => {
  const updatePlayer = () => {
    // Mouse only logic start
    if (goal) {
      const position = body.translation();

      const distanceFromGoal = Math.sqrt(
        (position.x - goal.x) ** 2 + (position.y - goal.y) ** 2
      );
      if (distanceFromGoal < 3) {
        body.setTranslation(goal, true);
        direction.x = 0;
        direction.y = 0;
        goal = undefined;
      } else {
        const x = goal.x - position.x;
        const y = goal.y - position.y;
        const div = Math.max(Math.abs(x), Math.abs(y));
        direction.x = x / div;
        direction.y = y / div;
      }
    }
    // mouseonly logic end

    // Approach 1 - just setting velocity
    // body.setLinvel(
    //   { x: direction.x * MOVE_SPEED, y: direction.y * MOVE_SPEED },
    //   true
    // );

    // Approach 2 - Applying impulse to body
    const velocity = body.linvel();
    const impulse = {
      x: (direction.x * MOVE_SPEED - velocity.x) * ACCELERATION,
      y: (direction.y * MOVE_SPEED - velocity.y) * ACCELERATION,
    };
    body.applyImpulse(impulse, true);
  };

  const drawPlayer = (delta = 16) => {
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

    if (goal) {
      playerGraphics.lineStyle({
        alpha: PLAYER.alpha,
        color: 0xff2222,
        width: PLAYER.strokeWidth,
      });
      playerGraphics.drawCircle(
        goal.x,
        goal.y,
        Math.sin(performance.now()) * 2 * delta + 20
      );
    }
  };

  const setupKeyMouseListeners = () => {
    // move on keydown
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "w": {
          direction.y = -1;
          break;
        }
        case "s": {
          direction.y = 1;
          break;
        }
        case "a": {
          direction.x = -1;
          break;
        }
        case "d": {
          direction.x = 1;
          break;
        }
      }
    });

    // stop on keyup
    window.addEventListener("keyup", (e) => {
      switch (e.key) {
        case "w": {
          direction.y = 0;
          break;
        }
        case "s": {
          direction.y = 0;
          break;
        }
        case "a": {
          direction.x = 0;
          break;
        }
        case "d": {
          direction.x = 0;
          break;
        }
      }
    });

    // click to move - set goal
    document.addEventListener("pointerdown", (e) => {
      const { clientX, clientY } = e;

      goal = {
        x: clientX,
        y: clientY,
      };
    });
  };

  const { body, collider } = makePlayerPhysicsBody(world, RAPIER);

  const playerGraphics = new Graphics();

  const direction: Vector2 = {
    x: 0,
    y: 0,
  };

  let goal: Vector2 | undefined;

  collider.setActiveHooks(RAPIER.ActiveHooks.FILTER_CONTACT_PAIRS);

  setupKeyMouseListeners();

  return { playerGraphics, drawPlayer, updatePlayer };
};

const makePlayerPhysicsBody = (world: World, RAPIER: RAPIER) => {
  // create player's body and place it in the middle of the screen
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.newDynamic().setTranslation(
      window.innerWidth / 2,
      window.innerHeight / 2
    )
  );
  // create a collider that describes the shape of player's body
  let colliderDesc = new RAPIER.ColliderDesc(
    new RAPIER.Ball(12)
  ).setTranslation(0, 0);

  // attach the collider to the body and add it to the world
  const collider = world.createCollider(colliderDesc, body.handle);

  return { body, collider };
};
