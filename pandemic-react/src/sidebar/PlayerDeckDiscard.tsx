import React, { FC } from "react";
import BaseSidebarList from "./BaseSidebarList";
import { SidebarItemProps } from "./Sidebar";

const PlayerDeckDiscard: FC<SidebarItemProps> = (props: SidebarItemProps) => {
  const { game } = props;
  const cards = game.player_deck_discard;
  if (cards.length === 0) {
    return <div>No Player Cards Discarded Yet</div>;
  } else {
    return React.createElement(BaseSidebarList, {
      list: cards.map((card, discardDeckIndex) => {
        const cardIndex = game.game_graph_index[card];
        return (
          <li key={`player-deck-discard-${card}-${discardDeckIndex}`}>
            {cardIndex !== undefined && (
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
