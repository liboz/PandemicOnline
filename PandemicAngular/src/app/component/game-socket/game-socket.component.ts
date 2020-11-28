import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "../../service/api.service";
import { environment } from "../../../environments/environment";

import { ModalService } from "../../service/modal.service";

import { JoinComponent } from "../join/join.component";

import io from "socket.io-client";
import { Subscription } from "rxjs";
import { SnackbarService } from "src/app/service/snackbar.service";

import { Client } from "pandemiccommon/dist/out-tsc/";

@Component({
  selector: "app-game-socket",
  templateUrl: "./game-socket.component.html",
  styleUrls: ["./game-socket.component.styl"],
})
export class GameSocketComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private modalService: ModalService,
    private snackBarService: SnackbarService
  ) {}
  game: Client.Game;
  socket: SocketIOClient.Socket;
  match_name: string;
  player_name: string;
  player_index: number;
  subscription: Subscription;

  ngOnInit() {
    this.match_name = this.route.snapshot.paramMap.get("match_name");

    this.api.getGames(this.match_name).subscribe((result) => {
      this.game = result;
      this.socket = io(`${environment.baseUrl}/`, {
        query: `match_name=${this.match_name}`,
      });
      console.log(this.socket);

      this.socket.on(Client.EventName.Roles, (roles) => {
        if (
          this.game.game_state !== Client.GameState.Lost &&
          this.game.game_state != Client.GameState.Won &&
          !this.player_name
        ) {
          let config = { game: this.game, socket: this.socket, roles: roles };
          let currentComponent = this.modalService.currentComponent();
          if (!currentComponent || currentComponent !== "JoinComponent") {
            this.modalService.destroy();
            this.modalService.init(JoinComponent, config, {});
          } else {
            config["selected_role"] = null; // not actually an input. kinda hacky...
            this.modalService.updateConfig(config, {});
          }
        }
      });

      this.socket.on("move successful", (data) => {
        this.game = data;
      });

      this.socket.on("move choice successful", (data) => {
        this.modalService.destroyEvent();
        this.game = data;
      });

      this.socket.on("research share successful", (data) => {
        this.game = data;
      });

      this.socket.on("build successful", (data) => {
        this.game = data;
      });

      this.socket.on("treat successful", (data) => {
        this.game = data;
      });

      this.socket.on("discover successful", (data, color) => {
        this.snackBarService.show(`Cure for ${color} was discovered`);
        this.game = data;
      });

      this.socket.on("eradicated", (color) => {
        this.snackBarService.show(`${color} was eradicated`);
      });

      this.socket.on("update game state", (data) => {
        this.game = data;
      });

      this.socket.on("discard cards", (data) => {
        this.game.game_state = Client.GameState.DiscardingCard;
        this.game.must_discard_index = data;
        if (this.game.must_discard_index === this.player_index) {
          this.snackBarService.show(`You need to discard some cards`, "danger");
        } else {
          this.snackBarService.show(
            `Player ${this.game.must_discard_index} is discarding some cards`,
            "danger"
          );
        }

        this.game.log.push(
          `Player ${this.game.must_discard_index} is discarding cards`
        );
      });

      this.socket.on("epidemic", (data) => {
        this.snackBarService.show(`${data} infected by Epidemic`, "danger");
      });

      this.socket.on("invalid action", (data) => {
        this.snackBarService.show(data, "danger");
      });

      this.socket.on(Client.EventName.GameInitialized, (data: Client.Game) => {
        this.game = data;
        console.log(data);
      });
    });

    this.subscription = this.modalService.join$.subscribe((playerInfo) => {
      this.player_name = playerInfo.player_name;
      this.player_index = playerInfo.player_index;
      this.modalService.destroy();
    });
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }
}
