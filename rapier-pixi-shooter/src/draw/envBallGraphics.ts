import { Collider, RigidBody } from "@dimforge/rapier2d-compat";
import { Graphics } from "pixi.js";
import { BallDefinition } from "../physics/ballFactory";
import { ENV_BALL } from "./_colorTheme";

export const initEnvBallGraphics = () => {
  const envBallGraphics = new Graphics();

  const drawEnvBalls = (
    balls: {
      body: RigidBody;
      collider: Collider;
      definition: BallDefinition;
    }[]
  ) => {
    envBallGraphics.clear();
    envBallGraphics.beginFill(ENV_BALL.fill, ENV_BALL.alpha);
    envBallGraphics.lineStyle({
      alpha: ENV_BALL.alpha,
      color: ENV_BALL.stroke,
      width: ENV_BALL.strokeWidth,
    });
    for (const ball of balls) {
      const { x, y } = ball.body.translation();
      const radius = ball.collider.radius();
      envBallGraphics.drawCircle(x, y, radius);
      envBallGraphics.drawRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    envBallGraphics.endFill();
  };

  return { envBallGraphics, drawEnvBalls };
};
