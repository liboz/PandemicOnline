import React, { FC } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import GameSocketComponent from "./game-socket/GameSocketComponent";
import { HomeComponent } from "./home/HomeComponent";

const AppRouter: FC = (props) => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/home">
          <HomeComponent />
        </Route>
        <Route path="/game/:match_name">
          <GameSocketComponent />
        </Route>
        <Route path="*">
          <HomeComponent />
        </Route>
      </Switch>
    </BrowserRouter>
  );
};

export default AppRouter;
