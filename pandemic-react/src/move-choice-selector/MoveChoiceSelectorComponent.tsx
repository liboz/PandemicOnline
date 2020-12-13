import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";

interface MoveChoiceSelectorProps {
  game: Client.Game;
  hand: string[];
  socket: SocketIOClient.Socket;
  canDirect: boolean;
  canCharter: boolean;
  canOperationsExpertMove: boolean;
  currLocation: string;
  targetLocation: string;
  destroy: () => void;
}

interface MoveChoiceSelectorState {
  selectedCard: string;
}

export class MoveChoiceSelectorComponent extends React.Component<
  MoveChoiceSelectorProps,
  MoveChoiceSelectorState
> {
  constructor(props: MoveChoiceSelectorProps) {
    super(props);
    this.state = { selectedCard: "" };
  }

  onDirectFlight() {
    const { socket, targetLocation } = this.props;
    socket.emit("direct flight", targetLocation);
  }

  onCharterFlight() {
    const { socket, targetLocation } = this.props;
    socket.emit("charter flight", targetLocation);
  }

  onOperationsExpertMove() {
    const { socket, targetLocation } = this.props;
    const { selectedCard } = this.state;

    if (selectedCard) {
      socket.emit("operations expert move", targetLocation, selectedCard);
    }
  }

  onCancel() {
    const { destroy } = this.props;
    destroy();
  }

  render() {
    const {
      canDirect,
      canCharter,
      canOperationsExpertMove,
      currLocation,
      targetLocation,
    } = this.props;
    const { selectedCard } = this.state;

    return (
      <div>
        <div style={{ marginBottom: "20px" }}>
          {canDirect && (
            <button onClick={this.onDirectFlight}>
              Direct Flight To {targetLocation} by discarding {targetLocation}
            </button>
          )}
          {canCharter && (
            <button onClick={this.onCharterFlight}>
              Charter Flight To {targetLocation} by discarding {currLocation}
            </button>
          )}
          {canOperationsExpertMove && (
            <button
              disabled={!selectedCard}
              onClick={this.onOperationsExpertMove}
            >
              Operations Expert Move To {targetLocation} by discarding
              {selectedCard ? selectedCard : "a card in your hand"}
            </button>
          )}
        </div>
        {/* TODO Add hand selector
        <div
    *ngIf="canOperationsExpertMove"
    style="display: flex; justify-content: center"
  >
    <app-player-hand
      [hand]="hand"
      [game]="game"
      (onSelect)="onSelectedCard($event)"
      [cardLimit]="hand.length - 1"
    >
    </app-player-hand>
  </div>
        */}
        <div>
          <button onClick={this.onCancel}>Cancel</button>
        </div>
      </div>
    );
  }
}
