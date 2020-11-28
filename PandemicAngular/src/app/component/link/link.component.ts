import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "[app-link]",
  templateUrl: "./link.component.html",
  styleUrls: ["./link.component.styl"],
})
export class LinkComponent implements OnInit {
  @Input("app-link") link: any;
  constructor() {}

  ngOnInit() {}
}
