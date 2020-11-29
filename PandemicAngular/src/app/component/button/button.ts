import * as PIXI from "pixi.js";

interface ButtonSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onTap: () => void;
}

export default class Button extends PIXI.Container {
  constructor(settings: ButtonSettings) {
    super();
    this.interactive = true;
    var graphics = new PIXI.Graphics();
    graphics.beginFill(0x3e494b);
    graphics.lineStyle(4, 0x0, 0.3);
    graphics.drawRoundedRect(
      settings.x,
      settings.y,
      settings.width,
      settings.height,
      30
    );
    graphics.endFill();

    var text = new PIXI.Text(settings.label);
    text.x = settings.x + settings.width / 3;
    text.y = settings.y + settings.height / 3;
    this.addChild(graphics, text);
    this.buttonMode = true;
    this.interactive = true;
    this.on("click", settings.onTap);
    this.on("tap", settings.onTap);
  }
}
