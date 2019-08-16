const city = require('./city');
const infection = require('./infection_deck')
const seedrandom = require('seedrandom');
const player_deck = require('./player_deck')
const player = require('./player')

const GameState = {
    NotStarted: 0,
    Ready: 1,
    DiscardingCard: 2,
    Won: 3,
    Lost: 4
}

function Game(cities, num_players, rng = seedrandom()) {
    this.game_graph = city.City.load(cities)
    this.outbreak_counter = 0
    this.infection_rate_index = 0
    this.infection_rate = [2, 2, 2, 3, 3, 4, 4]
    this.rng = rng;
    this.infection_deck = new infection.InfectionDeck(cities, this.rng)
    this.players = []
    for (let i = 0; i < num_players; i++) {
        this.players.push(new player.Player(i))
    }
    this.players.forEach(player => {
        this.game_graph[player.location].players.add(player)
    });
    this.initial_cards_for_players = []
    this.player_deck = new player_deck.PlayerDeck(cities, [], 5, this.rng, this)
    for (let i = 0; i < this.initial_cards_for_players.length; i++) {
        this.players[i % this.players.length].hand.add(this.initial_cards_for_players[i])
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
    this.player_index = 0
    this.turns_left = 4
    this.game_state = GameState.NotStarted

    //this.geoJSON = city.City.toGeoJSON(this.game_graph)
};

Game.prototype.outbreak = function () {
    this.outbreak_counter += 1
    if (this.outbreak_counter === 8) {
        return false
    }
    return true
};

Game.prototype.epidemic = function (socket = null) {
    this.infection_rate_index += 1;
    let card = this.infection_deck.infect_epidemic();
    if (socket) {
        socket.emit('epidemic', card)
    }
    this.game_graph[card].infect_epidemic(this)
    this.infection_deck.intensify()
};

Game.prototype.infect_stage = function () {
    for (let i = 0; i < this.infection_rate[this.infection_rate_index]; i++) {
        let card = this.infection_deck.flip_card()
        if (!this.game_graph[card].infect(this)) {
            this.lose_game()
        }
    }
};

Game.prototype.initialize_board = function () {
    if (this.game_state === GameState.NotStarted) {
        for (let i = 2; i >= 0; i--) { // do all 3 cube infections, then 2 cube etc
            for (let j = 0; j < 3; j++) {
                let card = this.infection_deck.flip_card()
                for (let k = 0; k <= i; k++) { //# of cubes to infect based on index i
                    this.game_graph[card].infect(this)
                }
            }
        }
        this.game_state = GameState.Ready;
    }
};

Game.prototype.lose_game = function () {
    this.game_state = GameState.Lost
}

Game.prototype.win_game = function () {
    this.game_state = GameState.Won
}

Game.prototype.next_player = function () {
    this.player_index += 1
    if (this.player_index == this.players.length) {
        this.player_index = 0;
    }
}

Game.prototype.decrement_turn = function () {
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

Game.prototype.use_turn = function (socket) {
    if (!this.decrement_turn()) {
        this.turn_end(socket);
    } else  {
        socket.emit('update game state', this.toJSON())
    }
}

Game.prototype.turn_end = function(socket) {
    for (let i = 0; i < 2; i++) {
        let card = this.players[this.player_index].draw(this)
        if (card === 'Epidemic') {
            this.players[this.player_index].hand.delete(card)
            this.epidemic(socket)
        }
    }

    socket.emit('update game state', this.toJSON())
    if (this.players[this.player_index].hand.size > this.players[this.player_index].hand_size_limit) {
        this.game_state = GameState.DiscardingCard
        socket.emit('discard cards')
        socket.on('discard', (cards, callback) => {
            console.log(cards)
            if (this.players[this.player_index].can_discard(cards)) {
                callback()
                this.players[this.player_index].discard(cards)
                socket.removeAllListeners('discard')
                this.infect_stage()
                this.next_player()
                this.turns_left = 4;
                this.game_state = GameState.Ready
                socket.emit('update game state', this.toJSON())
            }
        }, );
    } else {
        this.infect_stage()
        this.next_player()
        this.turns_left = 4;
        socket.emit('update game state', this.toJSON())
    }
}

Game.prototype.pass_turn = function (socket) {
    while (this.decrement_turn()) {
    }
    if (socket) {
        this.turn_end(socket);
    }
}

Game.prototype.toJSON = function () {
    return new GameJSON(this)
}

function GameJSON(game) {
    if (game === null) {
        return null;
    }
    this.game_graph = Object.values(game.game_graph).map(c => new city.CityJSON(c))
    this.game_graph_index = this.game_graph.reduce(function(map, city, index) {
        map[city.name] = index;
        return map;
    }, {})
    this.outbreak_counter = 0
    this.infection_rate_index = 0
    this.infection_rate = [2, 2, 2, 3, 3, 4, 4]
    this.faceup_deck = game.infection_deck.faceup_deck
    this.players = game.players.map(p => new player.PlayerJSON(p))

    this.research_stations = [...game.research_stations]
    this.cured = game.cured
    this.cubes = game.cubes
    this.game_state = game.game_state
    this.player_index = game.player_index
    this.turns_left = game.turns_left
    if (game.game_state !== GameState.NotStarted) {
        this.valid_final_destinations = game.players[game.player_index].get_valid_final_destinations(game)
        this.can_build_research_station = game.players[game.player_index].can_build_research_station(game)
        this.can_cure = game.players[game.player_index].can_hand_cure(game)
        this.can_treat = game.players[game.player_index].can_treat(game)
        this.can_trade = game.players[game.player_index].can_trade(game)
    }
};

module.exports = {
    Game: Game,
    GameJSON: GameJSON,
    GameState: GameState
};