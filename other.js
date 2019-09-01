const Roles = {
    ContingencyPlanner: "Contingency Planner",
    Dispatcher: "Dispatcher",
    Medic: "Medic",
    OperationsExpert: "Operations Expert",
    QuarantineSpecialist: "Quarantine Specialist",
    Researcher: "Researcher",
    Scientist: "Scientist",
}


const GameState = {
    NotStarted: 0,
    Ready: 1,
    DiscardingCard: 2,
    Won: 3,
    Lost: 4
}

module.exports = {
    Roles: Roles,
    GameState: GameState
};