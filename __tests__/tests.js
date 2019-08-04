const game = require('../game');
const cities = require('../data/cities');
const city = require('../city');
const infection = require('../infection_deck');
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
      expect(i.facedown_deck).toEqual(
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
      expect(i.facedown_deck).toEqual(
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
    });
  });

  describe('#Intensify', function () {
    it('Check Top Cards are correct', function () {
      let seeded = seedrandom()
      let i = new infection.InfectionDeck(cities, seeded);
      
      for (let j = 0; j < 9; j++) {
        let c = i.facedown_deck[i.facedown_deck.length - 1];
        expect(i.flip_card()).toBe(c)
      }
      let prev_facedown = [...i.facedown_deck];
      let prev_faceup = [...i.faceup_deck];
      prev_facedown.sort();
      prev_faceup.sort();
      i.intensify();
      let after_intensify_down = i.facedown_deck.slice(0, 39)
      let after_intensify_up = i.facedown_deck.slice(39)
      after_intensify_down.sort()
      after_intensify_up.sort()
      expect(after_intensify_down).toEqual(prev_facedown)
      expect(after_intensify_up).toEqual(prev_faceup)

      for (let j = 0; j < 9; j++) {
        i.flip_card()
      }

      let reflipped_down = [...i.facedown_deck]
      let reflipped_up = [...i.faceup_deck]
      expect(reflipped_down.sort()).toEqual(prev_facedown)
      expect(reflipped_up.sort()).toEqual(prev_faceup)
    });
  });
});