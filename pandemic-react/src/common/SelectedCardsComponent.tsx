import React from "react";

interface SelectedCardsState {
  selectedCards: Set<number>;
}

export class SelectedCardsComponent<T> extends React.Component<
  T,
  SelectedCardsState
> {
  constructor(props: T) {
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
}

export interface SelectedCardProps {
  hand: string[];
}

interface SelectedCardState {
  selectedCard: string;
}

export class SelectedCardComponent<
  T extends SelectedCardProps
> extends React.Component<T, SelectedCardState> {
  constructor(props: T) {
    super(props);
    this.state = { selectedCard: "" };
    this.onSelectedCard = this.onSelectedCard.bind(this);
  }
  onSelectedCard(cardIndex: number) {
    const { hand } = this.props;
    this.setState((state) => {
      if (state.selectedCard === hand[cardIndex]) {
        return { selectedCard: "" };
      } else {
        return { selectedCard: hand[cardIndex] };
      }
    });
  }
}
