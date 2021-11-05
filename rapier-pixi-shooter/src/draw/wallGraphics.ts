import { Collider, RigidBody } from "@dimforge/rapier2d-compat";
import { Graphics } from "pixi.js";
import { WallDefinition } from "../physics/wallFactory";
import { WALL } from "./_colorTheme";

export const initWallGraphics = () => {
  const wallGraphics = new Graphics();

  const drawWalls = (
    walls: {
      body: RigidBody;
      collider: Collider;
      definition: WallDefinition;
    }[]
  ) => {
    wallGraphics.clear();
    wallGraphics.beginFill(WALL.fill, WALL.alpha);
    wallGraphics.lineStyle({
      alpha: WALL.alpha,
      color: WALL.stroke,
      width: WALL.strokeWidth,
    });
    for (const wall of walls) {
      const { x, y } = wall.body.translation();
      const halfW = wall.collider.halfExtents().x;
      const halfH = wall.collider.halfExtents().y;
      wallGraphics.drawRect(
        x - halfW,
        y - halfH,
        wall.collider.halfExtents().x * 2,
        wall.collider.halfExtents().y * 2
      );
    }
    wallGraphics.endFill();
  };

  return { wallGraphics, drawWalls };
};
