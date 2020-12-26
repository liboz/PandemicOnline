import { EventName, Game } from "../game";
import { Client } from "pandemiccommon/dist/out-tsc";
const seedrandom = require("seedrandom");
import { generateDefault, ServerGame } from "../server_game";
import { ClientWebSocket } from "../client_websocket";
import { mock, MockProxy } from "jest-mock-extended";

const defaultMatch = generateDefault();
const match_name = "testmatch";

describe("ServerGame", () => {
  let seeded: seedrandom.prng;
  let server_game: ServerGame;
  beforeEach(() => {
    seeded = seedrandom("test!");
    server_game = new ServerGame(match_name, seeded);
  });
  describe("#onJoin", () => {
    it("works", () => {
      const mockSocket = mock<ClientWebSocket>();
      const onJoin = server_game.onJoin(mockSocket);
      const mockCallback = jest.fn();
      onJoin(Client.Roles.Medic, "p1", mockCallback);

      //callback works
      expect(mockCallback.mock.calls).toHaveLength(1);
      expect(mockCallback.mock.calls[0].length).toEqual(1);
      expect(mockCallback.mock.calls[0][0]).toEqual(0);

      // emitroles works
      expect(mockSocket.sendMessageToAllButClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllButClient.mock.calls[0]).toHaveLength(
        2
      );
      expect(mockSocket.sendMessageToAllButClient.mock.calls[0][0]).toBe(
        EventName.Roles
      );
      expect(
        mockSocket.sendMessageToAllButClient.mock.calls[0][1]
      ).toStrictEqual(
        [...defaultMatch.available_roles].filter(
          (role) => role !== Client.Roles.Medic
        )
      );

      // join again with same name does not call callback or send to all but client
      onJoin(Client.Roles.QuarantineSpecialist, "p1", mockCallback);
      expect(mockCallback.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllButClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(2);
      // check invalid actions
      expect(mockSocket.sendMessageToClient.mock.calls[0]).toHaveLength(2);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.InvalidAction
      );
      expect(mockSocket.sendMessageToClient.mock.calls[1][0]).toBe(
        EventName.Roles
      );
      expect(mockSocket.sendMessageToClient.mock.calls[1][1]).toStrictEqual(
        [...defaultMatch.available_roles].filter(
          (role) => role !== Client.Roles.Medic
        )
      );

      // join again with same role does not call callback or send to all but client
      onJoin(Client.Roles.Medic, "p2", mockCallback);
      expect(mockCallback.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllButClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(4);
      // check invalid actions
      expect(mockSocket.sendMessageToClient.mock.calls[2]).toHaveLength(2);
      expect(mockSocket.sendMessageToClient.mock.calls[2][0]).toBe(
        EventName.InvalidAction
      );
      expect(mockSocket.sendMessageToClient.mock.calls[3][0]).toBe(
        EventName.Roles
      );
      expect(mockSocket.sendMessageToClient.mock.calls[3][1]).toStrictEqual(
        [...defaultMatch.available_roles].filter(
          (role) => role !== Client.Roles.Medic
        )
      );

      // join as p2 correctly
      onJoin(Client.Roles.Researcher, "p2", mockCallback);
      expect(mockCallback.mock.calls).toHaveLength(2);

      expect(mockCallback.mock.calls[1].length).toEqual(1);
      expect(mockCallback.mock.calls[1][0]).toEqual(1);

      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
      const mockCallbackStart = jest.fn();
      const onStart = server_game.onStart(mockSocket);
      onStart(5, mockCallbackStart);
      expect(mockCallbackStart.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.GameInitialized
      );

      // cannot join as a new role after it has started
      onJoin(Client.Roles.QuarantineSpecialist, "p3", mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(5);
      lastSendMessageToClientIsInvalidAction(mockSocket);

      // cannot join as a new player after it started
      onJoin(Client.Roles.Medic, "p3", mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(6);
      lastSendMessageToClientIsInvalidAction(mockSocket);

      onJoin(Client.Roles.Medic, "p1", mockCallback);
      expect(mockCallback.mock.calls).toHaveLength(3);

      expect(mockCallback.mock.calls[2].length).toEqual(1);
      expect(mockCallback.mock.calls[2][0]).toEqual(0);

      // cannot join with wrong name + role combo
      onJoin(Client.Roles.Researcher, "p1", mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(7);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });
  });

  describe("#onStart", () => {
    it("doesnt work when fewer than 2 players", () => {
      const mockSocket = mock<ClientWebSocket>();
      const onJoin = server_game.onJoin(mockSocket);
      joinGame(onJoin, Client.Roles.Medic, "p1");

      const mockCallbackStart = startGame(server_game, mockSocket);
      expect(mockCallbackStart.mock.calls).toHaveLength(0);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);

      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("doesnt work when already started", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      mockSocket.sendMessageToClient.mockClear();
      const mockCallbackStart = startGame(server_game, mockSocket);
      expect(mockCallbackStart.mock.calls).toHaveLength(0);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);

      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(0); // just prints console error on server
    });
  });

  describe("#onMove", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onMove = server_game.onMove(mockSocket);
      const mockCallback = jest.fn();
      onMove("Miami", mockCallback);
      expect(mockCallback.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
    });

    it("dosnt work when not started", () => {
      const mockSocket = mock<ClientWebSocket>();
      const onJoin = server_game.onJoin(mockSocket);
      joinGame(onJoin, Client.Roles.Medic, "p1");
      joinGame(onJoin, Client.Roles.QuarantineSpecialist, "p2");

      const onMove = server_game.onMove(mockSocket);
      const mockCallback = jest.fn();
      onMove("Miami", mockCallback);
      expect(mockCallback.mock.calls).toHaveLength(0);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when invalid location", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onMove = server_game.onMove(mockSocket);
      const mockCallback = jest.fn();
      onMove("Tokyo", mockCallback);
      expect(mockCallback.mock.calls).toHaveLength(0);
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
      expect(server_game.curr_game.players[0].location).toBe("Atlanta");
    });
  });

  describe("#onDirectFlight", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onDirectFlight = server_game.onDirectFlight(mockSocket);
      onDirectFlight("Milan");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveChoiceSuccesful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
    });

    it("dosnt work when not started", () => {
      const mockSocket = mock<ClientWebSocket>();
      const onJoin = server_game.onJoin(mockSocket);
      joinGame(onJoin, Client.Roles.Medic, "p1");
      joinGame(onJoin, Client.Roles.QuarantineSpecialist, "p2");

      const onDirectFlight = server_game.onDirectFlight(mockSocket);
      onDirectFlight("Milan");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when invalid location", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onDirectFlight = server_game.onDirectFlight(mockSocket);
      onDirectFlight("Miami");
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
      expect(server_game.curr_game.players[0].location).toBe("Atlanta");
    });
  });

  describe("#onCharterFlight", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.players[0].location = "Milan";
      server_game.curr_game.game_graph["Atlanta"].players.delete(
        server_game.curr_game.players[0]
      );
      server_game.curr_game.game_graph["Milan"].players.add(
        server_game.curr_game.players[0]
      );
      const onCharterFlight = server_game.onCharterFlight(mockSocket);
      onCharterFlight("Atlanta");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveChoiceSuccesful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
    });

    it("dosnt work when not started", () => {
      const mockSocket = mock<ClientWebSocket>();
      const onJoin = server_game.onJoin(mockSocket);
      joinGame(onJoin, Client.Roles.Medic, "p1");
      joinGame(onJoin, Client.Roles.QuarantineSpecialist, "p2");

      const onCharterFlight = server_game.onCharterFlight(mockSocket);
      onCharterFlight("Paris");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when cannot charter flight", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onCharterFlight = server_game.onCharterFlight(mockSocket);
      onCharterFlight("Miami");
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
      expect(server_game.curr_game.players[0].location).toBe("Atlanta");
    });
  });
});

