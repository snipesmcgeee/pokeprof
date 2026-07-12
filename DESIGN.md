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

### Encounter Timing (SETTLED)
- One encounter cycle = 30 seconds (30 ticks)
- `ENC_INTERVAL = 30`

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

### Mission Modal — Destination Sorting (SETTLED — v0.21)
- Three sort buttons appear above the destination list: **Distance**, **Alphabetical**, **Encounters**
- **Distance** = sum of `travelTime` for every waypoint in `buildTravelPath(currentLoc, destId)` **strictly before** the destination itself — i.e. it excludes the destination's own `travelTime`, consistent with the settled `travelTime` rule above (a destination's own travel time never delays arrival there). A one-hop destination sorts as distance `0`.
- **Alphabetical** = location display name, A–Z
- **Encounters** = sightings (`seen`) count summed across all species logged at that location, from `state.locationEncounterLog[locId]` — locations never visited sort as `0`
- First click on any of the three buttons sorts **ascending** (Distance: nearest first; Alphabetical: A–Z; Encounters: fewest first). A second click on the **same** button reverses to descending. Clicking a **different** button resets to ascending for the new criterion.
- Sort state is transient UI-only — not persisted to `state`, not saved. The list has no default sort order when the modal opens; it resets each time.
- No SAVE_VERSION bump (no schema change).

