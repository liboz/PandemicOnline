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

Player.prototype.draw = function(game) {
    let card = game.player_deck.flip_card()
    this.hand.add(card)
}


// export the class
module.exports = {
    Player: Player,
};