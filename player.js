function Player(id, role, location = "Atlanta") {
    this.role = role;
    this.hand = new Set()
    this.location = location
    this.id = id
};

Player.prototype.move = function (game_graph, final_destination) {
    if (game_graph[this.location].neighbors.has(game_graph[final_destination]) || // drive/ferry
        game_graph[this.location].hasResearchStation && game_graph[final_destination].hasResearchStation) { //shuttle
        game_graph[this.location].players.delete(this)
        game_graph[final_destination].players.add(this)
        this.location = final_destination;
        return true
    } else if (this.hand.has(final_destination)) { // direct
        this.hand.delete(final_destination)
        game_graph[this.location].players.delete(this)
        game_graph[final_destination].players.add(this)
        this.location = final_destination;
        return true
    } else if (this.hand.has(this.location)) { // charter
        this.hand.delete(this.location)
        game_graph[this.location].players.delete(this)
        game_graph[final_destination].players.add(this)
        this.location = final_destination;
        return true
    } else {
        return false;
    }
};

Player.prototype.get_valid_final_destinations = function (game) {
    if (this.hand.has(this.location)) {
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
        s.delete(game.game_graph[this.location].index )
        return [...s]
    }


}

Player.prototype.draw = function (game) {
    let card = game.player_deck.flip_card()
    if (card === undefined) {
        game.lose_game();
    }
    this.hand.add(card)

}

Player.prototype.can_build_research_station = function (game) {
    return !game.game_graph[this.location].hasResearchStation && this.hand.has(this.location)
}

Player.prototype.build_research_station = function (game) {
    this.hand.delete(this.location)
    game.game_graph[this.location].hasResearchStation = true
    game.research_stations.add(this.location)
}

Player.prototype.can_cure = function (game, cards) {
    if (!game.game_graph[this.location].hasResearchStation) {
        return false
    } else {
        if (cards.length === 5 && (new Set(cards).size === 5)) {
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
                return count === 5;
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

        let keys = Object.keys(cards)
        for (let i = 0; i < 4; i++) {
            if (game.cured[keys[i]] === 0 && cards[keys[i]] >= 5) {
                return true
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

Player.prototype.treat = function (game, color) {
    game.game_graph[this.location].cubes[color] -= 1
    game.cubes[color] += 1
    if (game.cured[color] === 1 && game.cubes[color] === 24) {
        game.cured[color] = 2
    }
}

Player.prototype.discard = function (cards) {
    if (cards.every(c => this.hand.has(c))) {
        cards.forEach(c => this.hand.delete(c))
        return true;
    }
    return false;
}

Player.prototype.can_trade = function (game) {
    if (game.game_graph[this.location].players.size <= 1) {
        return false
    } else {
        return [...game.game_graph[this.location].players].some(player => {
            return player.hand.has(this.location)
        })
    }

}

Player.prototype.trade = function (player) {
    if (this.hand.has(this.location)) {
        player.hand.add(this.location)
        this.hand.delete(this.location)
    } else {
        player.hand.delete(this.location)
        this.hand.add(this.location)
    }
}

function PlayerJSON(player) {
    this.role = player.role;
    this.hand = [...player.hand]
    this.location = player.location
    this.id = player.id
};

module.exports = {
    Player: Player,
    PlayerJSON: PlayerJSON
};