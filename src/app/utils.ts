import { Client } from "data/types";

export function formatPlayer(player: Client.Player) {
  return `${player.name} -  ${player.role}`;
}
