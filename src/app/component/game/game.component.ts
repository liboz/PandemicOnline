import { Component, OnInit, Input, ViewEncapsulation, SimpleChanges, ErrorHandler, OnChanges } from '@angular/core';
import { ModalService } from '../../service/modal.service';
import * as d3 from 'd3';
import * as $ from 'jquery'
import geo from '../../../../data/geo.json';
import { ModalComponent } from '../modal/modal.component'
import { PlayerComponent } from '../player/player.component';
import { MoveChoiceSelectorComponent } from '../move-choice-selector/move-choice-selector.component';
import { Subscription } from 'rxjs';
import { ResearcherShareSelectorComponent } from '../researcher-share-selector/researcher-share-selector.component';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.styl'],
  encapsulation: ViewEncapsulation.None
})
export class GameComponent implements OnInit, OnChanges {
  objectKeys = Object.keys;
  @Input() game: any;
  @Input() socket: any;
  @Input() player_name: string;
  @Input() player_index: number;

  features = geo.features
  w = 2500;
  h = 1250;

  zoomed: any;

  zoom: any;

  svg: any;

  countriesGroup: any;

  minZoom: number;
  maxZoom: number;


  nodes: any;
  links: any;
  isMoving: any;
  treatColorChoices: string[] = null;
  shareCardChoices: ShareCard[] = null;
  cureColorCards: string[] = null;
  destroySubscription: Subscription
  clearShareCardsSubscription: Subscription
  difficulties = Object.entries(GameDifficulty)
  selectedDifficulty: number;

  getTextBox(selection) {
    selection
      .each(function (d) {
        d.bbox = this.getBBox();
      })
      ;
  }

  projection = d3
    .geoEquirectangular()
    .center([0, 15]) // set centre to further North as we are cropping more off bottom of map
    .scale(this.w / (2 * Math.PI)) // scale to fit group width
    .translate([this.w / 2, this.h / 2]); // ensure centred in group

  path = d3
    .geoPath()
    .projection(this.projection);

