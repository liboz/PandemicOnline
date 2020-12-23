import { Client } from "pandemiccommon/dist/out-tsc";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { width } from "../game/Game";
import { colorNameToHex, cubesChanged } from "../utils";
import * as PIXI from "pixi.js";

interface CubeCureStatusProps {
  game: Client.Game;
  containerY: number;
}

const TYPE = "CubeCureStatus";
export const behavior = {
  customDisplayObject: (props: CubeCureStatusProps) => {
    const instance = new PIXI.Graphics();
    instance.beginFill(0x3e494b);
    instance.lineStyle(4, 0x0, 0.3);
    instance.drawRect(0, 0, width / 20, props.containerY);
    instance.endFill();
    return instance;
  },
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: CubeCureStatusProps,
    newProps: CubeCureStatusProps
  ) {
    const { game, containerY } = newProps;
    const allowedY = containerY * 0.7;
    if (
      cubesChanged(oldProps.game?.cubes, game?.cubes) ||
      cubesChanged(oldProps.game?.cured, game?.cured)
    ) {
      instance.removeChildren();
      const headerText = new PIXI.Text("Cubes");
      instance.addChild(headerText);

      Object.values(Client.Color).forEach((color, index) => {
        const baseY = (allowedY / 4) * (index % 4) + containerY * 0.3;
        const hexColor = Number(colorNameToHex(color));

        instance.beginFill(hexColor);
        instance.lineStyle(2, 0xffffff, 0.3);
        instance.drawRect(10, baseY + 2.5, 10, 10);
        instance.endFill();
        const text = new PIXI.Text(
          `${game.cubes[color]} | ${game.cured[color] ? "☑" : "☒"}`,
          {
            fontSize: 15,
          }
        );
        text.x = 0 + 25;
        text.y = baseY;
        instance.addChild(text);
      });
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
