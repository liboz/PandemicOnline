import { CityData } from "data/cities";
import { shuffle } from "./random";
const Denque = require("denque");

export class InfectionDeck {
  facedown_deck: any; // denque doesnt have types (yet?)
  faceup_deck: string[];

  constructor(cities: CityData[], public rng: seedrandom.prng) {
    this.rng = rng;
    this.facedown_deck = cities.map((city) => city.name);
    this.shuffle(this.facedown_deck);
    this.facedown_deck = new Denque(this.facedown_deck);
    this.faceup_deck = [];
  }

  shuffle(array: any[]) {
    shuffle(array, this.rng);
  }

  flip_card() {
    let card = this.facedown_deck.pop();
    this.faceup_deck.push(card);
    return card;
  }

  infect_epidemic() {
    let card = this.facedown_deck.shift();
    this.faceup_deck.push(card);
    return card;
  }

  intensify() {
    this.shuffle(this.faceup_deck);
    this.faceup_deck.forEach((card) => {
      this.facedown_deck.push(card);
    });
    this.faceup_deck = [];
  }
}
