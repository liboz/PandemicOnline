import { clickDivHand, setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/discardTestData";
import rfdc from "rfdc";
import {
  GameStateInterface,
  initialState,
  ShareCard,
} from "../game/withGameState";
import DivHandComponent from "../player/DivHand";
import { act, ReactTestInstance } from "react-test-renderer";
import { MockProxy } from "jest-mock-extended";
import { DiscardCardsComponent } from "./DiscardCardsComponent";
import DivHand from "../player/DivHand";
const clone = rfdc();

describe("Discard", () => {
  test("discard works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame);
    const discardCardsComponent = root.findAllByType(DiscardCardsComponent);

    expect(discardCardsComponent).toHaveLength(1);

    clickDivHand(
      discardCardsComponent,
      testGame.players[0].hand.length,
      "Discard"
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.Discard);
    expect(call[1]).toStrictEqual([testGame.players[0].hand[0]]);
  });

  test("discard multiple cards works", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.players[0].hand.push("Lima");
    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    const discardCardsComponent = root.findAllByType(DiscardCardsComponent);

    expect(discardCardsComponent).toHaveLength(1);

    clickDivHand(
      discardCardsComponent,
      modifiedTestData.players[0].hand.length,
      "Discard",
      [0, 1]
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.Discard);
    expect(call[1]).toStrictEqual([
      modifiedTestData.players[0].hand[0],
      modifiedTestData.players[0].hand[1],
    ]);
  });

  test("discard multiple cards works", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.players[0].hand.push("Lima");
    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    const discardCardsComponent = root.findAllByType(DiscardCardsComponent);

    expect(discardCardsComponent).toHaveLength(1);

    const submitButton = discardCardsComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) => c.toString().includes("Discard")).length > 0
      );
    });
    expect(submitButton.props["disabled"]).toBeTruthy();
    const divHand = discardCardsComponent[0].findAllByType(DivHandComponent);
    expect(divHand).toHaveLength(1);
    const cards = divHand[0].findAll(
      (node) =>
        node.type === "div" && node.props["className"]?.includes("card-wrapper")
    );
    expect(cards).toHaveLength(modifiedTestData.players[0].hand.length);
    // click, unclick, click
    for (const i of [0, 1, 2]) {
      for (const card of [0, 1]) {
        cards[card].props["onClick"]();
      }
    }
    expect(submitButton.props["disabled"]).toBeFalsy();
    submitButton.props["onClick"]();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.Discard);
    expect(call[1]).toStrictEqual([
      modifiedTestData.players[0].hand[0],
      modifiedTestData.players[0].hand[1],
    ]);
  });
});
