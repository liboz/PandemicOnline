import React from "react";
import { Client } from "pandemiccommon/dist/out-tsc/";
import * as PIXI from "pixi.js";
import { Container, Stage, Text } from "react-pixi-fiber";
import CityNode, { CityNodeData } from "../node/CityNode";
import GeoBackground from "./GeoBackground";
import ResearchStation from "../node/ResearchStation";
import Player from "../player/Player";
import CubeContainer from "../cubes/CubeContainer";
import BottomBar from "../bottom-bar/BottomBar";
import withGameState, { GameComponentState } from "./withGameState";
import TopBar from "../top-bar/TopBar";
import Sidebar, { SidebarItemProps } from "../sidebar/Sidebar";
import { hasCubes } from "../utils";

export const width = 1920;
export const height = 960;
export const barBaseHeight = height - 100;

export interface GameGraphicsProps {
  game?: Client.Game;
  socket?: SocketIOClient.Socket;
  player_name?: string;
  player_index?: number;
  projection: d3.GeoProjection;
  state: GameComponentState;
  onSelectedNode: (selectedNode: CityNodeData) => void;
  onMove: () => void;
  onDispatcherMove: () => void;
  onBuild: () => void;
  onTreat: () => void;
  onShare: () => void;
  onDiscover: () => void;
  onPass: () => void;
  onEventCard: () => void;
  setSidebarChildren: (item: React.FunctionComponent<SidebarItemProps>) => void;
  hideSidebar: () => void;
  resize: () => void;
}

class GameGraphics extends React.Component<GameGraphicsProps> {
  pixiApp!: PIXI.Application;

  elementRef: React.RefObject<HTMLDivElement>;

  constructor(props: GameGraphicsProps) {
    super(props);
    this.elementRef = React.createRef<HTMLDivElement>();
  }

  componentDidMount() {
    if (this.pixiApp) {
      this.pixiApp.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true,
      });
    }
    this.pixiApp = new PIXI.Application({
      backgroundColor: 0x2a2c39,
      resizeTo: window,
      antialias: true,
    });

    /* Investigate perf of this
      const ticker = PIXI.Ticker.shared;
      ticker.autoStart = false;
      ticker.stop();
      */
    this.pixiApp.renderer.autoDensity = true;
    PIXI.settings.RESOLUTION = 2 * window.devicePixelRatio;
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    this.pixiApp.view.id = "main-app";
    this.pixiApp.view.style.position = "absolute";
    this.pixiApp.view.style.zIndex = "0";

    this.elementRef.current!.appendChild(this.pixiApp.view);
  }

  componentDidUpdate(prevProps: GameGraphicsProps) {
    if (prevProps.game === undefined) {
      this.pixiApp.resizeTo = window;
    }

    this.pixiApp.renderer.on("resize", () => {
      this.props.resize();
    });
  }

  render() {
    const {
      links,
      nodes,
      isMoving,
      showSidebar,
      sidebarDisplayItem,
      currentWidth,
      currentHeight,
      dispatcherMoveOtherPlayer,
    } = this.props.state;
    const heightRatio = currentHeight / height;
    const widthRatio = currentWidth / width;
    return (
      <div ref={this.elementRef}>
        {this.props.game && links && (
          <>
            <Stage app={this.pixiApp}>
              <Container>
                <GeoBackground
                  projection={this.props.projection}
                  links={links}
                  heightRatio={heightRatio}
                  widthRatio={widthRatio}
                />
                {nodes?.map((node) => {
                  return (
                    <Container
                      key={"container-parent" + node.id}
                      sortableChildren={true}
                    >
                      <Container
                        key={"container" + node.id}
                        interactive={true}
                        pointerdown={() => this.props.onSelectedNode(node)}
                      >
                        <CityNode
                          node={node}
                          isMoving={isMoving}
                          heightRatio={heightRatio}
                          widthRatio={widthRatio}
                          dispatcherMoveOtherPlayer={dispatcherMoveOtherPlayer}
                        ></CityNode>
                      </Container>

                      <Text
                        interactive={true}
                        pointerdown={() => this.props.onSelectedNode(node)}
                        zIndex={10}
                        style={{
                          fill: 0xffffff,
                          fontSize: Math.max(18 * widthRatio, 10),
                          stroke: "black",
                          strokeThickness: 3,
                          align: "center",
                        }}
                        text={node.name}
                        x={node.x - Math.max(30 * widthRatio, 20)}
                        y={node.y - Math.max(30 * heightRatio, 15)}
                      ></Text>
                      {node.hasResearchStation && (
                        <ResearchStation
                          node={node}
                          heightRatio={heightRatio}
                          widthRatio={widthRatio}
                        ></ResearchStation>
                      )}
                      {hasCubes(node.cubes) && (
                        <CubeContainer
                          node={node}
                          heightRatio={heightRatio}
                          widthRatio={widthRatio}
                        ></CubeContainer>
                      )}
                      <Player
                        node={node}
                        heightRatio={heightRatio}
                        widthRatio={widthRatio}
                      ></Player>
                    </Container>
                  );
                })}
              </Container>
              <BottomBar
                state={this.props.state}
                onMove={this.props.onMove}
                onDispatcherMove={this.props.onDispatcherMove}
                onBuild={this.props.onBuild}
                onTreat={this.props.onTreat}
                onShare={this.props.onShare}
                onDiscover={this.props.onDiscover}
                onPass={this.props.onPass}
                onEventCard={this.props.onEventCard}
                game={this.props.game}
                player_index={this.props.player_index}
                heightRatio={heightRatio}
                widthRatio={widthRatio}
              ></BottomBar>
              <TopBar
                game={this.props.game}
                showSidebar={showSidebar}
                setSidebarChildren={this.props.setSidebarChildren}
                hideSidebar={this.props.hideSidebar}
                heightRatio={heightRatio}
                widthRatio={widthRatio}
              ></TopBar>
            </Stage>
            <Sidebar
              game={this.props.game}
              showSidebar={showSidebar}
              hideSidebar={this.props.hideSidebar}
              displayItem={sidebarDisplayItem}
            ></Sidebar>
          </>
        )}
      </div>
    );
  }
}

export default withGameState(GameGraphics);
