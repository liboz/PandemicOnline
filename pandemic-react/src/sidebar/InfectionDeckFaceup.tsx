import React, { FC } from "react";
import BaseSidebarList from "./BaseSidebarList";
import { SidebarItemProps } from "./Sidebar";

const InfectionDeckFaceup: FC<SidebarItemProps> = (props: SidebarItemProps) => {
  const { game } = props;
  const cards = game.infection_faceup_deck;
  if (cards) {
    return React.createElement(BaseSidebarList, {
      list: cards.map((card) => {
        const cardIndex = game.game_graph_index[card];
        return (
          <li key={`infection-deck-faceup-${card}`}>
            <span
              className={"box"}
              style={{
                backgroundColor: game.game_graph[cardIndex].color,
              }}
            ></span>
            {card}
          </li>
        );
      }),
    });
  } else {
    return null;
  }
};

export default InfectionDeckFaceup;
