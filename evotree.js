// PokeProf — Evolution Tree (branching evolutions)
// Auto-generated: 7/14/2026, 10:18:24 PM
// Entries: 27

const EVO_TREE = [
  {
    "fromDexId": 133,
    "toDexId": 134,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 133,
    "toDexId": 135,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 133,
    "toDexId": 136,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 133,
    "toDexId": 196,
    "evolveMethod": "friendship-day",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 133,
    "toDexId": 197,
    "evolveMethod": "friendship-night",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 133,
    "toDexId": 470,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 133,
    "toDexId": 471,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 133,
    "toDexId": 700,
    "evolveMethod": "use-move",
    "evolveLevel": 40,
    "evolveItem": "fairy-special",
    "toFormName": null
  },
  {
    "fromDexId": 44,
    "toDexId": 45,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 44,
    "toDexId": 182,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 61,
    "toDexId": 62,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 61,
    "toDexId": 186,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 79,
    "toDexId": 80,
    "evolveMethod": "level",
    "evolveLevel": 37,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 79,
    "toDexId": 199,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 123,
    "toDexId": 212,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 123,
    "toDexId": 900,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 236,
    "toDexId": 106,
    "evolveMethod": "unknown",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 236,
    "toDexId": 107,
    "evolveMethod": "unknown",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 236,
    "toDexId": 237,
    "evolveMethod": "unknown",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 25,
    "toDexId": 26,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 25,
    "toDexId": 26,
    "evolveMethod": "unknown",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": "Alolan"
  },
  {
    "fromDexId": 102,
    "toDexId": 103,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 102,
    "toDexId": 103,
    "evolveMethod": "unknown",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": "Alolan"
  },
  {
    "fromDexId": 104,
    "toDexId": 105,
    "evolveMethod": "level",
    "evolveLevel": 28,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 104,
    "toDexId": 105,
    "evolveMethod": "friendship-night",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": "Alolan"
  },
  {
    "fromDexId": 109,
    "toDexId": 110,
    "evolveMethod": "level",
    "evolveLevel": 35,
    "evolveItem": null,
    "toFormName": null
  },
  {
    "fromDexId": 109,
    "toDexId": 110,
    "evolveMethod": "unknown",
    "evolveLevel": null,
    "evolveItem": null,
    "toFormName": "Galarian"
  }
];

function getEvolutions(fromDexId) {
  return EVO_TREE.filter(e => e.fromDexId === fromDexId);
}
