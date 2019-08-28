import { Component, OnInit, Input } from '@angular/core';
import { ModalService } from 'src/app/service/modal.service';

@Component({
  selector: 'app-move-choice-selector',
  templateUrl: './move-choice-selector.component.html',
  styleUrls: ['./move-choice-selector.component.styl']
})
export class MoveChoiceSelectorComponent implements OnInit {
  @Input() game: any
  @Input() hand: any
  @Input() socket: any
  @Input() canDirect: boolean
  @Input() canCharter: boolean
  @Input() canOperationsExpertMove: boolean
  @Input() currLocation: string
  @Input() targetLocation: string
  selectedCard: string
  constructor(private modalService: ModalService) { }

  ngOnInit() {
  }

  onSelectedCard(cardIndex: number) {
    this.selectedCard = this.hand[cardIndex]
  }

  onCancel() {
    this.modalService.cancel()
  }

  onDirectFlight() {
    this.socket.emit("direct flight", this.targetLocation)
  }

  onCharterFlight() {
    this.socket.emit("charter flight", this.targetLocation)
  }

  onOperationsExpertMove() {
    if (this.selectedCard) {
      this.socket.emit("operations expert move", this.targetLocation, this.selectedCard)
    }
  }
}
