
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
	res.send(curr_game)
})

//Listen on port 3000
const server = app.listen(3000)

const io = socketIO(server);
io.set('transports', ['websocket']);


io.on('connection', function (socket) {
	console.log('a user connected');
	curr_game = new game.Game(cities)
	socket.emit("new game", curr_game);
	socket.on('start game', function () {
		console.log('start game');
		curr_game.initialize_board()
		socket.emit("game initialized", curr_game);
	});
	socket.on('disconnect', function () {
		console.log('user disconnected');
		curr_game = null
	});
});