import { setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/testData";

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
    const modifiedTestData = testGame;
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
});
