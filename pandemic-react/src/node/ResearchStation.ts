import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { CityNodeData } from "./CityNode";

interface CityNodeProps {
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
    const { node } = newProps;
    instance.lineStyle(3, 0x000000);
    instance.beginFill(0xffffff);
    const baseX = node.x;
    const baseY = node.y;
    instance.drawPolygon([
      new PIXI.Point(baseX + 10, baseY + 5),
      new PIXI.Point(baseX, baseY + 20),
      new PIXI.Point(baseX, baseY + 30),
      new PIXI.Point(baseX + 20, baseY + 30),
      new PIXI.Point(baseX + 20, baseY + 20),
    ]);
    instance.endFill();
  },
};
export default CustomPIXIComponent(behavior, TYPE);
