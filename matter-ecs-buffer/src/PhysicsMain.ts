import {
  Bodies,
  Body,
  Engine,
  IChamferableBodyDefinition,
  Render,
  World,
} from "matter-js";

export class PhysicsRunner {
  engine: Engine;
  world: World;
  render: Render | undefined;
  constructor() {
    const engine = Engine.create();
    const world = engine.world;
    engine.gravity.x = 0;
    engine.gravity.y = 0;
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
          pixelRatio: 1,
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

  public applyRandomForces() {
    for (const body of this.world.bodies) {
      if (Math.random() > 0.999) {
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * body.density * 5000,
          y: (Math.random() - 0.5) * body.density * 5000,
        });
      }
    }
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
