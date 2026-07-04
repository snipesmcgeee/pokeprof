// PokeProf — Evolution Tree (branching evolutions)
// Auto-generated: 7/4/2026, 5:32:29 PM
// Entries: 8

const EVO_TREE = [
  {
    "fromDexId": 133,
    "toDexId": 134,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null
  },
  {
    "fromDexId": 133,
    "toDexId": 135,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null
  },
  {
    "fromDexId": 133,
    "toDexId": 136,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null
  },
  {
    "fromDexId": 133,
    "toDexId": 196,
    "evolveMethod": "friendship-day",
    "evolveLevel": null,
    "evolveItem": null
  },
  {
    "fromDexId": 133,
    "toDexId": 197,
    "evolveMethod": "friendship-night",
    "evolveLevel": null,
    "evolveItem": null
  },
  {
    "fromDexId": 133,
    "toDexId": 470,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null
  },
  {
    "fromDexId": 133,
    "toDexId": 471,
    "evolveMethod": "use-item",
    "evolveLevel": null,
    "evolveItem": null
  },
  {
    "fromDexId": 133,
    "toDexId": 700,
    "evolveMethod": "use-move",
    "evolveLevel": null,
    "evolveItem": null
  }
];

function getEvolutions(fromDexId) {
  return EVO_TREE.filter(e => e.fromDexId === fromDexId);
}
