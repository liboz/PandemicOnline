import { Component, OnInit, Input } from "@angular/core";
import { ModalService } from "src/app/service/modal.service";
import { Client } from "pandemiccommon/dist/out-tsc/";

@Component({
  selector: "app-researcher-share-selector",
  templateUrl: "./researcher-share-selector.component.html",
  styleUrls: ["./researcher-share-selector.component.styl"],
})
export class ResearcherShareSelectorComponent implements OnInit {
  @Input() hand: string[];
  @Input() game: Client.Game;
  @Input() socket: SocketIOClient.Socket;
  @Input() target_player_index: number;
  @Input() curr_player_index: number;
  selectedCard: string;
  constructor(private modalService: ModalService) {}

  ngOnInit() {}

  onSelectedCard(cardIndex: number) {
    this.selectedCard = this.hand[cardIndex];
  }

  onCancel() {
    this.modalService.destroyEvent();
  }

  onSubmit() {
    if (this.selectedCard) {
      this.modalService.clearShare();
      this.socket.emit(
        "share",
        this.target_player_index,
        this.selectedCard,
        () => {
          console.log(
            `share between ${this.curr_player_index} and ${this.target_player_index} of the card ${this.selectedCard} callbacked`
          );
          // clear out the shareCardChoices
        }
      );
    }
  }
}
