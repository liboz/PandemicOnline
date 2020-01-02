import { Component, OnInit } from '@angular/core';
import { ModalService } from 'src/app/service/modal.service';

@Component({
  selector: 'app-dispatcher-move',
  templateUrl: './dispatcher-move.component.html',
  styleUrls: ['./dispatcher-move.component.styl']
})
export class DispatcherMoveComponent implements OnInit {

  constructor(private modalService: ModalService) { }

  ngOnInit() {
  }

  dispatcherMoveTargetSelect() {
    this.modalService.dispatcherMove(
      0
    );
}

onCancel() {
  this.modalService.destroyEvent();
}

}
