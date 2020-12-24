import { Client } from "pandemiccommon/dist/out-tsc";
import React, { FC, ReactNode } from "react";
import { Container, Text } from "react-pixi-fiber";
import Button, { baseButtonHeight } from "../button/button";
import { height, width } from "../game/Game";
import InfectionDeckFaceup from "../sidebar/InfectionDeckFaceup";
import Log from "../sidebar/Log";
import PlayerDeckDiscard from "../sidebar/PlayerDeckDiscard";
import { SidebarItemProps } from "../sidebar/Sidebar";
import CubeCureStatus from "./CubeCureStatus";

interface TopBarProps {
  game: Client.Game;
  showSideBar: boolean;
  setSidebarChildren: (
    items: React.FunctionComponent<SidebarItemProps>
  ) => void;
  hideSidebar: () => void;
}

const TopBar: FC<TopBarProps> = (props) => {
  const { game, showSideBar, setSidebarChildren, hideSidebar } = props;

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
        <Container x={width / 4}>
          <Button
            x={0}
            y={0}
            width={50}
            height={baseButtonHeight}
            label={"I"}
            disabled={false}
            onTap={() =>
              showSideBar
                ? hideSidebar()
                : setSidebarChildren(InfectionDeckFaceup)
            }
          ></Button>
          <Button
            x={50}
            y={0}
            width={50}
            height={baseButtonHeight}
            label={"L"}
            disabled={false}
            onTap={() =>
              showSideBar ? hideSidebar() : setSidebarChildren(Log)
            }
          ></Button>
          <Button
            x={100}
            y={0}
            width={50}
            height={baseButtonHeight}
            label={"P"}
            disabled={false}
            onTap={() =>
              showSideBar
                ? hideSidebar()
                : setSidebarChildren(PlayerDeckDiscard)
            }
          ></Button>
        </Container>
      </Container>
    );
  } else {
    return null;
  }
};

export default TopBar;
