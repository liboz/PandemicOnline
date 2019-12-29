import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "[app-disease-cube]",
  templateUrl: "./disease-cube.component.html",
  styleUrls: ["./disease-cube.component.styl"]
})
export class DiseaseCubeComponent implements OnInit {
  @Input("app-disease-cube") cubes: any;
  constructor() {}
  container_radius = 25;

  blue = [];
  red = [];
  black = [];
  yellow = [];

  ngOnInit() {
    let count = Number(
      Object.values(this.cubes).reduce((a: any, b: any) => a + b, 0)
    );
    if (count > 0) {
      let i = 0;
      let colors = Object.keys(this.cubes);
      colors.forEach(c => {
        let arr = this[c];
        let num = this.cubes[c];
        for (let j = 0; j < num; j++) {
          arr.push(`orbit-${count.toString()}-${i.toString()}`);
          i++;
        }
      });
    }
  }
}
