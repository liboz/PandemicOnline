import { clickDivHand, setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/discoverTestData";
import rfdc from "rfdc";
import { DiscoverComponent } from "./DiscoverComponent";
const clone = rfdc();

describe("Discover", () => {
  test("discover works", () => {
    const modifiedTestData = clone(testGame);
    const redCards = testGame.players[1].hand.filter(
      (card) =>
        testGame.game_graph[testGame.game_graph_index[card]].color ===
        Client.Color.Red
    );
    redCards.shift();
    modifiedTestData.players[1].hand = redCards;
    const { mockSocket, instance, root } = setupGameState(modifiedTestData, 1);
    instance.onDiscover();

    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.Discover);
    expect(call[1]).toStrictEqual(redCards);
  });

  test("discover works with more cards than needed to discover", () => {
    const { mockSocket, instance, root } = setupGameState(testGame, 1);
    instance.onDiscover();
    const discoverComponent = root.findAllByType(DiscoverComponent);

    expect(discoverComponent).toHaveLength(1);

    const redCards = testGame.players[1].hand.filter(
      (card) =>
        testGame.game_graph[testGame.game_graph_index[card]].color ===
        Client.Color.Red
    );
    clickDivHand(discoverComponent, redCards.length, "Discover");
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.Discover);
    expect(call[1]).toStrictEqual(
      redCards.filter((card, index) => index !== 0)
    );
  });
});
