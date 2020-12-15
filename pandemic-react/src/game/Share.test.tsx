import { setupGameState } from "../testUtil";
import { Client } from "pandemiccommon/dist/out-tsc";
import { testGame } from "../data/testData";
import rfdc from "rfdc";
import { ShareCard } from "./withGameState";
import { ShareReseacherComponent } from "../share/ShareResearcherComponent";
const clone = rfdc();

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
      ShareReseacherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    const shareResearcherComponentFull = (shareResearcherComponent[0] as any) as ShareReseacherComponent;
    expect(shareResearcherComponentFull.props.hand).toBe(
      modifiedTestData.players[2].hand
    );
    expect(shareResearcherComponentFull.props.curr_player_index).toBe(0);
    expect(shareResearcherComponentFull.props.target_player_index).toBe(2);
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
      ShareReseacherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    const shareResearcherComponentFull = (shareResearcherComponent[0] as any) as ShareReseacherComponent;
    expect(shareResearcherComponentFull.props.hand).toBe(
      modifiedTestData.players[2].hand
    );
    expect(shareResearcherComponentFull.props.curr_player_index).toBe(2);
    expect(shareResearcherComponentFull.props.target_player_index).toBe(0);
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
      ShareReseacherComponent
    );
    expect(shareResearcherComponent).toHaveLength(1);
    const shareResearcherComponentFull = (shareResearcherComponent[0] as any) as ShareReseacherComponent;
    expect(shareResearcherComponentFull.props.hand).toBe(
      modifiedTestData.players[2].hand
    );
    expect(shareResearcherComponentFull.props.curr_player_index).toBe(0);
    expect(shareResearcherComponentFull.props.target_player_index).toBe(2);
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

  test("onShare works with 3 players with 1 researcher, 1 non-research with the location card", () => {
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
  });
});
