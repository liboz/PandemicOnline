import React from "react";
import io from "socket.io-client";
import { APPCONFIG } from "../config";
import { Client } from "pandemiccommon/dist/out-tsc/";
import {
  clearComponent,
  clearMove,
  closeEventCard,
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
import { formatPlayer } from "../utils";

interface GameSocketState {
  game?: Client.Game;
  socket?: SocketIOClient.Socket;
  player_name?: string;
  player_index?: number;
}

type GameSocketComponentProps = RouteComponentProps<{ match_name: string }>;

class GameSocketComponent extends React.Component<
  GameSocketComponentProps,
  GameSocketState
> {
  joinGameSubscription?: Subscription;
  restartGameSubscription?: Subscription;
  constructor(props: GameSocketComponentProps) {
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

        socket.on(
          Client.EventName.MoveChoiceSuccessful,
          (data: Client.Game) => {
            clearMove();
            this.setState({ game: data });
          }
        );

        socket.on(
          Client.EventName.ResearchShareSuccessful,
          (data: Client.Game) => {
            this.setState({ game: data });
          }
        );

        socket.on(Client.EventName.BuildSuccessful, (data: Client.Game) => {
          this.setState({ game: data });
        });

        socket.on(Client.EventName.TreatSuccessful, (data: Client.Game) => {
          this.setState({ game: data });
        });

        socket.on(
          Client.EventName.DiscoverSuccessful,
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
          toast.success(`Game ${match_name} restarted`);
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

        socket.on(Client.EventName.Epidemic, (data: string) => {
          toast.warning(`${data} infected by Epidemic`);
        });

        socket.on(Client.EventName.InvalidAction, (data: any) => {
          toast.error(data);
        });

        socket.on(
          Client.EventName.EventCardSuccessful,
          (
            eventCard: string,
            card_owner_player_index: string,
            arg1: string | number,
            arg2: string | undefined,
            data: Client.Game
          ) => {
            switch (eventCard) {
              case Client.EventCard.Airlift:
                toast.success(
                  `Player ${card_owner_player_index} has played ${eventCard} to send ${
                    typeof arg1 === "number" && formatPlayer(data.players[arg1])
                  } to ${arg2}`
                );
                break;
              case Client.EventCard.Forecast:
                toast.success(
                  `Player ${card_owner_player_index} has played ${eventCard} to get a forecast of the infection deck`
                );
                break;
              case Client.EventCard.GovernmentGrant:
                toast.success(
                  `Player ${card_owner_player_index} has played ${eventCard} to build a research station on ${arg1}`
                );
                break;
              case Client.EventCard.OneQuietNight:
                toast.success(
                  `Player ${card_owner_player_index} has played ${eventCard}`
                );
                break;
              case Client.EventCard.ResilientPopulation:
                toast.success(
                  `Player ${card_owner_player_index} has played ${eventCard} to remove ${arg1} from the infection deck`
                );
                break;
            }
            closeEventCard();
            this.setState({ game: data });
          }
        );

        socket.on(Client.EventName.Forecasting, (data: Client.Game) => {
          if (data.forecasting_player_index !== this.state.player_index) {
            toast.info(
              `Player ${data.forecasting_player_index} is forecasting the infection deck`
            );
          }
          this.setState({ game: data });
        });

        socket.on(
          Client.EventName.ForecastingSuccessful,
          (
            data: Client.Game,
            player_index: number,
            oldOrder: string[],
            newOrder: string[]
          ) => {
            toast.success(
              `Player ${player_index} has changed the order of the infection deck from ${oldOrder} to ${newOrder}`
            );
            this.setState({ game: data });
          }
        );

        socket.on(Client.EventName.GameInitialized, (data: Client.Game) => {
          destroyEvent();
          toast.info(`Game started`);
          this.setState({ game: data });
        });
      });

    this.joinGameSubscription = join$.subscribe((playerInfo) => {
      this.setState({
        player_name: playerInfo.player_name,
        player_index: playerInfo.player_index,
      });
    });
  }

  componentWillUnmount() {
    this.joinGameSubscription?.unsubscribe();
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
