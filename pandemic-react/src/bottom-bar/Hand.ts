import { Client } from "pandemiccommon/dist/out-tsc";
import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { barBaseHeight, height, width } from "../game/Game";
import { CityNodeData } from "../node/CityNode";
import { colorNameToHex, hasStarted } from "../utils";

function generateHand(
  player: Client.Player,
  game: Client.Game,
  heightAllowed: number,
  widthAllowed: number
) {
  const infoTextFontSize = 20;
  const infoTextFontSizeWithPadding = infoTextFontSize + 5;

  const container = new PIXI.Container();
  const infoTextRaw = `Player ${player.id} (${player.name}) - ${player.role}`;
  const infoText = new PIXI.Text(infoTextRaw, { fontSize: infoTextFontSize });
  container.addChild(infoText);
  const heightLeft = heightAllowed - infoTextFontSizeWithPadding;
  const heightPerCard = heightLeft / 4;

  const graphics = new PIXI.Graphics();
  player.hand.forEach((card, index) => {
    const baseY = infoTextFontSizeWithPadding + heightPerCard * (index % 4);
    const color = game.game_graph[game.game_graph_index[card]].color;
    const hexColor = Number(colorNameToHex(color));

    const baseX = index >= 4 ? widthAllowed / 2 : 0;
    graphics.beginFill(hexColor);
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.drawRect(baseX + 10, baseY + 2.5, 10, 10);
    graphics.endFill();
    const cityName = new PIXI.Text(card, { fontSize: 15 });
    cityName.x = baseX + 25;
    cityName.y = baseY;
    container.addChild(cityName);
    container.addChild(graphics);
  });

  return container;
}

interface BottomBarProps {
  game: Client.Game;
  containerY: number;
}

const TYPE = "Hand";
export const behavior = {
  customDisplayObject: (props: BottomBarProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: BottomBarProps,
    newProps: BottomBarProps
  ) {
    const { game, containerY } = newProps;
    if (oldProps.game?.players != game?.players) {
      instance.clear();
      instance.removeChildren();
      instance.beginFill(0x3e494b);
      instance.lineStyle(4, 0x0, 0.3);
      instance.drawRect(0, 0, width / 6, barBaseHeight);
      instance.endFill();

      const sizePerPlayer = (height - containerY) / game.players.length;
      game.players.forEach((player, index) => {
        const handContainer = generateHand(
          player,
          game,
          sizePerPlayer,
          width / 6
        );
        handContainer.y = sizePerPlayer * index;
        instance.addChild(handContainer);
        instance.lineStyle(4, 0x0, 0.3);
        instance.moveTo(0, sizePerPlayer * index);
        instance.lineTo(width / 6, sizePerPlayer * index);
      });
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
