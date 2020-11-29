import { Client } from "pandemiccommon/dist/out-tsc";
import * as PIXI from "pixi.js";
import { colorNameToHex } from "src/app/utils";
import CityNode from "../node/node";

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

export function maybeGenerateCubes(node: CityNode): PIXI.Container {
  const rotationStep = (2 * Math.PI * (Date.now() % 1440)) / 1440;
  const cubes = node.cubes;
  const container = new PIXI.Container();
  container.x = node.x;
  container.y = node.y;
  const flattenedCubeMap = flattenCubeMap(cubes);
  const totalCubes = flattenedCubeMap.length;

  const baseX = 0;
  const baseY = 0;

  flattenedCubeMap.forEach((cube, index) => {
    const radians = (2 * Math.PI * index) / totalCubes;
    const color = colorNameToHex(cube);
    const graphics = new PIXI.Graphics();
    if (color) {
      graphics.beginFill(Number(color));
    }
    // 7 so the center of the rectangle aligns with the center of the circle
    graphics.drawRect(
      baseX + baseOffset * Math.cos(radians + rotationStep) - 7,
      baseY + baseOffset * Math.sin(radians + rotationStep) - 7,
      14,
      14
    );
    if (color) {
      graphics.endFill();
    }
    container.addChild(graphics);
  });

  return container;
}
