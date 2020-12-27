import { Client } from "pandemiccommon/dist/out-tsc";
import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
import { barBaseHeight, height, width } from "../game/Game";
import { playerInfo } from "../player/Player";
import { colorNameToHex } from "../utils";

function generateHand(
  player: Client.Player,
  game: Client.Game,
  heightAllowed: number,
  widthAllowed: number,
  widthRatio: number,
  heightRatio: number
) {
  const infoTextFontSize = 20;
  const infoTextFontSizeWithPadding = infoTextFontSize + 5;

  const container = new PIXI.Container();
  const graphics = new PIXI.Graphics();
  graphics.beginFill(playerInfo[player.id]);
  graphics.lineStyle(4, 0x0, 0.3);
  graphics.drawRect(
    0,
    0,
    (width / 6) * widthRatio,
    barBaseHeight * heightRatio
  );
  graphics.endFill();
  container.addChild(graphics);

  const infoTextRaw = `Player ${player.id} (${player.name}) - ${player.role}`;
  const infoText = new PIXI.Text(infoTextRaw, {
    fontSize: infoTextFontSize * widthRatio,
  });
  container.addChild(infoText);
  const heightLeft = heightAllowed - infoTextFontSizeWithPadding * heightRatio;
  const heightPerCard = heightLeft / 4;

  player.hand.forEach((card, index) => {
    const baseY =
      infoTextFontSizeWithPadding * heightRatio + heightPerCard * (index % 4);
    const color = game.game_graph[game.game_graph_index[card]].color;
    const hexColor = Number(colorNameToHex(color));

    const baseX = index >= 4 ? widthAllowed / 2 : 0;
    graphics.beginFill(hexColor);
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.drawRect(
      baseX + 10 * widthRatio,
      baseY + 2.5 * heightRatio,
      10 * widthRatio,
      10 * widthRatio
    );
    graphics.endFill();
    const cityName = new PIXI.Text(card, { fontSize: 15 * widthRatio });
    cityName.x = baseX + 25 * widthRatio;
    cityName.y = baseY;
    container.addChild(cityName);
  });

  return container;
}

interface HandProps {
  game: Client.Game;
  containerY: number;
  widthRatio: number;
  heightRatio: number;
}

const TYPE = "BotHand";
export const behavior = {
  customDisplayObject: (props: HandProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: HandProps,
    newProps: HandProps
  ) {
    const { game, containerY, widthRatio, heightRatio } = newProps;
    if (oldProps.game?.players !== game?.players) {
      instance.clear();
      instance.removeChildren();
      instance.beginFill(0x3e494b);
      instance.lineStyle(4, 0x0, 0.3);
      instance.drawRect(
        0,
        0,
        (width / 6) * widthRatio,
        barBaseHeight * heightRatio
      );
      instance.endFill();

      if (game.players) {
        const sizePerPlayer =
          ((height - containerY) / game.players.length) * heightRatio;
        game.players.forEach((player, index) => {
          const handContainer = generateHand(
            player,
            game,
            sizePerPlayer,
            (width / 6) * widthRatio,
            widthRatio,
            heightRatio
          );
          handContainer.y = sizePerPlayer * index;
          instance.addChild(handContainer);
          instance.lineStyle(4, 0x0, 0.3);
          instance.moveTo(0, sizePerPlayer * index);
          instance.lineTo((width / 6) * widthRatio, sizePerPlayer * index);
        });
      }
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
