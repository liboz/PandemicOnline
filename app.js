
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
		console.log('start game');
		curr_game.initialize_board()
		socket.emit("game initialized", curr_game.toJSON());
	});
	socket.on('move', function (data, callback) {
		console.log(`move to ${data}`);
		callback()
		if (curr_game.players[curr_game.player_index].move(curr_game.game_graph, data)) {
			curr_game.use_turn()
			socket.emit(`move successful`, curr_game.toJSON());
		} else {
			socket.emit('error', `${data} is an invalid location to move to`);
		}

	});

	socket.on('disconnect', function () {
		console.log('user disconnected');
		curr_game = null
	});
});