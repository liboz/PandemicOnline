import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { GameComponent } from './component/game/game.component';
import { NodeComponent } from './component/node/node.component';
import { LinkComponent } from './component/link/link.component';
import { DiseaseCubeComponent } from './component/disease-cube/disease-cube.component';
import { PlayerComponent } from './component/player/player.component';
import { PlayerHandComponent } from './component/player-hand/player-hand.component';
import { ModalComponent } from './component/modal/modal.component';
import { ModalService } from './service/modal.service'
import { DomService } from './service/dom.service'

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    NodeComponent,
    LinkComponent,
    DiseaseCubeComponent,
    PlayerComponent,
    PlayerHandComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [ModalService, DomService],
  bootstrap: [AppComponent]
})
export class AppModule { }
