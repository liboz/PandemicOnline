import { Injectable } from '@angular/core';
import { DomService } from './dom.service';

import { Subject }    from 'rxjs';
import { PlayerInfo } from '../component/join/join.component';

@Injectable()
export class ModalService {

  constructor(private domService: DomService) { }

  private modalElementId = 'modal-container';
  private overlayElementId = 'overlay';

  init(component: any, inputs: object, outputs: object) {
    let componentConfig = {
      inputs:inputs,
      outputs:outputs
    }
    this.domService.appendComponentTo(this.modalElementId, component, componentConfig);
    document.getElementById(this.modalElementId).className = 'show';
  }

  destroy() {
    this.domService.removeComponent();
    document.getElementById(this.modalElementId).className = 'hidden';
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
}