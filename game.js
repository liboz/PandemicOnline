const city = require('./city');
const infection = require('./infection_deck')
const seedrandom = require('seedrandom');


function Game(cities, rng = seedrandom() ) {
    this.game_graph = city.City.load(cities)
    this.outbreak_counter = 0
    this.infection_rate_index = 0
    this.infection_rate = [2,2,2,3,3,4,4]
    this.rng = rng;
    this.infection_deck = new infection.InfectionDeck(cities, rng)
};

Game.prototype.outbreak = function() {
    this.outbreak_counter += 1
    if (this.outbreak_counter === 8) {
        return false
    }
    return true
};

// export the class
module.exports = {
    Game: Game
};