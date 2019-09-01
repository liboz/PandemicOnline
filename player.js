const city = require('./city');
const other = require('./other');

function Player(id, name, role, location = "Atlanta") {
    this.name = name
    this.role = role;
    this.hand = new Set()
    this.location = location
    this.id = id
    this.hand_size_limit = 7
};

// add dispatcher
Player.prototype.move = function (game, final_destination, socket = null) {
    let game_graph = game.game_graph
    if (game_graph[this.location].neighbors.has(game_graph[final_destination]) ||
        game_graph[this.location].hasResearchStation && game_graph[final_destination].hasResearchStation) {
        // drive/ferry + shuttle
        this.movePiece(game, game_graph, final_destination, socket)
        return true
    } else if (this.hand.has(final_destination)) {
        // direct
        this.directFlight(game, final_destination, socket)
        return true
    } else if (this.hand.has(this.location)) {
        // charter
        this.charterFlight(game, final_destination, socket)
        return true
    } else {
        return false;
    }
};

Player.prototype.canDirectFlight = function (final_destination) {
    return this.hand.has(final_destination)
};

Player.prototype.directFlight = function (game, final_destination, socket = null) {
    this.hand.delete(final_destination)
    this.movePiece(game, game.game_graph, final_destination, socket)
}

Player.prototype.charterFlight = function (game, final_destination, socket = null) {
    this.hand.delete(this.location)
    this.movePiece(game, game.game_graph, final_destination, socket)
};

Player.prototype.canCharterFlight = function () {
    return this.hand.has(this.location)
}

Player.prototype.operationsExpertMove = function (game, final_destination, card, socket = null) {
    this.hand.delete(card)
    this.movePiece(game, game.game_graph, final_destination, socket)
};

Player.prototype.canOperationsExpertMoveWithCard = function (game, card) {
    return this.canOperationsExpertMove(game) && this.hand.has(card)
};

Player.prototype.canOperationsExpertMove = function (game) {
    return this.role === other.Roles.OperationsExpert && game.game_graph[this.location].hasResearchStation && this.hand.size > 0
}

Player.prototype.movePiece = function (game, game_graph, final_destination, socket) {
    if (this.role === other.Roles.Medic) {
        this.medicMoveTreat(game, socket)
    }
    game_graph[this.location].players.delete(this)
    game_graph[final_destination].players.add(this)
    this.location = final_destination;
    if (this.role === other.Roles.Medic) {
        this.medicMoveTreat(game, socket)
    }
}

Player.prototype.medicMoveTreat = function (game, socket) {
    let colors = Object.keys(game.cured)
    colors.forEach(c => {
        if (game.cured[c] === 1) {
            this.treat(game, c, socket)
        }
    })
}

Player.prototype.get_valid_final_destinations = function (game) {
    if (game.game_state === other.GameState.Ready) {
        if (this.canCharterFlight() || this.canOperationsExpertMove(game)) {
            //go everywhere!!!
            return Object.values(game.game_graph).map(i => i.index);
        } else {
            let s = new Set([...game.game_graph[this.location].neighbors].map(i => i.index))
            
            this.hand.forEach(c => {
                s.add(game.game_graph[c].index)
            })
            if (game.game_graph[this.location].hasResearchStation) {
                game.research_stations.forEach(c => {
                    s.add(game.game_graph[c].index)
                })
            }
            s.delete(game.game_graph[this.location].index)
            return [...s]
        }
    } else {
        return []
    }
}

Player.prototype.draw = function (game) {
    let card = game.player_deck.flip_card()
    if (card === undefined) {
        game.lose_game_draw();
    } else {
        this.hand.add(card)
    }
    return card;
}

Player.prototype.can_build_research_station = function (game) {
    return !game.game_graph[this.location].hasResearchStation && (this.hand.has(this.location) || this.role === other.Roles.OperationsExpert)
}

Player.prototype.build_research_station = function (game) {
    if (this.role !== other.Roles.OperationsExpert) {
        this.hand.delete(this.location)
    }
    game.game_graph[this.location].hasResearchStation = true
    game.research_stations.add(this.location)
}

Player.prototype.can_cure = function (game, cards) {
    if (!game.game_graph[this.location].hasResearchStation) {
        return false
    } else {
        let cards_needed = this.role === other.Roles.Scientist ? 4 : 5;
        if (cards.length === cards_needed && (new Set(cards).size === cards_needed)) {
            let color = game.game_graph[cards[0]].color
            if (game.cured[color] > 0) {
                return false
            } else {
                let count = 0
                cards.forEach(card => {
                    if (this.hand.has(card) && game.game_graph[card].color === color) {
                        count += 1
                    }
                })
                return count === cards_needed;
            }
        }
        return false;
    }
}

