import { Client } from "pandemiccommon/dist/out-tsc";
import { FC, useEffect, useState } from "react";

import "./DivHand.css";

interface DivHandInterface {
  hand: string[];
  game: Client.Game;
  cardLimit?: number;
  onClick: (index: number) => void;
}

interface Result {
  card: string;
  selected: boolean;
}

function result(hand: string[], selected: boolean[]): Result[] {
  return hand.map((c, index) => {
    return { card: c, selected: selected[index] };
  });
}

function itemClassName(item: Result) {
  return "card-wrapper " + (item.selected ? "selected" : "unselected");
}

function handleClick(
  i: number,
  cardLimit: number,
  hand: string[],
  selected: boolean[],
  onClick: (index: number) => void
) {
  let count = 0;
  selected.forEach((i) => {
    if (i) {
      count += 1;
    }
  });
  if (hand.length - count > cardLimit || selected[i]) {
    selected[i] = !selected[i];
    onClick(i);
  }
}

const DivHandComponent: FC<DivHandInterface> = (props: DivHandInterface) => {
  const combinedProps = { cardLimit: 7, ...props };
  const { hand, game, cardLimit, onClick } = combinedProps;

  const [selected, setSelected] = useState<boolean[]>(hand.map(() => false));

  useEffect(() => {
    setSelected(hand.map(() => false));
  }, [hand]);

  const items = result(hand, selected);

  return (
    <div id="hand">
      {items.map((item, index) => {
        return (
          <div
            key={"wapper" + item.card + index}
            className={itemClassName(item)}
            onClick={() =>
              handleClick(index, cardLimit, hand, selected, onClick)
            }
          >
            <div
              className="card"
              style={{
                backgroundColor:
                  game.game_graph_index[item.card] !== undefined
                    ? game.game_graph[game.game_graph_index[item.card]].color
                    : "white",
              }}
            >
              <div className="card-text">{item.card}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DivHandComponent;
