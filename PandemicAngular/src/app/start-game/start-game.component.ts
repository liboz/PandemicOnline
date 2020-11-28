import { Component, Input, OnInit } from "@angular/core";
import { Client } from "pandemiccommon/dist/out-tsc";
import { Subscription } from "rxjs";
import { ModalService } from "../service/modal.service";

@Component({
  selector: "app-start-game",
  templateUrl: "./start-game.component.html",
  styleUrls: ["./start-game.component.styl"]
})
export class StartGameComponent implements OnInit {
  @Input() socket: SocketIOClient.Socket;
  constructor(private modalService: ModalService) {}
  selectedDifficulty: number;
  difficulties = Object.entries(Client.GameDifficultyMap);
  subscription: Subscription;

  ngOnInit(): void {
    this.subscription = this.modalService.start$.subscribe(() => {
      this.modalService.destroy();
    });
  }

  onStart() {
    if (this.selectedDifficulty) {
      this.socket.emit(
        Client.EventName.StartGame,
        this.selectedDifficulty,
        () => {
          console.log(`started game on ${this.selectedDifficulty} succesfully`);
          this.modalService.startAt(
            Client.GameDifficultyMap[this.selectedDifficulty]
          );
        }
      );
    }
  }
}
