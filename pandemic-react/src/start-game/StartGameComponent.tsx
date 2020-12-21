import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { destroyEvent } from "../modal/Modal";

const difficulties = Object.entries(Client.GameDifficultyMap);

interface StartGameProps {
  socket: SocketIOClient.Socket;
  destroy: () => void;
}

interface StartGameState {
  selectedDifficulty: number;
}

export class StartGameComponent extends React.Component<
  StartGameProps,
  StartGameState
> {
  constructor(props: StartGameProps) {
    super(props);
    this.onStart = this.onStart.bind(this);
  }

  onStart() {
    const { selectedDifficulty } = this.state;
    const { socket } = this.props;
    if (selectedDifficulty) {
      destroyEvent();
      socket.emit(Client.EventName.StartGame, selectedDifficulty, () => {
        console.log(`started game on ${selectedDifficulty} succesfully`);
      });
    }
  }

  render() {
    return (
      <>
        <button onClick={this.onStart}>Start Game</button>
        {difficulties.map((difficulty) => {
          return (
            <div key={"difficulty" + difficulty} style={{ textAlign: "left" }}>
              <input
                type="radio"
                onChange={(e) =>
                  this.setState({ selectedDifficulty: Number(difficulty[0]) })
                }
              />
              {difficulty[1]}
            </div>
          );
        })}
      </>
    );
  }
}
