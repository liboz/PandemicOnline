
const express = require('express')
const app = express()


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
games.push(new game.Game(cities))
console.log(games[0])