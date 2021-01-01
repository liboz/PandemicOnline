import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { destroyEvent } from "../Subscriptions";
import DivHand from "../player/DivHand";
import { formatPlayer, getEventCardsInHand } from "../utils";
import Select from "react-select";
import { playerInfo } from "../player/Player";

interface EventCardProps {
  game: Client.Game;
  socket: SocketIOClient.Socket;
  player_index: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface ColoredSelectOption extends SelectOption {
  color: string;
}

interface EventCardState {
  selectOption?: ColoredSelectOption | null;
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

function generateSelectStylesAndOptions(
  game: Client.Game,
  filterFunction: (city: Client.City) => boolean
) {
  const options: ColoredSelectOption[] = game.game_graph
    .filter(filterFunction)
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

  return { options, colourStyles };
}

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

  onAirlift(eventCard: string) {
    const { socket, player_index } = this.props;
    const { arg1, arg2 } = this.state;

    socket.emit(
      Client.EventName.EventCard,
      eventCard,
      player_index,
      arg1,
      arg2
    );
  }

  onCancel() {
    destroyEvent();
  }

  displayEventCard(eventCard: Client.EventCard) {
    const { game, player_index } = this.props;
    const { arg1, arg2, selectOption } = this.state;
    switch (eventCard) {
      case Client.EventCard.Airlift: {
        let { options, colourStyles } = generateSelectStylesAndOptions(
          game,
          (city) => true
        );
        const otherPlayers = game.players.filter(
          (player) => player.id !== player_index
        );

        const playerOptions: ColoredSelectOption[] = otherPlayers.map(
          (player) => {
            return {
              value: player.id.toString(),
              label: formatPlayer(player),
              color: "#" + playerInfo[player.id].toString(16), // convert from decimal to hex
            };
          }
        );

        return (
          <div>
            Select Player + City to Airlift to
            <Select<SelectOption>
              onChange={(data) => {
                this.setState({
                  arg1: data?.value,
                });
              }}
              placeholder={"Select Player"}
              defaultValue={selectOption}
              options={playerOptions}
              styles={colourStyles}
            />
            <Select<ColoredSelectOption>
              onChange={(data) => {
                this.setState({
                  selectOption: data,
                  arg2: data?.value,
                });
              }}
              placeholder={"Select City"}
              defaultValue={selectOption}
              options={options}
              styles={colourStyles}
            />
            <button
              disabled={arg2 === undefined || arg1 === undefined}
              onClick={() => this.onAirlift(eventCard)}
            >
              Use Airlift to send{" "}
              {typeof arg1 === "string" &&
                formatPlayer(game.players[parseInt(arg1)])}{" "}
              to {arg2}
            </button>
          </div>
        );
      }
      case Client.EventCard.Forecast: // todo
      case Client.EventCard.GovernmentGrant: {
        let { options, colourStyles } = generateSelectStylesAndOptions(
          game,
          (city) => !city.hasResearchStation
        );
        return (
          <div>
            Select City To Build Research Station
            <Select<ColoredSelectOption>
              onChange={(data) => {
                this.setState({
                  selectOption: data,
                  arg1: data?.value,
                });
              }}
              placeholder={"Select City"}
              defaultValue={selectOption}
              options={options}
              styles={colourStyles}
            />
            <button
              disabled={arg1 === undefined}
              onClick={() => this.onGovernmentGrant(eventCard)}
            >
              Make Research Station on {arg1}
            </button>
          </div>
        );
      }
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
                <span style={{ textDecoration: "underline" }}>{eventCard}</span>
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