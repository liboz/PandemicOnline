import React, { ReactElement } from "react";
import { component$, destroy$ } from "../Subscriptions";

import "./Modal.css";

interface ModalServiceState {
  components: ReactElement[];
}

export default class ModalService extends React.Component<
  any,
  ModalServiceState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      components: [],
    };
    this.destroy = this.destroy.bind(this);
  }

  componentDidMount() {
    component$.subscribe((newComponent) => {
      if (newComponent === "clear") {
        this.setState({ components: [] });
      } else {
        this.setState((state) => {
          return {
            components: [...state.components, newComponent()],
          };
        });
      }
    });

    destroy$.subscribe(() => {
      this.destroy();
    });
  }

  private modalElementId = "modal-container";

  destroy() {
    this.setState((state) => {
      const newComponents = [...state.components];
      newComponents.shift();
      return {
        components: newComponents,
      };
    });
  }

  currentComponents() {
    if (
      this.state.components.length > 0 &&
      typeof this.state.components[0].type !== "string"
    ) {
      return this.state.components.map((component) => {
        if (typeof component.type !== "string") {
          return component.type.name;
        }
        return undefined;
      });
    }
  }

  render() {
    return (
      <div
        id={this.modalElementId}
        className={this.state.components.length > 0 ? "show" : "hidden"}
      >
        {this.state.components.length > 0 && this.state.components[0]}
      </div>
    );
  }
}
