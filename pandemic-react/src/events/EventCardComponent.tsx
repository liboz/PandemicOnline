import { Client } from "pandemiccommon/dist/out-tsc";
import React from "react";
import { closeEventCard } from "../Subscriptions";
//import DivHand from "../player/DivHand";
import { formatPlayer, getEventCardsInHand, playerInfo } from "../utils";
import Select from "react-select";

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
  eventCardIndex: number;
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
    this.state = {
      eventCardIndex: 0,
      arg1: undefined,
      arg2: undefined,
      selectOption: null,
    };
    this.onGovernmentGrant = this.onGovernmentGrant.bind(this);
    this.onAirlift = this.onAirlift.bind(this);
    this.onOneQuietNight = this.onOneQuietNight.bind(this);
    this.onResilientPopulation = this.onResilientPopulation.bind(this);
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

  onOneQuietNight(eventCard: string) {
    const { socket, player_index } = this.props;

    socket.emit(Client.EventName.EventCard, eventCard, player_index);
  }

  onResilientPopulation(eventCard: string) {
    const { socket, player_index } = this.props;
    const { arg1 } = this.state;

    socket.emit(Client.EventName.EventCard, eventCard, player_index, arg1);
  }

  onCancel() {
    closeEventCard();
  }

  displayEventCard(eventCard: Client.EventCard) {
    const { game } = this.props;
    const { arg1, arg2, selectOption } = this.state;
    switch (eventCard) {
      case Client.EventCard.Airlift: {
        let { options, colourStyles } = generateSelectStylesAndOptions(
          game,
          () => true
        );

        const playerOptions: ColoredSelectOption[] = game.players.map(
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
                const value = data?.value;
                if (value) {
                  this.setState({
                    arg1: parseInt(value),
                  });
                }
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
              {typeof arg1 === "number" && formatPlayer(game.players[arg1])} to{" "}
              {arg2}
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
      case Client.EventCard.OneQuietNight:
        return (
          <div>
            {" "}
            <button onClick={() => this.onOneQuietNight(eventCard)}>
              Play One Quiet Night
            </button>
          </div>
        );
      case Client.EventCard.ResilientPopulation:
        let { options, colourStyles } = generateSelectStylesAndOptions(
          game,
          (city) => game.infection_faceup_deck.includes(city.name)
        );
        return (
          <div>
            Select Card from Infection Deck to Remove
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
              onClick={() => this.onResilientPopulation(eventCard)}
            >
              Use Resilient Population to remove {arg1} from the infection deck
            </button>
          </div>
        );
    }
  }

  render() {
    const { game, player_index } = this.props;
    const { eventCardIndex } = this.state;
    const eventCards = getEventCardsInHand(game, player_index);

    const options: SelectOption[] = eventCards.map((card, index) => {
      return {
        value: index.toString(),
        label: card,
      };
    });
    console.log(eventCards);
    return (
      <div>
        {eventCards.length > 1 && (
          <Select<SelectOption>
            onChange={(data) => {
              const value = data?.value;
              if (value) {
                this.setState(
                  {
                    eventCardIndex: parseInt(value),
                  },
                  () => console.log(this.state)
                );
              }
            }}
            placeholder={"Select Event Card"}
            options={options}
          />
        )}

        <div key={`eventcardholder-${eventCards[eventCardIndex]}`}>
          <span style={{ textDecoration: "underline" }}>
            {eventCards[eventCardIndex]}
          </span>
          {this.displayEventCard(eventCards[eventCardIndex])}
        </div>
        <hr></hr>

        <button onClick={this.onCancel}>Cancel</button>
      </div>
    );
  }
}
