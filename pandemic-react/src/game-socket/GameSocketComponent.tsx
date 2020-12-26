import React from "react";
import io from "socket.io-client";
import { APPCONFIG } from "../config";
import { Client } from "pandemiccommon/dist/out-tsc/";
import {
  clearComponent,
  clearMove,
  closeSidebar,
  destroyEvent,
  join$,
  nextComponent,
} from "../Subscriptions";
import { JoinComponent } from "../join/Join";
import { Subscription } from "rxjs";
import { withRouter } from "react-router";
import { RouteComponentProps } from "react-router-dom";
import Game from "../game/Game";
import { toast } from "react-toastify";

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
          transports: ["websocket"],
          upgrade: false,
        });
        this.setState({ socket });

        socket.on(Client.EventName.Roles, (roles: Client.Roles[]) => {
          const { game, player_name } = this.state;
          if (game) {
            if (
              game.game_state !== Client.GameState.Lost &&
              game.game_state !== Client.GameState.Won &&
              !player_name
            ) {
              clearComponent();
              nextComponent(() => {
                const props = {
                  game: game,
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
          clearMove();
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
            toast.success(`Cure for ${color} was discovered`);
            this.setState({ game: data });
          }
        );

        socket.on(Client.EventName.Eradicated, (color: string) => {
          toast.success(`${color} was eradicated`);
        });

        socket.on(Client.EventName.UpdateGameState, (data: Client.Game) => {
          console.log("game state updated", data);
          this.setState({ game: data });
        });

        socket.on(Client.EventName.Restarted, (data: Client.Game) => {
          toast.success(`${match_name} restarted`);
          closeSidebar();
          this.setState({
            game: data,
            player_index: undefined,
            player_name: undefined,
          });
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
              toast.error("You need to discard some cards!");
            } else {
              toast.error(
                `Player ${updatedGame.must_discard_index} is discarding some cards`
              );
            }
          }
        });

        socket.on(Client.EventName.Epidemic, (data: any) => {
          toast.warning(`${data} infected by Epidemic`);
        });

        socket.on(Client.EventName.InvalidAction, (data: any) => {
          toast.error(data);
        });

        socket.on(Client.EventName.GameInitialized, (data: Client.Game) => {
          destroyEvent();
          toast.info(`Game started`);
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
