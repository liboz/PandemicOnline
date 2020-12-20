import { Client } from "pandemiccommon/dist/out-tsc";
import React, { CElement, ReactElement, ReactNode } from "react";

import { Subject } from "rxjs";

import "./Modal.css";
import { PlayerInfo } from "../join/Join";

export type componentSourceType = (destroy: () => void) => CElement<any, any>;

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
  components: ReactElement[];
}

export default class ModalService extends React.Component<
  any,
  ModalServiceState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      components: [],
    };
    this.destroy = this.destroy.bind(this);
  }

  componentDidMount() {
    component$.subscribe((newComponent) => {
      this.setState((state) => {
        return {
          components: [...state.components, newComponent(this.destroy)],
        };
      });
    });

    destroy$.subscribe(() => {
      this.destroy();
    });
  }

  private modalElementId = "modal-container";

  destroy() {
    this.setState((state) => {
      const newComponents = [...state.components];
      newComponents.shift();
      return {
        components: newComponents,
      };
    });
  }

  currentComponent() {
    if (
      this.state.components &&
      typeof this.state.components[0].type !== "string"
    ) {
      return this.state.components[0].type.name;
    }
  }

  render() {
    return (
      <div
        id={this.modalElementId}
        className={this.state.components.length > 0 ? "show" : "hidden"}
      >
        {this.state.components.length > 0 && this.state.components[0]}
      </div>
    );
  }
}
