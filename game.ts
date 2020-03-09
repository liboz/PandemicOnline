import {
  Cubes,
  Player as PlayerJson,
  CityData,
  Player,
  Color,
  GameJson
} from "./types";
import { Socket } from "socket.io";

const city = require("./city");
const infection = require("./infection_deck");
const seedrandom = require("seedrandom");
const player_deck = require("./player_deck");
const player = require("./player");

import { Roles, GameState } from "./types";
import { City, CityJSON } from "./city";

const GameDifficulty = {
  4: "Introductory",
  5: "Standard",
  6: "Heroic"
};

export class Game {
  game_graph: Record<string, City>;
  outbreak_counter: number;
  infection_rate_index: number;
  infection_rate: number[];
  infection_deck: any;
  players: Player[];
  initial_cards_for_players: any[];
  player_deck: any;
  research_stations: Set<string>;
  cured: Cubes;
  cubes: Cubes;
  player_index: number;
  turns_left: number;
  game_state: GameState;
  log: string[];
  difficulty: any;
  rng: any;
  must_discard_index: number;

  constructor(
    cities: CityData[],
    num_players: number,
    filtered_players: string[],
    roles: Roles[],
    num_epidemics: number,
    rng = seedrandom()
  ) {
    this.game_graph = city.City.load(cities);
    this.outbreak_counter = 0;
    this.infection_rate_index = 0;
    this.infection_rate = [2, 2, 2, 3, 3, 4, 4];
    this.rng = rng;
    this.infection_deck = new infection.InfectionDeck(cities, this.rng);
    this.players = [];
    for (let i = 0; i < num_players; i++) {
      this.players.push(new player.Player(i, filtered_players[i], roles[i]));
    }
    this.players.forEach(player => {
      this.game_graph[player.location].players.add(player);
    });
    this.initial_cards_for_players = [];
    this.player_deck = new player_deck.PlayerDeck(
      cities,
      [],
      num_epidemics,
      this.rng,
      this
    );
    for (let i = 0; i < this.initial_cards_for_players.length; i++) {
      this.players[i % this.players.length].hand.add(
        this.initial_cards_for_players[i]
      );
    }

    this.research_stations = new Set(["Atlanta"]);
    this.cured = {
      // 0 = uncured, 1 = cured, 2 = eradicated
      blue: 0,
      red: 0,
      black: 0,
      yellow: 0
    };
    this.cubes = {
      blue: 24,
      red: 24,
      black: 24,
      yellow: 24
    };
    this.player_index = 0;
    this.turns_left = 4;
    this.game_state = GameState.NotStarted;
    this.log = [];
    this.difficulty = num_epidemics;
  }

  outbreak() {
    this.outbreak_counter += 1;
    if (this.outbreak_counter === 8) {
      this.log.push("Game Lost due to outbreak counter exceeding 8");
      return false;
    }
    return true;
  }

  epidemic(io: SocketIO.Server = null, match_name: string) {
    this.infection_rate_index += 1;
    let card = this.infection_deck.infect_epidemic();
    this.log.push(`${card} was infected in an epidemic`);
    if (io) {
      io.in(match_name).emit("epidemic", card);
    }
    if (!this.game_graph[card].infect_epidemic(this)) {
      this.lose_game();
      console.log("lost during an epidemic");
    }
    this.infection_deck.intensify();
  }

  infect_stage() {
    for (let i = 0; i < this.infection_rate[this.infection_rate_index]; i++) {
      let card = this.infection_deck.flip_card();
      if (!this.game_graph[card].infect(this)) {
        this.lose_game();
        console.log("lost during an infect stage");
      }
    }
  }

  initialize_board() {
    if (this.game_state === GameState.NotStarted) {
      for (let i = 2; i >= 0; i--) {
        // do all 3 cube infections, then 2 cube etc
        for (let j = 0; j < 3; j++) {
          let card = this.infection_deck.flip_card();
          for (let k = 0; k <= i; k++) {
            //# of cubes to infect based on index i
            let city = this.game_graph[card];
            city.infect(this, city.color, new Set(), true);
          }
        }
      }
      this.game_state = GameState.Ready;
    }
  }

  lose_game() {
    this.game_state = GameState.Lost;
  }

  lose_game_draw() {
    this.lose_game();
    this.log.push(
      "Game Lost due to insufficient number of cards left in the Player Deck"
    );
  }

  lose_game_cubes(color: Color) {
    this.lose_game();
    this.log.push(`Game Lost due to insufficient number of ${color} cubes`);
  }

  win_game() {
    this.game_state = GameState.Won;
  }

  next_player() {
    this.player_index += 1;
    if (this.player_index == this.players.length) {
      this.player_index = 0;
    }
    this.log.push(`It is now Player ${this.player_index}'s turn`);
  }

  decrement_turn() {
    if (this.turns_left === 0) {
      return false;
    }
    this.turns_left -= 1;
    if (this.turns_left === 0) {
      return false;
    } else {
      return true;
    }
  }

