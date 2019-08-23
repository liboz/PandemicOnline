import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { GameState } from '../game/game.component'
import { ModalService } from 'src/app/service/modal.service';

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.styl']
})
export class JoinComponent implements OnInit {
  @Input() game: any
  @Input() socket: any
  @Input() match_name: string
  player_name = ""
  constructor(private modalService: ModalService) { }

  ngOnInit() {
  }

  hasStarted() {
    return this.game && this.game.game_state !== GameState.NotStarted;
  }

  notEnded() {
    return this.game.game_state !== GameState.Lost && this.game.game_state !== GameState.Won;
  }

  joinGame() {
    if (this.player_name) {
      this.socket.emit('join', this.match_name, this.player_name, (player_index) => {
        console.log(`${this.player_name} joined ${this.match_name} successfully`)
        this.modalService.joinAs(new PlayerInfo(this.player_name, player_index))
      })
    }
  }

  choosePlayer(player: any) {
    this.player_name = player.name
    this.joinGame()
  }

}

export class PlayerInfo {
  player_name: string;
  player_index: number;
  constructor(player_name: string, player_index: number) { 
    this.player_name = player_name
    this.player_index = player_index
  }
}
