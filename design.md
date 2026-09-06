## Branch Source-Form & Gender Restrictions — `fromFormName` / `requiredGender` (SETTLED — v0.42, NEW)

### Scope
Every `EVO_TREE` branch now carries two new optional columns, both blank by default:
- **`fromFormName`** — restricts a branch to individuals currently in a specific form. Confirmed necessary for: Wooper → Clodsire (Paldean-only; Kantonian Wooper's own branch to Quagsire must not be reachable here). Every other branching species audited this pass (Voltorb, Growlithe, Sneasel, Zorua, Sliggoo, Qwilfish, both Meowth branches) already had this populated correctly.
- **`requiredGender`** — restricts a branch to a specific gender (`"M"`/`"F"`). Confirmed necessary for: Kirlia → Gallade, Snorunt → Froslass, Burmy → Wormadam/Mothim (both branches), Combee → Vespiquen, Salandit → Salazzle.

### Root Cause
Neither candidate-selection code path checked the evolving individual's own `formName` or `gender` against the branch at all — only `pokedexId`, `holder`, `evolveBlocked`, and the nickname-exclusivity lock (see "Nickname-Triggered Evolution Branches"). Confirmed directly by tracing both filters: `professorAutoTestEvolutions()`'s item-candidate search, and `checkEvolution()`'s branch-qualifying filter (Path 2). A Kantonian Wooper reaching level 20 was a valid candidate for the Paldean-only Clodsire branch with nothing to stop it.

### The Rule — read this before touching either column
**A restriction only belongs on a branch if the *source* species genuinely has that attribute to check.** `fromFormName` is not "which regional flavor does this branch represent" — it's "does the individual actually carrying this form exist as a real, separately-obtainable thing." Confirmed the hard way this pass: Pikachu, Koffing, Mime Jr., Dartrix, Dewott, Bergmite, Petilil, Rufflet, and Goomy all correctly have `fromFormName: null` on their form-producing branches, because none of those species has a regional/form-specific pre-evolution at all — only their evolutions split (e.g. there is no "Alolan Pikachu"; a single, ordinary Pikachu can become either Raichu). Setting `fromFormName` to the target's form name in these cases would not just be unnecessary — it would make that branch **permanently unreachable**, since no real individual could ever have a `formName` matching it. Contrast with Voltorb, Growlithe, Wooper, etc., where both the pre-evolution and evolution genuinely exist as separate regional forms — there, the restriction is required. When adding a new branching species: check whether the *source* form is real and separately catchable before filling in `fromFormName`, not just whether the target is.

### Fix
- `professorAutoTestEvolutions()`'s candidate filter: add `if(branch.fromFormName!=null && p.formName!==branch.fromFormName) return false;` and `if(branch.requiredGender && p.gender!==branch.requiredGender) return false;`
- `checkEvolution()`'s Path 2 branch-qualifying filter: same two conditions added.
- Column name is `requiredGender` (not `requireGender`) as of this pass — Excel column was renamed to match before this code shipped.
- Blank/`null` on either column means "no restriction, matches any individual" — this was always the intended semantics (confirmed against the actual enforcement code, not a later reinterpretation).

### SAVE_VERSION
No bump. Both columns live on `EVO_TREE` (static reference data loaded from `evotree.js`, not part of `state`), and the enforcement reads existing per-individual fields (`p.formName`, `p.gender`) already present on every Pokémon object since v0.33 and earlier respectively.

---

## Nincada → Shedinja — `shed` Evolution Method (SETTLED — v0.42, NEW)

### Scope
Nincada (and only Nincada — the only species in the franchise with this mechanic). Evolving into Ninjask via the normal level-20 path *also* creates a second individual, Shedinja, as a side effect — not a branch choice between competing outcomes; both happen at once.

### Real Mechanic vs. This Implementation
The real games require an empty party slot **and** a spare Poké Ball in the bag (the Shedinja is "created" by consuming the ball). This implementation deliberately drops the spare-ball requirement — **empty party slot only** — a simplification, not an oversight.

### Why This Can't Be a Normal EVO_TREE Branch
Every other branch (regional-form, gender, multi-path) resolves to exactly one winner replacing the evolving individual via `applySpeciesSwap()`. Shedinja isn't a competing branch — it's an *additional* individual created alongside the normal Ninjask evolution, which still proceeds through the ordinary flat-column level-up path unchanged. Needs its own hook, not branch-selection logic.

### Fix
- `EVOLUTION_METHODS`' base list gains `'shed'`, so Nincada's species page can register full research completion (previously would have topped out short of 100% with no way to close the gap).
- `EVO_TREE` gets one `shed`-method row per applicable species (currently: Nincada → Shedinja only). No `evolveLevel`/`evolveItem` needed — the trigger is "the normal evolution on this dexId just succeeded," not a separate condition of its own.
- Hook lives in the existing per-aide level-up loop (the same loop that calls `checkEvolution()`, always scoped to a specific `state.aides[idx]`) — confirmed this is the only place level-up evolution ever runs, so "empty party slot" unambiguously means that same aide's own party, matching the real game's own trainer-party scope.
- Immediately after a successful normal evolution, check `getEvolutions(previousDexId)` for a `shed`-method entry. If found and `state.aides[idx].party.length < partyCap`: create the new individual via the normal `makePokemon()` path (for correct ability roll, nature, equipped moves, etc.), then overwrite `level` and `ivs` with the evolving individual's own pre-evolution values and call `recalcStats()` — reuses existing, tested stat-calculation logic rather than duplicating it. Push into the same aide's party.
- If no free slot: nothing happens beyond the normal Ninjask evolution — matches real-game behavior (no error, no log spam, just no Shedinja this time).

### SAVE_VERSION
No bump. Shedinja is created via the same individual-Pokémon object shape every other catch/evolution already produces — no new fields.