  initialized = false;
  selectedCards: Set<number>
  constructor(private modalService: ModalService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.initialized) {
      this.createChart()
    }
    if (changes.game) {
      if (changes.game.currentValue.game_state === GameState.Lost) {
        this.modalService.destroy()
        this.modalService.init(ModalComponent, { lost: true }, {})
      } else if (changes.game.currentValue.game_state === GameState.Won) {
        this.modalService.destroy()
        this.modalService.init(ModalComponent, { lost: false }, {})
      }
    }
  }

  ngOnInit() {
    // changes.prop contains the old and the new value...
    this.svg = d3.select("#map-holder > svg")
      // set to the same size as the "map-holder" div
      .attr("width", $("#map-holder").width())
      .attr("height", $("#map-holder").height())
    //Bind data and create one path per GeoJSON feature
    this.countriesGroup = d3.select("#map-holder > svg > g").attr("id", "map")

    // add zoom functionality
    this.zoomed = function () {
      let t = d3.event.transform;
      d3.select("g").attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
    }
    this.zoom = d3.zoom().on("zoom", this.zoomed);
    this.svg.call(this.zoom)
    this.isMoving = false
    this.initialized = true
    this.selectedCards = new Set()
    this.createChart()
    this.destroySubscription = this.modalService.destroy$.subscribe(
      () => {
        this.isMoving = false;
        this.modalService.destroy()
      }
    )

    this.clearShareCardsSubscription = this.modalService.clearShare$.subscribe(() => {
      this.shareCardChoices = null
      this.modalService.destroyEvent()
    })
  }

  // zoom to show a bounding box, with optional additional padding as percentage of box size
  private boxZoom(box, centroid, paddingPerc) {
    let minXY = box[0];
    let maxXY = box[1];
    // find size of map area defined
    let zoomWidth = Math.abs(minXY[0] - maxXY[0]);
    let zoomHeight = Math.abs(minXY[1] - maxXY[1]);
    // find midpoint of map area defined
    let zoomMidX = centroid[0];
    let zoomMidY = centroid[1];
    // increase map area to include padding
    zoomWidth = zoomWidth * (1 + paddingPerc / 100);
    zoomHeight = zoomHeight * (1 + paddingPerc / 100);
    // find scale required for area to fill svg
    let maxXscale = $("svg").width() / zoomWidth;
    let maxYscale = $("svg").height() / zoomHeight;
    let zoomScale = Math.min(maxXscale, maxYscale);
    // handle some edge cases
    // limit to max zoom (handles tiny countries)
    zoomScale = Math.min(zoomScale, this.maxZoom);
    // limit to min zoom (handles large countries and countries that span the date line)
    zoomScale = Math.max(zoomScale, this.minZoom);
    // Find screen pixel equivalent once scaled
    let offsetX = zoomScale * zoomMidX;
    let offsetY = zoomScale * zoomMidY;
    // Find offset to centre, making sure no gap at left or top of holder
    let dleft = Math.min(0, $("svg").width() / 2 - offsetX);
    let dtop = Math.min(0, $("svg").height() / 2 - offsetY);
    // Make sure no gap at bottom or right of holder
    dleft = Math.max($("svg").width() - this.w * zoomScale, dleft);
    dtop = Math.max($("svg").height() - this.h * zoomScale, dtop);
    // set zoom
    this.svg
      .transition()
      .duration(500)
      .call(
        this.zoom.transform,
        d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale)
      );
  }

  initiateZoom() {
    // Define a "minzoom" whereby the "Countries" is as small possible without leaving white space at top/bottom or sides
    this.minZoom = Math.max($("#map-holder").width() / this.w, $("#map-holder").height() / this.h);
    // set max zoom to a suitable factor of this value
    this.maxZoom = 20 * this.minZoom;
    // set extent of zoom to chosen values
    // set translate extent so that panning can't cause map to move out of viewport
    this.zoom
      .scaleExtent([this.minZoom, this.maxZoom])
      .translateExtent([[0, 0], [this.w, this.h]])
      ;
    // define X and Y offset for centre of map to be shown in centre of holder
    let midX = ($("#map-holder").width() - this.minZoom * this.w) / 2;
    let midY = ($("#map-holder").height() - this.minZoom * this.h) / 2;
    // change zoom transform to min zoom and centre offsets
    this.svg.call(this.zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(this.minZoom));
  }

  private createChart(): void {
    let values: any[] = Object.values(this.game.game_graph)
    this.nodes = values.map((d: any) => {
      return {
        id: d.index, x: this.projection(d.location)[0], y: this.projection(d.location)[1],
        color: d.color, name: d.name, cubes: d.cubes, hasResearchStation: d.hasResearchStation,
        players: d.players
      }
    })

    if (this.game.valid_final_destinations) {
      this.game.valid_final_destinations.forEach(c => {
        this.nodes[c].isValidDestination = true;
      })
    }

    this.links = []
    values.forEach((d: any) => {
      d.neighbors.forEach(n => {
        if (d.location[0] * values[n].location[0] < -10000) {
          // these are cross pacific differences
          let left_diff = Math.min(this.nodes[d.index].x, this.nodes[n].x)
          let right_diff = this.w - Math.max(this.nodes[d.index].x, this.nodes[n].x)
          let slope = (this.nodes[d.index].y - this.nodes[n].y) / (left_diff + right_diff)
          if (d.location[0] < 0) {
            this.links.push({
              source: this.nodes[d.index],
              target: { x: 0, y: this.nodes[d.index].y - slope * left_diff }
            }) // western hemisphere 
          } else {
            this.links.push({
              source: this.nodes[d.index],
              target: { x: 3000, y: this.nodes[d.index].y - slope * right_diff }
            }) // eastern hemisphere 
          }
        } else {
          this.links.push({ source: this.nodes[d.index], target: this.nodes[n] })
        }
      })
    })
    this.initiateZoom();
  }

  onSelectedNode(selectedNode: any) {
    if (this.isMoving && selectedNode.isValidDestination) {
      let curr_player = this.game.players[this.game.player_index]
      let curr_city = this.game.game_graph[this.game.game_graph_index[curr_player.location]]
      let target_city = this.game.game_graph[this.game.game_graph_index[selectedNode.name]]
      let neighbors = curr_city.neighbors
      if (neighbors.includes(selectedNode.id) || (curr_city.hasResearchStation && target_city.hasResearchStation)) {
        this.moveEmit(selectedNode)
        this.isMoving = false;
      } else {
        // choice 1 = direct, choice 2 = charter, choice 3 = operations expert
        let choices = [false, false, false]
        if (curr_player.hand.includes(selectedNode.name)) {
          choices[0] = true
        }
        if (this.game.can_charter_flight) {
          choices[1] = true
        }
        if (this.game.can_operations_expert_move) {
          choices[2] = true
        }
        if (choices[2] || choices.reduce((a, b) => b ? a + 1 : a, 0) > 1) {
          this.modalService.init(MoveChoiceSelectorComponent, {
            game: this.game,
            hand: curr_player.hand,
            socket: this.socket,
            canDirect: choices[0],
            canCharter: choices[1],
            canOperationsExpertMove: choices[2],
            currLocation: curr_city.name,
            targetLocation: target_city.name
          }, {})
        } else {
          this.moveEmit(selectedNode)
          this.isMoving = false;
        }
      }
    }
  }

  moveEmit(selectedNode) {
    this.socket.emit('move', selectedNode.name, () => {
      console.log(`move to ${selectedNode.name} success callbacked`)
    })
  }

  onSelectedCard(cardIndex: number) {
    if (!this.selectedCards.delete(cardIndex)) {
      this.selectedCards.add(cardIndex)
    }
  }

  onStart() {
    if (this.selectedDifficulty) {
      this.socket.emit('start game', this.selectedDifficulty)
    }
  }

  onMove() {
    this.isMoving = !this.isMoving;
  }

  onBuild() {
    this.socket.emit('build')
  }

  onTreat() {
    if (this.treatColorChoices) {
      this.treatColorChoices = null
    } else {
      let location = this.game.players[this.game.player_index].location
      let cubes = this.game.game_graph[this.game.game_graph_index[location]].cubes
      let cubes_on = Object.keys(cubes).filter(i => cubes[i] > 0)
      if (cubes_on.length === 1) {
        this.treat(cubes_on[0])
      } else {
        this.treatColorChoices = cubes_on;
      }
    }

  }

  treat(color) {
    this.treatColorChoices = null
    this.socket.emit('treat', color, () => {
      console.log(`treat ${color} at ${this.game.players[this.game.player_index].location} callbacked`)
    })
  }

  onShare() {
    if (this.shareCardChoices) {
      this.shareCardChoices = null
    } else {
      let curr_player = this.game.players[this.game.player_index]
      let location = curr_player.location
      let location_players = this.game.game_graph[this.game.game_graph_index[location]].players
      let other_players_ids = location_players.filter(i => i !== this.game.player_index)
      let other_players = other_players_ids.map(i => this.game.players[i])


      // non researcher case
      if (curr_player.role !== Roles.Researcher && other_players.every(i => i.role !== Roles.Researcher)) {
        // only 2 players
        if (location_players.length === 2) {
          let other_player = other_players_ids[0]
          this.share(other_player)
        } else if (this.game.can_take) {
          // since there is no researcher, there is only 1 possible take option
          let other_player = other_players_ids.filter(i => this.game.players[i].hand.includes(location))
          this.share(other_player)
        } else {
          // we can potentially give to every other player on the same node
          this.shareCardChoices = other_players_ids.map(i => new ShareCard(ShareCard.Give, i, this.game.players[this.game.player_index].location, () => this.share(i)))
        }
      } else {

        // researcher
        if (location_players.length === 2) {
          // just need to figure out who is the researcher and who isn't
          let other_player = other_players_ids[0]
          if (curr_player.role === Roles.Researcher) {
            if (curr_player.hand.length === 0) {
              this.share(other_player)
            } else {
              if (this.game.players[other_player].hand.includes(location)) {
                this.shareCardChoices = [new ShareCard(ShareCard.Take, other_player,
                  this.game.players[this.game.player_index].location, () => this.share(other_player))]
                this.shareCardChoices.push(new ShareCard(ShareCard.Give,
                  other_player, null, () => this.shareResearcher(curr_player, other_player, curr_player.id)))
              } else {
                this.shareResearcher(curr_player, other_player, curr_player.id)
              }
            }
          } else {
            if (curr_player.hand.size === 0 || !curr_player.hand.includes(location)) {
              this.shareResearcher(this.game.players[other_player], other_player, curr_player.id)
            } else {
              let researcher = other_players.filter(i => i.role === Roles.Researcher)[0]
              this.shareCardChoices = [new ShareCard(ShareCard.Give, other_player,
                this.game.players[this.game.player_index].location, () => this.share(other_player))]
              this.shareCardChoices.push(new ShareCard(ShareCard.Take,
                other_player, null, () => this.shareResearcher(researcher, researcher.id, curr_player.id)))
            }

          }
        } else if (this.game.can_take) {
          // since there are multiple players, we can potentially take from 1 other player + a researcher

          let other_player = other_players_ids.filter(i => this.game.players[i].hand.includes(location))
          console.log(other_player)
          if (other_player.length > 0) {
            if (this.game.players[other_player[0]].role === Roles.Researcher) {
              // That one player we can take from is a researcher, in which case we just do researcher take
              this.shareResearcher(this.game.players[other_player], other_player, curr_player.id)
            } else {
              this.shareCardChoices = [new ShareCard(ShareCard.Take, other_player[0],
                this.game.players[this.game.player_index].location, () => this.share(other_player))]
              //  if that researcher is us, the action needs to be a give
              if (curr_player.role === Roles.Researcher) {
                other_players_ids.forEach(id => {
                  this.shareCardChoices.push(new ShareCard(ShareCard.Give,
                    id, null, () => this.shareResearcher(curr_player, id, curr_player.id)))
                });
              } else {
                // otherwise, we can also take from the researcher
                let researcher = other_players.filter(i => i.role === Roles.Researcher)[0]
                this.shareCardChoices.push(new ShareCard(ShareCard.Take,
                  researcher.id, null, () => this.shareResearcher(researcher, researcher.id, this.game.player_index)))
              }
            }
          } else {
            // the one player is non-existent, just a researcher
            let researcher = other_players.filter(i => i.role === Roles.Researcher)[0]
            if (curr_player.role === Roles.Researcher) {
              this.shareResearcher(curr_player, researcher.id, curr_player.id)
            } else {
              this.shareResearcher(researcher, researcher.id, curr_player.id)
            }
          }
        } else {
          // we are giving to another player. 
          // since we should always be able to take from a researcher, this only happens when we are the researcher, so we researcher share
          this.shareCardChoices = other_players_ids.map(id => {
            return new ShareCard(ShareCard.Give,
              id, null, () => this.shareResearcher(curr_player, id, curr_player.id))
          });
        }
      }
    }

  }

  shareResearcher(researcher, target_player_index, curr_player_index) {
    if (researcher.hand.length > 0) {
      this.modalService.init(ResearcherShareSelectorComponent, {
        hand: researcher.hand,
        game: this.game,
        socket: this.socket,
        target_player_index: target_player_index,
        curr_player_index: curr_player_index
      }, {})
    }
  }

  share(other_player) {
    let location = this.game.players[this.game.player_index].location
    this.shareCardChoices = null;
    this.socket.emit('share', other_player, null, () => {
      console.log(`share with ${other_player} at ${location} callbacked`)
    })
  }

  onDiscover() {
    if (this.cureColorCards) {
      let selected = new Set([...this.selectedCards].map(i => this.cureColorCards[i]))
      let cureColorCards = this.cureColorCards.filter(i => !selected.has(i))
      this.selectedCards = new Set()
      this.discover(cureColorCards)
    } else {
      let player = this.game.players[this.game.player_index]
      let cureColorCards = player.hand.filter(card =>
        this.game.game_graph[this.game.game_graph_index[card]].color === this.game.can_cure)
      if (cureColorCards.length === this.game.cards_needed_to_cure) {
        this.discover(cureColorCards)
      } else {
        this.cureColorCards = cureColorCards
      }
    }
  }

  discover(cards) {
    this.cureColorCards = null
    this.socket.emit('discover', cards, () => {
      this.selectedCards = new Set()
      console.log(`discover with ${cards} at ${this.game.players[this.game.player_index].location} callbacked`)
    })
  }

  cancelDiscover() {
    this.cureColorCards = null;
    this.selectedCards = new Set();
  }

  canPass() {
    return this.game.turns_left > 0 && this.game.game_state === GameState.Ready
  }

  onPass() {
    this.socket.emit('pass')
  }

  hasStarted() {
    return this.game && this.game.game_state !== GameState.NotStarted;
  }

  mustDiscard() {
    return this.game.must_discard_index === this.player_index && this.game.game_state === GameState.DiscardingCard;
  }

  discardEnough() {
    return this.game.players[this.game.must_discard_index].hand.length - this.selectedCards.size === 7
  }

  discardSelectedCards() {
    this.socket.emit('discard', [...this.selectedCards].map(i => this.game.players[this.game.must_discard_index].hand[i]), () => {
      this.selectedCards = new Set()
    })
  }

  cannotDoPrimaryAction() {
    return this.isMoving || this.treatColorChoices || this.shareCardChoices || this.cureColorCards ||
      this.game.turns_left <= 0 || this.game.game_state !== GameState.Ready
  }

  bgColor(id: number) {
    return PlayerComponent.playerInfo[id]
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.destroySubscription.unsubscribe();
    this.clearShareCardsSubscription.unsubscribe();
  }
}


export const GameState = {
  NotStarted: 0,
  Ready: 1,
  DiscardingCard: 2,
  Won: 3,
  Lost: 4
}


const Roles = {
  ContingencyPlanner: "Contingency Planner",
  Dispatcher: "Dispatcher",
  Medic: "Medic",
  OperationsExpert: "Operations Expert",
  QuarantineSpecialist: "Quarantine Specialist",
  Researcher: "Researcher",
  Scientist: "Scientist",
}


class ShareCard {
  public static Take = "Take from";
  public static Give = "Give";

  action: string
  location: string
  player_id: number
  onClick: () => void
  constructor(action, player_id, location, onClick) {
    this.action = action
    this.player_id = player_id
    this.location = location
    this.onClick = onClick
  }

  ngOnInit() {
  }
}


const GameDifficulty = {
  Introductory: 4,
  Standard: 5,
  Heroic: 6
}
