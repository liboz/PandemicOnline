import React from "react";
import renderer from "react-test-renderer";
import { mock, MockProxy } from "jest-mock-extended";
import { Socket } from "socket.io-client";
import { testGame } from "./data/testData";
import { GameStateInterface } from "./game/withGameState";
import { MockComponentWithState } from "./mockComponentWithState";

interface TestGameState {
  instance: GameStateInterface;
  mockSocket: MockProxy<SocketIOClient.Socket> & SocketIOClient.Socket;
}

export function setupGameState(): TestGameState {
  const mockSocket = mock<typeof Socket>();
  const component = renderer.create(
    <MockComponentWithState
      game={testGame}
      socket={mockSocket}
      player_index={0}
      player_name={"test1"}
    ></MockComponentWithState>
  );
  const instance = component.getInstance();
  expect(instance).toBeTruthy();
  const instanceFull = (instance as any) as GameStateInterface;
  return { instance: instanceFull, mockSocket };
}
