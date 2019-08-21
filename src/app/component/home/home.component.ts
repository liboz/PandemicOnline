import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.styl']
})
export class HomeComponent implements OnInit {
  match_name: string = ""
  constructor(private router: Router) { }

  ngOnInit() {
  }
  
  startGame() {
    if (this.match_name) {
      this.router.navigate([`/game/${this.match_name}`]);
    } 
  }

}
