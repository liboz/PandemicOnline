import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { SelectedCardsComponent } from "../common/SelectedCardsComponent";
import { clearDiscover } from "../Subscriptions";
import DivHand from "../player/DivHand";

interface DiscoverProps {
  cureColorCards: string[];
  game: Client.Game;
  discover: (cards: string[]) => void;
}

export class DiscoverComponent extends SelectedCardsComponent<DiscoverProps> {
  constructor(props: DiscoverProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
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
    const selected = new Set([...selectedCards].map((i) => cureColorCards[i]));
    discover(cureColorCards.filter((i) => !selected.has(i)));
  }

  onCancel() {
    clearDiscover();
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
          Do not use Selected for Discover
        </button>
        <button onClick={this.onCancel}>Cancel</button>
      </div>
    );
  }
}
