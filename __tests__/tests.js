const game = require("../game");
const cities = require("../data/cities");
const city = require("../city");
const infection = require("../infection_deck");
const player_deck = require("../player_deck");
const player = require("../player");
const other = require("../other");

const seedrandom = require("seedrandom");

describe("City", function() {
  describe("#Infect", function() {
    it("Increases the counter of cubes based on color", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      let chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 3; i++) {
        expect(chennai.infect(g)).toBe(true);
        expect(chennai.cubes[city.Colors.BLUE]).toBe(0);
        expect(chennai.cubes[city.Colors.RED]).toBe(0);
        expect(chennai.cubes[city.Colors.BLACK]).toBe(i + 1);
        expect(chennai.cubes[city.Colors.YELLOW]).toBe(0);
      }
    });
  });

  describe("#Infect", function() {
    it("Medic Prevents Infect After Cure Discovered", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.Medic, other.Roles.Researcher]
      );

      let atlanta = g.game_graph["Atlanta"];
      expect(atlanta.cubes[city.Colors.BLUE]).toBe(0);
      expect(atlanta.infect(g)).toBe(true);
      expect(atlanta.cubes[city.Colors.BLUE]).toBe(1);

      g.cured[city.Colors.BLUE] = 1;

      expect(g.players[0].move(g, "Washington")).toBe(true);
      let washington = g.game_graph["Washington"];
      expect(washington.cubes[city.Colors.BLUE]).toBe(0);
      expect(washington.infect(g)).toBe(true);
      expect(washington.cubes[city.Colors.BLUE]).toBe(0);

      g.cured[city.Colors.BLUE] = 1; // washington triggers eradicate
      expect(atlanta.cubes[city.Colors.BLUE]).toBe(0);
      expect(atlanta.infect(g)).toBe(true);
      expect(atlanta.cubes[city.Colors.BLUE]).toBe(1);
    });
  });

  describe("#Infect", function() {
    it("Quarantine Specialist Prevents Infect in Nearby Cities", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.QuarantineSpecialist, other.Roles.Researcher],
        5,
        seeded
      );

      let atlanta = g.game_graph["Atlanta"];
      expect(atlanta.cubes[city.Colors.BLUE]).toBe(0);
      expect(atlanta.infect(g)).toBe(true);
      expect(atlanta.cubes[city.Colors.BLUE]).toBe(0);

      let washington = g.game_graph["Washington"];
      expect(washington.cubes[city.Colors.BLUE]).toBe(0);
      expect(washington.infect(g)).toBe(true);
      expect(washington.cubes[city.Colors.BLUE]).toBe(0);

      let chicago = g.game_graph["Chicago"];
      expect(chicago.cubes[city.Colors.BLUE]).toBe(0);
      expect(chicago.infect(g)).toBe(true);
      expect(chicago.cubes[city.Colors.BLUE]).toBe(0);

      g.players[0].move(g, "Miami");
      //g.players[0].move(g, 'Bogota')
      let saopaulo = g.game_graph["Sao Paulo"];
      g.epidemic(); // Sao Paulo
      expect(saopaulo.cubes[city.Colors.YELLOW]).toBe(3);

      g.infect_stage(); // Sao Paulo
      let bogota = g.game_graph["Bogota"];
      expect(bogota.cubes[city.Colors.YELLOW]).toBe(0);
    });
  });

  describe("#Infect", function() {
    it("Quarantine Specialist Does Nothing in Initialization", function() {
      let seeded = seedrandom("5"); // initial infection contains Atlanta
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.QuarantineSpecialist, other.Roles.Researcher],
        5,
        seeded
      );

      g.initialize_board();
      let infected = [
        "London",
        "Sao Paulo",
        "Tokyo",
        "Atlanta",
        "Hong Kong",
        "Manila",
        "Moscow",
        "New York",
        "Bangkok"
      ].reverse();
      expect(g.infection_deck.faceup_deck).toEqual(infected);
      for (let i = 0; i < infected.length; i++) {
        let cube_count = 3 - Math.trunc(i / 3);
        let c = g.game_graph[infected[i]];
        expect(c.cubes[c.color]).toBe(cube_count);
      }
    });
  });

  describe("#Infect", function() {
    it("No Infect when Eradicated", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      let chennai = g.game_graph["Chennai"];
      g.cured[city.Colors.BLACK] = 2;
      for (let i = 0; i < 3; i++) {
        expect(chennai.infect(g)).toBe(true);
        expect(chennai.cubes[city.Colors.BLUE]).toBe(0);
        expect(chennai.cubes[city.Colors.RED]).toBe(0);
        expect(chennai.cubes[city.Colors.BLACK]).toBe(0);
        expect(chennai.cubes[city.Colors.YELLOW]).toBe(0);
      }
    });
  });

  describe("#Infect", function() {
    it("Epidemic", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      let chennai = g.game_graph["Chennai"];

      for (let i = 0; i < 3; i++) {
        chennai.infect_epidemic(g);
        expect(chennai.cubes[city.Colors.BLUE]).toBe(0);
        expect(chennai.cubes[city.Colors.RED]).toBe(0);
        expect(chennai.cubes[city.Colors.BLACK]).toBe(3);
        expect(chennai.cubes[city.Colors.YELLOW]).toBe(0);
      }
    });
  });

  describe("#ChainReaction", function() {
    it("Create Chain Infection", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      let chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 4; i++) {
        chennai.infect(g);
      }
      expect(chennai.cubes["black"]).toBe(3);
      chennai.neighbors.forEach(neighbor => {
        expect(neighbor.cubes[city.Colors.BLUE]).toBe(0);
        expect(neighbor.cubes[city.Colors.RED]).toBe(0);
        expect(neighbor.cubes[city.Colors.BLACK]).toBe(1);
        expect(neighbor.cubes[city.Colors.YELLOW]).toBe(0);
      });

      let bangkok = g.game_graph["Bangkok"];
      for (let i = 0; i < 4; i++) {
        bangkok.infect(g);
      }
      bangkok.neighbors.forEach(neighbor => {
        expect(neighbor.cubes[city.Colors.RED]).toBe(1);
      });

      let kolkata = g.game_graph["Kolkata"];
      expect(kolkata.cubes[city.Colors.RED]).toBe(1);
      expect(kolkata.cubes["black"]).toBe(1);
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g);
      }

      expect(kolkata.cubes[city.Colors.RED]).toBe(1);
      expect(kolkata.cubes[city.Colors.BLACK]).toBe(3);

      chennai.neighbors.forEach(neighbor => {
        if (neighbor === kolkata || kolkata.neighbors.has(neighbor)) {
          expect(neighbor.cubes[city.Colors.BLACK]).toBe(3);
        } else {
          expect(neighbor.cubes[city.Colors.BLACK]).toBe(2);
        }
      });

      kolkata.neighbors.forEach(neighbor => {
        if (neighbor === chennai || chennai.neighbors.has(neighbor)) {
          expect(neighbor.cubes[city.Colors.BLACK]).toBe(3);
        } else {
          expect(neighbor.cubes[city.Colors.BLACK]).toBe(1);
        }
      });

      bangkok.neighbors.forEach(neighbor => {
        expect(neighbor.cubes[city.Colors.RED]).toBe(1);
      });
    });
  });

  describe("#ChainReaction", function() {
    it("Outbreak Counter Multiple Chains", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      let chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 3; i++) {
        chennai.infect(g);
      }

      let kolkata = g.game_graph["Kolkata"];
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

  describe("#ChainReaction", function() {
    it("Outbreak Counter Multiple Chains No Infinite", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      let chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 3; i++) {
        chennai.infect(g);
      }

      let kolkata = g.game_graph["Kolkata"];
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g);
      }
      expect(g.outbreak_counter).toBe(0);
      chennai.infect(g);
      expect(g.outbreak_counter).toBe(2);
      let delhi = g.game_graph["Delhi"];
      delhi.infect(g);
      kolkata.infect(g);
      expect(g.outbreak_counter).toBe(6);
    });
  });

  describe("#ChainReaction", function() {
    it("Outbreak Counter One Chain", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      let tokyo = g.game_graph["Taipei"];
      for (let i = 0; i < 3; i++) {
        tokyo.infect(g);
      }

      let osaka = g.game_graph["Osaka"];
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

describe("Data Integrity", function() {
  describe("#CityNumber", function() {
    it("Is 48", function() {
      expect(cities.length).toBe(48);
    });
  });
});

describe("Infection Deck", function() {
  describe("#Random", function() {
    it("Shuffles", function() {
      let seeded = seedrandom("test!");
      let i = new infection.InfectionDeck(cities, seeded);
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
        "Tokyo"
      ]);
    });
  });

  describe("#Flip Card", function() {
    it("Gets Top", function() {
      let seeded = seedrandom("test!");
      let i = new infection.InfectionDeck(cities, seeded);
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
        "London"
      ]);
      expect(i.faceup_deck).toEqual(["Tokyo"]);

      seeded = seedrandom();
      i = new infection.InfectionDeck(cities, seeded);
      let peek = i.facedown_deck.peekBack();
      expect(i.flip_card()).toBe(peek);
    });
  });

  describe("#Intensify", function() {
    it("Check Top Cards are correct", function() {
      let seeded = seedrandom();
      let i = new infection.InfectionDeck(cities, seeded);

      for (let j = 0; j < 9; j++) {
        let c = i.facedown_deck.peekBack();
        expect(i.flip_card()).toBe(c);
      }
      let prev_facedown = [...i.facedown_deck.toArray()];
      let prev_faceup = [...i.faceup_deck];
      prev_facedown.sort();
      prev_faceup.sort();
      i.intensify();
      expect(i.facedown_deck.length).toBe(48);
      expect(i.faceup_deck.length).toBe(0);

      let arr_deck = i.facedown_deck.toArray();
      let after_intensify_down = arr_deck.slice(0, 39);
      let after_intensify_up = arr_deck.slice(39);
      after_intensify_down.sort();
      after_intensify_up.sort();
      expect(after_intensify_down).toEqual(prev_facedown);
      expect(after_intensify_up).toEqual(prev_faceup);

      for (let j = 0; j < 9; j++) {
        i.flip_card();
      }

      let reflipped_down = [...i.facedown_deck.toArray()];
      let reflipped_up = [...i.faceup_deck];
      expect(reflipped_down.sort()).toEqual(prev_facedown);
      expect(reflipped_up.sort()).toEqual(prev_faceup);
    });
  });

  describe("#Infect Epidemic", function() {
    it("Check Bottom Card in the faceup_deck ", function() {
      let seeded = seedrandom("test!");
      let i = new infection.InfectionDeck(cities, seeded);
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
        "Tokyo"
      ]);
      expect(i.faceup_deck).toEqual(["Sao Paulo"]);

      seeded = seedrandom();
      i = new infection.InfectionDeck(cities, seeded);
      let peek = i.facedown_deck.peekFront();
      expect(i.infect_epidemic()).toBe(peek);
    });
  });

  describe("#Big Deck", function() {
    it("Shuffles", function() {
      let seeded = seedrandom("test!");
      let i = new infection.InfectionDeck(cities, seeded);
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
          "Tokyo"
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
        "Mexico City"
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
          "Sao Paulo"
        ].sort()
      );
    });
  });
});

