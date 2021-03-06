import { Cities } from "../data/cities";
import { Game } from "../game";
import { InfectionDeck } from "../infection_deck";
import { PlayerJSON } from "../player";
import { PlayerDeck } from "../player_deck";
import { Client } from "pandemiccommon/dist/out-tsc";
import { canUseEventCard, handleEventCard } from "../event_cards";
const seedrandom = require("seedrandom");

describe("City", function () {
  describe("#Infect", function () {
    it("Increases the counter of cubes based on color", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      const chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 3; i++) {
        expect(chennai.infect(g)).toBe(true);
        expect(chennai.cubes[Client.Color.Blue]).toBe(0);
        expect(chennai.cubes[Client.Color.Red]).toBe(0);
        expect(chennai.cubes[Client.Color.Black]).toBe(i + 1);
        expect(chennai.cubes[Client.Color.Yellow]).toBe(0);
      }
    });
  });

  describe("#Infect", function () {
    it("Medic Prevents Infect After Cure Discovered", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.Medic, Client.Roles.Researcher]
      );

      const atlanta = g.game_graph["Atlanta"];
      expect(atlanta.cubes[Client.Color.Blue]).toBe(0);
      expect(atlanta.infect(g)).toBe(true);
      expect(atlanta.cubes[Client.Color.Blue]).toBe(1);

      g.cured[Client.Color.Blue] = 1;

      expect(g.players[0].move(g, "Washington")).toBe(true);
      const washington = g.game_graph["Washington"];
      expect(washington.cubes[Client.Color.Blue]).toBe(0);
      expect(washington.infect(g)).toBe(true);
      expect(washington.cubes[Client.Color.Blue]).toBe(0);

      g.cured[Client.Color.Blue] = 1; // washington triggers eradicate
      expect(atlanta.cubes[Client.Color.Blue]).toBe(0);
      expect(atlanta.infect(g)).toBe(true);
      expect(atlanta.cubes[Client.Color.Blue]).toBe(1);
    });
  });

  describe("#Infect", function () {
    it("Quarantine Specialist Prevents Infect in Nearby Cities", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.QuarantineSpecialist, Client.Roles.Researcher],
        5,
        seeded
      );

      const atlanta = g.game_graph["Atlanta"];
      expect(atlanta.cubes[Client.Color.Blue]).toBe(0);
      expect(atlanta.infect(g)).toBe(true);
      expect(atlanta.cubes[Client.Color.Blue]).toBe(0);

      const washington = g.game_graph["Washington"];
      expect(washington.cubes[Client.Color.Blue]).toBe(0);
      expect(washington.infect(g)).toBe(true);
      expect(washington.cubes[Client.Color.Blue]).toBe(0);

      const chicago = g.game_graph["Chicago"];
      expect(chicago.cubes[Client.Color.Blue]).toBe(0);
      expect(chicago.infect(g)).toBe(true);
      expect(chicago.cubes[Client.Color.Blue]).toBe(0);

      g.players[0].move(g, "Miami");
      //g.players[0].move(g, 'Bogota')
      const saopaulo = g.game_graph["Sao Paulo"];
      g.epidemic(); // Sao Paulo
      expect(saopaulo.cubes[Client.Color.Yellow]).toBe(3);

      g.infect_stage(); // Sao Paulo
      const bogota = g.game_graph["Bogota"];
      expect(bogota.cubes[Client.Color.Yellow]).toBe(0);
    });
  });

  describe("#Infect", function () {
    it("Quarantine Specialist Does Nothing in Initialization", function () {
      const seeded = seedrandom("5"); // initial infection contains Atlanta
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.QuarantineSpecialist, Client.Roles.Researcher],
        5,
        seeded
      );

      g.initialize_board();
      const infected = [
        "London",
        "Sao Paulo",
        "Tokyo",
        "Atlanta",
        "Hong Kong",
        "Manila",
        "Moscow",
        "New York",
        "Bangkok",
      ].reverse();
      expect(g.infection_deck.faceup_deck).toEqual(infected);
      for (let i = 0; i < infected.length; i++) {
        const cube_count = 3 - Math.trunc(i / 3);
        const c = g.game_graph[infected[i]];
        expect(c.cubes[c.color]).toBe(cube_count);
      }
    });
  });

  describe("#Infect", function () {
    it("No Infect when Eradicated", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      const chennai = g.game_graph["Chennai"];
      g.cured[Client.Color.Black] = 2;
      for (let i = 0; i < 3; i++) {
        expect(chennai.infect(g)).toBe(true);
        expect(chennai.cubes[Client.Color.Blue]).toBe(0);
        expect(chennai.cubes[Client.Color.Red]).toBe(0);
        expect(chennai.cubes[Client.Color.Black]).toBe(0);
        expect(chennai.cubes[Client.Color.Yellow]).toBe(0);
      }
    });
  });

  describe("#Infect", function () {
    it("Epidemic", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      const chennai = g.game_graph["Chennai"];

      for (let i = 0; i < 3; i++) {
        chennai.infect_epidemic(g);
        expect(chennai.cubes[Client.Color.Blue]).toBe(0);
        expect(chennai.cubes[Client.Color.Red]).toBe(0);
        expect(chennai.cubes[Client.Color.Black]).toBe(3);
        expect(chennai.cubes[Client.Color.Yellow]).toBe(0);
      }
    });
  });

  describe("#ChainReaction", function () {
    it("Create Chain Infection", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      const chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 4; i++) {
        chennai.infect(g);
      }
      expect(chennai.cubes["black"]).toBe(3);
      chennai.neighbors.forEach((neighbor) => {
        expect(neighbor.cubes[Client.Color.Blue]).toBe(0);
        expect(neighbor.cubes[Client.Color.Red]).toBe(0);
        expect(neighbor.cubes[Client.Color.Black]).toBe(1);
        expect(neighbor.cubes[Client.Color.Yellow]).toBe(0);
      });

      const bangkok = g.game_graph["Bangkok"];
      for (let i = 0; i < 4; i++) {
        bangkok.infect(g);
      }
      bangkok.neighbors.forEach((neighbor) => {
        expect(neighbor.cubes[Client.Color.Red]).toBe(1);
      });

      const kolkata = g.game_graph["Kolkata"];
      expect(kolkata.cubes[Client.Color.Red]).toBe(1);
      expect(kolkata.cubes["black"]).toBe(1);
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g);
      }

      expect(kolkata.cubes[Client.Color.Red]).toBe(1);
      expect(kolkata.cubes[Client.Color.Black]).toBe(3);

      chennai.neighbors.forEach((neighbor) => {
        if (neighbor === kolkata || kolkata.neighbors.has(neighbor)) {
          expect(neighbor.cubes[Client.Color.Black]).toBe(3);
        } else {
          expect(neighbor.cubes[Client.Color.Black]).toBe(2);
        }
      });

      kolkata.neighbors.forEach((neighbor) => {
        if (neighbor === chennai || chennai.neighbors.has(neighbor)) {
          expect(neighbor.cubes[Client.Color.Black]).toBe(3);
        } else {
          expect(neighbor.cubes[Client.Color.Black]).toBe(1);
        }
      });

      bangkok.neighbors.forEach((neighbor) => {
        expect(neighbor.cubes[Client.Color.Red]).toBe(1);
      });
    });
  });

  describe("#ChainReaction", function () {
    it("Outbreak Counter Multiple Chains", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      const chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 3; i++) {
        chennai.infect(g);
      }

      const kolkata = g.game_graph["Kolkata"];
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g);
      }
      expect(g.outbreak_counter).toBe(0);
      chennai.infect(g);
      expect(g.outbreak_counter).toBe(2);

      kolkata.infect(g);
      expect(g.outbreak_counter).toBe(6);
    });
  });

  describe("#ChainReaction", function () {
    it("Outbreak Counter Multiple Chains No Infinite", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      const chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 3; i++) {
        chennai.infect(g);
      }

      const kolkata = g.game_graph["Kolkata"];
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g);
      }
      expect(g.outbreak_counter).toBe(0);
      chennai.infect(g);
      expect(g.outbreak_counter).toBe(2);
      const delhi = g.game_graph["Delhi"];
      delhi.infect(g);
      kolkata.infect(g);
      expect(g.outbreak_counter).toBe(6);
    });
  });

  describe("#ChainReaction", function () {
    it("Outbreak Counter One Chain", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      const tokyo = g.game_graph["Taipei"];
      for (let i = 0; i < 3; i++) {
        tokyo.infect(g);
      }

      const osaka = g.game_graph["Osaka"];
      for (let i = 0; i < 3; i++) {
        osaka.infect(g);
      }
      expect(g.outbreak_counter).toBe(0);
      tokyo.infect(g);
      expect(g.outbreak_counter).toBe(2);

      osaka.infect(g);
      expect(g.outbreak_counter).toBe(4);
    });
  });
});

