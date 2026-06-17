// PokeProf — Locations Database
// Auto-generated: 6/16/2026, 10:51:06 PM
// Entries: 4

const LOCATIONS = [
  {
    "locationId": "palletTown",
    "name": "Pallet Town",
    "region": "Kanto"
  },
  {
    "locationId": "route1",
    "name": "Route 1",
    "region": "Kanto"
  },
  {
    "locationId": "route21",
    "name": "Route 21",
    "region": "Kanto"
  },
  {
    "locationId": "viridiancity",
    "name": "Viridian City",
    "region": "Kanto"
  }
];

function getLocation(locationId) {
  return LOCATIONS.find(l => l.locationId === locationId) || null;
}
