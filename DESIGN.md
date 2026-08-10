# PokeProf — Design Bible & Settled Mechanics

This document is the authoritative source of truth for all settled design decisions.
Every new chat session should read this before making any changes to the game.
Do not change any mechanic marked **SETTLED** without explicit approval from the project owner.

---

## Concept

You are a Pokémon Professor whose lab data was stolen by Team Rocket. You must rebuild your Pokédex from scratch. Carl Oak is your first Lab Aide — he goes into the field, catches Pokémon, and returns findings to you. As your research grows, you attract more aides and funding.

This is a **browser-based idle game**. Everything aides do happens off-screen/simulated. You are in full control of their missions but can set-and-forget for long periods. The ultimate goal is an infinite sandbox — completing the Pokédex, Shinydex, beating gyms with each aide, filling every species page, etc.

There is no survival element. Aides do not need food, sleep, or anything like that. Money is the only resource.

### Role Distinction (SETTLED — do not blur)
- **The Professor** = the player. Performs lab and research actions. Owns the primary (Professor) inventory. Auto-tests evolution items. Triggers manual evolutions.
- **Aides/Trainers** (e.g. Carl Oak) = field agents. Perform catching, traveling, and battling. Own their own per-aide inventory (badges, HMs, Bicycle, Rods, Safari Pass, etc.).
- These roles must never be conflated in code comments, log messages, or UI copy.

---

## Code Style & Commenting (SETTLED)

- **No version-stamp comments in code** — do not write comments like `// v0.16 fix #6:` or `// Change #3:` inside `pokeprof.html`. Version history belongs in git commit messages, not inline.
- **Useful comments only** — comments should explain *why* something non-obvious works the way it does, or warn against removing something that looks unnecessary. Example of a good comment: `// Re-link party entries to canonical dex objects — do not remove, JSON parse breaks references`
- **Where version history lives:**
  - What changed and when → git commit messages
  - Why something works the way it does → inline comments (sparingly)
  - Settled design decisions and rules → this document (DESIGN.md)

---

## Tech Stack

- Single-file browser game: `pokeprof.html` contains all game logic, UI, and state
- External JS databases (auto-generated from Excel via `converter.html`):
  - `pokedex.js` — species data
  - `encounters.js` — wild Pokémon tables per location
  - `locations.js` — location definitions
  - `connections.js` — travel graph
  - `items.js` — item definitions
  - `evotree.js` — evolution branches
  - `formtriggers.js` — form change conditions
  - `typechart.js` — type effectiveness
- Dev tools: `converter.html` (Excel → JS), `fetcher.html` (PokéAPI data fetcher)
- Hosted on GitHub Pages; all DB files are uploaded there after conversion
- Desktop and mobile friendly

### CRITICAL: External Script Tags (SETTLED — do not omit in rewrites)
- All 8 data files are loaded via **relative path `<script src="filename.js">` tags in `<head>`** — no CDN, no absolute URLs
- They must appear in this order, before the closing `</head>` tag:
  ```html
  <script src="pokedex.js"></script>
  <script src="encounters.js"></script>
  <script src="locations.js"></script>
  <script src="connections.js"></script>
  <script src="typechart.js"></script>
  <script src="evotree.js"></script>
  <script src="formtriggers.js"></script>
  <script src="items.js"></script>
  ```
- Omitting these tags causes total game failure: no sprites, no destinations, no encounters. This has happened in rewrites — verify these are present before deploying any rewrite.

---

## Versioning (SETTLED)

