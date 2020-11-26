import { Game } from "./game";
import { Socket } from "socket.io";
import { Client } from "./types";
import { ColorsIndex, City } from "./city";

export class Player {
  hand: Set<string>;
  hand_size_limit: number;
  constructor(
    public id: number,
    public name: string,
    public role: Client.Roles,
    public location = "Atlanta"
  ) {
    this.name = name;
    this.role = role;
    this.hand = new Set();
    this.location = location;
    this.id = id;
    this.hand_size_limit = 7;
  }

  dispatcher_move(
    game: Game,
    other_player: Player,
    final_destination: string,
    socket: NodeJS.EventEmitter = null
  ) {
    if (this.role !== Client.Roles.Dispatcher) {
      return false;
    } else {
      return other_player.move(game, final_destination, this.hand, socket);
    }
  }

  // add dispatcher
  move(
    game: Game,
    final_destination: string,
    player_hand = this.hand,
    socket: NodeJS.EventEmitter = null
  ) {
    let game_graph = game.game_graph;
    if (
      game_graph[this.location].neighbors.has(game_graph[final_destination]) ||
      (game_graph[this.location].hasResearchStation &&
        game_graph[final_destination].hasResearchStation)
    ) {
      // drive/ferry + shuttle
      this.movePiece(game, game_graph, final_destination, socket);
      return true;
    } else if (player_hand.has(final_destination)) {
      // direct
      this.directFlight(game, final_destination, player_hand, socket);
      return true;
    } else if (player_hand.has(this.location)) {
      // charter
      this.charterFlight(game, final_destination, player_hand, socket);
      return true;
    } else {
      return false;
    }
  }

  canDirectFlight(final_destination: string, hand = this.hand) {
    return hand.has(final_destination);
  }

  directFlight(
    game: Game,
    final_destination: string,
    hand: Set<string>,
    socket: NodeJS.EventEmitter
  ) {
    hand.delete(final_destination);
    this.movePiece(game, game.game_graph, final_destination, socket);
  }

  charterFlight(
    game: Game,
    final_destination: string,
    hand: Set<string>,
    socket: NodeJS.EventEmitter
  ) {
    hand.delete(this.location);
    this.movePiece(game, game.game_graph, final_destination, socket);
  }

  canCharterFlight(hand = this.hand) {
    return hand.has(this.location);
  }

  operationsExpertMove(
    game: Game,
    final_destination: string,
    card: string,
    socket: NodeJS.EventEmitter = null
  ) {
    this.hand.delete(card);
    this.movePiece(game, game.game_graph, final_destination, socket);
  }

  canOperationsExpertMoveWithCard(game: Game, card: string) {
    return this.canOperationsExpertMove(game) && this.hand.has(card);
  }

  canOperationsExpertMove(game: Game) {
    return (
      this.role === Client.Roles.OperationsExpert &&
      game.game_graph[this.location].hasResearchStation &&
      this.hand.size > 0
    );
  }

  movePiece(
    game: Game,
    game_graph: Record<string, City>,
    final_destination: string,
    socket: NodeJS.EventEmitter
  ) {
    if (this.role === Client.Roles.Medic) {
      this.medicMoveTreat(game, socket);
    }
    game_graph[this.location].players.delete(this);
    game_graph[final_destination].players.add(this);
    this.location = final_destination;
    if (this.role === Client.Roles.Medic) {
      this.medicMoveTreat(game, socket);
    }
  }

  medicMoveTreat(game: Game, socket: NodeJS.EventEmitter) {
    let colors = Object.keys(game.cured);
    colors.forEach(c => {
      if (game.cured[c] === 1) {
        this.treat(game, c, socket);
      }
    });
  }

  get_valid_final_destinations(game: Game, hand = this.hand) {
    if (game.game_state === Client.GameState.Ready) {
      // note that disptcher can't use operations expert move!
      if (
        this.canCharterFlight(hand) ||
        (hand === this.hand && this.canOperationsExpertMove(game))
      ) {
        //go everywhere!!!
        return Object.values(game.game_graph).map(i => i.index);
      } else {
        let s = new Set(
          [...game.game_graph[this.location].neighbors].map(i => i.index)
        );

        hand.forEach(c => {
          s.add(game.game_graph[c].index);
        });
        if (game.game_graph[this.location].hasResearchStation) {
          game.research_stations.forEach(c => {
            s.add(game.game_graph[c].index);
          });
        }
        s.delete(game.game_graph[this.location].index);
        return [...s];
      }
    } else {
      return [];
    }
  }

  get_valid_dispatcher_final_destinations(
    game: Game
  ): Record<string, number[]> {
    if (game.game_state === Client.GameState.Ready) {
      let result: Record<string, number[]> = {};
      for (let player of game.players) {
        if (player !== this) {
          result[player.id] = player.get_valid_final_destinations(
            game,
            this.hand
          );
        }
      }
      return result;
    } else {
      return {};
    }
  }

  draw(game: Game) {
    let card = game.player_deck.flip_card();
    if (card === undefined) {
      game.lose_game_draw();
    } else {
      this.hand.add(card);
    }
    return card;
  }

  can_build_research_station(game: Game) {
    return (
      !game.game_graph[this.location].hasResearchStation &&
      (this.hand.has(this.location) ||
        this.role === Client.Roles.OperationsExpert)
    );
  }

