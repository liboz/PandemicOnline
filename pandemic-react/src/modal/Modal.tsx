import React, { ReactElement } from "react";
import { component$, destroy$ } from "../Subscriptions";
import { FaMinusCircle } from "react-icons/fa";

import "./Modal.css";

interface ModalServiceState {
  components: ReactElement[];
  faded: boolean;
}

export default class ModalService extends React.Component<
  any,
  ModalServiceState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      components: [],
      faded: false,
    };
    this.destroy = this.destroy.bind(this);
    this.triggerFade = this.triggerFade.bind(this);
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

  triggerFade() {
    this.setState((state) => {
      return {
        faded: !state.faded,
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

  generateClassName() {
    const base = this.state.components.length > 0 ? "show" : "hidden";
    return base + (this.state.faded ? " faded" : "");
  }

  render() {
    return (
      <div id={this.modalElementId} className={this.generateClassName()}>
        <span id={"fade-button"} onClick={this.triggerFade}>
          <FaMinusCircle />
        </span>
        {this.state.components.length > 0 && this.state.components[0]}
      </div>
    );
  }
}
