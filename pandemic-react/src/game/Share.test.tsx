import React from "react";
import renderer from "react-test-renderer";
import { Socket } from "socket.io-client";
import { mocked } from "ts-jest/utils";
import { MockComponentWithState } from "../testUtil";
import { GameGraphicsProps } from "./Game";
import {
  GameComponentProps,
  GameComponentState,
  GameStateInterface,
} from "./withGameState";

describe("Game", () => {
  test("onShare works", () => {
    const mockSocket = mocked(Socket, true);
    const component = renderer.create(
      <MockComponentWithState
        //game={{}}
        socket={mockSocket}
        player_index={0}
        player_name={"test1"}
      ></MockComponentWithState>
    );
    const instance = component.getInstance();
    expect(instance).toBeTruthy();
    const instanceFull = (instance as any) as GameStateInterface;
  });
});