Player.prototype.can_hand_cure = function (game) {
    if (!game.game_graph[this.location].hasResearchStation) {
        return false
    } else {
        let cards = {
            'blue': 0,
            'red': 0,
            'black': 0,
            'yellow': 0
        }
        this.hand.forEach(card => {
            cards[game.game_graph[card].color] += 1
        })

        let cards_needed = this.role === other.Roles.Scientist ? 4 : 5;
        let keys = Object.keys(cards)
        for (let i = 0; i < 4; i++) {
            if (game.cured[keys[i]] === 0 && cards[keys[i]] >= cards_needed) {
                return keys[i]
            }
        }
        return false
    }
}

Player.prototype.cure = function (game, cards) {
    let color = game.game_graph[cards[0]].color
    cards.forEach(card => {
        this.hand.delete(card);
    })
    game.cured[color] = game.cubes[color] !== 24 ? 1 : 2
    if (Object.values(game.cured).every(c => c > 0)) {
        game.win_game()
    }
}

Player.prototype.can_treat = function (game) {
    return Object.values(game.game_graph[this.location].cubes).reduce((a, b) => a + b, 0) > 0
}

Player.prototype.can_treat_color = function (game, color) {
    return game.game_graph[this.location].cubes[color] > 0
}

Player.prototype.treat = function (game, color, io = null) {
    if (game.cured[color] === 1 || this.role === other.Roles.Medic) {
        game.cubes[color] += game.game_graph[this.location].cubes[color]
        game.game_graph[this.location].cubes[color] = 0
    } else {
        game.cubes[color] += 1
        game.game_graph[this.location].cubes[color] -= 1
    }

    if (game.cured[color] === 1 && game.cubes[color] === 24) {
        if (io) {
            io.emit("eradicated", color)
        }
        game.cured[color] = 2
    }
}

Player.prototype.can_discard = function (cards) {
    if (Array.isArray(cards)) {
        return (this.hand.size - cards.length == this.hand_size_limit) &&
            (new Set(cards)).size === cards.length && cards.every(c => this.hand.has(c));
    }
    return false;
}

Player.prototype.discard = function (cards) {
    if (cards.every(c => this.hand.has(c))) {
        cards.forEach(c => this.hand.delete(c))
        return true;
    }
    return false;
}

Player.prototype.can_take = function (game) {
    if (game.game_graph[this.location].players.size <= 1) {
        return false
    } else {
        return [...game.game_graph[this.location].players].some(player => {
            if (player !== this) {
                return player.hand.has(this.location) || (player.role === other.Roles.Researcher && player.hand.size > 0);
            }
        })
    }
}

Player.prototype.can_take_from_player = function (player, card = null) {
    if (this.location !== player.location) {
        return false
    } else {
        if (card) {
            return player.hand.has(this.location) || (player.role === other.Roles.Researcher && player.hand.has(card))
        } else {
            return player.hand.has(this.location)
        }
    }
}

Player.prototype.can_give = function (game) {
    if (game.game_graph[this.location].players.size <= 1) {
        return false
    } else {
        return this.hand.has(this.location) || (this.role === other.Roles.Researcher && this.hand.size > 0);
    }
}

Player.prototype.can_give_card = function (game, card) {
    return this.can_give(game) && (this.role === other.Roles.Researcher && this.hand.has(card))
}

Player.prototype.trade = function (player, card) {
    if (!card) {
        this.tradeCard(player, this.location)
    } else {
        this.tradeCard(player, card)
    }
}

Player.prototype.tradeCard = function(player, c) {
    if (this.hand.has(c)) {
        player.hand.add(c)
        this.hand.delete(c)
    } else {
        player.hand.delete(c)
        this.hand.add(c)
    }
}

function PlayerJSON(player, game) {
    this.name = player.name;
    this.role = player.role;
    this.hand = [...player.hand].sort((i, j) => {
        let first_index = city.ColorsIndex[game.game_graph[i].color]
        let second_index = city.ColorsIndex[game.game_graph[j].color]
        if (first_index > second_index) {
            return 1
        }
        if (first_index < second_index) {
            return -1
        }

        if (i > j) {
            return 1
        }

        if (i < j) {
            return -1
        }
    })
    this.location = player.location
    this.id = player.id
};

module.exports = {
    Player: Player,
    PlayerJSON: PlayerJSON,
};