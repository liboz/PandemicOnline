import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { FC } from "react";

import "./Sidebar.css";

export interface SidebarItemProps {
  game: Client.Game;
}

interface SidebarProps {
  game: Client.Game;
  showSidebar: boolean;
  hideSidebar: () => void;
  displayItem: React.FunctionComponent<SidebarItemProps> | null;
}

const Sidebar: FC<SidebarProps> = (props: SidebarProps) => {
  const { game, showSidebar, displayItem, hideSidebar } = props;
  const item = displayItem ? React.createElement(displayItem, { game }) : null;
  return (
    <>
      {showSidebar && (
        <div className="sidenav-overlay" onClick={hideSidebar}></div>
      )}
      <div className={`sidenav ${showSidebar ? "slide-in" : "slide-out"}`}>
        {item}
      </div>
    </>
  );
};

export default Sidebar;
