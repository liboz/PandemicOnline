import { CityData } from "data/cities";
import { Game } from "game";
import { shuffle } from "./random";

export class PlayerDeck {
  base_deck: string[];
  partitions: string[][];
  deck: string[];
  constructor(
    cities: CityData[],
    events: string[],
    public num_epidemics: number,
    public rng: seedrandom.prng,
    game: Game = null
  ) {
    this.rng = rng;
    this.num_epidemics = num_epidemics;
    this.base_deck = [...cities.map((city) => city.name), ...events];
    this.shuffle(this.base_deck);
    if (game !== null) {
      let num_cards = 0;
      if (game.players.length == 3) {
        num_cards = 9;
      } else {
        num_cards = 8;
      }
      for (let i = 0; i < num_cards; i++) {
        game.initial_cards_for_players.push(this.base_deck.pop());
      }
    }

    this.partitions = this.partition_deck();
    this.shuffle(this.partitions);
    this.partitions.forEach((p) => {
      p.push("Epidemic");
      this.shuffle(p);
    });
    this.deck = [].concat.apply([], this.partitions);
  }
  partition_deck() {
    let size_partition = Math.trunc(this.base_deck.length / this.num_epidemics);
    let partitions = [];
    for (var i = 0; i < this.num_epidemics - 1; i++) {
      partitions.push(
        this.base_deck.slice(i * size_partition, (i + 1) * size_partition)
      );
    }
    partitions.push(this.base_deck.slice(i * size_partition));
    return partitions;
  }

  shuffle(array: any[]) {
    shuffle(array, this.rng);
  }

  flip_card() {
    let card = this.deck.pop();
    return card;
  }
}
