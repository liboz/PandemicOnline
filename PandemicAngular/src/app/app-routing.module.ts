import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./component/home/home.component";
import { GameSocketComponent } from "./component/game-socket/game-socket.component";

const routes: Routes = [
  { path: "home", component: HomeComponent },
  {
    path: "",
    redirectTo: "/home",
    pathMatch: "full",
  },
  { path: "game/:match_name", component: GameSocketComponent },
  { path: "**", component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: "legacy" })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
