import React from "react";
import renderer, { ReactTestInstance } from "react-test-renderer";
import { mock, MockProxy } from "jest-mock-extended";
import { Socket } from "socket.io-client";
import { GameStateInterface, initialState } from "./game/withGameState";
import { MockComponentWithState } from "./mockComponentWithState";
import { Client } from "pandemiccommon/dist/out-tsc";
import DivHandComponent from "./player/DivHand";
import ModalService from "./modal/Modal";

interface TestGameState {
  instance: GameStateInterface;
  root: renderer.ReactTestInstance;
  mockSocket: MockProxy<SocketIOClient.Socket> & SocketIOClient.Socket;
}

export function setupGameState(
  gameState: Client.Game,
  player_index = 0
): TestGameState {
  const mockSocket = mock<typeof Socket>();
  const component = renderer.create(
    <>
      <MockComponentWithState
        game={gameState}
        socket={mockSocket}
        player_index={player_index}
        player_name={"test1"}
      ></MockComponentWithState>
      <ModalService></ModalService>
    </>
  );
  const instance = component.getInstance();
  expect(instance).toBeTruthy();

  const instanceFull = (instance as any) as GameStateInterface;
  instanceFull.componentDidUpdate!({}, initialState());
  return { instance: instanceFull, mockSocket, root: component.root };
}

export function clickDivHand(
  instance: ReactTestInstance[],
  expectedLength: number,
  submitText: string,
  cardsToClick = [0]
) {
  const submitButton = instance[0].find((node) => {
    return (
      node.type === "button" &&
      node.children.filter((c) => c.toString().includes(submitText)).length > 0
    );
  });
  expect(submitButton.props["disabled"]).toBeTruthy();
  const divHand = instance[0].findAllByType(DivHandComponent);
  expect(divHand).toHaveLength(1);
  const cards = divHand[0].findAll(
    (node) =>
      node.type === "div" && node.props["className"]?.includes("card-wrapper")
  );
  expect(cards).toHaveLength(expectedLength);
  for (const card of cardsToClick) {
    cards[card].props["onClick"]();
  }
  expect(submitButton.props["disabled"]).toBeFalsy();
  submitButton.props["onClick"]();
}

export function assertString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("value must be string");
  }
}

export function assertNonString(value: unknown): asserts value is object {
  if (typeof value === "string") {
    throw new Error("value must be object");
  }
}
