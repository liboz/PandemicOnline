import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiService } from './service/api.service';

import io from "socket.io-client";
import { GameState } from "./component/game/game.component"

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.styl']
})
export class AppComponent implements OnInit {
  title = 'Pandemic Online';

  private socket: any;
  private game: any;

  constructor(private api: ApiService, private changeDetectorRef: ChangeDetectorRef) { }

  public ngOnInit() {
    this.api.getGames().subscribe(result => {
      this.game = result
      this.socket = io('http://localhost:3000', {
        transports: ['websocket']
      });

      this.socket.on("new game", data => {
        this.game = data
        console.log(data)
      });

      this.socket.on("move successful", data => {
        this.game = data
      });

      this.socket.on("treat successful", data => {
        this.game = data
      });

      this.socket.on("update game state", data => {
        this.game = data
      })

      this.socket.on('discard cards', data =>  {
        this.game.game_state = GameState.DiscardingCard;
        console.log('hello!');
      })

      this.socket.on("epidemic", data => {
        window.alert(`${data} infected by Epidemic`)
      });

      this.socket.on("error", data => {
        window.alert(data)
      });

      this.socket.on("game initialized", data => {
        this.game = data
      });
    })

  }

  public ngAfterViewInit() {

  }
}
