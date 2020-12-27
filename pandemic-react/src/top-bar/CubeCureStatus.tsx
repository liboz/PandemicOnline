import { Client } from "pandemiccommon/dist/out-tsc";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { width } from "../game/Game";
import { colorNameToHex, cubesChanged, ScalingGraphics } from "../utils";
import * as PIXI from "pixi.js";

interface CubeCureStatusProps extends ScalingGraphics {
  game: Client.Game;
  containerY: number;
}

function calculateAllowedY(containerY: number) {
  return containerY * 0.7;
}

function calculateBaseY(allowedY: number, index: number, containerY: number) {
  return (allowedY / 4) * (index % 4) + containerY * 0.3;
}

const TYPE = "CubeCureStatus";
export const behavior = {
  customDisplayObject: (props: CubeCureStatusProps) => {
    const { containerY, widthRatio, heightRatio } = props;
    const allowedY = calculateAllowedY(containerY);
    const instance = new PIXI.Graphics();
    instance.beginFill(0x3e494b);
    instance.lineStyle(4, 0x0, 0.3);
    instance.drawRect(0, 0, (width / 20) * widthRatio, props.containerY);
    instance.endFill();

    Object.values(Client.Color).forEach((color, index) => {
      const baseY = calculateBaseY(allowedY, index, containerY);
      const hexColor = Number(colorNameToHex(color));

      instance.beginFill(hexColor);
      instance.lineStyle(2, 0xffffff, 0.3);
      instance.drawRect(
        10 * widthRatio,
        baseY + 2.5 * heightRatio,
        10 * widthRatio,
        10 * widthRatio
      );
      instance.endFill();
    });

    return instance;
  },
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: CubeCureStatusProps,
    newProps: CubeCureStatusProps
  ) {
    const { game, containerY, widthRatio, heightRatio } = newProps;
    if (
      cubesChanged(oldProps.game?.cubes, game?.cubes) ||
      cubesChanged(oldProps.game?.cured, game?.cured)
    ) {
      const allowedY = calculateAllowedY(containerY);
      instance.removeChildren();
      const headerText = new PIXI.Text("Cubes", { fontSize: 24 * widthRatio });
      headerText.x = 10 * widthRatio;
      instance.addChild(headerText);

      Object.values(Client.Color).forEach((color, index) => {
        const baseY = calculateBaseY(allowedY, index, containerY);
        const curedStatusIcon = (function (status: number) {
          switch (status) {
            case 1:
              return "☑";
            case 2:
              return "★";
            default:
              return "☒";
          }
        })(game.cured[color]);

        const text = new PIXI.Text(
          `${game.cubes[color]} | ${curedStatusIcon}`,
          {
            fontSize: 15 * widthRatio,
          }
        );
        text.x = 0 + 25 * widthRatio;
        text.y = baseY;
        instance.addChild(text);
      });
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
