import { Client } from "pandemiccommon/dist/out-tsc";
import React, { FC } from "react";
import BaseSidebarList from "./BaseSidebarList";

interface PlayerDeckDiscard {
  game: Client.Game;
}

const PlayerDeckDiscard: FC<PlayerDeckDiscard> = (props: PlayerDeckDiscard) => {
  const { game } = props;
  const cards = game.player_deck_discard;
  if (cards.length === 0) {
    return <div>No Player Cards Discarded Yet</div>;
  } else {
    return React.createElement(BaseSidebarList, {
      list: cards.map((card) => {
        const cardIndex = game.game_graph_index[card];
        console.log(card);
        return (
          <li key={`player-deck-discard-${card}`}>
            {cardIndex && (
              <span
                className={"box"}
                style={{
                  backgroundColor: game.game_graph[cardIndex].color,
                }}
              ></span>
            )}
            {card}
          </li>
        );
      }),
    });
  }
};

export default PlayerDeckDiscard;
