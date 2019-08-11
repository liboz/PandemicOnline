import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { GameComponent } from './component/game/game.component';
import { NodeComponent } from './component/node/node.component';
import { LinkComponent } from './component/link/link.component'; 

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    NodeComponent,
    LinkComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
