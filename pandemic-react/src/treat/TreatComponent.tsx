import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { clearTreat, destroyEvent } from "../modal/Modal";

interface TreatComponentProps {
  treat: (cube: Client.Color) => void;
  treatColorChoices: Client.Color[];
}

export class TreatComponent extends React.Component<TreatComponentProps> {
  constructor(props: TreatComponentProps) {
    super(props);
    this.onCancel = this.onCancel.bind(this);
  }

  handleClick(cube: Client.Color) {
    const { treat } = this.props;
    treat(cube);
    destroyEvent();
  }

  onCancel() {
    clearTreat();
  }

  render() {
    const { treatColorChoices } = this.props;

    return (
      <>
        <div>
          {treatColorChoices.map((cube) => {
            return (
              <button
                key={cube + "choice"}
                onClick={() => {
                  this.handleClick(cube);
                }}
              >
                Treat {cube}
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
