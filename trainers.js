// PokeProf — Trainers Database (Gym Battle System, v0.25)
// Auto-generated: 7/16/2026, 9:10:50 PM
// Entries: 2
// One row per team-slot: (trainerId, tier[, gauntletOrder]) groups into one battle roster.

const TRAINERS_DATA = [
  {
    "trainerId": "brock",
    "trainerName": "Brock",
    "locationId": "pewterCity",
    "tier": 1,
    "isGauntlet": false,
    "badgeItemId": "boulder-badge",
    "slotIndex": 1,
    "dexId": 74,
    "formName": null,
    "level": 12,
    "move1Power": 50,
    "move2Power": 40,
    "move3Power": null,
    "move4Power": null,
    "move1Type": "Rock",
    "move1Category": "Physical",
    "move2Type": "Normal",
    "move2Category": "Physical",
    "move3Type": null,
    "move3Category": null,
    "move4Type": null,
    "move4Category": null
  },
  {
    "trainerId": "brock",
    "trainerName": "Brock",
    "locationId": "pewterCity",
    "tier": 1,
    "isGauntlet": false,
    "badgeItemId": "boulder-badge",
    "slotIndex": 2,
    "dexId": 95,
    "formName": null,
    "level": 14,
    "move1Power": 50,
    "move2Power": 40,
    "move3Power": null,
    "move4Power": null,
    "move1Type": "Rock",
    "move1Category": "Physical",
    "move2Type": "Normal",
    "move2Category": "Physical",
    "move3Type": null,
    "move3Category": null,
    "move4Type": null,
    "move4Category": null
  }
];

// Returns the roster (array of slot entries) for a trainer at a given tier.
// Pass gauntletOrder (1-5) to get one leg of the Indigo Plateau tier-9 gauntlet.
function getTrainerRoster(trainerId, tier, gauntletOrder) {
  return TRAINERS_DATA.filter(t => t.trainerId === trainerId && t.tier === tier &&
    (gauntletOrder === undefined ? true : t.gauntletOrder === gauntletOrder));
}

// Returns the badge itemId granted by a trainer (same value on every row for that trainerId).
function getTrainerBadge(trainerId) {
  const row = TRAINERS_DATA.find(t => t.trainerId === trainerId && t.badgeItemId);
  return row ? row.badgeItemId : null;
}

// Returns all distinct trainerIds present in the data (for building the gym list).
function getAllTrainerIds() {
  return [...new Set(TRAINERS_DATA.map(t => t.trainerId))];
}
