import { Client } from "pandemiccommon/dist/out-tsc";
import React, { FC } from "react";
import BaseSidebarList from "./BaseSidebarList";

interface InfectionDeckFaceupProps {
  game: Client.Game;
}

const InfectionDeckFaceup: FC<InfectionDeckFaceupProps> = (
  props: InfectionDeckFaceupProps
) => {
  const { game } = props;
  const cards = game.infection_faceup_deck;
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
};

export default InfectionDeckFaceup;
