import { Client } from "pandemiccommon/dist/out-tsc/";
import * as PIXI from "pixi.js";
import { colorNameToHex } from "src/app/utils";

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
  cubes: PIXI.Graphics[];
  players: PIXI.Graphics[];
  mainNode: PIXI.Graphics;
  text: PIXI.Text;
}

export function getAllSubelements(node: PIXICityNode): PIXI.Graphics[] {
  const result: PIXI.Graphics[] = [];
  for (const attribute in node) {
    if (attribute !== "mainNode" && attribute != "text") {
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

export function renderNode(node: CityNode): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  const color = colorNameToHex(node.color);
  if (color) {
    graphics.lineStyle(5, Number(color));
    graphics.beginFill(Number(color));
  }
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
