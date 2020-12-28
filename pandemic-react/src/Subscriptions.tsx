import { Client } from "pandemiccommon/dist/out-tsc";
import { CElement } from "react";
import { Subject } from "rxjs";
import { PlayerInfo } from "./join/Join";

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

const clearMoveSource = new Subject<void>();
export const clearMove$ = clearMoveSource.asObservable();
export const clearMove = () => {
  clearMoveSource.next();
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

const closeSidebarSource = new Subject<Client.Game>();
export const closeSidebar$ = closeSidebarSource.asObservable();
export const closeSidebar = (data: Client.Game) => {
  closeSidebarSource.next(data);
};

const restartGameSource = new Subject<Client.Game>();
export const restartGame$ = restartGameSource.asObservable();
export const restartGame = (data: Client.Game) => {
  restartGameSource.next(data);
};
