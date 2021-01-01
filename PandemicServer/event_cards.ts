import { City } from "./city";
import { ClientWebSocket } from "./client_websocket";
import { Game } from "./game";
import { Client } from "pandemiccommon/dist/out-tsc";
import { Player } from "./player";

export function canUseEventCard(
  eventCard: Client.EventCard,
  card_owner_player_index: number,
  game: Game
) {
  return (
    game.players[card_owner_player_index].hand.has(eventCard) &&
    game.game_state !== Client.GameState.Lost &&
    game.game_state !== Client.GameState.Won &&
    game.game_state !== Client.GameState.NotStarted
  );
}

export function handleEventCard(
  eventCard: Client.EventCard,
  card_owner_player_index: number,
  game: Game,
  game_graph: Record<string, City>,
  clientWebSocket: ClientWebSocket,
  arg1?: string | number,
  arg2?: string
) {
  switch (eventCard) {
    case Client.EventCard.Airlift:
      if (typeof arg1 === "number") {
        // arg1 is playerIndex and arg2 is final destination
        const target_player = game.players[arg1];
        handleAirlift(target_player, game, game_graph, arg2, clientWebSocket);
      }
      break;
    case Client.EventCard.Forecast:
      handleForecastInitial(card_owner_player_index, game);
      // dont discard now, do it after forecast completes
      return;
    case Client.EventCard.GovernmentGrant:
      if (typeof arg1 === "string") {
        // arg1 is location
        handleGovernmentGrant(arg1, game);
      }
      break;
    case Client.EventCard.OneQuietNight:
      handleOneQuietNight(game);
      break;
    case Client.EventCard.ResilientPopulation:
      if (typeof arg1 === "string") {
        // arg1 is card
        handleResilientPopulation(game, arg1);
      }
      break;
  }

  game.players[card_owner_player_index].hand.delete(eventCard);
}

function handleForecastInitial(card_owner_player_index: number, game: Game) {
  game.game_state = Client.GameState.Forecasting;
  const top6InfectionCards = [];
  for (let i = 1; i < 7; i++) {
    const maybeCard = game.infection_deck.facedown_deck.peekAt(-1 * i);
    if (maybeCard !== undefined) {
      top6InfectionCards.push(maybeCard);
    } else {
      break;
    }
  }
  game.top_6_infection_cards = top6InfectionCards;
  game.forecasting_player_index = card_owner_player_index;
}

function handleAirlift(
  target_player: Player,
  game: Game,
  game_graph: Record<string, City>,
  final_destination: string,
  clientWebSocket: ClientWebSocket
) {
  target_player.movePiece(game, game_graph, final_destination, clientWebSocket);
}

function handleGovernmentGrant(location: string, game: Game) {
  game.addResearchStation(location);
}

function handleOneQuietNight(game: Game) {
  game.one_quiet_night_active = true;
}

function handleResilientPopulation(game: Game, targetCard: string) {
  game.infection_deck.removeFromFaceup(targetCard);
}

export function handleForecastComplete(
  game: Game,
  orderedCards: string[],
  clientWebSocket: ClientWebSocket,
  forecastingPlayerIndex: number,
  onDiscardContinue: (clientWebSocket: ClientWebSocket) => void
) {
  for (let i = 0; i < orderedCards.length; i++) {
    game.infection_deck.facedown_deck.pop();
  }
  for (let i = 0; i < orderedCards.length; i++) {
    game.infection_deck.facedown_deck.push(orderedCards[i]);
  }
  game.top_6_infection_cards = undefined;
  game.forecasting_player_index = undefined;

  const player = game.players[forecastingPlayerIndex];
  player.hand.delete(Client.EventCard.Forecast);
  if (player.hand.size === 7) {
    onDiscardContinue(clientWebSocket);
  } else if (player.hand.size < 7) {
    game.game_state = Client.GameState.Ready;
  } else {
    game.checkDiscardingNeeded(clientWebSocket);
  }
}
