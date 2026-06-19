// PokeProf — Locations Database
// Auto-generated: 6/19/2026, 5:03:20 PM
// Entries: 8

const LOCATIONS = [
  {
    "locationId": "palletTown",
    "name": "Pallet Town",
    "region": "Kanto",
    "heals": true,
    "shopTier": "basic",
    "travelTime": 0
  },
  {
    "locationId": "route1",
    "name": "Route 1",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 5
  },
  {
    "locationId": "route21",
    "name": "Route 21",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 14
  },
  {
    "locationId": "viridianCity",
    "name": "Viridian City",
    "region": "Kanto",
    "heals": true,
    "shopTier": "basic",
    "travelTime": 0
  },
  {
    "locationId": "celadonCity",
    "name": "Celadon City",
    "region": "Kanto",
    "heals": true,
    "shopTier": "full",
    "travelTime": null
  },
  {
    "locationId": "route2S",
    "name": "Route 2 - South",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 1
  },
  {
    "locationId": "route2N",
    "name": "Route 2 - North",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 1
  },
  {
    "locationId": "route22",
    "name": "Route 22",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 2
  }
];

function getLocation(locationId) {
  return LOCATIONS.find(l => l.locationId === locationId) || null;
}
