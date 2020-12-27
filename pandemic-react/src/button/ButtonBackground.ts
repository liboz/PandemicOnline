import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { ButtonProps } from "./button";

type ButtonBackgroundProps = Required<
  Omit<ButtonProps, "mouseover" | "mousemove" | "mouseout">
>;
const TYPE = "ButtonBackground";
const behavior = {
  customDisplayObject: (props: ButtonBackgroundProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: ButtonBackgroundProps,
    newProps: ButtonBackgroundProps
  ) {
    const { x, y, width, height, disabled, widthRatio, heightRatio } = newProps;
    if (
      oldProps.x !== x ||
      oldProps.y !== y ||
      oldProps.width !== width ||
      oldProps.height !== height
    ) {
      instance.clear();
      instance.beginFill(0x7a6f64);
      instance.lineStyle(4, 0x0, 0.3);
      instance.drawRoundedRect(
        x * widthRatio,
        y * heightRatio,
        width * widthRatio,
        height * heightRatio,
        30 * heightRatio
      );
      instance.endFill();
    }
    if (oldProps.disabled !== disabled) {
      instance.alpha = disabled ? 0.2 : 1.0;
    }
  },
};

export default CustomPIXIComponent(behavior, TYPE);
