import React from "react";
import io from "socket.io-client";
import { APPCONFIG } from "../config";
import { Client } from "pandemiccommon/dist/out-tsc/";
import {
  clearComponent,
  destroyEvent,
  join$,
  nextComponent,
} from "../modal/Modal";
import { JoinComponent } from "../join/Join";
import { Subscription } from "rxjs";
import { withRouter } from "react-router";
import { RouteComponentProps } from "react-router-dom";
import Game from "../game/Game";

interface GameSocketState {
  game?: Client.Game;
  socket?: SocketIOClient.Socket;
  player_name?: string;
  player_index?: number;
}

class GameSocketComponent extends React.Component<
  RouteComponentProps<{ match_name: string }>,
  GameSocketState
> {
  subscription?: Subscription;
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { match_name } = this.props.match.params;
    fetch(`${APPCONFIG.baseUrl}/${match_name}`)
      .then((response) => response.json())
      .then((game) => {
        this.setState({ game });
        const socket = io(`${APPCONFIG.baseUrl}/`, {
          query: `match_name=${match_name}`,
        });
        this.setState({ socket });

        socket.on(Client.EventName.Roles, (roles: Client.Roles[]) => {
          if (this.state.game) {
            if (
              this.state.game.game_state !== Client.GameState.Lost &&
              this.state.game.game_state !== Client.GameState.Won &&
              !this.state.player_name
            ) {
              /*
              let config = {
                game: this.state.game,
                socket: socket,
                roles: roles,
              };
              let currentComponent = this.modalService.currentComponent();
              if (!currentComponent || currentComponent !== "JoinComponent") {
                this.modalService.destroy();
                this.modalService.init(JoinComponent, config, {});
              } else {
                config["selected_role"] = null; // not actually an input. kinda hacky...
                this.modalService.updateConfig(config, {});
              }
              */
              clearComponent();
              nextComponent((destroy: () => void) => {
                const props = {
                  destroy,
                  game: this.state.game!,
                  socket,
                  roles,
                };
                return React.createElement(JoinComponent, props);
              });
            }
          }
        });

        socket.on(Client.EventName.MoveSuccessful, (data: Client.Game) => {
          this.setState({ game: data });
        });

        socket.on(Client.EventName.MoveChoiceSuccesful, (data: Client.Game) => {
          destroyEvent();
          this.setState({ game: data });
        });

        socket.on(
          Client.EventName.ResearchShareSuccesful,
          (data: Client.Game) => {
            this.setState({ game: data });
          }
        );

        socket.on(Client.EventName.BuildSuccesful, (data: Client.Game) => {
          this.setState({ game: data });
        });

        socket.on(Client.EventName.TreatSuccesful, (data: Client.Game) => {
          this.setState({ game: data });
        });

        socket.on(
          Client.EventName.DiscoverSuccesful,
          (data: Client.Game, color: string) => {
            //this.snackBarService.show(`Cure for ${color} was discovered`);
            this.setState({ game: data });
          }
        );

        socket.on(Client.EventName.Eradicated, (color: string) => {
          //this.snackBarService.show(`${color} was eradicated`);
        });

        socket.on(Client.EventName.UpdateGameState, (data: Client.Game) => {
          console.log("game state updated", data);
          this.setState({ game: data });
        });

        socket.on(Client.EventName.DiscardCards, (data: number) => {
          const { game } = this.state;
          if (game) {
            const newLog = [...game.log];
            newLog.push(`Player ${data} is discarding cards`);
            const updatedGame = {
              ...game,
              game_state: Client.GameState.DiscardingCard,
              must_discard_index: data,
              log: newLog,
            };
            this.setState({
              game: updatedGame,
            });
            if (updatedGame.must_discard_index === this.state.player_index) {
              /*
              this.snackBarService.show(
                `You need to discard some cards`,
                "danger"
              );*/
            } else {
              /*
              this.snackBarService.show(
                `Player ${this.state.game.must_discard_index} is discarding some cards`,
                "danger"
              );*/
            }
          }
        });

        socket.on(Client.EventName.Epidemic, (data: any) => {
          //this.snackBarService.show(`${data} infected by Epidemic`, "danger");
        });

        socket.on(Client.EventName.InvalidAction, (data: any) => {
          //this.snackBarService.show(data, "danger");
        });

        socket.on(Client.EventName.GameInitialized, (data: Client.Game) => {
          this.setState({ game: data });
        });
      });

    this.subscription = join$.subscribe((playerInfo) => {
      this.setState({
        player_name: playerInfo.player_name,
        player_index: playerInfo.player_index,
      });
    });
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  render() {
    const { game, socket, player_index, player_name } = this.state;
    return (
      <Game
        game={game}
        socket={socket}
        player_name={player_name}
        player_index={player_index}
      ></Game>
    );
  }
}

export default withRouter(GameSocketComponent);
