import { Client } from "pandemiccommon/dist/out-tsc/";
import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { colorNameToHex, ScalingGraphics } from "../utils";

export interface CityNodeData {
  id: number;
  x: number;
  y: number;
  color: Client.Color;
  name: string;
  cubes: Client.Cubes;
  hasResearchStation: boolean;
  players: number[];
  isValidDestination?: boolean;
}
interface CityNodeProps extends ScalingGraphics {
  node: CityNodeData;
  isMoving: boolean;
}

const TYPE = "CityNodes";
export const behavior = {
  customDisplayObject: (props: CityNodeProps) => {
    const instance = new PIXI.Graphics();
    const { node, widthRatio } = props;
    const color = colorNameToHex(node.color);
    if (color) {
      instance.lineStyle(5, Number(color));
      instance.beginFill(Number(color));
    }
    instance.drawCircle(node.x, node.y, 10 * widthRatio);
    if (color) {
      instance.endFill();
    }
    return instance;
  },
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: CityNodeProps,
    newProps: CityNodeProps
  ) {
    const { node, isMoving } = newProps;
    if (
      oldProps?.node?.isValidDestination !== node.isValidDestination ||
      oldProps.isMoving !== newProps.isMoving
    ) {
      instance.alpha = isMoving && !node.isValidDestination ? 0.1 : 1.0;
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
