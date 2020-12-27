import { ClientWebSocket } from "./client_websocket";
import { Cities } from "./data/cities";
import { EventName, Game } from "./game";
import { Client } from "pandemiccommon/dist/out-tsc";
import seedrandom from "seedrandom";
import { GameMap } from "./game";

export const dummy_game = new GameMap(Cities);

export const generateDefault: () => GameObject = () => {
  return {
    players: [],
    available_roles: new Set([
      Client.Roles.Dispatcher,
      Client.Roles.Medic,
      Client.Roles.QuarantineSpecialist,
      Client.Roles.Researcher,
      Client.Roles.Scientist,
      Client.Roles.OperationsExpert,
    ]),
    player_roles: [],
  };
};

export class ServerGame {
  game: GameObject;
  constructor(private match_name: string, private seeded: seedrandom.prng) {
    this.game = generateDefault();
  }

  get players() {
    return this.game.players;
  }

  get curr_game() {
    // can this happen if no players have joined?
    return this.game.game;
  }

  get player_roles() {
    // can this happen if no players have joined?
    return this.game.player_roles;
  }

  get isReady() {
    return (
      this.curr_game?.game_state === Client.GameState.Ready &&
      this.curr_game?.turns_left !== 0
    );
  }

  emitRoles(clientWebSocket: ClientWebSocket, send_to_all_but_client = false) {
    if (send_to_all_but_client) {
      clientWebSocket.sendMessageToAllButClient(EventName.Roles, [
        ...this.game.available_roles,
      ]);
    } else {
      clientWebSocket.sendMessageToClient(EventName.Roles, [
        ...this.game.available_roles,
      ]);
    }
  }

  joinInvalid(
    clientWebSocket: ClientWebSocket,
    player_name: string,
    role: Client.Roles
  ) {
    clientWebSocket.sendMessageToClient(
      EventName.InvalidAction,
      `Joining ${this.match_name} as Player name ${player_name} in role ${role} is an invalid action`
    );
  }

