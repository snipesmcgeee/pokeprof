// PokeProf — Encounters Database
// Auto-generated: 6/19/2026, 5:03:20 PM
// Entries: 21

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
  },
  {
    "locationId": "route2S",
    "dexId": 16,
    "minLevel": 3,
    "maxLevel": 5,
    "encounterRate": 40,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route2S",
    "dexId": 19,
    "minLevel": 2,
    "maxLevel": 5,
    "encounterRate": 45,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route2S",
    "dexId": 10,
    "minLevel": 3,
    "maxLevel": 5,
    "encounterRate": 8,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route2S",
    "dexId": 13,
    "minLevel": 3,
    "maxLevel": 5,
    "encounterRate": 7,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route2N",
    "dexId": 16,
    "minLevel": 3,
    "maxLevel": 5,
    "encounterRate": 40,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route2N",
    "dexId": 19,
    "minLevel": 2,
    "maxLevel": 5,
    "encounterRate": 45,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route2N",
    "dexId": 10,
    "minLevel": 3,
    "maxLevel": 5,
    "encounterRate": 8,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route2N",
    "dexId": 13,
    "minLevel": 3,
    "maxLevel": 5,
    "encounterRate": 7,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 19,
    "minLevel": 2,
    "maxLevel": 4,
    "encounterRate": 20,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 29,
    "minLevel": 2,
    "maxLevel": 4,
    "encounterRate": 25,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 21,
    "minLevel": 2,
    "maxLevel": 6,
    "encounterRate": 10,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 32,
    "minLevel": 2,
    "maxLevel": 4,
    "encounterRate": 25,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 56,
    "minLevel": 3,
    "maxLevel": 5,
    "encounterRate": 20,
    "encounterMethod": "grass",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 129,
    "minLevel": 5,
    "maxLevel": 5,
    "encounterRate": 100,
    "encounterMethod": "fish-old",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 60,
    "minLevel": 10,
    "maxLevel": 10,
    "encounterRate": null,
    "encounterMethod": "fish-good",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 118,
    "minLevel": 10,
    "maxLevel": 10,
    "encounterRate": null,
    "encounterMethod": "fish-good",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 60,
    "minLevel": 5,
    "maxLevel": 15,
    "encounterRate": null,
    "encounterMethod": "fish-super",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 61,
    "minLevel": 15,
    "maxLevel": 15,
    "encounterRate": null,
    "encounterMethod": "fish-super",
    "requiresItem": null
  },
  {
    "locationId": "route22",
    "dexId": 118,
    "minLevel": 15,
    "maxLevel": 15,
    "encounterRate": null,
    "encounterMethod": "fish-super",
    "requiresItem": null
  }
];

function getEncountersForLocation(locationId) {
  return ENCOUNTERS.filter(e => e.locationId === locationId);
}