### Pathfinding Bug (PENDING FIX — v0.19)
- `buildTravelPath()` currently does its own BFS over all `CONNECTIONS_DATA` **without** filtering to `state.discoveredLocations`. This allows paths to route through undiscovered locations as waypoints (e.g. routing Pewter→Cerulean through Diglett's Cave South before that cave has been discovered).
- Fix: `buildTravelPath()` must restrict its BFS traversal to nodes in `state.discoveredLocations`, consistent with how `getReachableDiscoveredLocations()` already works. Since `showMissionModal()` already filters destinations to `getReachableDiscoveredLocations()`, the fix in `buildTravelPath()` is a defensive guard — but it is required to prevent undiscovered waypoints.

### Wipe & Return (SETTLED)
- If all party Pokémon faint, the aide returns to **`state.lastHealLocation`** — the most recent location with `heals: true` they passed through
- `lastHealLocation` is updated **only** in `arriveAtLocation()` when the location has `heals: true` — it is never set at mission start or anywhere else
- On recall, the aide also returns to `state.lastHealLocation`
- Auto-heal occurs automatically on arrival at any healing location

### Offline Heal-Check Parity (SETTLED — v0.22)
- **Bug:** `checkLocationHeal()` (full-party heal when standing at a `heals:true` location) is called every encounter cycle in live `gameTick()`, but was never called anywhere inside `processOfflineTime()`. Missions dwelling in or passing through a healing city took real, un-healed damage offline that they wouldn't take live.
- **Fix:** `processOfflineTime()`'s simulated-encounter loop now runs the same heal-check before each simulated encounter, mirroring live order exactly.
- **No per-encounter log spam offline** (consistent with offline processing's existing batched-summary design) — heals are tallied silently as `summary.heals`, shown in the existing offline-return summary banner alongside encounters/catches/wins/income.

---

## Mission System (SETTLED)

- A mission ends when all party Pokémon faint, or when the player manually recalls
- Both paths go through a unified `endMission(reason)` function — `reason` is `'recall'` or `'faint'`
- `endMission()` always calls `showFindingsReport()` — including in the auto-repeat path
- **Auto-repeat**: if enabled, the aide immediately re-runs the same mission after a wipe
- Party order: Pokémon with the **lowest level leads**; fainted Pokémon go to the back; ties broken by inertia
- Party re-sort happens at `getLeadPokemon()` call and at the start of every new mission via `confirmMission()`
- Pokémon cannot be reassigned during an active mission

### Offline Wipe & Auto-Repeat (SETTLED — v0.20 fix)
- **Bug (pre-v0.20):** `processOfflineTime()`'s catch-up loop unconditionally `break`s the moment `getLeadPokemon()` returns `null` (full party wipe), regardless of `state.autoRepeat`. This silently abandons the rest of the away period — a wipe early in a long offline stretch means zero further encounters are simulated, even with auto-repeat on.
- **Fix:** on a wipe during offline simulation, branch on `state.autoRepeat`:
  - **`true`**: heal the party at `state.lastHealLocation`, rebuild `state.travelPath` from `lastHealLocation` → the mission destination, reset `travelPathIndex` to 0, set `currentLocation` to `lastHealLocation`, and continue the loop — mirrors live `endMission()`'s auto-repeat path exactly, with no time cost for the heal/redispatch itself (matches live behavior)
  - **`false`**: unchanged — mission ends, `missionActive` set false, remaining offline seconds are not simulated
- No repeat cap needed — the outer `while(remaining>=nextIn)` loop is already bounded by `secsAway`, so each wipe cycle still consumes real simulated time via `ENC_INTERVAL` ticks
- No SAVE_VERSION bump — behavior-only change, no state schema change

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

## Combat System (SETTLED)

### Speed Check
- Lead's effective speed: `Math.floor((baseSpd * 2 * level) / 100) + 5`
- If lead is faster or tied, lead acts first; otherwise enemy acts first
- Enemy acting first deals 25% of normal damage before the throw

### Ball Logic
- `selectBallId()` — shared by online (`throwBall`) and offline (`processOfflineTime`) — priority order: Master Ball → Ultra Ball → Great Ball → Poké Ball → any ball
- `useItemFromBag(ballId, null)` consumes the ball — pass `null` as the Pokémon argument for ball use
- `throwBall()` calls `catchPokemon()` on success; on miss, enemy counter-attacks at 25% damage
- `catchRate = modifier >= 255 ? 1 : Math.min(0.99, 0.75 * modifier)`

### Fight Formula
- Lead takes `Math.max(1, Math.floor((enc.level / lead.level) * 0.5 * lead.maxHP))` damage
- If lead survives, gains EXP and encounter ends

### Shiny Auto-Catch (SETTLED)
- Shiny check fires **before** anything else in `resolveEncounterStep()` — before lead fetch, before ball selection
- Chance: 1/4096
- Auto-caught with no ball consumed
- `makePokemon()` must **never** roll shiny — shiny is set explicitly at the call site in `resolveEncounterStep()`
- **Bug (pre-v0.22):** this shiny roll only ever existed in `resolveEncounterStep()` (live path). `processOfflineTime()`'s inline catch logic called `catchPokemon(lead, enc, false)` with `isShiny` hardcoded `false` — offline/AFK encounters could never produce a shiny, no matter how long the away period.
- **Fix (v0.22):** `processOfflineTime()` now rolls the same `Math.random()<1/4096` check before the ball-catch-rate check on each simulated encounter, auto-catching as shiny with no ball consumed — mirrors live Step 1 exactly.
- **No per-encounter log spam offline** — tallied silently as `summary.shinies`, shown in the offline-return summary banner.

### Potion Logic
- `getWeakestEffectivePotion()` — smallest potion that heals without waste (heal amount ≤ missing HP), except Max Potion which only fires when missing > 120 HP
- No HP threshold — use whenever not at full HP and a valid potion exists
- `useItemFromBag()` is the canonical item use function — all item use must route through it, never inline

### Revive Logic
- **Bug (pre-v0.22):** the auto-revive check in `resolveEncounterStep()` gated on `lead.currentHP<=0` — but `lead` comes from `getLeadPokemon()`, which by definition only ever returns a **conscious** party member. The condition could never be true; Revives and Max Revives were never actually consumed by this path. There was no other way to use a Revive in the game.
- **Fix:** the impossible gate is removed. Auto-revive is now **opportunistic** — it fires any time a party member is fainted and a Revive/Max Revive is available, regardless of the current lead's state.
- Cheapest revive used first (Revive before Max Revive), applied to the lowest-level fainted Pokémon first.

### EXP Formula
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

### Per-Species Catch Cap (SETTLED — corrected v0.22)
- **Corrected v0.22 — flat cap, does not scale with aide count.** Maximum **6 non-shiny individuals per species, period** — regardless of how many aides exist.
- **Shinies are exempt** — unlimited shiny individuals of any species, not counted toward the 6.
- (Superseded: earlier "scales with aide count" language was never implemented and has been reversed before implementation.)
- When a catch would exceed the cap: **catch-then-release** — the catch is fully processed (ball consumed, EXP awarded, `state.dexHistory` incremented, `totalCatches` incremented, `recordNewSpecies` called if applicable) before the overflow individual is silently released
- Cap applies to **live held Pokémon only** — `dexHistory` counts are unaffected by and not involved in the cap check
- The prior "no releasing or selling Pokémon" rule is **superseded** by this mechanic for overflow non-shinies only; manual releasing is still not a player action

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
  - Evolution research complete: `testedMethods.length === 34` (see updated method enum count below)
  - All ability slots observed: every non-null ability the species has (`ability1`, `ability2`, `hiddenAbility`) has been seen at least once, per `researchLog[dexId].abilitiesObserved`
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

#### Evolution Method Enum (34 methods — updated v0.20)
The full set of testable evolution methods (extensible — new methods can be added without rework):

`level`, `friendship`, `friendship-day`, `friendship-night`, `use-move`, `Moon Stone`, `Thunder Stone`, `Fire Stone`, `Leaf Stone`, `Water Stone`, `Sun Stone`, `Shiny Stone`, `Dusk Stone`, `Dawn Stone`, `Ice Stone`, `Oval Stone`, `Metal Coat`, `Protector`, `Dragon Scale`, `Electirizer`, `Up Grade`, `Dubious Disc`, `Razor Fang`, `Razor Claw`, `Peat Block`, `Reaper Cloth`, `Deep Sea Tooth`, `Sachet`, `Whipped Dream`, `Tart Apple`, `Cracked Pot`, `Metal Alloy`, `Auspicious Armor`, `Unremarkable Teacup`, `Link Cable`

Total: 34 methods. `friendship-day` and `friendship-night` added in v0.20 for Espeon/Umbreon-style evolutions. `use-move` added as a placeholder for Sylveon-style evolutions — **not functional**, never auto-tested or auto-confirmed, exists only so the method has a name reserved for when a moveset system exists. This list can be extended later without requiring rework of the research system.

#### Professor Auto-Test Loop
- Evolution stones and items live in the **Professor's inventory** (`state.professorBag`)
- The Professor automatically tests untested species × item combinations whenever either side changes:
  - When a new stone/item enters `state.professorBag` → test against all known species in `state.dexHistory`
  - When a new species is caught → test against all evolution items currently in `state.professorBag`
- A combination is "untested" if it does not appear in `state.researchLog[dexId].testedMethods`
- **Failed tests cost nothing** — no item consumed, permanently logged in `testedMethods`
- **Successful tests consume one unit of the item** from `state.professorBag`
- `level`, `friendship`, `friendship-day`, and `friendship-night` evolutions are confirmed automatically when observed in the field — they do not require a separate Professor action
- **v0.20:** `professorAutoTestEvolutions()` is extended to also test EVO_TREE `use-item` branches (branching species only), using the same trigger conditions as the existing single-evolution path (stone acquired / new species caught), matching directly by itemId. Confirmed branches are appended to `confirmedBranches`, not overwritten.
- **v0.21 — auto-apply on confirm:** a successful test now does more than confirm the research finding — it also **immediately evolves a matching owned individual**, in the same step that consumes the item:
  - Eligible individual = owned in `state.dex`, matching `pokedexId`, **unassigned** (`!p.holder` — in the Professor's possession, not out with an aide), and not `evolveBlocked`
  - If multiple eligible individuals exist, the **highest-level** one is chosen (ties broken by array order)
  - If a match is found: mark tested, consume the item, confirm research, **and evolve that individual** via the shared `applySpeciesSwap(p, newEntry)` helper (see below)
  - If **no** eligible individual exists (species known historically but none currently owned/unassigned): the test is **skipped entirely** — not marked tested, item not consumed — and is retried automatically the next time `professorAutoTestEvolutions()` runs (next purchase or next new-species catch)
  - Applies identically to both single-target and EVO_TREE branching (`use-item`) matches
  - The manual per-Pokémon evolve button (see Manual Evolution Trigger below) still exists — it now covers **additional** individuals of an already-confirmed species (2nd, 3rd, etc.), or applying a *different* branch to another individual of a branching species, since the auto-test loop only ever fires once per species×item pair
  - No SAVE_VERSION bump — no new fields, only a change in when existing evolution logic fires
- **v0.21 — shared apply-logic:** the species-swap block (species/dexId swap, `maxHP` recalc, `SPECIES` registration, `recordNewSpecies`, `recordAbilityObserved`, `dexHistory` increment) is extracted into one helper, `applySpeciesSwap(p, newEntry)`. All five call sites — `checkEvolution()`'s three branches, `applyItemEvolution()`, and the new auto-apply path above — call this helper instead of duplicating the block. Do not re-duplicate this logic in future changes.

#### Research State per Species (`state.researchLog[dexId]`)
Each species tracks:
- `testedMethods[]` — all methods attempted (confirmed and ruled out)
- `evolutionConfirmed` — boolean
- `confirmedBranches[]` — **(v0.20, replaces singular `confirmedMethod`/`confirmedIntoId`)** array of `{method, intoId}` — supports species with more than one simultaneously-confirmed evolution (e.g. Eevee can have Water Stone→Vaporeon, Thunder Stone→Jolteon, and Fire Stone→Flareon all confirmed at once). Single-evolution species simply end up with a one-item list. Migration converts any pre-v13 `confirmedMethod`/`confirmedIntoId` pair into a one-item `confirmedBranches` list.
- `abilitiesObserved` — **(v0.20)** which ability slots (`ability1`/`ability2`/`hiddenAbility`) have been observed at least once, see Dex Tab Lifetime Stats
- `nonEvolutionConfirmed` — boolean
- `highestLevelObserved` — for research purposes
- `knownSince` — timestamp

#### Three-Bucket UI on Species Cards
Each species card shows a button: **"X/32 Evolution Methods Tested"** where X = confirmed + ruled-out (methods actually attempted).

Clicking expands a list:
- Shows only **Confirmed (✓)** and **Unknown (?) methods by name** — ruled-out methods are hidden entirely
- At the bottom: **"N Ruled Out"** as a count only, no names

Example — partially researched:
```
Level        ✓
Moon Stone   ?
30 Ruled Out
```

Example — fully researched (1 confirmed, 31 ruled out):
```
Level        ✓
31 Ruled Out
```

A new species with nothing tested shows **"0/32 Evolution Methods Tested"** and all 32 methods listed as `?`.

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

### Findings Report (Post-Mission) (SETTLED)
- `showFindingsReport()` is called from `endMission()` — always, including in the auto-repeat path
- Reports new species first encountered, first evolutions observed
- `state.pendingFindings` is cleared after display

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
- **Sylveon deferred** — marked with placeholder `use-move` method in `evotree.js`, non-functional, never auto-tested. Will need a moveset/move-type tracking system before it can work.
- **Leafeon/Glaceon rationale:** the real games use location-based triggers (Mossy Rock/Icy Rock); this game has no location-flag mechanic, so these are implemented as item-based substitutes instead, reusing the existing stone system. "Leaf Stone" and "Ice Stone" are new items Jack will add to the Excel `Items` sheet (`bagType: professor`, `effect: evolve-stone`) — not part of the `pokeprof.html` code change.
- **Espeon/Umbreon day/night:** no in-game time-of-day system exists — day/night is derived from the **client's real-world system clock**: 6am–6pm = day, 6pm–6am = night. No new state field.

### Data (`evotree.js` / EvoTree sheet)
- The EvoTree sheet's `evolveItem` column now stores **itemId** (not item name) — this differs from the single-target `pokedex.js` `evolveItem` field, which continues to store the item **name** as a string. The two evolution paths intentionally use two different formats; code must handle both.
- **Converter fix required:** `convertEvoTree()` in `converter.html` currently only `numVal()`-casts `fromDexId`, `toDexId`, and `evolveLevel` — `evolveItem` must be added to that cast list, or it will be stored as a string instead of a number in the generated `evotree.js`, and fail to match against `state.professorBag`'s itemId keys.

### `checkEvolution()` — EVO_TREE (Path 2) expansion
- `level` branches: unchanged, existing behavior
- **`friendship-day` / `friendship-night` (new):** auto-fires on the same level-up check as `level`/`friendship`, gated on `p.friendship>=FRIENDSHIP_THRESHOLD` AND the client system clock matching day (6am–6pm) or night (6pm–6am) respectively
- **`use-item` branches:** NOT auto-applied in `checkEvolution()` — confirmed via `professorAutoTestEvolutions()` (see below), then manually triggered per-branch via poke-modal buttons

### Research & Display
- `researchLog[dexId].confirmedBranches` (see Research State per Species above) allows multiple simultaneously-confirmed evolutions per species
- **Family/Species card display:** superseded v0.22 — see "Evolution Chain Visual" below. Per-branch `???` granularity now exists.

---

## Evolution Chain Visual (SETTLED — v0.22)

- `renderEvolutionChainVisual(famId, highlightDexId)` is a **shared component** used on both Family Cards (Layer 1) and Species Detail (Layer 3), replacing the old flat `chainParts.join(' → ')` text line on the Family Card.
- Built on a **root-based walk of `EVO_TREE`**: a "root" is any dexId in the family with no incoming edge from another family member. Each root gets its own display row — Nidoran ♀/♂ (two independent roots, no shared egg/breeding stage) renders as two rows; Eevee (one root, many branches) renders as one row that fans out with `/` between simultaneous confirmed branches (e.g. `#133 Eevee → Vaporeon / Jolteon / Flareon`).
- Each node = `getSpriteUrl()` sprite (~40–48px) + name + dexId, matching existing pixelated sprite styling.
- Arrows carry **text** method labels (`Lv 16`, `Water Stone`, gender symbol at a Nidoran-style split) — no item-sprite lookup (`items.js` has no sprite-URL helper yet; text labels were chosen over building one).
- Unconfirmed nodes render as a greyed `???` placeholder box in place of the sprite. **Evaluated independently per row** — one branch can show `???` while a sibling branch (or a different root, for Nidoran) is fully resolved. This replaces the old single shared `???` check for the whole card.
- On Species Detail specifically, the node matching the currently-viewed species gets a highlight border. `buildEvoMethodsHtml()`'s collapsible "X/34 Evolution Methods Tested" breakdown stays underneath, unchanged — this visual doesn't replace it, it fixes the fact that Species Detail previously showed *no* evolution summary at all (`getEvolutionDisplayText()` was never called there, only on Species Cards).

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

---

## Money (SETTLED)

- Universal resource, no other survival resources exist
- Base income: $1.00/min passive, scales with catches
- Current funds always visible in the game header

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

---

## Things That Are Future Goals (Do Not Implement Yet)

- Gym system (Brock and others as fixed encounters)
- Trainer innate abilities / type affinities
- New trainer recruitment mechanics
- Breeding system
- Item selling UI
- Shinydex completion tracking UI
- Per-species dex completion tracking UI
- Distribution charts for height/weight on species detail page
- `swarm` encounter method — future-proofing only; mechanic undefined (possible time/rotation-based active swarm). Not implemented.
- `honey` encounter method — future-proofing only; would require `requiresItem: honey`-type item placed on a tree, possibly with a wait/return timer. Not implemented.
