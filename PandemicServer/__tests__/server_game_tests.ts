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

    it("doesnt work when move than 5 players", () => {
      const mockSocket = mock<ClientWebSocket>();
      const onJoin = server_game.onJoin(mockSocket);
      joinGame(onJoin, Client.Roles.Medic, "p1");
      joinGame(onJoin, Client.Roles.Scientist, "p2");
      joinGame(onJoin, Client.Roles.Researcher, "p3");
      joinGame(onJoin, Client.Roles.Dispatcher, "p4");
      joinGame(onJoin, Client.Roles.QuarantineSpecialist, "p5");
      joinGame(onJoin, Client.Roles.OperationsExpert, "p6");

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
      onDirectFlight("Kolkata");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveChoiceSuccessful
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
      onDirectFlight("Kolkata");
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

      server_game.curr_game.players[0].location = "Kolkata";
      server_game.curr_game.game_graph["Atlanta"].players.delete(
        server_game.curr_game.players[0]
      );
      server_game.curr_game.game_graph["Kolkata"].players.add(
        server_game.curr_game.players[0]
      );
      const onCharterFlight = server_game.onCharterFlight(mockSocket);
      onCharterFlight("Atlanta");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveChoiceSuccessful
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

  describe("#onOperationsExpertMove", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.OperationsExpert, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onOperationsExpertMove = server_game.onOperationsExpertMove(
        mockSocket
      );
      onOperationsExpertMove("Paris", "Kolkata");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveChoiceSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
    });

    it("dosnt work when not started", () => {
      const mockSocket = mock<ClientWebSocket>();
      const onJoin = server_game.onJoin(mockSocket);
      joinGame(onJoin, Client.Roles.OperationsExpert, "p1");
      joinGame(onJoin, Client.Roles.QuarantineSpecialist, "p2");

      const onOperationsExpertMove = server_game.onOperationsExpertMove(
        mockSocket
      );
      onOperationsExpertMove("Paris", "Kolkata");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when cannot operations expert move", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.OperationsExpert, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onOperationsExpertMove = server_game.onOperationsExpertMove(
        mockSocket
      );
      onOperationsExpertMove("Paris", "Mexico City");
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
      expect(server_game.curr_game.players[0].location).toBe("Atlanta");
    });
  });

  describe("#onDispatcherMove", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Dispatcher, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onDispatcherMove = server_game.onDispatcherMove(mockSocket);
      onDispatcherMove(1, "Kolkata");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveChoiceSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
      expect(server_game.curr_game.players[1].location).toBe("Kolkata");
      mockSocket.sendMessageToClient.mockClear();
      mockSocket.sendMessageToAllInRoom.mockClear();

      // cant move self to another pawn via dispatcher action
      expect(server_game.curr_game.players[0].location).toBe("Atlanta");
      onDispatcherMove(0, "Kolkata");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.InvalidAction
      );
      mockSocket.sendMessageToClient.mockClear();

      const onMove = server_game.onMove(mockSocket);
      const mockCallback = jest.fn();
      onMove("Kolkata", mockCallback);
      expect(mockCallback.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
      expect(server_game.curr_game.players[0].location).toBe("Kolkata");
    });

    it("works to actually move someone to the dispatcher", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Dispatcher, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      // move dispatcher first
      const onMove = server_game.onMove(mockSocket);
      const mockCallback = jest.fn();
      onMove("Kolkata", mockCallback);
      expect(mockCallback.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
      expect(server_game.curr_game.players[0].location).toBe("Kolkata");
      mockSocket.sendMessageToClient.mockClear();
      mockSocket.sendMessageToAllInRoom.mockClear();

      const onDispatcherMove = server_game.onDispatcherMove(mockSocket);
      onDispatcherMove(1, "Kolkata");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.MoveChoiceSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
      expect(server_game.curr_game.players[1].location).toBe("Kolkata");
    });

    it("dosnt work when not started", () => {
      const mockSocket = mock<ClientWebSocket>();
      const onJoin = server_game.onJoin(mockSocket);
      joinGame(onJoin, Client.Roles.OperationsExpert, "p1");
      joinGame(onJoin, Client.Roles.QuarantineSpecialist, "p2");

      const onDispatcherMove = server_game.onDispatcherMove(mockSocket);
      onDispatcherMove(1, "Kolkata");
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when not dispatcher move", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.OperationsExpert, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onDispatcherMove = server_game.onDispatcherMove(mockSocket);
      onDispatcherMove(1, "Kolkata");
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
      expect(server_game.curr_game.players[0].location).toBe("Atlanta");
    });
  });

  describe("#onBuild", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      // cant build on Atlanta as there is a research station there already
      server_game.curr_game.players[0].hand.add("Miami");
      const onMove = server_game.onMove(mockSocket);
      const mockCallback = jest.fn();
      onMove("Miami", mockCallback);
      mockSocket.sendMessageToClient.mockClear();
      mockSocket.sendMessageToAllInRoom.mockClear();

      const onBuild = server_game.onBuild(mockSocket);
      onBuild();
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.BuildSuccessful
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

      const onBuild = server_game.onBuild(mockSocket);
      onBuild();
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when cannot build there", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onBuild = server_game.onBuild(mockSocket);
      onBuild();
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
    });
  });

  describe("#onTreat", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.game_graph["Atlanta"].cubes[Client.Color.Blue] += 1;
      const onTreat = server_game.onTreat(mockSocket);
      const mockCallback = jest.fn();
      onTreat(Client.Color.Blue, mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.TreatSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
      expect(
        server_game.curr_game.game_graph["Atlanta"].cubes[Client.Color.Blue]
      ).toBe(0);
    });

    it("sends eradicated message when eradicated", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.cured.blue = 1;
      server_game.curr_game.cubes.blue = 23;
      server_game.curr_game.game_graph["Atlanta"].cubes[Client.Color.Blue] += 1;
      const onTreat = server_game.onTreat(mockSocket);
      const mockCallback = jest.fn();
      onTreat(Client.Color.Blue, mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.TreatSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(2);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.Eradicated
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[1][0]).toBe(
        EventName.UpdateGameState
      );
      expect(
        server_game.curr_game.game_graph["Atlanta"].cubes[Client.Color.Blue]
      ).toBe(0);
    });

    it("dosnt work when no turns left", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.turns_left = 0;

      const onTreat = server_game.onTreat(mockSocket);
      const mockCallback = jest.fn();
      onTreat(Client.Color.Blue, mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when cannot treat there", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onTreat = server_game.onTreat(mockSocket);
      const mockCallback = jest.fn();
      onTreat(Client.Color.Blue, mockCallback);
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
    });
  });

  describe("#onShare", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.players[0].hand.add("Atlanta");
      const onShare = server_game.onShare(mockSocket);
      const mockCallback = jest.fn();
      onShare(1, null, mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.ShareSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
      expect(
        server_game.curr_game.game_graph["Atlanta"].cubes[Client.Color.Blue]
      ).toBe(0);
    });

    it("works as researcher", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Researcher, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onShare = server_game.onShare(mockSocket);
      const mockCallback = jest.fn();
      onShare(1, "Kolkata", mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.ResearchShareSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
      expect(
        server_game.curr_game.game_graph["Atlanta"].cubes[Client.Color.Blue]
      ).toBe(0);
    });

    it("dosnt work when no turns left", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.turns_left = 0;

      const onShare = server_game.onShare(mockSocket);
      const mockCallback = jest.fn();
      onShare(1, null, mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when no turns left as researcher", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Researcher, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.turns_left = 0;

      const onShare = server_game.onShare(mockSocket);
      const mockCallback = jest.fn();
      onShare(1, "Kolkata", mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when cannot share there", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onShare = server_game.onShare(mockSocket);
      const mockCallback = jest.fn();
      onShare(1, null, mockCallback);
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
    });

    it("dosnt work when cannot share there as Researcher", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onShare = server_game.onShare(mockSocket);
      const mockCallback = jest.fn();
      onShare(1, "Khartoum", mockCallback);
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
    });
  });

  describe("#onDiscover", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const cards = ["Cairo", "Algiers", "Tehran"];
      cards.forEach((card) => server_game.curr_game.players[0].hand.add(card));
      const onDiscover = server_game.onDiscover(mockSocket);
      const mockCallback = jest.fn();
      onDiscover(["Kolkata", "Mumbai", ...cards], mockCallback);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(2);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.DiscoverSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[1][0]).toBe(
        EventName.UpdateGameState
      );
    });

    it("works with eradicate", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.cubes[Client.Color.Black] = 24;
      const cards = ["Cairo", "Algiers", "Tehran"];
      cards.forEach((card) => server_game.curr_game.players[0].hand.add(card));
      const onDiscover = server_game.onDiscover(mockSocket);
      const mockCallback = jest.fn();
      onDiscover(["Kolkata", "Mumbai", ...cards], mockCallback);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(2);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.Eradicated
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[1][0]).toBe(
        EventName.UpdateGameState
      );
    });

    it("dosnt work when no turns left", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.turns_left = 0;

      const cards = ["Atlanta", "New York", "Washington", "San Francisco"];
      cards.forEach((card) => server_game.curr_game.players[0].hand.add(card));
      const onDiscover = server_game.onDiscover(mockSocket);
      const mockCallback = jest.fn();
      onDiscover(["Milan", ...cards], mockCallback);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });

    it("dosnt work when cannot discover there", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onDiscover = server_game.onDiscover(mockSocket);
      const mockCallback = jest.fn();
      onDiscover([], mockCallback);
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
    });
  });

  describe("#onPass", () => {
    it("works", () => {
      seeded = seedrandom("test!1");
      server_game = new ServerGame(match_name, seeded);
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onPass = server_game.onPass(mockSocket);
      onPass();
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(0);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(2); // one for ending turn and one for next turn
      mockSocket.sendMessageToAllInRoom.mock.calls.forEach((call) =>
        expect(call[0]).toBe(EventName.UpdateGameState)
      );
    });

    it("can trigger epidemic", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onPass = server_game.onPass(mockSocket);
      onPass();
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(0);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(3); // one for epidemic, one for ending turn and one for next turn
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.Epidemic
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][1]).toBe(
        "Sao Paulo"
      );
      mockSocket.sendMessageToAllInRoom.mock.calls
        .slice(1)
        .forEach((call) => expect(call[0]).toBe(EventName.UpdateGameState));
    });

    it("dosnt work when no turns left", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.turns_left = 0;

      const onPass = server_game.onPass(mockSocket);
      onPass();
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      lastSendMessageToClientIsInvalidAction(mockSocket);
    });
  });

  describe("#onEventCard", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      const onEventCard = server_game.onEventCard(mockSocket);
      const args = [Client.EventCard.GovernmentGrant, 0, "Tokyo"];
      onEventCard.apply(onEventCard, args);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(0);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1); // one for ending turn and one for next turn
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.EventCardSuccessful
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0].slice(1)).toEqual([
        ...args,
        undefined,
        server_game.curr_game.toJSON(),
      ]);
    });

    it("dosnt work when game is over", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);

      server_game.curr_game.game_state = Client.GameState.Lost;
      const onEventCard = server_game.onEventCard(mockSocket);
      onEventCard(Client.EventCard.GovernmentGrant, 0, "Tokyo");
      lastSendMessageToClientIsInvalidAction(mockSocket);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(0);
    });
  });

  describe("#onDiscard", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);
      mockSocket.sendMessageToAllButClient.mockClear();

      // trigger discard
      const cards = ["Atlanta", "New York", "Washington", "San Francisco"];
      cards.forEach((card) => server_game.curr_game.players[0].hand.add(card));
      server_game.curr_game.turns_left = 1;
      const onShare = server_game.onShare(mockSocket);
      const mockCallback = jest.fn();
      onShare(1, null, mockCallback);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(3);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.Epidemic
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[1][0]).toBe(
        EventName.UpdateGameState
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[2][0]).toBe(
        EventName.DiscardCards
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[2][1]).toBe(0);
      mockSocket.sendMessageToAllInRoom.mockClear();

      const onDiscard = server_game.onDiscard(mockSocket);
      const mockCallbackDiscard = jest.fn();
      onDiscard(cards.slice(1, 2), mockCallbackDiscard);

      expect(mockCallbackDiscard.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
    });

    it("works when not end of turn", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);
      mockSocket.sendMessageToAllButClient.mockClear();

      // trigger discard
      const cards = ["Atlanta", "New York", "Washington", "San Francisco"];
      cards.forEach((card) => server_game.curr_game.players[0].hand.add(card));
      const onMove = server_game.onMove(mockSocket);
      const mockCallback = jest.fn();
      onMove("Miami", mockCallback);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(2);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[1][0]).toBe(
        EventName.DiscardCards
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[1][1]).toBe(0);
      mockSocket.sendMessageToAllInRoom.mockClear();

      const onDiscard = server_game.onDiscard(mockSocket);
      const mockCallbackDiscard = jest.fn();
      onDiscard(cards.slice(1, 2), mockCallbackDiscard);

      expect(mockCallbackDiscard.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.UpdateGameState
      );
    });

    it("prevents invalid discard", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);
      mockSocket.sendMessageToAllButClient.mockClear();

      // trigger discard
      const cards = ["Atlanta", "New York", "Washington", "San Francisco"];
      cards.forEach((card) => server_game.curr_game.players[0].hand.add(card));
      server_game.curr_game.turns_left = 1;
      const onShare = server_game.onShare(mockSocket);
      const mockCallback = jest.fn();
      onShare(1, null, mockCallback);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(3);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.Epidemic
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[1][0]).toBe(
        EventName.UpdateGameState
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[2][0]).toBe(
        EventName.DiscardCards
      );
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[2][1]).toBe(0);
      mockSocket.sendMessageToAllInRoom.mockClear();
      mockSocket.sendMessageToClient.mockClear();

      const onDiscard = server_game.onDiscard(mockSocket);
      const mockCallbackDiscard = jest.fn();
      onDiscard(cards.slice(0, 2), mockCallbackDiscard);

      expect(mockCallbackDiscard.mock.calls).toHaveLength(0);
      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.DiscardInvalid
      );
    });
  });

  describe("#onRestart", () => {
    it("works", () => {
      const mockSocket = createGame(server_game, [
        { role: Client.Roles.Medic, name: "p1" },
        { role: Client.Roles.QuarantineSpecialist, name: "p2" },
      ]);
      mockSocket.sendMessageToAllButClient.mockClear();

      const onRestart = server_game.onRestart(mockSocket);
      onRestart();
      expect(mockSocket.sendMessageToAllInRoom.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllInRoom.mock.calls[0][0]).toBe(
        EventName.Restarted
      );

      expect(mockSocket.sendMessageToAllButClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToAllButClient.mock.calls[0][0]).toBe(
        EventName.Roles
      );
      expect(
        mockSocket.sendMessageToAllButClient.mock.calls[0][1]
      ).toStrictEqual([...defaultMatch.available_roles]);

      expect(mockSocket.sendMessageToClient.mock.calls).toHaveLength(1);
      expect(mockSocket.sendMessageToClient.mock.calls[0][0]).toBe(
        EventName.Roles
      );
      expect(mockSocket.sendMessageToClient.mock.calls[0][1]).toStrictEqual([
        ...defaultMatch.available_roles,
      ]);
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
