import { Client } from "pandemiccommon/dist/out-tsc";
import React, { CElement, Component, ReactElement, ReactNode } from "react";

import { Subject } from "rxjs";

import "./Modal.css";
import { PlayerInfo } from "../join/Join";

export type componentSourceType = (
  destroy: () => void
) => CElement<any, any> | null;

const componentSource = new Subject<componentSourceType>();
export const component$ = componentSource.asObservable();
export const nextComponent = (componentGenerator: componentSourceType) => {
  componentSource.next(componentGenerator);
};

const joinSource = new Subject<PlayerInfo>();
export const join$ = joinSource.asObservable();
export const joinAs = (playerInfo: PlayerInfo) => {
  joinSource.next(playerInfo);
};

const destroySource = new Subject<void>();
export const destroy$ = destroySource.asObservable();
export const destroyEvent = () => {
  destroySource.next();
};

const clearShareSource = new Subject<void>();
export const clearShare$ = clearShareSource.asObservable();
export const clearShare = () => {
  clearShareSource.next();
};

const dispatcherMoveTargetSource = new Subject<number>();
export const dispatcherMoveTarget$ = dispatcherMoveTargetSource.asObservable();
export const dispatcherMoveTarget = (target_player_id: number) => {
  dispatcherMoveTargetSource.next(target_player_id);
};

const startSource = new Subject<Client.GameDifficulty>();
export const start$ = startSource.asObservable();
export const startAt = (difficultyInfo: Client.GameDifficulty) => {
  startSource.next(difficultyInfo);
};

interface ModalServiceState {
  component: ReactNode;
  visible: boolean;
}

export default class ModalService extends React.Component<
  any,
  ModalServiceState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      component: null,
      visible: false,
    };
    this.destroy = this.destroy.bind(this);
  }

  componentDidMount() {
    component$.subscribe((newComponent) => {
      this.setState({ component: newComponent(this.destroy), visible: true });
    });

    destroy$.subscribe(() => {
      this.destroy();
    });
  }

  private modalElementId = "modal-container";

  destroy() {
    this.setState({ component: null, visible: false });
  }

  currentComponent() {
    //return this.domService.getCurrentComponentName();
  }

  render() {
    return (
      <div
        id={this.modalElementId}
        className={this.state.visible ? "show" : "hidden"}
      >
        {this.state.component}
      </div>
    );
  }
}
