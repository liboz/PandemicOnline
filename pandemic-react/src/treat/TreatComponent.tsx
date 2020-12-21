import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { clearTreat } from "../modal/Modal";

interface TreatComponentProps {
  treat: (cube: Client.Color) => void;
  treatColorChoices: Client.Color[];
  destroy: () => void;
}

export class TreatComponent extends React.Component<TreatComponentProps> {
  constructor(props: TreatComponentProps) {
    super(props);
    this.onCancel = this.onCancel.bind(this);
  }

  handleClick(cube: Client.Color) {
    const { destroy, treat } = this.props;
    treat(cube);
    destroy();
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
