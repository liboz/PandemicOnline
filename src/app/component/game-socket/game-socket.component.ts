import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../service/api.service';
import { GameState } from "../game/game.component"

import io from "socket.io-client";

@Component({
  selector: 'app-game-socket',
  templateUrl: './game-socket.component.html',
  styleUrls: ['./game-socket.component.styl']
})
export class GameSocketComponent implements OnInit {

  constructor(private route: ActivatedRoute, private api: ApiService) { }
  game: any;
  socket: any;
  ngOnInit() {
    let match_name = this.route.snapshot.paramMap.get('match_name');

    this.api.getGames(match_name).subscribe(result => {
      this.game = result
      this.socket = io(`http://localhost:3000/`, {
        transports: ['websocket']
      });

      this.socket.emit('join', match_name, () => {
        console.log(`joined ${match_name} succesfully`)
      })

      this.socket.on("move successful", data => {
        this.game = data
      });

      this.socket.on("build successful", data => {
        this.game = data
      });

      this.socket.on("treat successful", data => {
        this.game = data
      });

      this.socket.on("discover successful", (data, color) => {
        window.alert(`Cure for ${color} was discovered`)
        this.game = data
      });

      this.socket.on("eradicated", color => {
        window.alert(`${color} was eradicated`)
      });


      this.socket.on("update game state", data => {
        this.game = data
      })

      this.socket.on('discard cards', data => {
        this.game.game_state = GameState.DiscardingCard;
        console.log('discarding cards!');
      })

      this.socket.on("epidemic", data => {
        window.alert(`${data} infected by Epidemic`)
      });

      this.socket.on("invalid action", data => {
        window.alert(data)
      });

      this.socket.on("game initialized", data => {
        this.game = data
        console.log(data)
      });
    })
  }

}
