import React from "react";

interface WinLossComponentProps {
  lost: boolean;
  destroy: () => void;
}

export class WinLossComponent extends React.Component<WinLossComponentProps> {
  constructor(props: WinLossComponentProps) {
    super(props);
    this.onClose = this.onClose.bind(this);
  }

  onClose() {
    const { destroy } = this.props;
    destroy();
  }

  render() {
    const { lost } = this.props;

    return (
      <>
        <div>{lost ? "You have lost" : "You have won"}</div>
        <div>
          <button onClick={this.onClose}>Close</button>
        </div>
      </>
    );
  }
}
