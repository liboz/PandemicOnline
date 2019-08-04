const game = require('../game');
const cities = require('../data/cities');
const city = require('../city');
const infection = require('../infection_deck');
const player_deck = require('../player_deck');

const seedrandom = require('seedrandom');


describe('City', function () {
  describe('#Infect', function () {
    it('Increases the counter of cubes based on color', function () {
      let g = new game.Game(cities);
      let chennai = g.game_graph['Chennai'];
      for (let i = 0; i < 3; i++) {
        chennai.infect(g, city.Colors.BLACK, new Set());
        expect(chennai.cubes[city.Colors.BLUE]).toBe(0);
        expect(chennai.cubes[city.Colors.RED]).toBe(0);
        expect(chennai.cubes[city.Colors.BLACK]).toBe(i + 1);
        expect(chennai.cubes[city.Colors.YELLOW]).toBe(0);
      }
    });
  });

  describe('#Infect', function () {
    it('Epidemic', function () {
      let g = new game.Game(cities);
      let chennai = g.game_graph['Chennai'];

      for (let i = 0; i < 3; i++) {
        chennai.infect_epidemic();
        expect(chennai.cubes[city.Colors.BLUE]).toBe(0);
        expect(chennai.cubes[city.Colors.RED]).toBe(0);
        expect(chennai.cubes[city.Colors.BLACK]).toBe(3);
        expect(chennai.cubes[city.Colors.YELLOW]).toBe(0);
      }
    });
  });

  describe('#ChainReaction', function () {
    it('Create Chain Infection', function () {
      let g = new game.Game(cities);
      let chennai = g.game_graph['Chennai'];
      for (let i = 0; i < 4; i++) {
        chennai.infect(g, city.Colors.BLACK, new Set());
      }
      expect(chennai.cubes['black']).toBe(3);
      chennai.neighbors.forEach(neighbor => {
        expect(neighbor.cubes[city.Colors.BLUE]).toBe(0);
        expect(neighbor.cubes[city.Colors.RED]).toBe(0);
        expect(neighbor.cubes[city.Colors.BLACK]).toBe(1);
        expect(neighbor.cubes[city.Colors.YELLOW]).toBe(0);
      });

      let bangkok = g.game_graph['Bangkok']
      for (let i = 0; i < 4; i++) {
        bangkok.infect(g, city.Colors.RED, new Set());
      }
      bangkok.neighbors.forEach(neighbor => {
        expect(neighbor.cubes[city.Colors.RED]).toBe(1);
      });

      let kolkata = g.game_graph['Kolkata']
      expect(kolkata.cubes[city.Colors.RED]).toBe(1);
      expect(kolkata.cubes['black']).toBe(1);
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g, city.Colors.BLACK, new Set());
      }

      expect(kolkata.cubes[city.Colors.RED]).toBe(1);
      expect(kolkata.cubes[city.Colors.BLACK]).toBe(3);

      chennai.neighbors.forEach(neighbor => {
        if (neighbor === kolkata || kolkata.neighbors.includes(neighbor)) {
          expect(neighbor.cubes[city.Colors.BLACK]).toBe(3);
        } else {
          expect(neighbor.cubes[city.Colors.BLACK]).toBe(2)
        }
      });

      kolkata.neighbors.forEach(neighbor => {
        if (neighbor === chennai || chennai.neighbors.includes(neighbor)) {
          expect(neighbor.cubes[city.Colors.BLACK]).toBe(3);
        } else {
          expect(neighbor.cubes[city.Colors.BLACK]).toBe(1)
        }
      });

      bangkok.neighbors.forEach(neighbor => {
        expect(neighbor.cubes[city.Colors.RED]).toBe(1);
      });

    });
  });

  describe('#ChainReaction', function () {
    it('Outbreak Counter Multiple Chains', function () {
      let g = new game.Game(cities);
      let chennai = g.game_graph['Chennai'];
      for (let i = 0; i < 3; i++) {
        chennai.infect(g, city.Colors.BLACK, new Set());
      }

      let kolkata = g.game_graph['Kolkata']
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g, city.Colors.BLACK, new Set());
      }
      expect(g.outbreak_counter).toBe(0);
      chennai.infect(g, city.Colors.BLACK, new Set());
      expect(g.outbreak_counter).toBe(2);

      kolkata.infect(g, city.Colors.BLACK, new Set());
      expect(g.outbreak_counter).toBe(6);
    });
  });

  describe('#ChainReaction', function () {
    it('Outbreak Counter Multiple Chains No Infinite', function () {
      let g = new game.Game(cities);
      let chennai = g.game_graph['Chennai'];
      for (let i = 0; i < 3; i++) {
        chennai.infect(g, city.Colors.BLACK, new Set());
      }

      let kolkata = g.game_graph['Kolkata']
      for (let i = 0; i < 3; i++) {
        kolkata.infect(g, city.Colors.BLACK, new Set());
      }
      expect(g.outbreak_counter).toBe(0);
      chennai.infect(g, city.Colors.BLACK, new Set());
      expect(g.outbreak_counter).toBe(2);
      let delhi = g.game_graph['Delhi'];
      delhi.infect(g, city.Colors.BLACK, new Set());
      kolkata.infect(g, city.Colors.BLACK, new Set());
      expect(g.outbreak_counter).toBe(6);
    });
  });


  describe('#ChainReaction', function () {
    it('Outbreak Counter One Chain', function () {
      let g = new game.Game(cities);
      let tokyo = g.game_graph['Taipei'];
      for (let i = 0; i < 3; i++) {
        tokyo.infect(g, city.Colors.RED, new Set());
      }

      let osaka = g.game_graph['Osaka']
      for (let i = 0; i < 3; i++) {
        osaka.infect(g, city.Colors.RED, new Set());
      }
      expect(g.outbreak_counter).toBe(0);
      tokyo.infect(g, city.Colors.RED, new Set());
      expect(g.outbreak_counter).toBe(2);

      osaka.infect(g, city.Colors.RED, new Set());
      expect(g.outbreak_counter).toBe(4);
    });
  });
});

