import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import DivHand from "../player/DivHand";

interface DiscoverProps {
  cureColorCards: string[];
  game: Client.Game;
  cancelDiscover: () => void;
  discover: (cards: string[]) => void;
  destroy: () => void;
}

interface DiscoverState {
  selectedCards: Set<number>;
}

export class DiscoverComponent extends React.Component<
  DiscoverProps,
  DiscoverState
> {
  constructor(props: DiscoverProps) {
    super(props);
    this.state = {
      selectedCards: new Set(),
    };
    this.onSelectedCard = this.onSelectedCard.bind(this);
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

  chooseEnough() {
    const { game, cureColorCards } = this.props;
    const { selectedCards } = this.state;
    return (
      cureColorCards.length - selectedCards.size === game.cards_needed_to_cure
    );
  }

  handleClick() {
    const { discover, cureColorCards } = this.props;
    const { selectedCards } = this.state;
    let selected = new Set([...selectedCards].map((i) => cureColorCards[i]));
    discover(cureColorCards.filter((i) => !selected.has(i)));
  }

  onCancel() {
    const { cancelDiscover, destroy } = this.props;
    cancelDiscover();
    destroy();
  }

  render() {
    const { game, cureColorCards } = this.props;
    return (
      <div>
        <div>
          SELECT THE CARDS TO <b>NOT</b> USE FOR DISCOVERING
        </div>
        <DivHand
          hand={cureColorCards}
          game={game}
          cardLimit={game.cards_needed_to_cure}
          onClick={this.onSelectedCard}
        ></DivHand>
        <button disabled={!this.chooseEnough()} onClick={this.handleClick}>
          Discard Selected
        </button>
        <button onClick={this.onCancel}>Cancel</button>
      </div>
    );
  }
}
