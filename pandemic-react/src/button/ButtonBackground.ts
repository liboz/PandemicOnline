import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { ButtonProps } from "./button";

const TYPE = "ButtonBackground";
const behavior = {
  customDisplayObject: (props: ButtonProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: ButtonProps,
    newProps: ButtonProps
  ) {
    const { x, y, width, height, disabled } = newProps;
    if (
      oldProps.x !== x ||
      oldProps.y !== y ||
      oldProps.width !== width ||
      oldProps.height !== height ||
      oldProps.disabled !== disabled
    ) {
      instance.beginFill(0x7a6f64);
      instance.lineStyle(4, 0x0, 0.3);
      instance.drawRoundedRect(x, y, width, height, 30);
      instance.endFill();
    }
    if (oldProps.disabled !== disabled) {
      instance.alpha = disabled ? 0.2 : 1.0;
    }
  },
};

export default CustomPIXIComponent(behavior, TYPE);
