import { setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/testData";
import rfdc from "rfdc";
import { ShareCard } from "./withGameState";
import { ShareResearcherComponent } from "../share/ShareResearcherComponent";
import DivHandComponent from "../player/DivHand";
import { ReactTestInstance } from "react-test-renderer";
import { MockProxy } from "jest-mock-extended";
import { ShareChoicesComponent } from "../share/ShareChoicesComponent";
const clone = rfdc();

function checkShareResearcher(
  shareResearcherComponent: ReactTestInstance[],
  modifiedTestData: Client.Game,
  mockSocket: MockProxy<SocketIOClient.Socket> & SocketIOClient.Socket,
  otherId: number
) {
  const submitButton = shareResearcherComponent[0].find((node) => {
    return (
      node.type === "button" &&
      node.children.filter((c) => c.toString().includes("Trade")).length > 0
    );
  });
  expect(submitButton.props["disabled"]).toBeTruthy();
  const divHand = shareResearcherComponent[0].findAllByType(DivHandComponent);
  expect(divHand).toHaveLength(1);
  const cards = divHand[0].findAll(
    (node) =>
      node.type === "div" && node.props["className"]?.includes("card-wrapper")
  );
  expect(cards).toHaveLength(modifiedTestData.players[2].hand.length);
  cards[0].props["onClick"]();
  expect(submitButton.props["disabled"]).toBeFalsy();
  submitButton.props["onClick"]();

  expect(mockSocket.emit.mock.calls).toHaveLength(1);
  const call = mockSocket.emit.mock.calls[0];
  expect(call).toHaveLength(4);
  expect(call[0]).toBe(Client.EventName.Share);
  expect(call[1]).toBe(otherId);
  expect(call[2]).toBe(modifiedTestData.players[2].hand[0]);
}

function checkChoice(
  shareChoicesComponent: ReactTestInstance[],
  targetButtonText: string
) {
  const targetButton = shareChoicesComponent[0].find((node) => {
    return (
      node.type === "button" &&
      node.children.join("").includes(targetButtonText)
    );
  });
  targetButton.props["onClick"]();
}

function onShare3Players1Research_nonResearcherLocationCard_Base(): {
  root: ReactTestInstance;
  mockSocket: MockProxy<SocketIOClient.Socket> & SocketIOClient.Socket;
  modifiedTestData: Client.Game;
} {
  const modifiedTestData = clone(testGame);
  modifiedTestData.game_graph[
    modifiedTestData.game_graph_index["Lima"]
  ].players = [0, 1, 2];
  modifiedTestData.players[2].location = "Lima";
  modifiedTestData.players[0].hand = modifiedTestData.players[0].hand.filter(
    (card) => card !== "Lima"
  );
  modifiedTestData.players[1].hand.push("Lima");
  modifiedTestData.player_index = 2;
  modifiedTestData.can_take = true;

  const { mockSocket, instance, root } = setupGameState(modifiedTestData);
  instance.onShare();
  expect(instance.state.shareCardChoices).toBeTruthy();
  expect(
    instance.state.shareCardChoices
      ?.map((choice) => {
        const { onClick, ...rest } = choice;
        return rest;
      })
      .sort()
  ).toStrictEqual(
    [
      { action: ShareCard.Take, location: "Lima", player_id: 1 },
      { action: ShareCard.Give, location: null, player_id: 0 },
      { action: ShareCard.Give, location: null, player_id: 1 },
    ].sort()
  );
  expect(mockSocket.emit.mock.calls).toHaveLength(0);
  return { root, mockSocket, modifiedTestData };
}

describe("Game", () => {
  test("onShare works with two non-researchers", () => {
    const { mockSocket, instance } = setupGameState(testGame);
    instance.onShare();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(4);
    expect(call[0]).toBe(Client.EventName.Share);
    expect(call[1]).toBe(1); // other player is id 1
    expect(call[2]).toBeNull();
  });

  test("onShare works with two non-researchers when active player doesn't have the location card", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.players[0].hand = modifiedTestData.players[0].hand.filter(
      (card) => card !== "Lima"
    );
    modifiedTestData.players[1].hand.push("Lima");
    const { mockSocket, instance } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(4);
    expect(call[0]).toBe(Client.EventName.Share);
    expect(call[1]).toBe(1); // other player is id 1
    expect(call[2]).toBeNull();
  });

  test("onShare works with multiple non-researcher when giving", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 3];
    modifiedTestData.players[3].location = "Lima";
    modifiedTestData.player_index = 1;
    modifiedTestData.can_take = true;
    const { mockSocket, instance } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(4);
    expect(call[0]).toBe(Client.EventName.Share);
    expect(call[1]).toBe(0); // player with the Lima card is 0
    expect(call[2]).toBeNull();
  });

  test("onShare works with multiple non-researcher", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 3];
    modifiedTestData.players[3].location = "Lima";
    const { mockSocket, instance } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(instance.state.shareCardChoices).toBeTruthy();
    expect(
      instance.state.shareCardChoices
        ?.map((choice) => {
          const { onClick, ...rest } = choice;
          return rest;
        })
        .sort()
    ).toStrictEqual(
      [
        { action: ShareCard.Give, location: "Lima", player_id: 1 },
        { action: ShareCard.Give, location: "Lima", player_id: 3 },
      ].sort()
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
  });

  test("onShare works with 1 researcher and having the location card", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 2];
    modifiedTestData.players[1].location = "Beijing";
    modifiedTestData.players[2].location = "Lima";
    const { mockSocket, instance } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(instance.state.shareCardChoices).toBeTruthy();
    expect(
      instance.state.shareCardChoices
        ?.map((choice) => {
          const { onClick, ...rest } = choice;
          return rest;
        })
        .sort()
    ).toStrictEqual(
      [
        { action: ShareCard.Give, location: "Lima", player_id: 2 },
        { action: ShareCard.Take, location: null, player_id: 2 },
      ].sort()
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
  });

  test("onShare works with 1 researcher", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 2];
    modifiedTestData.players[1].location = "Beijing";
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.players[0].hand = [
      "New York",
      "St Petersburg",
      "Jakarta",
      "Shanghai",
      "Taipei",
      "Riyadh",
      "Kinshasa",
    ];
    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    const shareResearcherComponentFull = (shareResearcherComponent[0] as any) as ShareResearcherComponent;
    expect(shareResearcherComponentFull.props.hand).toBe(
      modifiedTestData.players[2].hand
    );
    expect(shareResearcherComponentFull.props.curr_player_index).toBe(0);
    expect(shareResearcherComponentFull.props.target_player_index).toBe(2);

    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      2
    );
  });

  test("onShare works with 1 researcher when researcher is active player", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 2];
    modifiedTestData.players[1].location = "Beijing";
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.players[0].hand = [
      "New York",
      "St Petersburg",
      "Jakarta",
      "Shanghai",
      "Taipei",
      "Riyadh",
      "Kinshasa",
    ];
    modifiedTestData.player_index = 2;
    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    const shareResearcherComponentFull = (shareResearcherComponent[0] as any) as ShareResearcherComponent;
    expect(shareResearcherComponentFull.props.hand).toBe(
      modifiedTestData.players[2].hand
    );
    expect(shareResearcherComponentFull.props.curr_player_index).toBe(2);
    expect(shareResearcherComponentFull.props.target_player_index).toBe(0);

    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      0
    );
  });

  test("onShare works with 1 researcher when researcher is active player and has the location card", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 2];
    modifiedTestData.players[1].location = "Beijing";
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.players[0].hand = [
      "New York",
      "St Petersburg",
      "Jakarta",
      "Shanghai",
      "Taipei",
      "Riyadh",
      "Kinshasa",
    ];
    modifiedTestData.players[2].hand.push("Lima");
    modifiedTestData.player_index = 2;
    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    const shareResearcherComponentFull = (shareResearcherComponent[0] as any) as ShareResearcherComponent;
    expect(shareResearcherComponentFull.props.hand).toBe(
      modifiedTestData.players[2].hand
    );
    expect(shareResearcherComponentFull.props.curr_player_index).toBe(2);
    expect(shareResearcherComponentFull.props.target_player_index).toBe(0);

    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      0
    );
  });

  test("onShare works with 1 researcher when researcher is active player and has no cards in hand", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 2];
    modifiedTestData.players[1].location = "Beijing";
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.players[2].hand = [];
    modifiedTestData.player_index = 2;
    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(4);
    expect(call[0]).toBe(Client.EventName.Share);
    expect(call[1]).toBe(0); // player with the Lima card is 0
    expect(call[2]).toBeNull();
  });

  test("onShare works with 1 researcher when researcher is active player and other player has the location card", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 2];
    modifiedTestData.players[1].location = "Beijing";
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.player_index = 2;
    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(instance.state.shareCardChoices).toBeTruthy();
    expect(
      instance.state.shareCardChoices
        ?.map((choice) => {
          const { onClick, ...rest } = choice;
          return rest;
        })
        .sort()
    ).toStrictEqual(
      [
        { action: ShareCard.Take, location: "Lima", player_id: 0 },
        { action: ShareCard.Give, location: null, player_id: 0 },
      ].sort()
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
  });

  test("onShare works with 3 players with 1 researcher who has the location card", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 2];
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.players[0].hand = modifiedTestData.players[0].hand.filter(
      (card) => card !== "Lima"
    );
    modifiedTestData.players[2].hand.push("Lima");
    modifiedTestData.can_take = true;

    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    const shareResearcherComponentFull = (shareResearcherComponent[0] as any) as ShareResearcherComponent;
    expect(shareResearcherComponentFull.props.hand).toBe(
      modifiedTestData.players[2].hand
    );
    expect(shareResearcherComponentFull.props.curr_player_index).toBe(0);
    expect(shareResearcherComponentFull.props.target_player_index).toBe(2);

    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      2
    );
  });

  test("onShare works with 3 players with 1 researcher", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 2];
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.can_take = true;

    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(instance.state.shareCardChoices).toBeTruthy();
    expect(
      instance.state.shareCardChoices
        ?.map((choice) => {
          const { onClick, ...rest } = choice;
          return rest;
        })
        .sort()
    ).toStrictEqual(
      [
        { action: ShareCard.Give, location: "Lima", player_id: 1 },
        { action: ShareCard.Give, location: "Lima", player_id: 2 },
        { action: ShareCard.Take, location: null, player_id: 2 },
      ].sort()
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
  });

  test("onShare works with 3 players with 1 researcher no location card", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 2];
    modifiedTestData.players[0].hand = modifiedTestData.players[0].hand.filter(
      (card) => card !== "Lima"
    );
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.can_take = true;

    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    const shareResearcherComponentFull = (shareResearcherComponent[0] as any) as ShareResearcherComponent;
    expect(shareResearcherComponentFull.props.hand).toBe(
      modifiedTestData.players[2].hand
    );
    expect(shareResearcherComponentFull.props.curr_player_index).toBe(0);
    expect(shareResearcherComponentFull.props.target_player_index).toBe(2);

    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      2
    );
  });

  test("onShare works with 3 players with 1 researcher, 1 non-research with the location card, choose non-research take", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare3Players1Research_nonResearcherLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Take from Player 1 the Lima card");
    expect(mockSocket.emit.mock.calls).toHaveLength(1);
    const call = mockSocket.emit.mock.calls[0];
    expect(call).toHaveLength(4);
    expect(call[0]).toBe(Client.EventName.Share);
    expect(call[1]).toBe(1); // player with the Lima card is 1
    expect(call[2]).toBeNull();
  });

  test("onShare works with 3 players with 1 researcher, 1 non-research with the location card, choose researcher share", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare3Players1Research_nonResearcherLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Give Player 0");

    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      0
    );
  });

  test("onShare works with 3 players where active player is researcher, 1 non-research with the location card", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 2];
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.players[0].hand = modifiedTestData.players[0].hand.filter(
      (card) => card !== "Lima"
    );
    modifiedTestData.players[1].hand.push("Lima");
    modifiedTestData.player_index = 2;
    modifiedTestData.can_take = true;

    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(instance.state.shareCardChoices).toBeTruthy();
    expect(
      instance.state.shareCardChoices
        ?.map((choice) => {
          const { onClick, ...rest } = choice;
          return rest;
        })
        .sort()
    ).toStrictEqual(
      [
        { action: ShareCard.Take, location: "Lima", player_id: 1 },
        { action: ShareCard.Give, location: null, player_id: 0 },
        { action: ShareCard.Give, location: null, player_id: 1 },
      ].sort()
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Give Player 0");

    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      0
    );
  });

  test("onShare works with 3 players where active player is researcher", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 2];
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.players[0].hand = modifiedTestData.players[0].hand.filter(
      (card) => card !== "Lima"
    );
    modifiedTestData.player_index = 2;

    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(instance.state.shareCardChoices).toBeTruthy();
    expect(
      instance.state.shareCardChoices
        ?.map((choice) => {
          const { onClick, ...rest } = choice;
          return rest;
        })
        .sort()
    ).toStrictEqual(
      [
        { action: ShareCard.Give, location: null, player_id: 0 },
        { action: ShareCard.Give, location: null, player_id: 1 },
      ].sort()
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Give Player 0");

    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      0
    );
  });

  test("onShare works with 3 players where active player is researcher and has the location card", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 2];
    modifiedTestData.players[2].location = "Lima";
    modifiedTestData.players[0].hand = modifiedTestData.players[0].hand.filter(
      (card) => card !== "Lima"
    );
    modifiedTestData.players[2].hand.push("Lima");
    modifiedTestData.player_index = 2;

    const { mockSocket, instance, root } = setupGameState(modifiedTestData);
    instance.onShare();
    expect(instance.state.shareCardChoices).toBeTruthy();
    expect(
      instance.state.shareCardChoices
        ?.map((choice) => {
          const { onClick, ...rest } = choice;
          return rest;
        })
        .sort()
    ).toStrictEqual(
      [
        { action: ShareCard.Give, location: null, player_id: 0 },
        { action: ShareCard.Give, location: null, player_id: 1 },
      ].sort()
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Give Player 0");

    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      0
    );
  });
});
