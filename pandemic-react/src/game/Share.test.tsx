import { setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";

describe("Game", () => {
  test("onShare works", () => {
    const { mockSocket, instance } = setupGameState();
    instance.onShare();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(4);
    expect(call[0]).toBe(Client.EventName.Share);
    expect(call[1]).toBe(1); // other player is id 1
    expect(call[2]).toBeNull();
  });
});
