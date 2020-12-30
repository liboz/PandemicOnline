import { setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/moveTestData";
import { testGame as dispatcherTestGame } from "../data/dispatcherMoveTestData";

import DivHandComponent from "../player/DivHand";
import { MoveChoiceSelectorComponent } from "./MoveChoiceSelectorComponent";
import rfdc from "rfdc";
import { DispatcherMoveComponent } from "./DispatcherMoveComponent";
const clone = rfdc();

describe("Move choice selector", () => {
  test("operations expert move works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame);
    instance.onMove();
    expect(instance.state.isMoving).toBeTruthy();
    expect(instance.state.nodes).toHaveLength(48);

    const algiers = instance.state.nodes![0];
    expect(algiers.name).toBe("Algiers");
    instance.onSelectedNode(algiers);
    const moveChoiceSelectorComponent = root.findAllByType(
      MoveChoiceSelectorComponent
    );

    expect(moveChoiceSelectorComponent).toHaveLength(1);

    const submitButton = moveChoiceSelectorComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) =>
          c.toString().includes("Operations Expert Move")
        ).length > 0
      );
    });
    expect(submitButton.props["disabled"]).toBeTruthy();
    const divHand = moveChoiceSelectorComponent[0].findAllByType(
      DivHandComponent
    );
    expect(divHand).toHaveLength(1);
    const cards = divHand[0].findAll(
      (node) =>
        node.type === "div" && node.props["className"]?.includes("card-wrapper")
    );
    expect(cards).toHaveLength(testGame.players[0].hand.length);
    // click, unclick, click
    for (const i of [0, 1, 2]) {
      cards[0].props["onClick"]();
    }
    expect(submitButton.props["disabled"]).toBeFalsy();
    submitButton.props["onClick"]();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.OperationsExpertMove);
    expect(call[1]).toBe("Algiers");
    expect(call[2]).toBe(testGame.players[0].hand[0]);
  });

  test("operations direct flight works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame);
    instance.onMove();
    expect(instance.state.isMoving).toBeTruthy();
    expect(instance.state.nodes).toHaveLength(48);

    const algiers = instance.state.nodes![0];
    expect(algiers.name).toBe("Algiers");
    instance.onSelectedNode(algiers);
    const moveChoiceSelectorComponent = root.findAllByType(
      MoveChoiceSelectorComponent
    );

    expect(moveChoiceSelectorComponent).toHaveLength(1);

    const submitButton = moveChoiceSelectorComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) => c.toString().includes("Direct Flight"))
          .length > 0
      );
    });
    expect(submitButton.props["disabled"]).toBeFalsy();
    submitButton.props["onClick"]();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(2);
    expect(call[0]).toBe(Client.EventName.DirectFlight);
    expect(call[1]).toBe("Algiers");
  });

  test("operations charter flight works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame);
    instance.onMove();
    expect(instance.state.isMoving).toBeTruthy();
    expect(instance.state.nodes).toHaveLength(48);

    const algiers = instance.state.nodes![0];
    expect(algiers.name).toBe("Algiers");
    instance.onSelectedNode(algiers);
    const moveChoiceSelectorComponent = root.findAllByType(
      MoveChoiceSelectorComponent
    );

    expect(moveChoiceSelectorComponent).toHaveLength(1);

    const submitButton = moveChoiceSelectorComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) => c.toString().includes("Charter Flight"))
          .length > 0
      );
    });
    expect(submitButton.props["disabled"]).toBeFalsy();
    submitButton.props["onClick"]();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(2);
    expect(call[0]).toBe(Client.EventName.CharterFlight);
    expect(call[1]).toBe("Algiers");
  });

  test("operations cancel works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame);
    instance.onMove();
    expect(instance.state.isMoving).toBeTruthy();
    expect(instance.state.nodes).toHaveLength(48);

    const algiers = instance.state.nodes![0];
    expect(algiers.name).toBe("Algiers");
    instance.onSelectedNode(algiers);
    const moveChoiceSelectorComponent = root.findAllByType(
      MoveChoiceSelectorComponent
    );

    expect(moveChoiceSelectorComponent).toHaveLength(1);

    const submitButton = moveChoiceSelectorComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) => c.toString().includes("Cancel")).length > 0
      );
    });
    expect(submitButton.props["disabled"]).toBeFalsy();
    submitButton.props["onClick"]();
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
    expect(instance.state.isMoving).toBeFalsy();
  });

  test("operations move nearby works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame);
    instance.onMove();
    expect(instance.state.isMoving).toBeTruthy();
    expect(instance.state.nodes).toHaveLength(48);

    const bogota = instance.state.nodes![5];
    expect(bogota.name).toBe("Bogota");
    instance.onSelectedNode(bogota);
    const moveChoiceSelectorComponent = root.findAllByType(
      MoveChoiceSelectorComponent
    );

    expect(moveChoiceSelectorComponent).toHaveLength(0);

    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.Move);
    expect(call[1]).toBe("Bogota");
    expect(instance.state.isMoving).toBeFalsy();
  });

  test("dispatcher move works", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.players[0].role = Client.Roles.Dispatcher;
    modifiedTestData.valid_dispatcher_final_destinations = { 1: [26] };
    const { mockSocket, instance } = setupGameState(modifiedTestData);
    instance.onDispatcherMove();
    expect(instance.state.isMoving).toBeTruthy();
    expect(instance.state.dispatcherMoveOtherPlayer).toBe(1);
    expect(instance.state.nodes).toHaveLength(48);

    const manila = instance.state.nodes![26];
    expect(manila.name).toBe("Manila");
    instance.onSelectedNode(manila);

    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.DispatcherMove);
    expect(call[1]).toBe(1);
    expect(call[2]).toBe("Manila");
    expect(instance.state.isMoving).toBeFalsy();
  });

  test("dispatcher move with selections", () => {
    const { mockSocket, instance, root } = setupGameState(dispatcherTestGame);
    instance.onDispatcherMove();

    const dispatcherMoveComponent = root.findAllByType(DispatcherMoveComponent);

    expect(dispatcherMoveComponent).toHaveLength(1);

    const submitButton = dispatcherMoveComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) =>
          c.toString().includes("sdafsdf -  Quarantine Specialist")
        ).length > 0
      );
    });
    expect(submitButton.props["disabled"]).toBeFalsy();
    submitButton.props["onClick"]();
    expect(instance.state.isMoving).toBeTruthy();
    expect(instance.state.dispatcherMoveOtherPlayer).toBe(1);
    expect(instance.state.nodes).toHaveLength(48);

    const lagos = instance.state.nodes![21];
    expect(lagos.name).toBe("Lagos");
    instance.onSelectedNode(lagos);

    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.DispatcherMove);
    expect(call[1]).toBe(1);
    expect(call[2]).toBe("Lagos");
    expect(instance.state.isMoving).toBeFalsy();
  });

  test("dispatcher move cancel works", () => {
    const { mockSocket, instance, root } = setupGameState(dispatcherTestGame);
    instance.onDispatcherMove();

    const dispatcherMoveComponent = root.findAllByType(DispatcherMoveComponent);

    expect(dispatcherMoveComponent).toHaveLength(1);

    const cancelButton = dispatcherMoveComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) => c.toString().includes("Cancel")).length > 0
      );
    });
    expect(cancelButton.props["disabled"]).toBeFalsy();
    cancelButton.props["onClick"]();
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
    expect(instance.state.isMoving).toBeFalsy();
    expect(instance.state.dispatcherMoveOtherPlayer).toBeUndefined();
  });
});
