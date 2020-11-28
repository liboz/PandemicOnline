import { Component, OnInit, Input } from "@angular/core";
import { ModalService } from "src/app/service/modal.service";
import { Client } from "pandemiccommon/dist/out-tsc/";
import { formatPlayer } from "src/app/utils";

@Component({
  selector: "app-dispatcher-move",
  templateUrl: "./dispatcher-move.component.html",
  styleUrls: ["./dispatcher-move.component.styl"],
})
export class DispatcherMoveComponent implements OnInit {
  constructor(private modalService: ModalService) {}

  @Input() other_players: Client.Player[];
  formatPlayer = formatPlayer;
  ngOnInit() {}

  dispatcherMoveTargetSelect(target_player_id: number) {
    this.modalService.dispatcherMoveTarget(target_player_id);
  }

  onCancel() {
    this.modalService.destroyEvent();
  }
}
