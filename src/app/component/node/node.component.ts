import { Component, OnInit, Input  } from '@angular/core';

@Component({
  selector: '[app-node]',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.styl']
})
export class NodeComponent implements OnInit {
  @Input('app-node') node: any;
  constructor() { }

  ngOnInit() {
  }

}
