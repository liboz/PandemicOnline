import {
  Component,
  OnInit,
  Input,
  ViewEncapsulation,
  SimpleChanges,
  OnChanges,
  Directive,
  NgZone,
  ElementRef,
} from "@angular/core";
import { ModalService } from "../../service/modal.service";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import geo from "../../../../data/geo";
import { ModalComponent } from "../modal/modal.component";
import { MoveChoiceSelectorComponent } from "../move-choice-selector/move-choice-selector.component";
import { Subscription } from "rxjs";
import { ResearcherShareSelectorComponent } from "../researcher-share-selector/researcher-share-selector.component";
import { Client } from "pandemiccommon/dist/out-tsc/";
import { DispatcherMoveComponent } from "../dispatcher-move/dispatcher-move.component";
import Link from "../link/link";
import CityNode, { getAllSubelements, PIXICityNode } from "../node/node";
import { colorNameToHex } from "src/app/utils";
import { StartGameComponent } from "src/app/start-game/start-game.component";
import { playerInfo, maybeGeneratePlayerIcons } from "../player/player";
import { maybeGenerateCubes } from "../disease-cube/diseaseCube";

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.styl"],
  encapsulation: ViewEncapsulation.None,
})
export class GameComponent implements OnInit, OnChanges {
  objectKeys = Object.keys;
  @Input() game: Client.Game;
  @Input() socket: SocketIOClient.Socket;
  @Input() player_name: string;
  @Input() player_index: number;

  features = geo.features;
  w = 2500;
  h = 1250;
  pixiApp: PIXI.Application;
  pixiGraphics: PIXI.Graphics;

  minZoom: number;
  maxZoom: number;

  nodes: CityNode[];
  nodeGraphics: Record<string, PIXICityNode> = {};
  links: Link[];
  isMoving: boolean;
  treatColorChoices: string[] = null;
  shareCardChoices: ShareCard[] = null;
  cureColorCards: string[] = null;
  destroySubscription: Subscription;
  clearShareCardsSubscription: Subscription;
  dispatcherMoveSubscription: Subscription;
  dispatcherMoveOtherPlayer: number;

  rootProjection: d3.GeoProjection;
  projection: d3.GeoProjection;

  yaw: d3.ScaleLinear<number, number, never>;

  path: any; // use any to avoid some typing issues

