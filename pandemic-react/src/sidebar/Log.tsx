import React, { FC } from "react";
import BaseSidebarList from "./BaseSidebarList";
import { SidebarItemProps } from "./Sidebar";

const Log: FC<SidebarItemProps> = (props: SidebarItemProps) => {
  const { game } = props;
  const { log } = game;
  return React.createElement(BaseSidebarList, {
    list: log.map((logItem, index) => {
      return <li key={`log-${index}`}>{logItem}</li>;
    }),
  });
};

export default Log;
