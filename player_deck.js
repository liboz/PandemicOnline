const random = require('./random');

function PlayerDeck(cities, events, num_epidemics, rng) {
    this.rng = rng;
    this.num_epidemics = num_epidemics;
    this.base_deck = [...cities.map(city => city.name), ...events];
    this.shuffle(this.base_deck);
    this.partitions = this.partition_deck()
    this.shuffle(this.partitions)
    this.partitions.forEach(p => {
        p.push("Epidemic");
        this.shuffle(p);
    })
    this.deck = [].concat.apply([], this.partitions)
};

PlayerDeck.prototype.partition_deck = function () {
    let size_partition = Math.trunc(this.base_deck.length / this.num_epidemics);
    let partitions = []
    for (var i = 0; i < this.num_epidemics - 1; i++) {
        partitions.push(this.base_deck.slice(i * size_partition, (i + 1) * size_partition))
    }
    partitions.push(this.base_deck.slice(i * size_partition))
    return partitions
}

PlayerDeck.prototype.shuffle = function (array) {
    random.shuffle(array, this.rng);
};

PlayerDeck.prototype.flip_card = function () {
    let card = this.deck.pop()
    return card;
};

module.exports = {
    PlayerDeck: PlayerDeck,
};