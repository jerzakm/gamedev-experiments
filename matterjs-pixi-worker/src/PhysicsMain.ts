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

  public applyForceToRandomBody() {
    const bodyIndex = Math.round(Math.random() * this.world.bodies.length);
    const body = this.world.bodies[bodyIndex];
    if (!body) return;
    Body.applyForce(body, body.position, {
      x: (Math.random() - 0.5) * body.density * 25 * Math.random(),
      y: (Math.random() - 0.5) * body.density * 25 * Math.random(),
    });
  }

  public getBodySyncData() {
    const bodyData: any = {};

    for (let i = 0; i < this.world.bodies.length; i++) {
      bodyData[this.world.bodies[i].id] = {
        x: this.world.bodies[i].position.x,
        y: this.world.bodies[i].position.y,
        angle: this.world.bodies[i].angle,
      };
    }

    return bodyData;
  }

  public outOfBoundCheck() {
    for (let i = 0; i < this.world.bodies.length; i++) {
      if (
        this.world.bodies[i].position.x < -100 ||
        this.world.bodies[i].position.x > 3000 ||
        this.world.bodies[i].position.y < 0 ||
        this.world.bodies[i].position.y > 3000
      ) {
        Body.setStatic(this.world.bodies[i], true);
      }
    }
  }
}
