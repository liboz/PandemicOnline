import React from "react";
import { Client } from "pandemiccommon/dist/out-tsc/";
import {
  clearShare$,
  destroy$,
  destroyEvent,
  dispatcherMoveTarget$,
} from "../modal/Modal";
import { Subscription } from "rxjs";
import * as PIXI from "pixi.js";
import { Container, Stage, Text } from "react-pixi-fiber";
import * as d3 from "d3";
import CityNode, { CityNodeData, PIXICityNode } from "../node/CityNode";
import Link from "../link/link";
import GeoBackground from "./GeoBackground";
import ResearchStation from "../node/ResearchStation";
import Player from "../player/Player";
import Cubes from "../cubes/Cubes";
import CubeContainer from "../cubes/CubeContainer";
import BottomBar from "../bottom-bar/BottomBar";

export const width = 1920;
export const height = 960;
export const barBaseHeight = height - 100;

interface GameComponentProps {
  game?: Client.Game;
  socket?: SocketIOClient.Socket;
  player_name?: string;
  player_index?: number;
}

interface GameComponentState {
  isMoving: boolean;
  selectedCards: Set<number>;
  shareCardChoices: ShareCard[] | null;
  dispatcherMoveOtherPlayer?: number;
  links?: Link[];
  nodes?: CityNodeData[];
}

class GameComponent extends React.Component<
  GameComponentProps,
  GameComponentState
