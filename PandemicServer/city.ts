import { CityData } from "data/cities";
import { Game } from "./game";
import { Player } from "./player";
import { Client } from "pandemiccommon/dist/out-tsc/";

export const ColorsIndex = {
  blue: 0,
  red: 1,
  black: 2,
  yellow: 3,
};

export class City {
  cubes: Client.Cubes;
  neighbors: Set<City>;
  hasResearchStation: boolean;
  players: Set<Player>;
  index: number;
  constructor(
    public name: string,
    public location: [number, number],
    public color: Client.Color,
    index: number
  ) {
    this.name = name;
    this.color = color;
    this.location = location;
    this.cubes = {
      blue: 0,
      red: 0,
      black: 0,
      yellow: 0,
    };
    this.neighbors = new Set();
    this.hasResearchStation = name === "Atlanta" ? true : false;
    this.players = new Set();
    this.index = index;
  }

  add_neighbor(neighbor: City) {
    this.neighbors.add(neighbor);
  }

  infect_condition(game: Game, color: Client.Color, initialization = false) {
    if (game.cured[color] === 2) {
      game.log.push(
        `${this.name}'s infection prevented because ${color} is eradicated`
      );
      return false;
    } else {
      let shouldInfect = true;
      let players = [...this.players];
      for (let i = 0; i < players.length; i++) {
        if (
          (game.cured[color] === 1 && players[i].role === Client.Roles.Medic) ||
          (!initialization &&
            players[i].role === Client.Roles.QuarantineSpecialist)
        ) {
          shouldInfect = false;
          game.log.push(
            `${this.name}'s infection prevented because ${players[i]} is a Quarantine Specialist or Medic`
          );
          break;
        }
      }

      if (shouldInfect) {
        let neighbors = [...this.neighbors];

        for (let i = 0; i < neighbors.length; i++) {
          let neighbor_players = [...neighbors[i].players];
          for (let j = 0; j < neighbor_players.length; j++) {
            if (
              !initialization &&
              neighbor_players[j].role === Client.Roles.QuarantineSpecialist
            ) {
              game.log.push(
                `${this.name}'s infection prevented because ${neighbor_players[j]} is a Quarantine Specialist`
              );
              shouldInfect = false;
              break;
            }
          }
        }
      }

      return shouldInfect;
    }
  }

  infect(
    game: Game,
    color = this.color,
    visited = new Set(),
    initialization = false
  ) {
    if (this.infect_condition(game, color, initialization)) {
      if (!initialization) {
        game.log.push(`${this.name} is infected`);
      }
      if (this.cubes[color] < 3) {
        game.cubes[color] -= 1;
        this.cubes[color] += 1;
        if (game.cubes[color] < 0) {
          game.lose_game_cubes(color);
          return false;
        }
        return true;
      } else {
        visited.add(this);
        let end = game.outbreak();
        game.log.push(`Outbreak at ${this.name}`);
        this.neighbors.forEach((neighbor) => {
          if (!visited.has(neighbor)) {
            end = neighbor.infect(game, color, visited, initialization) && end; //want to always infect first
          }
        });
        return end;
      }
    } else {
      return true;
    }
  }

  infect_epidemic(game: Game) {
    if (this.infect_condition(game, this.color)) {
      let original_cubes = this.cubes[this.color];
      this.cubes[this.color] = 3;
      game.cubes[this.color] -= this.cubes[this.color] - original_cubes;
      if (game.cubes[this.color] < 0) {
        game.lose_game_cubes(this.color);
        return false;
      }
      return true;
    }
    return true;
  }

  static load(cities: CityData[]) {
    const game_graph: Record<string, City> = {};

    cities.forEach((data, index) => {
      game_graph[data.name] = new City(
        data.name,
        data.location,
        data.color,
        index
      );
    });

    cities.forEach((data) => {
      data.adjacent.forEach((neighbor) => {
        game_graph[data.name].add_neighbor(game_graph[neighbor]);
      });
    });

    return game_graph;
  }
}

/*
City.toGeoJSON = function (game_graph) {
    let g = {
        "type": "FeatureCollection",
        "features": []
    }
    Object.values(game_graph).forEach(c => {
        let f = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": c.location
            },
            "properties": {
                "name": c.name
            }
        }
        g['features'].push(f)
    })
    return g
}*/

export class CityJSON implements Client.City {
  name: string;
  color: Client.Color;
  location: [number, number];
  cubes: Client.Cubes;
  hasResearchStation: boolean;
  players: number[];
  index: number;
  neighbors: number[];
  constructor(city: City) {
    this.name = city.name;
    this.color = city.color;
    this.location = city.location;
    this.cubes = city.cubes;
    this.hasResearchStation = city.hasResearchStation;
    this.players = [...city.players].map((p) => p.id);
    this.index = city.index;
    this.neighbors = [...city.neighbors].map((i) => i.index);
  }
}
