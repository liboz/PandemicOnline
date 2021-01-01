import { setupGameState } from "../testUtil";
import { testGame } from "../data/eventCardTestData";
import { EventCardComponent } from "./EventCardComponent";

describe("Event Cards", () => {
  test("cancel works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame);
    instance.onEventCard();
    const eventCardComponent = root.findAllByType(EventCardComponent);

    expect(eventCardComponent).toHaveLength(1);

    const cancelButton = eventCardComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) => c.toString().includes("Cancel")).length > 0
      );
    });
    expect(cancelButton.props["disabled"]).toBeFalsy();
    cancelButton.props["onClick"]();
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
  });
});
