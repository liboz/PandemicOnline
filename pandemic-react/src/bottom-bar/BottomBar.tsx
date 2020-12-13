import { Client } from "pandemiccommon/dist/out-tsc";
import React, { FC } from "react";
import { Container, Text } from "react-pixi-fiber";
import Button, {
  baseButtonHeight,
  baseButtonWidth,
  ButtonProps,
} from "../button/button";
import { barBaseHeight, width } from "../game/Game";
import { GameComponentState } from "../game/withGameState";
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
  onTreat: () => void;
}

const BottomBar: FC<BottomBarProps> = (props) => {
  const { game, player_index, state, onMove, onBuild, onTreat } = props;
  const { isMoving, treatColorChoices } = state;

  const isCurrentPlayer = game.player_index === player_index;
  const moveButtonDisabled = cannotDoPrimaryAction(state, game) && !isMoving;

  const buildButtonDisabled =
    !game.can_build_research_station || cannotDoPrimaryAction(state, game);

  const treatButtonDisabled =
    !game.can_treat ||
    (cannotDoPrimaryAction(state, game) && !treatColorChoices);

  const infoTextRaw =
    game.players &&
    `Current Turn: ${
      game.player_index !== player_index ? "Player " + game.player_index : "You"
    }\n${game.players[game.player_index].name} - ${
      game.players[game.player_index].role
    }`;

  const actionsLeftTextRaw = `Actions Left: ${game.turns_left}`;
  const handContainerY = (barBaseHeight * 2) / 3;

  const buttonProps: Omit<ButtonProps, "x">[] = [
    {
      label: isMoving ? "Cancel" : "Move",
      y: barBaseHeight,
      width: baseButtonWidth,
      height: baseButtonHeight,
      disabled: !isCurrentPlayer || moveButtonDisabled,
      onTap: () => {
        if (!moveButtonDisabled) {
          onMove();
        }
      },
    },
    {
      label: "Build",
      y: barBaseHeight,
      width: baseButtonWidth,
      height: baseButtonHeight,
      disabled: !isCurrentPlayer || buildButtonDisabled,
      onTap: () => {
        if (!buildButtonDisabled) {
          onBuild();
        }
      },
    },
    {
      label: treatColorChoices ? "Cancel" : "Treat Disease",
      y: barBaseHeight,
      width: baseButtonWidth * 2,
      height: baseButtonHeight,
      disabled: !isCurrentPlayer || treatButtonDisabled,
      onTap: () => {
        if (!treatButtonDisabled) {
          onTreat();
        }
      },
    },
  ];

  const widthAdjusters = [0, 1, 2, 4]; // some elements are not same size so need to adjust
  const buttons = buttonProps.map((props, index) => (
    <Button
      key={props.label + index}
      x={width * 0.4 + baseButtonWidth * widthAdjusters[index]}
      {...props}
    ></Button>
  ));

  return (
    <Container>
      <Container x={0} y={handContainerY}>
        <Hand game={game} containerY={handContainerY}></Hand>
      </Container>
      <Container x={width / 4} y={barBaseHeight}>
        <Text text={infoTextRaw} style={{ fontSize: 20 }}></Text>
        <Text text={actionsLeftTextRaw} style={{ fontSize: 20 }} y={50}></Text>
      </Container>
      {buttons}
    </Container>
  );
};

export default BottomBar;
