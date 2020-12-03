import { Client } from "pandemiccommon/dist/out-tsc";
import * as PIXI from "pixi.js";
import { colorNameToHex } from "src/app/utils";
import Button from "../button/button";

export const width = 1920;
export const height = 960;

const barBaseHeight = height - 100;

function hasStarted(game: Client.Game) {
  return game?.game_state !== Client.GameState.NotStarted;
}

function renderTurnInfo(
  game: Client.Game,
  player_index: number
): PIXI.Container {
  const container = new PIXI.Container();
  container.x = width / 4;
  container.y = barBaseHeight;
  const infoTextRaw = `Current Turn: ${
    game.player_index !== player_index ? "Player " + game.player_index : "You"
  }\n${game.players[game.player_index].name} - ${
    game.players[game.player_index].role
  }`;
  const infoText = new PIXI.Text(infoTextRaw, { fontSize: 20 });
  container.addChild(infoText);

  const actionsLeftTextRaw = `Actions Left: ${game.turns_left}`;
  const actionsLeftText = new PIXI.Text(actionsLeftTextRaw, { fontSize: 20 });
  actionsLeftText.y = 50;
  container.addChild(actionsLeftText);
  return container;
}

function renderHandArea(game: Client.Game) {
  const container = new PIXI.Container();
  container.x = 0;
  container.y = (barBaseHeight * 2) / 3;
  const containerTop = barBaseHeight;

  const graphics = new PIXI.Graphics();
  graphics.beginFill(0x3e494b);
  graphics.lineStyle(4, 0x0, 0.3);
  graphics.drawRect(0, 0, width / 6, containerTop);
  graphics.endFill();

  const sizePerPlayer = (height - container.y) / game.players.length;
  game.players.forEach((player, index) => {
    const handContainer = generateHand(player, game, sizePerPlayer, width / 6);
    handContainer.y = sizePerPlayer * index;
    graphics.addChild(handContainer);
    graphics.lineStyle(4, 0x0, 0.3);
    graphics.moveTo(0, sizePerPlayer * index);
    graphics.lineTo(width / 6, sizePerPlayer * index);
  });

  container.addChild(graphics);
  return container;
}

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
    graphics.beginFill(hexColor);
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.drawRect(10, baseY + 2.5, 10, 10);
    graphics.endFill();
    const cityName = new PIXI.Text(card, { fontSize: 15 });
    cityName.x = index >= 4 ? widthAllowed / 2 + 25 : 25;
    cityName.y = baseY;
    container.addChild(cityName);
    container.addChild(graphics);
  });

  return container;
}

export function renderBottomBar(
  game: Client.Game,
  player_index: number,
  onMove: () => void
): PIXI.Graphics | undefined {
  if (hasStarted(game)) {
    const graphics = new PIXI.Graphics();
    graphics.addChild(renderTurnInfo(game, player_index));

    graphics.addChild(renderHandArea(game));

    const button1 = new Button({
      label: "Move",
      x: width * 0.4,
      y: barBaseHeight,
      width: 200,
      height: 75,
      onTap: () => {
        onMove();
      },
    });
    graphics.addChild(button1);
    return graphics;
  }
}
