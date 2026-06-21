// PokeProf — Connections Database
// Auto-generated: 6/21/2026, 12:09:51 AM
// Connections: 20

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
  },
  {
    "fromLocationId": "route2N",
    "toLocationId": "viridianForest",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "viridianForest",
    "toLocationId": "route2N",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route2N",
    "toLocationId": "pewterCity",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "pewterCity",
    "toLocationId": "route2N",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "pewterCity",
    "toLocationId": "route3",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route3",
    "toLocationId": "pewterCity",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route3",
    "toLocationId": "route4",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route4",
    "toLocationId": "route3",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route3E",
    "toLocationId": "route4",
    "requiresItem": null,
    "travelTime": null
  },
  {
    "fromLocationId": "route4",
    "toLocationId": "route3E",
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
  ],
  "route2N": [
    "viridianForest",
    "pewterCity"
  ],
  "viridianForest": [
    "route2N"
  ],
  "pewterCity": [
    "route2N",
    "route3"
  ],
  "route3": [
    "pewterCity",
    "route4"
  ],
  "route4": [
    "route3",
    "route3E"
  ],
  "route3E": [
    "route4"
  ]
};

function getConnectedLocations(locationId) {
  return CONNECTIONS[locationId] || [];
}
