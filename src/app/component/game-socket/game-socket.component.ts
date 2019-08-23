import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../service/api.service';
import { GameState } from "../game/game.component"
import { environment } from '../../../environments/environment';

import { ModalService } from '../../service/modal.service';
import { PlayerInfo } from '../join/join.component';

import { JoinComponent } from '../join/join.component';


import io from "socket.io-client";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-socket',
  templateUrl: './game-socket.component.html',
  styleUrls: ['./game-socket.component.styl']
})
export class GameSocketComponent implements OnInit {

  constructor(private route: ActivatedRoute, private api: ApiService, private modalService: ModalService) { }
  game: any;
  socket: any;
  match_name: string;
  player_name: string;
  player_index: number;
  subscription: Subscription;

  ngOnInit() {
    this.match_name = this.route.snapshot.paramMap.get('match_name');

    this.api.getGames(this.match_name).subscribe(result => {
      this.game = result
      this.socket = io(`${environment.baseUrl}:3000/`, {
        transports: ['websocket']
      });

      this.modalService.init(JoinComponent, { game: this.game, socket: this.socket, match_name: this.match_name }, {})
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

    this.subscription = this.modalService.join$.subscribe(
      playerInfo => {
        this.player_name = playerInfo.player_name;
        this.player_index = playerInfo.player_index;
        this.modalService.destroy()
    });
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }
}
