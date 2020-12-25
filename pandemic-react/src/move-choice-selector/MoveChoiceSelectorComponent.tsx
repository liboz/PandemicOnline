import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { SelectedCardComponent } from "../common/SelectedCardsComponent";
import { clearMove } from "../modal/Modal";
import DivHand from "../player/DivHand";

interface MoveChoiceSelectorProps {
  game: Client.Game;
  hand: string[];
  socket: SocketIOClient.Socket;
  canDirect: boolean;
  canCharter: boolean;
  canOperationsExpertMove: boolean;
  currLocation: string;
  targetLocation: string;
}

export class MoveChoiceSelectorComponent extends SelectedCardComponent<MoveChoiceSelectorProps> {
  constructor(props: MoveChoiceSelectorProps) {
    super(props);
    this.state = { selectedCard: "" };

    this.onDirectFlight = this.onDirectFlight.bind(this);
    this.onCharterFlight = this.onCharterFlight.bind(this);
    this.onOperationsExpertMove = this.onOperationsExpertMove.bind(this);
  }

  onDirectFlight() {
    const { socket, targetLocation } = this.props;
    socket.emit(Client.EventName.DirectFlight, targetLocation);
  }

  onCharterFlight() {
    const { socket, targetLocation } = this.props;
    socket.emit(Client.EventName.CharterFlight, targetLocation);
  }

  onOperationsExpertMove() {
    const { socket, targetLocation } = this.props;
    const { selectedCard } = this.state;

    if (selectedCard) {
      socket.emit(
        Client.EventName.OperationsExpertMove,
        targetLocation,
        selectedCard
      );
    }
  }

  onCancel() {
    clearMove();
  }

  render() {
    const {
      game,
      hand,
      canDirect,
      canCharter,
      canOperationsExpertMove,
      currLocation,
      targetLocation,
    } = this.props;
    const { selectedCard } = this.state;

    return (
      <>
        <div>
          {canOperationsExpertMove && (
            <DivHand
              hand={hand}
              game={game}
              cardLimit={hand.length - 1}
              onClick={this.onSelectedCard}
            ></DivHand>
          )}
        </div>
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
                Operations Expert Move To {targetLocation} by discarding {""}
                {selectedCard ? selectedCard : "a card in your hand"}
              </button>
            )}
          </div>
          <div>
            <button onClick={this.onCancel}>Cancel</button>
          </div>
        </div>
      </>
    );
  }
}
