import React from "react";
import { destroyEvent } from "../modal/Modal";

interface WinLossComponentProps {
  lost: boolean;
}

export class WinLossComponent extends React.Component<WinLossComponentProps> {
  constructor(props: WinLossComponentProps) {
    super(props);
  }

  onClose() {
    destroyEvent();
  }

  render() {
    const { lost } = this.props;

    return (
      <>
        <div>{lost ? "You have lost" : "You have won"}</div>
        <div>
          <button onClick={this.onClose}>Close</button>
        </div>
      </>
    );
  }
}
