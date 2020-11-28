export namespace Client {
  export interface Game {
    game_graph: City[];
    game_graph_index: { [key: string]: number };
    outbreak_counter: number;
    infection_rate_index: number;
    infection_rate: number[];
    faceup_deck: string[];
    players: Player[];
    research_stations: string[];
    cured: Cubes;
    cubes: Cubes;
    game_state: number;
    player_index: number;
    turns_left: number;
    valid_final_destinations: number[];
    can_charter_flight: boolean;
    can_operations_expert_move: boolean;
    can_build_research_station: boolean;
    can_cure: boolean | string;
    cards_needed_to_cure: number;
    can_treat: boolean;
    can_take: boolean;
    can_give: boolean;
    player_deck_cards_remaining: number;
    log: string[];
    difficulty: number;
    must_discard_index: number;
  }

  export interface Cubes extends Record<string, number> {
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
    Yellow = "yellow"
  }

  export enum Roles {
    ContingencyPlanner = "Contingency Planner",
    Dispatcher = "Dispatcher",
    Medic = "Medic",
    OperationsExpert = "Operations Expert",
    QuarantineSpecialist = "Quarantine Specialist",
    Researcher = "Researcher",
    Scientist = "Scientist"
  }

  export enum GameState {
    NotStarted = 0,
    Ready = 1,
    DiscardingCard = 2,
    Won = 3,
    Lost = 4
  }

  export interface Player {
    name: string;
    role: string;
    hand: string[];
    location: string;
    id: number;
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

    // Success Messages
    MoveSuccessful = "move successful",
    MoveChoiceSuccesful = "move choice successful",
    BuildSuccesful = "build successful",
    TreatSuccesful = "treat successful",
    ShareSuccesful = "share successful",
    ResearchShareSuccesful = "research share successful",
    UpdateGameState = "update game state",
    DiscoverSuccesful = "discover successful",

    // Invalid Message
    DiscardInvalid = "discard invalid",

    // defaults
    Connection = "connection",
    Join = "join",
    Disconnect = "disconnect"
  }
}
