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