> {
  pixiApp!: PIXI.Application;

  treatColorChoices: string[] | null = null;
  cureColorCards: string[] | null = null;
  destroySubscription?: Subscription;
  clearShareCardsSubscription?: Subscription;
  dispatcherMoveSubscription?: Subscription;

  rootProjection!: d3.GeoProjection;
  projection!: d3.GeoProjection;

  yaw!: d3.ScaleLinear<number, number, never>;

  path: any; // use any to avoid some typing issues

  initialized = false;
  elementRef: React.RefObject<HTMLDivElement>;

  constructor(props: GameComponentProps) {
    super(props);

    this.state = {
      isMoving: false,
      selectedCards: new Set(),
      shareCardChoices: null,
    };

    console.log(window);

    this.elementRef = React.createRef<HTMLDivElement>();
  }

  componentDidMount() {
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

    this.pixiApp.renderer.on("resize", () => {
      /*
      this.preRender();
      this.regenerateLinksAndNodes();
      */
    });

    this.elementRef.current!.appendChild(this.pixiApp.view);

    this.destroySubscription = destroy$.subscribe(() => {
      this.setState({ isMoving: false });
    });

    this.clearShareCardsSubscription = clearShare$.subscribe(() => {
      this.setState({ shareCardChoices: null });
      destroyEvent();
    });
    this.dispatcherMoveSubscription = dispatcherMoveTarget$.subscribe(
      (player_index) => {
        this.setState({ dispatcherMoveOtherPlayer: player_index });
        destroyEvent();
      }
    );
  }

  componentDidUpdate(prevProps: GameComponentProps) {
    if (prevProps.game === undefined) {
      this.preRender();
      const result = this.regenerateLinksAndNodes();
      if (result) {
        const [nodes, links] = result;
        this.setState({ nodes, links });
      }
    }
  }

  private preRender() {
    this.rootProjection = d3
      .geoEquirectangular()
      .center([15, 10])
      .scale(window.innerWidth / 5.5) // 5.5 gotten empiricaly
      .translate([window.innerWidth / 2, window.innerHeight / 2]); // ensure centred in group

    this.projection = d3
      .geoEquirectangular()
      .center([15, 10])
      .scale(window.innerWidth / 5.5) // 5.5 gotte empiricaly
      .translate([window.innerWidth / 2, window.innerHeight / 2]);

    this.yaw = d3.scaleLinear().domain([0, window.innerWidth]).range([0, 360]);
  }

  private regenerateLinksAndNodes(): [CityNodeData[], Link[]] | undefined {
    const { game } = this.props;
    if (game) {
      let values = Object.values(game.game_graph);
      const nodes = values.map((d) => {
        return {
          id: d.index,
          x: this.projection(d.location)![0],
          y: this.projection(d.location)![1],
          color: d.color,
          name: d.name,
          cubes: d.cubes,
          hasResearchStation: d.hasResearchStation,
          players: d.players,
        } as CityNodeData;
      });

      if (game?.valid_final_destinations) {
        game.valid_final_destinations.forEach((c) => {
          nodes[c].isValidDestination = true;
        });
      }

      const links: Link[] = [];
      values.forEach((d) => {
        d.neighbors.forEach((n) => {
          if (d.location[0] * values[n].location[0] < -10000) {
            // these are cross pacific differences
            let left_diff = Math.min(nodes[d.index].x, nodes[n].x);
            let right_diff = width - Math.max(nodes[d.index].x, nodes[n].x);
            let slope =
              (nodes[d.index].y - nodes[n].y) / (left_diff + right_diff);
            if (d.location[0] < 0) {
              links.push({
                source: nodes[d.index],
                target: { x: 0, y: nodes[d.index].y - slope * left_diff },
              }); // western hemisphere
            } else {
              links.push({
                source: nodes[d.index],
                target: {
                  x: 3000,
                  y: nodes[d.index].y - slope * right_diff,
                },
              }); // eastern hemisphere
            }
          } else {
            links.push({
              source: nodes[d.index],
              target: nodes[n],
            });
          }
        });
      });

      return [nodes, links];
    }
    return;
  }

  render() {
    console.log(this.state.nodes);
    return (
      <div ref={this.elementRef}>
        {this.props.game && this.state.links && (
          <Stage app={this.pixiApp}>
            <Container>
              <GeoBackground
                projection={this.projection}
                links={this.state.links}
              />
              {this.state.nodes?.map((node) => {
                return (
                  <Container sortableChildren={true}>
                    <CityNode
                      node={node}
                      isMoving={this.state.isMoving}
                    ></CityNode>
                    <Text
                      zIndex={10}
                      style={{
                        fill: 0xffffff,
                        fontSize: 18,
                        stroke: "black",
                        strokeThickness: 3,
                        align: "center",
                      }}
                      text={node.name}
                      x={node.x - 30}
                      y={node.y - 30}
                    ></Text>
                    {node.hasResearchStation && (
                      <ResearchStation node={node}></ResearchStation>
                    )}
                    <CubeContainer node={node}></CubeContainer>
                    <Player node={node}></Player>
                  </Container>
                );
              })}
            </Container>
            <BottomBar
              game={this.props.game}
              player_index={this.props.player_index}
            ></BottomBar>
          </Stage>
        )}
      </div>
    );
  }
}