  build_research_station(game: Game) {
    if (this.role !== Client.Roles.OperationsExpert) {
      this.hand.delete(this.location);
    }
    game.game_graph[this.location].hasResearchStation = true;
    game.research_stations.add(this.location);
  }

  can_cure(game: Game, cards: string[]) {
    if (!game.game_graph[this.location].hasResearchStation) {
      return false;
    } else {
      let cards_needed = this.role === Client.Roles.Scientist ? 4 : 5;
      if (
        cards.length === cards_needed &&
        new Set(cards).size === cards_needed
      ) {
        let color = game.game_graph[cards[0]].color;
        if (game.cured[color] > 0) {
          return false;
        } else {
          let count = 0;
          cards.forEach(card => {
            if (this.hand.has(card) && game.game_graph[card].color === color) {
              count += 1;
            }
          });
          return count === cards_needed;
        }
      }
      return false;
    }
  }

  can_hand_cure(game: Game) {
    if (!game.game_graph[this.location].hasResearchStation) {
      return false;
    } else {
      let cards: Client.Cubes = {
        blue: 0,
        red: 0,
        black: 0,
        yellow: 0
      };
      this.hand.forEach(card => {
        cards[game.game_graph[card].color] += 1;
      });

      let cards_needed = this.role === Client.Roles.Scientist ? 4 : 5;
      let keys = Object.keys(cards);
      for (let i = 0; i < 4; i++) {
        if (game.cured[keys[i]] === 0 && cards[keys[i]] >= cards_needed) {
          return keys[i];
        }
      }
      return false;
    }
  }

  cure(game: Game, cards: string[]) {
    let color = game.game_graph[cards[0]].color;
    cards.forEach(card => {
      this.hand.delete(card);
    });
    game.cured[color] = game.cubes[color] !== 24 ? 1 : 2;
    if (Object.values(game.cured).every(c => c > 0)) {
      game.win_game();
    }
  }

  can_treat(game: Game) {
    return (
      Object.values(game.game_graph[this.location].cubes).reduce(
        (a, b) => a + b,
        0
      ) > 0
    );
  }

  can_treat_color(game: Game, color: string) {
    return game.game_graph[this.location].cubes[color] > 0;
  }

  treat(game: Game, color: string, io: NodeJS.EventEmitter = null) {
    if (game.cured[color] === 1 || this.role === Client.Roles.Medic) {
      game.cubes[color] += game.game_graph[this.location].cubes[color];
      game.game_graph[this.location].cubes[color] = 0;
    } else {
      game.cubes[color] += 1;
      game.game_graph[this.location].cubes[color] -= 1;
    }

    if (game.cured[color] === 1 && game.cubes[color] === 24) {
      if (io) {
        io.emit("eradicated", color);
      }
      game.cured[color] = 2;
    }
  }

  can_discard(cards: string[]) {
    if (Array.isArray(cards)) {
      return (
        this.hand.size - cards.length == this.hand_size_limit &&
        new Set(cards).size === cards.length &&
        cards.every(c => this.hand.has(c))
      );
    }
    return false;
  }

  discard(cards: string[]) {
    if (cards.every(c => this.hand.has(c))) {
      cards.forEach(c => this.hand.delete(c));
      return true;
    }
    return false;
  }

  can_take(game: Game) {
    if (game.game_graph[this.location].players.size <= 1) {
      return false;
    } else {
      return [...game.game_graph[this.location].players].some(player => {
        if (player !== this) {
          return (
            player.hand.has(this.location) ||
            (player.role === Client.Roles.Researcher && player.hand.size > 0)
          );
        }
      });
    }
  }

  can_take_from_player(player: Player, card: string = null) {
    if (this.location !== player.location) {
      return false;
    } else {
      if (card) {
        return (
          player.hand.has(this.location) ||
          (player.role === Client.Roles.Researcher && player.hand.has(card))
        );
      } else {
        return player.hand.has(this.location);
      }
    }
  }

  can_give(game: Game) {
    if (game.game_graph[this.location].players.size <= 1) {
      return false;
    } else {
      return (
        this.hand.has(this.location) ||
        (this.role === Client.Roles.Researcher && this.hand.size > 0)
      );
    }
  }

  can_give_card(game: Game, card: string) {
    return (
      this.can_give(game) &&
      this.role === Client.Roles.Researcher &&
      this.hand.has(card)
    );
  }

  trade(player: Player, card?: string) {
    if (!card) {
      this.tradeCard(player, this.location);
    } else {
      this.tradeCard(player, card);
    }
  }

  tradeCard(player: Player, c: string) {
    if (this.hand.has(c)) {
      player.hand.add(c);
      this.hand.delete(c);
    } else {
      player.hand.delete(c);
      this.hand.add(c);
    }
  }
}

export class PlayerJSON implements Client.Player {
  name: string;
  role: string;
  hand: string[];
  location: string;
  id: number;
  constructor(player: Player, game: Game) {
    this.name = player.name;
    this.role = player.role;
    this.hand = [...player.hand].sort((i, j) => {
      let first_index = ColorsIndex[game.game_graph[i].color];
      let second_index = ColorsIndex[game.game_graph[j].color];
      if (first_index > second_index) {
        return 1;
      }
      if (first_index < second_index) {
        return -1;
      }

      if (i > j) {
        return 1;
      }

      if (i < j) {
        return -1;
      }
    });
    this.location = player.location;
    this.id = player.id;
  }
}