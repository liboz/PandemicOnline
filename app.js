
const express = require('express')
const app = express()
const socketIO = require('socket.io')
var cors = require('cors')


const seedrandom = require('seedrandom');
const cities = require('./data/cities')
const game = require('./game')

let curr_game = null

//console.log(games[0])

//middlewares
app.use(express.static('public'))

app.use(cors())

//routes
app.get('/', (req, res) => {
	res.send(curr_game === null ? null : curr_game.toJSON())
})

//Listen on port 3000
const server = app.listen(3000)

const io = socketIO(server);
io.set('transports', ['websocket']);

let seeded = seedrandom('test!')
io.on('connection', function (socket) {
	console.log('a user connected');
	curr_game = new game.Game(cities, 2, seeded)
	socket.emit("new game", curr_game.toJSON());
	socket.on('start game', function () {
		if (curr_game.game_state === game.GameState.NotStarted) {
			console.log('start game');
			curr_game.initialize_board()
			socket.emit("game initialized", curr_game.toJSON());
		} else {
			console.log(`start game with ${curr_game.game_state}`);
		}
	});
	socket.on('move', function (data, callback) {
		console.log(`Player ${curr_game.player_index}: move to ${data}`);
		if (curr_game.game_state === game.GameState.Ready && curr_game.turns_left !== 0) {
			if (curr_game.players[curr_game.player_index].move(curr_game.game_graph, data)) {
				callback()
				socket.emit(`move successful`, curr_game.toJSON());
				curr_game.use_turn(socket)
			} else {
				socket.emit('invalid action', `${data} is an invalid location to move to`);
			}
		} else {
			socket.emit('invalid action', `Move to ${data} is an invalid action`);
		}
	});

	socket.on('build', function () {
		console.log(`Player ${curr_game.player_index}: build on ${curr_game.players[curr_game.player_index].location}`);
		if (curr_game.game_state === game.GameState.Ready && curr_game.turns_left !== 0) {
			if (curr_game.players[curr_game.player_index].can_build_research_station(curr_game)) {
				curr_game.players[curr_game.player_index].build_research_station(curr_game)
				socket.emit(`build successful`, curr_game.toJSON());
				curr_game.use_turn(socket)
			} else {
				socket.emit('invalid action', `Player ${curr_game.player_index} cannot build on ${curr_game.players[curr_game.player_index].location} right now`);
			}
		} else {
			socket.emit('invalid action', `Build is an invalid action right now`);
		}
	});

	socket.on('treat', function (color, callback) {
		console.log(`Player ${curr_game.player_index}: treat ${color} at ${curr_game.players[curr_game.player_index].location}`);
		if (curr_game.game_state === game.GameState.Ready && curr_game.turns_left !== 0) {
			if (curr_game.players[curr_game.player_index].can_treat_color(curr_game, color)) {
				curr_game.players[curr_game.player_index].treat(curr_game, color, socket)
				callback()
				socket.emit(`treat successful`, curr_game.toJSON());
				curr_game.use_turn(socket)
			} else {
				socket.emit('invalid action', `It is invalid to treat ${color} at ${curr_game.players[curr_game.player_index].location}`);
			}
		} else {
			socket.emit('invalid action', `Treat ${color} at ${curr_game.players[curr_game.player_index].location} is an invalid action`);
		}
	});

	socket.on('share', function (player_index, card, callback) {
		if (card) { //dispatcher
			console.log(`Player ${curr_game.player_index} and Player ${player_index} trade ${card} at ${curr_game.players[curr_game.player_index].location}`);
		} else {
			console.log(`Player ${curr_game.player_index} and Player ${player_index} trade ${curr_game.players[curr_game.player_index].location}`);
		}

		if (curr_game.game_state === game.GameState.Ready && curr_game.turns_left !== 0) {
			if (!card) {
				if (curr_game.players[curr_game.player_index].can_give(curr_game)
					|| curr_game.players[curr_game.player_index].can_take_from_player(curr_game.players[player_index])) {
					curr_game.players[curr_game.player_index].trade(curr_game.players[player_index])
					callback()
					socket.emit(`share successful`, curr_game.toJSON());
					curr_game.use_turn(socket)
				} else {
					socket.emit('invalid action', `Share with Player ${player_index} at ${curr_game.players[curr_game.player_index].location} is an invalid action`);
				}
			}

		} else {
			if (card) {
				socket.emit('invalid action', `Share with Player ${player_index} at ${curr_game.players[curr_game.player_index].location} the card ${card} is an invalid action`);
			} else {
				socket.emit('invalid action', `Share with Player ${player_index} at ${curr_game.players[curr_game.player_index].location} is an invalid action`);
			}
		}
	});

	socket.on('discover', function (cards, callback) {
		console.log(`Player ${curr_game.player_index}: cure at ${curr_game.players[curr_game.player_index].location} with ${cards}`);
		if (curr_game.game_state === game.GameState.Ready && curr_game.turns_left !== 0) {
			if (curr_game.players[curr_game.player_index].can_cure(curr_game, cards)) {
				curr_game.players[curr_game.player_index].cure(curr_game, cards)
				callback()
				socket.emit(`discover successful`, curr_game.toJSON(), curr_game.game_graph[cards[0]].color);
				curr_game.use_turn(socket)
			} else {
				socket.emit('invalid action', `It is invalid to cure with ${cards} at ${curr_game.players[curr_game.player_index].location}`);
			}
		} else {
			socket.emit('invalid action', `It is invalid to cure with ${cards} at ${curr_game.players[curr_game.player_index].location}`);
		}
	});

	socket.on('pass', function () {
		console.log(`Player ${curr_game.player_index}: pass move`);
		if (curr_game.game_state === game.GameState.Ready && curr_game.turns_left !== 0) {
			curr_game.pass_turn(socket)
		} else {
			socket.emit('invalid action', `Cannot pass turn right now`);
		}
	});

	socket.on('disconnect', function () {
		console.log('user disconnected');
		curr_game = null
	});
});