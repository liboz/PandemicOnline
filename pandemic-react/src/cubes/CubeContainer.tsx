import { Client } from "pandemiccommon/dist/out-tsc";
import * as PIXI from "pixi.js";
import React from "react";
import {
  Container,
  CustomPIXIComponent,
  PixiAppProperties,
  withApp,
} from "react-pixi-fiber";
import { CityNodeData } from "../node/CityNode";
import { colorNameToHex } from "../utils";
import Cubes from "./Cubes";

interface CubeProps {
  node: CityNodeData;
  app: PIXI.Application;
}

interface CubeState {
  rotation: number;
}

class CubeContainer extends React.Component<CubeProps, CubeState> {
  constructor(props: CubeProps) {
    super(props);
    this.state = {
      rotation: 0,
    };
  }
  componentDidMount() {
    // Note that `app` prop is coming through `withApp` HoC
    this.props.app.ticker.add(this.animate);
  }

  componentWillUnmount() {
    this.props.app.ticker.remove(this.animate);
  }

  animate = (delta: number) => {
    this.setState((state) => ({
      rotation: state.rotation + 0.03 * delta,
    }));
  };

  render() {
    const { node } = this.props;
    return (
      <Container x={node.x} y={node.y} rotation={this.state.rotation}>
        <Cubes node={node}></Cubes>
      </Container>
    );
  }
}

export default withApp(CubeContainer);
