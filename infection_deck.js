function InfectionDeck(cities, rng) {
    this.rng = rng;
    this.facedown_deck = cities.map(city => city.name);
    this.shuffle(this.facedown_deck);
    this.faceup_deck = [];
};

InfectionDeck.prototype.shuffle = function(array) {
    let m = array.length, t, i;
    
    // While there remain elements to shuffle…
    while (m) {
    
        // Pick a remaining element…
        i = Math.floor(this.rng() * m--);
    
        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
};

InfectionDeck.prototype.flip_card = function() {
    let card = this.facedown_deck.pop()
    this.faceup_deck.push(card)
    return card;
};

InfectionDeck.prototype.intensify = function() {
    this.shuffle(this.facedown_deck);
    this.shuffle(this.faceup_deck);
    this.facedown_deck = [...this.facedown_deck, ...this.faceup_deck]
    this.faceup_deck = []
};

// export the class
module.exports = {
    InfectionDeck: InfectionDeck,
};