describe("Data Integrity", function () {
  describe("#CityNumber", function () {
    it("Is 48", function () {
      expect(Cities.length).toBe(48);
    });
  });
});

describe("Infection Deck", function () {
  describe("#Random", function () {
    it("Shuffles", function () {
      const seeded = seedrandom("test!");
      const i = new InfectionDeck(Cities, seeded);
      expect(i.facedown_deck.length).toBe(48);
      expect(i.facedown_deck.toArray()).toEqual([
        "Sao Paulo",
        "Buenos Aires",
        "Sydney",
        "Tehran",
        "Khartoum",
        "Los Angeles",
        "Atlanta",
        "Seoul",
        "Johannesburg",
        "Washington",
        "Chicago",
        "Lagos",
        "Miami",
        "Kinshasa",
        "Chennai",
        "Paris",
        "Algiers",
        "Mumbai",
        "Osaka",
        "Santiago",
        "Lima",
        "Kolkata",
        "Istanbul",
        "Cairo",
        "Bogota",
        "Baghdad",
        "St Petersburg",
        "Moscow",
        "Riyadh",
        "Shanghai",
        "Bangkok",
        "Mexico City",
        "Beijing",
        "Essen",
        "Milan",
        "San Francisco",
        "Jakarta",
        "Montreal",
        "Hong Kong",
        "Madrid",
        "New York",
        "Delhi",
        "Ho Chi Minh City",
        "Manila",
        "Taipei",
        "Karachi",
        "London",
        "Tokyo",
      ]);
    });
  });

  describe("#Flip Card", function () {
    it("Gets Top", function () {
      let seeded = seedrandom("test!");
      let i = new InfectionDeck(Cities, seeded);
      expect(i.flip_card()).toBe("Tokyo");
      expect(i.facedown_deck.toArray()).toEqual([
        "Sao Paulo",
        "Buenos Aires",
        "Sydney",
        "Tehran",
        "Khartoum",
        "Los Angeles",
        "Atlanta",
        "Seoul",
        "Johannesburg",
        "Washington",
        "Chicago",
        "Lagos",
        "Miami",
        "Kinshasa",
        "Chennai",
        "Paris",
        "Algiers",
        "Mumbai",
        "Osaka",
        "Santiago",
        "Lima",
        "Kolkata",
        "Istanbul",
        "Cairo",
        "Bogota",
        "Baghdad",
        "St Petersburg",
        "Moscow",
        "Riyadh",
        "Shanghai",
        "Bangkok",
        "Mexico City",
        "Beijing",
        "Essen",
        "Milan",
        "San Francisco",
        "Jakarta",
        "Montreal",
        "Hong Kong",
        "Madrid",
        "New York",
        "Delhi",
        "Ho Chi Minh City",
        "Manila",
        "Taipei",
        "Karachi",
        "London",
      ]);
      expect(i.faceup_deck).toEqual(["Tokyo"]);

      seeded = seedrandom();
      i = new InfectionDeck(Cities, seeded);
      const peek = i.facedown_deck.peekBack();
      expect(i.flip_card()).toBe(peek);
    });
  });

  describe("#Intensify", function () {
    it("Check Top Cards are correct", function () {
      const seeded = seedrandom();
      const i = new InfectionDeck(Cities, seeded);

      for (let j = 0; j < 9; j++) {
        const c = i.facedown_deck.peekBack();
        expect(i.flip_card()).toBe(c);
      }
      const prev_facedown = [...i.facedown_deck.toArray()];
      const prev_faceup = [...i.faceup_deck];
      prev_facedown.sort();
      prev_faceup.sort();
      i.intensify();
      expect(i.facedown_deck.length).toBe(48);
      expect(i.faceup_deck.length).toBe(0);

      const arr_deck = i.facedown_deck.toArray();
      const after_intensify_down = arr_deck.slice(0, 39);
      const after_intensify_up = arr_deck.slice(39);
      after_intensify_down.sort();
      after_intensify_up.sort();
      expect(after_intensify_down).toEqual(prev_facedown);
      expect(after_intensify_up).toEqual(prev_faceup);

      for (let j = 0; j < 9; j++) {
        i.flip_card();
      }

      const reflipped_down = [...i.facedown_deck.toArray()];
      const reflipped_up = [...i.faceup_deck];
      expect(reflipped_down.sort()).toEqual(prev_facedown);
      expect(reflipped_up.sort()).toEqual(prev_faceup);
    });
  });

  describe("#Infect Epidemic", function () {
    it("Check Bottom Card in the faceup_deck ", function () {
      let seeded = seedrandom("test!");
      let i = new InfectionDeck(Cities, seeded);
      expect(i.infect_epidemic()).toBe("Sao Paulo");
      expect(i.facedown_deck.toArray()).toEqual([
        "Buenos Aires",
        "Sydney",
        "Tehran",
        "Khartoum",
        "Los Angeles",
        "Atlanta",
        "Seoul",
        "Johannesburg",
        "Washington",
        "Chicago",
        "Lagos",
        "Miami",
        "Kinshasa",
        "Chennai",
        "Paris",
        "Algiers",
        "Mumbai",
        "Osaka",
        "Santiago",
        "Lima",
        "Kolkata",
        "Istanbul",
        "Cairo",
        "Bogota",
        "Baghdad",
        "St Petersburg",
        "Moscow",
        "Riyadh",
        "Shanghai",
        "Bangkok",
        "Mexico City",
        "Beijing",
        "Essen",
        "Milan",
        "San Francisco",
        "Jakarta",
        "Montreal",
        "Hong Kong",
        "Madrid",
        "New York",
        "Delhi",
        "Ho Chi Minh City",
        "Manila",
        "Taipei",
        "Karachi",
        "London",
        "Tokyo",
      ]);
      expect(i.faceup_deck).toEqual(["Sao Paulo"]);

      seeded = seedrandom();
      i = new InfectionDeck(Cities, seeded);
      const peek = i.facedown_deck.peekFront();
      expect(i.infect_epidemic()).toBe(peek);
    });
  });

  describe("#Big Deck", function () {
    it("Shuffles", function () {
      const seeded = seedrandom("test!");
      const i = new InfectionDeck(Cities, seeded);
      for (let j = 0; j < 16; j++) {
        i.flip_card();
      }
      expect(i.facedown_deck.length).toBe(32);
      expect(i.faceup_deck).toEqual(
        [
          "Beijing",
          "Essen",
          "Milan",
          "San Francisco",
          "Jakarta",
          "Montreal",
          "Hong Kong",
          "Madrid",
          "New York",
          "Delhi",
          "Ho Chi Minh City",
          "Manila",
          "Taipei",
          "Karachi",
          "London",
          "Tokyo",
        ].reverse()
      );
      expect(i.infect_epidemic()).toBe("Sao Paulo");
      expect(i.facedown_deck.length).toBe(31);
      i.intensify();
      expect(i.facedown_deck.splice(0, 31)).toEqual([
        "Buenos Aires",
        "Sydney",
        "Tehran",
        "Khartoum",
        "Los Angeles",
        "Atlanta",
        "Seoul",
        "Johannesburg",
        "Washington",
        "Chicago",
        "Lagos",
        "Miami",
        "Kinshasa",
        "Chennai",
        "Paris",
        "Algiers",
        "Mumbai",
        "Osaka",
        "Santiago",
        "Lima",
        "Kolkata",
        "Istanbul",
        "Cairo",
        "Bogota",
        "Baghdad",
        "St Petersburg",
        "Moscow",
        "Riyadh",
        "Shanghai",
        "Bangkok",
        "Mexico City",
      ]);
      expect(i.facedown_deck.toArray().sort()).toEqual(
        [
          "Beijing",
          "Essen",
          "Milan",
          "San Francisco",
          "Jakarta",
          "Montreal",
          "Hong Kong",
          "Madrid",
          "New York",
          "Delhi",
          "Ho Chi Minh City",
          "Manila",
          "Taipei",
          "Karachi",
          "London",
          "Tokyo",
          "Sao Paulo",
        ].sort()
      );
    });
  });
});

