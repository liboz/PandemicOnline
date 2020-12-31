import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { destroyEvent } from "../Subscriptions";
import DivHand from "../player/DivHand";
import { getEventCardsInHand } from "../utils";

interface EventCardProps {
  game: Client.Game;
  socket: SocketIOClient.Socket;
  player_index: number;
}

interface EventCardState {
  arg1?: string | number;
  arg2?: string;
}

export class EventCardComponent extends React.Component<
  EventCardProps,
  EventCardState
> {
  constructor(props: EventCardProps) {
    super(props);
    this.state = { arg1: undefined, arg2: undefined };
  }

  onCancel() {
    destroyEvent();
  }

  displayEventCard(eventCard: Client.EventCard) {
    const { game } = this.props;
    switch (eventCard) {
      case Client.EventCard.Airlift:
        /*
      if (typeof arg1 === "number" && typeof arg2 === "string") {
        // arg1 is playerIndex and arg2 is final destination
        const target_player = game.players[arg1];
        handleAirlift(target_player, game, game_graph, arg2, clientWebSocket);
      }*/
        break;
      case Client.EventCard.Forecast: // todo
      case Client.EventCard.GovernmentGrant:
        return (
          <div>
            Select City To Build Research Station:{" "}
            <select>
              {game.game_graph
                .filter((city) => !city.hasResearchStation)
                .map((city) => (
                  <option value={city.name}>{city.name}</option>
                ))}
            </select>
          </div>
        );
      /*
      if (typeof arg1 === "number") {
        // arg1 is playerIndex
        const target_player = game.players[arg1];
        handleGovernmentGrant(target_player, game);
      }*/
      case Client.EventCard.OneQuietNight:
        //handleOneQuietNight(game);
        break;
      case Client.EventCard.ResilientPopulation:
        /*
      if (typeof arg1 === "string") {
        // arg1 is card
        handleResilientPopulation(game, arg1);
      }*/
        break;
    }
  }

  render() {
    const { game, player_index } = this.props;
    const eventCards = getEventCardsInHand(game, player_index);
    console.log(eventCards);
    return (
      <div>
        {eventCards.map((eventCard) => {
          return (
            <>
              <div key={`eventcardholder-${eventCard}`}>
                {eventCard}
                {this.displayEventCard(eventCard)}
              </div>
              <hr></hr>
            </>
          );
        })}
        <button onClick={this.onCancel}>Cancel</button>
      </div>
    );
  }
}
