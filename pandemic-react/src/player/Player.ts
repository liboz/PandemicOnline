import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { CityNodeData } from "../node/CityNode";

export const playerInfo: Record<number, number> = {
  0: 0x42d4f4,
  1: 0x911eb4,
  2: 0x800000,
  3: 0xf58231,
};

interface PlayerProps {
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
    const { node } = newProps;
    if (oldProps.node?.players !== node.players) {
      instance.clear();
      const intervalSize = 28 / (node.players.length + 1);

      node?.players.forEach((playerIndex, index) => {
        const playerColor = playerInfo[playerIndex];
        const baseXPosition = -20 + intervalSize * (index + 1);
        instance.lineStyle(3, 0x000000);
        instance.beginFill(playerColor);
        const baseX = node.x + baseXPosition;
        const baseY = node.y + 14;
        instance.drawCircle(baseX, baseY, 7);
        instance.drawRect(baseX - 7, baseY + 7, 14, 14);
        instance.endFill();
      });
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
