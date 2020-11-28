import { Component, Input, OnInit } from "@angular/core";
import { Client } from "pandemiccommon/dist/out-tsc";

@Component({
  selector: "app-start-game",
  templateUrl: "./start-game.component.html",
  styleUrls: ["./start-game.component.styl"]
})
export class StartGameComponent implements OnInit {
  @Input() socket: SocketIOClient.Socket;
  constructor() {}
  selectedDifficulty: number;
  difficulties = Object.entries(Client.GameDifficultyMap);

  ngOnInit(): void {}

  onStart() {
    if (this.selectedDifficulty) {
      this.socket.emit(Client.EventName.StartGame, this.selectedDifficulty);
    }
  }
}
