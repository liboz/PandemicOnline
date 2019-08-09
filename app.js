
const express = require('express')
const app = express()
const seedrandom = require('seedrandom');

//middlewares
app.use(express.static('public'))


//routes
app.get('/', (req, res) => {
	res.send("hello world")
})

//Listen on port 3000
server = app.listen(3000)


const cities = require('./data/cities')
const game = require('./game')

const games = []
let myrng = seedrandom();
games.push(new game.Game(cities, myrng))
//console.log(games[0])

function play(game) {
	game.initialize_board()
	while (true) {

	}
};