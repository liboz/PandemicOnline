import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { destroyEvent } from "../Subscriptions";
import DivHand from "../player/DivHand";
import { getEventCardsInHand } from "../utils";
import Select from "react-select";

interface EventCardProps {
  game: Client.Game;
  socket: SocketIOClient.Socket;
  player_index: number;
}

interface SelectOption {
  value: string;
  label: string;
  color: string;
}

interface EventCardState {
  selectOption?: SelectOption | null;
  arg1?: string | number;
  arg2?: string;
}

const dot = (color = "#ccc") => ({
  alignItems: "center",
  display: "flex",

  ":before": {
    backgroundColor: color,
    borderRadius: 10,
    content: '" "',
    display: "block",
    marginRight: 8,
    height: 10,
    width: 10,
  },
});

export class EventCardComponent extends React.Component<
  EventCardProps,
  EventCardState
> {
  constructor(props: EventCardProps) {
    super(props);
    this.state = { arg1: undefined, arg2: undefined, selectOption: null };
    this.onGovernmentGrant = this.onGovernmentGrant.bind(this);
  }

  onGovernmentGrant(eventCard: string) {
    const { socket, player_index } = this.props;
    const { arg1 } = this.state;

    socket.emit(Client.EventName.EventCard, eventCard, player_index, arg1);
  }

  onCancel() {
    destroyEvent();
  }

  displayEventCard(eventCard: Client.EventCard) {
    const { game } = this.props;
    const { arg1, arg2, selectOption } = this.state;
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
        const options = game.game_graph
          .filter((city) => !city.hasResearchStation)
          .map((city) => {
            return {
              value: city.name,
              label: city.name,
              color: city.color,
            };
          });

        const colourStyles: any = {
          control: (styles: any) => ({ ...styles, backgroundColor: "white" }),
          option: (styles: any, { data }: any) => {
            return {
              ...styles,
              ...dot(data.color),
            };
          },
          input: (styles: any) => ({ ...styles, ...dot() }),
          placeholder: (styles: any) => ({ ...styles, ...dot() }),
          singleValue: (styles: any, { data }: any) => ({
            ...styles,
            ...dot(data.color),
          }),
        };
        return (
          <div>
            Select City To Build Research Station:{" "}
            <Select<SelectOption>
              onChange={(data) => {
                this.setState({
                  selectOption: data,
                  arg1: data?.value,
                });
              }}
              defaultValue={selectOption}
              label="Select City To Build Research Station"
              options={options}
              styles={colourStyles}
            />
            <button onClick={() => this.onGovernmentGrant(eventCard)}>
              Make Research Station on {arg1}
            </button>
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
