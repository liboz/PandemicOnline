import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { destroyEvent, joinAs } from "../Subscriptions";
import { formatPlayer, hasStarted } from "../utils";

interface JoinComponentProps {
  game: Client.Game;
  socket: SocketIOClient.Socket;
  roles: Client.Roles[];
}

interface JoinComponentState {
  playerName: string;
  selectedRole: string;
}

export class JoinComponent extends React.Component<
  JoinComponentProps,
  JoinComponentState
> {
  constructor(props: JoinComponentProps) {
    super(props);
    this.state = { playerName: "", selectedRole: "" };
    this.joinGame = this.joinGame.bind(this);
  }

  notEnded() {
    const { game } = this.props;
    return (
      game.game_state !== Client.GameState.Lost &&
      game.game_state !== Client.GameState.Won
    );
  }

  joinGameInternal() {
    const { socket } = this.props;
    const { selectedRole, playerName } = this.state;

    destroyEvent();
    socket.emit(
      Client.EventName.Join,
      selectedRole,
      playerName,
      (player_index: number) => {
        console.log(`${playerName} joined as ${selectedRole} successfully`);
        joinAs(new PlayerInfo(playerName, player_index));
      }
    );
  }

  joinGame() {
    const { selectedRole, playerName } = this.state;
    console.log(selectedRole, playerName);
    if (playerName && selectedRole) {
      this.joinGameInternal();
    }
  }

  choosePlayer(player: Client.Player) {
    this.setState(
      {
        playerName: player.name,
        selectedRole: player.role,
      },
      () => this.joinGameInternal()
    );
  }

  render() {
    const { game, roles } = this.props;

    if (hasStarted(game) && this.notEnded()) {
      return (
        <>
          Join Game as:{" "}
          {game.players.map((player) => {
            return (
              <div key={player.id.toString() + player.name}>
                <button onClick={() => this.choosePlayer(player)}>
                  {formatPlayer(player)}
                </button>
              </div>
            );
          })}
        </>
      );
    } else if (!hasStarted(game)) {
      return (
        <>
          <div>
            <input
              onChange={(e) => this.setState({ playerName: e.target.value })}
            />
            <button onClick={this.joinGame}>JOIN</button>
          </div>
          {roles.map((role) => {
            return (
              <div key={role}>
                <input
                  name="role"
                  type="radio"
                  onChange={(e) => this.setState({ selectedRole: role })}
                />
                {role}
              </div>
            );
          })}
        </>
      );
    } else {
      return null;
    }
  }
}

export class PlayerInfo {
  player_name: string;
  player_index: number;
  constructor(player_name: string, player_index: number) {
    this.player_name = player_name;
    this.player_index = player_index;
  }
}
