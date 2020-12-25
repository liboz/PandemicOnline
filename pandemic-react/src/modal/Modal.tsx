import { Client } from "pandemiccommon/dist/out-tsc";
import React, { CElement, ReactElement } from "react";

import { Subject } from "rxjs";

import "./Modal.css";
import { PlayerInfo } from "../join/Join";

export type componentSourceType = (() => CElement<any, any>) | "clear";

const componentSource = new Subject<componentSourceType>();
export const component$ = componentSource.asObservable();
export const nextComponent = (componentGenerator: componentSourceType) => {
  componentSource.next(componentGenerator);
};
export const clearComponent = () => componentSource.next("clear");

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

const clearTreatSource = new Subject<void>();
export const clearTreat$ = clearTreatSource.asObservable();
export const clearTreat = () => {
  clearTreatSource.next();
};

const clearDiscoverSource = new Subject<void>();
export const clearDiscover$ = clearDiscoverSource.asObservable();
export const clearDiscover = () => {
  clearDiscoverSource.next();
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
      if (newComponent === "clear") {
        this.setState({ components: [] });
      } else {
        this.setState((state) => {
          return {
            components: [...state.components, newComponent()],
          };
        });
      }
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

  currentComponents() {
    if (
      this.state.components.length > 0 &&
      typeof this.state.components[0].type !== "string"
    ) {
      return this.state.components.map((component) => {
        if (typeof component.type !== "string") {
          return component.type.name;
        }
        return undefined;
      });
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
