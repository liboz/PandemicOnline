import { Client } from "pandemiccommon/dist/out-tsc";
import React, { FC } from "react";
import BaseSidebarList from "./BaseSidebarList";

interface LogProps {
  game: Client.Game;
}

const Log: FC<LogProps> = (props: LogProps) => {
  const { game } = props;
  const { log } = game;
  return React.createElement(BaseSidebarList, {
    list: log.map((logItem, index) => {
      return <li key={`log-${index}`}>{logItem}</li>;
    }),
  });
};

export default Log;
