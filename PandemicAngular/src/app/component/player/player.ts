import CityNode from "../node/node";
import * as PIXI from "pixi.js";

export const playerInfo: Record<number, number> = {
  0: 0x42d4f4,
  1: 0x911eb4,
  2: 0x800000,
  3: 0xf58231,
};

export function maybeGeneratePlayerIcons(node: CityNode): PIXI.Graphics[] {
  const result: PIXI.Graphics[] = [];
  const intervalSize = 28 / (node.players.length + 1);

  node.players.forEach((playerIndex, index) => {
    const playerColor = playerInfo[playerIndex];
    const baseXPosition = -20 + intervalSize * (index + 1);
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(3, 0x000000);
    graphics.beginFill(playerColor);
    const baseX = node.x + baseXPosition;
    const baseY = node.y + 14;
    graphics.drawCircle(baseX, baseY, 7);
    graphics.drawRect(baseX - 7, baseY + 7, 14, 14);
    graphics.endFill();
    result.push(graphics);
  });

  return result;
}
