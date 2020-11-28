import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "[app-node]",
  templateUrl: "./node.component.html",
  styleUrls: ["./node.component.styl"],
})
export class NodeComponent implements OnInit {
  @Input("app-node") node: any;
  @Input() isMoving: boolean;
  @Output() selected = new EventEmitter<any>();
  constructor() {}

  ngOnInit() {}

  public select(event) {
    this.selected.emit(this.node);
  }
}
