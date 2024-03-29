import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber/index.js";
import { CityNodeData } from "../node/CityNode";
import { playerInfo, ScalingGraphics } from "../utils";
interface PlayerProps extends ScalingGraphics {
  node: CityNodeData;
}

const TYPE = "Player";
export const behavior = {
  customDisplayObject: (props: PlayerProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: PlayerProps | undefined,
    newProps: PlayerProps
  ) {
    const { node, heightRatio, widthRatio } = newProps;
    if (
      oldProps?.node?.players !== node.players ||
      oldProps?.heightRatio !== heightRatio ||
      oldProps?.widthRatio !== widthRatio
    ) {
      instance.clear();
      const intervalSize =
        Math.max(28 * widthRatio, 10) / (node.players.length + 1);

      node?.players.forEach((playerIndex, index) => {
        const playerColor = playerInfo[playerIndex];
        const baseXPosition = -20 * heightRatio + intervalSize * (index + 1);
        instance.lineStyle(3 * widthRatio, 0x000000);
        instance.beginFill(playerColor);
        const baseX = node.x + baseXPosition;
        const baseY = node.y + 14 * heightRatio;
        instance.drawCircle(baseX, baseY, Math.max(7 * widthRatio, 4));
        instance.drawRect(
          baseX - Math.max(7 * widthRatio, 4),
          baseY + Math.max(7 * heightRatio, 4),
          Math.max(14 * widthRatio, 8),
          Math.max(14 * widthRatio, 8)
        );
        instance.endFill();
      });
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
