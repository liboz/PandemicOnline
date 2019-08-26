import { Component, OnInit, Input, ViewEncapsulation, SimpleChanges, ErrorHandler, OnChanges } from '@angular/core';
import { ModalService } from '../../service/modal.service';
import * as d3 from 'd3';
import * as $ from 'jquery'
import geo from '../../../../data/geo.json';
import { ModalComponent } from '../modal/modal.component'
import { PlayerComponent } from '../player/player.component';

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
  shareCardChoices: number[] = null;
  cureColorCards: string[] = null;

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
        this.modalService.init(ModalComponent, { lost: true }, {})
      } else if (changes.game.currentValue.game_state === GameState.Won) {
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
      this.socket.emit('move', selectedNode.name, () => {
        console.log(`move to ${selectedNode.name} success callbacked`)
      })
      this.isMoving = false;
    }
  }

  onSelectedCard(cardIndex: any) {
    if (!this.selectedCards.delete(cardIndex)) {
      this.selectedCards.add(cardIndex)
    }
  }

  onStart() {
    this.socket.emit('start game')
  }

  onMove() {
    this.isMoving = !this.isMoving;
  }

  onBuild() {
    this.socket.emit('build')
  }

  onTreat() {
    let location = this.game.players[this.game.player_index].location
    let cubes = this.game.game_graph[this.game.game_graph_index[location]].cubes
    let cubes_on = Object.keys(cubes).filter(i => cubes[i] > 0)
    if (cubes_on.length === 1) {
      this.treat(cubes_on[0])
    } else {
      this.treatColorChoices = cubes_on;
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
      let location = this.game.players[this.game.player_index].location
      let location_players = this.game.game_graph[this.game.game_graph_index[location]].players
      if ((this.game.can_give && !this.game.can_take)
        || (this.game.can_take && !this.game.can_give)) {
        let other_players = location_players.filter(i => i !== this.game.player_index)
        if (location_players.length === 2) {
          let other_player = other_players[0]
          this.share(other_player)
        } else if (this.game.can_take) {
          let other_player = other_players.filter(i => this.game.players[i].hand.includes(location))
          this.share(other_player)
        } else {
          this.shareCardChoices = other_players
        }
      } else if (this.game.can_give && this.game.can_take) { // dispatcher

      }
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
    return this.game.game_state === GameState.DiscardingCard;
  }

  discardEnough() {
    return this.game.players[this.game.player_index].hand.length - this.selectedCards.size === 7
  }

  discardSelectedCards() {
    this.socket.emit('discard', [...this.selectedCards].map(i => this.game.players[this.game.player_index].hand[i]), () => {
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
}


export const GameState = {
  NotStarted: 0,
  Ready: 1,
  DiscardingCard: 2,
  Won: 3,
  Lost: 4
}
