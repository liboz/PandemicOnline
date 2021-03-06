import { CityData } from "data/cities";
import { City, CityJSON } from "./city";
import { InfectionDeck } from "./infection_deck";
import { Player, PlayerJSON } from "./player";
import { PlayerDeck } from "./player_deck";
import { Client } from "pandemiccommon/dist/out-tsc/";
import { ClientWebSocket } from "./client_websocket";
const seedrandom = require("seedrandom");

export const EventName = Client.EventName;
export class Game {
  game_graph: Record<string, City>;
  outbreak_counter: number;
  infection_rate_index: number;
  infection_rate: number[];
  infection_deck: InfectionDeck;
  players: Player[];
  initial_cards_for_players: string[];
  player_deck: PlayerDeck;
  research_stations: Set<string>;
  cured: Client.Cubes;
  cubes: Client.Cubes;
  player_index: number;
  turns_left: number;
  game_state: Client.GameState;
  log: string[];
  difficulty: number;
  rng: seedrandom.prng;
  must_discard_index: number;
  one_quiet_night_active: boolean = false;
  top_6_infection_cards?: string[];
  forecasting_player_index?: number;

  constructor(
    cities: CityData[],
    num_players: number,
    filtered_players: string[],
    roles: Client.Roles[],
    num_epidemics: number = 4,
    rng = seedrandom()
  ) {
    this.game_graph = City.load(cities);
    this.outbreak_counter = 0;
    this.infection_rate_index = 0;
    this.infection_rate = [2, 2, 2, 3, 3, 4, 4];
    this.rng = rng;
    this.infection_deck = new InfectionDeck(cities, this.rng);
    this.players = [];
    for (let i = 0; i < num_players; i++) {
      this.players.push(new Player(i, filtered_players[i], roles[i]));
    }
    this.players.forEach((player) => {
      this.game_graph[player.location].players.add(player);
    });
    this.initial_cards_for_players = [];
    const events = Object.values(Client.EventCard);
    this.player_deck = new PlayerDeck(
      cities,
      events,
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
      yellow: 0,
    };
    this.cubes = {
      blue: 24,
      red: 24,
      black: 24,
      yellow: 24,
    };
    this.player_index = 0;
    this.turns_left = 4;
    this.game_state = Client.GameState.NotStarted;
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

  epidemic(clientWebSocket: ClientWebSocket = null, match_name: string = null) {
    this.player_deck.deleteCardFromHand(
      this.players[this.player_index].hand,
      "Epidemic"
    );
    this.infection_rate_index += 1;
    const card = this.infection_deck.infect_epidemic();
    this.log.push(`${card} was infected in an epidemic`);
    if (clientWebSocket) {
      clientWebSocket.sendMessageToAllInRoom(EventName.Epidemic, card);
    }
    if (!this.game_graph[card].infect_epidemic(this)) {
      this.lose_game();
      console.log("lost during an epidemic");
    }
    this.infection_deck.intensify();
  }

  infect_stage() {
    if (!this.one_quiet_night_active) {
      for (let i = 0; i < this.infection_rate[this.infection_rate_index]; i++) {
        const card = this.infection_deck.flip_card();
        if (!this.game_graph[card].infect(this)) {
          this.lose_game();
          console.log("lost during an infect stage");
        }
      }
    } else {
      console.log("infect stage skipped due to one quiet night being active");
      this.log.push("infect stage skipped due to one quiet night being active");
      this.one_quiet_night_active = false;
    }
  }

  initialize_board() {
    if (this.game_state === Client.GameState.NotStarted) {
      for (let i = 2; i >= 0; i--) {
        // do all 3 cube infections, then 2 cube etc
        for (let j = 0; j < 3; j++) {
          const card = this.infection_deck.flip_card();
          const city = this.game_graph[card];
          for (let k = 0; k <= i; k++) {
            //# of cubes to infect based on index i
            city.infect(this, city.color, new Set(), true);
          }
          this.log.push(`${city.name} infected with ${i + 1} cubes`);
        }
      }
      this.game_state = Client.GameState.Ready;
    }
  }

  lose_game() {
    this.game_state = Client.GameState.Lost;
  }

  lose_game_draw() {
    this.lose_game();
    this.log.push(
      "Game Lost due to insufficient number of cards left in the Player Deck"
    );
  }

  lose_game_cubes(color: Client.Color) {
    this.lose_game();
    this.log.push(`Game Lost due to insufficient number of ${color} cubes`);
  }

  win_game() {
    this.game_state = Client.GameState.Won;
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

  use_turn(clientWebSocket: ClientWebSocket, match_name: string) {
    if (!this.decrement_turn()) {
      // TODO add to separate discard of after share and from drawing in end turn
      this.turn_end(clientWebSocket, match_name);
    } else {
      clientWebSocket.sendMessageToAllInRoom(
        EventName.UpdateGameState,
        this.toJSON()
      );
      this.checkDiscardingNeeded(clientWebSocket);
    }
  }

  checkDiscardingNeeded(clientWebSocket: ClientWebSocket) {
    for (let player of this.players) {
      if (player.hand.size > player.hand_size_limit) {
        this.game_state = Client.GameState.DiscardingCard;
        this.must_discard_index = player.id;
        this.log.push(`Player ${player.id} is discarding cards`);
        // Send notification of discard to all players
        clientWebSocket.sendMessageToAllInRoom(
          EventName.DiscardCards,
          this.must_discard_index
        );
        return false;
      }
    }
    return true;
  }

  turn_end(clientWebSocket: ClientWebSocket, match_name: string) {
    for (let i = 0; i < 2; i++) {
      let card = this.players[this.player_index].draw(this);
      if (card === "Epidemic") {
        this.epidemic(clientWebSocket, match_name);
      }
    }

    clientWebSocket.sendMessageToAllInRoom(
      EventName.UpdateGameState,
      this.toJSON()
    );
    if (this.game_state === Client.GameState.Ready) {
      let next_turn = this.checkDiscardingNeeded(clientWebSocket);

      if (next_turn) {
        this.infect_stage();
        this.next_player();
        this.turns_left = 4;
        clientWebSocket.sendMessageToAllInRoom(
          EventName.UpdateGameState,
          this.toJSON()
        );
      }
    }
  }

  pass_turn(
    clientWebSocket: ClientWebSocket = null,
    match_name: string = null
  ) {
    while (this.decrement_turn()) {}
    if (clientWebSocket) {
      this.turn_end(clientWebSocket, match_name);
    }
  }

  addResearchStation(location: string) {
    this.game_graph[location].hasResearchStation = true;
    this.research_stations.add(location);
  }

  toJSON() {
    return new GameJSON(this);
  }
}

class GameJSON implements Client.Game {
  game_graph: Client.City[];
  game_graph_index: { [key: string]: number };
  outbreak_counter: number;
  infection_rate_index: number;
  infection_rate: number[];
  infection_faceup_deck: string[];
  players: Client.Player[];
  research_stations: string[];
  cured: Client.Cubes;
  cubes: Client.Cubes;
  game_state: Client.GameState;
  player_index: number;
  turns_left: number;
  valid_final_destinations: number[];
  valid_dispatcher_final_destinations?: Record<number, number[]>;
  can_charter_flight: boolean;
  can_operations_expert_move: boolean;
  can_build_research_station: boolean;
  can_cure: boolean | string;
  cards_needed_to_cure: number;
  can_treat: boolean;
  can_take: boolean;
  can_give: boolean;
  player_deck_discard: string[];
  player_deck_cards_remaining: number;
  log: string[];
  difficulty: number;
  must_discard_index: number;
  one_quiet_night_active: boolean;
  top_6_infection_cards?: string[];
  forecasting_player_index: number;
  constructor(game: Game) {
    if (game === null) {
      return null;
    }
    this.game_graph = Object.values(game.game_graph).map(
      (c) => new CityJSON(c)
    );
    this.game_graph_index = this.game_graph.reduce(function (
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
    this.infection_faceup_deck = game.infection_deck.faceup_deck;
    this.players = game.players.map((p) => new PlayerJSON(p, game));

    this.research_stations = [...game.research_stations];
    this.cured = game.cured;
    this.cubes = game.cubes;
    this.game_state = game.game_state;
    this.player_index = game.player_index;
    this.turns_left = game.turns_left;
    if (game.game_state !== Client.GameState.NotStarted) {
      this.valid_final_destinations = game.players[
        game.player_index
      ].get_valid_final_destinations(game);

      const maybeDispatcher = game.players.filter(
        (player) => player.role === Client.Roles.Dispatcher
      );
      if (maybeDispatcher.length > 0) {
        this.valid_dispatcher_final_destinations = maybeDispatcher[0].get_valid_dispatcher_final_destinations(
          game
        );
      }

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
        game.players[game.player_index].role === Client.Roles.Scientist ? 4 : 5;
      this.can_treat = game.players[game.player_index].can_treat(game);
      this.can_take = game.players[game.player_index].can_take(game);
      this.can_give = game.players[game.player_index].can_give(game);
      this.player_deck_discard = game.player_deck.discard;
      this.player_deck_cards_remaining = game.player_deck.deck.length;
      this.log = [...game.log];
      this.difficulty = game.difficulty;
      this.one_quiet_night_active = game.one_quiet_night_active;
    }
    if (game.game_state === Client.GameState.DiscardingCard) {
      this.must_discard_index = game.must_discard_index;
    }
    if (game.game_state === Client.GameState.Forecasting) {
      this.top_6_infection_cards = game.top_6_infection_cards;
      this.forecasting_player_index = game.forecasting_player_index;
    }
  }
}

export class GameMap {
  game_state: Client.GameState;
  game_graph: Client.City[];
  constructor(cities: CityData[]) {
    const game_graph = City.load(cities);
    this.game_graph = Object.values(game_graph).map((c) => new CityJSON(c));
    this.game_state = Client.GameState.NotStarted;
  }
}