describe('Data Integrity', function () {
  describe('#CityNumber', function () {
    it('Is 48', function () {
      expect(cities.length).toBe(48);
    });
  });
});

describe('Infection Deck', function () {
  describe('#Random', function () {
    it('Shuffles', function () {
      let seeded = seedrandom('test!')
      let i = new infection.InfectionDeck(cities, seeded);
      expect(i.facedown_deck.length).toBe(48);
      expect(i.facedown_deck.toArray()).toEqual(
        [
          'Sao Paulo', 'Buenos Aires', 'Sydney',
          'Tehran', 'Khartoum', 'Los Angeles',
          'Atlanta', 'Seoul', 'Johannesburg',
          'Washington', 'Chicago', 'Lagos',
          'Miami', 'Kinshasa', 'Chennai',
          'Paris', 'Algiers', 'Mumbai',
          'Osaka', 'Santiago', 'Lima',
          'Kolkata', 'Istanbul', 'Cairo',
          'Bogota', 'Baghdad', 'St Petersburg',
          'Moscow', 'Riyadh', 'Shanghai',
          'Bangkok', 'Mexico City', 'Beijing',
          'Essen', 'Milan', 'San Francisco',
          'Jakarta', 'Montreal', 'Hong Kong',
          'Madrid', 'New York', 'Delhi',
          'Ho Chi Minh City', 'Manila', 'Taipei',
          'Karachi', 'London', 'Tokyo'
        ]);
    });
  });

  describe('#Flip Card', function () {
    it('Gets Top', function () {
      let seeded = seedrandom('test!')
      let i = new infection.InfectionDeck(cities, seeded);
      expect(i.flip_card()).toBe("Tokyo")
      expect(i.facedown_deck.toArray()).toEqual(
        [
          'Sao Paulo', 'Buenos Aires', 'Sydney',
          'Tehran', 'Khartoum', 'Los Angeles',
          'Atlanta', 'Seoul', 'Johannesburg',
          'Washington', 'Chicago', 'Lagos',
          'Miami', 'Kinshasa', 'Chennai',
          'Paris', 'Algiers', 'Mumbai',
          'Osaka', 'Santiago', 'Lima',
          'Kolkata', 'Istanbul', 'Cairo',
          'Bogota', 'Baghdad', 'St Petersburg',
          'Moscow', 'Riyadh', 'Shanghai',
          'Bangkok', 'Mexico City', 'Beijing',
          'Essen', 'Milan', 'San Francisco',
          'Jakarta', 'Montreal', 'Hong Kong',
          'Madrid', 'New York', 'Delhi',
          'Ho Chi Minh City', 'Manila', 'Taipei',
          'Karachi', 'London'
        ]);
      expect(i.faceup_deck).toEqual(['Tokyo'])

      seeded = seedrandom()
      i = new infection.InfectionDeck(cities, seeded);
      let peek = i.facedown_deck.peekBack();
      expect(i.flip_card()).toBe(peek)
    });
  });

  describe('#Intensify', function () {
    it('Check Top Cards are correct', function () {
      let seeded = seedrandom()
      let i = new infection.InfectionDeck(cities, seeded);

      for (let j = 0; j < 9; j++) {
        let c = i.facedown_deck.peekBack();
        expect(i.flip_card()).toBe(c)
      }
      let prev_facedown = [...i.facedown_deck.toArray()];
      let prev_faceup = [...i.faceup_deck];
      prev_facedown.sort();
      prev_faceup.sort();
      i.intensify();
      expect(i.facedown_deck.length).toBe(48)
      expect(i.faceup_deck.length).toBe(0)

      let arr_deck = i.facedown_deck.toArray()
      let after_intensify_down = arr_deck.slice(0, 39)
      let after_intensify_up = arr_deck.slice(39)
      after_intensify_down.sort()
      after_intensify_up.sort()
      expect(after_intensify_down).toEqual(prev_facedown)
      expect(after_intensify_up).toEqual(prev_faceup)

      for (let j = 0; j < 9; j++) {
        i.flip_card()
      }

      let reflipped_down = [...i.facedown_deck.toArray()]
      let reflipped_up = [...i.faceup_deck]
      expect(reflipped_down.sort()).toEqual(prev_facedown)
      expect(reflipped_up.sort()).toEqual(prev_faceup)
    });
  });

  describe('#Infect Epidemic', function () {
    it('Check Bottom Card in the faceup_deck ', function () {
      let seeded = seedrandom('test!')
      let i = new infection.InfectionDeck(cities, seeded);
      expect(i.infect_epidemic()).toBe("Sao Paulo");
      expect(i.facedown_deck.toArray()).toEqual(
        [
          'Buenos Aires', 'Sydney',
          'Tehran', 'Khartoum', 'Los Angeles',
          'Atlanta', 'Seoul', 'Johannesburg',
          'Washington', 'Chicago', 'Lagos',
          'Miami', 'Kinshasa', 'Chennai',
          'Paris', 'Algiers', 'Mumbai',
          'Osaka', 'Santiago', 'Lima',
          'Kolkata', 'Istanbul', 'Cairo',
          'Bogota', 'Baghdad', 'St Petersburg',
          'Moscow', 'Riyadh', 'Shanghai',
          'Bangkok', 'Mexico City', 'Beijing',
          'Essen', 'Milan', 'San Francisco',
          'Jakarta', 'Montreal', 'Hong Kong',
          'Madrid', 'New York', 'Delhi',
          'Ho Chi Minh City', 'Manila', 'Taipei',
          'Karachi', 'London', 'Tokyo'
        ]);
      expect(i.faceup_deck).toEqual(['Sao Paulo'])

      seeded = seedrandom()
      i = new infection.InfectionDeck(cities, seeded);
      let peek = i.facedown_deck.peekFront();
      expect(i.infect_epidemic()).toBe(peek)
    });
  });

  describe('#Big Deck', function () {
    it('Shuffles', function () {
      let seeded = seedrandom('test!')
      let i = new infection.InfectionDeck(cities, seeded);
      for (let j = 0; j < 16; j++) {
        i.flip_card();
      }
      expect(i.facedown_deck.length).toBe(32);
      expect(i.faceup_deck).toEqual(
        [
          'Beijing',
          'Essen', 'Milan', 'San Francisco',
          'Jakarta', 'Montreal', 'Hong Kong',
          'Madrid', 'New York', 'Delhi',
          'Ho Chi Minh City', 'Manila', 'Taipei',
          'Karachi', 'London', 'Tokyo'
        ].reverse());
        expect(i.infect_epidemic()).toBe('Sao Paulo')
        expect(i.facedown_deck.length).toBe(31);
        i.intensify()
        expect(i.facedown_deck.splice(0, 31)).toEqual([
          'Buenos Aires', 'Sydney',
          'Tehran', 'Khartoum', 'Los Angeles',
          'Atlanta', 'Seoul', 'Johannesburg',
          'Washington', 'Chicago', 'Lagos',
          'Miami', 'Kinshasa', 'Chennai',
          'Paris', 'Algiers', 'Mumbai',
          'Osaka', 'Santiago', 'Lima',
          'Kolkata', 'Istanbul', 'Cairo',
          'Bogota', 'Baghdad', 'St Petersburg',
          'Moscow', 'Riyadh', 'Shanghai',
          'Bangkok', 'Mexico City'
        ])
        expect(i.facedown_deck.toArray().sort()).toEqual([
          'Beijing',
          'Essen', 'Milan', 'San Francisco',
          'Jakarta', 'Montreal', 'Hong Kong',
          'Madrid', 'New York', 'Delhi',
          'Ho Chi Minh City', 'Manila', 'Taipei',
          'Karachi', 'London', 'Tokyo', 'Sao Paulo'
        ].sort())
    });
  });
});

