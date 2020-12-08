import { Client } from "pandemiccommon/dist/out-tsc";
import * as PIXI from "pixi.js";
import { CustomPIXIComponent, withApp } from "react-pixi-fiber";
import { CityNodeData } from "../node/CityNode";
import { colorNameToHex } from "../utils";

const baseOffset = 25;

function flattenCubeMap(cubes: Client.Cubes): Client.Color[] {
  const result: Client.Color[] = [];
  for (const color of Object.values(Client.Color)) {
    const count = cubes[color];
    for (let i = 0; i < count; i++) {
      result.push(color);
    }
  }
  return result;
}

interface CubeProps {
  node: CityNodeData;
}

const TYPE = "Cube";
export const behavior = {
  customDisplayObject: (props: CubeProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: CubeProps,
    newProps: CubeProps
  ) {
    const { node } = newProps;
    if (oldProps.node?.cubes !== node.cubes) {
      const rotationStep = (2 * Math.PI * (Date.now() % 1440)) / 1440;
      const cubes = node.cubes;
      const flattenedCubeMap = flattenCubeMap(cubes);
      const totalCubes = flattenedCubeMap.length;

      const baseX = 0;
      const baseY = 0;

      flattenedCubeMap.forEach((cube, index) => {
        const radians = (2 * Math.PI * index) / totalCubes;
        const color = colorNameToHex(cube);
        if (color) {
          instance.beginFill(Number(color));
        }
        // 7 so the center of the rectangle aligns with the center of the circle
        instance.drawRect(
          baseX + baseOffset * Math.cos(radians + rotationStep) - 7,
          baseY + baseOffset * Math.sin(radians + rotationStep) - 7,
          14,
          14
        );
        if (color) {
          instance.endFill();
        }
      });
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
