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
  isValidDispatcherDestination?: Record<number, boolean>;
}
interface CityNodeProps extends ScalingGraphics {
  node: CityNodeData;
  isMoving: boolean;
  dispatcherMoveOtherPlayer?: number;
}

function isValidDispatcherDestinationChanged(
  old: Record<number, boolean> | undefined,
  newValue: Record<number, boolean> | undefined
) {
  return JSON.stringify(old) === JSON.stringify(newValue);
}

const TYPE = "CityNodes";
export const behavior = {
  customDisplayObject: (props: CityNodeProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: CityNodeProps,
    newProps: CityNodeProps
  ) {
    const { node, isMoving, widthRatio, dispatcherMoveOtherPlayer } = newProps;
    if (
      oldProps.node?.x !== node.x ||
      oldProps.node?.y !== node.y ||
      oldProps.widthRatio !== widthRatio
    ) {
      instance.clear();
      const color = colorNameToHex(node.color);
      if (color) {
        instance.lineStyle(5, Number(color));
        instance.beginFill(Number(color));
      }
      instance.drawCircle(node.x, node.y, 10 * widthRatio);
      if (color) {
        instance.endFill();
      }
    }
    if (
      oldProps?.node?.isValidDestination !== node.isValidDestination ||
      oldProps.isMoving !== newProps.isMoving ||
      oldProps?.dispatcherMoveOtherPlayer !== dispatcherMoveOtherPlayer ||
      isValidDispatcherDestinationChanged(
        oldProps?.node?.isValidDispatcherDestination,
        node?.isValidDispatcherDestination
      )
    ) {
      if (dispatcherMoveOtherPlayer !== undefined) {
        instance.alpha =
          isMoving &&
          (node.isValidDispatcherDestination === undefined ||
            !node.isValidDispatcherDestination[dispatcherMoveOtherPlayer])
            ? 0.1
            : 1.0;
      } else {
        instance.alpha = isMoving && !node.isValidDestination ? 0.1 : 1.0;
      }
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
