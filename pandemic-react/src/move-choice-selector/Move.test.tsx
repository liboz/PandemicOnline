import { clickDivHand, setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/moveTestData";
import rfdc from "rfdc";
import DivHandComponent from "../player/DivHand";
import { MoveChoiceSelectorComponent } from "./MoveChoiceSelectorComponent";
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
  });
});
