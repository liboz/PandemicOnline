import React from "react";
import { ShareCard } from "../game/withGameState";

interface ShareChoicesProps {
  resetShare: () => void;
  shareCardChoices: ShareCard[];
  destroy: () => void;
}

export class ShareChoicesComponent extends React.Component<ShareChoicesProps> {
  constructor(props: ShareChoicesProps) {
    super(props);
    this.onCancel = this.onCancel.bind(this);
  }

  handleClick(onClick: () => void) {
    const { destroy } = this.props;
    onClick();
    destroy();
  }

  onCancel() {
    const { resetShare, destroy } = this.props;
    resetShare();
    destroy();
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
