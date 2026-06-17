// PokeProf — Connections Database
// Auto-generated: 6/16/2026, 10:51:06 PM
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
