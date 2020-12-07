import { Client } from "pandemiccommon/dist/out-tsc/";
import * as PIXI from "pixi.js";
import { colorNameToHex } from "../utils";

export default interface CityNode {
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

export interface PIXICityNode {
  researchStation?: PIXI.Graphics;
  cubes?: PIXI.Container;
  players: PIXI.Graphics[];
  mainNode: PIXI.Graphics;
  container: PIXI.Container;
  text: PIXI.Text;
}

/*
export function getAllSubelements(node: PIXICityNode): PIXI.Graphics[] {
  const result: PIXI.Graphics[] = [];
  for (const attribute in node) {
    if (
      attribute !== "mainNode" &&
      attribute != "text" &&
      attribute != "container"
    ) {
      const value = node[attribute];
      if (Array.isArray(value)) {
        result.push(...value);
      } else {
        result.push(value);
      }
    }
  }
  return result;
}
*/

export function renderNode(node: CityNode, isMoving: boolean): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  const color = colorNameToHex(node.color);
  if (color) {
    graphics.lineStyle(5, Number(color));
    graphics.beginFill(Number(color));
  }
  graphics.alpha = isMoving && !node.isValidDestination ? 0.1 : 1.0;
  graphics.drawCircle(node.x, node.y, 10);
  if (color) {
    graphics.endFill();
  }
  return graphics;
}

export function renderNodeText(node: CityNode): PIXI.Text {
  var text = new PIXI.Text(node.name, {
    fill: 0xffffff,
    fontSize: 18,
    stroke: "black",
    strokeThickness: 3,
    align: "center",
  });
  text.x = node.x - 30;
  text.y = node.y - 30;
  return text;
}
