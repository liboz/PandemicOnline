function Player(role, location = "Atlanta") {
    this.role = role;
    this.hand = new Set()
    this.location = location
};

Player.prototype.move = function (game_graph, final_destination) {
    if (game_graph[this.location].neighbors.has(game_graph[final_destination]) || // drive/ferry
        game_graph[this.location].hasResearchStation && game_graph[final_destination].hasResearchStation) { //shuttle
        this.location = final_destination;
        return true
    } else if (this.hand.has(final_destination)) { // direct
        this.hand.delete(final_destination)
        this.location = final_destination;
        return true
    } else if (this.hand.has(this.location)) { // charter
        this.hand.delete(this.location)
        this.location = final_destination;
        return true
    } else {
        return false;
    }
};

Player.prototype.draw = function (game) {
    let card = game.player_deck.flip_card()
    if (card === undefined) {
        game.lose_game();
    }
    this.hand.add(card)

}

Player.prototype.canBuildResearchStation = function (game) {
    return !game.game_graph[this.location].hasResearchStation && this.hand.has(this.location)
}

Player.prototype.buildResearchStation = function (game) {
    this.hand.delete(this.location)
    game.game_graph[this.location].hasResearchStation = true
    game.research_stations.add(this.location)
}

Player.prototype.canCure = function (game, cards) {
    if (!game.game_graph[this.location].hasResearchStation) {
        return false
    } else {
        if (cards.length === 5) {
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

Player.prototype.canTreat = function (game) {
    return Object.values(game.game_graph[this.location].cubes).reduce((a, b) => a + b, 0) > 0
}

Player.prototype.treat = function (game, color) {
    game.game_graph[this.location].cubes[color] -= 1
    game.cubes[color] += 1
    if (game.cured[color] === 1 && game.cubes[color] === 24) {
        game.cured[color] = 2
    }
}

Player.prototype.discard = function(cards) {
    if (cards.every(c => this.hand.has(c))) {
        cards.forEach(c => this.hand.delete(c))
        return true;
    }
    return false;
}

module.exports = {
    Player: Player,
};