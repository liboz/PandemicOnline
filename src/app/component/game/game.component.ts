import { Component, OnInit, Input, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import * as $ from 'jquery'
import geo from '../../../../data/geo.json';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.styl'],
  encapsulation: ViewEncapsulation.None
})
export class GameComponent implements OnInit {
  objectKeys = Object.keys;
  @Input() game: any;

  w = 3000;
  h = 1250;

  zoomed: any;

  zoom: any;

  svg: any;

  countriesGroup: any;

  minZoom: number;
  maxZoom: number;

  getTextBox(selection) {
    selection
      .each(function (d) {
        d.bbox = this.getBBox();
      })
      ;
  }

  constructor() { }

  ngOnInit() {

    this.svg = d3.select("#map-holder")
      .append("svg")
      // set to the same size as the "map-holder" div
      .attr("width", $("#map-holder").width())
      .attr("height", $("#map-holder").height())
    //Bind data and create one path per GeoJSON feature
    this.countriesGroup = this.svg.append("g").attr("id", "map")
    // add zoom functionality
    this.zoomed = function() {
      let t = d3.event.transform;
      d3.select("g").attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
    }
    this.zoom = d3.zoom().on("zoom", this.zoomed);
    //this.svg.call(this.zoom)
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
    // variables for catching min and max zoom factors


    var projection = d3
      .geoEquirectangular()
      .center([0, 15]) // set centre to further North as we are cropping more off bottom of map
      .scale(this.w / (2 * Math.PI)) // scale to fit group width
      .translate([this.w / 2, this.h / 2]) // ensure centred in group
      ;
    var path = d3
      .geoPath()
      .projection(projection)
      ;
    // add a background rectangle
    this.countriesGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.w)
      .attr("height", this.h);

    // draw a path for each feature/country
    let countries = this.countriesGroup
      .selectAll("path")
      .data(geo.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("id", function (d: any, i) {
        return "country" + d.properties.iso_a3;
      })
      .attr("class", "country")
      //      .attr("stroke-width", 10)
      //      .attr("stroke", "#ff0000")
      // add a mouseover action to show name label for feature/country
      .on("mouseover", function (d: any, i) {
        d3.select("#countryLabel" + d.properties.iso_a3).style("display", "block");
      })
      .on("mouseout", function (d: any, i) {
        d3.select("#countryLabel" + d.properties.iso_a3).style("display", "none");
      })
      // add an onclick action to zoom into clicked country
      /*
      .on("click", function (d: any, i) {
        d3.selectAll(".country").classed("country-on", false);
        d3.select(this).classed("country-on", true);
        //outer.boxZoom(path.bounds(d), path.centroid(d), 20);
      });*/
    // Add a label group to each feature/country. This will contain the country name and a background rectangle
    // Use CSS to have class "countryLabel" initially hidden

    /*
    let outer = this
    let countryLabels = this.countriesGroup
      .selectAll("g")
      .data(geo.features)
      .enter()
      .append("g")
      .attr("class", "countryLabel")
      .attr("id", function (d: any) {
        return "countryLabel" + d.properties.iso_a3;
      })
      .attr("transform", function (d: any) {
        return (
          "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")"
        );
      })
      // add mouseover functionality to the label
      .on("mouseover", function (d, i) {
        d3.select(this).style("display", "block");
      })
      .on("mouseout", function (d, i) {
        d3.select(this).style("display", "none");
      })
      // add an onlcick action to zoom into clicked country
      .on("click", function (d: any, i) {
        d3.selectAll(".country").classed("country-on", false);
        d3.select("#country" + d.properties.iso_a3).classed("country-on", true);
        //outer.boxZoom(path.bounds(d), path.centroid(d), 20);
      });
    // add the text to the label group showing country name
    countryLabels
      .append("text")
      .attr("class", "countryName")
      .style("text-anchor", "middle")
      .attr("dx", 0)
      .attr("dy", 0)
      .text(function (d: any) {
        return d.properties.name;
      })
      .call(this.getTextBox);
    // add a background rectangle the same size as the text
    countryLabels
      .insert("rect", "text")
      .attr("class", "countryLabelBg")
      .attr("transform", function (d: any) {
        return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
      })
      .attr("width", function (d: any) {
        return d.bbox.width + 4;
      })
      .attr("height", function (d: any) {
        return d.bbox.height;
      });
      */
    this.initiateZoom();
  }

}
