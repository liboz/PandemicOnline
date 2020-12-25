import React from "react";
import { Client } from "pandemiccommon/dist/out-tsc/";
import {
  clearComponent,
  clearDiscover$,
  clearShare$,
  clearTreat$,
  destroy$,
  destroyEvent,
  dispatcherMoveTarget$,
  nextComponent,
} from "../modal/Modal";
import { Subscription } from "rxjs";
import * as d3 from "d3";
import { CityNodeData } from "../node/CityNode";
import Link from "../link/link";
import { MoveChoiceSelectorComponent } from "../move-choice-selector/MoveChoiceSelectorComponent";
import { ShareResearcherComponent } from "../share/ShareResearcherComponent";
import { ShareChoicesComponent } from "../share/ShareChoicesComponent";
import { DiscardCardsComponent } from "../discard/DiscardCardsComponent";
import { DiscoverComponent } from "../discover/DiscoverComponent";
import { TreatComponent } from "../treat/TreatComponent";
import { WinLossComponent } from "./WinLossComponent";
import { StartGameComponent } from "../start-game/StartGameComponent";
import { SidebarItemProps } from "../sidebar/Sidebar";

export const width = 1920;
export const height = 960;
export const barBaseHeight = height - 100;

export interface GameComponentProps {
  game?: Client.Game;
  socket?: SocketIOClient.Socket;
  player_name?: string;
  player_index?: number;
}

export interface GameComponentState {
  isMoving: boolean;
  selectedCards: Set<number>;
  shareCardChoices: ShareCard[] | null;
  dispatcherMoveOtherPlayer?: number;
  cureColorCards: string[] | null;
  treatColorChoices: string[] | null;
  links?: Link[];
  nodes?: CityNodeData[];
  showSidebar: boolean;
  sidebarDisplayItem: React.FunctionComponent<SidebarItemProps> | null;
}

export interface GameStateInterface
  extends React.Component<GameComponentProps, GameComponentState> {
  onMove(): void;
  onTreat(): void;
  onShare(): void;
  onDiscover(): void;
  onSelectedNode(selectedNode: CityNodeData): void;
  setSidebarChildren: (item: React.FunctionComponent<SidebarItemProps>) => void;
  hideSidebar: () => void;
}

export function initialState(): GameComponentState {
  return {
    isMoving: false,
    selectedCards: new Set(),
    shareCardChoices: null,
    cureColorCards: null,
    treatColorChoices: null,
    showSidebar: false,
    sidebarDisplayItem: null,
  };
}

