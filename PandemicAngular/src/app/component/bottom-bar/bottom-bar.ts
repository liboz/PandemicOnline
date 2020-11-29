import { Client } from "pandemiccommon/dist/out-tsc";
import * as PIXI from "pixi.js";
import Button from "../button/button";

export function renderBottomBar(
  game: Client.Game,
  bottomBarCanvas: PIXI.Application
) {
  const graphics = new PIXI.Graphics();
  const button1 = new Button({
    label: "Play",
    x: 0,
    y: 0,
    width: 200,
    height: 80,
    onTap: () => console.log("Play"),
  });
  const button2 = new Button({
    label: "Settings",
    x: 100,
    y: 100,
    width: 300,
    height: 110,
    onTap: () => console.log("Settings"),
  });
  graphics.addChild(button1, button2);

  bottomBarCanvas.stage.addChild(graphics);
}