- The `<h1>` tag always shows the current version (e.g. `PokeProf v0.18`)
- Increment the version on every deployed change
- `SAVE_VERSION` in `pokeprof.html` must be incremented whenever `state` structure changes
- Current save version: `12` (v0.19)
- **v0.20 requires SAVE_VERSION 13** due to: `nickname` field on Pokémon objects, `evolveBlocked` field on Pokémon objects, `researchLog[dexId].abilitiesObserved` field, and `researchLog[dexId].confirmedBranches` replacing singular `confirmedMethod`/`confirmedIntoId`. All four migrations run in a single combined pass on load from v12.
- **v0.21 requires SAVE_VERSION 14** due to: fishing splitting into per-rod-tier sub-methods (`fish-old`/`fish-good`/`fish-super`) instead of a single `fish` method. Migration: any `state.locationMethodPrefs[locId]` entry containing the bare `'fish'` method (in `methods[]` or as a `weights` key) is dropped entirely for that location — it recalculates fresh defaults (all currently-unlocked methods/rod-tiers checked evenly) the next time that location is visited. No other v0.21 change requires a schema change.
- **v0.22 stays on SAVE_VERSION 14** — no `state` schema changes in this batch (all 11 items are behavior/rendering fixes and additive read-only views).
- **v0.23 requires SAVE_VERSION 15** due to: `equippedMoves[]` field added to Pokémon objects (up to 4 `{type, category, power}` slots for the new Battle System). Migration assigns each existing Pokémon a single default move on load: type1 slot (random Physical/Special if both exist) → else type2 → else Normal-Physical fallback. Slots 2–4 start empty for all pre-v0.23 saves.
- **v0.24 requires SAVE_VERSION 16** due to: `state.freeSkipsRemaining` field added (onboarding encounter-skip pool — see "Free Onboarding Encounter Skips"). Migration: new saves initialize to `50`; existing saves migrate in at `0` (onboarding-only, not retroactive).
- **Bug fixed post-release (v0.24):** the same SAVE_VERSION 16 migration also backfills `researchLog[dexId].firstSeen`/`firstCaught` (new v0.24 fields — see "Pokédex Grid View" seen-but-not-caught fix) for every pre-existing research-log entry. Without this, any save from before v0.24 would see a false "🎯 Captured" finding fire on the *next* catch of every already-known species (even ones caught hundreds of times), since those two fields were simply `undefined` on anything researched pre-v0.24 and `!r.firstCaught` reads as true. Backfill logic: if a `researchLog` entry exists at all, `firstSeen` is set `true` (it's definitely been seen); `firstCaught` is set `true` only if that dexId is also present in `dexHistory` (definitely already caught).
- **v0.25 requires SAVE_VERSION 17** due to: badge entries added to `aide.bag` (new `itemCategory: badge` items) and a new per-gym highest-tier-reached tracker on aide objects (likely `aide.gymProgress[gymId] = highestTier`) — see "Gym / Trainer Battle System — Triggers, Badges, Level Cap". Migration: existing saves initialize both to empty on load (no badges held, no gym progress recorded).
- **v0.30 stays on SAVE_VERSION 19** — no `state` schema changes. Every change this version either reads existing fields (`catchRate`, `breeding`, `professorBag` contents) in new ways, or is UI/behavior-only.
- **v0.32 stays on SAVE_VERSION 20** — no `state` schema changes. Every change this version either reads/mutates existing fields (`p.ivs`, `p.currentHP`, `state.party`, `state.professorBag`/`trainerBag`, `state.funds`) in new ways, or is pure logic/UI — no new fields, no migration needed.
- **v0.26 requires SAVE_VERSION 18** due to: `state.daycareSlots` (new — see "Day Care / Breeding System"), `state.speciesCap` (new — see "Editable Per-Species Cap"), and a one-time `testedMethods` cleanup pass (see "Trade/Item-Evolution Matching Fix"). All three migrations run in a single combined pass on load from v17. `state.autoRepeat` is retired (no longer read anywhere — see "Idle State Removal") but requires no migration, since removing a field needs no backfill.
- **v0.27 stays on SAVE_VERSION 18** — no `state` schema changes in this batch (onboarding modal, Info menu, shop condensing, purchase quantity buttons, and badge sprite display are all UI/rendering-only; the Day Care location move repoints an existing constant, it doesn't touch `state` shape).
- **v0.28 requires SAVE_VERSION 19** due to: Day Care slot record reshaped for continuous batch hatching (`eggsQueued` count + `nextReadyAt` anchor replacing single-use `readyAt`) — see "Day Care / Breeding System" below. Migration: any existing slot with the legacy `readyAt` field converts to `nextReadyAt: readyAt, eggsQueued: 0` on load.
- **v0.33 requires SAVE_VERSION 21 (20 → 21)** due to: `p.formName` on every Pokémon object (see "Same-DexId Branching Form Evolutions"), `state.wanderMode` (see "Mission Modal — Wander Mode"), `state.significantLog` (see "Log Tab — Full/Condensed Sub-Tabs"), and a `confirmedBranches`/`testedMethods` reset for any item that has a real matching branch (see "Professor Auto-Test Loop — Confirmation Requires a Live Candidate"). All migrations run in a single combined pass on load from v20, in that order — `p.formName` backfill and the research-log reset both need to complete before any subsequent `recalcStats()` call.
- **v0.34 stays on SAVE_VERSION 21** — no `state` schema changes. `locationMethodPrefs[locId]` gains an additive `knownMethods` field (degrades gracefully on old saves — see "Mission Modal — Method Selection" below), and every other change is display logic, travel-state handling, or converter-only.
- **v0.35 requires SAVE_VERSION 22 (21 → 22)** due to: `state.wanderMetric` (new — see "Mission Modal — Wander Mode"). Migration: existing saves default to `'encounters'`. All other v0.35 changes (evolution-chain dedup, migration-gating fix, species-cap-on-evolution, theming) are bug fixes or UI/display-only — no additional schema impact.

---

## Game Loop (SETTLED)

### Tick Intervals
- `gameTick()` fires every 1000ms via `window._gameTickInterval = setInterval(gameTick, 1000)`
- `autoSaveTick()` fires every 1000ms via `window._autoSaveInterval = setInterval(autoSaveTick, 1000)`
- **Both must be set at boot**, after `loadGame()` or `init()` completes — never inside `startMission()` or `confirmMission()`
- `resetGame()` must explicitly clear **both** intervals before reloading:
  ```js
  clearInterval(window._gameTickInterval);
  clearInterval(window._autoSaveInterval);
  ```
- `incomeTick()` runs unconditionally inside `gameTick()` — income accrues whether or not a mission is active

### Encounter Timing (SETTLED — v0.26 revision)
- **Split into two separate constants (v0.26):** `ENC_INTERVAL_OPEN = 10` (live/foreground — while the app is open) and `ENC_INTERVAL_CLOSED = 30` (offline catch-up, inside `processOfflineTime()`). Previously a single shared `ENC_INTERVAL = 30` drove both.
- **Hybrid transition on close:** the first offline cycle after backgrounding still honors whatever was left on the live 10s countdown (`nextIn = state.nextEncounterIn`); every cycle after that uses the 30s closed interval. This is the existing leftover-value behavior, unchanged by the split — only the two endpoint values changed.
- All live-tick reset points (dispatch, recall, `gameTick()`'s encounter roll, default state init) use `ENC_INTERVAL_OPEN`. Only `processOfflineTime()`'s cycle-counting loop uses `ENC_INTERVAL_CLOSED`.

### Free Onboarding Encounter Skips (SETTLED — v0.24)
- **Goal:** reduce early-game friction from the `ENC_INTERVAL_OPEN` wait to improve new-player retention/hook.
- **New field:** `state.freeSkipsRemaining`. New saves start at `50`. Existing saves migrate in at `0` — **onboarding-only, not retroactive.**
- **Never refills** once exhausted — one-time pool for the life of a save.
- **UI:** while `missionActive && freeSkipsRemaining > 0`, a button reading **"⏭ Skip to Encounter x[N]"** renders below the location/status line on the Party tab.
- **Behavior:** each click sets `state.nextEncounterIn = 0`, forcing the next `gameTick()` to resolve an encounter immediately — identical path to normal timer expiry, full normal ball cost and catch odds apply. Consumes exactly 1 skip per click (single encounter, not a batch resolution). Button disappears once `freeSkipsRemaining` hits 0.

### Income (SETTLED)
- Base rate: $1.00/min, accumulates fractionally each tick
- Scales: +$0.01/min per 100 total catches
- Runs every tick regardless of mission state

---

## Travel & Location System (SETTLED)

### Location IDs
- All `locationId` values are **camelCase**: `palletTown`, `route1`, `viridianCity`, `route2S`, `route2N`, `route22`, `route21`, `celadonCity`
- `connections.js` must use exact matching IDs — a case mismatch silently breaks discovery and pathfinding
- Cross-check IDs across `locations.js`, `connections.js`, and `encounters.js` when adding new locations

### travelTime (SETTLED — do not change behavior)
- `travelTime` on a location = how many encounter-cycles it takes to **pass through** that location as a waypoint en route to somewhere else
- It does **NOT** impose a wait when that location IS the destination
- **Example:**
  - Send Carl to Route 1 → arrives instantly, gets encounters every 30s indefinitely
  - Send Carl to Viridian City → passes through Route 1, gets 5 Route 1 encounters along the way, then arrives at Viridian
- Rationale: enforcing travel time for a location you're already going to makes no sense
- Implementation: `arriveAtLocation()` sets `state.travelCyclesRemaining = Math.max(1, travelTime)`. `advanceTravelPath()` decrements it each encounter cycle; when it reaches 0, the next waypoint is entered.

### Discovery (SETTLED)
- On arrival at any location, ALL adjacent locations in `CONNECTIONS_DATA` are added to `state.discoveredLocations` — **regardless of `requiresItem`**
- A location with `requiresItem` is still discovered; it just cannot be selected as a mission destination unless the aide has that item in their per-aide inventory
- Map visibility and travel eligibility are separate concerns
- Initial discovery at boot: `palletTown` + all adjacencies from Pallet (free and gated)

### Mission Modal Destinations (SETTLED)
- Shows **all discovered locations that are reachable** from the aide's current position
- Uses `getReachableDiscoveredLocations()` — BFS through `CONNECTIONS_DATA` restricted to `state.discoveredLocations`, respecting `requiresItem` against the aide's per-aide inventory
- If an aide has no valid travel options, the modal shows no destinations
- No location is treated as "always available" — reachability is purely graph-based

### Mission Modal — Destination Sorting (SETTLED — v0.21, revised v0.35)
- Four sort buttons appear above the destination list: **Distance**, **Alphabetical**, **Encounters**, **Catches** (v0.35, new).
- **Distance** = sum of `travelTime` for every waypoint in `buildTravelPath(currentLoc, destId)` **strictly before** the destination itself — i.e. it excludes the destination's own `travelTime`, consistent with the settled `travelTime` rule above (a destination's own travel time never delays arrival there). A one-hop destination sorts as distance `0`.
- **Alphabetical** = location display name, A–Z. **v0.33 fix:** previously compared names as plain lowercased strings, which sorts lexicographically — "Route 11" landed before "Route 2" (character-wise, `'1' < '2'`). Now uses `localeCompare(..., {numeric:true})`, a natural sort that treats embedded digit runs as numbers: Route 2 → Route 9 → Route 11 → Route 23. Distance/Encounters/Catches sorts were already numeric and unaffected.
- **Encounters** = sightings (`seen`) count summed across all species logged at that location, from `state.locationEncounterLog[locId]` — locations never visited sort as `0`.
- **Catches** (v0.35, new) = caught (`caught`) count summed across all species logged at that location, from the same `state.locationEncounterLog[locId]` — new helper `computeLocationCatches(locId)`, sibling to the existing `computeLocationSightings(locId)`. Locations never visited (or never yielding a catch) sort as `0`.
- First click on any of the four buttons sorts **ascending** (Distance: nearest first; Alphabetical: A–Z; Encounters/Catches: fewest first). A second click on the **same** button reverses to descending. Clicking a **different** button resets to ascending for the new criterion.
- Sort state is transient UI-only — not persisted to `state`, not saved. The list has no default sort order when the modal opens; it resets each time.
- No SAVE_VERSION bump (no schema change).
- **v0.28:** while sorted by **Encounters** specifically, locations with zero wild encounter table rows (`buildRouteTable(locId).length===0`) are filtered from the list entirely — these can never contribute a nonzero encounter count and were only cluttering that sort (Day Care, pure shop towns, Indigo Plateau pre-8-badges, etc.). Gym-trainer presence is not considered by this filter — only wild-table rows. **v0.35:** the same filter applies to **Catches** for the same reason. Distance and Alphabetical sorts show the full reachable list, unchanged.

### Mission Modal — "Wander" Mode (SETTLED — v0.33, NEW; bug fixed post-release; revised v0.34, v0.35)
- New mode alongside manual destination selection: the aide continuously travels toward whichever **reachable, discovered, encounter-capable** location currently has the fewest lifetime encounters *or* catches (metric-dependent, see below), re-evaluating on an ongoing basis rather than being dispatched once to a fixed target.
- **New persisted field:** `state.wanderMode` (boolean, default `false`) — folded into the SAVE_VERSION 21 migration already required for other v0.33 schema changes; no additional bump needed for this field alone.
- **v0.35 — two metrics, not one.** The mission modal now shows **two** Wander buttons: "🧭 Wander (lowest encounters)" (the original v0.33 behavior, relabeled for clarity — uses `computeLocationSightings()`) and "🧭 Wander (lowest catches)" (new — uses `computeLocationCatches()`, the same helper backing the new Catches sort above). **New persisted field:** `state.wanderMetric: 'encounters'|'catches'` — set at dispatch to whichever button was pressed, read by `evaluateWanderTarget()` on every re-evaluation so a session keeps re-routing by the same metric it was dispatched with. **Requires SAVE_VERSION 22** (21 → 22); migration: existing saves (all pre-v0.35 Wander sessions were encounter-based) default `wanderMetric` to `'encounters'`.
- **Shared re-evaluation helper** (`evaluateWanderTarget()`), single implementation called from two places:
  - the top of `gameTick()` (live play, every 1s base tick)
  - inside `processOfflineTime()`'s catch-up loop (every simulated encounter-interval) — offline time actively re-routes too, not just live play, by explicit design decision.
- **Bug (found immediately post-release) — permanently stuck in Pallet Town on a new game:** every reachable location starts at 0 sightings, and the original tie-break rule ("keep the current target unless something is *strictly* lower") meant nothing could ever beat a tied 0 — compounded by Pallet Town's only encounter rows being fish/surf, all `requiresItem`-gated (Good Rod, Super Rod, etc.) that a brand-new save doesn't own yet, so `buildRouteTable('palletTown')` correctly returns 0 *currently-triggerable* rows — not because Pallet Town structurally lacks encounters (it doesn't — it has real rows in `encounters.js`), but because none of them are reachable with the aide's current items. Its own sightings count could never move off 0 either way. The aide never left.
- **Fix:** the candidate pool (in both `evaluateWanderTarget()` and the initial pick in `selectWanderMode()`) is filtered to `buildRouteTable(locId).length>0` — the same live, item-aware filter already established for the Encounters sort mode (see "Mission Modal — Destination Sorting" above). Additionally, the current target no longer automatically wins ties if it isn't itself in that eligible pool — this forces an initial move to somewhere currently reachable instead of stalling forever. Because `buildRouteTable()` re-checks the aide's current items on every call, a rod/Surf-gated location becomes eligible again automatically the moment the required item is obtained — no further code change needed.
- **Redirect logic:** only evaluated while the aide is stably at its current destination (`state.travelPath.length===0`) — a redirect never interrupts a journey already in progress. Among eligible locations, if any reachable location other than the current target is *strictly* lower, retargeting begins. If the current target is still eligible and tied for lowest, it's kept — no redirect purely from equal rankings, avoiding needless churn.
- **Bug (found v0.34) — redirect bypassed travel time entirely:** the original redirect immediately rebuilt `state.travelPath` from the aide's current location and called `arriveAtLocation()` on the new path's first waypoint at once — a true instant teleport, zero cost. Worse, because sightings accumulate wherever the aide currently stands, a location being passed through would climb in ranking the longer the aide dwelled there; once it became the single lowest, Wander would redirect *to the aide's own current spot*, hitting the `currentLoc===best` shortcut that zeroed `travelCyclesRemaining` outright — cashing in an already-standing-still location as a free "arrival" and letting the aide dodge real travel time indefinitely.
- **Fix (v0.34):** a redirect no longer jumps straight to the new path. The current location — now ceasing to be the destination — first has to be *departed*: `state.travelCyclesRemaining` is set to that location's own `travelTime` (same dwell mechanic every pass-through waypoint already uses, including full normal research encounters there, not the limited pass-through method — matching how it already generates encounters during travel), `state.travelPath` holds the newly built path, and `state.travelPathIndex` is set to a `-1` sentinel meaning "departure in progress, haven't started the new path yet." `advanceTravelPath()` counts this down like any other dwell; once it hits 0, `travelPathIndex` advances to `0`, `state.missionDestination` updates to the new target, and `arriveAtLocation()` fires normally for the first real waypoint of the new journey. No new persisted fields — `-1` is just a new valid value for the existing `travelPathIndex` number, so no `SAVE_VERSION` impact.
- **Mutually exclusive with manual destination selection** for a given mission — choosing Wander replaces the destination picker in the modal. Recalling the mission clears `state.wanderMode` (and, v0.35, `state.wanderMetric` alongside it), the same way it already clears `state.missionDestination` today; starting a new mission requires re-selecting Wander.
- **Log visibility (v0.35: metric-aware):** a redirect logs `"🧭 <Aide name> changes course — new lowest-encounter destination: <name>."` when `state.wanderMetric==='encounters'`, or `"...new lowest-catch destination: <name>."` when `'catches'` — matching the existing dispatch-log style — live inline, and batched into the offline-return summary when triggered during offline processing.

### Travel HUD — Total Encounters to Destination (SETTLED — v0.28)
- The mid-travel HUD text (`'📍 X (→ Dest, N enc left) · Next: ...'`) previously showed only `state.travelCyclesRemaining` — the cycles left in the *current* waypoint only, not the full trip.
- **v0.28 fix:** N now = current waypoint's remaining cycles **+** the full `travelTime` of every waypoint still ahead, **excluding** the destination's own `travelTime` (consistent with the settled `travelTime` rule — a destination's own travel time never delays arrival there). Label wording unchanged.
- Display-only — no `state` schema change.

### Wipe & Return (SETTLED)
- If all party Pokémon faint, the aide returns to **`state.lastHealLocation`** — the most recent location with `heals: true` they passed through
- `lastHealLocation` is updated **only** in `arriveAtLocation()` when the location has `heals: true` — it is never set at mission start or anywhere else
- On recall, the aide also returns to `state.lastHealLocation`
- Auto-heal occurs automatically on arrival at any healing location
- **v0.26:** research now resumes immediately at the heal location after either path, instead of stopping — see "Mission System" for the full Idle State Removal writeup

### Offline Heal-Check Parity (SETTLED — v0.22)
- **Bug:** `checkLocationHeal()` (full-party heal when standing at a `heals:true` location) is called every encounter cycle in live `gameTick()`, but was never called anywhere inside `processOfflineTime()`. Missions dwelling in or passing through a healing city took real, un-healed damage offline that they wouldn't take live.
- **Fix:** `processOfflineTime()`'s simulated-encounter loop now runs the same heal-check before each simulated encounter, mirroring live order exactly.
- **No per-encounter log spam offline** (consistent with offline processing's existing batched-summary design) — heals are tallied silently as `summary.heals`, shown in the existing offline-return summary banner alongside encounters/catches/wins/income.

---

## Mission System (SETTLED — v0.26 revision: Idle State Removal)

- **Idle no longer exists as a distinct state (v0.26).** Prior to v0.26, a mission would end (going "Idle") on recall or full wipe, and nothing — no wild encounters, no gym encounters, not even friendship ticks — happened again until the player manually started a new mission. As of v0.26, research runs continuously wherever the Aide currently is; there is no stopped/parked state to fall into.
- The "📍 X — Idle" display branch is removed entirely. Location display always shows either "Researching" or "traveling to Y."
- **Current location is now a valid destination.** `getReachableDiscoveredLocations()` previously seeded its BFS `visited` set with the current location before the walk began, permanently excluding it from its own reachable-destination list (bug — see "Pathfinding & Reachability" below). Fixed in v0.26: the current location can be re-selected as a destination, letting the player restart/redirect activity at the same spot they're already standing in.
- **Recall and full-party-wipe both still relocate-heal-resume** at `state.lastHealLocation` — this is unchanged from pre-v0.26 behavior. The only difference is what happens *after*: research resumes immediately at the heal location instead of stopping. Both paths still go through a unified `endMission(reason)` function (`reason` is `'recall'` or `'faint'`), which still always calls `showFindingsReport()`.
- **Auto-repeat is now mandatory, not optional.** The "Auto-repeat on wipe" checkbox is removed from the mission modal — since there's no longer a non-repeating idle state to fall into, relocate-heal-resume is simply what always happens on wipe. `state.autoRepeat` is retired.
- **Party edits and Start Mission are gated on being at a heal location** (`isHealLocation(state.currentLocation)`), replacing the old `missionActive`-based gate. This is a meaningful behavior change, not just a rename: today, idle always happens to coincide with being at a heal location (since `endMission()` force-relocates there) — v0.26 makes that relationship explicit and enforced, rather than incidental. Concretely: `assignToAide()`/`unassignPokemon()` and the Start Mission button both check the new heal-location gate instead of mission status.
- `state.missionDestination` is kept in sync with `state.currentLocation` after every relocate (recall, wipe, or a fresh dispatch), so `atDest`-gated content — including Gym encounters, see "Gym / Trainer Battle System" — continues to roll correctly under continuous research.
- Party order: Pokémon with the **lowest level leads**; fainted Pokémon go to the back; ties broken by inertia
- Party re-sort happens at `getLeadPokemon()` call and at the start of every new mission via `confirmMission()`

### Pathfinding & Reachability (SETTLED — v0.19 fix, v0.26 revision, v0.28 fix)
- `buildTravelPath()` restricts its BFS traversal to nodes in `state.discoveredLocations` — this part was already correct.
- **v0.26:** `getReachableDiscoveredLocations()`'s BFS no longer pre-seeds `visited` with the current location — see "Current location is now a valid destination" above.
- **Bug (found v0.28) — picker/pathfinding mismatch:** despite the note above, `getReachableDiscoveredLocations()` only gated *whether to display* a node on `state.discoveredLocations` — it did **not** gate BFS traversal *through* undiscovered intermediate nodes the way `buildTravelPath()` does. This let the destination picker report a location as reachable via a path that actually ran through undiscovered waypoints, which `buildTravelPath()` then correctly refused to walk — so the destination showed up as selectable, but confirming the mission produced an empty path and the aide never moved. Surfaced via a real report: Diglett's Cave North (Cut-gated entrance) got marked "discovered" via the scouting-preview rule the moment its Route 2 neighbor was visited, and the picker found it "reachable" by routing through the undiscovered South/B1F entrance — a path `buildTravelPath()` would never actually take.
- **Fix (v0.28):** `getReachableDiscoveredLocations()`'s BFS filter gets the identical discovery-gate `buildTravelPath()` already has: `if(!state.discoveredLocations.has(c.toLocationId)) return false;` alongside the existing `requiresItem` check. The two functions now agree exactly — the picker only ever shows destinations `buildTravelPath()` can actually walk to.

### Offline Wipe & Auto-Repeat (SETTLED — v0.20 fix, mandatory as of v0.26)
- **Bug (pre-v0.20):** `processOfflineTime()`'s catch-up loop unconditionally `break`s the moment `getLeadPokemon()` returns `null` (full party wipe), regardless of the repeat setting. This silently abandons the rest of the away period.
- **Fix (v0.20):** on a wipe during offline simulation, heal the party at `state.lastHealLocation`, rebuild `state.travelPath` from `lastHealLocation` → the mission destination, reset `travelPathIndex` to 0, set `currentLocation` to `lastHealLocation`, and continue the loop — mirrors live `endMission()`'s relocate-heal-resume path, with no time cost for the heal/redispatch itself.
- **v0.26:** this is now the *only* behavior — there is no longer a non-repeating branch, since auto-repeat is mandatory (see above). The old `state.autoRepeat` branch is removed from this loop.
- No repeat cap needed — the outer `while(remaining>=nextIn)` loop is already bounded by `secsAway`, so each wipe cycle still consumes real simulated time via `ENC_INTERVAL_CLOSED` ticks.

---

## Encounter Methods (SETTLED — v0.19 implementation pending)

### Method Enum
The full set of valid `encounterMethod` values in `encounters.js`:

| Method | Notes |
|---|---|
| `grass` | Standard land encounters |
| `surf` | Water surface encounters |
| `fish` | Fishing encounters (requires rod in aide inventory). **v0.21: split into three independently-selectable sub-methods in the mission modal** — see "Fishing Rod-Tier Split" below. The underlying `encounterMethod` value in `encounters.js` rows stays `fish`; the split is derived at runtime from each row's `requiresItem`. |
| `cave` | Cave/dungeon encounters |
| `headbutt` | Headbutt tree encounters |
| `rock-smash` | Rock smash encounters |
| `gift` | Fixed gift Pokémon |
| `static` | Fixed overworld encounters |
| `swarm` | Future-proofing only — mechanic undefined, do not implement |
| `honey` | Future-proofing only — requires honey item, possibly wait/return timer, do not implement |

### `defaultEncounterMethod` (Planned — v0.19)
- A new column `defaultEncounterMethod` on the Locations spreadsheet/`locations.js`
- Specifies the primary method for that location, used for **passthrough waypoints** (both live and offline) and as the pre-selected default in the mission modal on first visit before the player sets a preference
- Most routes: `grass`. Water routes: `surf`. Caves: `cave`.

### `rollEncounter()` — Generalization Required (SETTLED intent, v0.19 fix)
- Currently hardcoded to `grass` only — any row with a non-grass `encounterMethod` is silently excluded
- Must be generalized so any method can fire
- `requiresItem` gate in `buildRouteTable()` must continue to be honored — item-gated methods (e.g. fishing requiring a Rod in the aide's per-aide inventory) remain correctly restricted

### Mission Modal — Method Selection (SETTLED — v0.19 implementation pending)
- Mission modal gains **per-location method checkboxes** built from `buildRouteTable()` results for that location — only methods that actually have encounter rows at this location are shown at all
- Methods with encounter rows but whose `requiresItem` the aide doesn't currently own are shown as **disabled** (visible but uncheckable)
- Methods with no encounter rows at this location are **invisible entirely** — not shown, not disabled
- Player can optionally assign **relative weights** across checked methods (e.g. 70% fish / 30% grass); if no weights set, defaults to **even split** across all checked methods
- Selection and weights **persist per location** — remembered on return, not re-prompted each mission
- **Default on first visit:** all available (non-disabled) methods checked, evenly distributed
- **Bug (found v0.34) — newly-unlocked methods default unchecked:** once `state.locationMethodPrefs[locId]` exists at all (saved from any prior visit), it was trusted completely — a method absent from the saved list was treated identically whether the player had deliberately unchecked it *or* it simply didn't exist yet. So Surf, a rod tier, Poke Flute-gated rows, or the gym-battle synthetic method unlocking later would render unchecked by default and stay that way. Not method-specific — applies to anything that can unlock after a location's prefs are first saved.
- **Fix (v0.34):** `state.locationMethodPrefs[locId]` gains an additive `knownMethods` field — every available (non-locked) method ever actually offered as a toggle at that location, independent of its checked state. A method missing from `knownMethods` is treated as genuinely new and defaults to checked; a method already in `knownMethods` respects whatever the player last set. Old saves lacking the field fall back to treating their existing checked-list as the known set — meaning any method not in that old list defaults to checked on first load post-fix, including ones that were previously available but deliberately unchecked. This is a one-time reset (re-uncheck if undesired); the alternative is the bug persisting indefinitely. No `SAVE_VERSION` bump — purely additive, degrades gracefully.
- In-route resolution is **two-stage**: roll for method first (per player's checked set and weights), then roll within that method's weighted encounter table for the actual Pokémon
- **Encounter method by location role — applies both live and during offline simulation:**
  - **Passthrough waypoints** (locations the aide travels through en route to the destination): always use `defaultEncounterMethod` from `locations.js` — player method preferences are not applied to waypoints
  - **Destination location** (where the aide is stationed): use `state.locationMethodPrefs[locId]` (or `defaultEncounterMethod` if no preference has been set yet for this location)
- Stored in `state.locationMethodPrefs[locationId]` as `{ methods: ['grass','fish'], weights: {'grass':30,'fish':70} }` — this is a new state field requiring SAVE_VERSION bump

### Fishing Rod-Tier Split (SETTLED — v0.21, scoped fix)
- **Problem:** most locations have multiple `fish` rows gated by different rods (`oldRod`/`goodRod`/`superRod` tiers, e.g. Old Rod always yields a guaranteed Lv5 Magikarp). A single `fish` checkbox meant the player couldn't turn off just the Old Rod tier without losing Good/Super Rod encounters too — and separately, `renderMethodPrefs()`'s old locking logic locked the entire `fish` checkbox if *any* rod tier's row was unowned, meaning fishing effectively never unlocked until all three rods were owned.
- **Fix (fishing-specific only — no other method is affected):** in the mission modal, fishing rows render as **three separate checkboxes** — **Old Rod**, **Good Rod**, **Super Rod** — instead of one `fish` checkbox. Each is locked/unlocked independently based on owning that specific rod (`state.trainerBag['oldRod']`, etc.), with no cross-tier interference.
- Internally, each tier is treated as its own selectable/weightable sub-method, keyed `fish-old` / `fish-good` / `fish-super`, derived from each `encounters.js` row's `requiresItem` value. `buildRouteTable()` retains `requiresItem` on its output so `pickMethodForLocation()` and `rollEncounter()` can key on the sub-method.
- All other methods (`grass`, `surf`, `cave`, etc.) are untouched — this is intentionally a scoped, fishing-only fix, not a general "split any multi-item method" mechanism.
- Requires SAVE_VERSION bump — see Versioning section for migration behavior.

---

## Combat System (SETTLED — revised v0.30)

Wild encounters now share the same real battle engine as Trainer/Gym battles (see
"Trainer Battle System" for the damage formula, crit mechanic, and speed check) —
resolved silently and instantly, never as a watched playback.

### Real Catch Formula (SETTLED — v0.30, replaces old ball-only formula)
- Mainline Gen III+ formula:
  ```
  a = ((3×MaxHP − 2×CurrentHP) × SpeciesCatchRate × BallBonus) / (3×MaxHP)
  if a ≥ 255 → guaranteed catch
  else:
    b = 65536 / (255/a)^0.25
    P(catch) = (b / 65536)^4
  ```
- `SpeciesCatchRate` = the Pokédex's existing `catchRate` field (previously unused).
- `BallBonus` = the ball's existing `catchRateModifier` field (Poké Ball 1, Great Ball
  1.5, Ultra Ball 2 — unchanged, already mainline-accurate).
- Master Ball bypasses the formula entirely via its existing `effect: "catch-guaranteed"`
  flag — not the old `modifier >= 255` sentinel.
- No status-condition bonus term — this game has no status-effect system to hang it on;
  deliberate omission, not an oversight.
- Replaces the old `catchRate = modifier >= 255 ? 1 : Math.min(0.99, 0.75 * modifier)`
  everywhere it was used: `throwBall()` (live) and both catch-attempt sites inside
  `processOfflineTime()`.

### Wild Pokémon Move Assignment (SETTLED — v0.30)
- Identical to a freshly-caught Pokémon: `pickDefaultMove()`, one move, power 40, no TM
  investment.
- **Exception:** the existing "can't use a move a 3rd consecutive turn" AI restriction
  does **not** apply to wild Pokémon — they may use their single move every turn,
  unrestricted. (Moot in practice since they only ever have one move, but stated
  explicitly since this diverges from the Trainer Battle System's AI rule.)

### Wild Encounter Turn Loop (SETTLED — v0.32, replaces v0.30 ball-throw rules)
Each round, while the encounter is still active:
1. **Zero-balls guard (checked first, every move):** if `getBallCount()===0`, skip all
   ball logic — always attack. Overrides both the alternating schedule and the
   1HP-forced-throw phase below. Re-checked live every move (balls can run out
   mid-encounter).
2. **Timing** (only reached if ≥1 ball owned): move 1 of the encounter throws a ball;
   then alternates attack/throw/attack/throw... while wild HP > 1. Once wild HP == 1,
   every move is a throw (overrides alternating — no more attacks). Counter resets at
   the start of each new encounter.
3. **Ball selection** (applies to every throw): if the species has never been caught
   (`state.dexHistory[dexId]` is 0/unset), throw the highest-tier owned ball. Otherwise
   throw the lowest-tier owned ball with catch probability ≥50% (per the Real Catch
   Formula above); if none clears 50%, throw the lowest-tier owned ball anyway (worst
   odds, but never skip the throw).
4. **Ball throw resolution:** always resolves before any speed check (bypasses turn
   order entirely). Success → `catchPokemon()`, battle ends immediately, no
   retaliation. Failure → wild retaliates at **full** `calcBattleDamage()` — the old
   flat 25%-of-normal miss penalty no longer applies.
5. **Attack turn** (no ball thrown, or zero-balls guard active): speed-ordered exchange
   (existing effective-speed formula), both sides using the real `calcBattleDamage()` —
   lead via the Trainer Battle System's `selectAIMove()` across its real equipped
   moves, wild always using its single default move.
6. **HP floor:** while any ball remains in the Professor's inventory, wild HP is
   clamped at a minimum of 1 — it cannot faint. Once balls are exhausted (including
   mid-encounter), the floor lifts and a normal KO becomes possible (a "win" — EXP
   only, no catch, matching the old Fight Formula's win condition).
7. Loop ends on: capture (success), wild faints (no-balls win), or the lead's whole
   party faints (existing Faint-Switch Behavior / flee rule, unchanged).
- **Fully silent/instant** — the entire multi-round encounter resolves within a single
  function call, live or offline, with no watched playback (unlike Gym battles).
- **Ball consumption unchanged:** one ball consumed per throw attempt regardless of
  outcome — this was a deliberate, confirmed tradeoff, not a side effect to fix.
- Old `fight()` function (flat `(enc.level/lead.level) × 0.5 × maxHP` formula) remains
  removed, per v0.30.

### Faint-Switch Behavior (SETTLED — v0.26, unchanged by v0.30)
- On lead faint mid-encounter: if `getLeadPokemon()` returns another Pokémon, log
  "X fainted! Y was sent out!" and continue the same encounter against the new lead.
  Only when the whole party is down does the wild Pokémon flee and the mission end via
  `endMission()`.

### Shiny Auto-Catch (SETTLED — unchanged by v0.30)
- Shiny check fires **before** anything else in `resolveEncounterStep()` — before lead fetch, before ball selection
- Chance: 1/4096
- Auto-caught with no ball consumed
- `makePokemon()` must **never** roll shiny — shiny is set explicitly at the call site in `resolveEncounterStep()`
- **Bug (pre-v0.22):** this shiny roll only ever existed in `resolveEncounterStep()` (live path). `processOfflineTime()`'s inline catch logic called `catchPokemon(lead, enc, false)` with `isShiny` hardcoded `false` — offline/AFK encounters could never produce a shiny, no matter how long the away period.
- **Fix (v0.22):** `processOfflineTime()` now rolls the same `Math.random()<1/4096` check before the ball-catch-rate check on each simulated encounter, auto-catching as shiny with no ball consumed — mirrors live Step 1 exactly.
- **No per-encounter log spam offline** — tallied silently as `summary.shinies`, shown in the offline-return summary banner.

### Pre-Encounter Healing (SETTLED — revised v0.30)
- **v0.30 change:** `getWeakestEffectivePotion()` now applies **repeatedly** — as many
  potions as needed until the lead is at full HP or no usable potion remains in
  `state.professorBag` — instead of firing once. Still strictly **between**
  encounters, never mid-fight (consistent with the new turn loop above having no
  mid-combat healing interruption point).
- **Correction (discovered mid-build, v0.30):** an earlier draft of this note claimed
  this step "applies identically live and offline, since both already share this
  step" — that was **wrong**. `processOfflineTime()` never called
  `getWeakestEffectivePotion()` at all; offline wild encounters have only ever had the
  heal-*location* full-heal check (arriving at a `heals:true` location), no potion
  healing and no revive logic. **Decision: extend both to offline as part of v0.30**,
  for parity — offline wild encounters now get the same uncapped potion-heal loop and
  the same opportunistic-revive check as live, applied once per encounter cycle before
  ball/attack resolution, matching live step order exactly.
- `useItemFromBag()` is the canonical item use function — all item use must route through it, never inline

### Revive Logic (SETTLED — revised v0.30)
- **Bug (pre-v0.22):** the auto-revive check in `resolveEncounterStep()` gated on `lead.currentHP<=0` — but `lead` comes from `getLeadPokemon()`, which by definition only ever returns a **conscious** party member. The condition could never be true; Revives and Max Revives were never actually consumed by this path. There was no other way to use a Revive in the game.
- **Fix:** the impossible gate is removed. Auto-revive is now **opportunistic** — it fires any time a party member is fainted and a Revive/Max Revive is available, regardless of the current lead's state.
- Cheapest revive used first (Revive before Max Revive), applied to the lowest-level fainted Pokémon first.
- **v0.30:** this opportunistic-revive check is now also applied offline, once per encounter cycle in `processOfflineTime()`, matching live — see "Pre-Encounter Healing" correction above. Previously offline had no revive logic at all.

### EXP Formula (SETTLED — unchanged by v0.30)
- `Math.floor((baseExpYield * enc.level) / 7)`

---

## Inventory System (SETTLED intent — v0.19 implementation pending)

### Two-Inventory Split
The single `state.bag` is replaced with two separate inventories:

- **Professor's inventory** (`state.professorBag`): heals (potions, revives), Poké Balls, evolution stones and items, and similar consumables/research items
- **Per-aide inventory** (`aide.bag` on the aide object): badges, HMs, Bicycle, Rods (Old/Good/Super), Safari Pass, and similar field-equipment items

### `bagType` Field on Items
- Every item in `items.js` has a `bagType` column: `"professor"` or `"trainer"`
- This is the authoritative routing field — shop purchases, item consumption, and `requiresItem` checks all reference `bagType`
- Adding a new item requires explicitly setting `bagType` in the spreadsheet

### `requiresItem` Checks
- `requiresItem` on **encounter rows** (`encounters.js`) checks the **active aide's per-aide inventory**
- `requiresItem` on **connection rows** (`connections.js`) checks the **active aide's per-aide inventory**
- **Safari Pass** follows the same rule — it is an aide-held item (`bagType: "trainer"`)
- Pokémon inside the Safari Zone are caught with regular Poké Balls from the Professor's inventory

### Per-Aide Inventory
- Each aide has their own independent inventory — if Carl has an Old Rod, a second aide does not automatically have one
- Item counts are per-aide, not shared

### Shop Routing
- `buyItem()` must route purchases into the correct inventory based on the item's `bagType`

### Save Migration
- SAVE_VERSION bump to 12 required
- On load from a pre-v12 save, existing `state.bag` contents are migrated based on each item's `bagType` field: `professor` items go to `state.professorBag`, `trainer` items go to Carl Oak's `bag`

---

## Pokémon Storage (SETTLED)

### Per-Species Catch Cap (SETTLED — corrected v0.22, editable as of v0.26)
- **Corrected v0.22 — flat cap, does not scale with aide count.**
- **v0.26 — editable, 1–6, default 6.** New `state.speciesCap` field replaces the hardcoded `6`. A new dropdown on the Dex tab (positioned between the stats row and the three top-level sub-tabs — Pokédex/Families/All Catches) lets the player set the cap anywhere from 1 to 6.
  - **Raising** the value applies immediately, no confirmation (nothing gets released by raising it).
  - **Lowering** the value shows a confirm dialog: *"Are you sure you would like to change the species cap for Pokémon in your box? Lowering the cap will result in any excess being dropped. (Earliest caught kept, shiny Pokémon excluded)"* — on confirm, every species currently over the new cap is immediately swept down to it.
  - **Sweep order matches the existing overflow rule below: newest individuals released first, earliest catches kept.** Shinies are always exempt, both from the cap itself and from the sweep.
  - Cancelling the confirm dialog reverts the dropdown to its previous value with no change made.
- **Shinies are exempt** — unlimited shiny individuals of any species, not counted toward the cap.
- When a catch would exceed the cap: **catch-then-release** — the catch is fully processed (ball consumed, EXP awarded, `state.dexHistory` incremented, `totalCatches` incremented, `recordNewSpecies` called if applicable) before the overflow individual is silently released
- Cap applies to **live held Pokémon only** — `dexHistory` counts are unaffected by and not involved in the cap check
- The prior "no releasing or selling Pokémon" rule is **superseded** by this mechanic for overflow non-shinies only; manual releasing is still not a player action, except via the explicit cap-lowering sweep above

### Family IV Inheritance on Species-Cap Overflow (SETTLED — v0.32, NEW)
- **Trigger:** only when a catch of species X would exceed `state.speciesCap` for
  species X specifically (the per-species check above). Shiny catches are exempt from
  the cap (existing rule) and never trigger this.
- **If the cap has room:** no change — this feature doesn't engage, wild is added to
  the box normally.
- **If the cap would be exceeded** (the "overflow individual" case above), instead of
  simply releasing the wild:
  1. Build the full evolutionary family pool via `EVO_TREE` — the whole connected tree,
     all branches (e.g. all 8 Eeveelutions count as one pool), every currently-owned
     individual across every species in that family, **shinies included**.
  2. Sort that pool by level, **descending**.
  3. Walk the sorted list; the **first individual whose current IV total is less than
     the wild's IV total** inherits the wild's full IV set (`p.ivs` replaced,
     `stats`/`maxHP` recalculated via the existing formula, HP healed to new full).
     The wild is then discarded (not added to box).
  4. If no pool member qualifies (wild's IV total ≤ everyone's): wild is released as
     before — unchanged catch-then-release/overflow behavior, no change.
- **IV total** = sum of all 6 IV stats (`hp+atk+def+spatk+spdef+spd`, max 186).
- **New helper required:** `getFamilyDexIds(dexId)` — walks `EVO_TREE` in both
  directions to build the full connected-component set of dexIds for a family. Did not
  exist prior to v0.32.

### Species Cap Enforcement on Evolution + Release Priority (SETTLED — v0.35, NEW)
- **Bug:** `applySpeciesSwap()` — called by every evolution path — never checked the species cap; only wild catches did (`checkSpeciesCap()`, called from `catchPokemon()` paths only). An evolution could push a species over cap with no check at all.
- **Fix:** cap check now fires after both catches and evolutions, via a unified helper. Priority order:
  1. **IV-donation** (unchanged existing logic) — if any family-tree member has a lower IV total than the new/evolved individual, donate IVs to it and discard the newcomer.
  2. **Otherwise, release the weakest individual across the full same-species pool** (not just the newcomer) — compare by **total equipped-move power** (sum of all 4 `equippedMoves[].power` slots), releasing the **lowest** total. Ties broken by **catch order** (`p.id`, ascending = earlier): the **later** catch is released, keeping the original/longest-held individual.
- This replaces the old "always release the newcomer on overflow" fallback for both catches and evolutions — an existing weaker individual can now be released instead of the new arrival.
- No SAVE_VERSION impact.

---

## Day Care / Breeding System (SETTLED — v0.26, revised v0.27, v0.28, v0.29)

### Location & Slots (revised v0.27)
- **v0.27:** Day Care is now its own standalone map location — `locationId: pokemonDaycare` ("Pokemon Daycare"), connected only to Route 5 (`travelTime: 1`, `heals: true`, `mapCol: 121`, `mapRow: 94`, no `defaultEncounterMethod`). The `DAYCARE_LOCATION_ID` constant points at `pokemonDaycare` instead of `route5`. This was a discoverability fix — the feature existed correctly in v0.26 but was buried inside Route 5's generic location panel with no indication it was there.
- The Day Care section still renders inside `showMapDetail()` for whichever location `DAYCARE_LOCATION_ID` currently points to, alongside the existing Shop-style section pattern — no change to that rendering logic itself, only to which location triggers it.
- 1 free slot by default, purchasable up to 3 total, **$100 per additional slot** (`state.funds`).
- `state.daycareSlots` field (introduced v0.26) tracks slot count purchased and the current occupants/state of each slot — unaffected by the v0.27 location move.

### Mission Modal Messaging (SETTLED — v0.27, NEW)
- In the "Choose Destination" modal, `selectMissionDest()` special-cases `DAYCARE_LOCATION_ID`: instead of the generic "(research on arrival)" summary text, it shows **"Carl Oak → Pokemon Daycare (manage breeding on arrival)"** — since there's nothing to research at the Daycare, and this clarifies that breeding itself is managed via the Map tab node, not the destination modal.
- Dispatch mechanics are otherwise unaffected — selecting Daycare still sends the aide there normally via the standard travel system.

### Assigning a Pair
- Any 2 owned Pokémon — party or box — can be assigned to an open slot.
- Once assigned, both are reserved/unavailable for Aide missions until collected — same restriction as being actively assigned to the Aide.
- The Aide must physically travel to the Day Care to drop off a pair and again to collect completed eggs — the normal travel-time mechanic, same as visiting any other location. Once dropped off, incubation runs indefinitely in the background — it does **not** block the Aide from being dispatched elsewhere in the meantime; only the drop-off/collect actions themselves require the Aide's physical presence at the Day Care.

### Pair Selection UI (SETTLED — v0.28, revised v0.29)
- The old two-`<select>` dropdown pair-picker is replaced with a **two-step sprite-row picker**, same row style as the All Catches list (sprite + name + level + gender + held/box icon).
- **Step 1:** lists Parent A candidates (`getDaycareEligiblePokemon()` — everyone not already `breeding`) as tappable rows.
- **Step 2:** header shows the chosen Parent A; list re-renders showing only Parent B candidates passing `canBreedPair(parentA, candidate).ok` — incompatible candidates (wrong egg group, same gender, already breeding, etc.) are **hidden entirely**, not grayed out. A "← Back" control returns to step 1.
- Tapping a Parent B row shows the existing result preview and a "Drop Off Pair" confirm button, same as before — only the selection mechanism changed, not the confirm/preview logic.
- **v0.29: both steps now sort by family number → evolution order → dex number**, instead of catch order — reuses the same family-grouping logic as `getFamilyMembers()` (Families tab), for readability only. No visual dividers between families, just sort order.
- Display/interaction-only — no `state` schema change.

### Breeding Sprite Preview — F + M = C (SETTLED — v0.29, NEW)
- **Result Preview (step 2, pre-drop-off):** the existing text prediction gains a sprite row — Parent A sprite + Parent B sprite = predicted Child sprite, using the same `?` placeholder as before if the result species hasn't been seen yet (no new silhouette asset).
- **Active slot display:** while a slot is breeding, a persistent sprite row — Female/A sprite + Male/B sprite = Child sprite (or `?`) — renders **above** the existing "🥚 N eggs ready · next in M:SS" queue line. Both coexist; the queue text is not replaced.
- **Ditto positioning:** in both the preview and the persistent slot row, Ditto always renders in the **second** position, regardless of whether it was actually selected as Parent A or Parent B.
- Display-only — no `state` schema change, no new fields on the daycare slot record.

### Compatibility — Full Egg-Group Rules
- Undiscovered egg group (legendary/mythical species) → not breedable at all.
- Opposite genders required, **or** one parent is Ditto (any gender accepted with a Ditto pairing).
- A shared value between `eggGroup1`/`eggGroup2` is required on both parents, unless Ditto is one of the pair.
- Two Dittos together → not breedable.
- Genderless non-Ditto species → can only pair with Ditto.
- **Cross-family breeding is fully supported** — two different families can interbreed if they share an egg group; this is not restricted to same-family pairs.

### Result Species
- The result is always the **lowest-evolution root** of the **female** parent's family (or the non-Ditto parent's family, if Ditto is involved) — mirrors the mainline "mother determines species" rule.
- **No incense mechanic, no variability** — this was explored and deliberately dropped in favor of a fully deterministic result, since the incense-based design didn't generalize well across families and added complexity without a clear payoff.

### Result Preview
- Shows the real predicted species name if it has already been seen by any means (`seenDexIds`) — reuses existing dex-tracking infrastructure, no new "confirmed breeding result" system.
- Shows `?` if the predicted species hasn't been seen yet, resolving automatically once it's collected (same seen-based reveal pattern used throughout the Families Tab — see "Evolution Chain Visual").

### Storage & Timing
- Hatched babies are subject to the existing per-species cap (see "Per-Species Catch Cap" above, now player-editable) — applied individually per egg, same as any other catch.
- **Hatch time formula:** `minutes = max(1, round(eggCycles × 0.176))`, derived from each species' existing `eggCycles` field (already present in the data — no new column needed). Calibrated so a ~20-cycle species lands at ~5 minutes; range across the actual data (5–120 cycles) works out to roughly 1–21 minutes.
- Processed like a mission — live countdown while the app is open, offline catch-up on return.

### Continuous Batch Hatching (SETTLED — v0.28)
- **Bug (pre-v0.28):** a slot produced exactly one baby, then went empty and required manually re-selecting and re-dropping-off the same pair to continue breeding — no repeat/offline-accumulation loop existed, unlike missions.
- **Fix:** slot record fields change from a single-use `readyAt` to `eggsQueued` (int, starts 0) + `nextReadyAt` (an ongoing anchor that keeps advancing, doesn't reset until pulled).
- New helper `updateDaycareQueue(slotIndex)`: while `Date.now() >= rec.nextReadyAt`, increments `eggsQueued` and advances `rec.nextReadyAt += hatchMinutes*60000` — a remainder-preserving loop, same pattern as `processOfflineTime()`'s mission catch-up (no partial progress toward the next egg is ever lost). Called on `buildDaycareHtml()` render and at the top of `collectDaycareSlot()`, so it's correct whether the app was open or closed.
- **Collection:** `collectDaycareSlot()` runs the queue update, then hatches **all** queued babies in one go, each individually through the existing `makePokemon` → `dexHistory` → `recordAbilityObserved` → `recordCapture` → `checkSpeciesCap` pipeline (per-species cap release still applies per-egg). The slot is **not** cleared — `eggsQueued` resets to 0, the pair stays assigned, and `nextReadyAt` keeps counting from where it left off. Log line becomes a batch summary (e.g. "Collected 20 eggs at the Day Care! (18 kept, 2 released — species cap)").
- **Uncapped** — however many intervals fit in the elapsed time, same philosophy as mission offline catch-up (also uncapped).
- `releaseDaycarePair()` ("Pull Out") is unchanged — still ends the loop and returns parents to the box, forfeiting any uncollected `eggsQueued`. Confirm dialog gets a one-line addition warning about this if `eggsQueued > 0` at the time.
- `buildDaycareHtml()` slot display replaces the old "Ready to collect! / N min remaining" with a live queue count (e.g. "3 eggs ready · next in 1:24") — Collect button enabled whenever `eggsQueued > 0`.
- **SAVE_VERSION 19 migration:** any slot with the legacy `readyAt` field converts to `nextReadyAt: readyAt, eggsQueued: 0` on load.

### Shiny Rolls at Hatching (SETTLED — v0.30, NEW)
- Day Care eggs now roll for shiny — previously `collectDaycareSlot()` never checked
  at all, so every hatched egg was guaranteed non-shiny.
- Same odds/mechanic as wild encounters: `Math.random() < 1/4096` per egg, no ball
  consumed (not applicable here regardless).
- **Rolled at pickup, not at incubation** — `eggsQueued` is a plain counter with no
  per-egg record, so no Pokémon object (and thus no shiny flag) exists until
  `collectDaycareSlot()` calls `makePokemon()` for each egg. Collecting a large batch
  at once rolls shiny independently for each egg in that same batch, all at the moment
  of collection — not spread out chronologically as each egg finished incubating.

### Dex Display — Breeding Status (SETTLED — v0.30, NEW)
- **Bug (pre-v0.30):** the Dex's Held/Boxed status display checked only `p.holder` — a
  Pokémon actively breeding at the Day Care (`p.breeding === true`, `p.holder === null`)
  displayed identically to one genuinely idle in the box: "📦 Unassigned."
- **Exactly three display sites, confirmed by function name (not four — an earlier draft
  of this note miscounted):**
  1. `renderDexViewAll()` — the "All Catches" tab
  2. `renderDexDetail()` — the "Your Catches" list on a single species' detail page
  3. `showPokemonDetail()` — the individual Pokémon detail modal's "Holder:" line
  - The other Dex views (`renderDexPokedexGrid()`, `renderDexFamilies()`,
    `renderDexSpecies()`) don't show per-individual Held/Boxed status at all — nothing
    to fix there.
- **Fix:** all three sites now check `p.breeding` first, ahead of the
  `holder`/unassigned fallback. When true, shows **"🥚 At Day Care"** in place of
  "📦 Unassigned" / "Held by: —". Does **not** receive the dimmed `.unassigned` CSS
  styling, since it isn't idle. Reads the existing `p.breeding` field — no schema
  change, no SAVE_VERSION impact.

### Interaction with the Families Tab Root-Placeholder Fix
- Day Care is the primary intended path for filling in a family's previously-unseen root (e.g. Pichu) — see "Evolution Chain Visual" for the display-side fix this feeds into. No special-cased interaction is needed: once a bred Pokémon is collected, it's logged into `seenDexIds` exactly like any other catch, which is what resolves the root placeholder.

---

## Nicknames (SETTLED — v0.20)
- New optional field `nickname` on individual Pokémon objects (`state.dex` entries, referenced by `state.party`)
- **Trigger:** editable only via poke-modal detail view — no prompt on catch
- **Display rule:** anything referring to a specific Pokémon instance uses `getDisplayName(p)` (returns `p.nickname || p.species`); anything species-wide (Family/Species cards, route encounter tables, shop, evolution method lists) continues to use the species name directly. `getDisplayName()` replaces raw `p.species` at every instance-level display/log site: party list, poke-modal header, all `addLog()` calls referencing a specific Pokémon (catch, faint, win, EXP, level-up, evolution, revive)
- **Input:** plain text input in poke-modal, max length 30, no other character constraints
- **Clearing:** submitting an empty/whitespace-only input sets `nickname` back to `null` (reverts display to species name)
- **Evolution:** nickname persists unchanged across evolution — only the underlying `species`/`pokedexId` change
- **Save migration:** backfills `nickname: null` on all existing `state.dex` entries for pre-v13 saves

---

## Evolution Block (SETTLED — v0.20)
- New optional field `evolveBlocked` (boolean, default `false`) on individual Pokémon objects
- **Scope:** per-individual, not per-species — blocking evolution on one Caterpie has no effect on any other Caterpie owned
- **Effect on level-up evolutions:** `checkEvolution()` gains an early-out — if `p.evolveBlocked` is true, skip evolution entirely (Pokémon still levels up and gains EXP normally, it just doesn't transform)
- **Effect on item-based evolutions:** the manual Evolve button(s) in poke-modal are disabled/hidden whenever `evolveBlocked` is true for that individual, even if a confirmed item-based method exists
- **UI:** checkbox lives in poke-modal, alongside the nickname field
- **Save migration:** backfills `evolveBlocked: false` on all existing `state.dex` entries for pre-v13 saves

---

## Research & Pokédex (SETTLED)

### Philosophy
- The Dex never reveals data the player hasn't earned through gameplay

### Dex Navigation (SETTLED — v0.22 restructure)
- Top-level **3-tab bar**: **Pokédex** / **Families** / **All Catches** — replaces the old breadcrumb+button header.
- **Families** tab keeps its existing drill-down: Family Cards (Layer 1) → Species Cards (Layer 2) → Species Detail (Layer 3), with the existing Back-breadcrumb, unchanged.
- **All Catches** tab: unchanged flat list — see "All Catches View — Sorting" below.
- **Pokédex** tab (new, v0.22): see "Pokédex Grid View" below.

### Three Views Within "Families"
1. **Family Cards** (Layer 1): Groups Pokémon by evolutionary family (`familyId`). Shows base sprite, family number, known species count, evolution chain with `???` if the final known member hasn't confirmed no-evolution yet
2. **Species Cards** (Layer 2): Lists known species within a family. Shows total-ever caught vs currently-held count. Shows `???` placeholder if last known species hasn't confirmed non-evolution
3. **Species Detail** (Layer 3): Full data page for one species

### Pokédex Grid View (SETTLED — v0.22)
- New `renderDexPokedexGrid()`. **3 cells per row**, one slot per unique dexId (form-deduped identically to `getFamilyMembers()` — Mega/Alolan/regional variants collapse to their base slot), ordered by dex # ascending, covering the **full roster** including never-encountered species.
- Each cell shows dex # plus one of three states:
  - **Captured** (`state.dexHistory[dexId]` ever-caught ≥1): real sprite via `getSpriteUrl()`
  - **Seen** (`isSpeciesKnown(dexId)` true, not yet captured): the same real sprite with a `brightness(0)` CSS filter (accurate silhouette shape, no identity leak beyond what's already implied by "seen")
  - **Unknown** (neither): `?` placeholder, no sprite fetch
- Tapping a Captured or Seen cell navigates straight to Species Detail (Layer 3), skipping the Family Card layer. `?` cells are inert — no tap action.
- **v0.23:** Captured/Seen cells display the species name alongside the dex number on one line (`#27 Sandshrew`), instead of number-only. Unknown (`?`) cells unaffected — no name shown, preserving no-spoiler behavior.
- **Bug fixed v0.24 — Seen state never populated for non-catches:** `isSpeciesKnown(dexId)` reads `state.researchLog[dexId]`, which was only ever written by `recordSighting()`/`recordNewSpecies()` — and both were only called from inside successful-catch code paths (`catchPokemon()`, shiny auto-catch, offline-catch branches), never at encounter generation. A flee, loss, or missed ball updated the separate per-location `state.locationEncounterLog` counter but never touched `researchLog`, so the grid showed `?` instead of a silhouette for anything only ever seen, not caught.
  - **Fix:** `recordSighting()`/`recordNewSpecies()` moved to fire at encounter generation — both in `resolveEncounterStep()` (live) and `processOfflineTime()` (offline) — regardless of catch outcome. Fleeing/losing an encounter now counts as "seen."
  - **New field:** `researchLog[dexId].firstCaught` — fires a new finding, **"🎯 Captured: [name]"**, on first successful catch (distinct from "🆕 New Species", which now fires on first *sighting* instead of first catch).
  - **Findings report dedupe:** findings are tagged with `dexId`. If a species has both a "seen" and "captured" finding pending in the same `showFindingsReport()` batch, only "🎯 Captured" renders — capture overwrites seen within that batch (covers an encounter caught immediately, or an offline batch that sees-then-catches within the same window).

### All Catches View — Sorting (SETTLED — v0.22)
- `sort-select` gains a `family` option alongside Catch #/Dex #/Level/HP/BST — sorts by `familyId` (via `getPokemonEntry(p.pokedexId).familyId`), with `dexId` as a secondary tiebreaker so same-family members stay grouped and ordered sensibly.

### Family Grouping — `getFamilyMembers()` (SETTLED — v0.18 fix)
- Returns one entry per unique `dexId` within a family, preferring the `formName: null` row where one exists, but **including dexIds whose only database rows have a non-null `formName`** (gender-locked base species like Nidoran♂/♀, which have no null-form sibling)
- True alternate-form variants (Mega, Alolan, regional forms) that share a `dexId` with an existing null-form row still collapse to a single representative entry — they are not multiplied
- Generated by `converter.html` — this fix must land in both the generator and the current `pokedex.js` output, or it is lost on the next Excel→JS regeneration
- **Nidoran naming (v0.22):** the two Nidoran rows are named `Nidoran♀` (dexId 29) / `Nidoran♂` (dexId 32) in the Excel sheet, not `Nidoran` twice — disambiguates every name-string display site (family card, species card, species detail, logs, findings) and the legacy name-keyed fallback lookup in `makePokemon()`. Data-only change, no code required.

### Species Detail Page
- Header: sprite (91×91), name, type badges, all observed stats
- Height/weight shown in feet/lbs (converted from metric)
- Ability rarity tracker (how many caught have ability1 vs ability2 vs hiddenAbility)
- Gender ratio observed
- Evolution research section (see below)
- **Encountered At (v0.22):** lists every location where `state.locationEncounterLog[locId][dexId].seen ≥ 1` for the viewed species. Per the Dex philosophy above, unvisited-with-this-species locations don't appear at all — not even as `???`. For each qualifying location, shows the actual table percentage(s) and method(s) — reusing the same normalization the Map Detail Panel already uses for `encounters.js` rows, so numbers always match between the two screens. Multiple methods/rod-tiers at the same location each get their own line. Positioned below the ability/gender-ratio stats, above the individual-catches list.
- List of all individual catches: "X held / Y total ever"

### Dex Tab Lifetime Stats (SETTLED — v0.20)
- Header row: `Catches | Encounters | Species | Dex Pages Completed` — replaces the prior `Catches | Families` row (Families stat removed entirely)
- **Catches:** `state.totalCatches` (unchanged)
- **Encounters:** `state.totalSightings` — total wild encounters ever, online + offline
- **Species:** count of keys in `state.dexHistory` — unique dexIds ever discovered (caught or evolved into)
- **Dex Pages Completed:** count of species where BOTH are true:
  - Evolution research complete: `testedMethods.length >= EVOLUTION_METHODS.length` (read live — see "Evolution Method Enum" above)
  - All ability slots observed: every non-null ability the species has (`ability1`, `ability2`, `hiddenAbility`) has been seen at least once, per `researchLog[dexId].abilitiesObserved`
- **Bug fixed v0.24:** this check (`isDexPageComplete()`) previously hardcoded the threshold as `testedMethods.length === 34` — a stale magic number, already incorrect pre-v0.24 (should have been 35) and would have drifted further with `in-party`'s addition (36). A separate function, `isFullyTested()`, already read `EVOLUTION_METHODS.length` live and was unaffected. `isDexPageComplete()` is now aligned to the same dynamic pattern.
- **New field:** `researchLog[dexId].abilitiesObserved` — tracks which ability slots (`ability1`/`ability2`/`hiddenAbility`) have been observed at least once for that species. Written whenever a Pokémon is caught or evolves into that species, checking its `p.ability` value against the species' ability slots. Survives releases and cap overflow — never decremented.
- **Save migration:** backfills `abilitiesObserved` by scanning all current `state.dex` individuals' `ability` field against their species at load time (best-effort — cannot recover abilities from Pokémon already released before v0.20)

### Species Card — Party Sprite Size (SETTLED — v0.19)
- The `party-sprite` class image (the sprite displayed next to each Pokémon's name, level, HP, and XP bar in the party list) is **112×112px**
- This is **not** the 6-sprite row displayed inline next to Carl Oak's name in the aide header — those (`aide-sprite-mini`) remain at 28×28px

### Dex History Tracking — `state.dexHistory` (SETTLED)
- `state.dexHistory` is a flat map `{[dexId]: count}` tracking **all-time catches per species**
- Incremented on every catch, including overflow catches that are immediately released per the per-species cap
- Incremented on every evolution for the **evolved-into** species — the pre-evolution count is preserved, not decremented
- Family cards and species cards count from `dexHistory` so intermediate evolutions appear even with no live specimen
- On load from a pre-v11 save, `dexHistory` is backfilled from live `state.dex` entries
- `dexHistory` is saved and loaded as part of `state` — required field from SAVE_VERSION 11 onward

### Evolution System (SETTLED)

#### `checkEvolution()` — standalone function, never inline
- Two code paths inside `checkEvolution()`:
  1. **SPECIES lookup** (`getPokemonEntry(p.pokedexId)`): handles simple linear (single-target) evolutions from `pokedex.js`. Active for species with exactly one possible evolution. **Must use `p.pokedexId` (dexId), never `p.species` name string** — some names (Nidoran♂/♀) map to multiple distinct rows.
  2. **EVO_TREE lookup** (`getEvolutions(p.pokedexId)`): handles branching (multi-target) evolutions from `evotree.js`. Was a no-op for Gen 1; now active as of v0.20 for branching species (Eevee, etc.) — see "Branching Evolutions" below.
- **Do not remove the SPECIES lookup path** — most species still resolve through it
- **`evolveBlocked` early-out (v0.20):** if `p.evolveBlocked` is true, skip evolution entirely regardless of path — Pokémon still levels up/gains EXP, it just doesn't transform
- After a successful evolution via the SPECIES (single-target) path, `checkEvolution()` must:
  1. Call `recordEvolution(prevDexId, newEntry.dexId, 'level', p.level)`
  2. Call `recordNewSpecies(newEntry.dexId, p.species)`
  3. Increment `state.dexHistory[newEntry.dexId]`

#### `giveExp()` — required call order after level-up
```
pokemon.level++;
// recalc HP...
addLog(...level up...);
checkEvolution(pokemon);  // must come before saveGame
saveGame();
```
After the while loop: `if(levelled) renderDex();`

### Evolution Research (SETTLED)
- You don't know if or how a Pokémon evolves until you **observe it happening** (level-up) or the Professor **tests it** (item-based)
- Evolution chain shows `???` at the end until the final species confirms it doesn't evolve

### Evolution Display Text (SETTLED — v0.18)
- `getEvolutionDisplayText(dexId)` reads from `state.researchLog[dexId]` to determine *whether* to show evolution data — that gating is unchanged
- When evolution is confirmed, the displayed level comes from the **database** (`getPokemonEntry(dexId).evolveLevel`, i.e. the pre-evolution species' own `evolveLevel` field) — not the observed level the player happened to witness it at, with fallback to `highestLevelObserved` if database field is null
- Format: `"Evolves into: #N Name (level LvX)"` where X = the database `evolveLevel`
- When not yet confirmed: `"Evolves into: ??? (unconfirmed)"`
- When non-evolution is confirmed: `"Does not evolve"`

### Evolution Research System (SETTLED intent — v0.19 implementation pending)

#### Evolution Method Enum (SETTLED — v0.33 revision: derived live, never hardcoded)
- **Bug (found v0.33):** `EVOLUTION_METHODS[]` was a hardcoded array, manually kept in sync with `items.js` by hand. It drifted — 8 items already present in `items.js` with `effect: 'evolve-stone'` or `effect: 'evolve-trade'` (King's Rock, Black Augurite, Sweet Treat, Leader's Crest, Prism Scale, Scroll of Darkness, Scroll of Waters, Magmarizer) were missing from the array entirely. The Professor's auto-test loop tested against these items anyway (it reads live from `state.professorBag`, not from `EVOLUTION_METHODS`), pushing their names into a species' `testedMethods[]` regardless — inflating `testedMethods.length` past `EVOLUTION_METHODS.length` (surfaced as "38/36 Methods Tested"). Because the "fully tested / does not evolve" check (`nonEvolutionConfirmed`, see below) was a pure length comparison, this could falsely mark a species fully researched — including "Does not evolve" — while a genuine method (e.g. `level`) had never actually been tested.
- **Fix (v0.33):** `EVOLUTION_METHODS` is no longer a static array. It's computed live at load time (after `items.js` loads, before it's ever referenced — confirmed safe by script-tag order): the 6 non-item methods (`level`, `friendship`, `friendship-day`, `friendship-night`, `use-move`, `in-party`) plus the name of every item in `ITEMS_DATA` where `effect==='evolve-stone'` or `effect==='evolve-trade'`. New total: **44** (was 36). Any future item added to `items.js` with either effect is picked up automatically — this class of drift can no longer happen.
- **All UI/logic referencing the total continues to read `EVOLUTION_METHODS.length` live**, unchanged principle from prior versions — only the array's construction changed, not how it's consumed.
- **Documentation correction (v0.33):** "Outstanding Data Tasks" previously listed King's Rock and Black Augurite as orphaned/unreferenced items. Both are in fact wired into `evotree.js` (King's Rock: Poliwhirl→Politoed, Slowpoke→Slowking; Black Augurite: Scyther→Kleavor) as of some point after that note was written — the note was simply never updated. Corrected below.

#### Professor Auto-Test Loop
- Evolution stones and items live in the **Professor's inventory** (`state.professorBag`)
- `level`, `friendship`, `friendship-day`, and `friendship-night` evolutions are confirmed automatically when observed in the field — they do not require a separate Professor action
- **v0.24 — `use-move` and `in-party` added to the same auto-confirm treatment as level/friendship:** both are checked on level-up (not via the Professor's item-test loop) and confirmed automatically when observed — see "Move-Based Evolution" and "Party-Based Evolution" below for the condition checks themselves.
- **v0.20:** `professorAutoTestEvolutions()` is extended to also test EVO_TREE `use-item` branches (branching species only), matching directly by itemId. Confirmed branches are appended to `confirmedBranches`, not overwritten.

##### Trigger — Per-Tick Passive Check (SETTLED — v0.33 revision, replaces event-triggered testing)
- **Bug (found v0.33):** testing was event-triggered — fired only (a) when a new item entered `state.professorBag` (from `buyItem()`), or (b) when a species was caught for the first time ever (`catchPokemon()`'s `newToDexHistory` check). Both triggers were duplicated inline at their call sites rather than centralized. Three other creation paths that also add a Pokémon to `state.dex` — live shiny auto-catch, offline shiny auto-catch, and offline regular battle-catch (`processOfflineTime()`) — never called the trigger at all, and neither did Day Care egg hatching. A species whose first individual arrived via any of these four paths could sit with items already in the bag and never get tested until some unrelated later purchase or catch happened to fire the trigger.
- **Fix (v0.33):** `professorAutoTestEvolutions()` moves to the very top of `gameTick()` — runs unconditionally on every 1-second base tick, before any of that function's early `return`s, regardless of how or where a Pokémon was created. The explicit triggers in `catchPokemon()` and `buyItem()` are removed as redundant — one source of truth, and no future creation path can silently omit it again. Cheap in steady-state: already-tested species×item pairs are skipped via `testedMethods.includes()`.

##### Confirmation Requires a Live Candidate — Test and Apply Are One Event (SETTLED — v0.33 revision)
- **Design correction (v0.33):** a species×item combination splits into two structurally different kinds of "knowing," previously conflated:
  - **Ruling an item out** (no matching `EVO_TREE`/single-target branch exists for that species at all) is a **data fact** — no live subject needed, checkable from the reference data alone. Marked tested/ruled-out immediately, unchanged from prior versions.
  - **Confirming an item works** is an **experimental claim** — it requires an actual live trial on a real, eligible individual. Prior versions (v0.21 through v0.32) confirmed a branch into `confirmedBranches` the moment a matching item+species pair was found, *independent* of whether an eligible individual existed to receive it — so owning e.g. a Water Stone alongside a single Eevee that had already evolved via Fire Stone would still confirm "Eevee → Vaporeon (Water Stone)" as known Professor research, despite that evolution never having actually happened. This let players see the full branching evolution map for a species (Eevee, Raichu, etc.) from partial ownership, contradicting the stated design intent under "Evolution Research" above ("You don't know if or how a Pokémon evolves until you observe it happening").
- **Fix (v0.33):** for a matching item+species pair, `testedMethods`/`confirmedBranches` are **not** written unless an eligible candidate (`!holder && !evolveBlocked`, same eligibility rule as before) actually exists at test time. If found: that candidate evolves immediately, the item is consumed, and that single event is both the test and the confirmation — they can no longer happen independently. If no candidate exists: the method stays genuinely untested for that species — not confirmed, not ruled out — and is retried automatically on the next tick (see Per-Tick Passive Check above) with zero additional plumbing, so a later-caught eligible individual picks it up automatically.
- With multiple eligible items and/or multiple candidates present simultaneously, evolutions still happen one at a time in loop order — each consumed candidate stops matching for the next item's check within the same pass, exactly as before this fix (this part of the mechanism, and the "highest-level individual wins ties" rule, is unchanged).
- The manual per-Pokémon evolve button (see Manual Evolution Trigger below) is unaffected — it still exists for additional individuals of an already-confirmed species, or a different branch of a branching species.
- **Migration (v0.33, folded into the SAVE_VERSION 21 bump):** existing saves cannot retroactively distinguish a legitimately-earned confirmation from a phantom one under the old rule — the old data doesn't track which. For every species' research log, any `testedMethods`/`confirmedBranches` entry for an item that **has** a real matching branch is wiped; entries for items correctly ruled out (no matching branch) are left untouched, since those were never phantom. Non-item methods (`level`, `friendship`, `friendship-day`, `friendship-night`, `use-move`, `in-party`) are untouched — those were already gated on real individual state via other mechanisms and were never phantom. This is a real, visible loss of dex research completion for existing saves — most of it self-heals quickly post-update since the per-tick check immediately re-evaluates every species against whatever is already sitting in the bag.
- **v0.21 — shared apply-logic (unchanged by v0.33):** the species-swap block (species/dexId swap, `maxHP` recalc, `SPECIES` registration, `recordNewSpecies`, `recordAbilityObserved`, `dexHistory` increment) is extracted into one helper, `applySpeciesSwap(p, newEntry)`. All call sites — `checkEvolution()`'s three branches, `applyItemEvolution()`, and the auto-apply path above — call this helper instead of duplicating the block. Do not re-duplicate this logic in future changes. **v0.33 addition:** also writes `p.formName` from the target entry — see "Same-DexId Branching Form Evolutions" below.
- **Bug (pre-v0.26) — trade-style item evolutions could never match:** the single-target (Path 1) match required `item.effect==='evolve-stone'` specifically (`evolvesByStone`) or `entry.evolveMethod==='trade'` (`evolvesByTrade`, for `item.effect==='evolve-trade'`). Once the Pokédex data standardized on `evolveMethod: use-item` for *every* item-based evolution — including trade-style ones like Link Cable, which use `use-item` + `evolveItem: "Link Cable"` rather than a literal `'trade'` method value — `evolvesByTrade` could never match anything (no species uses `'trade'` anymore), and `evolvesByStone` only matched when the item's `effect` was specifically `evolve-stone`. Any `evolve-trade` item (Link Cable) fell through both checks and was silently marked ruled out the first time it was tested against any species that should have matched — Haunter and Kadabra were the case that surfaced this.
- **Fix (v0.26) — unified item matching:** Path 1's matching collapses to a single check, independent of the item's `effect` field: `entry.evolveMethod==='use-item' && entry.evolveItem===itemName`. This covers stones and Link Cable-style items identically — `effect: evolve-stone` vs `effect: evolve-trade` no longer has any functional difference anywhere in the codebase as a result (confirmed by audit — both values were already OR'd together at every other read site).
- **Data audit (v0.26, ongoing — not a code fix):** a full pass of every unique `evolveMethod`/`evolveLevel`/`evolveItem` triple against the matching code turned up 18 evolution items referenced in the Pokédex sheet with no corresponding row in the Items sheet at all — see "Outstanding Data Tasks" at the end of this document for current status.

##### Migration-Wipe Bug — Wiped Research on Every Load, Not Just Once (SETTLED — v0.35 fix)
- **Bug:** the v0.33 migration that wipes `testedMethods`/`confirmedBranches` for use-item evolutions (see above) was never gated to run only when migrating a pre-v0.33 save — it ran unconditionally in `loadGame()` on every single load, including saves already fully current. Any species with an un-evolved individual + the matching item in `professorBag` would have its confirmation wiped, get silently re-tested and re-confirmed (evolving one individual) on the very next tick, every single time the game loaded — compounding indefinitely across sessions with zero manual action. Surfaced via a report of 13 Magnezone from repeated silent Magneton evolution.
- **Fix:** the migration block is gated behind `data.version<21` — it now runs exactly once, only for saves genuinely predating v0.33's confirmation-semantics change. No SAVE_VERSION impact (bug fix only, no schema change).

#### Research State per Species (`state.researchLog[dexId]`)
Each species tracks:
- `testedMethods[]` — all methods attempted (confirmed and ruled out)
- `evolutionConfirmed` — boolean
- `confirmedBranches[]` — **(v0.20, replaces singular `confirmedMethod`/`confirmedIntoId`; v0.33 revision adds `toFormName`)** array of `{method, intoId, toFormName}` — supports species with more than one simultaneously-confirmed evolution (e.g. Eevee can have Water Stone→Vaporeon, Thunder Stone→Jolteon, and Fire Stone→Flareon all confirmed at once). Single-evolution species simply end up with a one-item list. Migration converts any pre-v13 `confirmedMethod`/`confirmedIntoId` pair into a one-item `confirmedBranches` list. **`toFormName` (v0.33, `null` for base-form branches):** see "Same-DexId Branching Form Evolutions" below for why this field exists and what it fixes.
- `abilitiesObserved` — **(v0.20)** which ability slots (`ability1`/`ability2`/`hiddenAbility`) have been observed at least once, see Dex Tab Lifetime Stats
- `nonEvolutionConfirmed` — **(v0.23 correction, v0.33 hardened)** no longer a persisted write-once flag. Never write `true` to this field. Computed live everywhere it's read. **v0.33:** the check changes from a length comparison (`r.testedMethods.length >= EVOLUTION_METHODS.length`) to a content check — every entry in `EVOLUTION_METHODS` must be individually present in `testedMethods` (`EVOLUTION_METHODS.every(m => r.testedMethods.includes(m))`). The length-only version was the mechanism behind the "38/36 Methods Tested" bug — a species could reach or exceed the target *count* via untracked/stray entries without every real method having actually been attempted. The content check is immune to that regardless of source, not just the specific cause fixed in the Evolution Method Enum section above. *(Pre-v0.23 behavior was dead code — the flag was initialized `false` and never actually set `true` anywhere in v0.22.)*
- `highestLevelObserved` — for research purposes
- `knownSince` — timestamp

#### Three-Bucket UI on Species Cards
Each species card shows a button: **"X/N Evolution Methods Tested"** where X = confirmed + ruled-out (methods actually attempted), N = `EVOLUTION_METHODS.length` (read live, never hardcoded — see Evolution Method Enum above).

Clicking expands a list:
- Shows only **Confirmed (✓)** and **Unknown (?) methods by name** — ruled-out methods are hidden entirely
- At the bottom: **"N Ruled Out"** as a count only, no names

Example — partially researched:
```
Level        ✓
Moon Stone   ?
30 Ruled Out
```

Example — fully researched (1 confirmed, rest ruled out):
```
Level        ✓
N-1 Ruled Out
```

A new species with nothing tested shows **"0/N Evolution Methods Tested"** and all N methods listed as `?`.

**Bug (found v0.33) — dropdown self-closing every ~10s:** the expand/collapse state (`toggleEvoSection()`) lived only in the DOM (`section.style.display`), with no backing JS state. `gameTick()` calls `render()`→`renderDex()` on every encounter roll (`ENC_INTERVAL_OPEN`, 10s), which fully rebuilds the Species Detail panel from scratch via `renderDexDetail()` — always starting collapsed. The dropdown wasn't auto-collapsing; it was being torn down and redrawn collapsed on a ~10s cadence. **Fix (v0.33):** expand/collapse state moves into JS state, keyed per dexId, so `renderDexDetail()` restores the correct open/closed state on every rebuild instead of defaulting to collapsed. Audited for other instances of the same pattern (a local `style.display` toggle with no backing state variable, vulnerable to periodic re-render) — none found; the offline banner, skip-encounter button, Battle Gym button, and Map Detail panel are all either correctly re-derived from live state on every render or never touched by periodic re-render at all.

#### Manual Evolution Trigger
- **Level-up evolutions remain fully automatic** — `checkEvolution()` fires after every level-up as before, no player action required
- The manual trigger is **for item-based evolutions only** — it does not apply to level or friendship (or friendship-day/night) methods
- **v0.21 — role clarified:** since the *first* eligible individual of a newly-confirmed species now evolves automatically as part of the auto-test itself (see Professor Auto-Test Loop above), the manual button's role is for **additional** individuals of an already-confirmed species (2nd, 3rd, etc. owned), or for applying a *different* confirmed branch to another individual of a branching species
- Once an item-based method is **Confirmed** for a species, a button appears in the poke-modal for individual Pokémon of that species
- The button is **disabled** (not hidden) if the Professor does not currently have the required item in `state.professorBag`
- Also disabled/hidden if `p.evolveBlocked` is true (v0.20)
- **v0.20 — branching species:** if multiple `use-item` branches are confirmed simultaneously (e.g. Eevee with both Water Stone and Thunder Stone confirmed), poke-modal shows **one button per confirmed branch** side by side, rather than a single button
- On use: consumes one unit of the required item from `state.professorBag`, applies the selected branch's evolution via the shared `applySpeciesSwap(p, newEntry)` helper (v0.21) — do not duplicate this logic
- `useItemFromBag()` needs an `evolve-stone` branch (and `evolve-trade` for Link Cable) added
- **v0.33 — `toFormName` threading:** `applyItemEvolution(catchId, intoId, toFormName)` gains a third parameter, and its button `onclick` handlers pass it through, so branches sharing the same `intoId` but different `toFormName` (see "Same-DexId Branching Form Evolutions" below) each apply the correct specific form rather than always resolving to the base form.

### Findings Report (Post-Mission) (SETTLED)
- `showFindingsReport()` is called from `endMission()` — always, including in the auto-repeat path
- Reports new species first sighted (v0.24: "🆕 New Species", fires on first *sighting*, not first catch), new species captured (v0.24: "🎯 Captured", fires on first catch — see "Pokédex Grid View" above for the full sighting/capture/dedupe fix), first evolutions observed
- **v0.24 dedupe:** if a species has both a "seen" and "captured" finding pending in the same report batch, only "🎯 Captured" renders
- `state.pendingFindings` is cleared after display

---

## Log Tab — Full / Condensed Sub-Tabs (SETTLED — v0.33, NEW)

- New sub-tab toggle atop the Log panel — **Full** (existing rolling `state.log`, unchanged, capped at 200 in memory / persisted 50) and **Condensed** (new).
- **New persisted field:** `state.significantLog` — a second log array with its own independent 200-entry cap, entirely separate from `state.log`'s existing cap. **Rationale:** if Condensed were just a filtered *view* of the shared log, routine activity (ordinary catches, misses, travel) could push a rare event out of the shared 200-entry buffer before the player ever saw it — defeating the purpose of a tab meant to surface exactly those events. A separately-capped list guarantees a significant event can't be silently lost to unrelated noise.
- New helper `addSignificantLog(msg, type)`, called alongside `addLog()` at six trigger points:
  1. **New Species Found** — `recordNewSpecies()`. **Also newly appears in Full as of v0.33** — previously this event only reached the separate `state.pendingFindings`/Findings Report mechanism and never touched the Log tab in any form.
  2. **New Species Captured** — `recordCapture()`. Same "newly appears in Full" note as above.
  3. **Shiny Capture** — at catch resolution, `caught.isShiny`.
  4. **Perfect IV Capture** — at catch resolution, `isPerfectIV(caught)` (existing helper, see "Perfect-IV / Shiny+Perfect Badges").
  5. **Unicorn Capture** — `caught.isShiny && isPerfectIV(caught)` (both at once — same condition already backing the existing 🦄 `getRarityBadge()` badge, see "Perfect-IV / Shiny+Perfect Badges"). Logs **only** the Unicorn line, not also separately as Shiny and Perfect IV, to avoid three lines for one catch.
  6. **Badge Earned** — existing `addLog('🎖 Badge earned...')` call site gains the paired `addSignificantLog()`.
- SAVE_VERSION 21 migration: `state.significantLog` defaults to `[]` for existing saves, folded into the same combined migration pass as the other v0.33 schema additions.

---

## Friendship Evolutions (SETTLED — v0.20 fix)
- **Bug (pre-v0.20):** `p.friendship` was tracked (ticks up every 180s online, and offline via `friendshipTicks`) but `checkEvolution()` had no branch that ever read it — no Pokémon could evolve via friendship, regardless of data.
- **Fix:** `checkEvolution()`'s SPECIES (single-target) path gains a friendship branch parallel to the existing level branch: `s.evolveMethod==='friendship' && s.evolvesIntoId && p.friendship>=FRIENDSHIP_THRESHOLD`
- `FRIENDSHIP_THRESHOLD = 220` — new top-level constant, alongside `ENC_INTERVAL` and similar
- `p.friendship` has **no cap** — it may continue climbing past 255 indefinitely; the threshold check is `>=220`, not `===220`
- On success: identical apply-logic to the level branch (species swap, HP recalc, `recordEvolution(prevDexId, newEntry.dexId, 'friendship', p.level)`, `recordNewSpecies`, `dexHistory` increment, log message) — reuse, don't duplicate
- **Known separate data issue:** some species (e.g. Golbat) are mislabeled in `pokedex.js` as `evolveMethod: "level"` with `evolveLevel: null`, causing `p.level >= null` to coerce to `p.level >= 0` (always true) — an instant-evolve bug. This is an Excel/`converter.html`-side data correction, not a `pokeprof.html` code fix, and is Jack's task to audit and correct at the source.

---

## Evolution Method Rule-Out (SETTLED — v0.22)

- **Bug:** `testedMethods` only ever received `level`/`friendship`/`friendship-day`/`friendship-night` from inside `recordEvolution()` — i.e. only on **success**. There was no path to mark these methods "ruled out" on failure, unlike item/trade methods (handled by `professorAutoTestEvolutions()`, which marks a method tested whether it matches or not). Structurally, these four methods could never appear in a species' "Ruled Out" count.
- **Fix — new constant:** `LEVEL_RULEOUT_THRESHOLD = 65` (highest level-based evolution across the whole franchise is Zweilous→Hydreigon at level 64; 65 clears it by the minimum safe margin).
- **Rule:** checked inline whenever a specific Pokémon's level or friendship changes (on level-up, on each friendship tick, live and offline) — no full-roster rescan. If that individual's level `≥65` and `level` isn't already in that species' `testedMethods`, push it in. If friendship `≥220` (`FRIENDSHIP_THRESHOLD`, existing constant) and friendship isn't already tested, push **all three** variants (`friendship`, `friendship-day`, `friendship-night`) in together.
- **Retroactive:** the same check also runs once for every owned individual across `state.dex` at game load, so already-existing saves with qualifying Pokémon get correctly ruled out immediately, not just going forward.
- No SAVE_VERSION bump — uses the existing `testedMethods` array, no new fields.

---

## Branching Evolutions (SETTLED — v0.20)

### Scope
- Species in scope for v0.20: **Eevee** — Vaporeon (Water Stone), Jolteon (Thunder Stone), Flareon (Fire Stone), Leafeon (new "Leaf Stone" substitute item), Glaceon (new "Ice Stone" substitute item), Espeon (`friendship-day`), Umbreon (`friendship-night`)
- **Sylveon — deferred v0.20 through v0.23, activated v0.24.** Its placeholder `use-move` row in `evotree.js` (`133→700`) is now functional — see "Move-Based Evolution (`use-move`)" below. Values: `evolveItem: fairy-special`, `evolveLevel: 40`. This is a simplified stand-in for the real game's combined Fairy-move + high-friendship requirement — this game checks move qualification only, no friendship component.
- **Leafeon/Glaceon rationale:** the real games use location-based triggers (Mossy Rock/Icy Rock); this game has no location-flag mechanic, so these are implemented as item-based substitutes instead, reusing the existing stone system. "Leaf Stone" and "Ice Stone" are new items Jack will add to the Excel `Items` sheet (`bagType: professor`, `effect: evolve-stone`) — not part of the `pokeprof.html` code change.
- **Espeon/Umbreon day/night:** no in-game time-of-day system exists — day/night is derived from the **client's real-world system clock**: 6am–6pm = day, 6pm–6am = night. No new state field.

### Data (`evotree.js` / EvoTree sheet)
- The EvoTree sheet's `evolveItem` column stores an **itemId slug string** (e.g. `"fire-stone"`) for `use-item` branches — matched against `state.professorBag`'s keys, which are always string slugs, never numeric. This differs from the single-target `pokedex.js` `evolveItem` field, which stores the item **display name** as a string for `use-item` (e.g. `"Fire Stone"`). Both are strings; neither is ever numeric. The two evolution paths intentionally use two different string formats for that method; code must handle both.
- **Bug history — corrected v0.24 (second pass):** an earlier fix mistakenly `numVal()`-cast `evolveItem` to a number for `use-item` branches in `convertEvoTree()`, on the false premise that `professorBag` keys were numeric. They are not — `Number("fire-stone")` is `NaN` → stored as `null`, which silently and permanently broke **every EVO_TREE `use-item` branch** (Eevee's stone evolutions among them): `professorAutoTestEvolutions()` compares against `Object.keys(state.professorBag)` (always strings), so `null === "fire-stone"` never matched, and a failed match is marked ruled-out forever with no retry. **Final fix:** `evolveItem` is never `numVal()`-cast in `convertEvoTree()`, for any method — always passed through raw via `val()`, exactly like `convertPokedex()` already does. Only `fromDexId`/`toDexId`/`evolveLevel` are legitimately numeric.

### `checkEvolution()` — EVO_TREE (Path 2) expansion
- `level` branches: unchanged, existing behavior
- **`friendship-day` / `friendship-night` (new):** auto-fires on the same level-up check as `level`/`friendship`, gated on `p.friendship>=FRIENDSHIP_THRESHOLD` AND the client system clock matching day (6am–6pm) or night (6pm–6am) respectively
- **`use-item` branches:** NOT auto-applied in `checkEvolution()` — confirmed via `professorAutoTestEvolutions()` (see below), then manually triggered per-branch via poke-modal buttons
- **`use-move` / `in-party` branches (v0.24):** auto-fire on the same level-up check as `level`/`friendship` — fully automatic, no Professor/manual step. See "Move-Based Evolution (`use-move`)" and "Party-Based Evolution (`in-party`)" below.

### Research & Display
- `researchLog[dexId].confirmedBranches` (see Research State per Species above) allows multiple simultaneously-confirmed evolutions per species
- **Family/Species card display:** superseded v0.22 — see "Evolution Chain Visual" below. Per-branch `???` granularity now exists.

---

## Move-Based Evolution — `use-move` (SETTLED — v0.24)

- `use-move` existed as a reserved-but-inert value in `EVOLUTION_METHODS` from v0.19 through v0.23 — no logic anywhere checked for it. v0.24 makes it fully functional.
- **Condition:** checked on level-up, same hook as `level`/`friendship` (`checkEvolution()`, `applyEvolutionSilent()`, and the EVO_TREE branch filter) — does the Pokémon have a qualifying move in `p.equippedMoves`?
- **Field reuse — no new columns added:**
  - `evolveItem` — descriptor string, one of two shapes: `type` alone (e.g. `"fairy"`), or `type-category` (e.g. `"ghost-physical"`). Category is `physical` or `special` only.
  - `evolveLevel` — optional power threshold. Blank/null = no power requirement, just needs the type (and category, if specified) present among equipped moves.
- Works identically on both the single-target (`pokedex.js`) and branching (`EVO_TREE`) evolution paths.
- **Confirmed use cases:**
  - **Primeape** (single-target): `evolveMethod: use-move`, `evolveItem: ghost-physical`, `evolveLevel: 50`. Homebrew stand-in for the real game's Rage Fist/×20-uses mechanic — no Rage Fist move exists in this game's dataset, so the condition is generalized to "any Ghost-type Physical move reaching 50 power."
  - **Sylveon** (branching, `EVO_TREE`, `133→700`): `evolveMethod: use-move`, `evolveItem: fairy-special`, `evolveLevel: 40`. Simplified from the real game's Fairy-move + high-friendship combo — no friendship component here.
- **Auto-confirm:** same treatment as level/friendship — no Professor/manual step, confirms the instant the condition is met on level-up.

---

## Party-Based Evolution — `in-party` (SETTLED — v0.24, new method)

- New addition to `EVOLUTION_METHODS` — not a prior placeholder, built from scratch in v0.24.
- **Condition:** checked on level-up, same hook as `level`/`friendship`/`use-move` — does `state.party` contain any Pokémon with `pokedexId === parseInt(evolveItem)`?
- **Field reuse:** `evolveItem` holds the required party-mate's dexId, stored as a string (matches the existing single-target `evolveItem` string-field convention).
- **Confirmed use case: Mantyke** — `evolveMethod: in-party`, `evolveItem: 223` (Remoraid's dexId). Evolves into Mantine when leveled up with a Remoraid in the active party — accurate to the real mechanic.
- **Auto-confirm:** same treatment as level/friendship/use-move.

---

## Evolution Research Tracking — `use-move`/`in-party` Gaps (SETTLED — v0.24)

Two structural gaps existed once `use-move`/`in-party` became real, functional methods, beyond just making them evolve correctly:

- **Gap 1 — success not tracked:** `recordEvolution()` (the function that marks a method "tested" the instant a Pokémon successfully evolves) only included `level`/`friendship`/`friendship-day`/`friendship-night` in its tracking list. **Fix:** `use-move` and `in-party` added to that list — a successful Primeape/Sylveon/Mantyke evolution now correctly marks the method tested.
- **Gap 2 — no rule-out path for species that structurally can't use these methods:** unlike `level`/`friendship` (scalar values with a real ceiling — `LEVEL_RULEOUT_THRESHOLD`/`FRIENDSHIP_THRESHOLD`) or `use-item` (universal ownership sweep via `professorAutoTestEvolutions()`, which tests every owned item against every known species regardless of match), `use-move`/`in-party` had no equivalent sweep. Without one, almost every species in the dex — anything that doesn't specifically evolve via one of these two methods, e.g. Sandslash — could never reach 100% tested, since neither method could ever be marked ruled-out for it.
  - **Fix:** on first research of a species (research-log entry creation), check whether it has *any* `use-move` or `in-party` branch defined — single-target (`pokedex.js`, `evolveMethod==='use-move'`/`'in-party'`) or branching (`EVO_TREE`). If none exists, immediately mark that method tested/ruled-out for that species — a structural, data-driven fact, knowable instantly with no gameplay required.
  - Species that *do* have a `use-move`/`in-party` branch skip this immediate rule-out and stay untested until a successful evolution (same as how a species with a real stone-evolution stays untested until the player actually owns and tries that stone).
  - **No rule-out-on-failure path exists for species that do have a qualifying branch** — `use-move`/`in-party` aren't scalar/threshold-based, so there's no valid "proven impossible past this point" condition (a player can swap moves or party members at any time). These two methods only clear via the structural check above or a successful evolution.

---

## Evolution Chain Visual (SETTLED — v0.22, revised v0.23 / v0.26)

- `renderEvolutionChainVisual(famId, highlightDexId)` is a **shared component** used on both Family Cards (Layer 1) and Species Detail (Layer 3), replacing the old flat `chainParts.join(' → ')` text line on the Family Card.
- Built on a **root-based walk of `EVO_TREE`**: a "root" is any dexId in the family with no incoming edge from another family member. Each root gets its own display row — Nidoran ♀/♂ (two independent roots, no shared egg/breeding stage) renders as two rows; Eevee (one root, many branches) renders as one row that fans out with `/` between simultaneous confirmed branches (e.g. `#133 Eevee → Vaporeon / Jolteon / Flareon`).
- Each node = `getSpriteUrl()` sprite (~40–48px) + name + dexId, matching existing pixelated sprite styling.
- Arrows carry **text** method labels (`Lv 16`, `Water Stone`, gender symbol at a Nidoran-style split) — no item-sprite lookup (`items.js` has no sprite-URL helper yet; text labels were chosen over building one).
- Unconfirmed nodes render as a greyed `???` placeholder box in place of the sprite. **Evaluated independently per row** — one branch can show `???` while a sibling branch (or a different root, for Nidoran) is fully resolved. This replaces the old single shared `???` check for the whole card.
- On Species Detail specifically, the node matching the currently-viewed species gets a highlight border. `buildEvoMethodsHtml()`'s collapsible "X/N Evolution Methods Tested" breakdown stays underneath, unchanged — this visual doesn't replace it, it fixes the fact that Species Detail previously showed *no* evolution summary at all (`getEvolutionDisplayText()` was never called there, only on Species Cards).
- **v0.23 — terminal-node further-evolution indicator:** a node with **zero data-defined outgoing edges** (e.g. Sandslash, which has no further evolution in the data) previously returned silently with no `???`. Now: unless that species is ruled out (`nonEvolutionConfirmed`, computed live — see Research State per Species above), append `? → ???` after it, same visual treatment as an unconfirmed branch. This makes "no further evolution" a claim the player has to earn through exhaustive testing, not something the UI assumes from missing data.

### Bug (pre-v0.26) — unseen root silently hid the entire chain
- Root selection required the root itself to already be in `seenDexIds`: `const roots = allMembers.filter(m => !hasIncoming.has(m.dexId) && seenDexIds.has(m.dexId))`. If a family's true structural root had never been seen (e.g. Pichu, if the player only ever caught Pikachu), it failed this check — and since nothing else in the family qualifies as a root either (Pikachu has an incoming edge from Pichu), `roots.length` came out `0` and the function returned an empty string, hiding the *entire* chain, not just the root. A species with no pre-evolution (e.g. Sandshrew, which is its own root) never hit this bug, which is why it looked species-specific until traced.

### Fix (v0.26) — unseen root renders as a placeholder instead of hiding everything
- True structural roots (no incoming edge, by data alone) always render, seen or not.
- An unseen root renders as a `?` placeholder (`evoPlaceholderHtml()`) with an arrow into the first known member — same visual treatment already used for unconfirmed downstream evolutions.
- Resolves to a real sprite automatically once the root species is seen by any means (Day Care being the primary intended path — see "Day Care / Breeding System") — this falls directly out of the existing `seenDexIds` check, no separate "confirmed root" flag was added.

### Bug (pre-v0.26) — item-based evolutions could never register as confirmed
- Branch confirmation compared `confirmedBranches[].method` against the edge's generic EVO_TREE `evolveMethod` field. For any item-triggered evolution, `recordEvolution()` stores the **item's name** as the method (e.g. `"Water Stone"`), but the edge's `method` field is the literal string `"use-item"` — these can never be equal. Every item-based evolution failed this comparison, unconditionally, regardless of how many times it had actually happened (Eevee's stone evolutions were the case that surfaced this).

### Fix (v0.26) — item-aware branch matching + seen-but-unconfirmed fallback
- When an edge's method is `"use-item"`, the comparison uses the edge's item name instead of its generic method string: `const matchKey = e.method==='use-item' ? e.item : e.method`.
- **Additionally:** a branch now renders its real species node if the target has been **seen by any means** (`seenDexIds`), not only if the specific evolution method was formally confirmed via `recordEvolution()` — covers species obtained via Day Care, or any other path that doesn't route through the normal evolution-checking flow. The connecting arrow shows the real method label if formally confirmed, or a generic `?` if the species is known but the method itself hasn't been tested.

### Clickable Sprite Nodes (SETTLED — v0.28)
- Sprite nodes in the chain visual — in **both** the Family Card (Layer 1) and Species Detail (Layer 3) contexts — are now clickable, jumping directly to that species' own detail page. Previously, Family Card chain sprites were dead clicks (wrapped only in `event.stopPropagation()`, blocking the card's own navigate-to-species-list action with no replacement), and Species Detail chain sprites had no click handling at all.
- `evoNodeHtml()` gains a `data-dexid` attribute + `cursor:pointer`; a new shared delegated handler `familyChainNodeClick(event)` walks up from the click target to the nearest `[data-dexid]` ancestor and navigates (`dexSelectedDexId` updates, `dexView='detail'`, `renderDex()`). Reused identically at both call sites.
- Placeholder/unseen nodes (`evoPlaceholderHtml()`) remain non-interactive — no detail page exists for a species not yet seen.
- On the Family Card, clicking elsewhere on the card (name, background, the ▶ arrow) keeps its existing behavior — navigates to that family's species list. This is purely an added shortcut on the sprite icons themselves.
- Display/interaction-only — no `state` schema change.

### Duplicate Branch on Legacy `evolvesIntoId` (SETTLED — v0.35 fix)
- **Bug:** for any species with both a legacy flat `evolvesIntoId` (pokedex.js) and `EVO_TREE` branch rows for the same dexId, the edge-building loop in `renderEvolutionChainVisual()` counted both sources — drawing the same evolution twice (plus any genuine additional branches). Confirmed via full data audit: 9 species affected (Pikachu/Raichu, Eevee, Gloom, Poliwhirl, Slowpoke, Scyther, Exeggcute, Cubone, Koffing) — every one has a flat `evolvesIntoId` that exactly duplicates one of its own `EVO_TREE` rows.
- **Fix:** whenever `getEvolutions(m.dexId)` returns any branch rows for a species, `EVO_TREE` is treated as the sole/authoritative edge source and the flat `evolvesIntoId` edge is skipped entirely for that species.
- Display-only — `professorAutoTestEvolutions()` was never affected (already deduped via `alreadyConfirmed`). No SAVE_VERSION impact.

---

## Shiny Symbol on Species (SETTLED — v0.23)

- New helper `hasLiveShiny(dexId)`: `state.dex.some(p => p.pokedexId === dexId && p.isShiny)`. Purely derived from existing state — no new field, no SAVE_VERSION impact.
- Reflects **currently held** shinies only — the badge disappears automatically if released or evolved past (individual re-evaluated live, not a permanent record).
- Applied in three places: Pokédex grid cells (`renderDexPokedexGrid()`), Family/Species-Detail evolution chain nodes (`evoNodeHtml()`, shared by both), and the Species Detail header (`renderDexDetail()`).

---

## Map System (SETTLED — v0.18 architecture)

- `renderMap()` reads node positions directly from `LOCATIONS` (via `getLocation()`, using the `mapCol`, `mapRow` fields) instead of the hardcoded `MAP_NODES` object — `MAP_NODES` is removed entirely
- Renders as an SVG using a **dynamic viewBox** computed from discovered node coordinates
- ViewBox is calculated from the min/max col/row of visible (discovered) nodes plus padding — never a fixed grid
- Only discovered locations with valid `mapCol`/`mapRow` are rendered
- Node color is derived via `getMapNodeStyle()`: locations with a `shopTier` render city-style (green), heal-only locations render town-style (red), everything else (routes, dungeons) renders route-style (blue)
- Connections between discovered locations are drawn as lines; gated connections use dashed purple, free connections use solid blue
- Clicking a location node calls `selectMapLocation(locId)` → updates `mapSelectedLoc`, re-renders map, then calls `showMapDetail(locId)`
- The map tab triggers `renderMap()` on switch

### Label Positioning (SETTLED — v0.22)
- `renderMap()` label y-offset is column-parity staggered to prevent adjacent-column label overlap: even `mapCol` → `y+26` (unchanged), odd `mapCol` → `y+38` (12px extra stagger).
- No connector/leader line between node and label — straight vertical offset only.
- Pixel value is a tuned starting point, not a hard constant — adjust if visual review calls for it.

### Map Detail Panel — Encounter Display (SETTLED — v0.19 update pending)
- `showMapDetail()` currently shows: location name, region, heal status, shop tier, whether Carl is currently there, and a full encounter panel with 48px sprites, level ranges, encounter method, percentage bars, and seen count
- **v0.19 update:** change `(N seen)` display to `(N seen, M caught)` per species per location
- This requires a **schema change** to `state.locationEncounterLog`: currently a flat count `{[dexId]: N}` per location — must become `{[dexId]: {seen: N, caught: M}}` per location
- Currently `gameTick()` writes to the log when an encounter appears ("seen") and `catchPokemon()` also writes to the same counter ("caught") — these must be separated into distinct `seen` and `caught` keys
- SAVE_VERSION bump to 12 required; migration: treat all existing flat counts as `seen`, initialize `caught: 0`

### Encounter Log — `state.locationEncounterLog` (SETTLED)
- Every encounter (online or offline) must be written to `state.locationEncounterLog[locationId][dexId]`
- The key is always an **integer** `dexId` — use `parseInt()` on the dexId
- **Online path**: `gameTick()` increments `seen` at the moment an encounter appears; `catchPokemon()` increments `caught` on a successful catch
- **Offline path**: `processOfflineTime()` increments `seen` for every simulated encounter, `caught` for every simulated catch

---

## Trainer / Aide System (SETTLED)

- Carl Oak is the starting aide, comes with a level 5 Rattata
- Each aide has their own **per-aide inventory** (`aide.bag`) containing field equipment: badges, HMs, Bicycle, Rods (Old/Good/Super), Safari Pass
- Per-aide inventory is **not shared** between aides — Carl having an Old Rod doesn't give a second aide one
- `state.trainerUnlocks` exists in the codebase as a stub — its relationship to per-aide inventory will be clarified during v0.19 inventory split implementation
- Trainer abilities, new trainer recruitment, etc. are **future features** — do not implement yet

### Aide Panel — Badge Sprite Display (SETTLED — v0.27)
- The aide panel layout changes to two lines: **Line 1** is the aide name (e.g. "🧑‍🔬 Carl Oak") followed inline by sprite icons for every badge currently held in that aide's `aide.bag`. **Line 2** is the party Pokémon mini-sprites, moved down from their previous spot on the name line.
- Badge sprites are resolved via a hardcoded `BADGE_SPRITE_MAP` in `pokeprof.html` (itemId → image URL), **not** the Items sheet's `sprite` column — that column is currently unused dead data (a slug intended for a future general item-sprite pipeline against a different base path) and doesn't fit the Kanto badge sprites' numbered (not slug-named) filenames in the source repo anyway.
  - Source: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/` — `1.png`–`8.png` map to Boulder/Cascade/Thunder/Rainbow/Soul/Marsh/Volcano/Earth respectively (verified visually against Bulbapedia's official badge images).
  - `champion-badge` has no real-game sprite (it's a PokeProf-original item) — renders as a 🏆 emoji fallback instead of an image.
- The `#aide-bag-items` "Aide bag: ..." text row is **removed as of v0.30** — see "Party Tab — Bag Summary & Full Inventory Modal" below.
- The `🎖 Badges: X/8 · Level Cap: X` summary line is unchanged, unaffected by this display change.
- **v0.29 addition:** a new `TRAINER_SPRITE_MAP` (trainerName → portrait image URL) follows the exact same hardcoded-map pattern as `BADGE_SPRITE_MAP` above. All 13 entries (8 gym leaders + 4 Elite Four + Champion) sourced from Bulbagarden Archives' **FRLG** trainer sprite set — chosen for a single consistent era across all 13, since Agatha and Lorelei have no HGSS sprites at all (HGSS's Kanto post-game rematch reuses Johto's own Elite Four — Will/Koga/Bruno/Karen — not a Lorelei/Agatha reunion). Falls back to a 🧑 emoji if a URL ever breaks, same pattern as the Champion badge's 🏆 fallback. Used by the new Watched Gym Battle screen (see "Gym / Trainer Battle System") to show the opposing trainer's name + portrait briefly before battle. No Excel/converter change — code-side only, same as badges.

### Party Tab — Bag Summary & Full Inventory Modal (SETTLED — v0.30, NEW)
- **Scope:** Party tab only — not a persistent/global row across other tabs.
- Removes both existing inventory displays from the Party screen: `#aide-bag-display`
  (ball count + non-ball professor items) and `#aide-bag-items` (aide/trainer bag text
  list) are deleted entirely.
- Replaced with a single line: **"Professor: Balls | TMs | Potions | Revives"**, plus
  a **Bag** button.
  - Balls = existing `getBallCount()` helper.
  - TMs = `state.professorBag['tm']`.
  - Potions = sum of every `state.professorBag` item whose `effect` is `heal-hp` or
    `heal-hp-full`.
  - Revives = sum of every `state.professorBag` item whose `effect` is `revive-half`
    or `revive-full`.
- **Bag button** opens a modal showing full inventory for everyone, structured as a
  Professor section followed by one section per aide (future-proofed for multi-aide,
  even though only Carl exists today) — each listing item name + quantity.
- **Unaffected:** aide name, badge sprites, party Pokémon mini-sprites, location text,
  and the "🎖 Badges: X/8 · Level Cap: X" line all stay exactly as they are.

---

## Money (SETTLED)

- Universal resource, no other survival resources exist
- Base income: $1.00/min passive, scales with catches
- Current funds always visible in the game header
- Starting funds: **$100.00** (raised from $5.00 in v0.28)

---

## Data Architecture (SETTLED)

### CRITICAL: Party/Dex Object Reference (SETTLED — do not break)
- `state.party` and `state.dex` must always contain references to the **same JavaScript objects**
- **`JSON.stringify` + `JSON.parse` (save/load) breaks this link** — after loading, re-link in `loadGame()`:
  ```js
  // Re-link party entries to canonical dex objects — do not remove, JSON parse breaks references
  state.party = state.party.map(pp => state.dex.find(d => d.id === pp.id) || pp);
  ```
- This line must always be present in `loadGame()`, immediately after state is restored

### Species Identity — Always Use dexId (SETTLED)
- Species identity must always use `dexId` (integer), never name strings
- Nidoran♂ and Nidoran♀ share a name but have unique dex IDs — name-keyed lookups collapse them
- Resolution pattern: `getPokemonEntry(dexId)` with two-step fallback everywhere (`makePokemon`, `checkEvolution`, `giveExp`, `giveExpSilent`, `calcMaxHP`, `calcBST`, encounter speed check)

### Excel → JS Pipeline
- Master data lives in Excel; converted via `converter.html` into JS files
- Never hand-edit the generated JS files directly
- `bagType` column (`"professor"` / `"trainer"`) is required on all items in `items.js`
- `defaultEncounterMethod` column is required on all locations in `locations.js` (v0.19)
- **`Trainers` tab (v0.25)** — required for the Gym Battle System; see "Data Model — `trainers.js`" under Gym / Trainer Battle System for the full column schema. Converter bumped to **v7** (v6 added `convertTrainers()`; v7 revised the move columns to combined type+category strings).

---

## Trainer Battle System (SETTLED — v0.23, revised v0.30)

Originally applied only to trainer/gym battles, with wild encounters (`fight()`,
ball-throwing, `resolveEncounterStep()`, `processOfflineTime()`) completely untouched.
**As of v0.30, wild encounters now share this same damage formula, crit mechanic, and
speed check** — see "Combat System" for the wild-specific turn loop, catch formula,
and move-assignment rules layered on top of this shared engine.

### Move Mechanic
- 18 types × 2 categories (Physical/Special) = 36 possible move slots per species. Every Pokémon starts each available slot at power 40.
- A Pokémon has up to 4 **equipped** move slots at a time, chosen from its species' available pool (defined by 36 new nullable Pokedex columns — `null` = species has no access to that slot, number = `powerCap`).
- Form-variant rows (Alolan, Galarian, etc.) already exist as separate full rows in the Pokedex sheet keyed by `dexId`+`formName` — this schema handles them natively.
- Accepted tradeoff: fixed-width schema. Adding a 19th type later requires restructuring every existing row, not just adding new rows.

### Per-Pokémon State
- `p.equippedMoves[]` — up to 4 entries `{type, category, power}`. Power starts 40, +5 per TM use, capped at that slot's `powerCap`.
- Swapping a move out of the 4 equipped slots and back in later **resets its power to 40** — investment is not remembered outside the 4 active slots (deliberate save-size tradeoff).
- **Default move at catch/migration:** type1 slot if the species has one available (random Physical/Special if both exist for that type) → else type2 slot (same logic) → else Normal-Physical fallback (always Physical, no randomness on the fallback path). Only 1 slot is filled by default; slots 2–4 start empty.

### TM Item — Gates All Move Manipulation
- No free-form equip/swap. One TM item, 3 possible actions, 1 (or more, see Bulk Upgrade below) consumed per action:
  - **Add** — fill an empty slot with a move from the species' available pool
  - **Upgrade** — +5 power per TM on an equipped move, blocked outright at the slot's cap
  - **Change** — swap an equipped move for a different pool option (new slot starts at power 40)
- Add/Change picker hides/grays any type+category already equipped elsewhere on that same Pokémon — no duplicate slots.
- Upgrade/Add/Change buttons are disabled outright (not just blocked on confirm) with a "Need 1 TM" label when `state.professorBag['tm']` is 0 (TM's `bagType` is Professor).
- **Items sheet row:** `itemId: tm`, `name: TM`, `itemCategory: tm`, `effect: modify-move`, `bagType: Professor`, `shopTier: basic`, `shopPrice: 25`, `isConsumable: TRUE`, `requiresTarget: TRUE`, `usableInField: TRUE`, `usableInBattle: FALSE`.

### Move Power Cap Fix (SETTLED — v0.26)
- **Bug:** each slot's TM-upgrade ceiling (`powerCap`) is the highest-power move of that type+category the species/family can learn, aggregated across the whole evolution chain's learnset. Moves that KO the user on use — Self-Destruct (200), Explosion (250), Final Gambit (user's current HP) — were included in that aggregation the same as any other move, despite the battle system having no way to represent their drawback (moves are abstracted to type+category+power only, no per-move effects). Any species able to learn one of these inflated its `normalPhysical` cap to 200+, letting a TM-grinder push that slot to an absurd ceiling with zero downside.
- **Fix:** new helper `getMoveCap(entry, type, category)` reads the raw cap and clamps it to a flat maximum of **120**, applied at both read sites — `getAvailableMoveSlots()` (the source of every displayed/usable cap) and the direct read in `openMoveSlot()`. No data or `MoveFetcher.html` change required. 120 was chosen because mainline's strongest non-drawback moves (Fire Blast/Blizzard/Hydro Pump-tier) top out around 110–120; 150+ starts overlapping with recharge-turn moves (also unmodeled, but out of scope for this fix), and 200+ is exclusively the self-KO tier this fix targets.

### Bulk TM Upgrade (SETTLED — v0.26)
- The single "⬆ Upgrade (1 TM)" action is replaced with a quantity dropdown + upgrade button in `openMoveSlot()`.
- Dropdown range: 1 up to `min(TMs owned, TMs needed to reach the slot's cap)`, where TMs-to-cap = `Math.floor((cap - slot.power) / 5)` — never offers a quantity that would waste TMs past the cap.
- **Defaults to the max useful amount**, not 1 — the common case is "use everything I have on this slot," and the dropdown can be lowered from there if a smaller amount is wanted.
- Confirm dialog scales with the selected quantity (e.g. "Use 6 TMs to upgrade Electric Special from 40 to 70?"), and applies all selected TMs in a single action — one `state.professorBag['tm']` decrement, one power update.

### Move UI
- 4 rounded-rectangle slots at the bottom of each party card — 💥 (Physical) or 🌀 (Special) + type icon + power number, read-only on the card itself.
- Tapping the card opens the existing `showPokemonDetail` modal, extended with tappable move slots → Upgrade/Change options (or "Add Move" if the slot is empty) → confirmation modal before spending the TM.
- **v0.24 — Species Detail modal move display overhaul:** the 4 equipped moves in the Pokémon detail modal changed from a single row of plain power numbers to a **2×2 grid of individually boxed moves**. Each box's background/accent is colored using the existing type-color palette (same as Pokédex/type badges) — color-only, no text type label, consistent with the rest of the game's visual language. Category icon (💥/🌀) and power number are retained inside each box.

### Damage Formula (matches the real mainline games)
```
Damage = floor(floor(floor(2×Level/5 + 2) × Power × A/D) / 50) + 2
       × STAB(1.5x if move type matches attacker's type1/type2)
       × TypeEffectiveness (existing TYPE_CHART/getTypeEffectiveness())
       × Random(0.85–1.00)
```
- `A`/`D` = level-scaled stats via a new reusable `calcStat(base, level)` function — extracted from the inline `st()` helper already used in `calcBST()` (`floor((base×2×level)/100)+5`). Applies to Atk/Def (Physical) or SpAtk/SpDef (Special) on both sides.
- No status, no priority, 100% accuracy, unlimited PP. (Crits added v0.30 — see below.)

### Critical Hits (SETTLED — v0.30, NEW)
- Modern mainline mechanic: flat **1/24 (≈4.17%)** chance, **×1.5** damage multiplier,
  applied uniformly to every attacker (gym trainer AI, lead, and wild Pokémon alike —
  all route through `calcBattleDamage()`).
- No high-crit-ratio moves, no crit-boosting items/abilities — this game's moves are
  abstracted to type+category+power only with no per-move flags, and there's no held-
  item system, so a flat uniform rate is the only version that fits; documented here as
  a deliberate simplification, not a partial implementation.
- **Watched Gym Battle screen only:** a crit gets a `"A critical hit! "` prefix on the
  existing per-turn move/damage text line (e.g. "A critical hit! Weedle used Bug
  Physical — 19 dmg!"). Silent paths (offline gym catch-up, silent wild encounters)
  compute the same math with no display change, consistent with their existing
  no-per-instance-text design.

### Battle Loop
- Speed-based turn order, reusing the existing effective-speed formula (`floor((baseSpd×2×level)/100)+5`), evaluated every round (not once per battle), random tie-break.
- Multi-Pokémon gauntlet — fainted Pokémon auto-cycle to the next non-fainted teammate on either side; battle ends when a full team of up to 6 is fainted.

### AI Move Selection
- Of the 4 equipped moves, compute expected damage against the current target (type effectiveness + STAB) and pick the highest.
- A move cannot be used a 3rd consecutive turn in a row — if the top pick was just used twice, it's excluded and the next-highest is chosen instead.
- This "recently used" tracker resets whenever the Pokémon switches out and back in.

### converter.html
- `convertPokedex()` extended to read and pass through the 36 new columns as plain numeric/null fields (no ID casting needed).
- **v0.34: `spriteUrl` field** — if the Excel `spriteURL` cell is a bare number, the converter now builds the full PokeAPI sprite URL automatically (`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{number}.png`); a full URL pasted directly still passes through unchanged. Converter bumped to **v8** for this (v7 was the last logic change — Trainers move-column revision).

### New Standalone Fetcher Tool (separate build, not part of converter.html)
- Same dexId-range + single-name UX as the existing Pokedex fetcher.
- Pulls cross-game learnsets from PokéAPI, filters out status moves, groups by `(type, damage_class)`, takes max real-world `power` per group, outputs one row in the 36-column format.
- Output is pasted directly into the Pokedex sheet (sorted identically by dexId, no VLOOKUP/XLOOKUP due to doc-weight concerns).
- Form variants aren't reachable via the dexId-range pull (PokéAPI indexes them by name-slug) — fetched via the single-name field.
- Inline form-variant flagging via PokéAPI `varieties` — surfaces a one-click "fetch this form too" button when extra varieties exist beyond the base form.
- Accepted gap: a species never re-fetched won't trigger this flag if a form is added to PokéAPI later — will show as a visibly blank row in the maintained sheet.

### Explicitly Out of Scope for v0.23
- Battle triggers (how/when a trainer battle starts — no design exists yet)
- Badge tracking/rewards
- Opposing trainer AI/team composition
- Any change to wild encounter resolution

---

## Gym / Trainer Battle System — Triggers, Badges, Level Cap (SETTLED — v0.25, revised v0.29)

Builds on the v0.23 battle engine (above) with 8 regular Gyms + Indigo Plateau (Elite Four + Champion), badges, aide-specific level caps, and a forced-tier progression model. **As of v0.29**, there are two distinct battle triggers depending on badge status — see "Watched Gym Battle — Aide Card Trigger" and the revised "Trigger — Mission Modal Integration" below.

### Data Model — `trainers.js` (new)
- New Excel `Trainers` tab, generated via `converter.html` (**bumped to v7** for this) following the same converter pattern as `encounters.js`/`locations.js`.
- **One row per team-slot.** `(trainerId, tier[, gauntletOrder])` groups rows into a single battle roster — same denormalized-flat-row approach as `encounters.js` (one row per species per location per method).
- **Trainers tab columns:** `trainerId, trainerName, locationId, tier, isGauntlet, gauntletOrder, badgeItemId, slotIndex, dexId, formName, level, move1, move1Power, move2, move2Power, move3, move3Power, move4, move4Power`
  - **`moveN` is a combined type+category string (v0.25 revision)** — matches the Pokedex sheet's own column-naming convention exactly: lowercase type + capitalized category, no separator (e.g. `rockSpecial`, `fairyPhysical`). Originally spec'd as three separate columns (`moveNType`/`moveNCategory`/`moveNPower`); combined per Jack's request to cut 4 columns and match a format he's already using elsewhere. `converter.html` (bumped to **v7**) parses this back into separate `moveNType`/`moveNCategory` fields internally, so `trainers.js` output and `buildEnemyTeam()` in `pokeprof.html` are unaffected — only the Excel-facing column count changed.
  - Blank `moveN` = that slot is empty (same rule as before).
  - `isGauntlet` — `TRUE` on **every** Indigo Plateau row, at **both** tier 9 and tier 10 (identifies "this trainer belongs to the Indigo roster," read by `isIndigoTrainer()` at any tier — it is not, by itself, what triggers 5-leg battle behavior; that's a separate runtime check, see "Elite Four/Champion Gauntlet Bug Fix" below). `gauntletOrder` (1–5) is populated on Indigo rows at both tiers and marks which of the 5 legs that slot belongs to.
  - `badgeItemId` — repeated identically on every row for a given `trainerId`, **including** `isGauntlet` rows (corrects earlier doc text claiming this was blank/null on gauntlet rows — it isn't; `awardGymWin()` relies on it being present to look up the Champion badge)
  - `slotIndex` — position (1–6) within that specific battle's team
- `trainers.js` exposes `getTrainerRoster(trainerId, tier, gauntletOrder)`, `getTrainerBadge(trainerId)`, and `getAllTrainerIds()` helpers, generated by the converter.
- **8 regular gyms**: each bound to one city location, with hand-authored rosters for tiers 1–8 (species/level/equipped moves per team slot).
- **Indigo Plateau**: a 9th location, inaccessible until the aide holds all 8 regular gym badges.
  - **Tier 9**: Elite Four + Champion gauntlet — 5 hand-authored battles resolved as a single unit. Exclusive to Indigo Plateau; regular gyms never have a tier 9.
  - **Tier 10**: post-game superboss content, unlocked at **all 9 locations** (8 gyms + Indigo) once the Champion badge is earned.
- Schema should leave room for future gauntlet-style sub-trainers within regular gyms (mainline-game precedent) — **not implemented in v0.25**, see Future Goals.

### Badges
- New item type in `items.js`: `itemCategory: badge`, `bagType: trainer`, `isConsumable: FALSE`.
- 9 badges total: 8 regular gym badges + 1 Champion badge (earned by clearing the tier-9 gauntlet).
- **Earned on first win against a given gym, at whatever tier is currently forced at the time of that win** — there is no requirement to reach tier 8 first. Re-battling a gym after its badge is already earned has no further badge effect (tracking/grinding only).
- Badges live in the earning aide's per-aide inventory (`aide.bag`), routed and isolated identically to HMs/Rods/Safari Pass — never shared between aides.

### Level Cap
- **v0.33:** `cap = beatChampion ? 100 : 15 + (aide's badge count × 10)` — range 15–100. Progression: 15, 25, 35, 45, 55, 65, 75, 85, 95 (8 badges), then 100 once the Champion is beaten. The final pre-Champion→Champion step is +5 rather than the +10 of every other step, an unavoidable consequence of shifting the start while keeping the ceiling pinned at 100. Live-computed — no SAVE_VERSION impact, takes effect immediately for existing saves on next load. In-game "Level Caps" Info Menu copy updated to match (`10`→`15`).
- *(Formula prior to v0.33: `10 + badges×10`, range 10–100 — superseded above.)*
- Evaluated **live**, per-aide, per-Pokémon-currently-in-that-aide's-active-party. Not baked in at catch or assignment time.
- The professor cannot assign a Pokémon above the holding aide's current cap to that aide's party. A capped Pokémon does not gain XP/levels above the cap while held by that aide.
- Box'd/unassigned Pokémon are never capped. Moving a Pokémon to a different aide re-evaluates the cap live against that aide's current badge count.

### Forced Tier Logic
- Tier = `(aide's current badge count) + 1`. **Never player-selectable** — no tier dropdown or override anywhere in the mission modal.
- **Clamp rule:** once an aide holds all 8 regular gym badges but has not yet beaten the Champion, the formula would output tier 9 for a regular gym rematch — but tier 9 doesn't exist for regular gyms (Indigo-exclusive). In this window, regular gym rematches **clamp at tier 8**.
- Once the Champion badge is earned: forced tier becomes **10 everywhere** (all 8 gyms + Indigo Plateau) — tier 9 is skipped entirely for gyms, remaining a one-time-only Indigo Plateau gauntlet.

### Trigger — Mission Modal Integration (revised v0.29)
- "Gym Battle" is selectable in the mission modal for: any regular gym (1–8) whose badge is already earned, at any tier; and **Indigo Plateau, but only at tier 10**, once the Champion badge is earned.
- **Indigo Plateau tier 9 never appears in the mission modal**, badge status irrelevant — it's always watched-only (see below).
- Unbadged regular gyms do not appear in the mission modal at all — the only way to earn a badge is the watched trigger below.
- Once eligible, reuses `buildRouteTable()` and existing method-weighting logic unchanged — no new trigger paradigm for this path.
- **This path never grants a badge**, even against a gym it can technically reach (impossible in practice, since unbadged gyms are excluded) — farm-only, by design.

### Watched Gym Battle — Aide Card Trigger (SETTLED — v0.29, NEW)
- A "Battle Gym" button is always visible on the aide card whenever the aide's current location is a gym (any of the 8 regular gyms, or Indigo Plateau once accessible) — no readiness/level gating, always tappable.
- Tapping it opens a **team-order prompt**: a draggable list of the player's current party sprites/icons, letting them set active lineup before the battle begins.
- The battle then plays back **turn-by-turn at ~0.5 seconds per move, mandatory, no skip option.**
- **This is the only path that can earn a badge on first win.**
- **Battle screen layout (mainline-style):** opponent's active Pokémon sprite + name + level + HP bar at the top, player's active Pokémon sprite + name + level + HP bar at the bottom, sprites swap immediately on faint as the next non-fainted teammate cycles in. A compact move/damage text line appears each turn (e.g. "Weedle used Bug Physical — 12 dmg!"), advancing at the playback pace. The opposing trainer's name + portrait (via new `TRAINER_SPRITE_MAP`, see "Aide Panel — Badge Sprite Display") is shown **briefly at the start only**, then gives way to the Pokémon sprites for the rest of the fight.
- **Blocking flow:** once triggered, the player stays on-screen through team order → playback → result. No leaving mid-battle, for single fights and each gauntlet leg alike.
- **Indigo Plateau gauntlet (tier 9 and tier 10) specifics:** between each of the 5 legs, team order can be reshuffled and healing items may be used (existing `getWeakestEffectivePotion()` inter-battle auto-heal logic, unchanged). No-heal-*within*-a-leg and full-reset-on-loss-resets-to-leg-1 rules are unchanged — this only opens a management window *between* legs.
- **Indigo Plateau tier 9** (the original Elite Four/Champion clear) is always watched via this button — never offline, regardless of badge status. **Indigo Plateau tier 10** (postgame rebattle) can also be watched via this button, but isn't required to be — see the mission-modal grind path above for the offline alternative.

### Loss / Retry Behavior (SETTLED — wording revised v0.30)
- Regular gym battles: auto-retry, no gameplay penalty — behavior unchanged.
  **v0.30:** the "No penalty — try again" phrasing is dropped from all three
  player-facing strings (mission-modal grind-path log line, watched-battle log line,
  watched-battle result text) — now reads "Lost to [gym] (Tier [tier]). Try again."
  / "Lost a gym battle. Try again." / "Defeated. Try again." Wording only; the actual
  no-penalty behavior is unchanged. (DESIGN.md's own description of the mechanic is
  documentation, not player-facing copy, and is unaffected.)
- Tier-9 gauntlet: **no heal between the 5 battles.** A loss at any point resets the entire attempt back to battle 1 (first Elite Four member).

### Inter-Battle Healing
- Reuses existing `getWeakestEffectivePotion()` auto-heal logic unchanged (smallest potion that heals without waste, no HP threshold), pulling from `state.professorBag`.
- Fires **only before each battle instance starts** (including before each of the 5 gauntlet legs) if not at full HP. Never mid-battle — individual battles remain single-tick resolutions with no interruption point, consistent with existing wild-encounter behavior.
- **v0.32 fix:** the passive per-tick `checkLocationHeal()` (fires on every `gameTick()`
  encounter-roll cycle at any `heals:true` location) was silently fully-healing the
  party for free throughout Elite Four/Champion gauntlets, since Indigo Plateau is a
  heal location and the whole gauntlet — including downtime between legs — happens
  while stationed there. This bypassed the "items only, no free heal" gauntlet rule
  above. Fixed by guarding `checkLocationHeal()` with `if(watchedBattle) return;` —
  suppresses the passive heal only while a gym/gauntlet encounter is actively in
  progress; normal in-town heal-on-arrival/heal-on-tick behavior is unaffected
  everywhere else.

### Per-KO EXP Attribution (SETTLED — v0.32, fixes pooled-EXP bug)
- **Bug (pre-v0.32):** `runOneGymBattle()`/`runOneGymBattleSilent()` summed EXP across
  every enemy Pokémon in the battle into one `totalExp`, then gave the full total to
  every party member still conscious at the end — letting one survivor (often the
  strongest/highest-level, since it's the one likely to survive) absorb credit for KOs
  it never landed. Also produced a secondary symptom: a large one-shot EXP grant could
  cascade through several level-ups, each level's HP-catch-up (`currentHP += maxHP
  increase`) compounding into what looked like a de facto free heal.
- **Fix:** after `runTrainerBattle()` returns, walk `result.log`. For each `{faint:X}`
  entry where X belongs to the enemy team, the immediately preceding log entry's
  `attacker` field is the player Pokémon that landed that KO. Award that enemy's EXP
  (`baseExpYield×level/7`, unchanged formula) to that specific attacker via
  `giveExp`/`giveExpSilent`, looked up by id in the real `state.party` (not the
  battle-copy) — so credit persists even if that Pokémon faints later in the same
  battle. Applies identically to both the live (`runOneGymBattle`) and offline/silent
  (`runOneGymBattleSilent`) paths.
- **EXP banking past the level cap (confirmed intended, unchanged):** `pokemon.exp`
  accumulates unconditionally regardless of the level cap; a capped Pokémon's excess
  EXP resolves in a burst of level-ups the moment the cap rises (e.g. a new badge). Not
  a bug — no fix needed.

### Progress Tracking
- Per-gym "highest tier reached" tracked as a **display/achievement stat only** — no gameplay effect, purely informational (trophy-style).

### SAVE_VERSION Bump
- Required. New state: badge entries in `aide.bag`; per-gym highest-tier-reached tracker (shape TBD at implementation time, likely `aide.gymProgress[gymId] = highestTier`).
- Migration pass needed for existing saves — new fields default to empty/0 on load.

### Elite Four/Champion Gauntlet Bug Fix (SETTLED — v0.28)
- **Bug:** the live data had 5 separate real `trainerId`s (`agatha`, `blue`, `bruno`, `lance`, `lorelei`) instead of one shared id as the schema intends, and `gauntletOrder` — despite already being supported by `getTrainerRoster()` and `converter.html` — was never actually populated on any row. Two compounding failures: (1) `getTrainerRoster(trainerId, tier, leg)` filtered on `t.gauntletOrder === leg`, which is always `undefined === leg` → always false → every leg resolved an empty roster → instant loss at leg 1, every attempt; (2) `rollEncounter()`/`runGymEncounter()` only ever targeted `gymTrainerIds[0]` (`agatha`), so even independent of bug (1), the other four members' rosters were never reachable at all — including their tier-10 rows, which existed in the data but were equally orphaned.
- **Fix (data, Jack's side):** all five members' rows consolidated to `trainerId: eliteFourChampion`, at **both** tier 9 and tier 10, with `gauntletOrder` 1–5 populated identically at both tiers (1=Lorelei, 2=Bruno, 3=Agatha, 4=Lance, 5=Blue). `isGauntlet: TRUE` unchanged on all these rows.
- **Fix (code):** `runGymEncounter()` and `runGymEncounterSilent()` both change `isGauntlet=isIndigoTrainer(trainerId)&&tier===9` → `isGauntlet=isIndigoTrainer(trainerId)&&(tier===9||tier===10)`. This makes the postgame Indigo Plateau rematch a full 5-leg gauntlet at tier-10 rosters, same heal-before-leg/no-partial-credit rules as the first clear — previously the intended design (per the original comment above this code) was a single tier-10 battle, revised in v0.28 once it became clear the tier-10 data for all five members already existed and was simply unused.
- No further badge/TM re-grant risk — `awardGymWin()`/`awardGymWinSilent()`'s existing "already earned" guards already prevent double-granting on repeated wins.

### Offline Gym Battle Simulation (SETTLED — v0.26, re-scoped v0.29)
- **v0.25 gap (deliberate, not an oversight):** `processOfflineTime()` discarded gym encounters outright — `if(enc.type==='gym'){ advanceTravelPath(); continue; }` — because gym battles are full team-vs-team fights using the live turn-based engine (speed-order turns, `calcBattleDamage`, possible 5-leg gauntlet chains), and the wild-encounter offline path's simplified one-hit formula doesn't apply to them.
- **v0.26 fix:** offline catch-up now runs gym encounters through the exact same real functions the live path uses — `healPartyBeforeGymBattle()` → `buildEnemyTeam()` → `runOneGymBattle()` (or the 5-leg gauntlet loop for Indigo tier 9) → `awardGymWin()` on a win — silently, with no per-instance DOM/log calls, consistent with offline processing's existing batched-summary design.
- **v0.29 scope change:** this offline path now applies only to (a) regular gyms 1–8 whose badge is already earned, any tier, and (b) **Indigo Plateau tier 10**, once the Champion badge is earned — matching the mission-modal gating above. It does **not** apply to unbadged regular gyms (never offered as a method) or to **Indigo Plateau tier 9** under any circumstance — tier 9 is always watched-only, no exceptions, regardless of badge status. The engine call itself is unchanged from v0.26/v0.28; only eligibility to reach it changed.
- New offline summary fields: `gymWins`, `gymLosses`, `badgesEarned` — surfaced in the existing offline-return summary banner alongside encounters/catches/wins/income/heals/shinies. **As of v0.29, `badgesEarned` from this path is always 0** — since this path is only reachable post-badge (and tier 9 is excluded entirely), `awardGymWin()`'s "already earned" guard means it never grants a new badge, only TM/reward grants and tier-progression tracking.
- **Repeat-win tier progression requires no new logic** — `awardGymWin()` already gates badge/TM grants to first-win-only and only advances `gymProgress` when `getForcedTier()` rises (which only happens via a genuinely new badge), so repeated offline wins at an already-cleared gym behave identically to live: no further badge, no further TM, no tier change.
- A loss during offline catch-up has no penalty (matches live) and the loop continues to the next cycle.
- If an offline gym result leaves the party fully wiped, it flows into the existing offline wipe/heal-relocate handling (see "Offline Wipe & Auto-Repeat") with no separate wipe-handling logic needed.

### SAVE_VERSION — v0.29
- **No bump required.** Badges and `aide.gymProgress` already exist as of v0.25/SAVE_VERSION 17. The v0.29 team-order prompt and battle playback are transient UI state only — nothing new persists across app close, since a watched battle is atomic once triggered (blocking flow, no leave-mid-battle).

---

## Onboarding — New Player Preamble Modal (SETTLED — v0.27, NEW)

- Triggers exactly once: only when `!hasSave` on boot (i.e. a brand-new save is being created), using the existing boot logic. No new `state` field, no SAVE_VERSION impact.
- Full-screen modal, dismissed by clicking through — matches the existing modal visual pattern used elsewhere in the game.
- Copy (final):
  > Welcome to PokeProf where you are a budding professor, looking to research Pokemon and compile your findings into your very own Pokedex.
  >
  > You are in full control of your aides' movements, though they will research for you around the clock whether you have the game open or not. They will keep researching the same area until you direct them to move to a new location.
  >
  > If you would like to learn more about any aspects of the game, press the "Info" button in the bottom right of the screen.

---

## Info Menu (SETTLED — v0.27, NEW)

- New "Info" button, fixed bottom-right, **visible on the Party tab only** (not Log/Dex/Map).
- Opens a 2-level flow styled like the existing Mission Behavior selector:
  - **Level 1:** a list of 9 topic tiles — titles only, no numbers: Objectives, Playable Characters, Dex Completion, Cash Generation, Level Caps, Time, Battles, Map, Wild Encounters.
  - **Level 2:** clicking a topic opens one scrollable text page for that topic. Sub-items from the source copy (e.g. "Moves" under Battles, "Evolution" under Dex Completion) render as **in-page bold headers** with their text underneath — not additional clickable tiles. A Back button returns to the topic list.
- No `state` changes — this is UI/content only, no SAVE_VERSION impact.
- All copy was verified against the actual live game constants before being locked in: shiny rate 1/4096, income formula ($1.00/min base + $0.01 per 100 catches), level cap formula (`10 + badges×10`, 100 post-Champion), and tick intervals (10s open / 30s closed) all match code exactly.
- Full topic copy lives in the v0.27 change-request thread / commit message — not duplicated here to avoid drift between two copies of the same text; treat the in-code strings as canonical once implemented.

### Battles Topic — Copy Correction (SETTLED — v0.30)
- The "Battles" topic's first line — *"Wild encounters are simplified and solely based
  on level, no moves or type advantages"* — is now false as of v0.30 (see "Combat
  System") and is replaced with: *"Wild encounters now use the same battle engine as
  trainer fights — type matchups, moves, and catch odds based on the wild Pokémon's
  remaining HP all come into play."*
- The rest of the Battles topic (trainer-fight description, the "Moves" sub-header)
  remains accurate as-is and is unchanged.

---

## Theming System (SETTLED — v0.35, NEW)

- **Motivation:** the game's entire color scheme was 262 hardcoded hex instances (88 in the static `<style>` block, 174 scattered through JS-generated inline `style="..."` attributes) with zero CSS custom properties anywhere in the file. This section replaces that with a small set of CSS variables driving the whole visual identity, plus a player-facing picker.

### Token Model — Main + Accent
- **Two tokens, not three.** An earlier draft included a separate "Text" seed; it was folded entirely into Main — a single hue, ramped from darkest (backgrounds) to lightest (primary text), rather than three independently-picked colors.
- **Main** (1 seed color) → 4 derived values via one lightness ramp on the same hue:
  - `bg` — page/panel background (darkest)
  - `card` — card/tab-bar/button background
  - `border` — card/button/tab-bar borders
  - `text` — all text. Text *hierarchy* (primary names vs. secondary labels vs. tertiary captions like Level text or research-tested captions) is achieved via CSS `opacity` on this single value, not additional derived hues.
  - **Black seed:** gets its own floor approaching true `0%` lightness (not the ~8% floor shared by hue-based colors, which read as "dark gray" rather than black) — `bg` reaches `0%`, with `card`/`border` compressed tightly above it (`0/3/6/10` lightness steps) so the chrome reads as authentically black against a true-black anchor.
  - **White seed:** ramp direction flips (light-mode) — `bg` becomes the lightest value, `text` the darkest, rather than extending the dark-mode ramp further.
  - **Warm/yellow hues (30°–70°):** saturation is tapered on the background/card/border steps specifically — a fully saturated dark yellow is physically mustard/olive, not "dark yellow"; tapering keeps those steps a clean warm dark neutral instead of muddy sludge. The swatch preview itself also uses a per-color tuned preview lightness rather than one flat value across all 20 colors, since yellow needs to preview much brighter than e.g. blue or red to read as "yellow" at all.
- **Accent** (1 seed color) → 3 derived values: `dark` (pressed/active-state background, mirrors the existing `button:active` pattern already used in the real game, e.g. `button.danger:active`), `base`, `light`.
  - **Scope — Accent covers, and only covers:** header title + header border, active-tab underline, aide name, Battle Gym button, all modal titles/borders (Pokémon detail modal, Day Care modal, Welcome modal, and the Destination/Mission modal — currently inconsistently red vs. light-blue across these; unified under Accent), and the map's selected-location highlight ring (currently hardcoded gold `#f4d03f`, moves to Accent).
  - Everything else that currently reads as "interactive-ish" but isn't brand/critical — informational captions, Level text, research-tested text — pulls from Main's `text` (at reduced opacity), not Accent.

### Fixed Constants (never theme-driven)
The following stay hardcoded regardless of theme choice, for the same legibility reasons as the existing HP-bar-state convention:
- `TYPE_COLORS` (the 18-entry type-chart map)
- HP bar states (high/mid/low)
- Success-green (primary/positive actions)
- Currency-gold
- Log-category colors (catch/evolve/damage/etc.)
- **v0.35 addition:** all warning/error states — fainted-Pokémon border, save-indicator error state, "Database not loaded" messages, "Need 1 TM" warnings, gym-battle-lost text. These previously reused the same red hex as the (now theme-driven) Accent color; consolidated onto the existing danger constant (`#e74c3c`, already used for damage-log/low-HP) so they read consistently as "something's wrong" independent of the player's theme.

### Presets & Picker UI
- **20-color preset grid**, shared list for both Main and Accent: Red, Orange, Amber, Yellow, Lime, Green, Teal, Cyan, Sky Blue, Blue, Indigo, Purple, Violet, Magenta, Pink, Rose, Brown, Gray, Black, White.
- **Plus a custom color picker** alongside the grid, for unlimited freedom beyond the curated 20 — the grid is for fast/scannable browsing, the custom picker is the escape valve for anyone who wants an exact color.
- Black and White are included in the shipped set (not just a derivation-testing aid) — both use the special-cased ramp handling described above.
- **UI location:** inside the existing Info button/modal (see "Info Menu" above), new "Display" section.
- **Persistence:** device-local, **outside the save file** — a deliberate choice since this is a purely cosmetic, no-gameplay-impact preference. Consequence: the theme choice does not travel with an exported/imported save to a different browser/device (progress is unaffected, only the color scheme resets to default there). No SAVE_VERSION impact.
- **Default ("Classic") values:** Main = Blue, Accent = Red — chosen to most closely match the pre-v0.35 look, though not pixel-identical (the pre-v0.35 game used both red *and* light-blue as brand/interactive colors across different elements; Accent now unifies those under one seed).

---

## Shop UI (SETTLED — v0.27, NEW)

### Category Condensing (full-tier shops only)
- Applies **only** to `shopTier: "full"` locations (currently Celadon City, 58 purchasable items). `basic`- and `lab`-tier shops (4 and 1 items respectively) remain flat lists — not worth condensing.
- Full-tier shop UI becomes a 2-level flow: category tiles → item list within the selected category, reusing the existing item-row/buy-button UI unchanged. A Back button returns from the item list to the category tiles.
- Category mapping, by each item's `itemCategory`:
  - **Evolution Items** — `evolutionItem` (38 items)
  - **Key Items** — `keyItem` + `hm` + `rod` + `tool` (4+6+3+2 = 15 items)
  - **Consumables** — `ball` + `consumable` + `tm` (2+2+1 = 5 items)
- This is purely a shop-tier-scoped UI reorganization — no changes to `buyItem()`, pricing, or stock logic.

### Purchase Quantity Buttons (SETTLED — v0.27)
- Global change: every shop's buy buttons go from ×1 / ×10 / ×100 to **×1 / ×100 / ×1000**.
- Applies to every shop regardless of tier — same `buyItem(itemId, qty)` call as before, which already clamps to the max affordable quantity. No logic changes required, button-value-only.

### Known Issue — `shopTier` String Comparison (PENDING FIX, discovered v0.27, not in scope)
- `getShopItems()` filters items with `i.shopTier<=loc.shopTier`, comparing tier values as **strings**, not by rank. Since `"basic"<="full"` is true lexicographically, a `full`-tier location's shop actually shows the union of `basic`-tier and `full`-tier items combined — not just its own tier, and `lab`-tier items are similarly excluded from `full` shops via the same string-ordering accident rather than deliberate rank logic.
- Concretely: Celadon City's category-condensed shop (see above) currently also surfaces Poké Balls, Potions, Revives, and TMs — all `basic`-tier — folded in alongside the intended `full`-tier catalog, because of this comparison, not because of the v0.27 category design itself.
- **Deliberately left unfixed in v0.27** — out of scope for the shop condensing change; flagged here for a future pass. Fix would replace the string comparison with an explicit rank map (`{basic:1, full:2, lab:3}` or similar).

---

## Gym TM Rewards — Tiered Scaling (SETTLED — v0.31, revised)

- First badge win (regular gyms, tier 1–8): awards `tier+4` TMs (5 at tier 1, up to 12 at tier 8), replacing the previous flat 1 TM.
- Rematch win (badge already held — live re-tap of "Battle Gym," or the offline/mission-modal grind path): awards flat 1 TM. Previously 0 (the award function returned early once the badge was already held).
- Indigo Plateau (gauntlet, tier 9/10): unchanged, 0 TM always.
- Applies identically to `awardGymWin()` (live) and `awardGymWinSilent()` (offline simulation).

---

## Individual Values (IVs) + Natures + Cached Per-Individual Stats (SETTLED — v0.31, NEW)

### Data Model
- `p.ivs = {hp,atk,def,spatk,spdef,spd}`, 0–31 each (standard mainline range).
- `p.nature` (string) — full standard 25-nature table (5 neutral, 20 that boost one stat +10%/reduce another −10%; nature never affects HP).
- `p.stats = {atk,def,spatk,spdef,spd}` — cached computed stats. HP remains represented by the existing `p.maxHP` field, not duplicated into `p.stats`.
- Both `p.ivs` and `p.nature` are rolled once, at individual creation, inside `makePokemon()` — covers every new individual (wild catch, egg hatch, starter) at a single choke point.

### Roll Timing (SETTLED)
IVs/Nature are rolled at the moment of capture/hatch/creation — **not** when a wild encounter first appears. Wild encounters are ephemeral (`enc` objects, no persisted identity) until a catch succeeds; a failed catch or flee never generated IVs to begin with.

### Dex-Complete IV Advantage Roll (SETTLED — v0.31, NEW)
- `rollIVs(dexId)` checks `isDexPageComplete(dexId)` (existing helper) at creation time. If that species' dex page is complete, each of the 6 IV stats is rolled **10× and the best kept**, instead of a single roll.
- Checked fresh at every creation — a species completed mid-game benefits immediately on its next catch. No retroactive reroll for individuals caught before completion.
- 🔬 icon added to the Pokédex grid cell (species overview) for any species where `isDexPageComplete(dexId)` is true. Species-level only — not applied to per-individual displays. **Resolves "Per-species dex completion tracking UI" from Future Goals** (partial — grid icon only, no dedicated tracking screen).

### Stat Calculation
- `calcStat(base, level, iv=0)` → `floor((2×base+iv)×level/100)+5`, then × nature modifier (1.1/0.9) if that stat is nature-boosted/-reduced, floored again.
- `calcMaxHP(sp, lv, dexId, iv=0)` → `floor((2×base+iv)×level/100)+level+10`. Nature never applies to HP.
- Default `iv=0` param means any call site that doesn't pass one is byte-identical to pre-v0.31 output — zero regression for `calcBST()`'s species-reference usage (`entry.bst`, unaffected) and `makeWildBattler()` (ephemeral pre-catch display).
- New central helper `recalcStats(p)` computes `p.maxHP` and `p.stats` together, called at every existing `maxHP`-recalculation site: creation, level-up, evolution (`applySpeciesSwap`), migration.

### Battle System (SETTLED)
- `calcBattleDamage()`/`getBattleSpeed()` read `attacker.stats.atk/.spatk`, `defender.stats.def/.spdef`, `p.stats.spd` directly — no IV/nature/formula logic inside battle functions themselves.
- Player-team battle copies (`runOneGymBattle`/`runOneGymBattleSilent`) carry `stats:p.stats` through, same as `maxHP` already does.
- Enemy trainer teams (`buildEnemyTeam`, rebuilt fresh each battle, never persisted) get flat IVs by tier: tiers 1–8 → IV 20, tier 9 (Elite Four/Champion first clear) → IV 25, tier 10 (any postgame rematch) → IV 31. All stats, no nature (neutral).

### Tyrogue Evolution Fix (SETTLED — v0.31)
- **Root cause:** Tyrogue's flat `pokedex.js` fields (`evolveMethod:"level", evolveLevel:20, evolvesIntoId:106`) were checked and auto-applied by `checkEvolution()`'s Path 1 *before* the branching `EVO_TREE` entries (Hitmonlee/Hitmonchan/Hitmontop, all previously `evolveMethod:"unknown"`) were ever reached — every Tyrogue evolved into Hitmonlee, unconditionally. Hitmonchan/Hitmontop were unreachable.
- **Data fix (Jack's Excel task):** `Pokedex` sheet, Tyrogue row — `evolvesIntoId`/`evolveMethod`/`evolveLevel` cleared to blank. `EvoTree` sheet, all 3 Tyrogue branch rows — `evolveMethod` set to `level`, `evolveLevel` set to `20`.
- **Code fix:** at level 20, `checkEvolution()` special-cases dexId 236 — compares already-recomputed `p.stats.atk` vs `p.stats.def` (IV + nature both baked in): Atk>Def→Hitmonlee(106), Def>Atk→Hitmonchan(107), tie→Hitmontop(237). Intercepts before the generic (dormant, previously unexercised by any other species) random-among-qualifying-branches fallback.
- Pokédex "Evolution Methods Tested" list stays unspoiled — shows generic "Level Lv20" for all 3 branches (driven by the `EvoTree` fields, unchanged).
- Evolution Chain diagram (`evoMethodLabel()`) gets a Tyrogue-specific arrow-label override: "Lv20 · A>D" → Hitmonlee, "Lv20 · D>A" → Hitmonchan, "Lv20 · A=D" → Hitmontop, replacing three otherwise-identical "Lv 20" labels.

### Dex List "BST" (SETTLED)
- `calcBST()` updated to sum `p.maxHP + p.stats.atk+def+spatk+spdef+spd` for a real individual — both call sites (display, sort-by-total comparator) now pass the actual Pokémon object instead of bare species+level, so it correctly reflects that individual's IV/nature, not just species+level.
- Unrelated to `entry.bst` (the static species-reference field on the Species Detail page), which is untouched.

### Pokémon Detail Modal Redesign (SETTLED — v0.31)
- Header: unchanged (dex#, nickname/species, catch #).
- Level/Gender — one line.
- Type — image badges (`typeBadge()`, matching the Species Detail page), not text.
- **Ability/Nature — one line** (moved up from separate lines).
- **Friendship — bumps down to its own line.**
- Height/Weight — one line.
- New stat table: columns HP/ATK/DEF/SATK/SDEF/SPD, with an IV row and a Current Stat row beneath, plain numbers (no colored bars). IV row shows a `+`/`−` marker on whichever stat that individual's nature boosts/reduces.
- Existing "HP: current/max" line (battle-injury status) is **kept**, separate from the table's HP column (full/max stat).
- Holder, nickname input, Block Evolution, moves, action buttons — unchanged.

### Perfect-IV / Shiny+Perfect Badges (SETTLED — v0.31, NEW)
- New helper `isPerfectIV(p)` — all 6 IV stats at 31.
- New helper `getRarityBadge(p)`: Shiny+Perfect → 🦄, Perfect only → 💥, Shiny only → ✨ (unchanged), neither → nothing.
- Applied **only** at true per-individual displays: party card, `showPokemonDetail` modal (including its standalone status line, now "💥 PERFECT IV" / "🦄 SHINY + PERFECT IV" as appropriate), Day Care parent-picker rows, both Dex list entry variants.
- **Not** applied to species-level aggregate indicators (evolution chain nodes, Pokédex grid, Species Detail header) — those stay shiny-only via `hasLiveShiny(dexId)`, unchanged.

### Perfect-IV Species-Cap Exemption (SETTLED — v0.31, NEW)
- `checkSpeciesCap()`'s auto-release-on-catch-overflow check extended from `if(caught.isShiny) return;` to also exempt `isPerfectIV(caught)` — mirrors existing shiny behavior exactly.
- The manual cap-lowering sweep (`onSpeciesCapChange`) gets the same exemption — perfect-IV individuals excluded from the release-eligible pool alongside shinies, regardless of how low the cap is set.

### SAVE_VERSION — v0.31 (19 → 20)
- Migration: every existing party/dex Pokémon gets `ivs` and `nature` rolled retroactively (single roll, not the 10× dex-complete advantage — that only applies going forward at creation time), then `recalcStats()` is run. `currentHP` is set to the new `maxHP` (full heal) since `maxHP` shifts as a result of the newly-applied IV/nature.

---

## Nickname-Triggered Evolution Branches (SETTLED — v0.31, NEW)

- New `EvoTree` column `evolveNickname` (blank for most rows) — fully generic, species-agnostic. No dexId is ever referenced in this logic; it applies to any branch a nickname trigger is set on, present or future.
- `checkEvolution()`'s branch-selection logic: for any branch, if `evolveNickname` is set and is a **substring** of `p.nickname` (case-insensitive, trimmed) **and** that branch's normal condition is also met, it wins immediately — bypasses the random-among-qualifying-branches fallback entirely.
- If no branch's nickname trigger matches, falls through unchanged to the existing random fallback.
- New "Evolution Secrets" entry added to the in-game Info menu (`INFO_TOPICS`) — general hint that nicknames can lock in certain evolutions, without spoiling species or exact trigger words.
- Jack's data task (any time, no code changes required): populate `evolveNickname` on whichever `EvoTree` rows desired — Koffing/Galarian Weezing and Espeon/Umbreon are the known first candidates, not a hardcoded list.

---

## Raichu / Alolan Raichu — Player-Choice Item Evolution (SUPERSEDED v0.33 — see "Same-DexId Branching Form Evolutions" below)

- **v0.31 fix (kept for history):** `professorAutoTestEvolutions()` checks **all** matching branches for an item+species pair (`.filter()` instead of `.find()`), confirming every match into `confirmedBranches`. Any branch with a non-null `toFormName` was intended to confirm but never auto-apply, leaving it for a manual "🔬 Evolve" choice.
- **What v0.31 actually missed (found v0.33):** `confirmedBranches`'s duplicate-guard compared only `{method, intoId}` — and Kantonian/Alolan Raichu share the same `intoId` (26) and the same `method` (Thunder Stone), since only `toFormName` distinguishes them. The guard treated the second branch as an "already confirmed" duplicate of the first and silently dropped it — so the Alolan branch's manual evolve button never actually appeared, and the Family Card's chain visual (which also dropped `toFormName` when building its edges) rendered two indistinguishable, colliding boxes for the same target instead of two distinct branches. See below for the full fix.

---

## Same-DexId Branching Form Evolutions (SETTLED — v0.33, NEW, supersedes v0.31 Raichu section above)

### Scope
Any species where two `EVO_TREE` branches share a `toDexId` but differ by `toFormName` — confirmed affected: Raichu (Kantonian/Alolan, Thunder Stone), Sandshrew→Sandslash (Kantonian/Alolan, Leaf Stone), Marowak (Kantonian level-up/Alolan friendship-night), Weezing (Kantonian level-up/Galarian level-up). Fixed at the mechanism level — no per-species special-casing, applies automatically to any future dual-form branch pair too.

### Root Cause (three compounding gaps, all keyed on dexId alone)
1. **`confirmedBranches` duplicate-guard** compared only `{method, intoId}` — form-variant branches sharing both collided into one stored entry, silently dropping the second.
2. **Evolution Chain Visual edge construction** dropped `toFormName` entirely when building edges, so two structurally different branches became indistinguishable duplicate edges pointing at one node — rendered as doubled/colliding boxes.
3. **`getPokemonEntry(dexId)`** always resolved to the `formName: null` row — there was no way to fetch a specific alternate-form row at all, so even a correctly-confirmed Alolan branch would apply the Kantonian entry's data.
4. **Individual Pokémon never tracked form.** `applySpeciesSwap()` wrote `species`/`pokedexId` only — an evolved Alolan Raichu was indistinguishable from a regular one in every downstream read (stats, sprite, display name).

### Fix
- **New persisted field:** `p.formName` (string or `null`) on every Pokémon object, written by `applySpeciesSwap()` alongside `species`/`pokedexId`.
- **`getPokemonEntry(dexId, formName)`** — new optional second parameter fetches a specific form row; calls omitting it keep existing behavior (prefer `formName: null`).
- **`recordEvolution(fromDexId, toDexId, method, level, toFormName)`** — new 5th parameter. `confirmedBranches` entries become `{method, intoId, toFormName}` (see "Research State per Species" above); duplicate-guard now compares all three fields, so same-`intoId`/different-`toFormName` branches confirm independently.
- **`professorAutoTestEvolutions()`'s branch loop** passes `b.toFormName` through to `recordEvolution()`.
- **`applyItemEvolution(catchId, intoId, toFormName)`** — new 3rd param (see "Manual Evolution Trigger" above); resolves via `getPokemonEntry(intoId, toFormName)` so the correct specific form is applied, not always the base form.
- **`recalcStats()`** uses `getPokemonEntry(p.pokedexId, p.formName)` so base stats reflect the individual's actual form.
- **`getSpriteUrl()`** gains a `formName` parameter, threaded from every live-Pokémon call site (`p.formName`), so form-specific sprites resolve.
- **`getDisplayName(p)`** — for un-nicknamed Pokémon, appends the form when present: `"Raichu (Alolan)"` instead of `"Raichu"`. Nicknamed individuals are unaffected (nickname still takes priority, unchanged).
- **`SPECIES{}` name-keyed dict fix:** since form variants share the same `name` string (both are literally `"Raichu"`), the existing name-only key collides for them — this is the same class of collision already documented under "Species Identity — Always Use dexId" for Nidoran♂/♀, now confirmed to also apply to any same-name form pair. Fix: build a second, form-aware key (`name + '|' + (formName||'')`) alongside the existing name-only entry. The three fallback read sites (`renderParty()`'s growth-rate lookup; the two `getPokemonEntry(dexId)||SPECIES[p.species]` stat/speed fallbacks) build the compound key from the live Pokémon's `species`/`formName` when falling back from `getPokemonEntry()`. This gap was latent and harmless prior to v0.33 — no save could contain an alt-form individual before this fix existed to let one be created — but v0.33 is exactly what makes it reachable, so it ships in the same pass.
- **Evolution Chain Visual:** edges preserve `toFormName`; same-`toDexId`/different-`toFormName` branches render as separate side-by-side boxes, each labeled with its form (e.g. "Raichu" / "Raichu (Alolan)"), instead of colliding into duplicate nodes.

### SAVE_VERSION 21 Migration
- Backfill `p.formName = null` for every existing individual in `state.party`/`state.dex` — accurate for every pre-v0.33 save, since no alt-form branch could ever actually be applied before this fix existed.
- See "Professor Auto-Test Loop" above for the accompanying `confirmedBranches` reset migration (folded into the same SAVE_VERSION 21 pass, not a separate bump).

---

## Bug Fixes (SETTLED — v0.31)

- **`baseExp` NaN landmine** — live-combat EXP calc (lines 2218, 2418) contained `s_?s_.baseExpYield||s_.baseExp:51`, which by operator precedence evaluates as `(s_.baseExpYield||s_.baseExp):51` — since `baseExp` never exists as a field in `pokedex.js` (only `baseExpYield` does), any species with a falsy `baseExpYield` (confirmed real: Mega Venusaur, dexId 3, `baseExpYield:null`) produced `NaN` EXP instead of the intended `51` default. Fixed to `(s_?.baseExpYield||51)`, matching the already-correct offline-path pattern (line 1921). Live and offline EXP math had quietly diverged; now consistent.
- **Removed "Professor:" label** from the party-page inventory summary line (`renderBagDisplay()`) — shows just Balls/TMs/Potions/Revives.

---

## Cheat Codes — AdminMode, TurboMode (SETTLED — v0.32, revised v0.33)

- Purely live-derived, nothing persisted, no SAVE_VERSION impact — matches the v0.23 shiny-badge pattern (reflects current state only, no cached flag).
- Both cheats key on `p.id===1` — the literal first-ever catch, by permanent catch-order identity, never touched by evolution (`applySpeciesSwap()` only ever writes `species`/`pokedexId`/`formName`, never `id`) — checked against the **full `state.dex`** (every ever-owned individual, not just the active party — a boxed Catch #1 still activates either cheat), plus a nickname match (trimmed/lowercased).
- **Bug (found v0.33) — AdminMode not evolution-proof:** `isAdminModeActive()` additionally required `pokedexId===19` (Rattata). Since `id` is permanent but `pokedexId` changes on evolution, AdminMode would silently stop working the moment Catch #1 evolved into Raticate — species identity was being used where catch-order identity was the actual intent. **Fix (v0.33):** the `pokedexId===19` check is removed entirely; `isAdminModeActive()` now checks `id===1` and the nickname only, identical in structure to TurboMode below.
- `isAdminModeActive()`: true if any individual in `state.dex` has `id===1` and nickname (trimmed/lowercased) equals `"adminmode"`.
  - `buyItem()`: when active, price is treated as `$0` for all shop purchases (both `professorBag` and `trainerBag` items) — funds check skipped entirely, full requested quantity granted, `state.funds` untouched.
  - Shop display shows `$0 ea` per item while active, for visible confirmation the cheat is live.
- **`isTurboModeActive()` (v0.33, NEW):** true if any individual in `state.dex` has `id===1` and nickname (trimmed/lowercased) equals `"turbomode"`.
  - New helper `getEncounterInterval(isOpen)` returns `1` when active, else the normal `ENC_INTERVAL_OPEN`/`ENC_INTERVAL_CLOSED`. Every site that sets `state.nextEncounterIn` — live `gameTick()`, mission-modal resets, initial party-member creation, and `processOfflineTime()`'s catch-up loop — reads through this helper instead of the raw constants. Both the open (10s) and closed/offline (30s) intervals drop to 1s.
  - **Offline catch-up safety cap:** `processOfflineTime()`'s `while(remaining>=nextIn)` loop gets a hard cap (2,000 iterations). If a long offline gap is processed while TurboMode is active, remaining offline time past the cap stops simulating individual encounters — funds/friendship still accrue from `secsAway` directly, unaffected, only encounter-by-encounter simulation stops. Prevents a real freeze/hang on reopen.
- Either cheat deactivates immediately (next check) if its nickname is changed or Catch #1 is released — no extra logic needed since nothing is cached; this is the intended "removing the nickname stops the mode" behavior, achieved for free by being purely derived.
- Precedent-setting pattern for future cheat codes via nickname parsing (see "Things That Are Future Goals").

---

## Bug Fixes (SETTLED — v0.32)

- **🐾 emoji removed** from non-fainted party screen entries — `(fainted?'💀':'🐾')+' '` → `(fainted?'💀 ':'')`. Fainted Pokémon still show 💀 before the name; non-fainted Pokémon show just the name.
- **Shiny sprites not rendering in the battle modal** — `renderBattleFrame()` hardcoded `getSpriteUrl(..., false)` for both the enemy and player sprite, ignoring `isShiny` entirely (every other sprite call site in the file — party screen, Dex screen, evolution screen — already passed it correctly). Additionally, `playerSnapshot` (built in `runWatchedBattleLeg()`) never carried `p.isShiny` over from the real party object at all, so even fixing the call sites alone wouldn't have worked. Fixed both: the snapshot mapping now includes `isShiny:p.isShiny||false`, and both `getSpriteUrl()` calls in `renderBattleFrame()` now pass it through. `getSpriteUrl()` itself required no change — its shiny branch was already correct (`spriteUrl` is `null` for every entry in `pokedex.js`, so it always falls through to the shiny-aware path).

---

## Bug Fixes (SETTLED — v0.34)

- **Log Tab reversed sort** — `renderLogPanel()` called `[...source].reverse()` before appending, but `state.log`/`state.significantLog` are already newest-first (built via `.unshift()`). Full Tab masked this since frequent ticks self-corrected within moments via the live-update path; Condensed Tab (rare significant events) stayed visibly backwards for long stretches. Fixed by removing the `.reverse()`.
- **Poke-modal title duplicated form label** — the title concatenated `getDisplayName(p)` (already appends `(formName)` for un-nicknamed form-variant individuals as of v0.33) with a second, redundant `(p.formName)` append, producing e.g. "Raichu (Alolan) (Alolan)". Fixed by removing the redundant append; the nicknamed-individual case's parenthetical species reference is now form-aware too (`(Raichu (Alolan))`) rather than silently dropping form context.
- **`showPokemonDetail()` wrong-form type/height/weight** — the modal's reference `entry` was fetched via `getPokemonEntry(p.pokedexId)` with no `formName` argument, so type badges, height, and weight always showed the base form's data even for a form-variant individual, despite the stat table (fetched correctly elsewhere in the same function) reflecting true form-specific base stats. Fixed by passing `p.formName` through, matching every other v0.33 form-aware call site.

---

## Things That Are Future Goals (Do Not Implement Yet)

- ~~Manual/interactive trainer battle mode~~ — **resolved v0.29** (playback variant chosen — see "Watched Gym Battle — Aide Card Trigger"; true player-controlled move selection remains undone/not implemented).
- Gauntlet-style sub-trainers within regular gyms (mainline-game precedent) — deferred from v0.25.
- Trainer innate abilities / type affinities
- New trainer recruitment mechanics
- Item selling UI
- Shinydex completion tracking UI
- ~~Per-species dex completion tracking UI~~ — **partially resolved v0.31** (🔬 grid icon only on the Pokédex overview; no dedicated tracking screen).
- Distribution charts for height/weight on species detail page
- `swarm` encounter method — future-proofing only; mechanic undefined (possible time/rotation-based active swarm). Not implemented.
- `honey` encounter method — future-proofing only; would require `requiresItem: honey`-type item placed on a tree, possibly with a wait/return timer. Not implemented.

---

## Outstanding Data Tasks (Jack's side — spreadsheet, not code)

- **~~18 evolution items missing from Items sheet~~ — resolved, verified v0.28.** All 18 (Protector, Dragon Scale, Electirizer, Magmarizer, Up Grade, Razor Fang, Razor Claw, Peat Block, Dubious Disc, Reaper Cloth, Deep Sea Tooth, Sachet, Whipped Dream, Tart Apple, Cracked Pot, Metal Alloy, Auspicious Armor, Unremarkable Teacup) confirmed present in `items.js` with correct slugs, `evolutionItem` category, and correctly wired via the existing name-matching convention (`entry.evolveItem===itemName`, same pattern as Water Stone/Fire Stone).
- **2 blank-`evolveItem` `use-item` rows** in the single-target Pokédex columns, identified as Kubfu and Dipplin. Confirmed harmless via code trace — Path 1 failing silently falls through to Path 2 (EVO_TREE), so this only matters if their EVO_TREE rows are *also* incomplete. Worth a quick check on Jack's end, not urgent.
- **~~4 orphaned items~~ — corrected v0.33.** King's Rock and Black Augurite were previously listed here as orphaned/unreferenced; confirmed via v0.33 audit that both are in fact wired into `evotree.js` (King's Rock: Poliwhirl→Politoed, Slowpoke→Slowking; Black Augurite: Scyther→Kleavor) — this note was simply never updated after they were wired up. **Still genuinely orphaned:** Scroll of Darkness, Scroll of Waters — purchasable, `effect: evolve-stone`/`evolve-trade`, but no species references them yet. **Newly identified as orphaned (v0.33 audit, found via the `EVOLUTION_METHODS` auto-derive fix):** Sweet Treat, Leader's Crest, Prism Scale, Magmarizer — same status, purchasable and correctly tagged but not yet referenced by any `EvoTree`/Pokédex row. All six now correctly appear in the live-derived `EVOLUTION_METHODS` list (see "Evolution Method Enum") and will show as ruled-out (not confirmed) for every species until Jack wires an actual branch to one of them.
- **~~Duplicate `poke-ball` entry~~ — resolved v0.31.** Removed directly from `items.js` by Jack (second row had `shopTier:"lab"`, a tier no location used — was dormant, not actively harmful, but would have resurfaced as a duplicate shop listing the moment the `shopTier` string-comparison issue below got fixed or a `lab`-tier location was added).
- **`formVariant` column** — every row is `null` except dexId 555 (Darmanitan), which has `formVariant:1`. Field is unreferenced anywhere in `pokeprof.html`. Not pruning yet — worth checking whether this is a breadcrumb of an intended Standard/Zen form-variant system before treating it as pure cruft. Tabled, no urgency.
