// PokeProf — Locations Database
// Auto-generated: 6/23/2026, 1:04:32 AM
// Entries: 15

const LOCATIONS = [
  {
    "locationId": "palletTown",
    "name": "Pallet Town",
    "region": "Kanto",
    "heals": true,
    "shopTier": "basic",
    "travelTime": 1
  },
  {
    "locationId": "route1",
    "name": "Route 1",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 6
  },
  {
    "locationId": "route21",
    "name": "Route 21",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 15
  },
  {
    "locationId": "viridianCity",
    "name": "Viridian City",
    "region": "Kanto",
    "heals": true,
    "shopTier": "basic",
    "travelTime": 1
  },
  {
    "locationId": "celadonCity",
    "name": "Celadon City",
    "region": "Kanto",
    "heals": true,
    "shopTier": "full",
    "travelTime": 1
  },
  {
    "locationId": "route2S",
    "name": "Route 2 - South",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 2
  },
  {
    "locationId": "route2N",
    "name": "Route 2 - North",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 2
  },
  {
    "locationId": "route22",
    "name": "Route 22",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 3
  },
  {
    "locationId": "viridianForest",
    "name": "Viridian Forest",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 21
  },
  {
    "locationId": "pewterCity",
    "name": "Pewter City",
    "region": "Kanto",
    "heals": true,
    "shopTier": "basic",
    "travelTime": 1
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
    "travelTime": 15
  },
  {
    "locationId": "route3",
    "name": "Route 3",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 4
  },
  {
    "locationId": "route4W",
    "name": "Route 4 - West",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 1
  },
  {
    "locationId": "route4",
    "name": "Route 4",
    "region": "Kanto",
    "heals": false,
    "shopTier": null,
    "travelTime": 3
  }
];

function getLocation(locationId) {
  return LOCATIONS.find(l => l.locationId === locationId) || null;
}
