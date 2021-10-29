import * as Matter from "matter-js";

const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Composites = Matter.Composites,
  MouseConstraint = Matter.MouseConstraint,
  Mouse = Matter.Mouse,
  Composite = Matter.Composite,
  Bodies = Matter.Bodies;

export class Physics {
  engine: Matter.Engine;
  render: Matter.Render | undefined;
  constructor() {
    var engine = Engine.create(),
      world = engine.world;

    this.engine = engine;

    // create runner
    var runner = Runner.create();
    Runner.run(runner, engine);

    // add bodies
    var stack = Composites.pyramid(
      100,
      605 - 25 - 16 * 20,
      15,
      10,
      0,
      0,
      //@ts-ignore
      function (x, y) {
        return Bodies.rectangle(x, y, 40, 40);
      }
    );

    Composite.add(world, [
      stack,
      // walls
      Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
      Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
      Bodies.rectangle(0, 300, 50, 600, { isStatic: true }),
      Bodies.rectangle(400, 605, 800, 50, { isStatic: true }),
    ]);

    // // add mouse control
    // var mouse = Mouse.create(render.canvas),
    //   mouseConstraint = MouseConstraint.create(engine, {
    //     mouse: mouse,
    //     constraint: {
    //       stiffness: 0.2,
    //       render: {
    //         visible: false,
    //       },
    //     },
    //   });

    // Composite.add(world, mouseConstraint);

    // // keep the mouse in sync with rendering
    // render.mouse = mouse;
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

      Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: 800, y: 600 },
      });
    } else {
      Render.stop(this.render);
      this.render.canvas.remove();
    }

    return this.render;
  }
}
