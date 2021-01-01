export namespace Client {
  export interface Game {
    game_graph: City[];
    game_graph_index: { [key: string]: number };
    outbreak_counter: number;
    infection_rate_index: number;
    infection_rate: number[];
    infection_faceup_deck: string[];
    players: Player[];
    research_stations: string[];
    cured: Cubes;
    cubes: Cubes;
    game_state: number;
    player_index: number;
    turns_left: number;
    valid_final_destinations: number[];
    valid_dispatcher_final_destinations?: Record<number, number[]>;
    can_charter_flight: boolean;
    can_operations_expert_move: boolean;
    can_build_research_station: boolean;
    can_cure: boolean | string;
    cards_needed_to_cure: number;
    can_treat: boolean;
    can_take: boolean;
    can_give: boolean;
    player_deck_discard: string[];
    player_deck_cards_remaining: number;
    log: string[];
    difficulty: number;
    must_discard_index: number;
    one_quiet_night_active: boolean;
    top_6_infection_cards?: string[];
    forecasting_player_index: number;
  }

  export interface Cubes extends Record<Color, number> {
    blue: number;
    red: number;
    black: number;
    yellow: number;
  }

  export interface City {
    name: string;
    color: Color;
    location: [number, number];
    cubes: Cubes;
    hasResearchStation: boolean;
    players: number[];
    index: number;
    neighbors: number[];
  }

  export enum Color {
    Black = "black",
    Blue = "blue",
    Red = "red",
    Yellow = "yellow",
  }

  export enum Roles {
    ContingencyPlanner = "Contingency Planner",
    Dispatcher = "Dispatcher",
    Medic = "Medic",
    OperationsExpert = "Operations Expert",
    QuarantineSpecialist = "Quarantine Specialist",
    Researcher = "Researcher",
    Scientist = "Scientist",
  }

  export enum GameState {
    NotStarted = 0,
    Ready = 1,
    DiscardingCard = 2,
    Won = 3,
    Lost = 4,
    Forecasting = 5,
  }

  export interface Player {
    name: string;
    role: string;
    hand: string[];
    location: string;
    id: number;
  }

  export enum EventCard {
    ResilientPopulation = "Resilient Population",
    Airlift = "Airlift",
    Forecast = "Forecast",
    OneQuietNight = "One Quiet Night",
    GovernmentGrant = "Government Grant",
  }

  export enum EventName {
    StartGame = "start game",
    Move = "move",
    DirectFlight = "direct flight",
    CharterFlight = "charter flight",
    OperationsExpertMove = "operations expert move",
    DispatcherMove = "dispatcher move",
    Build = "build",
    Treat = "treat",
    Share = "share",
    Discover = "discover",
    Pass = "pass",
    Discard = "discard",
    Roles = "roles",
    InvalidAction = "invalid action",
    GameInitialized = "game initialized",
    Eradicated = "eradicated",
    DiscardCards = "discard cards",
    Epidemic = "epidemic",
    Restart = "restart",
    EventCard = "event card",
    Forecasting = "forecasting",

    // Success Messages
    MoveSuccessful = "move successful",
    MoveChoiceSuccessful = "move choice successful",
    BuildSuccessful = "build successful",
    TreatSuccessful = "treat successful",
    ShareSuccessful = "share successful",
    ResearchShareSuccessful = "research share successful",
    UpdateGameState = "update game state",
    DiscoverSuccessful = "discover successful",
    Restarted = "restarted",
    EventCardSuccessful = "event card successful",
    ForecastingSuccessful = "forecasting successful",

    // Invalid Message
    DiscardInvalid = "discard invalid",

    // defaults
    Connection = "connection",
    Join = "join",
    Disconnect = "disconnect",
  }

  export type GameDifficulty = "Introductory" | "Standard" | "Heroic";

  export const GameDifficultyMap: Record<number, GameDifficulty> = {
    4: "Introductory",
    5: "Standard",
    6: "Heroic",
  };
}
