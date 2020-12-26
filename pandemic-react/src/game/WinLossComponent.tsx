import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { destroyEvent } from "../Subscriptions";

interface WinLossComponentProps {
  socket?: SocketIOClient.Socket;
  lost: boolean;
}

export class WinLossComponent extends React.Component<WinLossComponentProps> {
  constructor(props: WinLossComponentProps) {
    super(props);
    this.playAgain = this.playAgain.bind(this);
  }

  playAgain() {
    const { socket } = this.props;
    if (socket) {
      socket.emit(Client.EventName.Restart);
    }
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
          <button onClick={this.playAgain}>Play again?</button>
          <button onClick={this.onClose}>Close</button>
        </div>
      </>
    );
  }
}