function withGameState(WrappedComponent: typeof React.Component) {
  // ...and returns another component...
  return class
    extends React.Component<GameComponentProps, GameComponentState>
    implements GameStateInterface {
    destroySubscription?: Subscription;
    clearShareCardsSubscription?: Subscription;
    dispatcherMoveSubscription?: Subscription;
    clearTreatSubscription?: Subscription;
    clearDiscoverSubscription?: Subscription;

    rootProjection!: d3.GeoProjection;
    projection!: d3.GeoProjection;

    yaw!: d3.ScaleLinear<number, number, never>;

    path: any; // use any to avoid some typing issues

    constructor(props: GameComponentProps) {
      super(props);

      this.state = initialState();
      this.onMove = this.onMove.bind(this);
      this.onBuild = this.onBuild.bind(this);
      this.onTreat = this.onTreat.bind(this);
      this.onShare = this.onShare.bind(this);
      this.onDiscover = this.onDiscover.bind(this);
      this.onPass = this.onPass.bind(this);
      this.onSelectedNode = this.onSelectedNode.bind(this);
      this.treat = this.treat.bind(this);
      this.share = this.share.bind(this);
      this.shareResearcher = this.shareResearcher.bind(this);
      this.discover = this.discover.bind(this);
      this.setSidebarChildren = this.setSidebarChildren.bind(this);
      this.hideSidebar = this.hideSidebar.bind(this);
    }

    componentDidMount() {
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
      this.clearTreatSubscription = clearTreat$.subscribe(() => {
        this.setState({ treatColorChoices: null });
        destroyEvent();
      });

      this.clearDiscoverSubscription = clearDiscover$.subscribe(() => {
        this.setState({ cureColorCards: null });
        destroyEvent();
      });
    }

    componentWillUnmount() {
      // prevent memory leak when component destroyed
      this.destroySubscription?.unsubscribe();
      this.dispatcherMoveSubscription?.unsubscribe();
      this.clearShareCardsSubscription?.unsubscribe();
      this.clearTreatSubscription?.unsubscribe();
      this.clearDiscoverSubscription?.unsubscribe();
    }

    componentDidUpdate(prevProps: GameComponentProps) {
      const { game } = this.props;
      if (game?.game_state === Client.GameState.Lost) {
        this.showWinLossComponent(true);
      } else if (game?.game_state === Client.GameState.Won) {
        this.showWinLossComponent(false);
      } else if (
        game?.game_state === Client.GameState.NotStarted &&
        this.props.player_name !== undefined &&
        this.props.socket
      ) {
        this.showStartGameComponent();
      }

      if (prevProps.game === undefined) {
        this.preRender();
        const nodes = this.regenerateNodes();
        const links = this.regenerateLinks(nodes);
        this.setState({ nodes, links });
        this.maybeShowDiscardComponent();
      } else {
        if (prevProps.game?.game_graph !== game?.game_graph) {
          const nodes = this.regenerateNodes();
          this.setState({ nodes });
        }

        if (
          prevProps.game.must_discard_index !== game?.must_discard_index ||
          prevProps.player_index !== game.player_index ||
          prevProps.game.game_state !== game.game_state
        ) {
          this.maybeShowDiscardComponent();
        }
      }
    }

    showStartGameComponent() {
      const { socket } = this.props;
      if (socket) {
        clearComponent();
        nextComponent((destroy: () => void) => {
          const props = {
            socket: socket,
            destroy,
          };
          return React.createElement(StartGameComponent, props);
        });
      }
    }

    showWinLossComponent(lost: boolean) {
      clearComponent();
      nextComponent((destroy: () => void) => {
        const props = {
          lost,
          destroy,
        };
        return React.createElement(WinLossComponent, props);
      });
    }

    maybeShowDiscardComponent() {
      const { game, player_index, socket } = this.props;
      if (
        socket &&
        game &&
        player_index !== undefined &&
        game.must_discard_index === player_index &&
        game.game_state === Client.GameState.DiscardingCard
      ) {
        nextComponent((destroy: () => void) => {
          const props = {
            game: game,
            socket: socket,
            destroy,
          };
          return React.createElement(DiscardCardsComponent, props);
        });
      }
    }

    onMove() {
      this.setState((state) => {
        return {
          isMoving: !state.isMoving,
        };
      });
    }

    onBuild() {
      const { socket } = this.props;
      socket?.emit(Client.EventName.Build);
    }

    onTreat() {
      const { game } = this.props;
      if (this.state.treatColorChoices) {
        this.setState({ treatColorChoices: null });
      } else {
        if (game) {
          let location = game?.players[game?.player_index].location;
          let cubes = game?.game_graph[game?.game_graph_index[location]].cubes;
          let cubes_on = Object.keys(cubes)
            .map((i) => i as Client.Color)
            .filter((i) => cubes[i] > 0);
          if (cubes_on.length === 1) {
            this.treat(cubes_on[0]);
          } else {
            nextComponent((destroy: () => void) => {
              const props = {
                treat: this.treat,
                destroy,
                treatColorChoices: cubes_on,
              };
              return React.createElement(TreatComponent, props);
            });
            this.setState({ treatColorChoices: cubes_on });
          }
        }
      }
    }

    treat(color: Client.Color) {
      const { game, socket } = this.props;
      this.setState({ treatColorChoices: null });
      socket?.emit("treat", color, () => {
        console.log(
          `treat ${color} at ${
            game?.players[game.player_index].location
          } callbacked`
        );
      });
    }

    onShare() {
      const { game } = this.props;
      const { shareCardChoices } = this.state;
      if (shareCardChoices) {
        this.setState({ shareCardChoices: null });
        destroyEvent();
      } else if (game) {
        const curr_player = game.players[game.player_index];
        const location = curr_player.location;
        const location_players =
          game.game_graph[game.game_graph_index[location]].players;
        const other_players_ids = location_players.filter(
          (i) => i !== game.player_index
        );

        const maybePlayerWithLocationCard = game.players.filter(
          (player) =>
            player.location === location && player.hand.includes(location)
        );

        const maybeResearcher = game.players.filter(
          (player) =>
            player.location === location &&
            player.role === Client.Roles.Researcher
        );

        const isCurrPlayerResearcher =
          maybeResearcher?.[0]?.id === curr_player.id;

        const doesCurrPlayerHaveLocationCard =
          maybePlayerWithLocationCard?.[0]?.id === curr_player.id;

        if (isCurrPlayerResearcher && doesCurrPlayerHaveLocationCard) {
          if (other_players_ids.length === 1) {
            this.shareResearcher(
              curr_player,
              other_players_ids[0],
              curr_player.id
            );
          } else {
            const choices = other_players_ids.map(
              (i) =>
                new ShareCard(ShareCard.Give, i, null, () =>
                  this.shareResearcher(curr_player, i, curr_player.id)
                )
            );
            nextComponent((destroy: () => void) => {
              const props = {
                destroy,
                shareCardChoices: choices,
              };
              return React.createElement(ShareChoicesComponent, props);
            });
            this.setState({
              shareCardChoices: choices,
            });
          }
        } else if (isCurrPlayerResearcher && !doesCurrPlayerHaveLocationCard) {
          this.currPlayerResearchAndNoLocationCard(
            game,
            other_players_ids,
            curr_player,
            maybePlayerWithLocationCard
          );
        } else if (!isCurrPlayerResearcher && doesCurrPlayerHaveLocationCard) {
          this.currPlayerLocationCardNotResearcher(
            game,
            other_players_ids,
            curr_player,
            maybeResearcher
          );
        } else {
          this.currPlayerNotLocationCardNotResearcher(
            game,
            other_players_ids,
            curr_player,
            maybePlayerWithLocationCard,
            maybeResearcher
          );
        }
      }
    }

    currPlayerNotLocationCardNotResearcher(
      game: Client.Game,
      other_players_ids: number[],
      curr_player: Client.Player,
      maybePlayerWithLocationCard: Client.Player[],
      maybeResearcher: Client.Player[]
    ) {
      if (other_players_ids.length === 1) {
        if (maybeResearcher.length === 0) {
          this.share(other_players_ids[0]);
        } else {
          this.shareResearcher(
            game.players[other_players_ids[0]],
            other_players_ids[0],
            curr_player.id
          );
        }
      } else {
        if (
          maybePlayerWithLocationCard.length === 1 &&
          maybeResearcher.length === 1 &&
          maybePlayerWithLocationCard[0].id === maybeResearcher[0].id
        ) {
          this.shareResearcher(
            maybeResearcher[0],
            maybeResearcher[0].id,
            curr_player.id
          );
        } else if (maybeResearcher.length === 0) {
          this.share(maybePlayerWithLocationCard[0].id);
        } else if (maybePlayerWithLocationCard.length === 0) {
          this.shareResearcher(
            maybeResearcher[0],
            maybeResearcher[0].id,
            curr_player.id
          );
        } else if (
          maybePlayerWithLocationCard.length === 1 &&
          maybeResearcher.length === 1
        ) {
          const choices = [
            new ShareCard(
              ShareCard.Take,
              maybePlayerWithLocationCard[0].id,
              game.players[game.player_index].location,
              () => this.share(maybePlayerWithLocationCard[0].id)
            ),
            new ShareCard(ShareCard.Take, maybeResearcher[0].id, null, () =>
              this.shareResearcher(
                maybeResearcher[0],
                maybeResearcher[0].id,
                curr_player.id
              )
            ),
          ];
          nextComponent((destroy: () => void) => {
            const props = {
              destroy,
              shareCardChoices: choices,
            };
            return React.createElement(ShareChoicesComponent, props);
          });
          this.setState({
            shareCardChoices: choices,
          });
        }
      }
    }

    currPlayerLocationCardNotResearcher(
      game: Client.Game,
      other_players_ids: number[],
      curr_player: Client.Player,
      maybeResearcher: Client.Player[]
    ) {
      if (other_players_ids.length === 1) {
        if (maybeResearcher.length === 0) {
          this.share(other_players_ids[0]);
        } else {
          const choices = [
            new ShareCard(
              ShareCard.Give,
              other_players_ids[0],
              game.players[game.player_index].location,
              () => this.share(other_players_ids[0])
            ),
            new ShareCard(ShareCard.Take, maybeResearcher[0].id, null, () =>
              this.shareResearcher(
                maybeResearcher[0],
                maybeResearcher[0].id,
                curr_player.id
              )
            ),
          ];
          nextComponent((destroy: () => void) => {
            const props = {
              destroy,
              shareCardChoices: choices,
            };
            return React.createElement(ShareChoicesComponent, props);
          });
          this.setState({
            shareCardChoices: choices,
          });
        }
      } else {
        if (maybeResearcher.length === 0) {
          const choices = other_players_ids.map(
            (i) =>
              new ShareCard(
                ShareCard.Give,
                i,
                game.players[game.player_index].location,
                () => this.share(i)
              )
          );
          nextComponent((destroy: () => void) => {
            const props = {
              destroy,
              shareCardChoices: choices,
            };
            return React.createElement(ShareChoicesComponent, props);
          });
          this.setState({
            shareCardChoices: choices,
          });
        } else {
          const choices = [
            ...other_players_ids.map(
              (i) =>
                new ShareCard(
                  ShareCard.Give,
                  i,
                  game.players[game.player_index].location,
                  () => this.share(i)
                )
            ),
            new ShareCard(ShareCard.Take, maybeResearcher[0].id, null, () =>
              this.shareResearcher(
                maybeResearcher[0],
                maybeResearcher[0].id,
                curr_player.id
              )
            ),
          ];
          nextComponent((destroy: () => void) => {
            const props = {
              destroy,
              shareCardChoices: choices,
            };
            return React.createElement(ShareChoicesComponent, props);
          });
          this.setState({
            shareCardChoices: choices,
          });
        }
      }
    }

    currPlayerResearchAndNoLocationCard(
      game: Client.Game,
      other_players_ids: number[],
      curr_player: Client.Player,
      maybePlayerWithLocationCard: Client.Player[]
    ) {
      if (other_players_ids.length === 1) {
        if (curr_player.hand.length === 0) {
          this.share(other_players_ids[0]);
        } else if (maybePlayerWithLocationCard.length === 0) {
          this.shareResearcher(
            curr_player,
            other_players_ids[0],
            curr_player.id
          );
        } else {
          const choices = [
            new ShareCard(
              ShareCard.Take,
              other_players_ids[0],
              game.players[game.player_index].location,
              () => this.share(other_players_ids[0])
            ),
            new ShareCard(ShareCard.Give, other_players_ids[0], null, () =>
              this.shareResearcher(
                curr_player,
                other_players_ids[0],
                curr_player.id
              )
            ),
          ];
          nextComponent((destroy: () => void) => {
            const props = {
              destroy,
              shareCardChoices: choices,
            };
            return React.createElement(ShareChoicesComponent, props);
          });
          this.setState({
            shareCardChoices: choices,
          });
        }
      } else {
        if (maybePlayerWithLocationCard.length === 0) {
          const choices = other_players_ids.map(
            (i) =>
              new ShareCard(ShareCard.Give, i, null, () =>
                this.shareResearcher(curr_player, i, curr_player.id)
              )
          );
          nextComponent((destroy: () => void) => {
            const props = {
              destroy,
              shareCardChoices: choices,
            };
            return React.createElement(ShareChoicesComponent, props);
          });
          this.setState({
            shareCardChoices: choices,
          });
        } else {
          const choices = [
            new ShareCard(
              ShareCard.Take,
              maybePlayerWithLocationCard[0].id,
              game.players[game.player_index].location,
              () => this.share(maybePlayerWithLocationCard[0].id)
            ),
            ...other_players_ids.map(
              (i) =>
                new ShareCard(ShareCard.Give, i, null, () =>
                  this.shareResearcher(curr_player, i, curr_player.id)
                )
            ),
          ];
          nextComponent((destroy: () => void) => {
            const props = {
              destroy,
              shareCardChoices: choices,
            };
            return React.createElement(ShareChoicesComponent, props);
          });
          this.setState({
            shareCardChoices: choices,
          });
        }
      }
    }

    shareResearcher(
      researcher: Client.Player,
      target_player_index: number,
      curr_player_index: number
    ) {
      const { game, socket } = this.props;
      if (game && socket) {
        if (researcher.hand.length > 0) {
          nextComponent((destroy: () => void) => {
            const props = {
              destroy,
              game: game,
              hand: researcher.hand,
              socket: socket,
              target_player_index: target_player_index,
              curr_player_index: curr_player_index,
            };
            return React.createElement(ShareResearcherComponent, props);
          });
        }
      }
    }

    share(other_player_id: number) {
      const { game, socket } = this.props;
      if (game && socket) {
        let location = game.players[game.player_index].location;
        this.setState({ shareCardChoices: null });
        socket.emit(Client.EventName.Share, other_player_id, null, () => {
          console.log(
            `share with ${other_player_id} at ${location} callbacked`
          );
        });
      }
    }

    onDiscover() {
      const { game } = this.props;
      const { cureColorCards } = this.state;
      if (cureColorCards) {
        this.setState({ cureColorCards: null });
      } else if (game) {
        let player = game.players[game.player_index];
        let cureColorCards = player.hand.filter(
          (card) =>
            game.game_graph[game.game_graph_index[card]].color === game.can_cure
        );
        if (cureColorCards.length === game.cards_needed_to_cure) {
          this.discover(cureColorCards);
        } else {
          this.setState({ cureColorCards: cureColorCards });
          nextComponent((destroy: () => void) => {
            const props = {
              destroy,
              game,
              cureColorCards,
              discover: this.discover,
            };
            return React.createElement(DiscoverComponent, props);
          });
        }
      }
    }

    discover(cards: string[]) {
      const { socket, game } = this.props;
      if (socket && game) {
        this.setState({ cureColorCards: null });
        socket.emit(Client.EventName.Discover, cards, () => {
          console.log(
            `discover with ${cards} at ${
              game.players[game.player_index].location
            } callbacked`
          );
          destroyEvent();
        });
      }
    }

    onPass() {
      const { socket } = this.props;
      if (socket) {
        socket.emit(Client.EventName.Pass);
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

      this.yaw = d3
        .scaleLinear()
        .domain([0, window.innerWidth])
        .range([0, 360]);
    }

    private regenerateNodes(): CityNodeData[] | undefined {
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
        return nodes;
      }
      return;
    }

    private regenerateLinks(nodes?: CityNodeData[]): Link[] | undefined {
      const { game } = this.props;
      if (game && nodes) {
        let values = Object.values(game.game_graph);

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

        return links;
      }
      return;
    }

    onSelectedNode(selectedNode: CityNodeData) {
      const { isMoving } = this.state;
      const { game, socket } = this.props;
      if (game && socket && isMoving && selectedNode.isValidDestination) {
        let curr_player = game.players[game.player_index];
        let curr_city =
          game.game_graph[game.game_graph_index[curr_player.location]];
        let target_city =
          game.game_graph[game.game_graph_index[selectedNode.name]];
        let neighbors = curr_city.neighbors;
        if (
          neighbors.includes(selectedNode.id) ||
          (curr_city.hasResearchStation && target_city.hasResearchStation)
        ) {
          this.moveEmit(selectedNode);
          this.setState({ isMoving: false });
        } else {
          // choice 1 = direct, choice 2 = charter, choice 3 = operations expert
          let choices = [false, false, false];
          if (curr_player.hand.includes(selectedNode.name)) {
            choices[0] = true;
          }
          if (game.can_charter_flight) {
            choices[1] = true;
          }
          if (game.can_operations_expert_move) {
            choices[2] = true;
          }
          if (choices[2] || choices.reduce((a, b) => (b ? a + 1 : a), 0) > 1) {
            nextComponent((destroy: () => void) => {
              const props = {
                destroy,
                game: game,
                hand: curr_player.hand,
                socket: socket,
                canDirect: choices[0],
                canCharter: choices[1],
                canOperationsExpertMove: choices[2],
                currLocation: curr_city.name,
                targetLocation: target_city.name,
              };
              return React.createElement(MoveChoiceSelectorComponent, props);
            });
          } else {
            this.moveEmit(selectedNode);
            this.setState({ isMoving: false });
          }
        }
      }
    }

    moveEmit(selectedNode: CityNodeData) {
      const { socket } = this.props;
      socket?.emit(Client.EventName.Move, selectedNode.name, () => {
        console.log(`move to ${selectedNode.name} success callbacked`);
      });
    }

    setSidebarChildren(item: React.FunctionComponent<SidebarItemProps>) {
      this.setState({ showSidebar: true, sidebarDisplayItem: item });
    }

    hideSidebar() {
      this.setState({ showSidebar: false });
    }

    render() {
      // ... and renders the wrapped component with the fresh data!
      // Notice that we pass through any additional props
      return (
        <WrappedComponent
          game={this.props.game}
          socket={this.props.socket}
          player_name={this.props.player_name}
          player_index={this.props.player_index}
          projection={this.projection}
          state={this.state}
          onSelectedNode={this.onSelectedNode}
          onMove={this.onMove}
          onBuild={this.onBuild}
          onTreat={this.onTreat}
          onShare={this.onShare}
          onDiscover={this.onDiscover}
          onPass={this.onPass}
          setSidebarChildren={this.setSidebarChildren}
          hideSidebar={this.hideSidebar}
        ></WrappedComponent>
      );
    }
  };
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

  canPass() {
    return (
      this.game.turns_left > 0 &&
      this.game.game_state === Client.GameState.Ready
    );
  }

  onPass() {
    this.socket.emit("pass");
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

}*/

export class ShareCard {
  public static Take = "Take from";
  public static Give = "Give";

  constructor(
    readonly action: string,
    readonly player_id: number,
    readonly location: string | null,
    readonly onClick: () => void
  ) {}
}

export default withGameState;
