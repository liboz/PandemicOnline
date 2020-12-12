import React from "react";
import withGameState from "./game/withGameState";

class mockComponent extends React.Component {
  render() {
    return <div></div>;
  }
}

export const MockComponentWithState = withGameState(mockComponent);