function lastSendMessageToClientIsInvalidAction(
  mockSocket: MockProxy<ClientWebSocket> & ClientWebSocket
) {
  expect(
    mockSocket.sendMessageToClient.mock.calls[
      mockSocket.sendMessageToClient.mock.calls.length - 1
    ][0]
  ).toBe(EventName.InvalidAction);
}

function joinGame(
  onJoin: (
    role: Client.Roles,
    player_name: string,
    callback: (player_index: Number) => void
  ) => void,
  role: Client.Roles,
  name: string
): jest.Mock {
  const mockCallback = jest.fn();
  onJoin(role, name, mockCallback);
  return mockCallback;
}

function startGame(
  server_game: ServerGame,
  mockSocket: ClientWebSocket
): jest.Mock {
  const mockCallbackStart = jest.fn();
  const onStart = server_game.onStart(mockSocket);
  onStart(5, mockCallbackStart);
  return mockCallbackStart;
}

interface PlayerInfo {
  role: Client.Roles;
  name: string;
}

function createGame(server_game: ServerGame, playerInfo: PlayerInfo[]) {
  const mockSocket = mock<ClientWebSocket>();
  const onJoin = server_game.onJoin(mockSocket);
  playerInfo.forEach((player) => {
    const { role, name } = player;
    joinGame(onJoin, role, name);
  });
  startGame(server_game, mockSocket);
  mockSocket.sendMessageToAllInRoom.mockClear();
  return mockSocket;
}
