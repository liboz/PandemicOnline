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
    this.players = [new player.Player(0), new player.Player(1), new player.Player(2), new player.Player(3)]
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
    this.player_index = 0
    this.turns_left = 4
    //this.geoJSON = city.City.toGeoJSON(this.game_graph)
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

Game.prototype.next_player = function() {
    this.player_index += 1
    if (this.player_index == this.players.length) {
        this.player_index = 0;
    }
}

Game.prototype.decrement_turn = function() {
    if (this.turns_left === 0) {
        return false
    }
    this.turns_left -= 1
    if (this.turns_left === 0) {
        return false
    } else {
        return true
    }
}

Game.prototype.toJSON = function() {
    return new GameJSON(this)
}

function GameJSON(game) {
    if (game === null) {
        return null;
    }
    this.game_graph = Object.values(game.game_graph).map(c => new city.CityJSON(c))
    this.outbreak_counter = 0
    this.infection_rate_index = 0
    this.infection_rate = [2,2,2,3,3,4,4]
    this.faceup_deck = game.infection_deck.faceup_deck
    this.players = game.players.map(p => new player.PlayerJSON(p))

    this.research_stations = [...game.research_stations]
    this.cured = game.cured
    this.cubes = game.cubes
    this.lost = game.lost
    this.won = game.won
    this.player_index = game.player_index
    this.turns_left = game.turns_left
};

module.exports = {
    Game: Game,
    GameJSON: GameJSON
};