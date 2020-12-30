import { Client } from "pandemiccommon/dist/out-tsc";
import React, { ReactNode } from "react";
import { destroyEvent, joinAs } from "../Subscriptions";
import { formatPlayer, hasStarted } from "../utils";
import { FaQuestionCircle } from "react-icons/fa";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // optional

interface JoinComponentProps {
  game: Client.Game;
  socket: SocketIOClient.Socket;
  roles: Client.Roles[];
}

interface JoinComponentState {
  playerName: string;
  selectedRole: string;
}

const infoMap: Record<Client.Roles, ReactNode> = {
  [Client.Roles.ContingencyPlanner]: (
    <>
      <div>
        The Contingency Planner may, as an action, take an Event card from
        anywhere in the Player Discard Pile and place it on his Role card. Only
        1 Event card can be on his role card at a time. It does not count
        against his hand limit.
      </div>
      <div>
        When the Contingency Planner plays the Event card on his role card,
        remove this Event card from the game (instead of discarding it).
      </div>
    </>
  ),
  [Client.Roles.Dispatcher]: (
    <>
      The Dispatcher may, as an action, either:
      <ul>
        <li>move any pawn to any city containing another pawn</li>
        <li>move another player’s pawn as if it were his own</li>
      </ul>
    </>
  ),
  [Client.Roles.Medic]: (
    <>
      <div>
        The Medic removes{" "}
        <b>
          <i>all</i>
        </b>{" "}
        cubes, not 1, of the same color when doing the Treat Disease action.
      </div>
      <div>
        If a disease has been{" "}
        <b>
          <i>cured</i>
        </b>
        , he automatically removes all cubes of that color from a city, simply
        by entering it or being there. This does not take an action
      </div>
      <div>
        The Medic also prevents placing disease cubes (and outbreaks) of{" "}
        <b>
          <i>cured</i>
        </b>{" "}
        diseases in his location
      </div>
    </>
  ),
  [Client.Roles.OperationsExpert]: (
    <>
      The Operations Expert may, as an action, either:
      <ul>
        <li>
          build a research station in his current city without discarding (or
          using) a City card
        </li>
        <li>
          once per turn, move from a research station to any city by discarding
          any City card.
        </li>
      </ul>
    </>
  ),
  [Client.Roles.QuarantineSpecialist]: (
    <>
      The Quarantine Specialist prevents both outbreaks and the placement of
      disease cubes in the city she is in{" "}
      <b>
        <i>and</i>
      </b>{" "}
      all cities connected to that city. She does not affect cubes placed during
      setup
    </>
  ),
  [Client.Roles.Researcher]: (
    <>
      When doing the Share Knowledge action, the Researcher may give any City
      card from her hand to another player in the same city as her,{" "}
      <b>
        <i>without</i>
      </b>{" "}
      this card having to match her city. The transfer must be{" "}
      <b>
        <i>from</i>
      </b>{" "}
      her hand to the other player’s hand, but it can occur on either player’s
      turn.
    </>
  ),
  [Client.Roles.Scientist]:
    "The Scientist needs only 4 (not 5) City cards of the same disease color to Discover a Cure for that disease.",
};

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
                <Tippy
                  placement="right"
                  content={infoMap[role]}
                  touch={"hold"}
                  popperOptions={{
                    strategy: "fixed",
                    modifiers: [
                      {
                        name: "flip",
                        options: {
                          fallbackPlacements: ["bottom", "left"],
                        },
                      },
                      {
                        name: "preventOverflow",
                        options: {
                          altAxis: true,
                          tether: false,
                        },
                      },
                    ],
                  }}
                >
                  <button
                    style={{
                      textDecoration: "none",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "inline",
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    {role} <FaQuestionCircle />
                  </button>
                </Tippy>
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