/*
export class GameComponent1 {
  renderBottomBarFull() {
    this.pixiApp.stage.removeChild(this.bottomBar);
    this.bottomBar = renderBottomBar(
      this.game,
      this.player_index,
      this.onMove,
      this.isMoving,
      this.game.player_index !== this.player_index ||
        (this.cannotDoPrimaryAction() && !this.isMoving)
    );
    this.pixiApp.stage.addChild(this.bottomBar);
  }

  ngOnChanges(changes: SimpleChanges) {
    // TODO: HANDLE
    if (this.initialized) {
      this.createChart();
    }
    this.maybeShowStartDialog();
    console.log(changes);
    if (changes.game) {
      if (changes.game.currentValue.game_state === Client.GameState.Lost) {
        this.modalService.destroy();
        this.modalService.init(ModalComponent, { lost: true }, {});
      } else if (
        changes.game.currentValue.game_state === Client.GameState.Won
      ) {
        this.modalService.destroy();
        this.modalService.init(ModalComponent, { lost: false }, {});
      }
    }
  }

  zoomed(event: D3ZoomEvent<any, any>) {
    var scale = this.rootProjection.scale();
    var translate = this.rootProjection.translate();
    var transform = event.transform;
    var tx = translate[0] - transform.invertX(translate[0]);
    var ty = translate[1] * transform.k + transform.y;

    this.projection
      .scale(transform.k * scale)
      .rotate([this.yaw(tx), 0, 0])
      .translate([translate[0], ty]);

    this.renderBase();
    this.renderChanging();
    this.renderBottomBarFull();
  }

  ngOnInit() {
    this.onMove = this.onMove.bind(this);

    this.isMoving = false;
    this.selectedCards = new Set();
    this.destroySubscription = this.modalService.destroy$.subscribe(() => {
      this.isMoving = false;
      this.modalService.destroy();
    });

    this.clearShareCardsSubscription = this.modalService.clearShare$.subscribe(
      () => {
        this.shareCardChoices = null;
        this.modalService.destroyEvent();
      }
    );
    this.dispatcherMoveSubscription = this.modalService.dispatcherMoveTarget$.subscribe(
      (player_index) => {
        this.dispatcherMoveOtherPlayer = player_index;
        this.modalService.destroyEvent();
      }
    );

    this.ngZone.runOutsideAngular(() => {
      this.pixiApp = new PIXI.Application({
        backgroundColor: 0x2a2c39,
        resizeTo: window,
        antialias: true,
      });
    });
    this.pixiApp.renderer.autoDensity = true;
    PIXI.settings.RESOLUTION = 2 * window.devicePixelRatio;
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    this.elementRef.nativeElement.appendChild(this.pixiApp.view);
    this.pixiApp.view.id = "main-app";
    this.pixiApp.view.style.position = "absolute";
    this.pixiApp.view.style.zIndex = "0";

    this.preRender();
    this.renderBase();
    this.renderChanging();
    this.renderBottomBarFull();

    this.pixiApp.renderer.on("resize", () => {
      this.preRender();
      this.renderBase();
      this.renderChanging();
      this.renderBottomBarFull();
    });
  }

  loopCubes() {
    for (const node of this.nodes) {
      const container = this.nodeGraphics[node.name].cubes;
      this.pixiApp.ticker.add((delta) => {
        // rotate the container!
        // use delta to create frame-independent transform
        container.rotation -= 0.03 * delta;
      });
    }
  }

  private maybeShowStartDialog() {
    let currentComponent = this.modalService.currentComponent();
    if (
      this.game?.game_state === Client.GameState.NotStarted &&
      this.player_name !== undefined
    ) {
      this.modalService.init(
        StartGameComponent,
        {
          socket: this.socket,
        },
        {}
      );
    } else if (currentComponent === "StartGameComponent") {
      this.modalService.destroy();
    }
  }

  

  private renderOnlyNode() {
    for (const node of this.nodes) {
      if (this.nodeGraphics[node.name]) {
        this.nodeGraphics[node.name].container.removeChild(
          this.nodeGraphics[node.name].mainNode
        );
      }
      const nodeGraphics = renderNode(node, this.isMoving);
      this.nodeGraphics[node.name].mainNode = nodeGraphics;
      if (this.nodeGraphics[node.name]) {
        this.nodeGraphics[node.name].container.addChild(nodeGraphics);
      }
    }
  }


  onSelectedNode(selectedNode: any) {
    if (this.isMoving && selectedNode.isValidDestination) {
      let curr_player = this.game.players[this.game.player_index];
      let curr_city = this.game.game_graph[
        this.game.game_graph_index[curr_player.location]
      ];
      let target_city = this.game.game_graph[
        this.game.game_graph_index[selectedNode.name]
      ];
      let neighbors = curr_city.neighbors;
      if (
        neighbors.includes(selectedNode.id) ||
        (curr_city.hasResearchStation && target_city.hasResearchStation)
      ) {
        this.moveEmit(selectedNode);
        this.isMoving = false;
      } else {
        // choice 1 = direct, choice 2 = charter, choice 3 = operations expert
        let choices = [false, false, false];
        if (curr_player.hand.includes(selectedNode.name)) {
          choices[0] = true;
        }
        if (this.game.can_charter_flight) {
          choices[1] = true;
        }
        if (this.game.can_operations_expert_move) {
          choices[2] = true;
        }
        if (choices[2] || choices.reduce((a, b) => (b ? a + 1 : a), 0) > 1) {
          this.modalService.init(
            MoveChoiceSelectorComponent,
            {
              game: this.game,
              hand: curr_player.hand,
              socket: this.socket,
              canDirect: choices[0],
              canCharter: choices[1],
              canOperationsExpertMove: choices[2],
              currLocation: curr_city.name,
              targetLocation: target_city.name,
            },
            {}
          );
        } else {
          this.moveEmit(selectedNode);
          this.isMoving = false;
        }
      }
    }
  }

  moveEmit(selectedNode) {
    this.socket.emit("move", selectedNode.name, () => {
      console.log(`move to ${selectedNode.name} success callbacked`);
    });
  }

  onSelectedCard(cardIndex: number) {
    if (!this.selectedCards.delete(cardIndex)) {
      this.selectedCards.add(cardIndex);
    }
  }

  onMove() {
    this.isMoving = !this.isMoving;
    this.renderOnlyNode();
    this.renderBottomBarFull();
  }

  onBuild() {
    this.socket.emit("build");
  }

  onTreat() {
    if (this.treatColorChoices) {
      this.treatColorChoices = null;
    } else {
      let location = this.game.players[this.game.player_index].location;
      let cubes = this.game.game_graph[this.game.game_graph_index[location]]
        .cubes;
      let cubes_on = Object.keys(cubes).filter((i) => cubes[i] > 0);
      if (cubes_on.length === 1) {
        this.treat(cubes_on[0]);
      } else {
        this.treatColorChoices = cubes_on;
      }
    }
  }

  treat(color) {
    this.treatColorChoices = null;
    this.socket.emit("treat", color, () => {
      console.log(
        `treat ${color} at ${
          this.game.players[this.game.player_index].location
        } callbacked`
      );
    });
  }

  onShare() {
    if (this.shareCardChoices) {
      this.shareCardChoices = null;
    } else {
      let curr_player = this.game.players[this.game.player_index];
      let location = curr_player.location;
      let location_players = this.game.game_graph[
        this.game.game_graph_index[location]
      ].players;
      let other_players_ids = location_players.filter(
        (i) => i !== this.game.player_index
      );
      let other_players = other_players_ids.map((i) => this.game.players[i]);

      // non researcher case
      if (
        curr_player.role !== Client.Roles.Researcher &&
        other_players.every((i) => i.role !== Client.Roles.Researcher)
      ) {
        // only 2 players
        if (location_players.length === 2) {
          let other_player = other_players_ids[0];
          this.share(other_player);
        } else if (this.game.can_take) {
          // since there is no researcher, there is only 1 possible take option
          let other_player = other_players_ids.filter((i) =>
            this.game.players[i].hand.includes(location)
          );
          this.share(other_player);
        } else {
          // we can potentially give to every other player on the same node
          this.shareCardChoices = other_players_ids.map(
            (i) =>
              new ShareCard(
                ShareCard.Give,
                i,
                this.game.players[this.game.player_index].location,
                () => this.share(i)
              )
          );
        }
      } else {
        // researcher
        if (location_players.length === 2) {
          // just need to figure out who is the researcher and who isn't
          let other_player = other_players_ids[0];
          if (curr_player.role === Client.Roles.Researcher) {
            if (curr_player.hand.length === 0) {
              this.share(other_player);
            } else {
              if (this.game.players[other_player].hand.includes(location)) {
                this.shareCardChoices = [
                  new ShareCard(
                    ShareCard.Take,
                    other_player,
                    this.game.players[this.game.player_index].location,
                    () => this.share(other_player)
                  ),
                ];
                this.shareCardChoices.push(
                  new ShareCard(ShareCard.Give, other_player, null, () =>
                    this.shareResearcher(
                      curr_player,
                      other_player,
                      curr_player.id
                    )
                  )
                );
              } else {
                this.shareResearcher(curr_player, other_player, curr_player.id);
              }
            }
          } else {
            if (
              curr_player.hand.length === 0 ||
              !curr_player.hand.includes(location)
            ) {
              this.shareResearcher(
                this.game.players[other_player],
                other_player,
                curr_player.id
              );
            } else {
              let researcher = other_players.filter(
                (i) => i.role === Client.Roles.Researcher
              )[0];
              this.shareCardChoices = [
                new ShareCard(
                  ShareCard.Give,
                  other_player,
                  this.game.players[this.game.player_index].location,
                  () => this.share(other_player)
                ),
              ];
              this.shareCardChoices.push(
                new ShareCard(ShareCard.Take, other_player, null, () =>
                  this.shareResearcher(
                    researcher,
                    researcher.id,
                    curr_player.id
                  )
                )
              );
            }
          }
        } else if (this.game.can_take) {
          // since there are multiple players, we can potentially take from 1 other player + a researcher

          let other_player = other_players_ids.filter((i) =>
            this.game.players[i].hand.includes(location)
          );
          console.log(other_player);
          if (other_player.length > 0) {
            if (
              this.game.players[other_player[0]].role ===
              Client.Roles.Researcher
            ) {
              // That one player we can take from is a researcher, in which case we just do researcher take
              this.shareResearcher(
                this.game.players[other_player[0]],
                other_player,
                curr_player.id
              );
            } else {
              this.shareCardChoices = [
                new ShareCard(
                  ShareCard.Take,
                  other_player[0],
                  this.game.players[this.game.player_index].location,
                  () => this.share(other_player)
                ),
              ];
              //  if that researcher is us, the action needs to be a give
              if (curr_player.role === Client.Roles.Researcher) {
                other_players_ids.forEach((id) => {
                  this.shareCardChoices.push(
                    new ShareCard(ShareCard.Give, id, null, () =>
                      this.shareResearcher(curr_player, id, curr_player.id)
                    )
                  );
                });
              } else {
                // otherwise, we can also take from the researcher
                let researcher = other_players.filter(
                  (i) => i.role === Client.Roles.Researcher
                )[0];
                this.shareCardChoices.push(
                  new ShareCard(ShareCard.Take, researcher.id, null, () =>
                    this.shareResearcher(
                      researcher,
                      researcher.id,
                      this.game.player_index
                    )
                  )
                );
              }
            }
          } else {
            // the one player is non-existent, just a researcher
            let researcher = other_players.filter(
              (i) => i.role === Client.Roles.Researcher
            )[0];
            if (curr_player.role === Client.Roles.Researcher) {
              this.shareResearcher(curr_player, researcher.id, curr_player.id);
            } else {
              this.shareResearcher(researcher, researcher.id, curr_player.id);
            }
          }
        } else {
          // we are giving to another player.
          // since we should always be able to take from a researcher, this only happens when we are the researcher, so we researcher share
          this.shareCardChoices = other_players_ids.map((id) => {
            return new ShareCard(ShareCard.Give, id, null, () =>
              this.shareResearcher(curr_player, id, curr_player.id)
            );
          });
        }
      }
    }
  }

  shareResearcher(researcher, target_player_index, curr_player_index) {
    if (researcher.hand.length > 0) {
      this.modalService.init(
        ResearcherShareSelectorComponent,
        {
          hand: researcher.hand,
          game: this.game,
          socket: this.socket,
          target_player_index: target_player_index,
          curr_player_index: curr_player_index,
        },
        {}
      );
    }
  }

  share(other_player) {
    let location = this.game.players[this.game.player_index].location;
    this.shareCardChoices = null;
    this.socket.emit("share", other_player, null, () => {
      console.log(`share with ${other_player} at ${location} callbacked`);
    });
  }

  onDiscover() {
    if (this.cureColorCards) {
      let selected = new Set(
        [...this.selectedCards].map((i) => this.cureColorCards[i])
      );
      let cureColorCards = this.cureColorCards.filter((i) => !selected.has(i));
      this.selectedCards = new Set();
      this.discover(cureColorCards);
    } else {
      let player = this.game.players[this.game.player_index];
      let cureColorCards = player.hand.filter(
        (card) =>
          this.game.game_graph[this.game.game_graph_index[card]].color ===
          this.game.can_cure
      );
      if (cureColorCards.length === this.game.cards_needed_to_cure) {
        this.discover(cureColorCards);
      } else {
        this.cureColorCards = cureColorCards;
      }
    }
  }

  discover(cards) {
    this.cureColorCards = null;
    this.socket.emit("discover", cards, () => {
      this.selectedCards = new Set();
      console.log(
        `discover with ${cards} at ${
          this.game.players[this.game.player_index].location
        } callbacked`
      );
    });
  }

  cancelDiscover() {
    this.cureColorCards = null;
    this.selectedCards = new Set();
  }

  canPass() {
    return (
      this.game.turns_left > 0 &&
      this.game.game_state === Client.GameState.Ready
    );
  }

  onPass() {
    this.socket.emit("pass");
  }

  mustDiscard() {
    return (
      this.game.must_discard_index === this.player_index &&
      this.game.game_state === Client.GameState.DiscardingCard
    );
  }

  discardEnough() {
    return (
      this.game.players[this.game.must_discard_index].hand.length -
        this.selectedCards.size ===
      7
    );
  }

  discardSelectedCards() {
    this.socket.emit(
      "discard",
      [...this.selectedCards].map(
        (i) => this.game.players[this.game.must_discard_index].hand[i]
      ),
      () => {
        this.selectedCards = new Set();
      }
    );
  }

  isDispatcher() {
    return (
      this.game.players[this.game.player_index].role === Client.Roles.Dispatcher
    );
  }

  onDispatcherMove() {
    if (this.dispatcherMoveOtherPlayer) {
      this.dispatcherMoveOtherPlayer = null;
    } else {
      const other_players = this.game.players.filter(
        (i) => i.id !== this.game.player_index
      );
      if (other_players.length > 1) {
        this.modalService.init(
          DispatcherMoveComponent,
          {
            other_players: other_players,
          },
          {}
        );
      } else if (other_players.length === 1) {
        this.dispatcherMoveOtherPlayer = other_players[0].id;
      }
    }
  }

  cannotDoPrimaryAction() {
    console.log(
      this.isMoving,
      this.treatColorChoices,
      this.shareCardChoices,
      this.cureColorCards,
      this.dispatcherMoveOtherPlayer,
      this.game.turns_left,
      this.game.game_state
    );
    return (
      this.isMoving ||
      this.treatColorChoices ||
      this.shareCardChoices ||
      this.cureColorCards ||
      this.dispatcherMoveOtherPlayer ||
      this.game.turns_left <= 0 ||
      this.game.game_state !== Client.GameState.Ready
    );
  }

  bgColor(id: number) {
    return playerInfo[id];
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.destroySubscription.unsubscribe();
    this.clearShareCardsSubscription.unsubscribe();
  }
}*/

class ShareCard {
  public static Take = "Take from";
  public static Give = "Give";

  constructor(
    readonly action: string,
    readonly player_id: number,
    readonly location: string,
    readonly onClick: () => void
  ) {}
}

export default GameComponent;