import { clickDivHand, setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/shareTestData";
import rfdc from "rfdc";
import { GameStateInterface, ShareCard } from "../game/withGameState";
import { ShareResearcherComponent } from "./ShareResearcherComponent";
import DivHandComponent from "../player/DivHand";
import { ReactTestInstance } from "react-test-renderer";
import { MockProxy } from "jest-mock-extended";
import { ShareChoicesComponent } from "./ShareChoicesComponent";
const clone = rfdc();

function checkShareResearcher(
  shareResearcherComponent: ReactTestInstance[],
  modifiedTestData: Client.Game,
  mockSocket: MockProxy<SocketIOClient.Socket> & SocketIOClient.Socket,
  otherId: number
) {
  clickDivHand(
    shareResearcherComponent,
    modifiedTestData.players[2].hand.length,
    "Trade"
  );

  checkSockets(mockSocket, otherId, modifiedTestData.players[2].hand[0]);
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

function checkSockets(
  mockSocket: MockProxy<SocketIOClient.Socket> & SocketIOClient.Socket,
  otherPlayer: number,
  card?: string
) {
  expect(mockSocket.emit.mock.calls).toHaveLength(1);
  const call = mockSocket.emit.mock.calls[0];
  expect(call).toHaveLength(4);
  expect(call[0]).toBe(Client.EventName.Share);
  expect(call[1]).toBe(otherPlayer); // other player is id 1
  if (card) {
    expect(call[2]).toBe(card);
  } else {
    expect(call[2]).toBeNull();
  }
}

interface ShareChoiceInfo {
  root: ReactTestInstance;
  mockSocket: MockProxy<SocketIOClient.Socket> & SocketIOClient.Socket;
  modifiedTestData: Client.Game;
  instance: GameStateInterface;
}

describe("Share", () => {
  test("onShare works with two non-researchers", () => {
    const { mockSocket, instance } = setupGameState(testGame);
    instance.onShare();
    checkSockets(mockSocket, 1); // other player is id 1
  });

  test("onShare works with two non-researchers when active player doesn't have the location card", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.players[0].hand = modifiedTestData.players[0].hand.filter(
      (card) => card !== "Lima"
    );
    modifiedTestData.players[1].hand.push("Lima");
    const { mockSocket, instance } = setupGameState(modifiedTestData);
    instance.onShare();
    checkSockets(mockSocket, 1); // other player is id 1
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
    checkSockets(mockSocket, 0); // other player is id 0
  });

  test("onShare works with multiple non-researcher", () => {
    const modifiedTestData = clone(testGame);
    modifiedTestData.game_graph[
      modifiedTestData.game_graph_index["Lima"]
    ].players = [0, 1, 3];
    modifiedTestData.players[3].location = "Lima";
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
        { action: ShareCard.Give, location: "Lima", player_id: 3 },
      ].sort()
    );
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Give Player 3 the Lima card");
    checkSockets(mockSocket, 3); // other player is id 3
  });

  test("onShare works with 1 researcher and active player having the location card, choose cancel", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
      instance,
    } = onShare2Players_Researcher_currPlayerLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Cancel");
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
    expect(instance.state.shareCardChoices).toBeNull();
  });

  test("onShare works with 1 researcher and active player having the location card, choose give location card", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare2Players_Researcher_currPlayerLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Give Player 2 the Lima card");
    checkSockets(mockSocket, 2); // other player is id 2
  });

  test("onShare works with 1 researcher and active player having the location card, choose take from researcher", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare2Players_Researcher_currPlayerLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Take from Player 2");

    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      2
    );
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
    checkSockets(mockSocket, 0); // other player is id 0
  });

  test("onShare works with 1 researcher when researcher is active player and other player has the location card, choose take location card", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare2Players_currPlayerResearcher_noLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Take from Player 0 the Lima card");
    checkSockets(mockSocket, 0); // other player is id 0
  });

  test("onShare works with 1 researcher when researcher is active player and other player has the location card, choose share researcher", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare2Players_currPlayerResearcher_noLocationCard_Base();
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

  test("onShare works with 1 researcher when researcher is active player and other player has the location card, choose share researcher, then cancel", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
      instance,
    } = onShare2Players_currPlayerResearcher_noLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Give Player 0");

    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    const cancelButton = shareResearcherComponent[0].find((node) => {
      return (
        node.type === "button" &&
        node.children.filter((c) => c.toString().includes("Cancel")).length > 0
      );
    });
    cancelButton.props["onClick"]();
    expect(mockSocket.emit.mock.calls).toHaveLength(0);
    expect(instance.state.shareCardChoices).toBeNull();
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

  test("onShare works with 3 players with 1 researcher, choose give location card", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare3Players_Researcher_currPlayerLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Give Player 1 the Lima card");
    checkSockets(mockSocket, 1); // other player is id 1
  });

  test("onShare works with 3 players with 1 researcher, choose take from researcher", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare3Players_Researcher_currPlayerLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Take from Player 2");

    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      2
    );
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
    } = onShare3Players_Researcher_nonResearcherLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Take from Player 1 the Lima card");
    checkSockets(mockSocket, 1); // other player is id 1
  });

  test("onShare works with 3 players with 1 researcher, 1 non-research with the location card, choose researcher share", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare3Players_Researcher_nonResearcherLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Take from Player 2");

    const shareResearcherComponent = root.findAllByType(
      ShareResearcherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    checkShareResearcher(
      shareResearcherComponent,
      modifiedTestData,
      mockSocket,
      2
    );
  });

  test("onShare works with 3 players where active player is researcher, 1 non-research with the location card, choose researcher give", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare3Players_currPlayerResearcher_nonResearcherLocationCard_Base();
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

  test("onShare works with 3 players where active player is researcher, 1 non-research with the location card, choose take card", () => {
    const {
      root,
      modifiedTestData,
      mockSocket,
    } = onShare3Players_currPlayerResearcher_nonResearcherLocationCard_Base();
    const shareChoicesComponent = root.findAllByType(ShareChoicesComponent);
    expect(shareChoicesComponent).toHaveLength(1);
    checkChoice(shareChoicesComponent, "Take from Player 1 the Lima card");
    checkSockets(mockSocket, 1); // other player is id 1
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

function onShare3Players_Researcher_nonResearcherLocationCard_Base(): ShareChoiceInfo {
  const modifiedTestData = clone(testGame);
  modifiedTestData.game_graph[
    modifiedTestData.game_graph_index["Lima"]
  ].players = [0, 1, 2];
  modifiedTestData.players[2].location = "Lima";
  modifiedTestData.players[0].hand = modifiedTestData.players[0].hand.filter(
    (card) => card !== "Lima"
  );
  modifiedTestData.players[1].hand.push("Lima");
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
      { action: ShareCard.Take, location: null, player_id: 2 },
    ].sort()
  );
  expect(mockSocket.emit.mock.calls).toHaveLength(0);
  return { root, mockSocket, modifiedTestData, instance };
}

function onShare3Players_currPlayerResearcher_nonResearcherLocationCard_Base(): ShareChoiceInfo {
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
  return { root, mockSocket, modifiedTestData, instance };
}

function onShare3Players_Researcher_currPlayerLocationCard_Base(): ShareChoiceInfo {
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
  return { root, mockSocket, modifiedTestData, instance };
}

function onShare2Players_Researcher_currPlayerLocationCard_Base(): ShareChoiceInfo {
  const modifiedTestData = clone(testGame);
  modifiedTestData.game_graph[
    modifiedTestData.game_graph_index["Lima"]
  ].players = [0, 2];
  modifiedTestData.players[1].location = "Beijing";
  modifiedTestData.players[2].location = "Lima";
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
      { action: ShareCard.Give, location: "Lima", player_id: 2 },
      { action: ShareCard.Take, location: null, player_id: 2 },
    ].sort()
  );
  expect(mockSocket.emit.mock.calls).toHaveLength(0);
  return { root, mockSocket, modifiedTestData, instance };
}

function onShare2Players_currPlayerResearcher_noLocationCard_Base(): ShareChoiceInfo {
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
  return { root, mockSocket, modifiedTestData, instance };
}
