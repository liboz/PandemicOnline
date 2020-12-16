import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { clearShare } from "../modal/Modal";
import DivHand from "../player/DivHand";

interface ShareResearcherProps {
  resetShare: () => void;
  game: Client.Game;
  hand: string[];
  socket: SocketIOClient.Socket;
  target_player_index: number;
  curr_player_index: number;
  destroy: () => void;
}

interface ShareResearcherState {
  selectedCard: string;
}

export class ShareResearcherComponent extends React.Component<
  ShareResearcherProps,
  ShareResearcherState
> {
  constructor(props: ShareResearcherProps) {
    super(props);
    this.state = { selectedCard: "" };
    this.onSelectedCard = this.onSelectedCard.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onSelectedCard(cardIndex: number) {
    const { hand } = this.props;
    this.setState({ selectedCard: hand[cardIndex] });
  }

  onCancel() {
    const { resetShare, destroy } = this.props;
    resetShare();
    destroy();
  }

  onSubmit() {
    const { socket, target_player_index, curr_player_index } = this.props;
    const { selectedCard } = this.state;
    if (selectedCard) {
      clearShare();
      socket.emit("share", target_player_index, selectedCard, () => {
        console.log(
          `share between ${curr_player_index} and ${target_player_index} of the card ${selectedCard} callbacked`
        );
        // clear out the shareCardChoices
      });
    }
  }

  render() {
    const { game, hand } = this.props;
    const { selectedCard } = this.state;

    return (
      <>
        <div>{"Select Researcher Card to Trade:"}</div>
        <DivHand
          hand={hand}
          game={game}
          cardLimit={hand.length - 1}
          onClick={this.onSelectedCard}
        ></DivHand>
        <div>
          <button disabled={!selectedCard} onClick={this.onSubmit}>
            Trade {selectedCard}
          </button>
          <button onClick={this.onCancel}>Cancel</button>
        </div>
      </>
    );
  }
}
