import { Component, OnInit, Input  } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.styl']
})
export class GameComponent implements OnInit {
  objectKeys = Object.keys;
  @Input() game:any;

  constructor() { }

  ngOnInit() {
  }

}
