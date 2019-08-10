import { Component, OnInit } from '@angular/core';
import { ApiService } from './service/api.service';

import io from "socket.io-client";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.styl']
})
export class AppComponent implements OnInit {
  title = 'Pandemic Online';

  private socket: any;
  private game: any;

  constructor(private api: ApiService) { }

  public ngOnInit() {
    this.api.getGames().subscribe(result => {
      this.game = result
      this.socket = io('http://localhost:3000', {
        transports: ['websocket']
      });

      this.socket.on("new game", data => {
        this.game = data
        console.log(data)
    });
    })

  }

  public ngAfterViewInit() {
    
}
}