describe("Player Deck", function () {
  describe("#Partition", function () {
    it("Partitions Deck Correctly", function () {
      const seeded = seedrandom();
      let partitions = new PlayerDeck(Cities, [], 6, seeded).partitions;
      expect(partitions.length).toBe(6);
      partitions.forEach((p) => {
        expect(p.length).toBe(9);
        expect(p.filter((c) => c === "Epidemic").length).toBe(1);
      });

      partitions = new PlayerDeck(Cities, [], 5, seeded).partitions;
      expect(partitions.length).toBe(5);
      const d: Record<number, number> = {};
      partitions.forEach((p) => {
        if (p.length in d) {
          d[p.length] += 1;
        } else {
          d[p.length] = 1;
        }
        expect(p.filter((c) => c === "Epidemic").length).toBe(1);
      });
      expect(d).toEqual({ 10: 4, 13: 1 });
    });
  });

  describe("#Partition", function () {
    it("Hand Size Is Correct", function () {
      const seeded = seedrandom();
      let g = new Game(
        Cities,
        3,
        ["test", "test", "test"],
        [
          Client.Roles.ContingencyPlanner,
          Client.Roles.Researcher,
          Client.Roles.Scientist,
        ],
        5,
        seeded
      );

      g.players.forEach((i) => expect(i.hand.size).toBe(3));

      g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );

      g.players.forEach((i) => expect(i.hand.size).toBe(4));
    });
  });
});

describe("Game", function () {
  describe("#Epidemic", function () {
    it("Intensifies", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.infection_rate_index).toBe(0);
      expect(g.game_graph["Sao Paulo"].cubes[Client.Color.Yellow]).toBe(0);
      expect(g.game_graph["Buenos Aires"].cubes[Client.Color.Yellow]).toBe(0);
      expect(g.infection_deck.facedown_deck.peekFront()).toBe("Sao Paulo");
      g.epidemic();
      expect(g.infection_rate_index).toBe(1);
      expect(g.game_graph["Sao Paulo"].cubes[Client.Color.Yellow]).toBe(3);
      expect(g.game_graph["Buenos Aires"].cubes[Client.Color.Yellow]).toBe(0);
      expect(g.infection_deck.facedown_deck.peekBack()).toBe("Sao Paulo");
      g.epidemic();
      expect(g.infection_rate_index).toBe(2);
      expect(g.game_graph["Sao Paulo"].cubes[Client.Color.Yellow]).toBe(3);
      expect(g.game_graph["Buenos Aires"].cubes[Client.Color.Yellow]).toBe(3);
      expect(g.infection_deck.facedown_deck.peekAt(-2)).toBe("Sao Paulo");
      expect(g.infection_deck.facedown_deck.peekBack()).toBe("Buenos Aires");
    });
  });

  describe("#Epidemic", function () {
    it("No Epidemic Cubes when Disease Eradicated", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.cured[Client.Color.Yellow] = 2;
      g.epidemic();
      expect(g.infection_rate_index).toBe(1);
      expect(g.game_graph["Sao Paulo"].cubes[Client.Color.Yellow]).toBe(0);
    });
  });

  describe("#Initialize Board", function () {
    it("Right Number of Cubes ", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.game_state).toBe(Client.GameState.NotStarted);
      for (let i = 0; i < 2; i++) {
        // running initialize_board twice does nothing
        g.initialize_board();
        expect(g.game_state).toBe(Client.GameState.Ready);
        expect(g.outbreak_counter).toBe(0);
        const infected = [
          "Madrid",
          "New York",
          "Delhi",
          "Ho Chi Minh City",
          "Manila",
          "Taipei",
          "Karachi",
          "London",
          "Tokyo",
        ].reverse();
        expect(g.infection_deck.faceup_deck).toEqual(infected);
        for (let i = 0; i < infected.length; i++) {
          const cube_count = 3 - Math.trunc(i / 3);
          const c = g.game_graph[infected[i]];
          expect(c.cubes[c.color]).toBe(cube_count);
        }
      }
    });
  });

  describe("#Infect Stage", function () {
    it("Check Right number of cards ", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.cured[Client.Color.Red] = 2; //eradicate all the diseases so we dont have to deal with outbreak counter
      g.cured[Client.Color.Black] = 2;
      g.cured[Client.Color.Blue] = 2;
      g.cured[Client.Color.Yellow] = 2;
      for (let i = 0; i < 6; i++) {
        g.infect_stage();
        expect(g.infection_deck.faceup_deck.length).toBe(g.infection_rate[i]);
        g.epidemic();
      }
    });
  });

  describe("#Outbreak", function () {
    it("over 8 ends game ", function () {
      const seeded = seedrandom("test33!"); // want exactly 8!
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      for (let i = 0; i < 3; i++) {
        g.infect_stage();
        g.epidemic();
      }
      expect(g.game_state).toBe(Client.GameState.NotStarted);
      g.epidemic();
      g.epidemic();
      g.infect_stage();
      g.infect_stage();
      expect(g.game_state).toBe(Client.GameState.Lost);
    });
  });

  describe("#Run out of Cubes", function () {
    it("Lose game", function () {
      const seeded = seedrandom("test33!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      const chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 3; i++) {
        chennai.infect(g);
      }

      const kolkata = g.game_graph["Kolkata"];
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g);
      }
      chennai.infect(g);
      const delhi = g.game_graph["Delhi"];
      delhi.infect(g);
      kolkata.infect(g);
      expect(g.game_state).toBe(Client.GameState.NotStarted);
      g.infect_stage(); // next card is Tehran
      expect(g.game_state).toBe(Client.GameState.Lost);
    });
  });

  describe("#Run out of Cubes", function () {
    it("Epidemic can lose game", function () {
      const seeded = seedrandom("test33!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      const mexico_city = g.game_graph["Mexico City"];
      for (let i = 0; i < 3; i++) {
        mexico_city.infect(g);
      }

      const miami = g.game_graph["Miami"];
      for (let i = 0; i < 3; i++) {
        miami.infect(g);
      }
      mexico_city.infect(g);
      const bogota = g.game_graph["Bogota"];
      bogota.infect(g);
      miami.infect(g);
      expect(g.game_state).toBe(Client.GameState.NotStarted);
      expect(g.cubes[Client.Color.Yellow]).toBe(2);
      g.epidemic(); // lagos
      expect(g.cubes[Client.Color.Yellow]).toBe(-1);
      expect(g.game_state).toBe(Client.GameState.Lost);
    });
  });

  describe("#Next Player", function () {
    it("loops", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      g.players.forEach((p, index) => {
        expect(g.player_index).toBe(index);
        g.next_player();
      });
      expect(g.player_index).toBe(0);
    });
  });

  describe("#Turns", function () {
    it("stops when at 0", function () {
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      expect(g.turns_left).toBe(4);
      expect(g.decrement_turn()).toBe(true);
      expect(g.turns_left).toBe(3);
      expect(g.decrement_turn()).toBe(true);
      expect(g.turns_left).toBe(2);
      expect(g.decrement_turn()).toBe(true);
      expect(g.turns_left).toBe(1);
      expect(g.decrement_turn()).toBe(false);
      expect(g.turns_left).toBe(0);
      expect(g.decrement_turn()).toBe(false);
      expect(g.turns_left).toBe(0);
    });
  });

  describe("#Turns", function () {
    it("pass Turns", function () {
      let g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      g.pass_turn();
      expect(g.turns_left).toBe(0);

      g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      g.decrement_turn();
      expect(g.turns_left).toBe(3);
      g.pass_turn();
      expect(g.turns_left).toBe(0);

      g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      g.decrement_turn();
      g.decrement_turn();
      expect(g.turns_left).toBe(2);
      g.pass_turn();
      expect(g.turns_left).toBe(0);

      g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      g.decrement_turn();
      g.decrement_turn();
      g.decrement_turn();
      expect(g.turns_left).toBe(1);
      g.pass_turn();
      expect(g.turns_left).toBe(0);

      g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher]
      );
      g.decrement_turn();
      g.decrement_turn();
      g.decrement_turn();
      g.decrement_turn();
      expect(g.turns_left).toBe(0);
      g.pass_turn();
      expect(g.turns_left).toBe(0);
    });
  });
});

