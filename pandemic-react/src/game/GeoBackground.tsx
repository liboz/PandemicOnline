import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";
import geo from "../data/geo";
import Link from "../link/link";

const features = geo.features;

interface GeoBackgroundProps {
  projection: d3.GeoProjection;
  links: Link[];
}

const TYPE = "Geobackground";
export const behavior = {
  customDisplayObject: (props: GeoBackgroundProps) => new PIXI.Graphics(),
  customApplyProps: function (
    instance: PIXI.Graphics,
    oldProps: GeoBackgroundProps,
    newProps: GeoBackgroundProps
  ) {
    const { projection, links } = newProps;
    const path: any = d3
      .geoPath()
      .projection(projection)
      .context(instance as any);
    for (const feature of features) {
      instance.beginFill(0x8c8c8d, 1);
      instance.lineStyle(1, 0x2a2c39, 1);
      path(feature);
      instance.endFill();
    }

    // generate links/nodes
    for (const link of links) {
      instance.lineStyle(5, 0xe5c869);
      instance.moveTo(link.source.x, link.source.y);
      instance.lineTo(link.target.x, link.target.y);
    }
  },
};
export default CustomPIXIComponent(behavior, TYPE);
