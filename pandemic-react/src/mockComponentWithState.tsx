import React from "react";
import { GameGraphicsProps } from "./game/Game";
import withGameState from "./game/withGameState";
import Sidebar from "./sidebar/Sidebar";

class mockComponent extends React.Component<GameGraphicsProps> {
  render() {
    const { game, hideSidebar } = this.props;
    const { showSidebar, sidebarDisplayItem } = this.props.state;

    return (
      <div>
        {game && (
          <Sidebar
            game={game}
            showSidebar={showSidebar}
            hideSidebar={hideSidebar}
            displayItem={sidebarDisplayItem}
          ></Sidebar>
        )}
      </div>
    );
  }
}

export const MockComponentWithState = withGameState(mockComponent);
