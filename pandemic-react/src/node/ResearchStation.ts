import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber/index.js";
import { ScalingGraphics } from "../utils";
import { CityNodeData } from "./CityNode";

interface CityNodeProps extends ScalingGraphics {
  node: CityNodeData;
}

const TYPE = "ResearchStation";
export const behavior = {
  customDisplayObject: (props: CityNodeProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: CityNodeProps | undefined,
    newProps: CityNodeProps
  ) {
    const { node, heightRatio, widthRatio } = newProps;
    instance.clear();
    instance.lineStyle(3 * widthRatio, 0x000000);
    instance.beginFill(0xffffff);
    const baseX = node.x;
    const baseY = node.y;
    instance.drawPolygon([
      new PIXI.Point(
        baseX + Math.max(10 * widthRatio, 6),
        baseY + Math.max(5 * heightRatio, 3)
      ),
      new PIXI.Point(baseX, baseY + Math.max(20 * heightRatio, 12)),
      new PIXI.Point(baseX, baseY + Math.max(30 * heightRatio, 18)),
      new PIXI.Point(
        baseX + Math.max(20 * widthRatio, 12),
        baseY + Math.max(30 * heightRatio, 18)
      ),
      new PIXI.Point(
        baseX + Math.max(20 * widthRatio, 12),
        baseY + Math.max(20 * heightRatio, 12)
      ),
    ]);
    instance.endFill();
  },
};
export default CustomPIXIComponent(behavior, TYPE);
