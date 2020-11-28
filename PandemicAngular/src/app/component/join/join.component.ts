import { Component, OnInit, Input } from "@angular/core";
import { ModalService } from "src/app/service/modal.service";
import { Client } from "pandemiccommon/dist/out-tsc/";
import { formatPlayer } from "../../utils";

@Component({
  selector: "app-join",
  templateUrl: "./join.component.html",
  styleUrls: ["./join.component.styl"]
})
export class JoinComponent implements OnInit {
  @Input() game: Client.Game;
  @Input() socket: SocketIOClient.Socket;
  @Input() match_name: string;
  @Input() roles: string[];
  formatPlayer = formatPlayer;
  selected_role: string;
  player_name = "";
  constructor(private modalService: ModalService) {}

  ngOnInit() {}

  hasStarted() {
    return this.game && this.game.game_state !== Client.GameState.NotStarted;
  }

  notEnded() {
    return (
      this.game.game_state !== Client.GameState.Lost &&
      this.game.game_state !== Client.GameState.Won
    );
  }

  private joinGameInternal() {
    this.socket.emit(
      "join",
      this.selected_role,
      this.player_name,
      player_index => {
        console.log(
          `${this.player_name} joined as ${this.selected_role} successfully`
        );
        this.modalService.joinAs(
          new PlayerInfo(this.player_name, player_index)
        );
      }
    );
  }

  joinGame() {
    if (this.player_name && this.selected_role) {
      this.joinGameInternal();
    }
  }

  choosePlayer(player: Client.Player) {
    this.player_name = player.name;
    this.selected_role = player.role;
    this.joinGameInternal();
  }
}

export class PlayerInfo {
  player_name: string;
  player_index: number;
  constructor(player_name: string, player_index: number) {
    this.player_name = player_name;
    this.player_index = player_index;
  }
}
