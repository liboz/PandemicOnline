import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { clearShare } from "../modal/Modal";
import DivHand from "../player/DivHand";

interface MoveChoiceSelectorProps {
  game: Client.Game;
  hand: string[];
  socket: SocketIOClient.Socket;
  target_player_index: number;
  curr_player_index: number;
  destroy: () => void;
}

interface MoveChoiceSelectorState {
  selectedCard: string;
}

export class ShareReseacherComponent extends React.Component<
  MoveChoiceSelectorProps,
  MoveChoiceSelectorState
> {
  constructor(props: MoveChoiceSelectorProps) {
    super(props);
    this.state = { selectedCard: "" };
    this.onSelectedCard = this.onSelectedCard.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSelectedCard(cardIndex: number) {
    const { hand } = this.props;
    this.setState({ selectedCard: hand[cardIndex] });
  }

  onCancel() {
    const { destroy } = this.props;
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
    console.log(hand);

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