  onJoin(clientWebSocket: ClientWebSocket) {
    return (
      role: Client.Roles,
      player_name: string,
      callback: (player_index: Number) => void
    ) => {
      // add logic for role is invalid
      const gameState = this.curr_game?.game_state;
      if (
        gameState === undefined ||
        gameState === Client.GameState.NotStarted
      ) {
        // initial join game
        if (!this.game.available_roles.has(role)) {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Someone has already joined ${this.match_name} as role ${role}. Please try again`
          );
          this.emitRoles(clientWebSocket); // send to client too!
          return;
        }

        let player_index = this.players.findIndex((i) => i === player_name);
        if (player_index !== -1) {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Someone has already joined ${this.match_name} as Player name ${player_name}. Please pick another name`
          );
          this.emitRoles(clientWebSocket); // send to client too!
          return;
        }

        player_index = this.players.length;
        this.players.push(player_name);
        this.player_roles.push(role);
        this.game.available_roles.delete(role);
        this.emitRoles(clientWebSocket, true);
        callback(player_index);
        console.log(
          `${player_name} joined ${this.match_name} as Player ${player_index} in role ${role}`
        );
      } else if (
        gameState !== undefined &&
        !this.game.available_roles.has(role)
      ) {
        // rejoin game (cannot join as a new role or player_name)
        let player_index = this.players.findIndex((i) => i === player_name);
        if (player_index === -1) {
          this.joinInvalid(clientWebSocket, player_name, role);
          return;
        } else if (this.player_roles[player_index] !== role) {
          this.joinInvalid(clientWebSocket, player_name, role);
          return;
        }
        callback(player_index);
        console.log(
          `${player_name} joined ${this.match_name} as Player ${player_index} in role ${role}`
        );
      } else {
        this.joinInvalid(clientWebSocket, player_name, role);
      }
    };
  }

  onStart(clientWebSocket: ClientWebSocket) {
    return (difficulty: number, callback: () => void) => {
      if (
        !this.curr_game ||
        this.curr_game.game_state === Client.GameState.NotStarted
      ) {
        let num_players = this.players.length;
        if (num_players > 5) {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Cannot start game with over 5 players`
          );
        } else if (num_players < 2) {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Cannot start game with fewer than 2 players`
          );
        } else {
          callback();
          let filtered_players = this.players.slice(0, num_players);
          let filtered_roles = this.player_roles.slice(0, num_players);
          console.log(
            `start game with ${filtered_players} in room ${this.match_name}`
          );
          this.game.game = new Game(
            Cities,
            num_players,
            filtered_players,
            filtered_roles,
            difficulty,
            this.seeded
          );
          this.curr_game.initialize_board();
          this.curr_game.log.push(
            `game initialized at ${Client.GameDifficultyMap[difficulty]} difficulty`
          );
          clientWebSocket.sendMessageToAllInRoom(
            EventName.GameInitialized,
            this.curr_game.toJSON()
          );
        }
      } else {
        console.log(
          `Game ${this.match_name} has already started and has current game state: ${this.curr_game.game_state}`
        );
      }
    };
  }

  onMove(clientWebSocket: ClientWebSocket) {
    return (data: string, callback: () => void) => {
      if (this.isReady) {
        let log_string = `Player ${this.curr_game.player_index}: move to ${data}`;
        console.log(`${this.match_name}: ${log_string}`);
        let curr_player = this.curr_game.players[this.curr_game.player_index];
        if (
          curr_player.move(
            this.curr_game,
            data,
            curr_player.hand,
            clientWebSocket
          )
        ) {
          callback();
          this.curr_game.log.push(log_string);
          clientWebSocket.sendMessageToClient(
            EventName.MoveSuccessful,
            this.curr_game.toJSON()
          );
          this.curr_game.use_turn(clientWebSocket, this.match_name);
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `${data} is an invalid location to move to`
          );
        }
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Move to ${data} is an invalid action`
        );
      }
    };
  }

  onDirectFlight(clientWebSocket: ClientWebSocket) {
    return (data: string) => {
      if (this.isReady) {
        let log_string = `Player ${this.curr_game.player_index}: Direct Flight to ${data}`;
        console.log(`${this.match_name}: ${log_string}`);
        let curr_player = this.curr_game.players[this.curr_game.player_index];
        if (curr_player.canDirectFlight(data)) {
          curr_player.directFlight(
            this.curr_game,
            data,
            curr_player.hand,
            clientWebSocket
          );
          this.curr_game.log.push(log_string);
          clientWebSocket.sendMessageToClient(
            EventName.MoveChoiceSuccesful,
            this.curr_game.toJSON()
          );
          this.curr_game.use_turn(clientWebSocket, this.match_name);
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `${data} is an invalid location to direct flight to`
          );
        }
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Move to ${data} is an invalid action`
        );
      }
    };
  }

  onCharterFlight(clientWebSocket: ClientWebSocket) {
    return (data: string) => {
      if (this.isReady) {
        let log_string = `Player ${this.curr_game.player_index}: Charter Flight to ${data}`;
        console.log(`${this.match_name}: ${log_string}`);
        let curr_player = this.curr_game.players[this.curr_game.player_index];
        if (curr_player.canCharterFlight()) {
          curr_player.charterFlight(
            this.curr_game,
            data,
            curr_player.hand,
            clientWebSocket
          );
          this.curr_game.log.push(log_string);
          clientWebSocket.sendMessageToClient(
            EventName.MoveChoiceSuccesful,
            this.curr_game.toJSON()
          );
          this.curr_game.use_turn(clientWebSocket, this.match_name);
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `${data} is an invalid location to charter flight to`
          );
        }
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Move to ${data} is an invalid action`
        );
      }
    };
  }

  onOperationsExpertMove(clientWebSocket: ClientWebSocket) {
    return (final_destination: string, card: string) => {
      if (this.isReady) {
        let log_string = `Player ${this.curr_game.player_index}: Operations Expert Move to ${final_destination} by discarding ${card}`;
        console.log(`${this.match_name}: ${log_string}`);
        if (
          this.curr_game.players[
            this.curr_game.player_index
          ].canOperationsExpertMoveWithCard(this.curr_game, card)
        ) {
          this.curr_game.players[
            this.curr_game.player_index
          ].operationsExpertMove(
            this.curr_game,
            final_destination,
            card,
            clientWebSocket
          );
          this.curr_game.log.push(log_string);
          clientWebSocket.sendMessageToClient(
            EventName.MoveChoiceSuccesful,
            this.curr_game.toJSON()
          );
          this.curr_game.use_turn(clientWebSocket, this.match_name);
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Discarding ${card} to move to ${final_destination} is an invalid Operations Expert Move`
          );
        }
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Discarding ${card} to move to ${final_destination} is an invalid Operations Expert Move`
        );
      }
    };
  }

  onDispatcherMove(clientWebSocket: ClientWebSocket) {
    return (other_player_index: number, final_destination: string) => {
      let log_string = `Player ${this.curr_game.player_index}: Dispatcher Move ${other_player_index} to ${final_destination}`;
      console.log(`${this.match_name}: ${log_string}`);
      if (this.isReady) {
        let curr_player = this.curr_game.players[this.curr_game.player_index];
        let valid_dispatcher_final_destinations = new Set(
          curr_player.get_valid_dispatcher_final_destinations(this.curr_game)[
            other_player_index
          ]
        );
        // TODO dispatcher
        /*
      if (valid_dispatcher_final_destinations.has(final_destination)) {
        curr_player.dispatcher_move(
          this.curr_game,
          this.curr_game.players[other_player_index],
          final_destination,
          clientWebSocket
        );
        this.curr_game.log.push(log_string);
        clientWebSocket.sendMessageToClient(
          EventName.MoveChoiceSuccesful,
          this.curr_game.toJSON()
        );
        this.curr_game.use_turn(clientWebSocket, this.match_name);
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Moving ${other_player_index} to ${final_destination} is an invalid Dispatcher Move`
        );
      }
      */
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Moving ${other_player_index} to ${final_destination} is an invalid Dispatcher Move`
        );
      }
    };
  }

  onBuild(clientWebSocket: ClientWebSocket) {
    return () => {
      if (this.isReady) {
        let log_string = `Player ${this.curr_game.player_index}: build on ${
          this.curr_game.players[this.curr_game.player_index].location
        }`;
        console.log(`${this.match_name}: ${log_string}`);
        if (
          this.curr_game.players[
            this.curr_game.player_index
          ].can_build_research_station(this.curr_game)
        ) {
          this.curr_game.players[
            this.curr_game.player_index
          ].build_research_station(this.curr_game);
          this.curr_game.log.push(log_string);
          clientWebSocket.sendMessageToClient(
            EventName.BuildSuccesful,
            this.curr_game.toJSON()
          );
          this.curr_game.use_turn(clientWebSocket, this.match_name);
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Player ${this.curr_game.player_index} cannot build on ${
              this.curr_game.players[this.curr_game.player_index].location
            } right now`
          );
        }
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Build is an invalid action right now`
        );
      }
    };
  }

  onTreat(clientWebSocket: ClientWebSocket) {
    return (color: Client.Color, callback: () => void) => {
      if (this.isReady) {
        let log_string = `Player ${
          this.curr_game.player_index
        }: treat ${color} at ${
          this.curr_game.players[this.curr_game.player_index].location
        }`;
        console.log(`${this.match_name}: ${log_string}`);
        if (
          this.curr_game.players[this.curr_game.player_index].can_treat_color(
            this.curr_game,
            color
          )
        ) {
          this.curr_game.players[this.curr_game.player_index].treat(
            this.curr_game,
            color,
            clientWebSocket
          );
          callback();
          this.curr_game.log.push(log_string);
          clientWebSocket.sendMessageToClient(
            EventName.TreatSuccesful,
            this.curr_game.toJSON()
          );
          this.curr_game.use_turn(clientWebSocket, this.match_name);
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `It is invalid to treat ${color} at ${
              this.curr_game.players[this.curr_game.player_index].location
            }`
          );
        }
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Treat ${color} at ${
            this.curr_game.players[this.curr_game.player_index].location
          } is an invalid action`
        );
      }
    };
  }

  onShare(clientWebSocket: ClientWebSocket) {
    return (player_index: number, card: string, callback: () => void) => {
      if (this.isReady) {
        let log_string = "";
        if (card) {
          //researcher
          log_string = `Player ${
            this.curr_game.player_index
          } and Player ${player_index} trade ${card} at ${
            this.curr_game.players[this.curr_game.player_index].location
          }`;
        } else {
          log_string = `Player ${
            this.curr_game.player_index
          } and Player ${player_index} trade ${
            this.curr_game.players[this.curr_game.player_index].location
          }`;
        }

        console.log(`${this.match_name}: ${log_string}`);
        if (!card) {
          if (
            this.curr_game.players[this.curr_game.player_index].can_give(
              this.curr_game
            ) ||
            this.curr_game.players[
              this.curr_game.player_index
            ].can_take_from_player(this.curr_game.players[player_index])
          ) {
            this.curr_game.players[this.curr_game.player_index].trade(
              this.curr_game.players[player_index]
            );
            callback();
            this.curr_game.log.push(log_string);
            clientWebSocket.sendMessageToClient(
              EventName.ShareSuccesful,
              this.curr_game.toJSON()
            );
            this.curr_game.use_turn(clientWebSocket, this.match_name);
          } else {
            clientWebSocket.sendMessageToClient(
              EventName.InvalidAction,
              `Share with Player ${player_index} at ${
                this.curr_game.players[this.curr_game.player_index].location
              } is an invalid action`
            );
          }
        } else {
          if (
            this.curr_game.players[this.curr_game.player_index].can_give_card(
              this.curr_game,
              card
            ) ||
            this.curr_game.players[
              this.curr_game.player_index
            ].can_take_from_player(this.curr_game.players[player_index], card)
          ) {
            this.curr_game.players[this.curr_game.player_index].trade(
              this.curr_game.players[player_index],
              card
            );
            callback();
            this.curr_game.log.push(log_string);
            clientWebSocket.sendMessageToClient(
              EventName.ResearchShareSuccesful,
              this.curr_game.toJSON()
            );
            this.curr_game.use_turn(clientWebSocket, this.match_name);
          } else {
            clientWebSocket.sendMessageToClient(
              EventName.InvalidAction,
              `Share ${card} with Player ${player_index} at ${
                this.curr_game.players[this.curr_game.player_index].location
              } is an invalid action`
            );
          }
        }
      } else {
        if (card) {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Share with Player ${player_index} at ${
              this.curr_game.players[this.curr_game.player_index].location
            } the card ${card} is an invalid action`
          );
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Share with Player ${player_index} at ${
              this.curr_game.players[this.curr_game.player_index].location
            } is an invalid action`
          );
        }
      }
    };
  }

  onDiscover(clientWebSocket: ClientWebSocket) {
    return (cards: string[], callback: () => void) => {
      let log_string = `Player ${this.curr_game.player_index}: cure at ${
        this.curr_game.players[this.curr_game.player_index].location
      } with ${cards}`;
      console.log(`${this.match_name}: ${log_string}`);
      if (this.isReady) {
        if (
          this.curr_game.players[this.curr_game.player_index].can_cure(
            this.curr_game,
            cards
          )
        ) {
          this.curr_game.players[this.curr_game.player_index].cure(
            this.curr_game,
            cards
          );
          callback();
          this.curr_game.log.push(log_string);
          let color = this.curr_game.game_graph[cards[0]].color;
          if (this.curr_game.cured[color] === 2) {
            clientWebSocket.sendMessageToAllInRoom(EventName.Eradicated, color);
          } else {
            clientWebSocket.sendMessageToAllInRoom(
              EventName.DiscoverSuccesful,
              this.curr_game.toJSON(),
              color
            );
          }

          this.curr_game.use_turn(clientWebSocket, this.match_name);
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `It is invalid to cure with ${cards} at ${
              this.curr_game.players[this.curr_game.player_index].location
            }`
          );
        }
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `It is invalid to cure with ${cards} at ${
            this.curr_game.players[this.curr_game.player_index].location
          }`
        );
      }
    };
  }

  onPass(clientWebSocket: ClientWebSocket) {
    return () => {
      let log_string = `Player ${this.curr_game.player_index}: pass move`;
      console.log(`${this.match_name}: ${log_string}`);
      if (this.isReady) {
        this.curr_game.log.push(log_string);
        this.curr_game.pass_turn(clientWebSocket, this.match_name);
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Cannot pass turn right now`
        );
      }
    };
  }

  onDiscard(clientWebSocket: ClientWebSocket) {
    return (cards: string[], callback: () => void) => {
      let log_string = `Player ${this.curr_game.player_index} discards ${cards}`;
      console.log(`${this.match_name}: ${log_string}`);
      let valid = false;
      let p_index = this.curr_game.player_index;
      for (let player of this.curr_game.players) {
        if (player.hand.size > player.hand_size_limit) {
          valid = true;
          p_index = player.id;
          break;
        }
      }
      if (valid && this.curr_game.players[p_index].can_discard(cards)) {
        callback();
        this.curr_game.players[p_index].discard(this.curr_game, cards);
        this.curr_game.log.push(log_string);
        if (this.curr_game.turns_left === 0) {
          this.curr_game.infect_stage();
          this.curr_game.next_player();
          this.curr_game.turns_left = 4;
        }
        if (
          this.curr_game.game_state !== Client.GameState.Lost &&
          this.curr_game.game_state !== Client.GameState.Won
        ) {
          this.curr_game.game_state = Client.GameState.Ready;
        }
        clientWebSocket.sendMessageToAllInRoom(
          EventName.UpdateGameState,
          this.curr_game.toJSON()
        );
      } else {
        clientWebSocket.sendMessageToClient(EventName.DiscardInvalid, cards);
      }
    };
  }

  onRestart(clientWebSocket: ClientWebSocket) {
    return () => {
      if (this.match_name) {
        console.log(`${this.match_name} restarted`);
        this.game = generateDefault();
        clientWebSocket.sendMessageToAllInRoom(EventName.Restarted, dummy_game);
        // send roles to everyone!
        this.emitRoles(clientWebSocket);
        this.emitRoles(clientWebSocket, true);
      }
    };
  }
}

interface GameObject {
  game?: Game;
  available_roles: Set<Client.Roles>;
  players: string[];
  player_roles: Client.Roles[];
}
