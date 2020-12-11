import { Client } from "pandemiccommon/dist/out-tsc";
import * as PIXI from "pixi.js";
import React, { FC } from "react";
import { Container, Text } from "react-pixi-fiber";
import Button from "../button/button";
import { barBaseHeight, GameComponentState, width } from "../game/Game";
import Hand from "./Hand";

function cannotDoPrimaryAction(state: GameComponentState, game: Client.Game) {
  return !!(
    state.isMoving ||
    state.treatColorChoices ||
    state.shareCardChoices ||
    state.cureColorCards ||
    state.dispatcherMoveOtherPlayer ||
    game.turns_left <= 0 ||
    game.game_state !== Client.GameState.Ready
  );
}

interface BottomBarProps {
  game: Client.Game;
  player_index?: number;
  state: GameComponentState;
  onMove: () => void;
  onBuild: () => void;
}

const BottomBar: FC<BottomBarProps> = (props) => {
  const { game, player_index, state, onMove, onBuild } = props;
  const { isMoving } = state;
  const moveButtonDisabled =
    game.player_index !== player_index ||
    (cannotDoPrimaryAction(state, game) && !isMoving);

  const buildButtonDisabled =
    !game.can_build_research_station || cannotDoPrimaryAction(state, game);

  const infoTextRaw =
    game.players &&
    `Current Turn: ${
      game.player_index !== player_index ? "Player " + game.player_index : "You"
    }\n${game.players[game.player_index].name} - ${
      game.players[game.player_index].role
    }`;

  const actionsLeftTextRaw = `Actions Left: ${game.turns_left}`;
  const handContainerY = (barBaseHeight * 2) / 3;
  const buttonWidth = 100;
  return (
    <Container>
      <Container x={0} y={handContainerY}>
        <Hand game={game} containerY={handContainerY}></Hand>
      </Container>
      <Container x={width / 4} y={barBaseHeight}>
        <Text text={infoTextRaw} style={{ fontSize: 20 }}></Text>
        <Text text={actionsLeftTextRaw} style={{ fontSize: 20 }} y={50}></Text>
      </Container>
      <Button
        label={isMoving ? "Cancel" : "Move"}
        x={width * 0.4}
        y={barBaseHeight}
        width={buttonWidth}
        height={75}
        disabled={moveButtonDisabled}
        onTap={() => {
          if (!moveButtonDisabled) {
            onMove();
          }
        }}
      ></Button>
      <Button
        label={"Build"}
        x={width * 0.4 + buttonWidth}
        y={barBaseHeight}
        width={buttonWidth}
        height={75}
        disabled={buildButtonDisabled}
        onTap={() => {
          if (!buildButtonDisabled) {
            onBuild();
          }
        }}
      ></Button>
    </Container>
  );
};

export default BottomBar;
