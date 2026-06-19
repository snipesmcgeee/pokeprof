// PokeProf — Locations Database
// Auto-generated: 6/18/2026, 9:18:29 PM
// Entries: 4

const LOCATIONS = [
  {
    "locationId": "palletTown",
    "name": "Pallet Town",
    "region": "Kanto",
    "heals": true,
    "shopTier": null
  },
  {
    "locationId": "route1",
    "name": "Route 1",
    "region": "Kanto",
    "heals": false,
    "shopTier": null
  },
  {
    "locationId": "route21",
    "name": "Route 21",
    "region": "Kanto",
    "heals": false,
    "shopTier": null
  },
  {
    "locationId": "viridiancity",
    "name": "Viridian City",
    "region": "Kanto",
    "heals": true,
    "shopTier": "basic"
  }
];

function getLocation(locationId) {
  return LOCATIONS.find(l => l.locationId === locationId) || null;
}
