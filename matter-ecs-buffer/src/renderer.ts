import * as PIXI from "pixi.js";

export class Renderer {
  app: PIXI.Application;
  stage: PIXI.Container;

  constructor() {
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xcecece,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
    });
    // PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    document.body.appendChild(this.app.view);
    this.app.view.id = "pixi-view";

    this.stage = this.app.stage;

    this.resize();
  }

  private resize() {
    // resize canvas and webgl renderer when window sizeChanges
    window.addEventListener("resize", () => {
      this.app.view.width = window.innerWidth;
      this.app.view.height = window.innerHeight;
    });
  }
}
