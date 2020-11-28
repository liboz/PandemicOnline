import { Injectable } from "@angular/core";
import { DomService } from "./dom.service";

import { Subject } from "rxjs";
import { PlayerInfo } from "../component/join/join.component";
import { Client } from "pandemiccommon/dist/out-tsc";

@Injectable()
export class ModalService {
  constructor(private domService: DomService) {}

  private modalElementId = "modal-container";
  private overlayElementId = "overlay";

  init(component: any, inputs: object, outputs: object) {
    let componentConfig = {
      inputs: inputs,
      outputs: outputs,
    };
    this.domService.appendComponentTo(
      this.modalElementId,
      component,
      componentConfig
    );
    document.getElementById(this.modalElementId).className = "show";
  }

  destroy() {
    this.domService.removeComponent();
    document.getElementById(this.modalElementId).className = "hidden";
  }

  updateConfig(inputs: object, outputs: object) {
    let componentConfig = {
      inputs: inputs,
      outputs: outputs,
    };
    this.domService.reattachConfig(componentConfig);
  }

  currentComponent() {
    return this.domService.getCurrentComponentName();
  }

  private joinSource = new Subject<PlayerInfo>();
  join$ = this.joinSource.asObservable();
  joinAs(playerInfo: PlayerInfo) {
    this.joinSource.next(playerInfo);
  }

  private destroySource = new Subject<void>();
  destroy$ = this.destroySource.asObservable();
  destroyEvent() {
    this.destroySource.next();
  }

  private clearShareSource = new Subject<void>();
  clearShare$ = this.clearShareSource.asObservable();
  clearShare() {
    this.clearShareSource.next();
  }

  private dispatcherMoveTargetSource = new Subject<number>();
  dispatcherMoveTarget$ = this.dispatcherMoveTargetSource.asObservable();
  dispatcherMoveTarget(target_player_id: number) {
    this.dispatcherMoveTargetSource.next(target_player_id);
  }

  private startSource = new Subject<Client.GameDifficulty>();
  start$ = this.startSource.asObservable();
  startAt(difficultyInfo: Client.GameDifficulty) {
    this.startSource.next(difficultyInfo);
  }
}
