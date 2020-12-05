import * as PIXI from "pixi.js";

interface ButtonSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  disabled: boolean;
  onTap: () => void;
}

export default class Button extends PIXI.Container {
  constructor(settings: ButtonSettings) {
    const { x, y, width, height, label, disabled, onTap } = settings;
    super();
    this.interactive = true;
    var graphics = new PIXI.Graphics();
    graphics.alpha = disabled ? 0.2 : 1.0;
    graphics.beginFill(0x7a6f64);
    graphics.lineStyle(4, 0x0, 0.3);
    graphics.drawRoundedRect(x, y, width, height, 30);
    graphics.endFill();

    var text = new PIXI.Text(label);
    text.x = x + width / 3;
    text.y = y + height / 3;
    text.style.fill = disabled ? 0x696969 : 0x000000;
    this.addChild(graphics, text);
    this.buttonMode = true;
    this.interactive = true;
    this.on("click", onTap);
    this.on("tap", onTap);
  }
}
