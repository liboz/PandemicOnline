import { Client } from "pandemiccommon/dist/out-tsc";
import * as PIXI from "pixi.js";
import React, { FC } from "react";
import { Container, Text } from "react-pixi-fiber";
import { barBaseHeight, width } from "../game/Game";
import Hand from "./Hand";

interface BottomBarProps {
  game: Client.Game;
  player_index?: number;
}

const BottomBar: FC<BottomBarProps> = (props) => {
  const { game, player_index } = props;
  const infoTextRaw = `Current Turn: ${
    game.player_index !== player_index ? "Player " + game.player_index : "You"
  }\n${game.players[game.player_index].name} - ${
    game.players[game.player_index].role
  }`;

  const actionsLeftTextRaw = `Actions Left: ${game.turns_left}`;
  const handContainerY = (barBaseHeight * 2) / 3;
  return (
    <Container>
      <Container x={0} y={handContainerY}>
        <Hand game={game} containerY={handContainerY}></Hand>
      </Container>
      <Container x={width / 4} y={barBaseHeight}>
        <Text text={infoTextRaw} style={{ fontSize: 20 }}></Text>
        <Text text={actionsLeftTextRaw} style={{ fontSize: 20 }} y={50}></Text>
      </Container>
    </Container>
  );
};

export default BottomBar;
