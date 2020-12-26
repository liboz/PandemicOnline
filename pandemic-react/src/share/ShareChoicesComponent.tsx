import React from "react";
import { ShareCard } from "../game/withGameState";
import { clearShare, destroyEvent } from "../Subscriptions";

interface ShareChoicesProps {
  shareCardChoices: ShareCard[];
}

export class ShareChoicesComponent extends React.Component<ShareChoicesProps> {
  constructor(props: ShareChoicesProps) {
    super(props);
    this.onCancel = this.onCancel.bind(this);
  }

  handleClick(onClick: () => void) {
    onClick();
    destroyEvent();
  }

  onCancel() {
    clearShare();
  }

  render() {
    const { shareCardChoices } = this.props;

    return (
      <>
        <div>
          {shareCardChoices.map((choice) => {
            return (
              <button
                key={choice.action + choice.location + choice.player_id}
                onClick={() => {
                  this.handleClick(choice.onClick);
                }}
              >
                {choice.action} Player {choice.player_id}
                {choice.location
                  ? " the " + choice.location + " card"
                  : " (Researcher Ability)"}
              </button>
            );
          })}
        </div>
        <div>
          <button onClick={this.onCancel}>Cancel</button>
        </div>
      </>
    );
  }
}
