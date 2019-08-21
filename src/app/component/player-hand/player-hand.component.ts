import { Component, OnInit, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-player-hand',
  templateUrl: './player-hand.component.html',
  styleUrls: ['./player-hand.component.styl']
})
export class PlayerHandComponent implements OnInit {
  @Input() hand: string[] = []
  @Input() game: any;
  @Output() onSelect = new EventEmitter<any>();
  result() {
    return this.hand.map((c, index) => {
      return { card: c, selected: this.selected[index] }
    });
  }
  selected: boolean[] = []
  parentEl: HTMLElement
  @Input() cardLimit = 7

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.hand) {
      this.selected = this.hand.map(i => false);
    }
  }

  ngOnInit() {
    this.selected = this.hand.map(i => false)
    this.parentEl = document.getElementById("hand")

  }

  handleClick(i: number) {
    if (this.onSelect.observers.length > 0) {
      let count = 0
      this.selected.forEach(i => {
        if (i) {
          count += 1
        }
      })
      if (this.hand.length - count > this.cardLimit || this.selected[i]) {
        this.selected[i] = !this.selected[i];
        this.onSelect.emit(i)
      }
    }
  }
}
