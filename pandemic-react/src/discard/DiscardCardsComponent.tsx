import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { SelectedCardsComponent } from "../common/SelectedCardsComponent";
import { destroyEvent } from "../Subscriptions";
import DivHand from "../player/DivHand";
import { getEventCardsInHand } from "../utils";

interface DiscardCardsProps {
  game: Client.Game;
  socket: SocketIOClient.Socket;
  onEventCard: () => void;
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
    const { game, onEventCard } = this.props;
    const hand = game.players[game.must_discard_index].hand;
    const eventCards = getEventCardsInHand(game, game.must_discard_index);
    return (
      <div>
        <div>YOU MUST DISCARD TO 7 CARDS</div>
        <DivHand
          hand={hand}
          game={game}
          cardLimit={7}
          onClick={this.onSelectedCard}
        ></DivHand>
        {eventCards.length > 0 && (
          <button
            onClick={() => {
              destroyEvent();
              onEventCard();
            }}
          >
            Play Event Card
          </button>
        )}
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
