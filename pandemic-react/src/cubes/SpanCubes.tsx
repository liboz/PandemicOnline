import { Client } from "pandemiccommon/dist/out-tsc";
import { FC } from "react";

import "./SpanCubes.css";

interface SpanCubeProps {
  cardIndex: number;
  game: Client.Game;
}

const SpanCube: FC<SpanCubeProps> = (props: SpanCubeProps) => {
  const { cardIndex, game } = props;
  return (
    <span
      className={"box"}
      style={{
        backgroundColor: game.game_graph[cardIndex].color,
      }}
    ></span>
  );
};

export default SpanCube;
