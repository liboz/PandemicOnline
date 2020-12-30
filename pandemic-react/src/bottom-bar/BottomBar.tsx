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
import BotHand from "../hand/BotHand";
import { ScalingGraphics } from "../utils";

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

interface BottomBarProps extends ScalingGraphics {
  game: Client.Game;
  player_index?: number;
  state: GameComponentState;
  onMove: () => void;
  onDispatcherMove: () => void;
  onBuild: () => void;
  onTreat: () => void;
  onShare: () => void;
  onDiscover: () => void;
  onPass: () => void;
}

const BottomBar: FC<BottomBarProps> = (props) => {
  const {
    game,
    player_index,
    state,
    onMove,
    onDispatcherMove,
    onBuild,
    onTreat,
    onShare,
    onDiscover,
    onPass,
    heightRatio,
    widthRatio,
  } = props;
  const {
    isMoving,
    treatColorChoices,
    shareCardChoices,
    cureColorCards,
  } = state;

  const isCurrentPlayer = game.player_index === player_index;
  const moveButtonDisabled =
    !isCurrentPlayer || (cannotDoPrimaryAction(state, game) && !isMoving);

  const buildButtonDisabled =
    !isCurrentPlayer ||
    !game.can_build_research_station ||
    cannotDoPrimaryAction(state, game);

  const treatButtonDisabled =
    !isCurrentPlayer ||
    !game.can_treat ||
    (cannotDoPrimaryAction(state, game) && !treatColorChoices);

  const shareButtonDisabled =
    !isCurrentPlayer ||
    (!game.can_give && !game.can_take) ||
    (cannotDoPrimaryAction(state, game) && !shareCardChoices);

  const discoverButtonDisabled =
    !isCurrentPlayer ||
    !game.can_cure ||
    (cannotDoPrimaryAction(state, game) && !cureColorCards);

  // if there are players with special role and that is the current player
  const showSpecialActionsButton = game.players
    ?.filter((player) => player.role === Client.Roles.Dispatcher)
    ?.some((player) => player.id === player_index);

  const infoTextRaw =
    game.players &&
    `Current Turn: ${
      game.player_index !== player_index ? "Player " + game.player_index : "You"
    }\n${game.players[game.player_index].name} - ${
      game.players[game.player_index].role
    }`;

  const actionsLeftTextRaw =
    game.turns_left !== undefined ? `Actions Left: ${game.turns_left}` : "";
  const handContainerY = (barBaseHeight * 2) / 3;

  const buttonProps: Omit<
    ButtonProps,
    "x" | "y" | "height" | "heightRatio" | "widthRatio"
  >[] = [
    {
      label: isMoving ? "Cancel" : "Move",
      width: baseButtonWidth,
      disabled: moveButtonDisabled,
      onTap: () => {
        if (!moveButtonDisabled) {
          onMove();
        }
      },
    },
    {
      label: "Build",
      width: baseButtonWidth,
      disabled: buildButtonDisabled,
      onTap: () => {
        if (!buildButtonDisabled) {
          onBuild();
        }
      },
    },
    {
      label: treatColorChoices ? "Cancel" : "Treat Disease",
      width: baseButtonWidth * 2,
      disabled: treatButtonDisabled,
      onTap: () => {
        if (!treatButtonDisabled) {
          onTreat();
        }
      },
    },
    {
      label: shareCardChoices ? "Cancel" : "Share Knowledge",
      width: baseButtonWidth * 2.5,
      disabled: shareButtonDisabled,
      onTap: () => {
        if (!shareButtonDisabled) {
          onShare();
        }
      },
    },
    {
      label: cureColorCards ? "Cancel" : "Discover",
      width: baseButtonWidth * 1.5,
      disabled: discoverButtonDisabled,
      onTap: () => {
        if (!discoverButtonDisabled) {
          onDiscover();
        }
      },
    },
    {
      label: "Pass",
      width: baseButtonWidth,
      disabled: !isCurrentPlayer || cannotDoPrimaryAction(state, game),
      onTap: () => {
        if (!isCurrentPlayer || !cannotDoPrimaryAction(state, game)) {
          onPass();
        }
      },
    },
  ];

  const widthAdjusters = [0, 1, 2, 4, 6.5, 8, 9]; // some elements are not same size so need to adjust
  const buttons = buttonProps.map((props, index) => (
    <Button
      key={props.label + index}
      x={width * 0.4 + baseButtonWidth * widthAdjusters[index]}
      y={barBaseHeight}
      height={baseButtonHeight}
      widthRatio={widthRatio}
      heightRatio={heightRatio}
      {...props}
    ></Button>
  ));

  const specialActionButton = (
    <Button
      x={
        width * 0.4 +
        baseButtonWidth * widthAdjusters[widthAdjusters.length - 1]
      }
      y={barBaseHeight}
      height={baseButtonHeight}
      label={"Special Action"}
      width={baseButtonWidth * 2}
      disabled={moveButtonDisabled}
      onTap={() => {
        if (!moveButtonDisabled) {
          onDispatcherMove();
        }
      }}
      widthRatio={widthRatio}
      heightRatio={heightRatio}
    ></Button>
  );

  const actionsContainerY =
    heightRatio < 0.4
      ? barBaseHeight * heightRatio - 10
      : barBaseHeight * heightRatio;

  const actionsLeftTextY =
    heightRatio < 0.4 ? 50 * heightRatio + 10 : 50 * heightRatio;

  return (
    <Container>
      <Container x={0} y={handContainerY * heightRatio}>
        <BotHand
          game={game}
          containerY={handContainerY}
          heightRatio={heightRatio}
          widthRatio={widthRatio}
        ></BotHand>
      </Container>
      <Container x={(width / 4) * widthRatio} y={actionsContainerY}>
        <Text
          text={infoTextRaw}
          style={{
            fontSize: Math.max(20 * widthRatio, 10),
            fill: 0xffffff,
            stroke: "black",
            strokeThickness: 3,
          }}
        ></Text>
        <Text
          text={actionsLeftTextRaw}
          style={{
            fontSize: Math.max(20 * widthRatio, 10),
            fill: 0xffffff,
            stroke: "black",
            strokeThickness: 3,
          }}
          y={actionsLeftTextY}
        ></Text>
      </Container>
      {buttons}
      {showSpecialActionsButton && specialActionButton}
    </Container>
  );
};

export default BottomBar;