  initialized = false;
  selectedCards: Set<number>;
  constructor(
    private modalService: ModalService,
    private ngZone: NgZone,
    private elementRef: ElementRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    // TODO: HANDLE
    /*
    if (this.initialized) {
      this.createChart();
    }*/
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

  zoomed(event) {
    var scale = this.rootProjection.scale();
    var translate = this.rootProjection.translate();
    var t = event.transform;
    var tx = translate[0] - t.invertX(translate[0]);
    var ty = translate[1] * t.k + t.y;

    this.projection
      .scale(t.k * scale)
      .rotate([this.yaw(tx), 0, 0])
      .translate([translate[0], ty]);

    this.renderBase();
    this.renderChanging();
  }

  ngOnInit() {
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
      });
    });
    this.pixiApp.renderer.autoDensity = true;
    PIXI.settings.RESOLUTION = 2 * window.devicePixelRatio;
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    this.elementRef.nativeElement.appendChild(this.pixiApp.view);
    this.preRender();
    this.renderBase();
    this.renderChanging();

    this.pixiApp.renderer.on("resize", () => {
      this.preRender();
      this.renderBase();
      this.renderChanging();
    });

    this.loopCubes();
  }

  loopCubes() {
    setInterval(() => {
      for (const node of this.nodes) {
        for (const cube of this.nodeGraphics[node.name].cubes) {
          console.log(cube);
          this.pixiGraphics.removeChild(cube);
          cube.destroy();
        }
        const cubes = maybeGenerateCubes(node);
        this.nodeGraphics[node.name].cubes = cubes;
        for (const cube of this.nodeGraphics[node.name].cubes) {
          this.pixiGraphics.addChild(cube);
        }
      }
    }, 10);
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

    var zoom = d3
      .zoom()
      .scaleExtent([1, 5])
      .extent([
        [0, 0],
        [window.innerWidth, window.innerHeight],
      ])
      .translateExtent([
        [-Infinity, 0],
        [Infinity, window.innerHeight],
      ])
      .on("zoom", (event) => this.zoomed(event));
    d3.select("canvas").call(zoom);
  }

  private renderBase() {
    this.pixiApp.stage.removeChild(this.pixiGraphics);
    this.pixiGraphics = new PIXI.Graphics();

    this.path = d3
      .geoPath()
      .projection(this.projection)
      .context(this.pixiGraphics as any);

    // generate features
    for (const feature of this.features) {
      this.pixiGraphics.beginFill(0x8c8c8d, 1);
      this.pixiGraphics.lineStyle(1, 0x2a2c39, 1);
      this.path(feature);
      this.pixiGraphics.endFill();
    }

    // generate links/nodes
    this.regenerateLinksAndNodes();
    for (const link of this.links) {
      this.pixiGraphics.lineStyle(5, 0xe5c869);
      this.pixiGraphics.moveTo(link.source.x, link.source.y);
      this.pixiGraphics.lineTo(link.target.x, link.target.y);
    }

    this.pixiApp.stage.addChild(this.pixiGraphics);
    this.pixiApp.stage.addListener;
  }

  private renderChanging() {
    for (const node of this.nodes) {
      const graphics = new PIXI.Graphics();
      const color = colorNameToHex(node.color);
      if (color) {
        graphics.lineStyle(5, Number(color));
        graphics.beginFill(Number(color));
      }
      graphics.drawCircle(node.x, node.y, 10);
      if (color) {
        graphics.endFill();
      }

      this.pixiGraphics.addChild(graphics);
      var text = new PIXI.Text(node.name, {
        fill: 0xffffff,
        fontSize: 18,
        stroke: "black",
        strokeThickness: 3,
        align: "center",
      });
      text.x = node.x - 30;
      text.y = node.y - 30;
      this.nodeGraphics[node.name] = {
        cubes: [],
        players: [],
        mainNode: graphics,
        text: text,
      };
      this.pixiGraphics.addChild(text);
    }

    for (const node of this.nodes) {
      if (node.hasResearchStation) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(3, 0x000000);
        graphics.beginFill(0xffffff);
        const baseX = node.x;
        const baseY = node.y;
        graphics.drawPolygon([
          new PIXI.Point(baseX + 10, baseY + 5),
          new PIXI.Point(baseX, baseY + 20),
          new PIXI.Point(baseX, baseY + 30),
          new PIXI.Point(baseX + 20, baseY + 30),
          new PIXI.Point(baseX + 20, baseY + 20),
        ]);
        graphics.endFill();
        this.nodeGraphics[node.name].researchStation = graphics;
      }
      const playerIcons = maybeGeneratePlayerIcons(node);
      this.nodeGraphics[node.name].players = playerIcons;
      const cubes = maybeGenerateCubes(node);
      this.nodeGraphics[node.name].cubes = cubes;
    }

    for (const graphics of Object.values(this.nodeGraphics)) {
      for (const graphic of getAllSubelements(graphics)) {
        this.pixiGraphics.addChild(graphic);
      }
    }
  }

  private regenerateLinksAndNodes(): void {
    let values = Object.values(this.game.game_graph);
    this.nodes = values.map((d) => {
      return {
        id: d.index,
        x: this.projection(d.location)[0],
        y: this.projection(d.location)[1],
        color: d.color,
        name: d.name,
        cubes: d.cubes,
        hasResearchStation: d.hasResearchStation,
        players: d.players,
      };
    });

    if (this.game.valid_final_destinations) {
      this.game.valid_final_destinations.forEach((c) => {
        this.nodes[c].isValidDestination = true;
      });
    }

    this.links = [];
    values.forEach((d) => {
      d.neighbors.forEach((n) => {
        if (d.location[0] * values[n].location[0] < -10000) {
          // these are cross pacific differences
          let left_diff = Math.min(this.nodes[d.index].x, this.nodes[n].x);
          let right_diff =
            this.w - Math.max(this.nodes[d.index].x, this.nodes[n].x);
          let slope =
            (this.nodes[d.index].y - this.nodes[n].y) /
            (left_diff + right_diff);
          if (d.location[0] < 0) {
            this.links.push({
              source: this.nodes[d.index],
              target: { x: 0, y: this.nodes[d.index].y - slope * left_diff },
            }); // western hemisphere
          } else {
            this.links.push({
              source: this.nodes[d.index],
              target: {
                x: 3000,
                y: this.nodes[d.index].y - slope * right_diff,
              },
            }); // eastern hemisphere
          }
        } else {
          this.links.push({
            source: this.nodes[d.index],
            target: this.nodes[n],
          });
        }
      });
    });
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

  hasStarted() {
    return this.game?.game_state !== Client.GameState.NotStarted;
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
}

@Directive()
class ShareCard {
  public static Take = "Take from";
  public static Give = "Give";

  action: string;
  location: string;
  player_id: number;
  onClick: () => void;
  constructor(action, player_id, location, onClick) {
    this.action = action;
    this.player_id = player_id;
    this.location = location;
    this.onClick = onClick;
  }

  ngOnInit() {}
}
