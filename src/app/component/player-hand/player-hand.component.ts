import { Component, OnInit, Input, SimpleChanges, Output, EventEmitter} from '@angular/core';

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
  constructor() { }

  ngOnChange(changes: SimpleChanges) {
    if (this.hand) {
      this.selected = this.hand.map(i => false);
    }
  }

  ngOnInit() {
    this.selected = this.hand.map(i => false)
  }

  handleClick(i: number) {
    let count = 0
    this.selected.forEach(i => {
      if (i) {
        count += 1
      }
    })
    if (this.hand.length - count > 7 || this.selected[i]) {
      this.selected[i] = !this.selected[i];
      console.log(i)
      this.onSelect.emit(i)
    }    
  }
}
