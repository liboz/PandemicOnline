import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { FormsModule } from "@angular/forms";

import { HttpClientModule } from "@angular/common/http";
import { GameComponent } from "./component/game/game.component";
import { NodeComponent } from "./component/node/node.component";
import { LinkComponent } from "./component/link/link.component";
import { PlayerHandComponent } from "./component/player-hand/player-hand.component";
import { ModalComponent } from "./component/modal/modal.component";
import { ModalService } from "./service/modal.service";
import { DomService } from "./service/dom.service";
import { HomeComponent } from "./component/home/home.component";
import { GameSocketComponent } from "./component/game-socket/game-socket.component";
import { JoinComponent } from "./component/join/join.component";
import { MoveChoiceSelectorComponent } from "./component/move-choice-selector/move-choice-selector.component";
import { ResearcherShareSelectorComponent } from "./component/researcher-share-selector/researcher-share-selector.component";
import { SnackbarComponent } from "./component/snackbar/snackbar.component";
import { SnackbarService } from "./service/snackbar.service";
import { DispatcherMoveComponent } from "./component/dispatcher-move/dispatcher-move.component";
import { StartGameComponent } from "./start-game/start-game.component";

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    NodeComponent,
    LinkComponent,
    PlayerHandComponent,
    ModalComponent,
    HomeComponent,
    GameSocketComponent,
    JoinComponent,
    MoveChoiceSelectorComponent,
    ResearcherShareSelectorComponent,
    SnackbarComponent,
    DispatcherMoveComponent,
    StartGameComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
  ],
  providers: [ModalService, DomService, SnackbarService],
  bootstrap: [AppComponent],
})
export class AppModule {}
