const city = require('./city');
const infection = require('./infection_deck')
const seedrandom = require('seedrandom');
const player_deck = require('./player_deck')
const player = require('./player')

function Game(cities, rng = seedrandom()) {
    this.game_graph = city.City.load(cities)
    this.outbreak_counter = 0
    this.infection_rate_index = 0
    this.infection_rate = [2,2,2,3,3,4,4]
    this.rng = rng;
    this.infection_deck = new infection.InfectionDeck(cities, this.rng)
    this.players = [new player.Player(), new player.Player()]
    this.players.forEach(player => {
        this.game_graph[player.location].players.add(player)
    });
    this.initial_cards_for_players = []
    this.player_deck = new player_deck.PlayerDeck(cities, [], 5, this.rng, this)
    for (let i = 0; i < this.initial_cards_for_players.length; i++) {
        this.players[i % 2].hand.add(this.initial_cards_for_players[i])
    }

    this.research_stations = new Set(['Atlanta'])
    this.cured = { // 0 = uncured, 1 = cured, 2 = eradicated
        'blue': 0,
        'red': 0,
        'black': 0,
        'yellow': 0
    }
    this.cubes = {
        'blue': 24,
        'red': 24,
        'black': 24,
        'yellow': 24
    }
    this.lost = false
    this.won = false
};

Game.prototype.outbreak = function() {
    this.outbreak_counter += 1
    if (this.outbreak_counter === 8) {
        return false
    }
    return true
};

Game.prototype.epidemic = function() {
    this.infection_rate_index += 1;
    let card = this.infection_deck.infect_epidemic();
    this.game_graph[card].infect_epidemic(this)
    this.infection_deck.intensify()
};

Game.prototype.infect_stage = function() {
    for (let i = 0; i < this.infection_rate[this.infection_rate_index]; i++) {
        let card = this.infection_deck.flip_card()
        if (!this.game_graph[card].infect(this)) {
            this.lose_game()
        }
    }
};

Game.prototype.initialize_board = function() {
    for (let i = 2; i >= 0; i--) { // do all 3 cube infections, then 2 cube etc
        for (let j = 0; j < 3; j++) {
            let card = this.infection_deck.flip_card()
            for (let k = 0; k <= i; k++) { //# of cubes to infect based on index i
                this.game_graph[card].infect(this)
            }
        }
    }
};

Game.prototype.lose_game = function()  {
    this.lost = true
}

Game.prototype.win_game = function()  {
    this.won = true
}


module.exports = {
    Game: Game
};