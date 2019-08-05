const colors = {
    BLUE: 'blue',
    RED: 'red',
    BLACK: 'black',
    YELLOW: 'yellow'
}

function City(name, location, color) {
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
    this.hasResearchStation = true ? name === 'Atlanta' : false
};

City.prototype.addNeighbor = function(neighbor) {
    this.neighbors.add(neighbor)
};

City.prototype.infect = function(game, color = this.color, visited = new Set()) {
    if (this.cubes[color] < 3) {
        this.cubes[color] += 1
    } else {
        visited.add(this);
        game.outbreak();
        //console.log({'outbreak': this.name});
        this.neighbors.forEach((neighbor) => {
            if (!visited.has(neighbor)) {
                neighbor.infect(game, color, visited);
            }
            
        })
    }
};

City.prototype.infect_epidemic = function() {
    this.cubes[this.color] = 3;
};

City.load = function(cities) {
    const game_graph = {}

    cities.forEach((data) => {
        game_graph[data.name] = new City(data.name, data.location, data.color);
    })

    cities.forEach((data) => {
        data.adjacent.forEach((neighbor) => {
            game_graph[data.name].addNeighbor(game_graph[neighbor]);
        })
    })

    return game_graph
}

module.exports = {
    City: City,
    Colors: colors
};