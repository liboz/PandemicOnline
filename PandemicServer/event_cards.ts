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
  return game.players[card_owner_player_index].hand.has(eventCard);
}

export function handleEventCard(
  event: Client.EventCard,
  game: Game,
  game_graph: Record<string, City>,
  clientWebSocket: ClientWebSocket,
  arg1: string | number,
  arg2?: string
) {
  switch (event) {
    case Client.EventCard.Airlift:
      if (typeof arg1 === "number") {
        // arg1 is playerIndex and arg2 is final destination
        const target_player = game.players[arg1];
        handleAirlift(target_player, game, game_graph, arg2, clientWebSocket);
      }
      break;
    case Client.EventCard.Forecast: // todo
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
