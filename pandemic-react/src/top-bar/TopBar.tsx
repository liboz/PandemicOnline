import { Client } from "pandemiccommon/dist/out-tsc";
import React, { FC, useRef } from "react";
import { Container, Text } from "react-pixi-fiber";
import Button, { baseButtonHeight } from "../button/button";
import { height, width } from "../game/Game";
import InfectionDeckFaceup from "../sidebar/InfectionDeckFaceup";
import Log from "../sidebar/Log";
import PlayerDeckDiscard from "../sidebar/PlayerDeckDiscard";
import { SidebarItemProps } from "../sidebar/Sidebar";
import CubeCureStatus from "./CubeCureStatus";
import * as PIXI from "pixi.js";
import { ScalingGraphics } from "../utils";

interface TopBarProps extends ScalingGraphics {
  game: Client.Game;
  showSidebar: boolean;
  setSidebarChildren: (
    items: React.FunctionComponent<SidebarItemProps>
  ) => void;
  hideSidebar: () => void;
}

const TopBar: FC<TopBarProps> = (props) => {
  const {
    game,
    showSidebar,
    setSidebarChildren,
    hideSidebar,
    heightRatio,
    widthRatio,
  } = props;
  const buttonsContainerRef = useRef<any>();

  const containerY = (height / 8) * heightRatio;
  const textStyle = {
    fontSize: Math.max(24 * widthRatio, 12),
    fill: 0xffffff,
    stroke: "black",
    strokeThickness: 3,
    align: "center",
  };

  const topButtonWidthOffset = (width / 4) * widthRatio;
  const topButtonHeightOffset = 20 * heightRatio;

  const mouseover = (messageText: string) => {
    return (event: PIXI.InteractionEvent) => {
      const message = new PIXI.Text(messageText, textStyle);
      message.x = event.data.global.x - topButtonWidthOffset;
      message.y = event.data.global.y + topButtonHeightOffset;

      if (buttonsContainerRef.current) {
        buttonsContainerRef.current.message = message;
        buttonsContainerRef.current.addChild(message);
      }
    };
  };
  const mousemove = (event: PIXI.InteractionEvent) => {
    if (!buttonsContainerRef.current.message) {
      return;
    }

    buttonsContainerRef.current.message.x =
      event.data.global.x - topButtonWidthOffset;
    buttonsContainerRef.current.message.y =
      event.data.global.y + topButtonHeightOffset;
  };
  const mouseout = () => {
    buttonsContainerRef.current.removeChild(
      buttonsContainerRef.current.message
    );
    delete buttonsContainerRef.current.message;
  };

  const buttonProps = [
    {
      label: "I",
      hoverText: "Show faceup infection deck cards",
      type: InfectionDeckFaceup,
    },
    {
      label: "L",
      hoverText: "Show log",
      type: Log,
    },
    {
      label: "P",
      hoverText: "Show discarded player deck",
      type: PlayerDeckDiscard,
    },
  ];

  const buttons = buttonProps.map((props, index) => (
    <Button
      key={props.label + index}
      x={50 * index}
      y={0}
      width={50}
      height={baseButtonHeight}
      label={props.label}
      disabled={false}
      onTap={() =>
        showSidebar ? hideSidebar() : setSidebarChildren(props.type)
      }
      mouseover={mouseover(props.hoverText)}
      mousemove={mousemove}
      mouseout={mouseout}
      heightRatio={heightRatio}
      widthRatio={widthRatio}
    ></Button>
  ));
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
        <Container x={width * 0.65 * widthRatio}>
          <CubeCureStatus
            game={game}
            containerY={Math.max(containerY, 50)}
            widthRatio={widthRatio}
            heightRatio={heightRatio}
          ></CubeCureStatus>
        </Container>
        <Container x={(width / 4) * widthRatio} ref={buttonsContainerRef}>
          {buttons}
        </Container>
      </Container>
    );
  } else {
    return null;
  }
};

export default TopBar;
