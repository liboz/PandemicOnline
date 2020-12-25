import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { SelectedCardsComponent } from "../common/SelectedCardsComponent";
import { destroyEvent } from "../modal/Modal";
import DivHand from "../player/DivHand";

interface DiscardCardsProps {
  game: Client.Game;
  socket: SocketIOClient.Socket;
}

export class DiscardCardsComponent extends SelectedCardsComponent<DiscardCardsProps> {
  constructor(props: DiscardCardsProps) {
    super(props);
    this.discardSelectedCards = this.discardSelectedCards.bind(this);
  }

  discardEnough() {
    const { game } = this.props;
    const { selectedCards } = this.state;
    return (
      game.players[game.must_discard_index].hand.length - selectedCards.size ===
      7
    );
  }

  discardSelectedCards() {
    const { game, socket } = this.props;
    const { selectedCards } = this.state;

    socket.emit(
      Client.EventName.Discard,
      [...selectedCards].map(
        (i) => game.players[game.must_discard_index].hand[i]
      ),
      () => destroyEvent()
    );
  }

  render() {
    const { game } = this.props;
    const hand = game.players[game.must_discard_index].hand;
    return (
      <div>
        <div>YOU MUST DISCARD TO 7 CARDS</div>
        <DivHand
          hand={hand}
          game={game}
          cardLimit={7}
          onClick={this.onSelectedCard}
        ></DivHand>
        <button
          disabled={!this.discardEnough()}
          onClick={this.discardSelectedCards}
        >
          Discard Selected
        </button>
      </div>
    );
  }
}
