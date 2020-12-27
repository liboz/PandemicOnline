import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { CityNodeData } from "../node/CityNode";
import { ScalingGraphics } from "../utils";

export const playerInfo: Record<number, number> = {
  0: 0x42d4f4,
  1: 0x911eb4,
  2: 0x800000,
  3: 0xf58231,
};

interface PlayerProps extends ScalingGraphics {
  node: CityNodeData;
}

const TYPE = "Player";
export const behavior = {
  customDisplayObject: (props: PlayerProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: PlayerProps,
    newProps: PlayerProps
  ) {
    const { node, heightRatio, widthRatio } = newProps;
    if (oldProps.node?.players !== node.players) {
      instance.clear();
      const intervalSize = (28 * widthRatio) / (node.players.length + 1);

      node?.players.forEach((playerIndex, index) => {
        const playerColor = playerInfo[playerIndex];
        const baseXPosition = -20 * heightRatio + intervalSize * (index + 1);
        instance.lineStyle(3, 0x000000);
        instance.beginFill(playerColor);
        const baseX = node.x + baseXPosition;
        const baseY = node.y + 14 * heightRatio;
        instance.drawCircle(baseX, baseY, 7 * widthRatio);
        instance.drawRect(
          baseX - 7 * widthRatio,
          baseY + 7 * heightRatio,
          14 * widthRatio,
          14 * widthRatio
        );
        instance.endFill();
      });
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
