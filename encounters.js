// PokeProf — Encounters Database
// Auto-generated: 6/18/2026, 11:58:40 PM
// Entries: 2

const ENCOUNTERS = [
  {
    "locationId": "route1",
    "dexId": 16,
    "minLevel": 2,
    "maxLevel": 5,
    "encounterRate": 55,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route1",
    "dexId": 19,
    "minLevel": 2,
    "maxLevel": 4,
    "encounterRate": 45,
    "encounterMethod": "grass",
    "requiresItem": null
  }
];

function getEncountersForLocation(locationId) {
  return ENCOUNTERS.filter(e => e.locationId === locationId);
}
