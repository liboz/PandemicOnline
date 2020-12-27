import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
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
    oldProps: CityNodeProps,
    newProps: CityNodeProps
  ) {
    const { node, heightRatio, widthRatio } = newProps;
    instance.lineStyle(3, 0x000000);
    instance.beginFill(0xffffff);
    const baseX = node.x;
    const baseY = node.y;
    instance.drawPolygon([
      new PIXI.Point(baseX + 10 * widthRatio, baseY + 5 * heightRatio),
      new PIXI.Point(baseX, baseY + 20 * heightRatio),
      new PIXI.Point(baseX, baseY + 30 * heightRatio),
      new PIXI.Point(baseX + 20 * widthRatio, baseY + 30 * heightRatio),
      new PIXI.Point(baseX + 20 * widthRatio, baseY + 20 * heightRatio),
    ]);
    instance.endFill();
  },
};
export default CustomPIXIComponent(behavior, TYPE);