describe("Player", function () {
  describe("#Movement", function () {
    it("Drive/Ferry", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.players[0].move(g, "Chicago")).toBe(true);
      expect(g.players[0].location).toBe("Chicago");
      expect(g.game_graph["Chicago"].players.has(g.players[0])).toBe(true);

      expect(g.players[0].move(g, "New York")).toBe(false);
      expect(g.players[0].location).toBe("Chicago");
      expect(g.game_graph["Chicago"].players.has(g.players[0])).toBe(true);

      expect(g.players[0].move(g, "San Francisco")).toBe(true);
      expect(g.players[0].location).toBe("San Francisco");
      expect(g.game_graph["San Francisco"].players.has(g.players[0])).toBe(
        true
      );

      expect(g.players[0].move(g, "Tokyo")).toBe(true);
      expect(g.players[0].location).toBe("Tokyo");
      expect(g.game_graph["Tokyo"].players.has(g.players[0])).toBe(true);

      expect(g.players[0].move(g, "Atlanta")).toBe(false);
      expect(g.players[0].location).toBe("Tokyo");
      expect(g.game_graph["Tokyo"].players.has(g.players[0])).toBe(true);
    });

    it("Charter/Direct", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].draw(g); // first card is epidemic, ignore
      const originalHand = [...g.players[0].hand];
      g.players[0].discard(g, [...g.players[0].hand]);
      expect(g.player_deck.discard).toStrictEqual(originalHand);
      expect(g.players[0].canDirectFlight("Beijing")).toBe(false);
      expect(g.players[0].move(g, "Beijing")).toBe(false);
      expect(g.players[0].location).toBe("Atlanta");
      g.players[0].draw(g);
      g.players[0].draw(g);

      //Direct Flight
      expect(g.players[0].canDirectFlight("Milan")).toBe(true);
      expect(g.players[0].hand.has("Milan")).toBe(true);
      expect(g.players[0].move(g, "Milan")).toBe(true);
      expect(g.players[0].location).toBe("Milan");
      expect(g.game_graph["Milan"].players.has(g.players[0])).toBe(true);
      expect(g.players[0].hand.has("Milan")).toBe(false);
      expect(g.player_deck.discard).toStrictEqual([...originalHand, "Milan"]);
      g.players[0].draw(g);
      g.players[0].draw(g);

      //Drive/Ferry
      expect(g.players[0].hand.has("Essen")).toBe(false);
      expect(g.players[0].move(g, "Essen")).toBe(true);
      expect(g.players[0].location).toBe("Essen");
      expect(g.game_graph["Essen"].players.has(g.players[0])).toBe(true);
      expect(g.players[0].hand.has("Essen")).toBe(false);

      expect(g.players[0].hand.has("St Petersburg")).toBe(true);
      expect(g.players[0].move(g, "St Petersburg")).toBe(true);
      expect(g.players[0].location).toBe("St Petersburg");
      expect(g.game_graph["St Petersburg"].players.has(g.players[0])).toBe(
        true
      );

      //Charter
      expect(g.players[0].canCharterFlight()).toBe(true);
      expect(g.players[0].hand.has("St Petersburg")).toBe(true);
      expect(g.players[0].hand.has("Tokyo")).toBe(false);
      expect(g.players[0].move(g, "Tokyo")).toBe(true);
      expect(g.players[0].location).toBe("Tokyo");
      expect(g.game_graph["Tokyo"].players.has(g.players[0])).toBe(true);
      expect(g.players[0].hand.has("St Petersburg")).toBe(false);
      expect(g.player_deck.discard).toStrictEqual([
        ...originalHand,
        "Milan",
        "St Petersburg",
      ]);
    });

    it("Movable Locations", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.OperationsExpert],
        5,
        seeded
      );
      const all_locations = [...Array(48).keys()].sort();
      let valid_final_destinations = g.players[0]
        .get_valid_final_destinations(g)
        .sort();
      expect(valid_final_destinations).toEqual([]); // game not started
      g.initialize_board();

      valid_final_destinations = g.players[0]
        .get_valid_final_destinations(g)
        .sort();
      expect(valid_final_destinations).toEqual(
        ["Chicago", "Washington", "Miami", "Kolkata", "Mumbai", "Johannesburg"]
          .map((i) => g.game_graph[i].index)
          .sort()
      );

      g.players[0].draw(g);
      g.players[0].move(g, "Miami");
      g.players[0].move(g, "Bogota");
      g.players[0].move(g, "Sao Paulo");
      g.players[0].move(g, "Lagos");
      g.players[0].move(g, "Kinshasa");
      g.players[0].move(g, "Johannesburg");
      expect(g.players[0].hand.has("Johannesburg")).toBe(true);
      valid_final_destinations = g.players[0]
        .get_valid_final_destinations(g)
        .sort(); // all locations with a charter
      expect(valid_final_destinations).toEqual(all_locations);

      expect(g.players[0].can_build_research_station(g)).toBe(true);
      expect(g.game_graph["Johannesburg"].hasResearchStation).toEqual(false);
      g.players[0].build_research_station(g);
      expect(g.player_deck.discard).toStrictEqual(["Johannesburg"]);

      valid_final_destinations = g.players[0]
        .get_valid_final_destinations(g)
        .sort();
      expect(valid_final_destinations).toEqual(
        ["Kinshasa", "Khartoum", "Kolkata", "Mumbai", "Atlanta"]
          .map((i) => g.game_graph[i].index)
          .sort()
      ); // adjacent + direct flight + shuttle flight

      let valid_final_destinations_player2 = g.players[1]
        .get_valid_final_destinations(g)
        .sort();
      expect(valid_final_destinations_player2).toEqual(all_locations); //operations expert in a research station

      g.players[1].move(g, "Washington");
      valid_final_destinations_player2 = g.players[1]
        .get_valid_final_destinations(g)
        .sort();

      expect(valid_final_destinations_player2).toEqual(
        [
          "Atlanta",
          "New York",
          "Montreal",
          "Miami",
          "Taipei",
          "Chicago",
          "Seoul",
          "Tokyo",
        ]
          .map((i) => g.game_graph[i].index)
          .sort()
      ); // adjacent + direct flight
    });

    it("Medic Treats When Moving If Cure Has been Discovered", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.Medic, Client.Roles.Researcher],
        5,
        seeded
      );

      g.initialize_board();
      g.cured[Client.Color.Blue] = 1;
      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");
      expect(g.game_graph["London"].cubes[Client.Color.Blue]).toBe(3);
      g.players[0].move(g, "London");
      expect(g.players[0].can_treat(g)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Blue)).toBe(false);
      expect(g.game_graph["London"].cubes[Client.Color.Blue]).toBe(0);

      g.cured[Client.Color.Black] = 1;
      g.players[0].move(g, "Kolkata");
      expect(g.game_graph["Delhi"].cubes[Client.Color.Black]).toBe(1);
      g.players[0].move(g, "Delhi");
      expect(g.players[0].can_treat(g)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Black)).toBe(false);
      expect(g.game_graph["Delhi"].cubes[Client.Color.Black]).toBe(0);

      expect(g.game_graph["Karachi"].cubes[Client.Color.Black]).toBe(3);
      g.players[0].move(g, "Karachi");
      expect(g.players[0].can_treat(g)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Black)).toBe(false);
      expect(g.game_graph["Karachi"].cubes[Client.Color.Black]).toBe(0);
    });
  });

  describe("#Dispatcher Movement", function () {
    it("Dispatcher Move", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.Dispatcher, Client.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].draw(g); // first card is epidemic, ignore
      const originalHand = [...g.players[0].hand];
      g.players[0].discard(g, [...g.players[0].hand]);
      expect(g.players[1].location).toBe("Atlanta"); // moving player 1 with player 0
      g.players[0].draw(g);
      g.players[0].draw(g);

      //Direct Flight
      expect(g.players[1].canDirectFlight("Milan")).toBe(false); //can't direct fly normally
      expect(g.players[1].canDirectFlight("Milan", g.players[0].hand)).toBe(
        true
      );
      expect(g.players[0].hand.has("Milan")).toBe(true);
      expect(g.players[0].dispatcher_move(g, g.players[1], "Milan")).toBe(true);
      expect(g.players[1].location).toBe("Milan");
      expect(g.game_graph["Milan"].players.has(g.players[1])).toBe(true);
      expect(g.players[0].hand.has("Milan")).toBe(false);
      expect(g.player_deck.discard).toStrictEqual([...originalHand, "Milan"]);
      g.players[0].draw(g);
      g.players[0].draw(g);

      //Drive/Ferry
      expect(g.players[0].hand.has("Essen")).toBe(false);
      expect(g.players[0].dispatcher_move(g, g.players[1], "Essen")).toBe(true);
      expect(g.players[1].location).toBe("Essen");
      expect(g.game_graph["Essen"].players.has(g.players[1])).toBe(true);
      expect(g.players[0].hand.has("Essen")).toBe(false);

      expect(g.players[0].hand.has("St Petersburg")).toBe(true);
      expect(
        g.players[0].dispatcher_move(g, g.players[1], "St Petersburg")
      ).toBe(true);
      expect(g.players[1].location).toBe("St Petersburg");
      expect(g.game_graph["St Petersburg"].players.has(g.players[1])).toBe(
        true
      );

      //Charter
      expect(g.players[1].canCharterFlight()).toBe(false); // can't charter normally
      expect(g.players[1].canCharterFlight(g.players[0].hand)).toBe(true);
      expect(g.players[0].hand.has("St Petersburg")).toBe(true);
      expect(g.players[0].hand.has("Tokyo")).toBe(false);
      expect(g.players[0].dispatcher_move(g, g.players[1], "Tokyo")).toBe(true);
      expect(g.players[1].location).toBe("Tokyo");
      expect(g.game_graph["Tokyo"].players.has(g.players[1])).toBe(true);
      expect(g.players[0].hand.has("St Petersburg")).toBe(false);
      expect(g.player_deck.discard).toStrictEqual([
        ...originalHand,
        "Milan",
        "St Petersburg",
      ]);

      expect(g.players[1].dispatcher_move(g, g.players[0], "Chicago")).toBe(
        false
      ); //p1 isnt a dispatcher
      expect(g.players[0].move(g, "Chicago")).toBe(true);

      expect(g.players[0].move(g, "Tokyo")).toBe(true); // can move self to other player

      expect(g.players[0].dispatcher_move(g, g.players[1], "Osaka")).toBe(true);
      expect(g.players[0].dispatcher_move(g, g.players[1], "Taipei")).toBe(
        true
      );

      g.players[0].hand.add("Tokyo");
      expect(g.players[0].hand.has("Tokyo")).toBe(true);
      // can move other player to self, but it does not use a card
      expect(g.players[0].dispatcher_move(g, g.players[1], "Tokyo")).toBe(true);
      expect(g.players[0].hand.has("Tokyo")).toBe(true);
    });

    it("Dispatcher standard move take priority", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.Dispatcher, Client.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].draw(g); // first card is epidemic, ignore
      const originalHand = [...g.players[0].hand];
      g.players[0].discard(g, [...g.players[0].hand]);
      expect(g.players[1].location).toBe("Atlanta"); // moving player 1 with player 0
      g.players[0].draw(g);
      g.players[0].draw(g);
      expect(g.players[0].hand.has("Milan")).toBe(true);

      //Take priority over direct flight
      expect(g.players[0].dispatcher_move(g, g.players[1], "Washington")).toBe(
        true
      );
      expect(g.players[0].dispatcher_move(g, g.players[1], "New York")).toBe(
        true
      );
      expect(g.players[0].dispatcher_move(g, g.players[1], "Madrid")).toBe(
        true
      );
      expect(g.players[0].dispatcher_move(g, g.players[1], "Paris")).toBe(true);
      expect(g.players[0].dispatcher_move(g, g.players[1], "Milan")).toBe(true);
      expect(g.players[1].location).toBe("Milan");
      expect(g.game_graph["Milan"].players.has(g.players[1])).toBe(true);

      // dispatcher can move to milan without discarding
      expect(g.players[0].location).toBe("Atlanta");
      expect(g.players[0].move(g, "Milan")).toBe(true);
      expect(g.players[0].hand.has("Milan")).toBe(true);
      expect(g.player_deck.discard).toStrictEqual([...originalHand]);
      expect(g.players[0].location).toBe("Milan");
    });

    it("Dispatcher Medic Treats when moving after cured", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.Medic, Client.Roles.Dispatcher],
        5,
        seeded
      );

      g.initialize_board();
      g.cured[Client.Color.Blue] = 1;
      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");
      expect(g.game_graph["London"].cubes[Client.Color.Blue]).toBe(3);
      expect(g.players[1].dispatcher_move(g, g.players[0], "London")).toBe(
        true
      );

      expect(g.players[0].can_treat(g)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Blue)).toBe(false);
      expect(g.game_graph["London"].cubes[Client.Color.Blue]).toBe(0);

      g.cured[Client.Color.Red] = 1;
      expect(g.players[1].dispatcher_move(g, g.players[0], "Seoul")).toBe(true);

      expect(g.players[1].dispatcher_move(g, g.players[0], "Shanghai")).toBe(
        true
      );
      expect(g.players[1].dispatcher_move(g, g.players[0], "Hong Kong")).toBe(
        true
      );
      expect(g.game_graph["Ho Chi Minh City"].cubes[Client.Color.Red]).toBe(2);
      expect(
        g.players[1].dispatcher_move(g, g.players[0], "Ho Chi Minh City")
      ).toBe(true);
      expect(g.players[0].can_treat(g)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Red)).toBe(false);
      expect(g.game_graph["Ho Chi Minh City"].cubes[Client.Color.Red]).toBe(0);
    });

    it("Dispatcher Move Locations", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        3,
        ["test", "test"],
        [
          Client.Roles.ContingencyPlanner,
          Client.Roles.OperationsExpert,
          Client.Roles.Dispatcher,
        ],
        5,
        seeded
      );
      const all_locations = [...Array(48).keys()].sort();
      let valid_final_destinations = g.players[2].get_valid_dispatcher_final_destinations(
        g
      );
      expect(valid_final_destinations).toEqual({}); // game not started
      g.initialize_board();

      valid_final_destinations = g.players[2].get_valid_dispatcher_final_destinations(
        g
      );

      expect(valid_final_destinations[0].sort()).toEqual(
        ["Chicago", "Washington", "Miami", "Mumbai", "Seoul", "Hong Kong"]
          .map((i) => g.game_graph[i].index)
          .sort()
      );

      g.players[0].move(g, "Chicago");
      g.players[0].move(g, "San Francisco");
      g.players[0].move(g, "Tokyo");
      g.players[0].move(g, "Seoul");

      valid_final_destinations = g.players[2].get_valid_dispatcher_final_destinations(
        g
      );
      expect(valid_final_destinations[0].sort()).toEqual(all_locations);

      expect(valid_final_destinations[1].sort()).toEqual(
        ["Chicago", "Washington", "Miami", "Mumbai", "Seoul", "Hong Kong"]
          .map((i) => g.game_graph[i].index)
          .sort()
      ); // operations expert move not usable

      expect(
        g.players[2]
          .get_valid_final_destinations(g)
          .includes(g.game_graph["Beijing"].index)
      ).toBeFalsy();

      g.players[0].move(g, "Beijing");
      g.players[2].move(g, "Chicago");
      g.players[2].move(g, "San Francisco");

      valid_final_destinations = g.players[2].get_valid_dispatcher_final_destinations(
        g
      );
      expect(valid_final_destinations[1].sort()).toEqual(
        [
          "Chicago",
          "Washington",
          "Miami",
          "Mumbai",
          "Seoul",
          "Hong Kong",
          "San Francisco",
          "Beijing",
        ]
          .map((i) => g.game_graph[i].index)
          .sort()
      );
      expect(valid_final_destinations[2]).toBeUndefined();

      // self should be able to go to other two tokens
      expect(g.players[2].get_valid_final_destinations(g)).toContain(
        g.game_graph["Beijing"].index
      );
      expect(g.players[2].get_valid_final_destinations(g)).toContain(
        g.game_graph["Atlanta"].index
      );
    });
  });

  describe("#Operations Expert Movement", function () {
    it("Operations Expert Special Move", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.OperationsExpert, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.players[0].canOperationsExpertMove(g)).toBe(true);
      expect(g.players[1].canOperationsExpertMove(g)).toBe(false);

      g.players[0].draw(g); // first card is epidemic, ignore
      const originalHand = [...g.players[0].hand];
      g.players[0].discard(g, [...g.players[0].hand]);
      expect(g.players[0].canOperationsExpertMove(g)).toBe(false);
      g.players[0].draw(g);
      expect(g.players[0].canOperationsExpertMove(g)).toBe(true);
      g.players[0].move(g, "Chicago");
      expect(g.players[0].canOperationsExpertMove(g)).toBe(false);
      g.players[0].move(g, "Atlanta");
      expect(g.players[0].canOperationsExpertMoveWithCard(g, "Atlanta")).toBe(
        false
      );
      expect(g.players[0].canOperationsExpertMoveWithCard(g, "Milan")).toBe(
        true
      );
      g.players[0].operationsExpertMove(g, "Tokyo", "Milan");
      expect(g.player_deck.discard).toStrictEqual([...originalHand, "Milan"]);
      expect(g.players[0].location).toBe("Tokyo");
    });
  });

  describe("#Research Station", function () {
    it("Can Build", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.research_stations).toEqual(new Set(["Atlanta"]));
      expect(g.players[0].can_build_research_station(g)).toBe(false);
      g.players[0].draw(g); // first card is epidemic, ignore
      g.players[0].discard(g, [...g.players[0].hand]);

      g.players[0].draw(g);
      expect(g.players[0].hand).toEqual(new Set(["Milan"]));
      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");
      g.players[0].move(g, "London");
      g.players[0].move(g, "Paris");
      g.players[0].move(g, "Milan");
      expect(g.players[0].hand).toEqual(new Set(["Milan"]));
      expect(g.players[0].can_build_research_station(g)).toBe(true);
      expect(g.game_graph["Milan"].hasResearchStation).toEqual(false);
      g.players[0].build_research_station(g);
      expect(g.players[0].hand).toEqual(new Set());
      expect(g.research_stations).toEqual(new Set(["Atlanta", "Milan"]));
      expect(g.game_graph["Milan"].hasResearchStation).toEqual(true);
      expect(g.players[0].move(g, "Atlanta")).toBe(true);
      expect(g.players[0].move(g, "Milan")).toBe(true);
    });

    it("Can Build anywhere as Operations Expert", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.OperationsExpert, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.research_stations).toEqual(new Set(["Atlanta"]));
      expect(g.players[0].can_build_research_station(g)).toBe(false);
      g.players[0].draw(g); // first card is epidemic, ignore
      g.players[0].discard(g, [...g.players[0].hand]);

      g.players[0].draw(g);
      expect(g.players[0].hand).toEqual(new Set(["Milan"]));
      g.players[0].move(g, "Milan");
      expect(g.players[0].hand).toEqual(new Set());
      expect(g.players[0].can_build_research_station(g)).toBe(true);
      expect(g.game_graph["Milan"].hasResearchStation).toEqual(false);
      g.players[0].build_research_station(g);
      expect(g.research_stations).toEqual(new Set(["Atlanta", "Milan"]));
      expect(g.game_graph["Milan"].hasResearchStation).toEqual(true);
      expect(g.players[0].move(g, "Atlanta")).toBe(true);
      expect(g.players[0].move(g, "Milan")).toBe(true);
    });
  });

  describe("#Draw out the Deck", function () {
    it("Lose Game", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      for (let i = 0; i < 50; i++) {
        // 48 Cities + 5 epidemic + 5 event cards, but start with 8 cards removed with 2 people
        g.players[0].draw(g);
        expect(g.game_state).toBe(Client.GameState.NotStarted);
      }
      g.players[0].draw(g);
      expect(g.game_state).toBe(Client.GameState.Lost);
    });
  });

  describe("#Cure", function () {
    it("Eradicate", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      const originalHand = [...g.players[0].hand];
      g.players[0].discard(g, [...g.players[0].hand]);

      g.players[0].hand.add("Chennai");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].hand.add("Tehran");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].hand.add("Karachi");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].hand.add("Delhi");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].hand.add("Mumbai");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].hand.add("Miami");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false); // submitted too many cards
      g.players[0].move(g, "Miami");
      expect(g.players[0].can_build_research_station(g)).toBe(true);
      g.players[0].build_research_station(g);
      const cureHand = [...g.players[0].hand];
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.player_deck.discard).toStrictEqual([
        ...originalHand,
        "Miami",
        ...cureHand,
      ]);

      expect(g.cured[Client.Color.Black]).toBe(2);

      g.players[0].hand.add("Algiers"); // cant cure already cured
      g.players[0].hand.add("Cairo");
      g.players[0].hand.add("Istanbul");
      g.players[0].hand.add("Moscow");
      g.players[0].hand.add("Baghdad");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
    });
  });

  describe("#Cure", function () {
    it("Scientist with 4 cards", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.Scientist, Client.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard(g, [...g.players[0].hand]);

      g.players[0].hand.add("Chennai");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].hand.add("Tehran");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].hand.add("Karachi");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].hand.add("Delhi");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].hand.add("Miami");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false); // submitted too many cards
      expect(g.players[0].can_hand_cure(g)).toBe(Client.Color.Black);
      g.players[0].move(g, "Miami");
      expect(g.players[0].can_build_research_station(g)).toBe(true);
      g.players[0].build_research_station(g);
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[Client.Color.Black]).toBe(2);

      g.players[0].hand.add("Algiers"); // cant cure already cured
      g.players[0].hand.add("Cairo");
      g.players[0].hand.add("Istanbul");
      g.players[0].hand.add("Moscow");
      g.players[0].hand.add("Baghdad");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
    });
  });

  describe("#Cure", function () {
    it("Can Cure", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard(g, [...g.players[0].hand]);

      g.infect_stage(); // infect tokyo
      g.players[0].hand.add("Tokyo");
      g.players[0].hand.add("Osaka");
      g.players[0].hand.add("Beijing");
      g.players[0].hand.add("Seoul");
      g.players[0].hand.add("Hong Kong");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[Client.Color.Red]).toBe(1);

      g.players[0].hand.add("Algiers");
      g.players[0].hand.add("Cairo");
      g.players[0].hand.add("Istanbul");
      g.players[0].hand.add("Moscow");
      g.players[0].hand.add("Baghdad");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].move(g, "Miami"); // only cure in research station
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].move(g, "Atlanta");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].discard(g, ["Moscow"]);
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].hand.add("Baghdad"); // duplicates and having 5 is no good
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
    });
  });

  describe("#Cure", function () {
    it("Can Hand Cure", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard(g, [...g.players[0].hand]);

      g.infect_stage(); // infect tokyo
      g.players[0].hand.add("Tokyo");
      g.players[0].hand.add("Osaka");
      g.players[0].hand.add("Beijing");
      g.players[0].hand.add("Seoul");
      g.players[0].hand.add("Hong Kong");
      expect(g.players[0].can_hand_cure(g)).toBe(Client.Color.Red);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[Client.Color.Red]).toBe(1);

      g.players[0].hand.add("Algiers");
      g.players[0].hand.add("Cairo");
      g.players[0].hand.add("Istanbul");
      g.players[0].hand.add("Moscow");
      g.players[0].hand.add("Baghdad");
      expect(g.players[0].can_hand_cure(g)).toBe(Client.Color.Black);
      g.players[0].move(g, "Miami"); // only cure in research station
      expect(g.players[0].can_hand_cure(g)).toBe(false);
      g.players[0].move(g, "Atlanta");
      g.players[0].cure(g, [...g.players[0].hand]);

      g.players[0].hand.add("Algiers"); // cant cure already cured
      g.players[0].hand.add("Cairo");
      g.players[0].hand.add("Istanbul");
      g.players[0].hand.add("Moscow");
      g.players[0].hand.add("Baghdad");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].discard(g, [...g.players[0].hand]);

      g.players[0].hand.add("Mexico City");
      g.players[0].hand.add("Lagos");
      g.players[0].hand.add("Lima");
      g.players[0].hand.add("Bogota");
      expect(g.players[0].can_hand_cure(g)).toBe(false);
      g.players[0].hand.add("Los Angeles");
      expect(g.players[0].can_hand_cure(g)).toBe(Client.Color.Yellow);
      g.players[0].hand.add("Miami");
      expect(g.players[0].can_hand_cure(g)).toBe(Client.Color.Yellow); // 6 cards in hand but doesnt matter
    });
  });

  describe("#Cure", function () {
    it("Need the cards in hand", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.infect_stage(); // infect tokyo
      expect(
        g.players[0].can_cure(g, [
          "Tokyo",
          "Osaka",
          "Beijing",
          "Seoul",
          "Hong Kong",
        ])
      ).toBe(false);
    });
  });

  describe("#Cure", function () {
    it("Cure all means game won", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard(g, [...g.players[0].hand]);

      g.players[0].hand.add("Chennai");
      g.players[0].hand.add("Tehran");
      g.players[0].hand.add("Karachi");
      g.players[0].hand.add("Delhi");
      g.players[0].hand.add("Mumbai");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);

      g.infect_stage(); // infect tokyo
      g.players[0].hand.add("Tokyo");
      g.players[0].hand.add("Osaka");
      g.players[0].hand.add("Beijing");
      g.players[0].hand.add("Seoul");
      g.players[0].hand.add("Hong Kong");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);

      g.players[0].hand.add("San Francisco");
      g.players[0].hand.add("Chicago");
      g.players[0].hand.add("Atlanta");
      g.players[0].hand.add("Montreal");
      g.players[0].hand.add("Washington");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);

      g.players[0].hand.add("Los Angeles");
      g.players[0].hand.add("Mexico City");
      g.players[0].hand.add("Miami");
      g.players[0].hand.add("Lagos");
      g.players[0].hand.add("Santiago");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);

      expect(g.game_state).toBe(Client.GameState.Won);
    });
  });

  describe("#Cure Disease", function () {
    it("Eradicate after treating last cube", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.cubes[Client.Color.Red]).toBe(24);
      g.players[0].discard(g, [...g.players[0].hand]);
      g.infect_stage(); // infect tokyo
      g.infect_stage(); // infect taipei
      expect(g.cubes[Client.Color.Red]).toBe(22);

      g.players[0].hand.add("Tokyo");
      g.players[0].hand.add("Osaka");
      g.players[0].hand.add("Beijing");
      g.players[0].hand.add("Seoul");
      g.players[0].hand.add("Hong Kong");

      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[Client.Color.Red]).toBe(1);

      g.players[0].move(g, "Chicago");
      g.players[0].move(g, "San Francisco");
      g.players[0].move(g, "Tokyo");

      expect(g.players[0].can_treat(g)).toBe(true);
      g.players[0].treat(g, Client.Color.Red);
      expect(g.cured[Client.Color.Red]).toBe(1);
      expect(g.cubes[Client.Color.Red]).toBe(23);

      g.players[0].move(g, "Osaka");
      g.players[0].move(g, "Taipei");

      expect(g.players[0].can_treat(g)).toBe(true);
      g.players[0].treat(g, Client.Color.Red);
      expect(g.cured[Client.Color.Red]).toBe(2);
      expect(g.cubes[Client.Color.Red]).toBe(24);
    });
  });

  describe("#Cure Disease", function () {
    it("#After Discovering a Cure, Treat all when treating", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.cubes[Client.Color.Red]).toBe(24);
      const originalHand = [...g.players[0].hand];
      g.players[0].discard(g, [...g.players[0].hand]);
      g.epidemic();
      expect(g.player_deck.discard).toStrictEqual([
        ...originalHand,
        "Epidemic",
      ]);

      expect(g.cubes[Client.Color.Yellow]).toBe(21);

      g.players[0].hand.add("Miami");
      g.players[0].hand.add("Bogota");
      g.players[0].hand.add("Sao Paulo");
      g.players[0].hand.add("Lima");
      g.players[0].hand.add("Lagos");

      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[Client.Color.Yellow]).toBe(1);

      g.players[0].move(g, "Miami");
      g.players[0].move(g, "Bogota");
      g.players[0].move(g, "Sao Paulo");

      expect(g.players[0].can_treat(g)).toBe(true);
      g.players[0].treat(g, Client.Color.Yellow);
      expect(g.cured[Client.Color.Yellow]).toBe(2);
      expect(g.cubes[Client.Color.Yellow]).toBe(24);
    });
  });

  describe("#Treat Disease", function () {
    it("Can Treat", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );

      expect(g.players[0].can_treat(g)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Red)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Blue)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Black)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Yellow)).toBe(false);

      g.initialize_board();
      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");

      expect(g.players[0].can_treat(g)).toBe(true);
      expect(g.players[0].can_treat_color(g, Client.Color.Red)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Blue)).toBe(true);
      expect(g.players[0].can_treat_color(g, Client.Color.Black)).toBe(false);
      expect(g.players[0].can_treat_color(g, Client.Color.Yellow)).toBe(false);

      expect(g.game_graph["New York"].cubes[Client.Color.Blue]).toBe(1);
      expect(g.cubes[Client.Color.Blue]).toBe(19);
      g.players[0].treat(g, Client.Color.Blue);
      expect(g.game_graph["New York"].cubes[Client.Color.Blue]).toBe(0);
      expect(g.cubes[Client.Color.Blue]).toBe(20);
    });
  });

  describe("#Treat Disease", function () {
    it("Medic Treats All", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.Medic, Client.Roles.Researcher],
        5,
        seeded
      );

      g.initialize_board();
      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");
      g.players[0].move(g, "London");
      expect(g.players[0].can_treat(g)).toBe(true);
      expect(g.players[0].can_treat_color(g, Client.Color.Blue)).toBe(true);
      expect(g.game_graph["London"].cubes[Client.Color.Blue]).toBe(3);
      g.players[0].treat(g, Client.Color.Blue);
      expect(g.game_graph["London"].cubes[Client.Color.Blue]).toBe(0);

      g.players[0].move(g, "Kolkata");
      g.players[0].move(g, "Delhi");
      g.players[0].move(g, "Karachi");
      expect(g.players[0].can_treat(g)).toBe(true);
      expect(g.players[0].can_treat_color(g, Client.Color.Black)).toBe(true);
      expect(g.game_graph["Karachi"].cubes[Client.Color.Black]).toBe(3);
      g.players[0].treat(g, Client.Color.Black);
      expect(g.game_graph["Karachi"].cubes[Client.Color.Black]).toBe(0);
    });
  });

  describe("#Discard Cards", function () {
    it("Check Validity", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.players[0].can_discard([])).toBe(false);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);
      expect(g.players[0].hand.size).toBe(9);
      expect(g.players[0].can_discard(["Tokyo", "Milan"])).toBe(false); // can't discard cards that don't exist in hand
      expect(g.players[0].discard(g, ["Tokyo", "Milan"])).toBe(false);
      expect(g.players[0].hand.size).toBe(9);
      expect(g.players[0].can_discard(["Milan"])).toBe(false); // can't discard too few
      expect(g.players[0].can_discard(["Milan", "Milan"])).toBe(false); // can't discard dupliccates
      expect(g.players[0].can_discard(["Milan", "Mumbai", "Kolkata"])).toBe(
        false
      ); // can't discard too many
      expect(g.players[0].can_discard(["Milan", "Mumbai"])).toBe(true);
      expect(g.players[0].discard(g, ["Milan", "Mumbai"])).toBe(true);
      expect(g.players[0].hand.size).toBe(7);
    });
  });

  describe("#Trade Cards", function () {
    it("Check Validity", function () {
      const seeded = seedrandom("test167!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Scientist],
        5,
        seeded
      );
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_take(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(false);
      g.players[0].hand.add("Atlanta");
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[0].can_give(g)).toBe(true);
      expect(g.players[1].can_take(g)).toBe(true);
      expect(g.players[1].can_give(g)).toBe(false);
      g.players[0].move(g, "Washington");
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_take(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(false);
      g.players[0].move(g, "Atlanta");
      g.players[0].trade(g.players[1]);
      expect(g.players[0].hand.has("Atlanta")).toBe(false);
      expect(g.players[1].hand.has("Atlanta")).toBe(true);

      g.players[0].move(g, "Washington");
      g.players[1].move(g, "Washington");
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_take(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(false);
      g.players[1].hand.add("Washington");
      expect(g.players[0].can_take(g)).toBe(true);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_take(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(true);
      g.players[0].trade(g.players[1]);
      expect(g.players[0].hand.has("Atlanta")).toBe(false);
      expect(g.players[1].hand.has("Atlanta")).toBe(true);
      expect(g.players[0].hand.has("Washington")).toBe(true);
      expect(g.players[1].hand.has("Washington")).toBe(false);
    });
  });

  describe("#Trade Cards", function () {
    it("Take From Specific Player", function () {
      const seeded = seedrandom("test167!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Scientist],
        5,
        seeded
      );
      g.players[0].hand.add("Atlanta");
      expect(g.players[0].can_take_from_player(g.players[1])).toBe(false);
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(true);
      g.players[0].move(g, "Washington");
      expect(g.players[0].can_take_from_player(g.players[1])).toBe(false);
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(false);
      g.players[0].move(g, "Atlanta");
      g.players[0].trade(g.players[1]);
      expect(g.players[0].hand.has("Atlanta")).toBe(false);
      expect(g.players[1].hand.has("Atlanta")).toBe(true);

      g.players[0].move(g, "Washington");
      g.players[1].move(g, "Washington");
      expect(g.players[0].can_take_from_player(g.players[1])).toBe(false);
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(false);
      g.players[1].hand.add("Washington");
      expect(g.players[0].can_take_from_player(g.players[1])).toBe(true);
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(false);
      g.players[0].trade(g.players[1]);
      expect(g.players[0].hand.has("Atlanta")).toBe(false);
      expect(g.players[1].hand.has("Atlanta")).toBe(true);
      expect(g.players[0].hand.has("Washington")).toBe(true);
      expect(g.players[1].hand.has("Washington")).toBe(false);
    });
  });

  describe("#Trade Cards", function () {
    it("Always be able to take from Researcher", function () {
      const seeded = seedrandom("test167!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.players[0].can_take(g)).toBe(true);
      expect(g.players[0].can_take_from_player(g.players[1], "Tokyo")).toBe(
        false
      );
      expect(g.players[0].can_take_from_player(g.players[1], "Algiers")).toBe(
        true
      );
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(true);
      expect(g.players[1].can_give_card(g, "Tokyo")).toBe(false);
      expect(g.players[1].can_give_card(g, "Algiers")).toBe(true);

      expect(g.players[0].hand.has("Algiers")).toBe(false);
      expect(g.players[1].hand.has("Algiers")).toBe(true);
      g.players[1].trade(g.players[0], "Algiers");
      expect(g.players[0].hand.has("Algiers")).toBe(true);
      expect(g.players[1].hand.has("Algiers")).toBe(false);
      g.players[0].trade(g.players[1], "Algiers");

      g.players[0].move(g, "Washington");
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[0].can_take_from_player(g.players[1], "Algiers")).toBe(
        false
      );
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(false);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(false);

      g.players[1].move(g, "Washington");
      expect(g.players[0].can_take(g)).toBe(true);
      expect(g.players[0].can_take_from_player(g.players[1], "Algiers")).toBe(
        true
      );
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(false);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(true);
      expect(g.players[1].can_give_card(g, "Algiers")).toBe(true);

      expect(g.players[0].hand.has("Algiers")).toBe(false);
      expect(g.players[1].hand.has("Algiers")).toBe(true);
      g.players[1].trade(g.players[0], "Algiers");
      expect(g.players[0].hand.has("Algiers")).toBe(true);
      expect(g.players[1].hand.has("Algiers")).toBe(false);

      expect(g.players[0].can_take(g)).toBe(true);
      expect(g.players[1].can_give(g)).toBe(true);
      g.players[1].discard(g, [...g.players[1].hand]); // need cards in hand to trade!
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(false);
    });

    it("Always be able to take from Researcher unless it is an event card", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.Researcher, Client.Roles.ContingencyPlanner],
        5,
        seeded
      );
      expect(g.players[1].can_take(g)).toBe(true);
      expect(
        g.players[1].can_take_from_player(
          g.players[0],
          Client.EventCard.GovernmentGrant
        )
      ).toBe(false);
    });

    it("Always be able to take from Researcher and give away when standing on the same city", function () {
      const seeded = seedrandom("test167!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      expect(g.players[0].can_take(g)).toBe(true);
      expect(g.players[0].can_take_from_player(g.players[1], "Beijing")).toBe(
        false
      );
      expect(g.players[0].can_take_from_player(g.players[1], "Shanghai")).toBe(
        true
      );
      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");
      g.players[0].move(g, "London");

      g.players[1].move(g, "Washington");
      g.players[1].move(g, "New York");
      g.players[1].move(g, "London");
      expect(g.players[0].can_take(g)).toBe(true);
      expect(g.players[0].can_give(g)).toBe(true);
      expect(g.players[0].can_take_from_player(g.players[1], "Beijing")).toBe(
        false
      );
      expect(g.players[0].can_take_from_player(g.players[1], "Shanghai")).toBe(
        true
      );
    });
  });

  describe("#PlayerJSON", function () {
    it("Sorted Hand", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.initialize_board();
      const p1 = new PlayerJSON(g.players[0], g);
      const p2 = new PlayerJSON(g.players[1], g);
      expect(p1.hand).toEqual([
        "Government Grant",
        "Kolkata",
        "Mumbai",
        "Johannesburg",
      ]);
      expect(p2.hand).toEqual(["Chicago", "Seoul", "Taipei", "Tokyo"]);
    });
  });

  describe("#Event cards", function () {
    it("can only use event cards at proper times", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.initialize_board();
      expect(canUseEventCard(Client.EventCard.GovernmentGrant, 0, g)).toBe(
        true
      );
      g.game_state = Client.GameState.DiscardingCard;
      expect(canUseEventCard(Client.EventCard.GovernmentGrant, 0, g)).toBe(
        true
      );
      g.game_state = Client.GameState.Won;
      expect(canUseEventCard(Client.EventCard.GovernmentGrant, 0, g)).toBe(
        false
      );
      g.game_state = Client.GameState.Lost;

      expect(canUseEventCard(Client.EventCard.GovernmentGrant, 0, g)).toBe(
        false
      );
      g.game_state = Client.GameState.NotStarted;
      expect(canUseEventCard(Client.EventCard.GovernmentGrant, 0, g)).toBe(
        false
      );

      // cannot use a card we don't have in hand
      g.game_state = Client.GameState.Ready;
      expect(canUseEventCard(Client.EventCard.Airlift, 0, g)).toBe(false);
    });

    it("GovernmentGrant works", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.initialize_board();
      expect(canUseEventCard(Client.EventCard.GovernmentGrant, 0, g)).toBe(
        true
      );

      expect(g.game_graph["Tokyo"].hasResearchStation).toEqual(false);
      handleEventCard(
        Client.EventCard.GovernmentGrant,
        0,
        g,
        g.game_graph,
        null,
        "Tokyo"
      );
      expect(g.research_stations).toEqual(new Set(["Atlanta", "Tokyo"]));
      expect(g.game_graph["Tokyo"].hasResearchStation).toEqual(true);

      expect(g.players[0].hand.has(Client.EventCard.GovernmentGrant)).toBe(
        false
      );
    });

    it("Airlift works", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.initialize_board();
      g.players[1].hand.add(Client.EventCard.Airlift);
      expect(canUseEventCard(Client.EventCard.Airlift, 1, g)).toBe(true);

      expect(g.players[0].location).toBe("Atlanta");
      handleEventCard(
        Client.EventCard.Airlift,
        1,
        g,
        g.game_graph,
        null,
        0,
        "Tokyo"
      );
      expect(g.players[0].location).toBe("Tokyo");

      expect(g.players[1].hand.has(Client.EventCard.Airlift)).toBe(false);
    });

    it("Airlift works", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.initialize_board();
      g.players[1].hand.add(Client.EventCard.OneQuietNight);
      expect(canUseEventCard(Client.EventCard.OneQuietNight, 1, g)).toBe(true);

      expect(g.one_quiet_night_active).toBe(false);
      handleEventCard(Client.EventCard.OneQuietNight, 1, g, g.game_graph, null);
      expect(g.one_quiet_night_active).toBe(true);
      const originalFaceupDeck = [...g.infection_deck.faceup_deck];
      const oldCubes = { ...g.cubes };

      g.infect_stage();
      expect(g.one_quiet_night_active).toBe(false);
      expect(g.infection_deck.faceup_deck).toStrictEqual(originalFaceupDeck);
      expect(
        oldCubes === undefined ||
          oldCubes.black !== g.cubes.black ||
          oldCubes.blue !== g.cubes.blue ||
          oldCubes.yellow !== g.cubes.yellow ||
          oldCubes.red !== g.cubes.red
      ).toBe(false);
    });

    it("Airlift works", function () {
      const seeded = seedrandom("test!");
      const g = new Game(
        Cities,
        2,
        ["test", "test"],
        [Client.Roles.ContingencyPlanner, Client.Roles.Researcher],
        5,
        seeded
      );
      g.initialize_board();
      g.players[1].hand.add(Client.EventCard.ResilientPopulation);
      expect(canUseEventCard(Client.EventCard.ResilientPopulation, 1, g)).toBe(
        true
      );

      const originalFaceupDeck = [...g.infection_deck.faceup_deck];
      expect(originalFaceupDeck.includes("Tokyo")).toBe(true);
      handleEventCard(
        Client.EventCard.ResilientPopulation,
        1,
        g,
        g.game_graph,
        null,
        "Tokyo"
      );
      expect(g.infection_deck.faceup_deck.includes("Tokyo")).toBe(false);
      expect(g.infection_deck.faceup_deck).toHaveLength(
        originalFaceupDeck.length - 1
      );
      g.infection_deck.faceup_deck.forEach((card) =>
        expect(originalFaceupDeck.includes(card)).toBe(true)
      );

      expect(g.players[1].hand.has(Client.EventCard.ResilientPopulation)).toBe(
        false
      );
    });
  });
});
