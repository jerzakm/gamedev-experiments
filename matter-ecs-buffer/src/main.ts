import "./style/global.css";
import * as PIXI from "pixi.js";
import { Renderer } from "./renderer";
import "./phys";

const start = async () => {
  const { app, stage } = new Renderer();

  const container = new PIXI.Container();

  stage.addChild(container);

  // Create a new texture
  const texture = PIXI.Texture.from("square.png");

  // Create a 5x5 grid of bunnies
  for (let i = 0; i < 25; i++) {
    const bunny = new PIXI.Sprite(texture);
    bunny.anchor.set(0.5);
    bunny.x = (i % 5) * 40;
    bunny.y = Math.floor(i / 5) * 40;
    container.addChild(bunny);
  }

  // Move container to the center
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;

  // Center bunny sprite in local container coordinates
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;

  // Listen for animate update
  app.ticker.add((delta) => {
    // rotate the container!
    // use delta to create frame-independent transform
    container.rotation -= 0.001 * delta;
  });
};

// start();

// main.ts

import MyWorker from "./worker?worker";

async function init() {
  const worker = new MyWorker();
  worker.postMessage("message");
}

init();
