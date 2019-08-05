const random = require('./random');
const Denque = require("denque");

function InfectionDeck(cities, rng) {
    this.rng = rng;
    this.facedown_deck = cities.map(city => city.name);
    this.shuffle(this.facedown_deck);
    this.facedown_deck = new Denque(this.facedown_deck);
    this.faceup_deck = [];
};

InfectionDeck.prototype.shuffle = function(array) {
    random.shuffle(array, this.rng);
};

InfectionDeck.prototype.flip_card = function() {
    let card = this.facedown_deck.pop()
    this.faceup_deck.push(card)
    return card;
};

InfectionDeck.prototype.infect_epidemic = function()  {
    let card = this.facedown_deck.shift()
    this.faceup_deck.push(card);
    return card;
}

InfectionDeck.prototype.intensify = function() {
    this.shuffle(this.faceup_deck);
    this.faceup_deck.forEach(card => {
        this.facedown_deck.push(card)
    })
    this.faceup_deck = []
};

module.exports = {
    InfectionDeck: InfectionDeck,
};