describe("Player Deck", function() {
  describe("#Partition", function() {
    it("Partitions Deck Correctly", function() {
      let seeded = seedrandom();
      let partitions = new player_deck.PlayerDeck(cities, [], 6, seeded)
        .partitions;
      expect(partitions.length).toBe(6);
      partitions.forEach(p => {
        expect(p.length).toBe(9);
        expect(p.filter(c => c === "Epidemic").length).toBe(1);
      });

      partitions = new player_deck.PlayerDeck(cities, [], 5, seeded).partitions;
      expect(partitions.length).toBe(5);
      let d = {};
      partitions.forEach(p => {
        if (p.length in d) {
          d[p.length] += 1;
        } else {
          d[p.length] = 1;
        }
        expect(p.filter(c => c === "Epidemic").length).toBe(1);
      });
      expect(d).toEqual({ 10: 4, 13: 1 });
    });
  });

  describe("#Partition", function() {
    it("Hand Size Is Correct", function() {
      let seeded = seedrandom();
      let g = new game.Game(
        cities,
        3,
        ["test", "test", "test"],
        [
          other.Roles.ContingencyPlanner,
          other.Roles.Researcher,
          other.Roles.Scientist
        ],
        5,
        seeded
      );

      g.players.forEach(i => expect(i.hand.size).toBe(3));

      g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );

      g.players.forEach(i => expect(i.hand.size).toBe(4));
    });
  });
});

