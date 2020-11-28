import { Client } from "pandemiccommon/dist/out-tsc/";
import * as PIXI from "pixi.js";

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
