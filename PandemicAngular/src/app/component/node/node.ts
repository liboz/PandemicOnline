import { Client } from "../../../../data/types";

export default interface CityNode {
  id: number;
  x: number;
  y: number;
  color: Client.Color;
  name: string;
  cubes: Client.Cubes;
  hasResearchStation: boolean;
  players: number[];
  isValidDestination?: boolean;
}
