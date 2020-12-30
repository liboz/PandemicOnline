import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { dispatcherMoveTarget } from "../Subscriptions";
import { formatPlayer } from "../utils";

interface DispatcherMoveComponentProps {
  other_players: Client.Player[];
}

export class DispatcherMoveComponent extends React.Component<DispatcherMoveComponentProps> {
  dispatcherMoveTargetSelect(target_player_id: number) {
    dispatcherMoveTarget(target_player_id);
  }

  onCancel() {
    dispatcherMoveTarget();
  }

  render() {
    const { other_players } = this.props;

    return (
      <div>
        <div style={{ marginBottom: "20px" }}>
          {other_players.map((player) => {
            return (
              <button
                key={`dispatcher-choice-${player.id}`}
                onClick={() => this.dispatcherMoveTargetSelect(player.id)}
              >
                Move {formatPlayer(player)}
              </button>
            );
          })}
        </div>
        <div>
          <button onClick={this.onCancel}>Cancel</button>
        </div>
      </div>
    );
  }
}
