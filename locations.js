// PokeProf — Locations Database
// Auto-generated: 6/21/2026, 12:09:51 AM
// Entries: 14

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
  },
  {
    "locationId": "viridianForest",
    "name": "Viridian Forest",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 20
  },
  {
    "locationId": "pewterCity",
    "name": "Pewter City",
    "region": "Kanto",
    "heals": true,
    "shopTier": "basic",
    "travelTime": 0
  },
  {
    "locationId": "diglettsCave1F",
    "name": "Diglett's Cave Entrance",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 1
  },
  {
    "locationId": "diglettsCaveB1F",
    "name": "Diglett's Cave",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 14
  },
  {
    "locationId": "route3",
    "name": "Route 3",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 3
  },
  {
    "locationId": "route4W",
    "name": "Route 4 - West",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 0
  }
];

function getLocation(locationId) {
  return LOCATIONS.find(l => l.locationId === locationId) || null;
}
