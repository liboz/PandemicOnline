const city = require('./city');

function Game(cities) {
    // always initialize all instance properties
    this.game_graph = city.City.load(cities)
    this.outbreak_counter = 0;
    this.infection_rate_index = 0
    this.infection_rate = [2,2,2,3,3,4,4]
};


Game.prototype.outbreak = function() {
    this.outbreak_counter += 1;
    if (this.outbreak_counter === 8) {
        return false
    }
    return true
};

// export the class
module.exports = {
    Game: Game
};