  use_turn(socket: Socket, io: SocketIO.Server, match_name: string) {
    if (!this.decrement_turn()) {
      // TODO add to separate discard of after share and from drawing in end turn
      this.turn_end(socket, io, match_name);
    } else {
      io.in(match_name).emit("update game state", this.toJSON());
      for (let player of this.players) {
        if (player.hand.size > player.hand_size_limit) {
          this.game_state = GameState.DiscardingCard;
          this.must_discard_index = player.id;
          this.log.push(`Player ${player.id} is discarding cards`);
          // Send notification of discard to other players
          io.emit("discard cards", this.must_discard_index);
          break;
        }
      }
    }
  }

  turn_end(socket: Socket, io: SocketIO.Server, match_name: string) {
    for (let i = 0; i < 2; i++) {
      let card = this.players[this.player_index].draw(this);
      if (card === "Epidemic") {
        this.players[this.player_index].hand.delete(card);
        this.epidemic(io, match_name);
      }
    }

    io.in(match_name).emit("update game state", this.toJSON());
    if (this.game_state === GameState.Ready) {
      let next_turn = true;
      for (let player of this.players) {
        if (player.hand.size > player.hand_size_limit) {
          this.game_state = GameState.DiscardingCard;
          this.must_discard_index = player.id;
          this.log.push(`Player ${player.id} is discarding cards`);
          // Send notification of discard to other players
          io.emit("discard cards", this.must_discard_index);
          next_turn = false;
          break;
        }
      }

      if (next_turn) {
        this.infect_stage();
        this.next_player();
        this.turns_left = 4;
        io.in(match_name).emit("update game state", this.toJSON());
      }
    }
  }

  pass_turn(socket: Socket, io: SocketIO.Server, match_name: string) {
    while (this.decrement_turn()) {}
    if (socket) {
      this.turn_end(socket, io, match_name);
    }
  }

  toJSON() {
    return new GameJSON(this);
  }
}

class GameJSON implements GameJson {
  game_graph: CityJSON[];
  game_graph_index: { [key: string]: number };
  outbreak_counter: number;
  infection_rate_index: number;
  infection_rate: number[];
  faceup_deck: string[];
  players: PlayerJson[];
  research_stations: string[];
  cured: Cubes;
  cubes: Cubes;
  game_state: GameState;
  player_index: number;
  turns_left: number;
  valid_final_destinations: number[];
  can_charter_flight: boolean;
  can_operations_expert_move: boolean;
  can_build_research_station: boolean;
  can_cure: boolean;
  cards_needed_to_cure: number;
  can_treat: boolean;
  can_take: boolean;
  can_give: boolean;
  player_deck_cards_remaining: number;
  log: string[];
  difficulty: number;
  must_discard_index: number;
  constructor(game: Game) {
    if (game === null) {
      return null;
    }
    this.game_graph = Object.values(game.game_graph).map(
      c => new city.CityJSON(c)
    );
    this.game_graph_index = this.game_graph.reduce(function(
      map: Record<string, number>,
      city,
      index
    ) {
      map[city.name] = index;
      return map;
    },
    {});
    this.outbreak_counter = game.outbreak_counter;
    this.infection_rate_index = game.infection_rate_index;
    this.infection_rate = [2, 2, 2, 3, 3, 4, 4];
    this.faceup_deck = game.infection_deck.faceup_deck;
    this.players = game.players.map(p => new player.PlayerJSON(p, game));

    this.research_stations = [...game.research_stations];
    this.cured = game.cured;
    this.cubes = game.cubes;
    this.game_state = game.game_state;
    this.player_index = game.player_index;
    this.turns_left = game.turns_left;
    if (game.game_state !== GameState.NotStarted) {
      this.valid_final_destinations = game.players[
        game.player_index
      ].get_valid_final_destinations(game);
      this.can_charter_flight = game.players[
        game.player_index
      ].canCharterFlight();
      this.can_operations_expert_move = game.players[
        game.player_index
      ].canOperationsExpertMove(game);
      this.can_build_research_station = game.players[
        game.player_index
      ].can_build_research_station(game);
      this.can_cure = game.players[game.player_index].can_hand_cure(game);
      this.cards_needed_to_cure =
        game.players[game.player_index].role === Roles.Scientist ? 4 : 5;
      this.can_treat = game.players[game.player_index].can_treat(game);
      this.can_take = game.players[game.player_index].can_take(game);
      this.can_give = game.players[game.player_index].can_give(game);
      this.player_deck_cards_remaining = game.player_deck.deck.length;
      this.log = game.log;
      this.difficulty = game.difficulty;
    }
    if (game.game_state === GameState.DiscardingCard) {
      this.must_discard_index = game.must_discard_index;
    }
  }
}

function GameMap(cities: CityData) {
  let game_graph = city.City.load(cities);
  this.game_graph = Object.values(game_graph).map(c => new city.CityJSON(c));
  this.game_state = GameState.NotStarted;
}

module.exports = {
  Game: Game,
  GameJSON: GameJSON,
  GameMap: GameMap,
  GameDifficulty: GameDifficulty
};
