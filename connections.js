// PokeProf — Connections Database
// Auto-generated: 6/18/2026, 9:18:29 PM
// Connections: 4

const CONNECTIONS = {
  "palletTown": [
    "route1",
    "route21"
  ],
  "route1": [
    "palletTown",
    "viridiancity"
  ]
};

function getConnectedLocations(locationId) {
  return CONNECTIONS[locationId] || [];
}
