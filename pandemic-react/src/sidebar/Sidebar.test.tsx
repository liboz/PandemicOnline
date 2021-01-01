import { assertNonString, assertString, setupGameState } from "../testUtil";
import { testGame } from "../data/moveTestData";
import Log from "./Log";
import InfectionDeckFaceup from "./InfectionDeckFaceup";
import Sidebar from "./Sidebar";
import { Client } from "pandemiccommon/dist/out-tsc";
import PlayerDeckDiscard from "./PlayerDeckDiscard";

describe("Sidebar", () => {
  test("all works", () => {
    const { mockSocket, instance, root } = setupGameState(testGame);
    const sidebarComponent = root.findAllByType(Sidebar);
    expect(sidebarComponent).toHaveLength(1);
    expect(sidebarComponent[0].props["showSidebar"]).toBeFalsy();

    // Log
    instance.setSidebarChildren(Log);
    expect(sidebarComponent[0].props["showSidebar"]).toBeTruthy();
    const logComponent = root.findAllByType(Log);
    expect(logComponent).toHaveLength(1);
    const logLis = logComponent[0].findAllByType("li");
    expect(logLis).toHaveLength(testGame.log.length);

    // check reversed
    expect(logLis[0].children[0]).toBe(testGame.log[testGame.log.length - 1]);
    expect(logLis[logLis.length - 1].children[0]).toBe(testGame.log[0]);

    // Infection Deck Faceup
    instance.setSidebarChildren(InfectionDeckFaceup);
    expect(sidebarComponent[0].props["showSidebar"]).toBeTruthy();
    const logComponentAgain = root.findAllByType(Log);
    expect(logComponentAgain).toHaveLength(0);
    const infectionDeckFaceupComponent = root.findAllByType(
      InfectionDeckFaceup
    );

    expect(infectionDeckFaceupComponent).toHaveLength(1);
    const infectionDeckLis = infectionDeckFaceupComponent[0].findAllByType(
      "li"
    );
    expect(infectionDeckLis).toHaveLength(
      testGame.infection_faceup_deck.length
    );

    // check reversed
    assertNonString(infectionDeckLis[0].children[0]);
    assertNonString(infectionDeckLis[0].children[0].children[0]);
    expect(
      infectionDeckLis[0].children[0].children[0].props["style"][
        "backgroundColor"
      ]
    ).toBe(Client.Color.Yellow);
    expect(infectionDeckLis[0].children[1]).toBe(
      testGame.infection_faceup_deck[testGame.infection_faceup_deck.length - 1]
    );

    const infectionDeckLastItemColorIcon =
      infectionDeckLis[infectionDeckLis.length - 1].children[0];
    assertNonString(infectionDeckLastItemColorIcon);
    assertNonString(infectionDeckLastItemColorIcon.children[0]);
    expect(
      infectionDeckLastItemColorIcon.children[0].props["style"][
        "backgroundColor"
      ]
    ).toBe(Client.Color.Blue);
    expect(infectionDeckLis[infectionDeckLis.length - 1].children[1]).toBe(
      testGame.infection_faceup_deck[0]
    );

    // PlayerDeckDiscard
    instance.setSidebarChildren(PlayerDeckDiscard);
    expect(sidebarComponent[0].props["showSidebar"]).toBeTruthy();
    const infectionDeckFaceupComponentAgain = root.findAllByType(
      InfectionDeckFaceup
    );
    expect(infectionDeckFaceupComponentAgain).toHaveLength(0);
    const playerDeckDiscardComponent = root.findAllByType(PlayerDeckDiscard);

    expect(playerDeckDiscardComponent).toHaveLength(1);
    const playerDeckDiscardLis = playerDeckDiscardComponent[0].findAllByType(
      "li"
    );
    expect(playerDeckDiscardLis).toHaveLength(
      testGame.player_deck_discard.length
    );

    // check reversed
    assertNonString(playerDeckDiscardLis[0].children[0]);
    assertNonString(playerDeckDiscardLis[0].children[0].children[0]);
    expect(
      playerDeckDiscardLis[0].children[0].children[0].props["style"][
        "backgroundColor"
      ]
    ).toBe(Client.Color.Red);
    expect(playerDeckDiscardLis[0].children[1]).toBe(
      testGame.player_deck_discard[testGame.player_deck_discard.length - 1]
    );

    const playerDeckLastItemColorIcon =
      playerDeckDiscardLis[playerDeckDiscardLis.length - 1].children[0];
    assertNonString(playerDeckLastItemColorIcon);
    assertNonString(playerDeckLastItemColorIcon.children[0]);

    expect(
      playerDeckLastItemColorIcon.children[0].props["style"]["backgroundColor"]
    ).toBe(Client.Color.Black);
    expect(
      playerDeckDiscardLis[playerDeckDiscardLis.length - 1].children[1]
    ).toBe(testGame.player_deck_discard[0]);

    // check epidemic
    expect(playerDeckDiscardLis[1].children).toHaveLength(1);
    assertString(playerDeckDiscardLis[1].children[0]);
    expect(playerDeckDiscardLis[1].children[0]).toBe(
      testGame.player_deck_discard[1]
    );

    instance.hideSidebar();
    expect(sidebarComponent[0].props["showSidebar"]).toBeFalsy();
  });
});
