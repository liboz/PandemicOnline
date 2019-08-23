const roles = require('./roles')

const colors = {
    BLUE: 'blue',
    RED: 'red',
    BLACK: 'black',
    YELLOW: 'yellow'
}

const colors_index = {
    blue: 0,
    red: 1,
    black: 2,
    yellow: 3
}

function City(name, location, color, index) {
    this.name = name;
    this.color = color;
    this.location = location;
    this.cubes = {
        'blue': 0,
        'red': 0,
        'black': 0,
        'yellow': 0
    }
    this.neighbors = new Set()
    this.hasResearchStation = name === 'Atlanta' ? true : false
    this.players = new Set()
    this.index = index
};

City.prototype.add_neighbor = function (neighbor) {
    this.neighbors.add(neighbor)
};

City.prototype.infect_condition = function (game, color) {
    if (game.cured[color] === 2) {
        return false
    } else {
        let shouldInfect = true
        let players = [...this.players]
        for (let i = 0; i < players.length; i++) {
            if ((game.cured[color] === 1 && players[i].role === roles.Roles.Medic) || players[i].role === roles.Roles.QuarantineSpecialist) {
                shouldInfect = false
                break;
            }
        }

        if (shouldInfect) {
            let neighbors = [...this.neighbors]

            for (let i = 0; i < neighbors.length; i++) {
                let neighbor_players = [...neighbors[i].players]
                for (let j = 0; j < neighbor_players.length; j++) {
                    if (neighbor_players[j].role === roles.Roles.QuarantineSpecialist) {
                        shouldInfect = false
                        break;
                    }
                }
            }
        }

        return shouldInfect;
    }
}

City.prototype.infect = function (game, color = this.color, visited = new Set()) {
    if (this.infect_condition(game, color)) {
        if (this.cubes[color] < 3) {
            game.cubes[color] -= 1
            this.cubes[color] += 1
            if (game.cubes[color] < 0) {
                console.log("we don't have enough cubes", game.cubes[color])
                return false
            }
            return true
        } else {
            visited.add(this);
            let end = game.outbreak();
            game.log.append(`Outbreak at ${this.name}`)
            this.neighbors.forEach((neighbor) => {
                if (!visited.has(neighbor)) {
                    end = neighbor.infect(game, color, visited) && end; //want to always infect first
                }

            })
            return end;
        }
    } else {
        return true;
    }
};

City.prototype.infect_epidemic = function (game) {
    if (this.infect_condition(game, this.color)) {
        let original_cubes = this.cubes[this.color]
        this.cubes[this.color] = 3;
        game.cubes[this.color] -= this.cubes[this.color] - original_cubes
        if (game.cubes[this.color] < 0) {
            return false
        }
        return true
    }
    return true
};

City.load = function (cities) {
    const game_graph = {}

    cities.forEach((data, index) => {
        game_graph[data.name] = new City(data.name, data.location, data.color, index);
    })

    cities.forEach((data) => {
        data.adjacent.forEach((neighbor) => {
            game_graph[data.name].add_neighbor(game_graph[neighbor]);
        })
    })

    return game_graph
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

function CityJSON(city) {
    this.name = city.name;
    this.color = city.color;
    this.location = city.location;
    this.cubes = city.cubes
    this.hasResearchStation = city.hasResearchStation
    this.players = [...city.players].map(p => p.id)
    this.index = city.index
    this.neighbors = [...city.neighbors].map(i => i.index)
};

module.exports = {
    City: City,
    Colors: colors,
    ColorsIndex: colors_index,
    CityJSON: CityJSON
};