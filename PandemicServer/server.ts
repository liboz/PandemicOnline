import cors from "cors";
import express from "express";
import socketIO from "socket.io";
import seedrandom from "seedrandom";
import { SocketIOSocket, ClientWebSocket } from "./client_websocket";
import { dummy_game, ServerGame } from "./server_game";
import { EventName } from "./game";

const app = express();

const games: Record<string, ServerGame> = {};

//console.log(games[0])

//middlewares
app.use(express.static("public"));

app.use(cors());

//routes
app.get("/", (req, res) => {
  res.send(games);
});

app.get("/:match_name", (req, res) => {
  const curr_game = games[req.params["match_name"]];
  res.send(!curr_game?.curr_game ? dummy_game : curr_game.curr_game.toJSON());
});

//Listen on port 8080
const server = app.listen(8080);

const io = socketIO(server, { transports: ["websocket"] });

let seeded: seedrandom.prng;
console.log(`running in ${process.env.NODE_ENV ?? "local"}`);
if (process.env.NODE_ENV === "production") {
  seeded = seedrandom();
} else {
  seeded = seedrandom("test!");
}
io.on(EventName.Connection, function (socket) {
  const match_name = socket.handshake.query.match_name;

  socket.join(match_name);
  const clientWebSocket: ClientWebSocket = new SocketIOSocket(
    io,
    socket,
    match_name
  );
  if (!games[match_name]) {
    games[match_name] = new ServerGame(match_name, seeded);
  }
  const game = games[match_name];
  game.emitRoles(clientWebSocket);
  console.log(`a user connected to ${match_name}`);

  clientWebSocket.on(EventName.Join, game.onJoin(clientWebSocket));
  clientWebSocket.on(EventName.StartGame, game.onStart(clientWebSocket));
  clientWebSocket.on(EventName.Move, game.onMove(clientWebSocket));
  clientWebSocket.on(
    EventName.DirectFlight,
    game.onDirectFlight(clientWebSocket)
  );
  clientWebSocket.on(
    EventName.CharterFlight,
    game.onCharterFlight(clientWebSocket)
  );
  clientWebSocket.on(
    EventName.OperationsExpertMove,
    game.onOperationsExpertMove(clientWebSocket)
  );
  clientWebSocket.on(
    EventName.DispatcherMove,
    game.onDispatcherMove(clientWebSocket)
  );
  clientWebSocket.on(EventName.Build, game.onBuild(clientWebSocket));
  clientWebSocket.on(EventName.Treat, game.onTreat(clientWebSocket));
  clientWebSocket.on(EventName.Share, game.onShare(clientWebSocket));
  clientWebSocket.on(EventName.Discover, game.onDiscover(clientWebSocket));
  clientWebSocket.on(EventName.Pass, game.onPass(clientWebSocket));
  clientWebSocket.on(EventName.Discard, game.onDiscard(clientWebSocket));
  clientWebSocket.on(EventName.Disconnect, function () {
    console.log(`user disconnected from ${match_name}`);
    if (match_name) {
      let room = io.sockets.adapter.rooms[match_name];
      if (room?.length === 0) {
        games[match_name] = null;
      }
    }
  });
  clientWebSocket.on(EventName.Restart, game.onRestart(clientWebSocket));
});
