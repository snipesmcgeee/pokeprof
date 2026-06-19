// PokeProf — Connections Database
// Auto-generated: 6/18/2026, 11:58:40 PM
// Connections: 4

// Flat array with full data (used for requiresItem checks)
const CONNECTIONS_DATA = [
  {
    "fromLocationId": "palletTown",
    "toLocationId": "route1",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "palletTown",
    "toLocationId": "route21",
    "requiresItem": "hm-surf",
    "travelTime": null
  },
  {
    "fromLocationId": "route1",
    "toLocationId": "palletTown",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route1",
    "toLocationId": "viridiancity",
    "requiresItem": null,
    "travelTime": null
  }
];

// Adjacency map (used for fast neighbor lookup)
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