describe("Game", function() {
  describe("#Epidemic", function() {
    it("Intensifies", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      expect(g.infection_rate_index).toBe(0);
      expect(g.game_graph["Sao Paulo"].cubes[city.Colors.YELLOW]).toBe(0);
      expect(g.game_graph["Buenos Aires"].cubes[city.Colors.YELLOW]).toBe(0);
      expect(g.infection_deck.facedown_deck.peekFront()).toBe("Sao Paulo");
      g.epidemic();
      expect(g.infection_rate_index).toBe(1);
      expect(g.game_graph["Sao Paulo"].cubes[city.Colors.YELLOW]).toBe(3);
      expect(g.game_graph["Buenos Aires"].cubes[city.Colors.YELLOW]).toBe(0);
      expect(g.infection_deck.facedown_deck.peekBack()).toBe("Sao Paulo");
      g.epidemic();
      expect(g.infection_rate_index).toBe(2);
      expect(g.game_graph["Sao Paulo"].cubes[city.Colors.YELLOW]).toBe(3);
      expect(g.game_graph["Buenos Aires"].cubes[city.Colors.YELLOW]).toBe(3);
      expect(g.infection_deck.facedown_deck.peekAt(-2)).toBe("Sao Paulo");
      expect(g.infection_deck.facedown_deck.peekBack()).toBe("Buenos Aires");
    });
  });

  describe("#Epidemic", function() {
    it("No Epidemic Cubes when Disease Eradicated", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      g.cured[city.Colors.YELLOW] = 2;
      g.epidemic();
      expect(g.infection_rate_index).toBe(1);
      expect(g.game_graph["Sao Paulo"].cubes[city.Colors.YELLOW]).toBe(0);
    });
  });

  describe("#Initialize Board", function() {
    it("Right Number of Cubes ", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      expect(g.game_state).toBe(other.GameState.NotStarted);
      for (let i = 0; i < 2; i++) {
        // running initialize_board twice does nothing
        g.initialize_board();
        expect(g.game_state).toBe(other.GameState.Ready);
        expect(g.outbreak_counter).toBe(0);
        let infected = [
          "Madrid",
          "New York",
          "Delhi",
          "Ho Chi Minh City",
          "Manila",
          "Taipei",
          "Karachi",
          "London",
          "Tokyo"
        ].reverse();
        expect(g.infection_deck.faceup_deck).toEqual(infected);
        for (let i = 0; i < infected.length; i++) {
          let cube_count = 3 - Math.trunc(i / 3);
          let c = g.game_graph[infected[i]];
          expect(c.cubes[c.color]).toBe(cube_count);
        }
      }
    });
  });

  describe("#Infect Stage", function() {
    it("Check Right number of cards ", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      g.cured[city.Colors.RED] = 2; //eradicate all the diseases so we dont have to deal with outbreak counter
      g.cured[city.Colors.BLACK] = 2;
      g.cured[city.Colors.BLUE] = 2;
      g.cured[city.Colors.YELLOW] = 2;
      for (let i = 0; i < 6; i++) {
        g.infect_stage();
        expect(g.infection_deck.faceup_deck.length).toBe(g.infection_rate[i]);
        g.epidemic();
      }
    });
  });

  describe("#Outbreak", function() {
    it("over 8 ends game ", function() {
      let seeded = seedrandom("test33!"); // want exactly 8!
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      for (let i = 0; i < 3; i++) {
        g.infect_stage();
        g.epidemic();
      }
      expect(g.game_state).toBe(other.GameState.NotStarted);
      g.epidemic();
      g.epidemic();
      g.infect_stage();
      g.infect_stage();
      expect(g.game_state).toBe(other.GameState.Lost);
    });
  });

  describe("#Run out of Cubes", function() {
    it("Lose game", function() {
      let seeded = seedrandom("test33!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      let chennai = g.game_graph["Chennai"];
      for (let i = 0; i < 3; i++) {
        chennai.infect(g);
      }

      let kolkata = g.game_graph["Kolkata"];
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g);
      }
      chennai.infect(g);
      let delhi = g.game_graph["Delhi"];
      delhi.infect(g);
      kolkata.infect(g);
      expect(g.game_state).toBe(other.GameState.NotStarted);
      g.infect_stage(); // next card is Tehran
      expect(g.game_state).toBe(other.GameState.Lost);
    });
  });

  describe("#Run out of Cubes", function() {
    it("Epidemic can lose game", function() {
      let seeded = seedrandom("test33!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      let mexico_city = g.game_graph["Mexico City"];
      for (let i = 0; i < 3; i++) {
        mexico_city.infect(g);
      }

      let miami = g.game_graph["Miami"];
      for (let i = 0; i < 3; i++) {
        miami.infect(g);
      }
      mexico_city.infect(g);
      let bogota = g.game_graph["Bogota"];
      bogota.infect(g);
      miami.infect(g);
      expect(g.game_state).toBe(other.GameState.NotStarted);
      expect(g.cubes[city.Colors.YELLOW]).toBe(2);
      g.epidemic(); // lagos
      expect(g.cubes[city.Colors.YELLOW]).toBe(-1);
      expect(g.game_state).toBe(other.GameState.Lost);
    });
  });

  describe("#Next Player", function() {
    it("loops", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      g.players.forEach((p, index) => {
        expect(g.player_index).toBe(index);
        g.next_player();
      });
      expect(g.player_index).toBe(0);
    });
  });

  describe("#Turns", function() {
    it("stops when at 0", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
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

  describe("#Turns", function() {
    it("pass Turns", function() {
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      g.pass_turn();
      expect(g.turns_left).toBe(0);

      g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      g.decrement_turn();
      expect(g.turns_left).toBe(3);
      g.pass_turn();
      expect(g.turns_left).toBe(0);

      g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      g.decrement_turn();
      g.decrement_turn();
      expect(g.turns_left).toBe(2);
      g.pass_turn();
      expect(g.turns_left).toBe(0);

      g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
      );
      g.decrement_turn();
      g.decrement_turn();
      g.decrement_turn();
      expect(g.turns_left).toBe(1);
      g.pass_turn();
      expect(g.turns_left).toBe(0);

      g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher]
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

describe("Player", function() {
  describe("#Movement", function() {
    it("Drive/Ferry", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
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
  });

  describe("#Movement", function() {
    it("Charter/Direct", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard([...g.players[0].hand]);
      expect(g.players[0].canDirectFlight("Beijing")).toBe(false);
      expect(g.players[0].move(g, "Beijing")).toBe(false);
      expect(g.players[0].location).toBe("Atlanta");
      g.players[0].draw(g);
      g.players[0].draw(g);

      //Direct Flight
      expect(g.players[0].canDirectFlight("Beijing")).toBe(true);
      expect(g.players[0].hand.has("Beijing")).toBe(true);
      expect(g.players[0].move(g, "Beijing")).toBe(true);
      expect(g.players[0].location).toBe("Beijing");
      expect(g.game_graph["Beijing"].players.has(g.players[0])).toBe(true);
      expect(g.players[0].hand.has("Beijing")).toBe(false);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);

      //Drive/Ferry
      expect(g.players[0].hand.has("Shanghai")).toBe(false);
      expect(g.players[0].move(g, "Shanghai")).toBe(true);
      expect(g.players[0].location).toBe("Shanghai");
      expect(g.game_graph["Shanghai"].players.has(g.players[0])).toBe(true);
      expect(g.players[0].hand.has("Shanghai")).toBe(false);

      expect(g.players[0].hand.has("Hong Kong")).toBe(false);
      expect(g.players[0].move(g, "Hong Kong")).toBe(true);
      expect(g.players[0].location).toBe("Hong Kong");
      expect(g.game_graph["Hong Kong"].players.has(g.players[0])).toBe(true);
      expect(g.players[0].hand.has("Hong Kong")).toBe(false);
      expect(g.players[0].canCharterFlight()).toBe(false); // on Hong Kong can't charter flight

      expect(g.players[0].hand.has("Ho Chi Minh City")).toBe(true);
      expect(g.players[0].move(g, "Ho Chi Minh City")).toBe(true);
      expect(g.players[0].location).toBe("Ho Chi Minh City");
      expect(g.game_graph["Ho Chi Minh City"].players.has(g.players[0])).toBe(
        true
      );

      //Charter
      expect(g.players[0].canCharterFlight()).toBe(true);
      expect(g.players[0].hand.has("Ho Chi Minh City")).toBe(true);
      expect(g.players[0].hand.has("Tokyo")).toBe(false);
      expect(g.players[0].move(g, "Tokyo")).toBe(true);
      expect(g.players[0].location).toBe("Tokyo");
      expect(g.game_graph["Tokyo"].players.has(g.players[0])).toBe(true);
      expect(g.players[0].hand.has("Ho Chi Minh City")).toBe(false);
    });
  });

  describe("#Movement", function() {
    it("Dispatcher Move", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.Dispatcher, other.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard([...g.players[0].hand]);
      expect(g.players[1].location).toBe("Atlanta"); // moving player 1 with player 0
      g.players[0].draw(g);
      g.players[0].draw(g);

      //Direct Flight
      expect(g.players[1].canDirectFlight("Beijing")).toBe(false); //can't direct fly normally
      expect(g.players[1].canDirectFlight("Beijing", g.players[0].hand)).toBe(
        true
      );
      expect(g.players[0].hand.has("Beijing")).toBe(true);
      expect(g.players[0].dispatcher_move(g, g.players[1], "Beijing")).toBe(
        true
      );
      expect(g.players[1].location).toBe("Beijing");
      expect(g.game_graph["Beijing"].players.has(g.players[1])).toBe(true);
      expect(g.players[0].hand.has("Beijing")).toBe(false);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);

      //Drive/Ferry
      expect(g.players[0].hand.has("Shanghai")).toBe(false);
      expect(g.players[0].dispatcher_move(g, g.players[1], "Shanghai")).toBe(
        true
      );
      expect(g.players[1].location).toBe("Shanghai");
      expect(g.game_graph["Shanghai"].players.has(g.players[1])).toBe(true);
      expect(g.players[0].hand.has("Shanghai")).toBe(false);

      expect(g.players[0].hand.has("Hong Kong")).toBe(false);
      expect(g.players[0].dispatcher_move(g, g.players[1], "Hong Kong")).toBe(
        true
      );
      expect(g.players[1].location).toBe("Hong Kong");
      expect(g.game_graph["Hong Kong"].players.has(g.players[1])).toBe(true);
      expect(g.players[0].hand.has("Hong Kong")).toBe(false);

      expect(g.players[0].hand.has("Ho Chi Minh City")).toBe(true);
      expect(
        g.players[0].dispatcher_move(g, g.players[1], "Ho Chi Minh City")
      ).toBe(true);
      expect(g.players[1].location).toBe("Ho Chi Minh City");
      expect(g.game_graph["Ho Chi Minh City"].players.has(g.players[1])).toBe(
        true
      );

      //Charter
      expect(g.players[1].canCharterFlight()).toBe(false); // can't charter normally
      expect(g.players[1].canCharterFlight(g.players[0].hand)).toBe(true);
      expect(g.players[0].hand.has("Ho Chi Minh City")).toBe(true);
      expect(g.players[0].hand.has("Tokyo")).toBe(false);
      expect(g.players[0].dispatcher_move(g, g.players[1], "Tokyo")).toBe(true);
      expect(g.players[1].location).toBe("Tokyo");
      expect(g.game_graph["Tokyo"].players.has(g.players[1])).toBe(true);
      expect(g.players[0].hand.has("Ho Chi Minh City")).toBe(false);

      expect(g.players[1].dispatcher_move(g, g.players[0], "Chicago")).toBe(
        false
      ); //p1 isnt a dispatcher
      expect(g.players[0].move(g, "Chicago")).toBe(true);
    });
  });

  describe("#Movement", function() {
    it("Operations Expert Special Move", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.OperationsExpert, other.Roles.Researcher],
        5,
        seeded
      );
      expect(g.players[0].canOperationsExpertMove(g)).toBe(true);
      expect(g.players[1].canOperationsExpertMove(g)).toBe(false);

      g.players[0].discard([...g.players[0].hand]);
      expect(g.players[0].canOperationsExpertMove(g)).toBe(false);
      g.players[0].draw(g);
      expect(g.players[0].canOperationsExpertMove(g)).toBe(true);
      g.players[0].move(g, "Chicago");
      expect(g.players[0].canOperationsExpertMove(g)).toBe(false);
      g.players[0].move(g, "Atlanta");
      expect(g.players[0].canOperationsExpertMoveWithCard(g, "Atlanta")).toBe(
        false
      );
      expect(g.players[0].canOperationsExpertMoveWithCard(g, "Beijing")).toBe(
        true
      );
      g.players[0].operationsExpertMove(g, "Tokyo", "Beijing");
      expect(g.players[0].location).toBe("Tokyo");
    });
  });

  describe("#Movement", function() {
    it("Movable Locations", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.OperationsExpert],
        5,
        seeded
      );
      let all_locations = [...Array(48).keys()].sort();
      let valid_final_destinations = g.players[0]
        .get_valid_final_destinations(g)
        .sort();
      expect(valid_final_destinations).toEqual([]); // game not started
      g.initialize_board();

      valid_final_destinations = g.players[0]
        .get_valid_final_destinations(g)
        .sort();
      expect(valid_final_destinations).toEqual(
        [
          "Chicago",
          "Washington",
          "Miami",
          "Khartoum",
          "Milan",
          "Jakarta",
          "Karachi"
        ]
          .map(i => g.game_graph[i].index)
          .sort()
      );

      g.players[0].draw(g);
      g.players[0].move(g, "Chicago");
      g.players[0].move(g, "San Francisco");
      g.players[0].move(g, "Tokyo");
      g.players[0].move(g, "Seoul");
      g.players[0].move(g, "Beijing");
      expect(g.players[0].hand.has("Beijing")).toBe(true);
      valid_final_destinations = g.players[0]
        .get_valid_final_destinations(g)
        .sort(); // all locations with a charter
      expect(valid_final_destinations).toEqual(all_locations);

      expect(g.players[0].can_build_research_station(g)).toBe(true);
      expect(g.game_graph["Beijing"].hasResearchStation).toEqual(false);
      g.players[0].build_research_station(g);

      valid_final_destinations = g.players[0]
        .get_valid_final_destinations(g)
        .sort();
      expect(valid_final_destinations).toEqual(
        [
          "Shanghai",
          "Seoul",
          "Khartoum",
          "Milan",
          "Jakarta",
          "Karachi",
          "Atlanta"
        ]
          .map(i => g.game_graph[i].index)
          .sort()
      ); // adjacent + direct flight + shuttle flight

      let valid_final_destinations_player2 = g.players[1]
        .get_valid_final_destinations(g)
        .sort();
      expect(valid_final_destinations_player2).toEqual(all_locations); //operations expert in a research station

      g.players[1].move(g, "Chicago");
      valid_final_destinations_player2 = g.players[1]
        .get_valid_final_destinations(g)
        .sort();
      expect(valid_final_destinations_player2).toEqual(
        [
          "Atlanta",
          "Washington",
          "Montreal",
          "Mexico City",
          "Los Angeles",
          "San Francisco",
          "Seoul",
          "Chennai",
          "Riyadh"
        ]
          .map(i => g.game_graph[i].index)
          .sort()
      ); // adjacent + direct flight
    });
  });

  describe("#Movement", function() {
    it("Movable Dispatcher Move Locations", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        3,
        ["test", "test"],
        [
          other.Roles.ContingencyPlanner,
          other.Roles.OperationsExpert,
          other.Roles.Dispatcher
        ],
        5,
        seeded
      );
      let all_locations = [...Array(48).keys()].sort();
      let valid_final_destinations = g.players[2].get_valid_dispatcher_final_destinations(
        g
      );
      expect(valid_final_destinations).toEqual({}); // game not started
      g.initialize_board();

      valid_final_destinations = g.players[2].get_valid_dispatcher_final_destinations(
        g
      );
      console.log(g.players[2].hand);
      let b = valid_final_destinations[0].map(
        i => Object.values(g.game_graph).map(c => new city.CityJSON(c))[i]
      );
      console.log(b);
      expect(valid_final_destinations[0].sort()).toEqual(
        ["Chicago", "Washington", "Miami", "Milan", "Riyadh", "Essen"]
          .map(i => g.game_graph[i].index)
          .sort()
      );

      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");
      g.players[0].move(g, "London");
      g.players[0].move(g, "Essen");

      valid_final_destinations = g.players[2].get_valid_dispatcher_final_destinations(
        g
      );
      expect(valid_final_destinations[0].sort()).toEqual(all_locations);

      expect(valid_final_destinations[1].sort()).toEqual(
        ["Chicago", "Washington", "Miami", "Milan", "Riyadh", "Essen"]
          .map(i => g.game_graph[i].index)
          .sort()
      ); // operations expert move not usable
    });
  });

  describe("#Research Station", function() {
    it("Can Build", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      expect(g.research_stations).toEqual(new Set(["Atlanta"]));
      expect(g.players[0].can_build_research_station(g)).toBe(false);
      g.players[0].discard([...g.players[0].hand]);

      g.players[0].draw(g);
      expect(g.players[0].hand).toEqual(new Set(["Beijing"]));
      g.players[0].move(g, "Chicago");
      g.players[0].move(g, "San Francisco");
      g.players[0].move(g, "Tokyo");
      g.players[0].move(g, "Seoul");
      g.players[0].move(g, "Beijing");
      expect(g.players[0].hand).toEqual(new Set(["Beijing"]));
      expect(g.players[0].can_build_research_station(g)).toBe(true);
      expect(g.game_graph["Beijing"].hasResearchStation).toEqual(false);
      g.players[0].build_research_station(g);
      expect(g.players[0].hand).toEqual(new Set());
      expect(g.research_stations).toEqual(new Set(["Atlanta", "Beijing"]));
      expect(g.game_graph["Beijing"].hasResearchStation).toEqual(true);
      expect(g.players[0].move(g, "Atlanta")).toBe(true);
      expect(g.players[0].move(g, "Beijing")).toBe(true);
    });
  });

  describe("#Research Station", function() {
    it("Can Build", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.OperationsExpert, other.Roles.Researcher],
        5,
        seeded
      );
      expect(g.research_stations).toEqual(new Set(["Atlanta"]));
      expect(g.players[0].can_build_research_station(g)).toBe(false);
      g.players[0].discard([...g.players[0].hand]);

      g.players[0].draw(g);
      expect(g.players[0].hand).toEqual(new Set(["Beijing"]));
      g.players[0].move(g, "Beijing");
      expect(g.players[0].hand).toEqual(new Set());
      expect(g.players[0].can_build_research_station(g)).toBe(true);
      expect(g.game_graph["Beijing"].hasResearchStation).toEqual(false);
      g.players[0].build_research_station(g);
      expect(g.research_stations).toEqual(new Set(["Atlanta", "Beijing"]));
      expect(g.game_graph["Beijing"].hasResearchStation).toEqual(true);
      expect(g.players[0].move(g, "Atlanta")).toBe(true);
      expect(g.players[0].move(g, "Beijing")).toBe(true);
    });
  });

  describe("#Draw out the Deck", function() {
    it("Lose Game", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      for (let i = 0; i < 45; i++) {
        // 48 cities + 5 epidemic, but start with 8 cards removed with 2 people
        g.players[0].draw(g);
        expect(g.game_state).toBe(other.GameState.NotStarted);
      }
      g.players[0].draw(g);
      expect(g.game_state).toBe(other.GameState.Lost);
    });
  });

  describe("#Cure", function() {
    it("Eradicate", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard([...g.players[0].hand]);

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
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[city.Colors.BLACK]).toBe(2);

      g.players[0].hand.add("Algiers"); // cant cure already cured
      g.players[0].hand.add("Cairo");
      g.players[0].hand.add("Istanbul");
      g.players[0].hand.add("Moscow");
      g.players[0].hand.add("Baghdad");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
    });
  });

  describe("#Cure", function() {
    it("Scientist with 4 cards", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.Scientist, other.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard([...g.players[0].hand]);

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
      expect(g.players[0].can_hand_cure(g)).toBe(city.Colors.BLACK);
      g.players[0].move(g, "Miami");
      expect(g.players[0].can_build_research_station(g)).toBe(true);
      g.players[0].build_research_station(g);
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[city.Colors.BLACK]).toBe(2);

      g.players[0].hand.add("Algiers"); // cant cure already cured
      g.players[0].hand.add("Cairo");
      g.players[0].hand.add("Istanbul");
      g.players[0].hand.add("Moscow");
      g.players[0].hand.add("Baghdad");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
    });
  });

  describe("#Cure", function() {
    it("Can Cure", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard([...g.players[0].hand]);

      g.infect_stage(); // infect tokyo
      g.players[0].hand.add("Tokyo");
      g.players[0].hand.add("Osaka");
      g.players[0].hand.add("Beijing");
      g.players[0].hand.add("Seoul");
      g.players[0].hand.add("Hong Kong");
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[city.Colors.RED]).toBe(1);

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
      g.players[0].discard(["Moscow"]);
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
      g.players[0].hand.add("Baghdad"); // duplicates and having 5 is no good
      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(false);
    });
  });

  describe("#Cure", function() {
    it("Can Hand Cure", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard([...g.players[0].hand]);

      g.infect_stage(); // infect tokyo
      g.players[0].hand.add("Tokyo");
      g.players[0].hand.add("Osaka");
      g.players[0].hand.add("Beijing");
      g.players[0].hand.add("Seoul");
      g.players[0].hand.add("Hong Kong");
      expect(g.players[0].can_hand_cure(g)).toBe(city.Colors.RED);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[city.Colors.RED]).toBe(1);

      g.players[0].hand.add("Algiers");
      g.players[0].hand.add("Cairo");
      g.players[0].hand.add("Istanbul");
      g.players[0].hand.add("Moscow");
      g.players[0].hand.add("Baghdad");
      expect(g.players[0].can_hand_cure(g)).toBe(city.Colors.BLACK);
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
      g.players[0].discard([...g.players[0].hand]);

      g.players[0].hand.add("Mexico City");
      g.players[0].hand.add("Lagos");
      g.players[0].hand.add("Lima");
      g.players[0].hand.add("Bogota");
      expect(g.players[0].can_hand_cure(g)).toBe(false);
      g.players[0].hand.add("Los Angeles");
      expect(g.players[0].can_hand_cure(g)).toBe(city.Colors.YELLOW);
      g.players[0].hand.add("Miami");
      expect(g.players[0].can_hand_cure(g)).toBe(city.Colors.YELLOW); // 6 cards in hand but doesnt matter
    });
  });

  describe("#Cure", function() {
    it("Need the cards in hand", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
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
          "Hong Kong"
        ])
      ).toBe(false);
    });
  });

  describe("#Cure", function() {
    it("Cure all means game won", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      g.players[0].discard([...g.players[0].hand]);

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

      expect(g.game_state).toBe(other.GameState.Won);
    });
  });

  describe("#Cure Disease", function() {
    it("Eradicate after treating last cube", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      expect(g.cubes[city.Colors.RED]).toBe(24);
      g.players[0].discard([...g.players[0].hand]);
      g.infect_stage(); // infect tokyo
      g.infect_stage(); // infect taipei
      expect(g.cubes[city.Colors.RED]).toBe(22);

      g.players[0].hand.add("Tokyo");
      g.players[0].hand.add("Osaka");
      g.players[0].hand.add("Beijing");
      g.players[0].hand.add("Seoul");
      g.players[0].hand.add("Hong Kong");

      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[city.Colors.RED]).toBe(1);

      g.players[0].move(g, "Chicago");
      g.players[0].move(g, "San Francisco");
      g.players[0].move(g, "Tokyo");

      expect(g.players[0].can_treat(g)).toBe(true);
      g.players[0].treat(g, city.Colors.RED);
      expect(g.cured[city.Colors.RED]).toBe(1);
      expect(g.cubes[city.Colors.RED]).toBe(23);

      g.players[0].move(g, "Osaka");
      g.players[0].move(g, "Taipei");

      expect(g.players[0].can_treat(g)).toBe(true);
      g.players[0].treat(g, city.Colors.RED);
      expect(g.cured[city.Colors.RED]).toBe(2);
      expect(g.cubes[city.Colors.RED]).toBe(24);
    });
  });

  describe("#Cure Disease", function() {
    it("#After Discovering a Cure, Treat all when treating", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      expect(g.cubes[city.Colors.RED]).toBe(24);
      g.players[0].discard([...g.players[0].hand]);
      g.epidemic();

      expect(g.cubes[city.Colors.YELLOW]).toBe(21);

      g.players[0].hand.add("Miami");
      g.players[0].hand.add("Bogota");
      g.players[0].hand.add("Sao Paulo");
      g.players[0].hand.add("Lima");
      g.players[0].hand.add("Lagos");

      expect(g.players[0].can_cure(g, [...g.players[0].hand])).toBe(true);
      g.players[0].cure(g, [...g.players[0].hand]);
      expect(g.cured[city.Colors.YELLOW]).toBe(1);

      g.players[0].move(g, "Miami");
      g.players[0].move(g, "Bogota");
      g.players[0].move(g, "Sao Paulo");

      expect(g.players[0].can_treat(g)).toBe(true);
      g.players[0].treat(g, city.Colors.YELLOW);
      expect(g.cured[city.Colors.YELLOW]).toBe(2);
      expect(g.cubes[city.Colors.YELLOW]).toBe(24);
    });
  });

  describe("#Treat Disease", function() {
    it("Can Treat", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );

      expect(g.players[0].can_treat(g)).toBe(false);
      expect(g.players[0].can_treat_color(g, city.Colors.RED)).toBe(false);
      expect(g.players[0].can_treat_color(g, city.Colors.BLUE)).toBe(false);
      expect(g.players[0].can_treat_color(g, city.Colors.BLACK)).toBe(false);
      expect(g.players[0].can_treat_color(g, city.Colors.YELLOW)).toBe(false);

      g.initialize_board();
      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");

      expect(g.players[0].can_treat(g)).toBe(true);
      expect(g.players[0].can_treat_color(g, city.Colors.RED)).toBe(false);
      expect(g.players[0].can_treat_color(g, city.Colors.BLUE)).toBe(true);
      expect(g.players[0].can_treat_color(g, city.Colors.BLACK)).toBe(false);
      expect(g.players[0].can_treat_color(g, city.Colors.YELLOW)).toBe(false);

      expect(g.game_graph["New York"].cubes[city.Colors.BLUE]).toBe(1);
      expect(g.cubes[city.Colors.BLUE]).toBe(19);
      g.players[0].treat(g, city.Colors.BLUE);
      expect(g.game_graph["New York"].cubes[city.Colors.BLUE]).toBe(0);
      expect(g.cubes[city.Colors.BLUE]).toBe(20);
    });
  });

  describe("#Treat Disease", function() {
    it("Medic Treats All", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.Medic, other.Roles.Researcher],
        5,
        seeded
      );

      g.initialize_board();
      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");
      g.players[0].move(g, "London");
      expect(g.players[0].can_treat(g)).toBe(true);
      expect(g.players[0].can_treat_color(g, city.Colors.BLUE)).toBe(true);
      expect(g.game_graph["London"].cubes[city.Colors.BLUE]).toBe(3);
      g.players[0].treat(g, city.Colors.BLUE);
      expect(g.game_graph["London"].cubes[city.Colors.BLUE]).toBe(0);

      g.players[0].move(g, "Jakarta");
      g.players[0].move(g, "Ho Chi Minh City");
      expect(g.players[0].can_treat(g)).toBe(true);
      expect(g.players[0].can_treat_color(g, city.Colors.RED)).toBe(true);
      expect(g.game_graph["Ho Chi Minh City"].cubes[city.Colors.RED]).toBe(2);
      g.players[0].treat(g, city.Colors.RED);
      expect(g.game_graph["Ho Chi Minh City"].cubes[city.Colors.RED]).toBe(0);
    });
  });

  describe("#Movement", function() {
    it("Medic Treats When Moving If Cure Has been Discovered", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.Medic, other.Roles.Researcher],
        5,
        seeded
      );

      g.initialize_board();
      g.cured[city.Colors.BLUE] = 1;
      g.players[0].move(g, "Washington");
      g.players[0].move(g, "New York");
      expect(g.game_graph["London"].cubes[city.Colors.BLUE]).toBe(3);
      g.players[0].move(g, "London");
      expect(g.players[0].can_treat(g)).toBe(false);
      expect(g.players[0].can_treat_color(g, city.Colors.BLUE)).toBe(false);
      expect(g.game_graph["London"].cubes[city.Colors.BLUE]).toBe(0);

      g.cured[city.Colors.RED] = 1;
      g.players[0].move(g, "Jakarta");
      expect(g.game_graph["Ho Chi Minh City"].cubes[city.Colors.RED]).toBe(2);
      g.players[0].move(g, "Ho Chi Minh City");
      expect(g.players[0].can_treat(g)).toBe(false);
      expect(g.players[0].can_treat_color(g, city.Colors.RED)).toBe(false);
      expect(g.game_graph["Ho Chi Minh City"].cubes[city.Colors.RED]).toBe(0);
    });
  });

  describe("#Discard Cards", function() {
    it("Check Validity", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      expect(g.players[0].can_discard(new Set())).toBe(false);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);
      g.players[0].draw(g);
      expect(g.players[0].hand.size).toBe(9);
      expect(g.players[0].can_discard(["Tokyo", "Beijing"])).toBe(false); // can't discard cards that don't exist in hand
      expect(g.players[0].discard(["Tokyo", "Beijing"])).toBe(false);
      expect(g.players[0].hand.size).toBe(9);
      expect(g.players[0].can_discard(["Beijing"])).toBe(false); // can't discard too few
      expect(g.players[0].can_discard(["Beijing", "Beijing"])).toBe(false); // can't discard dupliccates
      expect(g.players[0].can_discard(["Milan", "Jakarta", "Beijing"])).toBe(
        false
      ); // can't discard too many
      expect(g.players[0].can_discard(["Jakarta", "Beijing"])).toBe(true);
      expect(g.players[0].discard(["Jakarta", "Beijing"])).toBe(true);
      expect(g.players[0].hand.size).toBe(7);
    });
  });

  describe("#Trade Cards", function() {
    it("Check Validity", function() {
      let seeded = seedrandom("test167!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Scientist],
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
      g.players[0].move(g, "Miami");
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_take(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(false);
      g.players[0].move(g, "Atlanta");
      g.players[0].trade(g.players[1]);
      expect(g.players[0].hand.has("Atlanta")).toBe(false);
      expect(g.players[1].hand.has("Atlanta")).toBe(true);

      g.players[0].move(g, "Miami");
      g.players[1].move(g, "Miami");
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_take(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(false);
      g.players[1].hand.add("Miami");
      expect(g.players[0].can_take(g)).toBe(true);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_take(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(true);
      g.players[0].trade(g.players[1]);
      expect(g.players[0].hand.has("Atlanta")).toBe(false);
      expect(g.players[1].hand.has("Atlanta")).toBe(true);
      expect(g.players[0].hand.has("Miami")).toBe(true);
      expect(g.players[1].hand.has("Miami")).toBe(false);
    });
  });

  describe("#Trade Cards", function() {
    it("Take From Specific Player", function() {
      let seeded = seedrandom("test167!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Scientist],
        5,
        seeded
      );
      g.players[0].hand.add("Atlanta");
      expect(g.players[0].can_take_from_player(g.players[1])).toBe(false);
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(true);
      g.players[0].move(g, "Miami");
      expect(g.players[0].can_take_from_player(g.players[1])).toBe(false);
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(false);
      g.players[0].move(g, "Atlanta");
      g.players[0].trade(g.players[1]);
      expect(g.players[0].hand.has("Atlanta")).toBe(false);
      expect(g.players[1].hand.has("Atlanta")).toBe(true);

      g.players[0].move(g, "Miami");
      g.players[1].move(g, "Miami");
      expect(g.players[0].can_take_from_player(g.players[1])).toBe(false);
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(false);
      g.players[1].hand.add("Miami");
      expect(g.players[0].can_take_from_player(g.players[1])).toBe(true);
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(false);
      g.players[0].trade(g.players[1]);
      expect(g.players[0].hand.has("Atlanta")).toBe(false);
      expect(g.players[1].hand.has("Atlanta")).toBe(true);
      expect(g.players[0].hand.has("Miami")).toBe(true);
      expect(g.players[1].hand.has("Miami")).toBe(false);
    });
  });

  describe("#Trade Cards", function() {
    it("Always be able to take from Researcher", function() {
      let seeded = seedrandom("test167!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
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

      g.players[0].move(g, "Miami");
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[0].can_take_from_player(g.players[1], "Algiers")).toBe(
        false
      );
      expect(g.players[1].can_take_from_player(g.players[0])).toBe(false);
      expect(g.players[0].can_give(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(false);

      g.players[1].move(g, "Miami");
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
      g.players[1].discard([...g.players[1].hand]); // need cards in hand to trade!
      expect(g.players[0].can_take(g)).toBe(false);
      expect(g.players[1].can_give(g)).toBe(false);
    });
  });

  describe("#PlayerJSON", function() {
    it("Sorted Hand", function() {
      let seeded = seedrandom("test!");
      let g = new game.Game(
        cities,
        2,
        ["test", "test"],
        [other.Roles.ContingencyPlanner, other.Roles.Researcher],
        5,
        seeded
      );
      g.initialize_board();
      let p1 = new player.PlayerJSON(g.players[0], g);
      let p2 = new player.PlayerJSON(g.players[1], g);
      expect(p1.hand).toEqual(["Milan", "Jakarta", "Karachi", "Khartoum"]);
      expect(p2.hand).toEqual(["Washington", "Seoul", "Chennai", "Riyadh"]);
    });
  });
});
