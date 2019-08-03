const game = require('../game');
const cities = require('../data/cities');
const city = require('../city');

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