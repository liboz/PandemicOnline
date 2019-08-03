const city = require('./city');

function Game(cities) {
    // always initialize all instance properties
    this.game_graph = city.City.load(cities)
    this.outbreak_counter = 0;
};


Game.prototype.outbreak = function() {
    this.outbreak_counter += 1;
};

// export the class
module.exports = {
    Game: Game
};