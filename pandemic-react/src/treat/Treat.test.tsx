import { clickDivHand, setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/treatTestData";
import rfdc from "rfdc";
import { TreatComponent } from "./TreatComponent";
const clone = rfdc();

describe("Treat", () => {
  test("treat choices", () => {
    const { mockSocket, instance, root } = setupGameState(testGame, 1);
    instance.onTreat();
    const treatComponent = root.findAllByType(TreatComponent);

    expect(treatComponent).toHaveLength(1);

    const treatRedButton = treatComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) => c.toString().includes("red")).length > 0
      );
    });
    treatRedButton.props["onClick"]();

    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[0]).toBe(Client.EventName.Treat);
    expect(call[1]).toStrictEqual(Client.Color.Red);
    expect(instance.state.cureColorCards).toBeNull();
  });

  test("treat choices cancel works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame, 1);
    instance.onTreat();
    const treatComponent = root.findAllByType(TreatComponent);

    expect(treatComponent).toHaveLength(1);

    const cancelButton = treatComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) => c.toString().includes("Cancel")).length > 0
      );
    });
    cancelButton.props["onClick"]();
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
    expect(instance.state.cureColorCards).toBeNull();
  });
});
