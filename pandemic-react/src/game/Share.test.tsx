import { setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/testData";
import rfdc from "rfdc";
import { ShareCard } from "./withGameState";
const clone = rfdc();

describe("Game", () => {
  test("onShare works with two non-researchers", () => {
    const { mockSocket, instance } = setupGameState(testGame);
    instance.onShare();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(4);
    expect(call[0]).toBe(Client.EventName.Share);
    expect(call[1]).toBe(1); // other player is id 1
    expect(call[2]).toBeNull();
  });

  test("onShare works with multiple non-researcher when giving", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 3];
    modifiedTestData.players[3].location = "Lima";
    modifiedTestData.player_index = 1;
    modifiedTestData.can_take = true;
    const { mockSocket, instance } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(4);
    expect(call[0]).toBe(Client.EventName.Share);
    expect(call[1]).toBe(0); // player with the Lima card is 0
    expect(call[2]).toBeNull();
  });

  test("onShare works with multiple non-researcher", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 3];
    modifiedTestData.players[3].location = "Lima";
    const { mockSocket, instance } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(instance.state.shareCardChoices).toBeTruthy();
    expect(
      instance.state.shareCardChoices
        ?.map((choice) => {
          const { onClick, ...rest } = choice;
          return rest;
        })
        .sort()
    ).toStrictEqual(
      [
        { action: ShareCard.Give, location: "Lima", player_id: 1 },
        { action: ShareCard.Give, location: "Lima", player_id: 3 },
      ].sort()
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
  });
});
