import {
  Bodies,
  Engine,
  IChamferableBodyDefinition,
  Render,
  World,
} from "matter-js";

export class PhysicsMain {
  engine: Engine;
  world: World;
  render: Render | undefined;
  constructor() {
    const engine = Engine.create();
    const world = engine.world;
    this.engine = engine;
    this.world = world;
  }

  public toggleDebugRenderer() {
    if (!this.render) {
      const render = Render.create({
        element: document.body,
        engine: this.engine,
        options: {
          width: window.innerWidth,
          height: window.innerHeight,
          showAngleIndicator: true,
          background: "transparent",
          wireframeBackground: "transparent",
        },
      });

      render.canvas.id = "matter-canvas";

      Render.run(render);
      this.render = render;
    } else {
      Render.stop(this.render);
      this.render.canvas.remove();
    }
  }

  public addBody(
    x: number,
    y: number,
    width: number,
    height: number,
    options: IChamferableBodyDefinition
  ) {
    const body = Bodies.rectangle(x, y, width, height, options);
    World.addBody(this.world, body);

    return body.id;
  }

  public getBodySyncData() {
    const bodyData: any = {};

    for (const body of this.world.bodies) {
      bodyData[body.id] = {
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
      };
    }

    return bodyData;
  }
}