describe('Player Deck', function () {
  describe('#Partition', function () {
    it('Partitions Deck Correctly', function () {
      let seeded = seedrandom()
      let partitions = new player_deck.PlayerDeck(cities, [], 6, seeded).partitions;
      expect(partitions.length).toBe(6);
      partitions.forEach(p => {
        expect(p.length).toBe(9);
        expect(p.filter(c => c === "Epidemic").length).toBe(1)
      })

      partitions = new player_deck.PlayerDeck(cities, [], 5, seeded).partitions
      expect(partitions.length).toBe(5);
      let d = {}
      partitions.forEach(p => {
        if (p.length in d) {
          d[p.length] += 1
        } else {
          d[p.length] = 1
        }
        expect(p.filter(c => c === "Epidemic").length).toBe(1)
      })
      expect(d).toEqual({ 10: 4, 13: 1 });
    });
  });
});


describe('Game', function () {
  describe('#Epidemic', function () {
    it('Intensifies', function () {
      let seeded = seedrandom('test!')
      let g = new game.Game(cities, seeded);
      expect(g.infection_rate_index).toBe(0)
      expect(g.game_graph['Sao Paulo'].cubes[city.Colors.YELLOW]).toBe(0)
      expect(g.game_graph['Buenos Aires'].cubes[city.Colors.YELLOW]).toBe(0)
      expect(g.infection_deck.facedown_deck.peekFront()).toBe('Sao Paulo')
      g.epidemic();
      expect(g.infection_rate_index).toBe(1)
      expect(g.game_graph['Sao Paulo'].cubes[city.Colors.YELLOW]).toBe(3)
      expect(g.game_graph['Buenos Aires'].cubes[city.Colors.YELLOW]).toBe(0)
      expect(g.infection_deck.facedown_deck.peekBack()).toBe('Sao Paulo')
      g.epidemic();
      expect(g.infection_rate_index).toBe(2)
      expect(g.game_graph['Sao Paulo'].cubes[city.Colors.YELLOW]).toBe(3)
      expect(g.game_graph['Buenos Aires'].cubes[city.Colors.YELLOW]).toBe(3)
      expect(g.infection_deck.facedown_deck.peekAt(-2)).toBe('Sao Paulo')
      expect(g.infection_deck.facedown_deck.peekBack()).toBe('Buenos Aires')
    });
  });
});
