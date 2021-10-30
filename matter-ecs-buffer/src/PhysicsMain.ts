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
    // engine.constraintIterations = 1;
    // engine.positionIterations = 1;
    // engine.velocityIterations = 1;
    // engine.enableSleeping = true;
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

    return body;
  }

  public applyRandomForces() {
    for (const body of this.world.bodies) {
      if (Math.random() > 0.9997) {
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * body.density * 100 * Math.random(),
          y: (Math.random() - 0.5) * body.density * 100 * Math.random(),
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

  public outOfBoundCheck() {
    for (const body of this.world.bodies) {
      if (
        body.position.x < -100 ||
        body.position.x > 3000 ||
        body.position.y < 0 ||
        body.position.y > 3000
      ) {
        Body.setStatic(body, true);
      }
    }
  }
}
