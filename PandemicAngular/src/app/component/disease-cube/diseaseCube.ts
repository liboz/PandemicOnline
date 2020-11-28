import { Component, OnInit, Input } from "@angular/core";
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

export function maybeGenerateCubes(node: CityNode): PIXI.Graphics[] {
  const rotationStep = (2 * Math.PI * (Date.now() % 1440)) / 1440;
  const cubes = node.cubes;
  let count = Number(
    Object.values(cubes).reduce((a: number, b: number) => a + b, 0)
  );
  const result: PIXI.Graphics[] = [];
  const flattenedCubeMap = flattenCubeMap(cubes);
  const totalCubes = flattenedCubeMap.length;

  const baseX = node.x;
  const baseY = node.y;

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
    result.push(graphics);
  });

  return result;
}
