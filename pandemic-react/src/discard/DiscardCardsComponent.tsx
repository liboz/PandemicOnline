import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import DivHand from "../player/DivHand";

interface DiscardCardsProps {
  game: Client.Game;
  socket: SocketIOClient.Socket;
  destroy: () => void;
}

interface DiscardCardsState {
  selectedCards: Set<number>;
}

export class DiscardCardsComponent extends React.Component<
  DiscardCardsProps,
  DiscardCardsState
> {
  constructor(props: DiscardCardsProps) {
    super(props);
    this.state = {
      selectedCards: new Set(),
    };
    this.onSelectedCard = this.onSelectedCard.bind(this);
    this.discardSelectedCards = this.discardSelectedCards.bind(this);
  }

  onSelectedCard(cardIndex: number) {
    const { selectedCards } = this.state;
    const newSelectedCards = new Set(selectedCards);

    if (selectedCards.has(cardIndex)) {
      newSelectedCards.delete(cardIndex);
    } else {
      newSelectedCards.add(cardIndex);
    }
    this.setState({ selectedCards: newSelectedCards });
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
    const { game, socket, destroy } = this.props;
    const { selectedCards } = this.state;

    socket.emit(
      "discard",
      [...selectedCards].map(
        (i) => game.players[game.must_discard_index].hand[i]
      ),
      () => destroy()
    );
  }

  render() {
    const { game } = this.props;
    const hand = game.players[game.player_index].hand;
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
