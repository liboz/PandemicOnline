import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { clearMove, dispatcherMoveTarget } from "../Subscriptions";
import { formatPlayer } from "../utils";

interface DispatcherMoveComponentProps {
  other_players: Client.Player[];
}

export class DispatcherMoveComponent extends React.Component<DispatcherMoveComponentProps> {
  constructor(props: DispatcherMoveComponentProps) {
    super(props);
  }

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
