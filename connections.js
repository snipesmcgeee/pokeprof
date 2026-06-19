// PokeProf — Connections Database
// Auto-generated: 6/19/2026, 5:22:04 PM
// Connections: 10

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
    "toLocationId": "viridianCity",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route21",
    "toLocationId": "palletTown",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "viridianCity",
    "toLocationId": "route1",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "viridianCity",
    "toLocationId": "route2S",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route2S",
    "toLocationId": "viridianCity",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "viridianCity",
    "toLocationId": "route22",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route22",
    "toLocationId": "viridianCity",
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
    "viridianCity"
  ],
  "route21": [
    "palletTown"
  ],
  "viridianCity": [
    "route1",
    "route2S",
    "route22"
  ],
  "route2S": [
    "viridianCity"
  ],
  "route22": [
    "viridianCity"
  ]
};

function getConnectedLocations(locationId) {
  return CONNECTIONS[locationId] || [];
}
