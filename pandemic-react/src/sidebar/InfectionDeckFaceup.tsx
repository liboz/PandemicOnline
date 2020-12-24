import { Client } from "pandemiccommon/dist/out-tsc";
import { FC } from "react";

import "./Sidebar.css";

interface InfectionDeckFaceupProps {
  game: Client.Game;
}

const InfectionDeckFaceup: FC<InfectionDeckFaceupProps> = (
  props: InfectionDeckFaceupProps
) => {
  const { game } = props;
  const cards = [...game.faceup_deck].reverse();
  return (
    <div>
      Most Recent
      <ol>
        {cards.map((card) => {
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
        })}
      </ol>
      Least Recent
    </div>
  );
};

export default InfectionDeckFaceup;
