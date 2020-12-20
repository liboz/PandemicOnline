import { setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/discardTestData";
import rfdc from "rfdc";
import { GameStateInterface, ShareCard } from "../game/withGameState";
import DivHandComponent from "../player/DivHand";
import { ReactTestInstance } from "react-test-renderer";
import { MockProxy } from "jest-mock-extended";
import { DiscardCardsComponent } from "./DiscardCardsComponent";
const clone = rfdc();

describe("Discard", () => {
  test("discard works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame);
    const discardCardsComponent = root.findAllByType(DiscardCardsComponent);
    expect(discardCardsComponent).toHaveLength(1);
  });
});
