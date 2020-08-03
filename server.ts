import cors from "cors";
import express from "express";
import socketIO from "socket.io";
import { Cities } from "./data/cities";
import { Game, GameDifficulty, GameMap } from "./game";
import { Client } from "./types";
import seedrandom from "seedrandom";
import { SocketIOSocket, ClientWebSocket } from "client_websocket";

const EventName = Client.EventName;

const app = express();

let games: Record<string, GameObject> = {};
let dummy_game = new GameMap(Cities);

//console.log(games[0])

//middlewares
app.use(express.static("public"));

app.use(cors());

//routes
app.get("/", (req, res) => {
  res.send(games);
});

app.get("/:match_name", (req, res) => {
  let curr_game = games[req.params["match_name"]];
  res.send(
    !curr_game || !curr_game.game ? dummy_game : curr_game.game.toJSON()
  );
});

//Listen on port 8080
const server = app.listen(8080);

const io = socketIO(server);

let seeded = seedrandom("test!");
io.on(EventName.Connection, function(socket) {
  let match_name = socket.handshake.query.match_name;
  if (!games[match_name]) {
    games[match_name] = {
      players: [],
      game: null,
      available_roles: new Set([
        Client.Roles.Dispatcher,
        Client.Roles.Medic,
        Client.Roles.QuarantineSpecialist,
        Client.Roles.Researcher,
        Client.Roles.Scientist,
        Client.Roles.OperationsExpert
      ]),
      player_roles: []
    };
  }
  socket.join(match_name);
  const clientWebSocket: ClientWebSocket = new SocketIOSocket(io, socket);
  emitRoles(clientWebSocket, games, match_name);
  console.log(`a user connected to ${match_name}`);

  let players = function() {
    return games[match_name].players;
  };
  let curr_game = function() {
    // can this happen if no players have joined?
    return games[match_name].game;
  };

  let player_roles = function() {
    // can this happen if no players have joined?
    return games[match_name].player_roles;
  };

  let isReady = function() {
    return (
      curr_game().game_state === Client.GameState.Ready &&
      curr_game().turns_left !== 0
    );
  };

  clientWebSocket.on(EventName.Join, function(
    role: Client.Roles,
    player_name: string,
    callback
  ) {
    // add logic for role is invalid
    if (
      games[match_name].available_roles.has(role) ||
      (curr_game() && curr_game().game_state !== Client.GameState.NotStarted)
    ) {
      let player_index = players().findIndex(i => i === player_name); // should lock maybe?
      if (player_index === -1) {
        player_index = players().length;
        players().push(player_name);
        player_roles().push(role);
      }
      callback(player_index);
      games[match_name].available_roles.delete(role);
      emitRoles(clientWebSocket, games, match_name, true);
      console.log(
        `${player_name} joined ${match_name} as Player ${player_index} in role ${role}`
      );
    } else {
      clientWebSocket.sendMessageToClient(
        EventName.InvalidAction,
        `Joining ${match_name} as Player name ${player_name} in role ${role} is an invalid action`
      );
    }
  });

  clientWebSocket.on(EventName.StartGame, function(difficulty: number) {
    if (
      !curr_game() ||
      curr_game().game_state === Client.GameState.NotStarted
    ) {
      let num_players = players().length;
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
        let filtered_players = players().slice(0, num_players);
        let filtered_roles = player_roles().slice(0, num_players);
        console.log(
          `start game with ${filtered_players} in room ${match_name}`
        );
        games[match_name].game = new Game(
          Cities,
          num_players,
          filtered_players,
          filtered_roles,
          difficulty,
          seeded
        );
        curr_game().initialize_board();
        curr_game().log.push(
          `game initialized at ${GameDifficulty[difficulty]} difficulty`
        );
        clientWebSocket.sendMessageToAllInRoom(
          match_name,
          EventName.GameInitialized,
          curr_game().toJSON()
        );
      }
    } else {
      console.log(
        `Game ${match_name} has already started and has current game state: ${
          curr_game().game_state
        }`
      );
    }
  });
  clientWebSocket.on(EventName.Move, function(data, callback) {
    let log_string = `Player ${curr_game().player_index}: move to ${data}`;
    console.log(log_string);
    if (isReady()) {
      let curr_player = curr_game().players[curr_game().player_index];
      if (curr_player.move(curr_game(), data, curr_player.hand, socket)) {
        callback();
        curr_game().log.push(log_string);
        clientWebSocket.sendMessageToClient(
          EventName.MoveSuccessful,
          curr_game().toJSON()
        );
        curr_game().use_turn(io, match_name);
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
  });

  clientWebSocket.on(EventName.DirectFlight, function(data) {
    let log_string = `Player ${
      curr_game().player_index
    }: Direct Flight to ${data}`;
    console.log(log_string);
    if (isReady()) {
      let curr_player = curr_game().players[curr_game().player_index];
      if (curr_player.canDirectFlight(data)) {
        curr_player.directFlight(curr_game(), data, curr_player.hand, socket);
        curr_game().log.push(log_string);
        clientWebSocket.sendMessageToClient(
          EventName.MoveChoiceSuccesful,
          curr_game().toJSON()
        );
        curr_game().use_turn(io, match_name);
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
  });

  clientWebSocket.on(EventName.CharterFlight, function(data) {
    let log_string = `Player ${
      curr_game().player_index
    }: Charter Flight to ${data}`;
    console.log(log_string);
    if (isReady()) {
      let curr_player = curr_game().players[curr_game().player_index];
      if (curr_player.canCharterFlight()) {
        curr_player.charterFlight(curr_game(), data, curr_player.hand, socket);
        curr_game().log.push(log_string);
        clientWebSocket.sendMessageToClient(
          EventName.MoveChoiceSuccesful,
          curr_game().toJSON()
        );
        curr_game().use_turn(io, match_name);
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
  });

  clientWebSocket.on(EventName.OperationsExpertMove, function(
    final_destination,
    card
  ) {
    let log_string = `Player ${
      curr_game().player_index
    }: Operations Expert Move to ${final_destination} by discarding ${card}`;
    console.log(log_string);
    if (isReady()) {
      if (
        curr_game().players[
          curr_game().player_index
        ].canOperationsExpertMoveWithCard(curr_game(), card)
      ) {
        curr_game().players[curr_game().player_index].operationsExpertMove(
          curr_game(),
          final_destination,
          card,
          socket
        );
        curr_game().log.push(log_string);
        clientWebSocket.sendMessageToClient(
          EventName.MoveChoiceSuccesful,
          curr_game().toJSON()
        );
        curr_game().use_turn(io, match_name);
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
  });

  clientWebSocket.on(EventName.DispatcherMove, function(
    other_player_index,
    final_destination
  ) {
    let log_string = `Player ${
      curr_game().player_index
    }: Dispatcher Move ${other_player_index} to ${final_destination}`;
    console.log(log_string);
    if (isReady()) {
      let curr_player = curr_game().players[curr_game().player_index];
      let valid_dispatcher_final_destinations = new Set(
        curr_player.get_valid_dispatcher_final_destinations(curr_game())[
          other_player_index
        ]
      );

      if (valid_dispatcher_final_destinations.has(final_destination)) {
        curr_player.dispatcher_move(
          curr_game(),
          curr_game().players[other_player_index],
          final_destination,
          socket
        );
        curr_game().log.push(log_string);
        clientWebSocket.sendMessageToClient(
          EventName.MoveChoiceSuccesful,
          curr_game().toJSON()
        );
        curr_game().use_turn(io, match_name);
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Moving ${other_player_index} to ${final_destination} is an invalid Dispatcher Move`
        );
      }
    } else {
      clientWebSocket.sendMessageToClient(
        EventName.InvalidAction,
        `Moving ${other_player_index} to ${final_destination} is an invalid Dispatcher Move`
      );
    }
  });

  clientWebSocket.on(EventName.Build, function() {
    let log_string = `Player ${curr_game().player_index}: build on ${
      curr_game().players[curr_game().player_index].location
    }`;
    console.log(log_string);
    if (isReady()) {
      if (
        curr_game().players[
          curr_game().player_index
        ].can_build_research_station(curr_game())
      ) {
        curr_game().players[curr_game().player_index].build_research_station(
          curr_game()
        );
        curr_game().log.push(log_string);
        clientWebSocket.sendMessageToClient(
          EventName.BuildSuccesful,
          curr_game().toJSON()
        );
        curr_game().use_turn(io, match_name);
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Player ${curr_game().player_index} cannot build on ${
            curr_game().players[curr_game().player_index].location
          } right now`
        );
      }
    } else {
      clientWebSocket.sendMessageToClient(
        EventName.InvalidAction,
        `Build is an invalid action right now`
      );
    }
  });

  clientWebSocket.on(EventName.Treat, function(color, callback) {
    let log_string = `Player ${curr_game().player_index}: treat ${color} at ${
      curr_game().players[curr_game().player_index].location
    }`;
    console.log(log_string);
    if (isReady()) {
      if (
        curr_game().players[curr_game().player_index].can_treat_color(
          curr_game(),
          color
        )
      ) {
        curr_game().players[curr_game().player_index].treat(
          curr_game(),
          color,
          io.in(match_name)
        );
        callback();
        curr_game().log.push(log_string);
        clientWebSocket.sendMessageToClient(
          EventName.TreatSuccesful,
          curr_game().toJSON()
        );
        curr_game().use_turn(io, match_name);
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `It is invalid to treat ${color} at ${
            curr_game().players[curr_game().player_index].location
          }`
        );
      }
    } else {
      clientWebSocket.sendMessageToClient(
        EventName.InvalidAction,
        `Treat ${color} at ${
          curr_game().players[curr_game().player_index].location
        } is an invalid action`
      );
    }
  });

  clientWebSocket.on(EventName.Share, function(player_index, card, callback) {
    let log_string = "";
    if (card) {
      //researcher
      log_string = `Player ${
        curr_game().player_index
      } and Player ${player_index} trade ${card} at ${
        curr_game().players[curr_game().player_index].location
      }`;
    } else {
      log_string = `Player ${
        curr_game().player_index
      } and Player ${player_index} trade ${
        curr_game().players[curr_game().player_index].location
      }`;
    }

    console.log(log_string);

    if (isReady()) {
      if (!card) {
        if (
          curr_game().players[curr_game().player_index].can_give(curr_game()) ||
          curr_game().players[curr_game().player_index].can_take_from_player(
            curr_game().players[player_index]
          )
        ) {
          curr_game().players[curr_game().player_index].trade(
            curr_game().players[player_index]
          );
          callback();
          curr_game().log.push(log_string);
          clientWebSocket.sendMessageToClient(
            EventName.ShareSuccesful,
            curr_game().toJSON()
          );
          curr_game().use_turn(io, match_name);
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Share with Player ${player_index} at ${
              curr_game().players[curr_game().player_index].location
            } is an invalid action`
          );
        }
      } else {
        if (
          curr_game().players[curr_game().player_index].can_give_card(
            curr_game(),
            card
          ) ||
          curr_game().players[curr_game().player_index].can_take_from_player(
            curr_game().players[player_index],
            card
          )
        ) {
          curr_game().players[curr_game().player_index].trade(
            curr_game().players[player_index],
            card
          );
          callback();
          curr_game().log.push(log_string);
          clientWebSocket.sendMessageToClient(
            EventName.ResearchShareSuccesful,
            curr_game().toJSON()
          );
          curr_game().use_turn(io, match_name);
        } else {
          clientWebSocket.sendMessageToClient(
            EventName.InvalidAction,
            `Share ${card} with Player ${player_index} at ${
              curr_game().players[curr_game().player_index].location
            } is an invalid action`
          );
        }
      }
    } else {
      if (card) {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Share with Player ${player_index} at ${
            curr_game().players[curr_game().player_index].location
          } the card ${card} is an invalid action`
        );
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `Share with Player ${player_index} at ${
            curr_game().players[curr_game().player_index].location
          } is an invalid action`
        );
      }
    }
  });

  clientWebSocket.on(EventName.Discover, function(cards, callback) {
    let log_string = `Player ${curr_game().player_index}: cure at ${
      curr_game().players[curr_game().player_index].location
    } with ${cards}`;
    console.log(log_string);
    if (isReady()) {
      if (
        curr_game().players[curr_game().player_index].can_cure(
          curr_game(),
          cards
        )
      ) {
        curr_game().players[curr_game().player_index].cure(curr_game(), cards);
        callback();
        curr_game().log.push(log_string);
        let color = curr_game().game_graph[cards[0]].color;
        if (curr_game().cured[color] === 2) {
          clientWebSocket.sendMessageToAllInRoom(
            match_name,
            EventName.Eradicated,
            color
          );
        } else {
          clientWebSocket.sendMessageToAllInRoom(
            match_name,
            EventName.DiscoverSuccesful,
            curr_game().toJSON(),
            color
          );
        }

        curr_game().use_turn(io, match_name);
      } else {
        clientWebSocket.sendMessageToClient(
          EventName.InvalidAction,
          `It is invalid to cure with ${cards} at ${
            curr_game().players[curr_game().player_index].location
          }`
        );
      }
    } else {
      clientWebSocket.sendMessageToClient(
        EventName.InvalidAction,
        `It is invalid to cure with ${cards} at ${
          curr_game().players[curr_game().player_index].location
        }`
      );
    }
  });

  clientWebSocket.on(EventName.Pass, function() {
    let log_string = `Player ${curr_game().player_index}: pass move`;
    console.log(log_string);
    if (isReady()) {
      curr_game().log.push(log_string);
      curr_game().pass_turn(io, match_name);
    } else {
      clientWebSocket.sendMessageToClient(
        EventName.InvalidAction,
        `Cannot pass turn right now`
      );
    }
  });

  clientWebSocket.on(EventName.Discard, (cards, callback) => {
    let log_string = `Player ${curr_game().player_index} discards ${cards}`;
    console.log(log_string);
    let valid = false;
    let p_index = curr_game().player_index;
    for (let player of curr_game().players) {
      if (player.hand.size > player.hand_size_limit) {
        valid = true;
        p_index = player.id;
        break;
      }
    }
    if (valid && curr_game().players[p_index].can_discard(cards)) {
      callback();
      curr_game().players[p_index].discard(cards);
      curr_game().log.push(log_string);
      if (curr_game().turns_left === 0) {
        curr_game().infect_stage();
        curr_game().next_player();
        curr_game().turns_left = 4;
      }
      if (
        curr_game().game_state !== Client.GameState.Lost &&
        curr_game().game_state !== Client.GameState.Won
      ) {
        curr_game().game_state = Client.GameState.Ready;
      }
      clientWebSocket.sendMessageToAllInRoom(
        match_name,
        EventName.UpdateGameState,
        curr_game().toJSON()
      );
    } else {
      clientWebSocket.sendMessageToClient(`Discarding ${cards} is invalid`);
    }
  });

  clientWebSocket.on(EventName.Disconnect, function() {
    console.log(`user disconnected from ${match_name}`);
    if (match_name) {
      let room = io.sockets.adapter.rooms[match_name];
      if (room && room.length === 0) {
        games[match_name] = null;
      }
    }
  });
});

function emitRoles(
  socket: ClientWebSocket,
  games: Record<string, GameObject>,
  match_name: string,
  send_to_all_but_client = false
) {
  if (send_to_all_but_client) {
    socket.sendMessageToAllButClient(match_name, EventName.Roles, [
      ...games[match_name].available_roles
    ]);
  } else {
    socket.sendMessageToClient(EventName.Roles, [
      ...games[match_name].available_roles
    ]);
  }
}

interface GameObject {
  game: Game;
  available_roles: Set<Client.Roles>;
  players: string[];
  player_roles: Client.Roles[];
}
