import { Client } from "pandemiccommon/dist/out-tsc";
import React, { FC } from "react";
import { Container, Text } from "react-pixi-fiber";
import { height, width } from "../game/Game";
import CubeCureStatus from "./CubeCureStatus";

interface TopBarProps {
  game: Client.Game;
}

const TopBar: FC<TopBarProps> = (props) => {
  const { game } = props;

  const containerY = height / 8;
  const textStyle = {
    fill: 0xffffff,
    stroke: "black",
    strokeThickness: 3,
    align: "center",
  };

  if (game.game_state !== Client.GameState.NotStarted) {
    return (
      <Container>
        <Container x={0} y={0}>
          <Text
            text={`Outbreak Counter: ${game.outbreak_counter}`}
            style={textStyle}
          ></Text>
          <Text
            text={`Infection Rate: ${
              game.infection_rate[game?.infection_rate_index]
            }`}
            y={containerY / 3}
            style={textStyle}
          ></Text>
          <Text
            text={`Player Deck Cards Remaining: ${game.player_deck_cards_remaining}`}
            y={(containerY / 3) * 2}
            style={textStyle}
          ></Text>
        </Container>
        <Container x={width / 2}>
          <CubeCureStatus game={game} containerY={containerY}></CubeCureStatus>
        </Container>
      </Container>
    );
  } else {
    return null;
  }
};

export default TopBar;
