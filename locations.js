// PokeProf — Locations Database
// Auto-generated: 6/18/2026, 11:26:37 PM
// Entries: 4

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
    "locationId": "viridiancity",
    "name": "Viridian City",
    "region": "Kanto",
    "heals": true,
    "shopTier": "basic",
    "travelTime": 0
  }
];

function getLocation(locationId) {
  return LOCATIONS.find(l => l.locationId === locationId) || null;
}
