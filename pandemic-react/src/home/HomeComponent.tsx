import { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";

import "./HomeComponent.css";

export function HomeComponent() {
  const [matchName, setMatchName] = useState("");
  const history = useHistory();
  const startGame = useCallback(() => history.push(`/game/${matchName}`), [
    history,
    matchName,
  ]);

  return (
    <div id="home-input">
      <h1>Pandemic Online</h1>
      Play Pandemic online across multiple devices on a shared board. To create
      a new game or join an existing game, enter a game identifier and click
      'GO'.
      <div>
        <input onChange={(e) => setMatchName(e.target.value)} />
        <button onClick={startGame}>GO</button>
      </div>
    </div>
  );
}
