import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "[app-player]",
  templateUrl: "./player.component.html",
  styleUrls: ["./player.component.styl"]
})
export class PlayerComponent implements OnInit {
  @Input("app-player") playerIndex: number;
  @Input() city_num_players: number;
  @Input() city_player_index: number;
  static playerInfo = {
    0: "#42d4f4",
    1: "#911eb4",
    2: "#800000",
    3: "#f58231"
  };

  playerColor: string;
  xPosition: number;
  intervalSize: number;
  constructor() {}

  ngOnInit() {
    this.playerColor = PlayerComponent.playerInfo[this.playerIndex];
    this.intervalSize = 40 / (this.city_num_players + 1);
    this.xPosition = -20 + this.intervalSize * (this.city_player_index + 1);
  }
}
