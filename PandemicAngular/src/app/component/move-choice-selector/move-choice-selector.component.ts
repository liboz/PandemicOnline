import { Component, OnInit, Input } from "@angular/core";
import { ModalService } from "src/app/service/modal.service";
import { Client } from "pandemiccommon/dist/out-tsc/";

@Component({
  selector: "app-move-choice-selector",
  templateUrl: "./move-choice-selector.component.html",
  styleUrls: ["./move-choice-selector.component.styl"]
})
export class MoveChoiceSelectorComponent implements OnInit {
  @Input() game: Client.Game;
  @Input() hand: string[];
  @Input() socket: SocketIOClient.Socket;
  @Input() canDirect: boolean;
  @Input() canCharter: boolean;
  @Input() canOperationsExpertMove: boolean;
  @Input() currLocation: string;
  @Input() targetLocation: string;
  selectedCard: string;
  constructor(private modalService: ModalService) {}

  ngOnInit() {}

  onSelectedCard(cardIndex: number) {
    this.selectedCard = this.hand[cardIndex];
  }

  onCancel() {
    this.modalService.destroyEvent();
  }

  onDirectFlight() {
    this.socket.emit("direct flight", this.targetLocation);
  }

  onCharterFlight() {
    this.socket.emit("charter flight", this.targetLocation);
  }

  onOperationsExpertMove() {
    if (this.selectedCard) {
      this.socket.emit(
        "operations expert move",
        this.targetLocation,
        this.selectedCard
      );
    }
  }
}
