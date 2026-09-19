# PokeProf — Design Bible & Settled Mechanics

This document is the authoritative source of truth for all settled design decisions.
Every new chat session should read this before making any changes to the game.
Do not change any mechanic marked **SETTLED** without explicit approval from the project owner.

---

## Document Maintenance Rules (SETTLED)

This document holds three kinds of content:
- **Settled Rule** — terse statement of current behavior/design. No narrative.
- **Implementation Note** — attached directly beneath the rule it explains,
  only when a non-obvious invariant exists that a naive rewrite would
  silently break. Written as a generalized rule ("X must Y because Z"),
  never as a bug story.
- **Resolved Bug Index entry** — one line: title + version fixed, no
  root-cause narrative. Lives in a single index section, not scattered inline.

Filing rules:
1. Bug fix, no ongoing gotcha → Resolved Bug Index only. Full narrative
   stays in git commit messages (see Code Style).
2. Bug fix revealing a non-obvious invariant → Implementation Note,
   generalized, under the relevant Settled Rule.
3. Exception: SAVE_VERSION/schema migration history stays as current-state
   fact (table form) even though chronological — that migration code still
   runs for old saves. Ordering dependencies between migrations must be
   stated explicitly in the table, not implied by row order.
4. Default on close calls: file to the Resolved Bug Index, not as a note.
   A relearned gotcha costs one git-log lookup; an undisciplined default
   is how this document got to 2,191 lines.

---

## Resolved Bug Index

One line each: title + version fixed. Full root-cause narrative lives in
git commit messages, not here. This section grows as the design-doc audit
proceeds; new entries are appended in the version order they were fixed.

- Doc-only: `trainers.js` script tag was already live in `<head>` but missing from this doc's listing — corrected v0.43
- Mobile keyboard dismissed mid-edit by tick-render rebuilding the focused input — fixed v0.41 (Render Focus-Guard)
- Mission Modal alphabetical sort used lexicographic (not natural) string comparison — fixed v0.33
- Whole-party-faint outcome mislogged as "[species] fled." — fixed v0.36
- Offline encounters could never roll shiny (`isShiny` hardcoded `false` in `processOfflineTime()`) — fixed v0.22
- Offline wild encounters had no potion-heal loop or revive logic at all (live-only) — extended to offline for parity, v0.30
- Auto-revive gate (`lead.currentHP<=0`) was structurally impossible since `getLeadPokemon()` only ever returns a conscious member — Revives/Max Revives were never consumable by this path; fixed pre-v0.22
- `getFamilyDexIds()` walked `EVO_TREE` edges only (27 rows, branching cases only) — Family IV Inheritance donation pool was silently empty for ~90% of the dex (every single-path evolution line) — fixed v0.38
- `applySpeciesSwap()` (evolution path) never checked the species cap, only `catchPokemon()` did — an evolution could push a species over cap unchecked — fixed v0.35
- Three Species Detail entry handlers hardcoded `dexSelectedFormName=null`, hiding boxed "form-only" species (e.g. Nidoran) from Species Detail/Release despite cap enforcement working correctly underneath — fixed v0.41
- `isUndiscoveredOnly()` checked for literal `'Undiscovered'` but the real data value is `'No eggs'` — the undiscovered-egg-group breeding block never fired — fixed v0.37
- Non-Ditto breeding within a dual-root family (Nidoran♀/♂) could only ever produce the first-listed root regardless of lineage — fixed v0.38 (dedicated random-selection rule)
- Day Care slots produced exactly one baby per drop-off with no repeat/offline-accumulation loop, unlike missions — fixed v0.28 (Continuous Batch Hatching)
- `collectDaycareSlot()` never called `logCaptureRarity()` or `recordNewSpecies()` — shiny/Perfect-IV/Unicorn hatches and new-species-via-breeding produced no log entry — fixed v0.37
- Day Care eggs never rolled for shiny at all (`collectDaycareSlot()` had no check) — fixed v0.30
- Dex Held/Boxed status checked only `p.holder`, so a Pokémon breeding at the Day Care displayed identically to one idle in the box — fixed v0.30
- Wander could get permanently stuck (e.g. Pallet Town on a new game) because the tie-break treated an all-item-gated location as a genuine tied-lowest instead of ineligible — fixed immediately post-v0.33 release
- Wander redirect bypassed travel time entirely, including a self-target loophole that cashed in the aide's own current (climbing-in-rank) location as a free instant "arrival" — fixed v0.34
- `getReachableDiscoveredLocations()` gated only display, not BFS traversal through undiscovered intermediates, unlike `buildTravelPath()` — destination picker could offer a path confirming into a dead end (surfaced via Diglett's Cave North) — fixed v0.28
- `processOfflineTime()`'s wipe handling unconditionally aborted the rest of the away period on a full party wipe — fixed pre-v0.20
- Newly-unlocked encounter methods (Surf, rod tiers, etc.) defaulted unchecked forever once a location's prefs were first saved — fixed v0.34 (`knownMethods`, render-time only), then fixed completely v0.44.1 (roll-time self-heal, since Wander routes past locations without ever re-rendering their panels)
- Pokédex grid "Seen" state only populated on successful catch, not on sighting/flee/loss — showed `?` instead of a silhouette — fixed v0.24
- `isDexPageComplete()` hardcoded the evolution-methods-tested threshold as a stale magic number (34, already wrong pre-v0.24) instead of reading `EVOLUTION_METHODS.length` live — fixed v0.24
- Evolution-item auto-test was event-triggered only from `buyItem()`/first-catch and missed four other Pokémon-creation paths (shiny auto-catch live/offline, offline regular catch, Day Care hatch) — fixed v0.33 (moved to unconditional per-tick check)
- Item-evolution matching keyed on `item.effect` (`evolve-stone`/`evolve-trade`) instead of `evolveMethod`+`evolveItem` — trade-style items (Link Cable) could never match once the data standardized on a single `evolveMethod` value, silently marking them ruled out (surfaced via Haunter/Kadabra) — fixed v0.26
- v0.33's confirmed-research migration wipe ran unconditionally on every load instead of being gated to pre-v0.33 saves only — confirmed research kept getting silently wiped and re-earned every session (surfaced via repeated silent Magneton evolution) — fixed v0.35
- Species Detail's evolution-methods dropdown appeared to self-close every ~10s — actually the whole panel being torn down and redrawn collapsed on every tick-driven re-render, since its expand/collapse state lived only in the DOM — fixed v0.33
- `EVOLUTION_METHODS` was a hand-maintained array that drifted out of sync with `items.js` (8 items missing), inflating `testedMethods.length` past the real total and risking false "fully researched" status — fixed v0.33 (now derived live)
- `checkEvolution()` never had a branch that read `p.friendship` at all — no Pokémon could evolve via friendship regardless of data — fixed v0.20
- `evolveItem` was mistakenly `numVal()`-cast to a number in `convertEvoTree()` on the false premise that `professorBag` keys were numeric — silently broke every EVO_TREE `use-item` branch (Eevee's stone evolutions included), each ruled out forever with no retry — fixed v0.24
- Evolution chain root selection required the root itself to be in `seenDexIds` — an unseen structural root (e.g. Pichu) zeroed the entire family's root list and hid the whole chain, not just that node — fixed v0.26
- Item-based branch confirmation compared `confirmedBranches[].method` against the edge's generic `"use-item"` string instead of the actual item name `recordEvolution()` stores — every item-based evolution failed this comparison unconditionally (surfaced via Eevee) — fixed v0.26
- Evolution chain drew the same evolution twice for 9 species (Pikachu/Raichu, Eevee, Gloom, Poliwhirl, Slowpoke, Scyther, Exeggcute, Cubone, Koffing) that have both a legacy flat `evolvesIntoId` and matching `EVO_TREE` rows — fixed v0.35
- Unconfirmed-predecessor placeholder's auto-skip check used a different (buggy) egg-group test than the actual breeding block, so structurally unbreedable species (Mewtwo) incorrectly showed the placeholder — fixed v0.37
- Ditto showed a permanently unresolvable "confirm via breeding" placeholder, since it can structurally never produce itself as a breeding result — fixed v0.38 (explicit exclusion)
- Self-KO moves (Self-Destruct/Explosion/Final Gambit) inflated TM-upgrade caps to 200+ since the battle system has no way to represent their drawback — fixed v0.26 (flat 120 clamp)
- Gym battle EXP was pooled and awarded in full to every survivor regardless of who landed the KO, letting the strongest survivor absorb credit it didn't earn — fixed v0.32 (per-KO attribution via battle log)
- Elite Four/Champion gauntlet's five members were five independent `trainerId`s with `gauntletOrder` never populated — every leg resolved an empty roster, instant loss at leg 1 every attempt — fixed v0.28 (consolidated to one shared `trainerId`)
- Passive per-tick location heal fully healed the party for free throughout Elite Four/Champion gauntlets, since Indigo Plateau is itself a heal location — bypassed the items-only gauntlet healing rule — fixed v0.32
- Gauntlet inter-leg healing applied at most one potion per Pokémon (no loop) — a party missing significant HP got little or no visible healing — fixed v0.36
- Map colors were swept into theme tokens by the v0.35 theming pass without being added to the Fixed Constants list — route-type nodes matched the page background, making most of the map invisible under the default theme — fixed v0.36
- Nature Mint button/modal hardcoded `#9b59b6` instead of `var(--accent)` in three spots, and used the native `disabled` attribute so clicking at 0 Nature Mints gave no feedback — fixed v0.37
- Nickname evolution lock only won among branches that had already passed their own natural condition check, so mutually-exclusive conditions (day/night) meant only one branch was ever a candidate — a lock could never actually override anything (surfaced via Eevee) — fixed v0.36
- Kantonian/Alolan Raichu's `confirmedBranches` duplicate-guard compared only `{method, intoId}` — sharing both, the Alolan branch was silently dropped as a false duplicate, and its manual evolve button never appeared — fixed v0.33 (form-aware guard, part of Same-DexId Branching Form Evolutions)
- Several `getPokemonEntry(dexId)` call sites (move picker, move-slot power caps, battle damage/speed, watched-battle display, evolution display text) still silently fell back to base-form data after v0.33's form fix shipped — fixed v0.36 (threaded `.formName`/`toFormName` through each)
- Live-combat EXP calc's `baseExp` fallback had an operator-precedence bug (`s_?s_.baseExpYield||s_.baseExp:51`) that produced `NaN` EXP for any species with a falsy `baseExpYield` (e.g. Mega Venusaur) instead of the intended default — live and offline EXP math had quietly diverged — fixed v0.31
- AdminMode additionally gated on `pokedexId===19` (Rattata) — using species identity where permanent catch-order identity (`p.id`) was the actual intent, it silently stopped working the moment Catch #1 evolved into Raticate — fixed v0.33
- `playerSnapshot` (watched-battle screen) never carried `p.isShiny` from the real party object, and `renderBattleFrame()` hardcoded `getSpriteUrl(..., false)` regardless — shiny sprites rendered as non-shiny in battle — fixed v0.32
- Log Tab's Condensed sub-tab displayed backwards (stray `.reverse()` on an already newest-first array) — fixed v0.34
- Poke-modal title duplicated the form label (e.g. "Raichu (Alolan) (Alolan)") — fixed v0.34
- `showPokemonDetail()`'s type/height/weight read the base form's data for form-variant individuals — another instance of the missing-`.formName` pattern — fixed v0.34
- `pokedex.js` dexId 659–784 (126 species) had every row's content shifted +1 relative to its label from a manual Excel paste misalignment — fixed v0.39 (full re-fetch, verified via dex-wide diff)
- `saveGame()` briefly still wrote the pre-v26 flat single-aide shape after `aides[]` existed, which would have silently discarded any hired aide's save on autosave — fixed during v0.39.1 implementation
- `loadGame()` referenced removed DOM elements post-migration, throwing and getting silently swallowed by its own try/catch — a valid, correctly-migrated save still reported "load failed" — fixed during v0.39.1 implementation
- The v27-vs-v26 save-migration format check inferred format from `s.aides` presence (true on every save from v26 onward) instead of checking `s.dex` directly — every reload of an already-migrated save silently wiped the box — fixed v0.39.4
- The party↔dex reference re-link after a JSON round-trip only ever covered the first aide's party — a second aide's party held disconnected copies, not shared references — fixed v0.39.4
- Comprehensive Carl-Oak-hardcoding audit (v0.39.5) found ~10 subsystems still assuming a single aide after the aides[] refactor: species-cap checking (crashed on virtually any catch), level-cap lookup, the bag/inventory modal, wild-encounter log attribution, mission-modal summary text, the Findings Report title, the watched gym battle system, route-table/pathfinding item gating, the `in-party` evolution condition, and shop purchases — all fixed v0.39.5, see the Implementation Note there
- `assignDaycarePair()`'s party-unassignment logic still assumed Carl Oak — an 11th instance of the same hardcoding pattern, missed by the v0.39.5 audit — fixed v0.40
- Gym Battle's badge-aware default checkbox computed and rendered correctly on a badge-earned transition but was never persisted to `prefs.methods` — `pickMethodForLocation()` reads the saved array, not the DOM — fixed v0.41 (`updateMethodPrefs()` fires automatically on the transition)
- `fromFormName` branch-matching was implemented with a wildcard bypass for blank values not once but twice in successive attempts, before landing on the correct exact-match-with-null comparison — fixed v0.42
- Wander deadlock: gym battles kept firing at newly-reached cities right after a wipe recall, with two successive fix attempts (`missionOrigin`, then `lastHealLocation`) each reusing an existing multi-purpose field with the wrong update semantics — fixed v0.44 (dedicated `aide.wipeRecallLocation` flag)
- Wander could make zero progress across an entire offline gap: a wipe landing during the departure-dwell window read a deliberately-stale `missionDestination` and discarded real progress, and the recovery rebuild was missing `ignoreDiscovery=true` so any wipe in undiscovered territory reset to the heal point every time — fixed v0.44
- A single gym win could produce up to 30 near-identical "+X EXP" log lines (one per KO per party member) — fixed v0.44.1 (batched to one summary line per Pokémon)
- "Battle Gym" button permanently disappeared after a fully-wiped watched battle — the flag controlling its visibility was a plain unsaved `let` variable only cleared by a Close-button path that an empty-team early-exit skipped entirely, requiring a full page reload to recover — fixed v0.44.2
- 18 evolution items were missing from the Items sheet — resolved, verified v0.28 (all confirmed present with correct slugs and wiring)
- King's Rock and Black Augurite were listed as orphaned/unreferenced items, but were actually already wired into `evotree.js` — the note was simply never updated after they were wired up — corrected v0.33
- Duplicate `poke-ball` entry in `items.js` (dormant `shopTier:"lab"` row) — removed v0.31
- `natureMint`'s Items-sheet row (originally flagged as an outstanding v0.36 data task) — confirmed added; the v0.44 "Nature Mint Category Fix" already edits its `itemCategory` directly in `items.js`, which wouldn't be possible otherwise
- Rockruff casing mismatch (`pokedex.js` `"Own tempo"` vs `evotree.js` `"Own Tempo"`, found v0.42) — resolved; confirmed via cross-file audit that both files now agree exactly on `"Own Tempo"`
- `aide-hire-2` was added directly to `items.js` outside the normal Excel/`converter.html` pipeline — resolved, confirmed via cross-file audit and Jack's confirmation that JS files exactly mirror their Excel-tab source, so the row's presence in `items.js` means Excel has it too
- Avoid Capped Species Toggle's HP floor didn't account for the toggle itself — a capped species could never actually be defeated in combat, so every such encounter could only end in a full party wipe instead of the intended "fight for EXP, don't catch" — fixed v0.44.4, see "Avoid Capped Species Toggle" under Combat System
- Two independent hardcoded version-display strings (`<title>` and the in-game header) could silently drift apart, as happened between v0.44.2 and v0.44.3 — both now render from a single `GAME_VERSION` constant at boot — fixed v0.44.4

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
  - `typechart.js` — type effectiveness
  - `info.js` — Info-menu topic/section content (v0.43)
- Dev tools: `converter.html` (Excel → JS), `fetcher.html` (PokéAPI sprite/data fetcher), `MoveFetcher.html` (cross-game learnset fetcher — see "MoveFetcher.html — Cross-Game Learnset Tool" under Trainer Battle System), `FullFetcher.html` (exists, out of scope for now — see below)
- Hosted on GitHub Pages; all DB files are uploaded there after conversion
- Desktop and mobile friendly

**`FullFetcher.html` — confirmed out of scope for now.** It exists as a real, titled tool in the live file set ("PokeProf — Full Fetcher") but Jack's current audit scope is limited to the data files, `pokeprof.html`, and the markdown docs — not the fetcher tools. Parked, not investigated.

### CRITICAL: External Script Tags (SETTLED — do not omit in rewrites)
- All 9 data files are loaded via **relative path `<script src="filename.js">` tags in `<head>`** — no CDN, no absolute URLs
- They must appear in this order, before the closing `</head>` tag:
  ```html
  <script src="pokedex.js"></script>
  <script src="encounters.js"></script>
  <script src="locations.js"></script>
  <script src="connections.js"></script>
  <script src="typechart.js"></script>
  <script src="evotree.js"></script>
  <script src="items.js"></script>
  <script src="trainers.js"></script>
  <script src="info.js"></script>
  ```
  *(`trainers.js` corrected into this list v0.43 — it was already present in the live `pokeprof.html` `<head>` but had been missing from this doc's listing.)*
- Omitting any of these 9 causes total game failure: no sprites, no destinations, no encounters. This has happened in rewrites — verify these are present before deploying any rewrite.
- **`formtriggers.js` — corrected out of this list (found during cross-file audit):** the live `<head>` still has a stale `<script src="formtriggers.js"></script>` tag, but no `formtriggers.js` file exists in the live file set, and nothing in `pokeprof.html` ever reads any constant from it (confirmed by a full-file search — no `FORM_TRIGGERS` or similar reference anywhere). The tag is dead weight, not load-bearing — Jack confirmed the file/feature was scrapped some time ago and this is just a leftover `<script>` tag the removal never cleaned up. Not a "10th required file" as this document previously (incorrectly) claimed. Removing the dead tag from `pokeprof.html` is a trivial, safe cleanup whenever a version touches the `<head>` next — not urgent on its own.

---

## Versioning (SETTLED)

- The `<h1>` tag always shows the current version (e.g. `PokeProf v0.18`)
- Increment the version on every deployed change
- `SAVE_VERSION` in `pokeprof.html` must be incremented whenever `state` structure changes
- **Current save version: 28.** v0.44 will require **30**, across two bumps (see table).

### SAVE_VERSION History

Kept as current-state fact, not changelog — the migration code below still
runs for old saves on load. The **Ordering** column preserves sequencing
dependencies between migrations within one version; where blank, migrations
in that row's Change column are independent of each other.

| Version | SAVE_VERSION | Change | Migration | Ordering |
|---|---|---|---|---|
| v0.19 | →12 | Two-inventory split: `state.professorBag` + per-aide `trainerBag` replace single `state.bag` | Pre-v12 `state.bag` contents migrated per item's `bagType`: `Professor`→`state.professorBag`, `Trainer`→Carl Oak's `trainerBag` | — |
| v0.20 | 12→13 | `nickname`, `evolveBlocked` on Pokémon objects; `researchLog[dexId].abilitiesObserved`; `confirmedBranches` replaces `confirmedMethod`/`confirmedIntoId` | All four run in a single combined pass on load from v12 | — |
| v0.21 | 13→14 | Fishing splits into per-rod-tier sub-methods (`fish-old`/`fish-good`/`fish-super`) | Any `locationMethodPrefs[locId]` entry with bare `'fish'` (in `methods[]` or as a `weights` key) is dropped for that location; fresh defaults recalculate on next visit | — |
| v0.22 | 14 (no change) | — | — | — |
| v0.23 | 14→15 | `equippedMoves[]` (4 `{type,category,power}` slots) on Pokémon objects | Each existing Pokémon gets one default move on load: type1 slot (random Phys/Spec if both exist) → else type2 → else Normal-Physical fallback; slots 2–4 start empty | — |
| v0.24 | 15→16 | `state.freeSkipsRemaining`; `researchLog[dexId].firstSeen`/`firstCaught` | New saves init `freeSkipsRemaining=50`, existing saves at `0` (onboarding-only). **Load-bearing:** any existing `researchLog` entry → `firstSeen:true`; `firstCaught:true` only if also in `dexHistory` — without this, pre-v0.24 saves false-fire "🎯 Captured" on the next catch of any already-known species | — |
| v0.25 | 16→17 | Badge entries in `aide.trainerBag` (`itemCategory: badge`); per-gym highest-tier tracker (`aide.gymProgress[gymId]`) | Existing saves init both to empty | — |
| v0.26 | 17→18 | `state.daycareSlots`; `state.speciesCap`; one-time `testedMethods` cleanup; `state.autoRepeat` retired | First three migrate in a single combined pass from v17; retiring a field needs no backfill | — |
| v0.27 | 18 (no change) | — | — | — |
| v0.28 | 18→19 | Day Care slot reshaped for continuous batch hatching: `eggsQueued` count + `nextReadyAt` anchor replaces single-use `readyAt` | Any slot with legacy `readyAt` converts to `nextReadyAt: readyAt, eggsQueued: 0` | — |
| v0.30 | 19 (no change) | — | — | — |
| v0.31 | 19→20 | `ivs`, `nature` fields on Pokémon objects | Every existing party/dex Pokémon gets `ivs`/`nature` rolled retroactively (single roll, not the 10× dex-complete advantage — that only applies going forward at creation time), then `recalcStats()` runs; `currentHP` set to the new `maxHP` (full heal) since `maxHP` shifts | — |
| v0.32 | 20 (no change) | — | — | — |
| v0.33 | 20→21 | `p.formName` on every Pokémon object; `state.wanderMode`; `state.significantLog`; `confirmedBranches`/`testedMethods` reset for any item with a real matching branch | All migrate in a single combined pass from v20 | **`p.formName` backfill and the research-log reset must both complete before any subsequent `recalcStats()` call** |
| v0.34 | 21 (no change) | `locationMethodPrefs[locId]` gains additive `knownMethods` field | Degrades gracefully on old saves | — |
| v0.35 | 21→22 | `state.wanderMetric` | Existing saves default to `'encounters'` | — |
| v0.36 | 22→23 | `researchLog[dexId].gendersObserved`; `researchLog[dexId].breedingTested` | Single combined pass from v22 | — |
| v0.37 | 23→24 | `researchLog[dexId].gendersObserved` changes from boolean flags (`{M:true,F:true}`) to running counts (`{M:0,F:0}`) | Best-effort backfill from currently-held `state.dex` individuals only — historical released/evolved-away individuals aren't recoverable | — |
| v0.38 | 24→25 | `state.speciesCapOverrides`; `p.abilitySlot` on every Pokémon object | `speciesCapOverrides` defaults to `{}`; `abilitySlot` backfilled per-individual by matching current ability against current species, re-rolling where no match is found | — |
| v0.39 (base) | 25 (no change) | — | Silph Tower feature fully reverted in v0.39.1 anyway; was itself runtime-only/non-persisted | — |
| v0.39.1 | 25→26 | `state.aides[]` restructure — Carl Oak's singular `party`/`trainerBag`/`currentLocation`/mission-and-travel fields wrapped into `aides[0]` | — | — |
| v0.39.2 | 26 (no change) | Battle-engine/logic fixes only | — | — |
| v0.39.3 | 26→27 | `dex` moved back OUT of `aides[]` into shared `state.dex` | See "Aide Roster & Hiring" | — |
| v0.39.4–v0.39.6 | 27 (no change) | Logic-only fixes | — | — |
| v0.40 | 27→28 | `state.avoidCappedSpecies`; per-aide `expShareActive` | — | — |
| v0.41 | 28 (no change) | New per-location `gymBadgeState` field is additive/degrades-gracefully (same pattern as v0.34's `knownMethods`); `dexSelectedFormName` confirmed transient/unsaved | — | — |
| v0.42 | 28 (no change) | `fromFormName`/`requiredGender` live on static `EVO_TREE` data, not `state`; Shedinja reuses existing individual-Pokémon shape | — | — |
| v0.44 | 28→29 | Two new persisted per-aide fields: `researchMode` (boolean, default `false`), `researchPair` (object or `null`, default `null`) | See "Day Care Research Mode" | — |
| v0.44 | 29→30 | `state.gymBattleDefaultPreference` (boolean, default `false`) | See "Gym Battle Default Question" under Onboarding | — |

*Previous gap resolved:* the 19→20 bump was v0.31 (IVs/Nature), documented
far downstream under its own feature section rather than here — now folded
into this table as the row above. That scattered-SAVE_VERSION pattern
recurs at least twice more further into the document (Gym System, Same-DexId
Branching Forms); each will get folded into this table as the audit reaches
that section, rather than left as a second source of truth.

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

### Version Display (v0.44.4)
- `const GAME_VERSION` is the single source of truth for the version shown to
  the player — declared once near the top of the script, alongside the other
  top-level constants (`ENC_INTERVAL_OPEN`, `FRIENDSHIP_THRESHOLD`, etc.).
- Set at the same unconditional post-boot point as the tick intervals above
  (after `loadGame()`/`init()` completes either way): `document.title` and the
  header's `#game-version-display` span both render from `GAME_VERSION` there.
- **Bug, fixed v0.44.4:** before this, the `<title>` tag and the header span
  each hardcoded their own copy of the version string independently — nothing
  forced them to agree, and v0.44.3's delivery updated one and missed the
  other. Bumping the version is now a one-line edit to `GAME_VERSION`; the two
  displays cannot drift apart again.
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

### Live/Offline Parity (Implementation Note)
- Per-encounter logic (shiny rolls, potion healing, revives, and anything
  else resolved inside a single encounter) is implemented separately for
  the live path (`resolveEncounterStep()`) and the offline catch-up path
  (`processOfflineTime()`) — they are two independent code paths that do
  **not** share fixes automatically. Any new per-encounter mechanic must
  be explicitly added to both, or it will silently only work live (or
  only offline). See Resolved Bug Index for three past incidents of this
  exact gap (shiny, potion-heal, revive).

### Render Focus-Guard (SETTLED — v0.41)
- `render()` is a single choke point every tick-driven redraw already
  passes through: if `document.activeElement` is an `INPUT` or
  `TEXTAREA` anywhere in the document, `render()` skips the panel
  rebuild for that tick and returns early. Scoped to `INPUT`/`TEXTAREA`
  only — checkboxes/selects are unaffected and already render once on
  open, never mid-tick.
- Everything upstream of `render()` inside `gameTick()` (encounter rolls,
  travel, income, friendship, evolution testing) still runs normally on
  a skipped tick — only the DOM redraw pauses, and it catches up on the
  next tick once the input loses focus.
- **Implementation Note:** this guard is structural, not tied to any one
  field — it protects any current or future `<input>`/`<textarea>` living
  inside a tick-rebuilt panel without needing a matching guard added per
  render function. Do not add per-panel guards; extend this one instead.
- No `SAVE_VERSION` impact.

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
- **Alphabetical** = location display name, A–Z, via `localeCompare(..., {numeric:true})` — a natural sort that treats embedded digit runs as numbers: Route 2 → Route 9 → Route 11 → Route 23.
- **Encounters** = sightings (`seen`) count summed across all species logged at that location, from `state.locationEncounterLog[locId]` — locations never visited sort as `0`.
- **Catches** (v0.35, new) = caught (`caught`) count summed across all species logged at that location, from the same `state.locationEncounterLog[locId]` — new helper `computeLocationCatches(locId)`, sibling to the existing `computeLocationSightings(locId)`. Locations never visited (or never yielding a catch) sort as `0`.
- First click on any of the four buttons sorts **ascending** (Distance: nearest first; Alphabetical: A–Z; Encounters/Catches: fewest first). A second click on the **same** button reverses to descending. Clicking a **different** button resets to ascending for the new criterion.
- Sort state is transient UI-only — not persisted to `state`, not saved. The list has no default sort order when the modal opens; it resets each time.
- No SAVE_VERSION bump (no schema change).
- **v0.28:** while sorted by **Encounters** specifically, locations with zero wild encounter table rows (`buildRouteTable(locId).length===0`) are filtered from the list entirely — these can never contribute a nonzero encounter count and were only cluttering that sort (Day Care, pure shop towns, Indigo Plateau pre-8-badges, etc.). Gym-trainer presence is not considered by this filter — only wild-table rows. **v0.35:** the same filter applies to **Catches** for the same reason. Distance and Alphabetical sorts show the full reachable list, unchanged.

### Mission Modal — Level Range Display (SETTLED — v0.43)
Each destination button's label appends a combined level range, e.g. `Route 1 (Lv 2-7)`, computed via `buildRouteTable(loc, aide.trainerBag)` (already respects rod/item gating) — `Math.min`/`Math.max` across all currently-valid rows' `minLv`/`maxLv`. One combined range across all encounter methods, not broken out per method. Single-level locations show `Lv 5`, not `Lv 5-5`. Locations with zero valid rows show no range. Applies uniformly across all four sort modes; no change to Wander buttons or the map detail panel.

### Mission Modal — Location Markers to Match Map (SETTLED — v0.44)
Each destination button's idle border color is derived the same way `getMapNodeStyle()` derives map node colors: shop-tier `#2ecc71` (green), heal-only `#e63946` (red), shop wins on combined heal+shop locations, routes/other unchanged. Gym locations (any location with a `TRAINERS_DATA` row, `!isGauntlet`, and a `badgeItemId`) show that badge's sprite next to the location name via the existing `BADGE_SPRITE_MAP` (+ emoji fallback) pattern, shown regardless of whether the badge has been earned yet. The existing 2px accent "selected" border still overrides the idle color for the current pick.

### Mission Modal — "Wander" Mode (SETTLED — v0.33, NEW; bug fixed post-release; revised v0.34, v0.35)
- New mode alongside manual destination selection: the aide continuously travels toward whichever **reachable, discovered, encounter-capable** location currently has the fewest lifetime encounters *or* catches (metric-dependent, see below), re-evaluating on an ongoing basis rather than being dispatched once to a fixed target.
- **New persisted field:** `state.wanderMode` (boolean, default `false`) — folded into the SAVE_VERSION 21 migration already required for other v0.33 schema changes; no additional bump needed for this field alone.
- **v0.35 — two metrics, not one.** The mission modal now shows **two** Wander buttons: "🧭 Wander (lowest encounters)" (the original v0.33 behavior, relabeled for clarity — uses `computeLocationSightings()`) and "🧭 Wander (lowest catches)" (new — uses `computeLocationCatches()`, the same helper backing the new Catches sort above). **New persisted field:** `state.wanderMetric: 'encounters'|'catches'` — set at dispatch to whichever button was pressed, read by `evaluateWanderTarget()` on every re-evaluation so a session keeps re-routing by the same metric it was dispatched with. **Requires SAVE_VERSION 22** (21 → 22); migration: existing saves (all pre-v0.35 Wander sessions were encounter-based) default `wanderMetric` to `'encounters'`.
- **Shared re-evaluation helper** (`evaluateWanderTarget()`), single implementation called from two places:
  - the top of `gameTick()` (live play, every 1s base tick)
  - inside `processOfflineTime()`'s catch-up loop (every simulated encounter-interval) — offline time actively re-routes too, not just live play, by explicit design decision.
- **Candidate pool** (used both by `evaluateWanderTarget()` and the initial pick in `selectWanderMode()`) is filtered to `buildRouteTable(locId).length>0` — the same live, item-aware filter used for the Encounters sort mode. **Implementation Note:** a location can have real rows in `encounters.js` yet still return 0 from `buildRouteTable()` if every row is currently item-gated (rod/Surf not yet owned) — ranking/tie-break logic must treat that as ineligible, not as a genuine 0-sightings location, or Wander can get permanently stuck (Pallet Town on a new game is the canonical case: fish/surf-only, all item-gated). The current target does not automatically win ties if it has dropped out of this eligible pool.
- **Redirect logic:** only evaluated while the aide is stably at its current destination (`state.travelPath.length===0`) — a redirect never interrupts a journey already in progress. Among eligible locations, if any reachable location other than the current target is *strictly* lower, retargeting begins; a tie keeps the current target (no redirect purely from equal rankings).
- **Departure mechanic (Implementation Note):** a redirect must depart the current location through the normal `travelTime` dwell mechanic (`state.travelCyclesRemaining` set to that location's own `travelTime`, `state.travelPathIndex` set to a `-1` "departure in progress" sentinel until it counts down) — never jump straight to rebuilding `state.travelPath` and calling `arriveAtLocation()` on the new path. Since sightings accumulate wherever the aide currently stands, a location being passed through climbs in ranking the longer the aide dwells there; without the dwell-first departure, Wander can redirect *to the aide's own current spot* and cash it in as a free instant "arrival," skipping travel time indefinitely. `-1` is just a new valid value for the existing `travelPathIndex` number — no `SAVE_VERSION` impact.
- **Mutually exclusive with manual destination selection** for a given mission — choosing Wander replaces the destination picker in the modal. Recalling the mission clears `state.wanderMode` (and `state.wanderMetric`), the same way it already clears `state.missionDestination`; starting a new mission requires re-selecting Wander.
- **Log visibility (metric-aware):** a redirect logs `"🧭 <Aide name> changes course — new lowest-encounter destination: <name>."` when `state.wanderMetric==='encounters'`, or `"...new lowest-catch destination: <name>."` when `'catches'` — live inline, and batched into the offline-return summary when triggered during offline processing.
- **Ignores discovery (SETTLED — v0.43):** `getWanderReachableLocations(fromId, trainerBag)` — same BFS as `getReachableDiscoveredLocations`, minus every `state.discoveredLocations` check — is what both `evaluateWanderTarget()` and `selectWanderMode()` use for their candidate pool, via a 4th `buildTravelPath()` param `ignoreDiscovery=false` (default preserves every existing caller; Wander passes `true`). Connection-level `requiresItem` gates (Surf, Cut, Flash, Strength, Bicycle, Silph Scope, Safari Pass, Coin Case, SS Ticket) still fully apply — only discovery is dropped. Manual "dispatch to a specific location" stays discovery-gated. `arriveAtLocation()`/`advanceTravelPath()` need no changes — arrival-time discovery already fires per-waypoint regardless of how the aide got there.
- **Deterministic tie-break (SETTLED — v0.44):** best-target selection is a 3-key comparison for both metrics: (1) metric count ascending, (2) max level in the area ascending (`Math.max(...buildRouteTable(locId, aide.trainerBag).map(r=>r.maxLv))`), (3) location name alphabetical as final tie-break. Replaces the earlier implicit "ties always keep the current destination" — a tie can now redirect the aide away from their current spot, since leaving adds an encounter/catch at the new location.
- **Stale-destination resolution on wipe recovery (SETTLED — v0.44):** both `endMission()` and `processAideOfflineTime()` resolve the *true* pending destination before deciding whether the aide is "already home" — `(aide.travelPathIndex===-1 && aide.travelPath.length) ? aide.travelPath[aide.travelPath.length-1] : aide.missionDestination` — and collapse `aide.missionDestination` to that resolved value immediately, since a wipe interrupts those plans regardless. Both wipe-recovery rebuild calls to `buildTravelPath()` pass `ignoreDiscovery=true`, matching Wander's own permission model above. **Implementation Note:** two distinct invariants are in play here — (1) any code checking "where is this aide really heading" must resolve through the departure-dwell case (`travelPathIndex===-1`) specially, since `aide.missionDestination` is deliberately left stale during that window (by design, since v0.34); a direct read during a wipe landing in that window reads the old target and wrongly concludes "already home," discarding real progress. (2) a path-rebuild call replacing an interrupted journey must carry the same permission flags as the original call it's replacing — omitting `ignoreDiscovery=true` here meant any wipe while exploring undiscovered territory reset progress to the heal point every time, with each retry just as likely to wipe again before completing. Verified via a 20,000-tick simulation: previously frozen at 2 locations forever with 0 catches; after the fix, 11 unique locations visited, 26 catches, no permanent oscillation.

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
- `checkLocationHeal()` (full-party heal when standing at a `heals:true` location) runs on every simulated encounter cycle inside `processOfflineTime()`, mirroring live `gameTick()` order exactly — an instance of the Live/Offline Parity note above.
- No per-encounter log spam offline — heals tallied silently as `summary.heals`, shown in the offline-return summary banner alongside encounters/catches/wins/income.

### Offline Friendship Tick Parity (SETTLED — v0.38)
- Friendship advances offline via the same rolling `state._friendshipTick` counter live `gameTick()` uses, incremented per offline-loop iteration by that iteration's elapsed time (10s/30s, matching `ENC_INTERVAL_OPEN`/`CLOSED`) — firing +1 friendship per currently-alive party member at each 180-crossing, evaluated at the correct point in simulated time (mirroring live: friendship before that interval's heal/encounter resolution). Any trailing leftover time (loop exits early via `OFFLINE_LOOP_CAP`, or a final partial interval) folds into the same counter using final HP state — same accepted tradeoff the encounter loop already has for that edge case. Another Live/Offline Parity instance — this one is more subtle than a missing call, since a naive single bulk pre-check (gating once on HP evaluated before any offline simulation ran) silently mis-splits friendship between party members who faint/heal at different points in a long offline gap.
- **Accepted granularity difference:** offline advances in 10s/30s chunks rather than live's exact 1-second ticks — intentional, offline can't simulate every second at scale.
- No SAVE_VERSION impact — reuses the existing `state._friendshipTick` field.

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

### Pathfinding & Reachability (SETTLED — v0.19, revised v0.26, v0.28)
- `buildTravelPath()` restricts its BFS traversal to nodes in `state.discoveredLocations`.
- `getReachableDiscoveredLocations()`'s BFS no longer pre-seeds `visited` with the current location (v0.26) — see "Current location is now a valid destination" above.
- **Implementation Note:** `getReachableDiscoveredLocations()` (which decides what the destination picker shows) and `buildTravelPath()` (which actually walks the path) must apply the identical discovery-gate check on every intermediate node, not just the endpoint — `if(!state.discoveredLocations.has(c.toLocationId)) return false;` alongside the existing `requiresItem` check, in both functions. If the two ever diverge, the picker can offer a destination reachable only through an undiscovered waypoint, which `buildTravelPath()` correctly refuses to walk — the mission confirms but produces an empty path and the aide never moves.

### Offline Wipe & Auto-Repeat (SETTLED — v0.20, mandatory as of v0.26)
- On a wipe during offline simulation: heal the party at `state.lastHealLocation`, rebuild `state.travelPath` from `lastHealLocation` → the mission destination, reset `travelPathIndex` to 0, set `currentLocation` to `lastHealLocation`, and continue the loop — mirrors live `endMission()`'s relocate-heal-resume path, with no time cost for the heal/redispatch itself.
- This is the *only* behavior since v0.26 — there is no non-repeating branch, since auto-repeat is mandatory (see Mission System above).
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
| `headbutt` | Not actually implemented, despite being in this enum — no rows in `encounters.js` use it, and no code path is confirmed to handle it. Future-proofing only, same status as `swarm`/`honey` below, do not rely on it working. |
| `rock-smash` | Rock smash encounters |
| `gift` | Not actually implemented — same status as `headbutt` above. Future-proofing only, do not rely on it working. |
| `static` | Not actually implemented — same status as `headbutt` above. Future-proofing only, do not rely on it working. |
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

### Mission Modal — Method Selection (SETTLED — v0.19, revised v0.34, v0.44.1)
- Mission modal gains **per-location method checkboxes** built from `buildRouteTable()` results for that location — only methods that actually have encounter rows at this location are shown at all
- Methods with encounter rows but whose `requiresItem` the aide doesn't currently own are shown as **disabled** (visible but uncheckable)
- Methods with no encounter rows at this location are **invisible entirely** — not shown, not disabled
- Player can optionally assign **relative weights** across checked methods (e.g. 70% fish / 30% grass); if no weights set, defaults to **even split** across all checked methods
- Selection and weights **persist per location** — remembered on return, not re-prompted each mission
- **Default on first visit:** all available (non-disabled) methods checked, evenly distributed
- `state.locationMethodPrefs[locId]` gains an additive `knownMethods` field — every available (non-locked) method ever actually offered as a toggle at that location, independent of its checked state. A method missing from `knownMethods` is treated as genuinely new and defaults to checked at render time; a method already in `knownMethods` respects whatever the player last set.
- **Implementation Note (roll-time self-heal, v0.44.1):** the `knownMethods` render-time default above only persists into the saved `prefs.methods` array if the panel actually re-renders and the player interacts with some control on it — Wander routes an aide through and past locations without ever reopening their panels, so a newly-unlocked method could display as checked but never get saved as checked, and `pickMethodForLocation()` would keep reading the stale array forever. Fixed structurally: `pickMethodForLocation()` itself now treats any method available right now but absent from `prefs.knownMethods` as checked by default directly in the roll pool, independent of whether the panel ever re-renders — mirroring the display-side default at the point where it actually matters. A method the player genuinely unchecked (present in `knownMethods` but absent from `methods`) still correctly stays excluded. Both the render-time default and this roll-time self-heal must be kept — the first is what the player sees, the second is what actually fires when they never look.
- In-route resolution is **two-stage**: roll for method first (per player's checked set and weights), then roll within that method's weighted encounter table for the actual Pokémon
- **Encounter method by location role — applies both live and during offline simulation:**
  - **Passthrough waypoints** (locations the aide travels through en route to the destination): always use `defaultEncounterMethod` from `locations.js` — player method preferences are not applied to waypoints
  - **Destination location** (where the aide is stationed): use `state.locationMethodPrefs[locId]` (or `defaultEncounterMethod` if no preference has been set yet for this location)
- Stored in `state.locationMethodPrefs[locationId]` as `{ methods: ['grass','fish'], weights: {'grass':30,'fish':70}, knownMethods: [...] }` — `knownMethods` is additive/degrades gracefully on old saves, no separate SAVE_VERSION bump beyond the field's original introduction.

### Gym Battle — Badge-Aware Default Checkbox (SETTLED — v0.41, NEW)
- **Problem:** the Gym Battle checkbox in the mission modal followed the same generic "all available methods default checked" rule as every other method (see the v0.34 `knownMethods` default above). Since v0.40 made gym eligible for the idle/passive method-selection roll as soon as it's *accessible* (not gated on the badge already being held — see "4. Gym battles available passively/idly at current tier" below), this meant a fresh, unbadged gym defaulted to checked the moment it became reachable — mixing badge-earning attempts into the passive weighted roll by default, with no signal to the player that this was happening.
- **Fix:** Gym Battle's checked state is now computed live from that gym trainer's own badge status via a new `hasGymBadge(trainerId, trainerBag)` helper (mirrors the existing `hasChampionBadge()` pattern) — **unchecked by default while the badge is unearned, checked by default once it's earned.** This is a genuinely live-recomputed default, not a one-time initialization: a new per-location tracking field, `state.locationMethodPrefs[locId].gymBadgeState`, records which badge-state ("earned"/"unearned") the checkbox was last rendered under. On the render immediately after a badge transitions from unearned→earned, the recorded state no longer matches live status — Gym Battle's checked value is recomputed fresh (checked) and `gymBadgeState` updates to match, **overriding whatever the player had manually set beforehand.** Between transitions, manual checks/unchecks behave exactly like every other method (respected, persisted, not reset).
- **Never locked/disabled** — Gym Battle is not in `lockedMethods` before or after this change; the player can manually check it in while unbadged at any time, same as always. Only the *default* value differs.
- **Per-aide** — computed against the specific aide whose mission modal is open (`state.aides[missionModalAideIndex].trainerBag`), same as every other gate in this modal (locked-method checks, forced tier display, etc.).
- No `SAVE_VERSION` bump — `gymBadgeState` is additive and degrades gracefully on old saves (absent field is treated as "no prior render," so the very next render recomputes from live badge status once), same pattern as v0.34's `knownMethods` field above.

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
6. **HP floor (revised v0.44.4):** while a catch attempt is still genuinely possible
   for this species this encounter — owns a ball, AND not blocked by Avoid Capped
   Species (see below) — wild HP is clamped at a minimum of 1; it cannot faint. Once
   that's no longer true (balls exhausted mid-encounter, or the species is at/over
   cap with Avoid Capped on), the floor lifts and a normal KO becomes possible (a
   "win" — EXP only, no catch, matching the old Fight Formula's win condition).
   **Bug, fixed v0.44.4:** previously this checked only "owns any ball at all,"
   without accounting for Avoid Capped Species — so a capped species with that
   toggle on could never actually reach 0 HP (a ball would never be thrown at it,
   but the floor kept assuming one might be), and the fight could only ever end in
   a full party wipe. See "Avoid Capped Species Toggle" below.
7. Loop ends on: capture (success), wild faints (no-balls **or** Avoid-Capped win),
   or the lead's whole party faints (existing Faint-Switch Behavior / flee rule,
   unchanged).
- **Fully silent/instant** — the entire multi-round encounter resolves within a single
  function call, live or offline, with no watched playback (unlike Gym battles).
- **Ball consumption unchanged:** one ball consumed per throw attempt regardless of
  outcome — this was a deliberate, confirmed tradeoff, not a side effect to fix.
- Old `fight()` function (flat `(enc.level/lead.level) × 0.5 × maxHP` formula) remains
  removed, per v0.30.

### Avoid Capped Species Toggle (SETTLED — v0.40, first full spec written v0.44.4)
DESIGN.md never had a real section for this feature before — only a bare
SAVE_VERSION table mention. Documented here from the actual code, confirmed
against its own in-game confirmation-dialog text.
- **Intent:** a global, player-toggleable setting (`state.avoidCappedSpecies`,
  default `false`). When on, a wild encounter against a species already at/over
  its effective species cap (see "Universal Species-Cap Enforcement") is still
  fought normally for EXP — it just never attempts a catch. The point is to stop
  wasting balls/time on species you can't keep without releasing something else.
- `onAvoidCappedSpeciesToggleClick()` — turning it ON requires confirming a native
  `confirm()` dialog (same convention as `onSpeciesCapChange()`) explaining the
  tradeoff: income scales off total catches, and stronger IVs pass down to an
  existing individual on release. Turning it back OFF has no confirmation.
- `decideWildBallThrow()` checks it directly: if on and the species' live box
  count (excluding held/shiny individuals, same rule as the species-cap system
  generally) is at/over `getEffectiveSpeciesCap(dexId)`, returns `null` —
  no ball is ever thrown at this species while the condition holds.
- **Bug, fixed v0.44.4:** the Wild Encounter Turn Loop's HP floor (step 6 above)
  didn't know about this rule — it kept the wild Pokémon's HP floored at 1
  forever, since it only checked "do you own any balls," not "will a ball ever
  actually be thrown at this one." A capped species with the toggle on became
  unwinnable rather than "fight for EXP only" — every such encounter could only
  end in the player's own party getting ground down to a wipe. Confirmed via
  direct harness testing (6/6 trials): before the fix, a capped-species encounter
  always ended in "Your party was defeated"; after, it ends in a normal
  "Won vs X! +EXP" with no catch attempted, exactly matching the documented
  intent. Fix applied identically to both `runWildEncounterLoop()` (live) and
  `runWildEncounterLoopSilent()` (offline) — see the shared `canCatchThisSpecies`
  check both now use in place of the old bare `hasBalls` for the floor decision.
- Still fights and gains EXP completely normally against a capped species —
  only the catch-attempt path is affected. Not fought at all is a different
  (unrelated) setting/behavior, not this one.

### Faint-Switch Behavior (SETTLED — v0.26)
- On lead faint mid-encounter: if `getLeadPokemon()` returns another Pokémon, log
  "X fainted! Y was sent out!" and continue the same encounter against the new lead.
  Only when the whole party is down does the encounter end via `endMission()`, logging
  the actual party-wipe outcome (not a flee message).

### Shiny Auto-Catch (SETTLED)
- Shiny check fires **before** anything else in both `resolveEncounterStep()` (live)
  and `processOfflineTime()` (offline) — before lead fetch, before ball selection
- Chance: 1/4096, independently rolled on each path (see Live/Offline Parity note)
- Auto-caught with no ball consumed
- `makePokemon()` must **never** roll shiny — shiny is set explicitly at each call site
- No per-encounter log spam offline — tallied silently as `summary.shinies`, shown in
  the offline-return summary banner

### Pre-Encounter Healing (SETTLED, timing revised v0.44.3)
- `getWeakestEffectivePotion()` applies **repeatedly** — as many potions as needed
  until the lead is at full HP or no usable potion remains in `state.professorBag`.
  Strictly **between** encounters, never mid-fight.
- **v0.44.3:** now runs at the start of every encounter-cycle boundary,
  unconditionally — previously ran only after an encounter had already been
  rolled (nested inside the encounter-resolution path), meaning a cycle that
  rolled no encounter, or was mid-travel, skipped healing entirely that cycle.
- Applied identically live and offline, in the same step order — an explicit
  case of the Live/Offline Parity note above, not an automatic consequence of it.
- `useItemFromBag()` is the canonical item use function — all item use must route
  through it, never inline

### Revive Logic (SETTLED, materially fixed v0.44.3)
- **Implementation Note:** `getLeadPokemon()` by definition only ever returns a
  **conscious** party member — any gate written as `lead.currentHP<=0` is structurally
  impossible and will never fire. Revive logic must instead check the whole party for
  fainted members directly, independent of `lead`.
- **v0.44.3 fix — two real limitations found and corrected, not just a doc update:**
  1. Previously only revived **one** fainted party member per cycle (stopped after
     the first successful use). Now revives **every** currently-fainted member each
     cycle, subject to available Revives/Max Revives — a multi-faint doesn't queue
     behind a one-at-a-time bottleneck anymore.
  2. Previously only ran when an encounter had **already rolled** that cycle
     (nested inside encounter resolution). Now runs unconditionally at the start
     of every encounter-cycle boundary, before the roll — same fix as Pre-Encounter
     Healing above, and for the same reason: a cycle with no roll, or a
     still-mid-travel aide, previously never got a healing check at all.
- **Why this mattered in practice, not just in theory:** live play has an
  invisible backstop (a present player can just manually use an item), so
  neither limitation was very visible there. Offline/idle play has no such
  backstop — the same rate limit that's harmless when watched could leave a
  partially-fainted team stuck fainted for a large fraction of an idle session,
  with zero friendship accrual for that whole stretch (friendship checks skip
  fainted members with no proration — see the friendship-tick discussion above).
  Confirmed via direct testing: reviving 4 simultaneously-fainted party members
  now happens in one cycle instead of four, and a party sitting fainted between
  otherwise-empty rolls now gets healed on the very next cycle instead of
  waiting for one to actually produce an encounter.
- Cheapest revive used first (Revive before Max Revive), applied lowest-level
  fainted Pokémon first, same as before.
- Applied identically live and offline, at the same point in each cycle (see
  Live/Offline Parity note above).

### EXP Formula (SETTLED — unchanged by v0.30)
- `Math.floor((baseExpYield * enc.level) / 7)`

### EXP Share Item (SETTLED — v0.40)
- New item, `bagType: "Trainer"` (per-aide — each aide needs their own copy), **$100**, one-time purchase (not consumed, `isConsumable: false`), persistent per-aide toggle once owned. Backed by `aide.expShareActive` (default `false`).
- **Formula:** whoever actually earns the EXP (won a fight, made a catch) gets 50%. The other 50% splits evenly across every *other* party member of that same aide, fainted or not. Solo party (nobody to split with) → the battler gets the full normal amount, nothing lost. A recipient already at that aide's level cap still accrues the EXP normally — no special case needed.
- **Implementation:** `distributeExp(pokemon, amount, idx, silent)` is the single entry point every EXP-awarding call site goes through (7 sites: 3 live, 3 offline/silent, plus `awardPerKOExp()` for gym battles). `giveExp()`/`giveExpSilent()` themselves are unchanged; the wrapper calls them multiple times per the split, using `Math.floor()` at each step (a few fractional EXP points can be lost to rounding — standard tradeoff, matches real Exp Share implementations too).
- **UI:** a button next to each aide's row of 6 party sprites, reading `Exp Share: ON`/`OFF` (accent-colored when on, muted when off) — only rendered once that aide's `trainerBag` actually contains the item.

---

## Inventory System (SETTLED intent — v0.19 implementation pending)

### Two-Inventory Split
The single `state.bag` is replaced with two separate inventories:

- **Professor's inventory** (`state.professorBag`): heals (potions, revives), Poké Balls, evolution stones and items, and similar consumables/research items
- **Per-aide inventory** (`aide.trainerBag` on the aide object): badges, HMs, Bicycle, Rods (Old/Good/Super), Safari Pass, and similar field-equipment items

### `bagType` Field on Items
- Every item in `items.js` has a `bagType` column: `"Professor"` or `"Trainer"`
- This is the authoritative routing field — shop purchases, item consumption, and `requiresItem` checks all reference `bagType`
- Adding a new item requires explicitly setting `bagType` in the spreadsheet

### `requiresItem` Checks
- `requiresItem` on **encounter rows** (`encounters.js`) checks the **active aide's per-aide inventory**
- `requiresItem` on **connection rows** (`connections.js`) checks the **active aide's per-aide inventory**
- **Safari Pass** follows the same rule — it is an aide-held item (`bagType: "Trainer"`)
- Pokémon inside the Safari Zone are caught with regular Poké Balls from the Professor's inventory

### Per-Aide Inventory
- Each aide has their own independent inventory — if Carl has an Old Rod, a second aide does not automatically have one
- Item counts are per-aide, not shared

### Shop Routing
- `buyItem()` must route purchases into the correct inventory based on the item's `bagType`

### Save Migration
- SAVE_VERSION 12 (see Versioning table, v0.19 row). On load from a pre-v12 save,
  existing `state.bag` contents migrate based on each item's `bagType` field:
  `professor` items go to `state.professorBag`, `trainer` items go to Carl Oak's `bag`

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
- **Box-only enforcement (v0.38).** The cap counts and applies to **boxed individuals only** — Pokémon currently held in the party (`state.party`/`p.holder` set) are excluded from the cap count entirely and can never be an auto-release target, no matter how many are caught. A species can therefore exceed the nominal cap in total (party + box combined) as long as the boxed portion alone stays at or under the cap. Family IV Inheritance donation (below) is unaffected — party members remain eligible **recipients** of a donation, since that's a buff, not a removal.
- When a catch would exceed the cap: **catch-then-release** — the catch is fully processed (ball consumed, EXP awarded, `state.dexHistory` incremented, `totalCatches` incremented, `recordNewSpecies` called if applicable) before the overflow individual is silently released
- Cap applies to **live held Pokémon only** — `dexHistory` counts are unaffected by and not involved in the cap check
- The prior "no releasing or selling Pokémon" rule is **superseded** by this mechanic for overflow non-shinies only; manual releasing is still not a player action, except via the explicit cap-lowering sweep above

### Ball-Avoid Toggle for Capped Species (SETTLED — v0.40)
- Global (not per-aide) — lives next to the species-cap setting. When ON: a wild encounter of a species already at its effective cap (respecting per-species overrides via `getEffectiveSpeciesCap()`) still resolves as a normal fight for EXP — the aide just never attempts a catch.
- Shiny individuals are entirely unaffected regardless of the toggle — the shiny auto-catch check fires before the normal ball-throw decision logic is ever reached.
- **Confirmation on enable only** (no downside to warn about on disable) — a themed modal, not a native browser confirm, explaining that income scales with total catches and that stronger IVs pass down to existing Pokémon on release. Cancelling leaves the toggle off.

### Select Pokémon to Release (SETTLED — v0.40)
Button beneath the per-species cap override control on Species Detail. Opens a modal with checkboxes for every **boxed** (`!p.holder`) individual of that exact species+form — held/party members excluded entirely. Shinies included and selectable (the player's explicit choice here, unlike cap-overflow auto-release). "Release Selected" requires a confirmation prompt before anything is removed; removal reuses the existing `removePokemonFromBoxAndParty(id)` mechanism per selected individual.

### Rattata #1 (Starter) Can Never Be Released (SETTLED — v0.43)
`removePokemonFromBoxAndParty(id)` — the shared low-level function every release path calls — has `if(id===1) return;` at the top, structurally protecting all current call sites (`checkSpeciesCap()` auto-release, `sweepSpeciesToCap()` cap-lowering sweep, `confirmReleaseSelected()` manual release, `performCheatReplace()` cheat release-and-replace) and any future one. `checkSpeciesCap()`'s weakest-picker additionally excludes `id===1` from candidacy so cap enforcement keeps working correctly (releases the next-weakest instead of silently no-op'ing). `showReleaseModal()` also excludes `id===1` from ever appearing as a checkable candidate, even when unassigned.

### Universal Species-Cap Enforcement — Box Membership Only (SETTLED — v0.44)
`checkSpeciesCap()`'s exemption guard is `if(individual.holder||individual.breeding) return;` (not `holder` alone), and its `liveNonShinyBox` filter excludes both `p.holder` and `p.breeding`. `sweepSpeciesToCap()` (the global cap-lowering sweep) has the identical exclusion on its `allBoxed` filter. `checkSpeciesCap(p)` is called at every point a Pokémon becomes box-eligible (`holder` and `breeding` both become falsy): `unassignPokemon()` (after `p.holder=null`), `releaseDaycarePair()` (after `p.breeding=false`, both parents), and Day Care Research Mode's pair-release step (functionally identical to `releaseDaycarePair()`). No call needed on the reverse transition (into party or into breeding) — that direction can only hold steady or reduce a species' box count, never push it over cap.

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
- **`getFamilyDexIds(dexId)`** — returns every dexId in a species' evolutionary family, by calling `getFamilyMembers(entry.familyId)` (never a raw `EVO_TREE` walk — see the Implementation Note below for why). Did not exist prior to v0.32.
- **v0.37:** now also triggers for perfect-IV incoming individuals, since they're no longer exempt from `checkSpeciesCap()` entirely (see "Perfect-IV Species-Cap Exemption" below). A donor that isn't itself perfect can never make a recipient perfect — donation copies IVs wholesale, so this can't manufacture additional perfect-IV individuals beyond ones directly rolled at creation.
- **Implementation Note:** family-pool lookups (here and anywhere else that needs "every dexId in this evolutionary family") must go through `getFamilyMembers(familyId)`, never a raw `EVO_TREE` edge-walk — `EVO_TREE` only holds the ~27 rows for branching-evolution special cases; ordinary single-path lines are defined purely via `evolvesIntoId` in `pokedex.js` and are invisible to an EVO_TREE-only walk. See Data Architecture / Species Identity and Resolved Bug Index.

### Per-Species Cap Overrides (SETTLED — v0.38, NEW)
- New `state.speciesCapOverrides = {dexId: number}` map (default `{}`) — lets a specific species' effective cap differ from `state.speciesCap`, in either direction (higher or lower).
- **Set/edit:** a field at the bottom of Species Detail (above the caught-individuals list) shows this species' effective cap (override if set, else the global default) and is directly editable inline.
- **Audit/bulk view:** a "View All" button next to that field opens a modal listing every species with an active override — each row inline-editable, plus a ✕ to delete (reverting that species to the global default).
- **Range: 0–99.** 0 is valid — that species can never be held in the box at all (party-only), same box-only semantics as the global cap.
- Slots into the same `checkSpeciesCap()` logic as the global cap: box-only counting, box-only release pool, same IV-donation eligibility rules — the override value is simply substituted for `state.speciesCap` when one exists for that dexId.
- **Lowering an override** (including deleting one that drops the effective cap) triggers the same confirm-and-sweep behavior as lowering the global cap dropdown — box-only, shiny-exempt.
- Part of the SAVE_VERSION 24 → 25 bump (see Versioning). Migration: `speciesCapOverrides:{}` defaulted on every load.

### Species Cap Enforcement on Evolution + Release Priority (SETTLED — v0.35)
- Cap check fires after both catches and evolutions, via a unified helper (`applySpeciesSwap()`, called by every evolution path, is included — not just `catchPokemon()`). Priority order:
  1. **IV-donation** (unchanged existing logic) — if any family-tree member has a lower IV total than the new/evolved individual, donate IVs to it and discard the newcomer.
  2. **Otherwise, release the weakest individual across the full same-species *boxed* pool** (v0.38: box-only, was previously the full pool including party) — compare by **total equipped-move power** (sum of all 4 `equippedMoves[].power` slots), releasing the **lowest** total. Ties broken by **catch order** (`p.id`, ascending = earlier): the **later** catch is released, keeping the original/longest-held individual.
- This replaces the old "always release the newcomer on overflow" fallback for both catches and evolutions — an existing weaker individual can now be released instead of the new arrival.
- No SAVE_VERSION impact.

### Species Detail Form Selection (SETTLED — v0.41)
- Every "click into Species Detail" handler must set `dexSelectedFormName=entry.formName||null` — reading the clicked entry's actual form, never hardcoding `null` — because "form-only" species (whose only Pokédex row already has a non-null `formName`, with no null-form sibling row at all; 35 dexIds dataset-wide, Nidoran♀/♂ are the only two reachable in this Kanto-scoped game) get force-mismatched against every filter keyed on `(p.formName||null)===(dexSelectedFormName||null)` otherwise.
- `dexSelectedFormName` is transient, page-local UI state, never written to `state` — no SAVE_VERSION impact, and a fix here self-heals every existing save on load.

---

## Day Care / Breeding System (SETTLED — v0.26, revised v0.27, v0.28, v0.29)

### Location & Slots (revised v0.27)
- **v0.27:** Day Care is its own standalone map location — `locationId: pokemonDaycare` ("Pokemon Daycare"), connected only to Route 5 (`travelTime: 1`, `heals: true`, `mapCol: 121`, `mapRow: 94`). `defaultEncounterMethod` is populated (`"cave"`, an Excel-template artifact) but functionally inert — the Daycare has zero `encounters.js` rows, so the value is never read. `DAYCARE_LOCATION_ID` points at `pokemonDaycare` instead of `route5` (previously buried inside Route 5's generic location panel).
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

### Multi-Aide Access (SETTLED — v0.40)
The facility (`state.daycareSlots`) is global/shared — no per-aide state exists there at all. Any aide physically present at the Day Care can manage breeding (breeding-pair selection, egg pickup, etc.) — the deciding check is "is *this* aide at `DAYCARE_LOCATION_ID`," not a hardcoded Carl Oak check. Both aides can be at the Day Care simultaneously with zero conflict, since nothing about the feature is aide-scoped once past the "who unlocked the UI" gate.

### Pair Selection UI (SETTLED — v0.28, revised v0.29)
- The old two-`<select>` dropdown pair-picker is replaced with a **two-step sprite-row picker**, same row style as the All Catches list (sprite + name + level + gender + held/box icon).
- **Step 1:** lists Parent A candidates (`getDaycareEligiblePokemon()` — everyone not already `breeding`) as tappable rows.
- **Step 2:** header shows the chosen Parent A; list re-renders showing only Parent B candidates passing `canBreedPair(parentA, candidate).ok` — incompatible candidates (wrong egg group, same gender, already breeding, etc.) are **hidden entirely**, not grayed out. A "← Back" control returns to step 1.
- Tapping a Parent B row shows the existing result preview and a "Drop Off Pair" confirm button, same as before — only the selection mechanism changed, not the confirm/preview logic.
- **v0.29: both steps now sort by family number → evolution order → dex number**, instead of catch order — reuses the same family-grouping logic as `getFamilyMembers()` (Families tab), for readability only. No visual dividers between families, just sort order.
- **Ditto always first (v0.44):** `sortDaycareList()`'s comparator gains a leading key ahead of the family/evolution/dexId sort — any Ditto entry sorts first, unconditionally. Applies identically to both Parent A and Parent B pickers.
- Display/interaction-only — no `state` schema change.

### Day Care Research Mode (SETTLED — v0.44)
New per-aide checkbox, backed by persisted `aide.researchMode` (boolean, default `false`) and `aide.researchPair` (`{parentAId, parentBId, resultDexId, nextReadyAt, eggsQueued}` or `null`) — **requires the SAVE_VERSION 28→29 bump**, see central Versioning table. Lives inside `renderMethodPrefs()`'s Encounter Methods panel, scoped to when the Day Care itself is the selected destination, not a global toggle. Toggling it on immediately attempts pair selection if none is active, independent of hitting Dispatch. `researchPair` is functionally parallel to a `daycareSlots.slots[]` entry but tracked separately and never counted against `daycareSlots.purchased` capacity.

Selection pool is box-only (`!p.holder && !p.breeding`), restricted to `canBreedPair()`-compatible pairs, preferring a pairing whose result species isn't yet `breedingTested`; falls back to any valid compatible pair if none are untested; stays `null` if no valid pair exists at all. Selected parents are locked (`p.breeding=true`) exactly like a manual pair.

`updateResearchModePairs()`, called once per aide at the top of `gameTick()` alongside `professorAutoTestEvolutions()`: for every aide with `researchMode` and no active `researchPair`, attempts selection. For every aide with an active `researchPair`, advances its egg queue using the same remainder-preserving interval loop `updateDaycareQueue()` uses — this runs regardless of the aide's location, so the clock never pauses. When that aide is physically at the Day Care and `eggsQueued>=1`, the switch fires: collect all queued eggs through the exact same pipeline `collectDaycareSlot()` uses, set `breedingTested` for the result species, release both parents (including the `checkSpeciesCap()` call from "Universal Species-Cap Enforcement" under Pokémon Storage), clear `researchPair` to `null`, then — only if `researchMode` is still `true` — immediately select a new random pair. Unchecking the box takes effect this way: it doesn't stop anything mid-cycle, it just prevents the next pair from being picked once the aide is next physically present for a switch.

Read-only "Research Pairs" section on the Day Care screen — sprite row (reusing `daycareSpriteRowHtml()`) + live countdown per aide with an active `researchPair`, no manual buttons; fully automatic. Multiple aides can run Research Mode in parallel, naturally non-colliding since a locked individual (`p.breeding`) can't be selected by a second aide's pair-selection pass.

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
- **Implementation Note:** egg-group and breedability checks must match the data's actual string values, not an assumed/mainline-style label — `isUndiscoveredOnly()` matches literal `'No eggs'` in this dataset, not `'Undiscovered'`.

### Result Species
- The result is always the **lowest-evolution root** of the **female** parent's family (or the non-Ditto parent's family, if Ditto is involved) — mirrors the mainline "mother determines species" rule.
- **Dual-root family exception (v0.38, NEW):** a small number of families have no shared baby stage at all — two (or more) independent roots instead (currently just Nidoran♀/Nidoran♂ in this dex's data). For these, species determination is **random among the family's roots** (50/50 for a 2-root family), regardless of which parent, gender, or Ditto involvement produced the egg — matching the real games' handling of this specific case, which is an explicit exception to "mother determines species," not an application of it. Generalizes automatically to any future dual-root family (derived from the data, not hardcoded to Nidoran specifically) — single-root families are completely unaffected.
- **No incense mechanic, no variability** — explored and deliberately dropped in favor of a fully deterministic result (the one explicit dual-root exception above aside).

### Result Preview
- Shows the real predicted species name if it has already been seen by any means (`seenDexIds`) — reuses existing dex-tracking infrastructure, no new "confirmed breeding result" system.
- Shows `?` if the predicted species hasn't been seen yet, resolving automatically once it's collected (same seen-based reveal pattern used throughout the Families Tab — see "Evolution Chain Visual").

### Storage & Timing
- Hatched babies are subject to the existing per-species cap (see "Per-Species Catch Cap" above, now player-editable) — applied individually per egg, same as any other catch.
- **Hatch time formula:** `minutes = max(1, round(eggCycles × 0.176))`, derived from each species' existing `eggCycles` field (already present in the data — no new column needed). Calibrated so a ~20-cycle species lands at ~5 minutes; range across the actual data (5–120 cycles) works out to roughly 1–21 minutes.
- Processed like a mission — live countdown while the app is open, offline catch-up on return.

### Continuous Batch Hatching (SETTLED — v0.28, log events extended v0.37)
- Slot record fields: single-use `readyAt` replaced by `eggsQueued` (int, starts 0) + `nextReadyAt` (an ongoing anchor that keeps advancing, doesn't reset until pulled) — supports offline accumulation instead of one baby per drop-off.
- `updateDaycareQueue(slotIndex)`: while `Date.now() >= rec.nextReadyAt`, increments `eggsQueued` and advances `rec.nextReadyAt += hatchMinutes*60000` — a remainder-preserving loop, same pattern as `processOfflineTime()`'s mission catch-up. Called on `buildDaycareHtml()` render and at the top of `collectDaycareSlot()`, so it's correct whether the app was open or closed.
- **Collection:** `collectDaycareSlot()` runs the queue update, then hatches **all** queued babies in one go, each individually through the full pipeline: `makePokemon` → `dexHistory` → `recordAbilityObserved` → `recordCapture` → `checkSpeciesCap` → `logCaptureRarity` → `recordNewSpecies` (per-species cap release still applies per-egg). The slot is **not** cleared — `eggsQueued` resets to 0, the pair stays assigned, `nextReadyAt` keeps counting from where it left off. Log line is a batch summary, e.g. "Collected 20 eggs at the Day Care! (18 kept, 2 released — species cap) — 3 new species, 1 shiny!" (each category omitted if zero).
- **Uncapped** — however many intervals fit in the elapsed time, same philosophy as mission offline catch-up.
- `releaseDaycarePair()` ("Pull Out") ends the loop and returns parents to the box, forfeiting any uncollected `eggsQueued`. Confirm dialog warns about this if `eggsQueued > 0` at the time.
- `buildDaycareHtml()` slot display shows a live queue count (e.g. "3 eggs ready · next in 1:24") — Collect button enabled whenever `eggsQueued > 0`.
- SAVE_VERSION 19 migration: any slot with the legacy `readyAt` field converts to `nextReadyAt: readyAt, eggsQueued: 0` on load.
- **Implementation Note:** any acquisition pathway that bypasses the normal wild-encounter flow (breeding is the current example) must explicitly call the full side-effect pipeline above — `logCaptureRarity()` and `recordNewSpecies()` are not fired automatically just because `recordCapture()` ran, since eggs skip the normal encounter/sighting phase entirely.

### Shiny Rolls at Hatching (SETTLED — v0.30)
- Day Care eggs roll for shiny: `Math.random() < 1/4096` per egg, no ball consumed.
- **Rolled at pickup, not at incubation** — `eggsQueued` is a plain counter with no
  per-egg record, so no Pokémon object (and thus no shiny flag) exists until
  `collectDaycareSlot()` calls `makePokemon()` for each egg. Collecting a large batch
  at once rolls shiny independently for each egg in that same batch, all at the moment
  of collection — not spread out chronologically as each egg finished incubating.

### Dex Display — Breeding Status (SETTLED — v0.30)
- Three display sites check `p.breeding` first, ahead of the `holder`/unassigned fallback, and show **"🥚 At Day Care"** in place of "📦 Unassigned" / "Held by: —" (no dimmed `.unassigned` styling, since it isn't idle): `renderDexViewAll()` (All Catches tab), `renderDexDetail()` (a species' "Your Catches" list), `showPokemonDetail()` (individual Pokémon modal's "Holder:" line).
- The other Dex views (`renderDexPokedexGrid()`, `renderDexFamilies()`, `renderDexSpecies()`) don't show per-individual Held/Boxed status at all — nothing to change there.
- Reads the existing `p.breeding` field — no schema change, no SAVE_VERSION impact.

### Interaction with the Families Tab Root-Placeholder Fix
- Day Care is the primary intended path for filling in a family's previously-unseen root (e.g. Pichu) — see "Evolution Chain Visual" for the display-side fix this feeds into. No special-cased interaction is needed: once a bred Pokémon is collected, it's logged into `seenDexIds` exactly like any other catch, which is what resolves the root placeholder.

---

## Nicknames (SETTLED — v0.20)
- New optional field `nickname` on individual Pokémon objects (`state.dex` entries, referenced by `state.party`)
- **Trigger:** editable only via poke-modal detail view — no prompt on catch
- **Display rule:** anything referring to a specific Pokémon instance uses `getDisplayName(p)` — `p.nickname` if set; otherwise `p.species`, with `" ("+p.formName+")"` appended for a form-variant individual (e.g. "Raichu (Alolan)"); anything species-wide (Family/Species cards, route encounter tables, shop, evolution method lists) continues to use the species name directly. `getDisplayName()` replaces raw `p.species` at every instance-level display/log site: party list, poke-modal header, all `addLog()` calls referencing a specific Pokémon (catch, faint, win, EXP, level-up, evolution, revive)
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

### Official Pokédex / Your Pokédex (SETTLED — v0.37, NEW)
- **Entry screen:** tapping the Dex bottom-nav tab now first shows a chooser — **"Official Pokédex"** / **"Your Pokédex"**. First-ever visit (per device) defaults here; every subsequent visit auto-jumps to the last-visited mode + sub-tab combo.
- **Persistence: device-local, outside the save file** — same pattern as the Theming System (see below), a single "last destination" value overwritten on every navigation. No SAVE_VERSION impact.
- **Your Pokédex:** unchanged from pre-v0.37 behavior — Pokédex/Families/All Catches sub-tabs, all existing research-gating (silhouettes, ability/gender/evolution/encounter reveals) untouched.
- **Official Pokédex:** same visual shell, but every research-gated section is bypassed to show complete data regardless of research/catch progress:
  - Grid: full-color sprite for every species, always clickable — no `?`/silhouette states.
  - Abilities: always shows the real name, never "Unknown."
  - Gender ratio: true canonical `genderMalePct` from data, not the observed-count % used in Your Pokédex (see "Gender Ratio Display" below).
  - Evolution Chain visual: fully connected, no "unconfirmed via breeding" placeholders.
  - Evolution Methods panel: pulled directly from `EVO_TREE`, no confirmed/tested/ruled-out gating.
  - Encountered At: all locations from `ENCOUNTERS` data, not gated by `locationEncounterLog` visit history.
  - Species Detail's "Caught individuals" list: hidden entirely — pure species-level reference, decoupled from ownership.
  - Sub-tabs: **Pokédex, Families, Species** — no "All Catches" (ownership-only concept, doesn't apply here).
- **New "Species" sub-tab** (Official Pokédex only): same list mechanics as "All Catches" (see "All Catches View — Sorting, Filtering, Search" below), one row per dexId — forms handled via the existing form-tab toggle after drilling into Detail, not a separate row per form.
  - **Sort:** Dex #, Family #, Total (species base stat total, `entry.bst` — same underlying value as "BST" in All Catches, relabeled here since there's no individual "Stats" to disambiguate from), HP, ATK, DEF, SpATK, SpDEF, SPD (all from the species' base stat columns).
  - **Filter:** All, Type, Move Type — reuses `getAvailableMoveSlots(entry)` (the same helper that picks a wild Pokémon's default move) to match species that can ever use a move of the selected type against their possible move pool. Ownership-only filters (Un/Assigned, Shiny, Perfect IV) don't apply at species level and are dropped.
  - **Search:** same live "contains" match, against species name and Dex #.
  - **Row layout:** `#Dex Name` + type badge(s) (shared `typeBadgeHtml()`) on the header line; details line shows `Total: ###`; no catch-# text (nothing replaces it).
- **Top control row** (species-cap row, repurposed): now holds, left to right:
  - **"◀ Back"** — returns to the Official/Your Pokédex chooser. Separate from the existing subnav "◀ Back," which still handles Detail→Species/Families drill-down within whichever mode is active.
  - **"Shiny" toggle** (Official Pokédex only) — forces every sprite in Official mode to its shiny palette when ON. No effect in Your Pokédex mode, which always reflects real caught/individual shiny status regardless of toggle position.
  - **Per-Species Cap dropdown** (Your Pokédex only, hidden in Official mode — this setting only governs your own roster).
- No SAVE_VERSION impact.

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
- **New field:** `researchLog[dexId].firstCaught` — fires a new finding, **"🎯 Captured: [name]"**, on first successful catch (distinct from "🆕 New Species", which fires on first *sighting* instead of first catch).
- **Implementation Note:** `recordSighting()`/`recordNewSpecies()` must fire at encounter generation (`resolveEncounterStep()` live, `processOfflineTime()` offline) regardless of catch outcome — a flee/loss/missed-ball still counts as "seen." Gating these on catch success alone silently breaks the Seen state for anything only ever encountered, not caught.
- **Findings report dedupe:** findings are tagged with `dexId`. If a species has both a "seen" and "captured" finding pending in the same `showFindingsReport()` batch, only "🎯 Captured" renders.

### All Catches View — Sorting, Filtering, Search (SETTLED — v0.22, extended v0.36, overhauled v0.37)
- `sort-select` gains a `family` option alongside Catch #/Dex #/Level/HP/BST — sorts by `familyId` (via `getPokemonEntry(p.pokedexId).familyId`), with `dexId` as a secondary tiebreaker so same-family members stay grouped and ordered sensibly.
- **v0.36:** filter dropdown gains **💥 Perfect IV** (`isPerfectIV(p)`, inclusive of unicorns) and **🦄 Shiny+Perfect** (exact intersection). Sort dropdown gains **Sort: IV Total** (sum of the 6 IVs, descending — matches the existing Level/HP/BST convention). No SAVE_VERSION impact.
- **v0.37 — full sort/filter/search overhaul:**
  - **Sort** (unchanged dropdown, left side): Dex #, Family #, Stats (individual's actual current stat total via `calcBST(individual)` — HP+ATK+DEF+SpATK+SpDEF+SPD at current level/IV/nature), BST (species' static base stat total, `entry.bst` — distinct from Stats), Level, IV Total, Catch #.
  - **Filter (right side) — converted from single-select dropdown to a checkbox popup:** All, Unassigned, Assigned, Shiny, Perfect IV, Type (single-select popup using the existing colored type-rectangle picker), Move Type (single-select popup, same picker — matches if any of the individual's 4 `equippedMoves[]` slots is that type).
    - **Cross-category logic: AND** (e.g. Shiny + Type:Fire → must be both).
    - **Same-category logic: OR** (applies to Assigned/Unassigned specifically, since Type/Move Type are single-select and Shiny/Perfect IV are standalone).
    - **Assigned/Unassigned are mutually exclusive checkboxes** — checking one auto-unchecks the other, rather than a same-category OR exception living in an otherwise-uniform AND engine. Unchecking either restricts nothing (shows both).
    - **All:** stays checked visibly; other checkboxes remain checked underneath but grayed out/inactive while All is active — unchecking All restores their previous state.
  - **Search bar**, new, below the dropdowns: live-filter as you type, case-insensitive "contains" match against species name, nickname, catch #, dex #, and holder name.
  - **Type badge on each entry:** shows both of the individual's type(s) — using their actual **form's** type, not base species — as colored rounded-rectangle badges (same component as Species Detail), positioned after the name and before the catch #.
  - Shared `typeBadgeHtml()` helper extracted to global scope (previously duplicated as a locally-scoped arrow function inside `renderDexDetail()`/`showPokemonDetail()`) so it can be reused across this list, the Species tab (see "Official Pokédex / Your Pokédex" below), and the new Type/Move Type popups.
  - No SAVE_VERSION impact — sort/filter/search state is transient UI state, same as before.
- **Bidirectional sorting (v0.43):** a ▲/▼ toggle button sits next to the sort dropdown, backed by `DEX_SORT_DEFAULT_DIR` (per-field defaults: `id`/`dexid`/`family` ascending, everything else descending) plus transient `dexCatchesSortDir`/`dexSpeciesSortDir` state. Selecting a *different* field resets to that field's own default direction; the toggle flips the *current* field's direction. Both `renderDexViewAll()` and `renderDexOfficialSpeciesList()` comparators are rewritten to a canonical ascending expression per field, wrapped `dir==='asc'?cmp:-cmp`.
- **Friendship display (v0.44):** each catch's detail line shows `· Friendship:X` (`p.friendship||0`), matching the format `renderDexDetail()` already shows on the species-detail individuals list, appended after the BST readout.
- **"Has Nickname" filter (v0.44):** new boolean checkbox in `renderDexFilterPopupContent()`'s filter popup, positioned after Perfect IV, before the Type/Move Type pickers — `matchesCatchesFilters()` gains `if(f.hasNickname&&!p.nickname) return false;`. A simple boolean, not a mutually-exclusive has/doesn't-have pair like Assigned/Unassigned. `dexCatchesFilters` is transient UI state, not persisted — no schema impact.

### Family Grouping — `getFamilyMembers()` (SETTLED — v0.18 fix)
- Returns one entry per unique `dexId` within a family, preferring the `formName: null` row where one exists, but **including dexIds whose only database rows have a non-null `formName`** (gender-locked base species like Nidoran♂/♀, which have no null-form sibling)
- True alternate-form variants (Mega, Alolan, regional forms) that share a `dexId` with an existing null-form row still collapse to a single representative entry — they are not multiplied
- Generated by `converter.html` — this fix must land in both the generator and the current `pokedex.js` output, or it is lost on the next Excel→JS regeneration
- **Nidoran naming (v0.22):** the two Nidoran rows are named `Nidoran♀` (dexId 29) / `Nidoran♂` (dexId 32) in the Excel sheet, not `Nidoran` twice — disambiguates every name-string display site (family card, species card, species detail, logs, findings) and the legacy name-keyed fallback lookup in `makePokemon()`. Data-only change, no code required.

### Species Detail Page
- Header: sprite (91×91), name, type badges, all observed stats
- Height/weight shown in feet/lbs (converted from metric)
- Ability observation tracker — see "Persistent Ability-Observation Display" below (v0.36 rebuild)
- Gender observation tracker — see "Persistent Gender-Observation Tracking" below (v0.36, NEW)
- Evolution research section (see below)
- **Encountered At (v0.22):** lists every location where `state.locationEncounterLog[locId][dexId].seen ≥ 1` for the viewed species. Per the Dex philosophy above, unvisited-with-this-species locations don't appear at all — not even as `???`. For each qualifying location, shows the actual table percentage(s) and method(s) — reusing the same normalization the Map Detail Panel already uses for `encounters.js` rows, so numbers always match between the two screens. Multiple methods/rod-tiers at the same location each get their own line. Positioned below the ability/gender-ratio stats, above the individual-catches list.
- List of all individual catches: "X held / Y total ever"

### Dex Tab Lifetime Stats (SETTLED — v0.20)
- Header row: `Catches | Encounters | Species | Dex Pages Completed` — replaces the prior `Catches | Families` row (Families stat removed entirely)
- **Catches:** `state.totalCatches` (unchanged)
- **Encounters:** `state.totalSightings` — total wild encounters ever, online + offline
- **Species:** count of keys in `state.dexHistory` — unique dexIds ever discovered (caught or evolved into)
- **Dex Pages Completed:** count of species where BOTH are true:
  - Evolution research complete: `testedMethods.length >= EVOLUTION_METHODS.length` (read live — see "Evolution Method Enum" above). `isFullyTested()` already reads this live and is the canonical check — `isDexPageComplete()` reuses the same pattern rather than a separate hardcoded threshold.
  - All ability slots observed: every non-null ability the species has (`ability1`, `ability2`, `hiddenAbility`) has been seen at least once, per `researchLog[dexId].abilitiesObserved`
- **New field:** `researchLog[dexId].abilitiesObserved` — tracks which ability slots (`ability1`/`ability2`/`hiddenAbility`) have been observed at least once for that species. Written whenever a Pokémon is caught or evolves into that species, checking its `p.ability` value against the species' ability slots. Survives releases and cap overflow — never decremented.
- **Save migration:** backfills `abilitiesObserved` by scanning all current `state.dex` individuals' `ability` field against their species at load time (best-effort — cannot recover abilities from Pokémon already released before v0.20)

### Persistent Ability-Observation Display (SETTLED — v0.36 fix)
- The "Observed Abilities" section on Species Detail was built from **currently-held individuals only** — releasing or evolving away the one individual with a given ability slot silently removed it from this display, even though `researchLog[dexId].abilitiesObserved` (used elsewhere to gate dex completeness) correctly remembers it forever.
- Fixed: rebuilt to list every ability slot the species has (Ability 1, Ability 2 if present, Hidden Ability if present), each showing the real name if `abilitiesObserved` has it flagged, or **"Unknown"** (dimmed) if not — directly mirroring what `isDexPageComplete()` actually requires, which was previously invisible to the player (methods could show 100% tested while the page still wasn't "complete," with no explanation why). No SAVE_VERSION impact — reads existing data.

### Ability Slot Tracking — Fixes Ability Loss/Mismatch on Evolution (SETTLED — v0.38 fix, NEW)
- **Bug:** an individual's `.ability` was only ever rolled once, at creation (`assignAbility()`, the sole call site). Evolution (`applySpeciesSwap()`, shared by every evolution path) never touched it — the pre-evolution species' ability name carried over unchanged after evolving. Since evolution stages almost always have disjoint ability pools, `recordAbilityObserved()` would then compare a stale, non-matching name against the *new* species' ability list and silently fail every time — meaning any species typically obtained by evolving (not caught wild) could show "Unknown" for every ability slot forever, regardless of how many times it was evolved into. Not just cosmetic: the individual's actual stored `.ability` was a name that didn't exist anywhere on its current species at all.
- **Fix — ability slot, not ability name, is the persistent identity** (matches how the real games handle it: an individual is tied to a fixed slot — Ability 1, 2, or Hidden — set once at origin; evolution keeps the same slot, only the resulting name changes). New field `p.abilitySlot` (`'ability1'|'ability2'|'hidden'`), set by `assignAbility()` alongside the name at creation. `applySpeciesSwap()` now recomputes `p.ability` from the individual's existing `abilitySlot` against the **new** species entry on every evolution (falling back to `ability1` if the new species doesn't populate that slot). `recordAbilityObserved()` now always matches correctly post-evolution as a result.
- **One-time migration:** for every existing individual, `abilitySlot` is backfilled by matching current `p.ability` against the current species' three ability fields; where no match is found (the bug's existing mismatched cases), a fresh ability+slot is rolled via `assignAbility()` against the individual's *current* species. `recordAbilityObserved()` is then re-run across the full dex so previously-blocked `abilitiesObserved` flags backfill retroactively too.
- Part of the SAVE_VERSION 24 → 25 bump (see Versioning).

### Gender Ratio Display (SETTLED — v0.36, revised v0.37)
- **v0.36:** same problem existed for the Gender line as the ability fix above, except there was no persistent flag at all to begin with. New `recordGenderObserved(dexId, gender)`, mirroring `recordAbilityObserved()`, added at all 7 of its existing call sites (4 catch paths, evolution's `applySpeciesSwap`, Day Care hatch, load-time backfill sweep). New persisted field `researchLog[dexId].gendersObserved = {M: bool, F: bool}`, displayed as "Seen"/"Unknown."
- **v0.37 — replaced with running counts and a percentage display.** `gendersObserved` changes shape to `{M: count, F: count}`; `recordGenderObserved()` increments instead of setting a flag. Once at least one individual of either gender has been recorded, Species Detail shows `Male: X% · Female: Y%`, computed as `Male% = round(M/(M+F)*100)`, `Female% = 100 - Male%` (always sums to 100, no decimals). If one gender has 0 recorded and the other has ≥1, the 0-count gender shows `0%` immediately, not "Unknown."
- Stays combined across all forms per dexId (unchanged convention, matches the Abilities section), only for genders the species can actually have (per `genderMalePct`); fully genderless species show nothing.
- Species with `genderMalePct: null` on every form (genderless species — Ditto, legendaries, several golems) continue to skip this section entirely — pre-existing, correct exclusion, unaffected by this change.
- Part of the SAVE_VERSION 23 → 24 bump (see Versioning). Migration: booleans convert to counts, best-effort backfill from currently-held individuals only (same limitation as the original v0.36 backfill — historical released/evolved-away individuals aren't recoverable).

### Evolution Doesn't Log New Species as Captured (SETTLED — v0.36 fix)
- `applySpeciesSwap()` called `recordNewSpecies()` on evolution but never `recordCapture()`, despite `dexHistory` incrementing correctly — the "🎯 Captured" finding never fired on evolution, only "🆕 New Species." Fixed: added the missing `recordCapture(newEntry.dexId, p.species)` call. No SAVE_VERSION impact.

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

#### Evolution Method Enum (SETTLED — v0.33: derived live, never hardcoded)
- `EVOLUTION_METHODS` is computed live at load time (after `items.js` loads, before it's ever referenced): the 7 non-item methods (`level`, `friendship`, `friendship-day`, `friendship-night`, `use-move`, `in-party`, `shed` — `shed` added v0.42 for Shedinja) plus the name of every item in `ITEMS_DATA` where `effect==='evolve-stone'` or `effect==='evolve-trade'`. Current total: **51**.
- **Implementation Note:** never hand-maintain this (or any similarly derived) enum as a static array kept "in sync" with `items.js` by hand — it will drift the moment an item is added with a matching `effect` and the array isn't also updated, and any completeness check built on `.length` (e.g. `nonEvolutionConfirmed`, above) will silently miscount as a result. Always derive live from the actual data.
- All UI/logic referencing the total reads `EVOLUTION_METHODS.length` live, unchanged principle from prior versions — only the array's construction differs.

#### Professor Auto-Test Loop
- Evolution stones and items live in the **Professor's inventory** (`state.professorBag`)
- `level`, `friendship`, `friendship-day`, and `friendship-night` evolutions are confirmed automatically when observed in the field — they do not require a separate Professor action
- **v0.24 — `use-move` and `in-party` added to the same auto-confirm treatment as level/friendship:** both are checked on level-up (not via the Professor's item-test loop) and confirmed automatically when observed — see "Move-Based Evolution" and "Party-Based Evolution" below for the condition checks themselves.
- **v0.20:** `professorAutoTestEvolutions()` is extended to also test EVO_TREE `use-item` branches (branching species only), matching directly by itemId. Confirmed branches are appended to `confirmedBranches`, not overwritten.

##### Trigger — Per-Tick Passive Check (SETTLED — v0.33)
- `professorAutoTestEvolutions()` runs unconditionally at the very top of `gameTick()`, on every 1-second base tick, before any of that function's early `return`s — regardless of how or where a Pokémon was created. Cheap in steady-state: already-tested species×item pairs are skipped via `testedMethods.includes()`.
- **Implementation Note:** this must be a single centralized per-tick check, not an explicit call at each Pokémon-creation site — a species' first individual can arrive via wild catch, shiny auto-catch (live or offline), offline regular battle-catch, or Day Care hatching, and any creation path that instead relies on someone remembering to call the trigger explicitly will eventually miss one.

##### Party-Priority Reservation (SETTLED — v0.44)
On purchase of an evolve-stone/evolve-trade item, `buyItem()` scans all aides' parties (not just the shopping aide's) via an extended `getPartyEligibleForItem()` for eligible individuals — confirmed or unconfirmed branches both count, same exclusions as today (`evolveBlocked`, nickname-lock narrowing). 0 eligible → unchanged, `professorAutoTestEvolutions()` proceeds normally next tick. Exactly 1 → evolves it immediately and synchronously (same pipeline `confirmBatchEvolve()` uses), no modal, 1 unit consumed. 2+ → shows the existing checkbox modal and adds the full purchased quantity to a transient (non-saved) `itemReservations[itemId]` map; `professorAutoTestEvolutions()`'s box-eligibility check treats available stock as `(professorBag[itemId]||0) - (itemReservations[itemId]||0)`. The reservation releases when the modal resolves via either Skip or Evolve Selected. Replacing an already-open modal with a new one (a second evolve-item purchase before the first resolves) releases the old modal's reservation first, keyed off its own itemId, to prevent a permanently stuck reservation.

##### Confirmation Requires a Live Candidate — Test and Apply Are One Event (SETTLED — v0.33 revision)
- **Design correction (v0.33):** a species×item combination splits into two structurally different kinds of "knowing," previously conflated:
  - **Ruling an item out** (no matching `EVO_TREE`/single-target branch exists for that species at all) is a **data fact** — no live subject needed, checkable from the reference data alone. Marked tested/ruled-out immediately, unchanged from prior versions.
  - **Confirming an item works** is an **experimental claim** — it requires an actual live trial on a real, eligible individual. Prior versions (v0.21 through v0.32) confirmed a branch into `confirmedBranches` the moment a matching item+species pair was found, *independent* of whether an eligible individual existed to receive it — so owning e.g. a Water Stone alongside a single Eevee that had already evolved via Fire Stone would still confirm "Eevee → Vaporeon (Water Stone)" as known Professor research, despite that evolution never having actually happened. This let players see the full branching evolution map for a species (Eevee, Raichu, etc.) from partial ownership, contradicting the stated design intent under "Evolution Research" above ("You don't know if or how a Pokémon evolves until you observe it happening").
- **Fix (v0.33):** for a matching item+species pair, `testedMethods`/`confirmedBranches` are **not** written unless an eligible candidate (`!holder && !evolveBlocked`, same eligibility rule as before) actually exists at test time. If found: that candidate evolves immediately, the item is consumed, and that single event is both the test and the confirmation — they can no longer happen independently. If no candidate exists: the method stays genuinely untested for that species — not confirmed, not ruled out — and is retried automatically on the next tick (see Per-Tick Passive Check above) with zero additional plumbing, so a later-caught eligible individual picks it up automatically.
- With multiple eligible items and/or multiple candidates present simultaneously, evolutions still happen one at a time in loop order — each consumed candidate stops matching for the next item's check within the same pass, exactly as before this fix (this part of the mechanism, and the "highest-level individual wins ties" rule, is unchanged).
- The manual per-Pokémon evolve button (see Manual Evolution Trigger below) is unaffected — it still exists for additional individuals of an already-confirmed species, or a different branch of a branching species.
- **Migration (v0.33, folded into the SAVE_VERSION 21 bump):** existing saves cannot retroactively distinguish a legitimately-earned confirmation from a phantom one under the old rule — the old data doesn't track which. For every species' research log, any `testedMethods`/`confirmedBranches` entry for an item that **has** a real matching branch is wiped; entries for items correctly ruled out (no matching branch) are left untouched, since those were never phantom. Non-item methods (`level`, `friendship`, `friendship-day`, `friendship-night`, `use-move`, `in-party`) are untouched — those were already gated on real individual state via other mechanisms and were never phantom. This is a real, visible loss of dex research completion for existing saves — most of it self-heals quickly post-update since the per-tick check immediately re-evaluates every species against whatever is already sitting in the bag.
- **v0.21 — shared apply-logic (unchanged by v0.33):** the species-swap block (species/dexId swap, `maxHP` recalc, `SPECIES` registration, `recordNewSpecies`, `recordAbilityObserved`, `dexHistory` increment) is extracted into one helper, `applySpeciesSwap(p, newEntry)`. All call sites — `checkEvolution()`'s three branches, `applyItemEvolution()`, and the auto-apply path above — call this helper instead of duplicating the block. Do not re-duplicate this logic in future changes. **v0.33 addition:** also writes `p.formName` from the target entry — see "Same-DexId Branching Form Evolutions" below.
- **Fix (v0.26) — unified item matching:** Path 1's matching is a single check, independent of the item's `effect` field: `entry.evolveMethod==='use-item' && entry.evolveItem===itemName`. This covers stones and Link Cable-style items identically — `effect: evolve-stone` vs `effect: evolve-trade` has no functional difference anywhere in the codebase as a result.
- **Implementation Note:** never key evolution-item matching on the item's `effect` field alone (`evolve-stone`/`evolve-trade`) — match on `evolveMethod==='use-item'` + `evolveItem` name. Once the data standardizes on a single `evolveMethod` value for all item-based evolutions, an `effect`-keyed check silently stops matching anything for whichever `effect` it doesn't cover.
- **Data audit (v0.26, ongoing — not a code fix):** a full pass of every unique `evolveMethod`/`evolveLevel`/`evolveItem` triple against the matching code turned up 18 evolution items referenced in the Pokédex sheet with no corresponding row in the Items sheet at all — resolved and verified v0.28, see Resolved Bug Index.

##### Migration-Wipe Gating (SETTLED — v0.35)
- The v0.33 migration that wipes `testedMethods`/`confirmedBranches` for use-item evolutions (see above) is gated behind `data.version<21` — it runs exactly once, only for saves genuinely predating v0.33's confirmation-semantics change.
- **Implementation Note:** any one-time data migration must be gated on the save's version, never run unconditionally in `loadGame()` on every load. An ungated migration silently re-fires on every single load — including already-current saves — which for this one meant confirmed research kept getting wiped and immediately re-earned (evolving a fresh individual) every session, compounding indefinitely with zero manual action.

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

**Implementation Note:** expand/collapse (and similar) UI toggle state must be backed by JS state keyed appropriately (e.g. per dexId), never by DOM alone (`section.style.display` with no backing variable) — any panel subject to periodic re-render (here, Species Detail rebuilt every `ENC_INTERVAL_OPEN` tick via `renderDex()`) will silently reset a DOM-only toggle to its default on every rebuild, which looks like the UI "auto-collapsing" but is actually the whole panel being torn down and redrawn. `renderDexDetail()` now restores toggle state from JS on every rebuild instead of defaulting to collapsed.

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

#### Party-Only Batch Evolution Prompt on Item Purchase (SETTLED — v0.38, NEW)
- Fires immediately after `buyItem()` completes, for items where `item.effect==='evolve-stone'` or `'evolve-trade'` — same item-effect gate `professorAutoTestEvolutions()` already uses.
- **Scans party (held) members only.** The box is never considered by this prompt, at any step — this is explicitly narrower than the Manual Evolution Trigger above, which works on any held individual.
- Collects every eligible party individual across both evolution paths (Path 1 single-target, Path 2 `EVO_TREE` branches) matching the purchased item, regardless of whether the branch is already confirmed — excludes `evolveBlocked` individuals and any nickname-locked (`getNicknameEvolveLock()`) to a different branch.
- **Zero eligible party individuals → no prompt at all**; the purchase completes silently exactly as before.
- One or more eligible → a checkbox list (one row per eligible party individual, current → target species), capped by the quantity of the item just purchased/on hand.
- **Confirmed already-confirmed-branch selections** apply exactly like the Manual Evolution Trigger (consume item, `applySpeciesSwap`, log).
- **Confirmed not-yet-confirmed-branch selections** also confirm the branch via `recordEvolution()` — choosing which party member confirms it replaces `professorAutoTestEvolutions()`'s old auto-pick-highest-level-**box** individual default, for this purchase only.
- **Declining/closing without selecting** falls back to the existing default unchanged: the item sits in the bag, and if the branch is still unconfirmed, `professorAutoTestEvolutions()` confirms it on a later tick via a boxed candidate as it always has — party members are untouched by that fallback path.
- No SAVE_VERSION impact — reuses existing `confirmedBranches`/`testedMethods` state.

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
- **Custom log view (v0.44):** third `logViewMode='custom'` tab. `addLog(msg, type, category, aideId)` — every existing call site gets a `category` tag from a fixed 15-value set (Catches, Wild Encounters, Evolutions, Level Ups & EXP, Gym Battles & Badges, Travel & Discovery, Healing, Fainting, Item Usage, Shop Purchases, Day Care/Breeding, Roster Management, Move/TM Management, Aide Management, System/Errors) and an `aideId` (`aide.id`, or `null`/`'general'` when not attributable to one aide — funds, Professor's-bag purchases, species-cap changes, validation errors). `state.logCustomFilters={categories:{},aides:{}}`, persisted, all `false` by default. Filter semantics: **category group** — empty selection shows nothing, checking any OR's together; **aide group** — empty selection means no additional narrowing (any aide), checking one or more AND-narrows the category results down to just those aides/General. Reuses the existing `dex-filter-modal` checkbox-popup styling.
- Both Full and Condensed sub-tabs display newest-first (`renderLogPanel()` reads `state.log`/`state.significantLog` directly — both are already newest-first via `.unshift()`; no `.reverse()` anywhere in the render path).

---

## Friendship Evolutions (SETTLED — v0.20)
- `checkEvolution()`'s SPECIES (single-target) path has a friendship branch parallel to the level branch: `s.evolveMethod==='friendship' && s.evolvesIntoId && p.friendship>=FRIENDSHIP_THRESHOLD`
- `FRIENDSHIP_THRESHOLD = 220` — top-level constant, alongside `ENC_INTERVAL` and similar
- `p.friendship` has **no cap** — it may continue climbing past 255 indefinitely; the threshold check is `>=220`, not `===220`
- On success: identical apply-logic to the level branch (species swap, HP recalc, `recordEvolution(prevDexId, newEntry.dexId, 'friendship', p.level)`, `recordNewSpecies`, `dexHistory` increment, log message) — reuse, don't duplicate
- **Known separate data issue:** `evolveMethod: "level"` with `evolveLevel: null` coerces to `p.level >= 0` (always true) — an instant-evolve bug. **Open Excel task for Jack:** Charjabug (dexId 737) currently has this exact data shape — needs `evolveMethod: "use-item"` with `evolveItem: "Thunder Stone"` instead. This is an Excel/`converter.html`-side data correction, not a `pokeprof.html` code fix.

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
- **Sylveon — deferred v0.20 through v0.23, activated v0.24.** Its placeholder `use-move` row in `evotree.js` (`133→700`) is now functional — see "Move-Based Evolution (`use-move`)" below. Values: `evolveItem: fairy-special`, `evolveLevel: null` (no power requirement). This is a simplified stand-in for the real game's combined Fairy-move + high-friendship requirement — this game checks move qualification only, no friendship component.
- **Leafeon/Glaceon rationale:** the real games use location-based triggers (Mossy Rock/Icy Rock); this game has no location-flag mechanic, so these are implemented as item-based substitutes instead, reusing the existing stone system. "Leaf Stone" and "Ice Stone" are new items Jack will add to the Excel `Items` sheet (`bagType: professor`, `effect: evolve-stone`) — not part of the `pokeprof.html` code change.
- **Espeon/Umbreon day/night:** no in-game time-of-day system exists — day/night is derived from the **client's real-world system clock**: 6am–6pm = day, 6pm–6am = night. No new state field.

### Data (`evotree.js` / EvoTree sheet)
- The EvoTree sheet's `evolveItem` column stores an **itemId slug string** (e.g. `"fire-stone"`) for `use-item` branches — matched against `state.professorBag`'s keys, which are always string slugs, never numeric. This differs from the single-target `pokedex.js` `evolveItem` field, which stores the item **display name** as a string for `use-item` (e.g. `"Fire Stone"`). Both are strings; neither is ever numeric. The two evolution paths intentionally use two different string formats for that method; code must handle both.
- **Implementation Note:** `evolveItem` must never be cast via `numVal()` in `convertEvoTree()`, for any method — always passed through raw via `val()`, exactly like `convertPokedex()` already does. Only `fromDexId`/`toDexId`/`evolveLevel` are legitimately numeric. (This duplicates a gotcha also tracked separately in `technical-learnings.md`, being merged into Data Architecture — flagging the overlap rather than the third copy.)

### `checkEvolution()` — EVO_TREE (Path 2) expansion
- `level` branches: unchanged, existing behavior
- **`friendship-day` / `friendship-night` (new):** auto-fires on the same level-up check as `level`/`friendship`, gated on `p.friendship>=FRIENDSHIP_THRESHOLD` AND the client system clock matching day (6am–6pm) or night (6pm–6am) respectively
- **`use-item` branches:** NOT auto-applied in `checkEvolution()` — confirmed via `professorAutoTestEvolutions()` (see below), then manually triggered per-branch via poke-modal buttons
- **`use-move` / `in-party` branches (v0.24):** auto-fire on the same level-up check as `level`/`friendship` — fully automatic, no Professor/manual step. See "Move-Based Evolution (`use-move`)" and "Party-Based Evolution (`in-party`)" below.

### Research & Display
- `researchLog[dexId].confirmedBranches` (see Research State per Species above) allows multiple simultaneously-confirmed evolutions per species
- **Family/Species card display:** superseded v0.22 — see "Evolution Chain Visual" below. Per-branch `???` granularity now exists.

### `fromFormName` and `requiredGender` Branch Restrictions (SETTLED — v0.42)
- Two `EVO_TREE` columns, blank by default. `fromFormName` restricts a branch to individuals currently in a specific form (Wooper→Clodsire Paldean-only, Meowth's Galarian branch, Rockruff's Dusk branch). `requiredGender` restricts by gender (Kirlia→Gallade, Snorunt→Froslass, Burmy's two branches, Combee→Vespiquen, Salandit→Salazzle). Both enforced in `professorAutoTestEvolutions()`'s item-candidate filter and `checkEvolution()`'s Path 2 branch-qualifying filter: `if((b.fromFormName||null)!==(p.formName||null)) return false;` / `if(branch.requiredGender && p.gender!==branch.requiredGender) return false;`
- **Implementation Note:** an exact-match-with-null comparison must not carry a wildcard exception for blank values — a blank `fromFormName` means "must currently be the base form," not "skip this check." Two different attempts at this comparison each reintroduced a bypass before landing on the correct form, with no trailing condition at all.
- **The Rule for `fromFormName`:** it only belongs on a branch when the *source* species genuinely has that form as a real, separately-existing thing — not just because the target does. Pikachu, Koffing, Mime Jr., Dartrix, Dewott, Bergmite, Petilil, Rufflet, and Goomy all correctly have `fromFormName: null` on their form-producing branches, because none of those species has a regional pre-evolution at all (there is no "Alolan Pikachu" — an ordinary Pikachu can become either Raichu form). Setting `fromFormName` to the target's form name in these cases would make that branch permanently unreachable, since no real individual could ever carry a matching `formName`. Contrast with Voltorb, Growlithe, Wooper, Sneasel, Zorua, and Sliggoo, where both the pre-evolution and evolution genuinely exist as separate forms — there, the restriction is required.
- **Implementation Note (architectural, general risk for future branching species):** `checkEvolution()`'s Path 1 (flat `pokedex.js` columns) runs *before* Path 2 (`EVO_TREE`) and is completely blind to both form and gender — it resolves the species via `getPokemonEntry(p.pokedexId)` with no form argument. Whenever a species' flat row uses the *same trigger* as a competing EVO_TREE branch, Path 1 fires first and returns immediately, before Path 2's restriction ever runs — confirmed independently on Wooper, Meowth, Rockruff, and Combee. Resolution is always the same: clear the flat row (`evolveMethod`/`evolvesIntoId` blank) and represent the base-form outcome as an explicit `fromFormName: null` EVO_TREE entry instead — the same "no single flat answer, all branches in EVO_TREE" treatment as true multi-path species (Eevee, Kubfu, Applin). Check for this on every future branching species entered by hand.
- The Excel column is `requiredGender`, not `requireGender`.

---

## Move-Based Evolution — `use-move` (SETTLED — v0.24)

- `use-move` existed as a reserved-but-inert value in `EVOLUTION_METHODS` from v0.19 through v0.23 — no logic anywhere checked for it. v0.24 makes it fully functional.
- **Condition:** checked on level-up, same hook as `level`/`friendship` (`checkEvolution()`, `applyEvolutionSilent()`, and the EVO_TREE branch filter) — does the Pokémon have a qualifying move in `p.equippedMoves`?
- **Field reuse — no new columns added:**
  - `evolveItem` — descriptor string, one of two shapes: `type` alone (e.g. `"fairy"`), or `type-category` (e.g. `"ghost-physical"`). Category is `physical` or `special` only.
  - `evolveLevel` — optional power threshold. Blank/null = no power requirement, just needs the type (and category, if specified) present among equipped moves.
- Works identically on both the single-target (`pokedex.js`) and branching (`EVO_TREE`) evolution paths.
- **Confirmed use cases:**
  - **Primeape** (single-target): `evolveMethod: use-move`, `evolveItem: ghost-physical`, `evolveLevel: null` (no power requirement — just needs a Ghost-type Physical move equipped). Homebrew stand-in for the real game's Rage Fist/×20-uses mechanic — no Rage Fist move exists in this game's dataset.
  - **Sylveon** (branching, `EVO_TREE`, `133→700`): `evolveMethod: use-move`, `evolveItem: fairy-special`, `evolveLevel: null` (no power requirement — just needs a Fairy-type Special move equipped). Simplified from the real game's Fairy-move + high-friendship combo — no friendship component here.
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

## Shedinja Creation — `shed` Evolution Method (SETTLED — v0.42, auto rule-out added v0.44)
- Nincada evolving into Ninjask via the normal level-20 path also creates a second individual, Shedinja, as a side effect — not a branch choice between competing outcomes, both happen at once. `'shed'` is part of `EVOLUTION_METHODS`' base list so Nincada's species page can register full research completion.
- Hooked into all five successful-evolution exit points in `checkEvolution()` (Path 1's level/friendship/use-move/in-party, and Path 2), keyed off `getEvolutions(prevDexId)` finding a `shed`-method entry — not hardcoded to Nincada's dexId, so any future species with the same mechanic works with no code change.
- **Deliberate simplification vs. the real games:** the real mechanic requires an empty party slot *and* a spare Poké Ball (consumed on creation); this implementation checks party space only.
- New individual is created via the normal `makePokemon()` path (correct ability roll, nature, equipped moves), then has `level`/`ivs` overwritten with the evolving individual's own values and `recalcStats()` re-run — reuses existing, tested stat math rather than duplicating it.
- **Auto rule-out (v0.44):** `getResearch()`'s structural rule-out block — which already handles `use-item`/`in-party` this way — also marks `shed` tested/ruled-out for any species without a `shed`-method branch, via the generic `speciesHasEvolveMethod(dexId,'shed')` helper (checks live `EVO_TREE` data; not hardcoded to Nincada). `loadGame()` runs an unconditional backfill sweep over `state.researchLog` applying the same check retroactively — a logic correction, not a schema change, so no `SAVE_VERSION` bump.

---

## Evolution Chain Visual (SETTLED — v0.22, revised v0.23 / v0.26)

- `renderEvolutionChainVisual(famId, highlightDexId)` is a **shared component** used on both Family Cards (Layer 1) and Species Detail (Layer 3), replacing the old flat `chainParts.join(' → ')` text line on the Family Card.
- Built on a **root-based walk of `EVO_TREE`**: a "root" is any dexId in the family with no incoming edge from another family member. Each root gets its own display row — Nidoran ♀/♂ (two independent roots, no shared egg/breeding stage) renders as two rows; Eevee (one root, many branches) renders as one row that fans out with `/` between simultaneous confirmed branches (e.g. `#133 Eevee → Vaporeon / Jolteon / Flareon`).
- Each node = `getSpriteUrl()` sprite (~40–48px) + name + dexId, matching existing pixelated sprite styling.
- Arrows carry **text** method labels (`Lv 16`, `Water Stone`, gender symbol at a Nidoran-style split) — no item-sprite lookup (`items.js` has no sprite-URL helper yet; text labels were chosen over building one).
- Unconfirmed nodes render as a greyed `???` placeholder box in place of the sprite. **Evaluated independently per row** — one branch can show `???` while a sibling branch (or a different root, for Nidoran) is fully resolved. This replaces the old single shared `???` check for the whole card.
- On Species Detail specifically, the node matching the currently-viewed species gets a highlight border. `buildEvoMethodsHtml()`'s collapsible "X/N Evolution Methods Tested" breakdown stays underneath, unchanged — this visual doesn't replace it, it fixes the fact that Species Detail previously showed *no* evolution summary at all (`getEvolutionDisplayText()` was never called there, only on Species Cards).
- **v0.23 — terminal-node further-evolution indicator:** a node with **zero data-defined outgoing edges** (e.g. Sandslash, which has no further evolution in the data) previously returned silently with no `???`. Now: unless that species is ruled out (`nonEvolutionConfirmed`, computed live — see Research State per Species above), append `? → ???` after it, same visual treatment as an unconfirmed branch. This makes "no further evolution" a claim the player has to earn through exhaustive testing, not something the UI assumes from missing data.
- **Root rendering (v0.26):** true structural roots (no incoming edge, by data alone) always render, seen or not — an unseen root renders as a `?` placeholder (`evoPlaceholderHtml()`) with an arrow into the first known member, resolving to a real sprite automatically once seen by any means (Day Care being the primary intended path). **Implementation Note:** root selection must not require the root itself to be in `seenDexIds` — gating on that can zero out the entire family's root list (not just that one root) when nothing else in the family qualifies structurally as a root either, hiding the whole chain instead of just the unseen node.
- **Item-based branch confirmation (v0.26):** when an edge's method is `"use-item"`, matching uses the edge's item name instead of its generic method string (`const matchKey = e.method==='use-item' ? e.item : e.method`) — `recordEvolution()` stores the item's name as the method (e.g. `"Water Stone"`), which never equals the edge's literal `"use-item"` field. A branch also renders its real species node if the target has been **seen by any means** (`seenDexIds`), not only if the specific method was formally confirmed via `recordEvolution()` — covers species obtained via Day Care or any other path outside the normal evolution-checking flow. The connecting arrow shows the real method label if formally confirmed, or a generic `?` if the species is known but the method itself hasn't been tested.

### Clickable Sprite Nodes (SETTLED — v0.28)
- Sprite nodes in the chain visual — in **both** the Family Card (Layer 1) and Species Detail (Layer 3) contexts — are now clickable, jumping directly to that species' own detail page. Previously, Family Card chain sprites were dead clicks (wrapped only in `event.stopPropagation()`, blocking the card's own navigate-to-species-list action with no replacement), and Species Detail chain sprites had no click handling at all.
- `evoNodeHtml()` gains a `data-dexid` attribute + `cursor:pointer`; a new shared delegated handler `familyChainNodeClick(event)` walks up from the click target to the nearest `[data-dexid]` ancestor and navigates (`dexSelectedDexId` updates, `dexView='detail'`, `renderDex()`). Reused identically at both call sites.
- Placeholder/unseen nodes (`evoPlaceholderHtml()`) remain non-interactive — no detail page exists for a species not yet seen.
- On the Family Card, clicking elsewhere on the card (name, background, the ▶ arrow) keeps its existing behavior — navigates to that family's species list. This is purely an added shortcut on the sprite icons themselves.
- Display/interaction-only — no `state` schema change.

### Duplicate Branch on Legacy `evolvesIntoId` (SETTLED — v0.35)
- Whenever `getEvolutions(m.dexId)` returns any branch rows for a species, `EVO_TREE` is treated as the sole/authoritative edge source and the flat `evolvesIntoId` edge is skipped entirely for that species.
- **Implementation Note:** a species with both a legacy flat `evolvesIntoId` (`pokedex.js`) and `EVO_TREE` branch rows for the same dexId will draw the same evolution twice (plus any genuine additional branches) if both sources are counted — `EVO_TREE` must win outright, not merge, whenever it has any rows at all for that species.
- Display-only — `professorAutoTestEvolutions()` was never affected (already deduped via `alreadyConfirmed`). No SAVE_VERSION impact.

### Branch Line-Break (SETTLED — v0.36, superseded v0.37)
- Any node with 2+ simultaneous confirmed branches (Slowpoke, Eevee, Poliwhirl, Gloom, etc.) renders as a vertical stack instead of one wrapped inline row: row 1 = the node; row 2 = each branch target with its normal right-arrow + method label, wrapping as needed. The `/` separator between simultaneous branches is removed. Applies uniformly and recursively to every branch point. Single-branch chains are unchanged. No SAVE_VERSION impact.
- **v0.37 correction (found via code review, not previously documented):** the down-arrow connecting row 1 to row 2 carries the method label *above* the arrow itself (`evoArrowDownLabeledHtml(label)`), not the plain unlabeled arrow this section originally described. The original `evoArrowDownHtml()` (v0.36, no label) is confirmed dead code — defined but never called anywhere in the file; `evoArrowDownLabeledHtml()` is the only variant actually used, at the single real call site.

### Method Label Sizing (SETTLED — v0.36)
- `evoArrowHtml()`'s method-label text: 7px → 10px, `white-space:nowrap` dropped in favor of a modest `max-width` so longer labels ("Dubious Disc," "Friendship (Night)") wrap to a second line — using the vertical space already sitting empty next to the 40px sprites. Sprite/species-name labels (8px) are unchanged. No SAVE_VERSION impact.

### Per-Form Species Detail Navigation (SETTLED — v0.36, NEW)
- New in-page-only state `dexSelectedFormName` (not persisted). Pokédex grid keeps one cell per dex # (dedup logic unchanged); species with multiple `POKEDEX_DATA` rows sharing a dexId get a form tab/toggle on their Species Detail page, hidden entirely for single-form species.
- Switching tabs re-renders stats/type/flavor/sprite via `getPokemonEntry(dexId, formName)`; caught-individuals list filters to the selected form tab.
- Evolution chain nodes gain a `data-formname` attribute alongside the existing `data-dexid`; `familyChainNodeClick()` now also sets `dexSelectedFormName`, so tapping an alt-form node navigates with the correct tab pre-selected.
- Research/ability/evolution data stays combined per dex # regardless of form tab (intentionally dexId-keyed, not form-keyed — unchanged from existing Research & Pokédex philosophy).
- Default landing form via the main grid: base/null. No SAVE_VERSION impact.

### Unconfirmed Predecessor via Breeding (SETTLED — v0.36, NEW)
- Previously, a root species only ever showed a "?" placeholder before it if a real (but unseen) predecessor row already existed in the data (e.g. Pichu for Pikachu, Munchlax for Snorlax) — species with no such row at all (fossils, etc.) showed nothing before them, silently assuming "confirmed no predecessor" from the mere absence of data.
- **New rule:** a structural root only renders with nothing before it once breeding has actually been tested on it. New persisted field `state.researchLog[dexId].breedingTested` (boolean, default `false`), set `true` in `collectDaycareSlot()` on any successful egg collection, keyed on the hatched species (`rec.resultDexId`) — one hatch confirms that lineage either way, regardless of outcome.
- Species with **no valid egg group at all** (`getEggGroups(dexId).length===0` — legendaries, etc.) auto-skip the placeholder — breeding is impossible for them, so there's nothing to test.
- Species that already have a real predecessor row in the data (Pichu, Munchlax) are unaffected by this — that's the separate, pre-existing, already-correct mechanism.
- No recursion: a revealed baby form (Pichu) is always treated as the true end of the line.
- Part of the SAVE_VERSION 22 → 23 bump (see Versioning, shared with "Research & Pokédex — Persistent Gender-Observation Tracking"). Migration: `breedingTested:false` defaulted on every existing research record — no backfill possible, starts false for everyone going forward.
- **Implementation Note:** the auto-skip condition (no valid egg group) must be checked via the same `isUndiscoveredOnly()` logic as breeding compatibility itself (see "Compatibility — Full Egg-Group Rules") — a separate/divergent check here can disagree with the actual breeding block and show the placeholder on species that are structurally unbreedable (Mewtwo was the case that surfaced this, v0.37).
- **Implementation Note:** a species that structurally can never produce itself as a breeding result must be explicitly excluded from this requirement, or the "confirm via breeding" prompt becomes permanently unsatisfiable. Ditto is the current example — two Ditto can't pair, and Ditto paired with anything else always produces the other parent's species — so the root `canBreed` check also excludes Ditto (`isDitto(root.dexId)`) alongside the egg-group/undiscovered-only exclusions (v0.38).

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
- Connections between discovered locations are drawn as lines; free connections use solid blue. Gated (`requiresItem`) connections are dashed and **color-coded live by ownership** (v0.38): red (`#e63946`) if the required item isn't yet owned, green (`#2ecc71`) once it is — checked via `(state.trainerBag[requiresItem]>0) || state.trainerUnlocks[requiresItem]`, the same ownership pattern used elsewhere for gating. Replaces the old static-purple treatment. Re-evaluated on every `renderMap()` call; in practice one-directional (red→green only) since every gating item in the data is permanent once acquired.
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

### Missing-Item Gates in Map Detail Panel (SETTLED — v0.43)
`showMapDetail()` uses a `getMissingItemGatesForLocation(locId)` helper — scans `CONNECTIONS_DATA` for any row touching `locId` where `requiresItem` is set and the same `gatedOwned` ownership check `renderMap()`'s line-coloring already uses evaluates false. Renders one `🔒 Requires: {getItem(itemId).name}` line per missing item, listed regardless of whether another already-open connection also reaches the node. Direct connections only, matching the map's existing line-coloring scope, not a full path trace.

### Fixed Palette Restoration (SETTLED — v0.36, reverses part of v0.35 theming)
- `MAP_COLORS` and all map rendering colors are fixed constants, joining type colors, HP bars, success-green, and currency-gold — see "Fixed Constants" list in Theming System.
- Node fill: uniform bright navy (`#22406b`) for all location types — type is conveyed by the stroke ring alone (green/red/blue). Current-location fill: `#245a8a`.
- Labels: uniform bright near-white (`#f0f0f0`) for all locations. Current-location label stays gold (`#f4d03f`) — state indicator, not type indicator.
- Selected-node ring: fixed gold (`#f4d03f`) — never tied to the theme's Accent color.
- Default connector lines: fixed `#4a5a6a`. Gated/purple dashed lines unchanged.
- Node size (r=14) and label font (9px) unchanged — map is adaptive/zoomable. No SAVE_VERSION impact.
- **Implementation Note:** see Theming System's "Fixed Constants" section for the general rule this follows (any new subsystem's colors must be added to that list explicitly, or a theme sweep will silently absorb them) — this section is the specific incident that established the rule.

### Gym Badge Display — Map Node & Detail Panel (SETTLED — v0.41, NEW)
- **Map node label:** any discovered location with a gym (`getGymTrainerIdsAtLocation(locId).length>0`) renders a small (~10px) badge-sprite `<image>` next to its name label in `renderMap()`. Uses the existing `BADGE_SPRITE_MAP` lookup (same source as the Aide Panel badge sprites — see "Aide Panel — Badge Sprite Display"), with the same 🏆 emoji fallback for the Champion Badge (no real sprite exists for it). Shown **regardless of whether the gym is currently accessible** — confirmed: a discovered gym location always shows its badge icon, even if the player hasn't unlocked it yet (e.g. a high-badge-count gym).
- **Map detail panel (`showMapDetail()`):** for any location with a gym, adds a block under the location name/region showing the badge sprite (or 🏆 fallback), the badge's display name (`getItem(badgeItemId).name`), and one line per aide reading `<emoji> <name>: Tier <highest cleared>` — sourced from the existing `aide.gymProgress[trainerId]` tracker (see "Gym / Trainer Battle System — Progress Tracking"), or "Not yet challenged" if that aide has no entry for this trainer yet. Same accessibility-independent display rule as the map node icon above.
- No new state — reuses `BADGE_SPRITE_MAP`, `getItem()`, `getGymTrainerIdsAtLocation()`, and each aide's existing `gymProgress` field verbatim. No `SAVE_VERSION` impact.

---

## Trainer / Aide System (SETTLED)

- Carl Oak is the starting aide, comes with a level 5 Rattata
- Each aide has their own **per-aide inventory** (`aide.trainerBag`) containing field equipment: badges, HMs, Bicycle, Rods (Old/Good/Super), Safari Pass
- Per-aide inventory is **not shared** between aides — Carl having an Old Rod doesn't give a second aide one
- `state.trainerUnlocks` exists in the codebase as a stub — its relationship to per-aide inventory will be clarified during v0.19 inventory split implementation
- Trainer abilities, new trainer recruitment, etc. are **future features** — do not implement yet
- Party list entries show just the name for a non-fainted Pokémon; a fainted one gets a 💀 prefix (no 🐾 prefix on the non-fainted case).

### Aide Panel — Badge Sprite Display (SETTLED — v0.27)
- The aide panel layout changes to two lines: **Line 1** is the aide name (e.g. "🧑‍🔬 Carl Oak") followed inline by sprite icons for every badge currently held in that aide's `aide.trainerBag`. **Line 2** is the party Pokémon mini-sprites, moved down from their previous spot on the name line.
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
- Replaced with a single line: **"Balls | TMs | Potions | Revives"** (the "Professor:" label was dropped from `renderBagDisplay()` after initial release), plus
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
- **This is a recurring failure class, not a one-off rule** — every instance found so far has been a variant of "something keyed or matched on the wrong identity/format": `getFamilyDexIds()` walking `EVO_TREE` edges instead of using `getFamilyMembers(familyId)` (Family IV Inheritance), `evolveItem` cast to a number instead of kept as a string slug (Branching Evolutions), `EVOLUTION_METHODS` hand-maintained instead of derived live (Evolution Method Enum), item-evolution matching keyed on `effect` instead of `evolveMethod`+`evolveItem` (Evolution Research System), `dexSelectedFormName` hardcoded instead of read from the clicked entry (Species Detail Form Selection). When adding new species/item/form lookups, check whether an existing helper already encodes the correct identity resolution before writing a new comparison by hand.
- **`fromFormName` rule:** enforced in both branch-matching functions — applies when the source species has genuine regional varieties (Meowth/Wooper style), not to true multi-path species with one form and multiple simultaneous evolutions (Eevee). See "Same-DexId Branching Form Evolutions" below for the full mechanism this rule protects.

### Sprites
- PokeAPI form sprites use numeric IDs, not slug-based filenames.
- Koraidon/Miraidon alternate build/mode form variants have no sprites in the source repository. *(Flagging for a look, not resolving: this game is Kanto-scoped — worth confirming whether this note is still relevant to anything reachable, or a leftover from an earlier broader-scope draft.)*
- **Shiny-aware `spriteUrl` resolution (SETTLED — v0.43):** `getSpriteUrl()`'s early-return path for a populated `entry.spriteUrl` must still branch on `isShiny` — `return isShiny?entry.spriteUrl.replace('/pokemon/','/pokemon/shiny/'):entry.spriteUrl;` — rather than returning the stored URL unconditionally. Dormant until `spriteURL` values are populated in the data, but required before shiny form sprites can ever work correctly; this is the only read site of `entry.spriteUrl` in the codebase.

### Testing Infrastructure
- jsdom smoke testing: use `win.eval()` / `window.eval()` to work around the jsdom quirk where `let`/`const` are not attached to `window` — all data files plus the game script are combined into a single eval call.

### Excel → JS Pipeline
- Master data lives in Excel; converted via `converter.html` into JS files
- Never hand-edit the generated JS files directly
- `bagType` column (`"Professor"` / `"Trainer"`) is required on all items in `items.js`
- `defaultEncounterMethod` column is required on all locations in `locations.js` (v0.19)
- **`Trainers` tab (v0.25)** — required for the Gym Battle System; see "Data Model — `trainers.js`" under Gym / Trainer Battle System for the full column schema. Converter bumped to **v7** (v6 added `convertTrainers()`; v7 revised the move columns to combined type+category strings).
- **`Info` tab (v0.43)** — required for the Info Menu; see "`INFO_TOPICS` Extracted to `info.js`" under Info Menu. Converter bumped to **v9** (v8 added shiny-URL auto-building for `spriteUrl`; v9 added `convertInfo()`).

### Data Corruption Incident — `pokedex.js` dexId 659–784 (v0.39)
`pokedex.js` dexId 659–784 (126 species, Bunnelby through Kommo-o) had every row's content (stats, category, flavor text, abilities, `isLegendary`/`isMythical` flags — everything except `name`/`dexId`) shifted +1 relative to its label, from a manual Excel paste misalignment. Found via a full dex-wide diff against an independent reference dataset; fixed by re-fetching the range fresh. Re-verified clean: 0 mismatches across the full national dex.

**Standing limitation surfaced by this incident (not itself resolved):** `fetcher.html` only ever produces one base-form row per species — alternate/regional/cosmetic forms are always hand-added rows. Re-fetching any dexId range collaterally wipes every manually-added alternate-form row interleaved in that same range. The v0.39 re-fetch above wiped Vivillon (18 patterns), Aegislash, Pumpkaboo/Gourgeist, Zygarde, Oricorio, Rockruff, Lycanroc, Wishiwashi, Minior, Mega Diancie, and several Hisuian forms — re-added by hand afterward. Any future range re-fetch needs the same manual re-add pass; see "Outstanding Data Tasks" at the end of this document.

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
- `getMoveCap(entry, type, category)` reads the raw cap (highest-power move of that type+category the species/family can learn, aggregated across the whole evolution chain) and clamps it to a flat maximum of **120**, applied at both read sites — `getAvailableMoveSlots()` (the source of every displayed/usable cap) and the direct read in `openMoveSlot()`.
- **Implementation Note:** self-KO moves (Self-Destruct/Explosion at 200+/250, Final Gambit at the user's current HP) must not be allowed to inflate a slot's TM-upgrade ceiling — the battle system abstracts moves to type+category+power only, with no way to represent a self-KO drawback, so including them in the raw aggregation lets any species able to learn one push that slot's cap far past what the formula is balanced for. 120 was chosen because mainline's strongest non-drawback moves top out around 110–120.

### Bulk TM Upgrade (SETTLED — v0.26)
- The single "⬆ Upgrade (1 TM)" action is replaced with a quantity dropdown + upgrade button in `openMoveSlot()`.
- Dropdown range: 1 up to `min(TMs owned, TMs needed to reach the slot's cap)`, where TMs-to-cap = `Math.max(1,Math.ceil((cap - slot.power) / 5))` — `ceil`, not `floor`: guarantees the max offered quantity actually reaches the cap even when the gap isn't a multiple of 5, consistent with "use everything I have on this slot" being the common case below.
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
- `A`/`D` = level-scaled stats via `calcStat(base, level, iv, natureMod)` — see "IVs + Natures... — Stat Calculation" for the full current signature and formula (extended in v0.31; this section originally introduced it as a simpler `calcStat(base, level)` before IVs/Natures existed). Applies to Atk/Def (Physical) or SpAtk/SpDef (Special) on both sides.
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
- Speed-based turn order, reusing the existing IV/nature-aware effective-speed formula (`calcStat(baseSpd, level, iv, natureMod)`, same as any other stat — see "IVs + Natures... — Stat Calculation") — an individual's actual Speed IV and nature genuinely affect turn order, not just base species speed and level. Evaluated every round (not once per battle), random tie-break.
- Multi-Pokémon gauntlet — fainted Pokémon auto-cycle to the next non-fainted teammate on either side; battle ends when a full team of up to 6 is fainted.

### AI Move Selection
- Of the 4 equipped moves, compute expected damage against the current target (type effectiveness + STAB) and pick the highest.
- A move cannot be used a 3rd consecutive turn in a row — if the top pick was just used twice, it's excluded and the next-highest is chosen instead.
- This "recently used" tracker resets whenever the Pokémon switches out and back in.

### converter.html
- `convertPokedex()` extended to read and pass through the 36 new columns as plain numeric/null fields (no ID casting needed).
- **v0.34: `spriteUrl` field** — if the Excel `spriteURL` cell is a bare number, the converter now builds the full PokeAPI sprite URL automatically (`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{number}.png`); a full URL pasted directly still passes through unchanged. Converter bumped to **v8** for this (v7 was the last logic change — Trainers move-column revision).
- **v0.43: `convertInfo()`** — new Info sheet (`category | subCategory | text`, one row per idea), grouped by `category` in first-appearance order into `{id, title, sections:[{header, text}]}`, output as `info.js`. Blank `category`/`text` rows are silently skipped unless the row has other non-blank cells, in which case a warning is surfaced with the row number. Called from `convertAll()` alongside the other converters. Converter bumped to **v9** for this.

### MoveFetcher.html — Cross-Game Learnset Tool (BUILT — confirmed via cross-file audit; this document previously, incorrectly, described it as designed but not built)
- Same dexId-range + single-name UX as the existing Pokedex fetcher.
- Pulls cross-game learnsets from PokéAPI, filters out status moves, groups by `(type, damage_class)`, takes max real-world `power` per group, outputs one row in the 36-column format.
- Output is pasted directly into the Pokedex sheet (sorted identically by dexId, no VLOOKUP/XLOOKUP due to doc-weight concerns).
- Form variants aren't reachable via the dexId-range pull (PokéAPI indexes them by name-slug) — fetched via the single-name field.
- Inline form-variant flagging via PokéAPI `varieties` — surfaces a one-click "fetch this form too" button when extra varieties exist beyond the base form.
- Accepted gap: a species never re-fetched won't trigger this flag if a form is added to PokéAPI later — will show as a visibly blank row in the maintained sheet.
- **Evolution inheritance (found in the live tool, not previously documented here):** an evolved form's power cap is automatically raised to match anything its pre-evolution could already reach, so an evolved form never shows a lower cap than what it evolved from. Walks the evolution chain backward silently as needed — fetching only a final-stage species (e.g. Steelix) also pulls its pre-evolution's data (Onix) purely to source the inheritance check, without adding that pre-evolution as its own visible row or including it in the copied output.
- Move data is cached globally per session (`moveCache`) — a move referenced by many species (Tackle, Thunderbolt, etc.) is only fetched from PokéAPI once, not once per species that knows it.

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
  - **Known dead columns, found via cross-file audit:** every row also carries a `"look"` field and the full 36-column type×category power-cap schema (`normalPhysical`, `normalSpecial`, ... `fairySpecial`) copy-pasted from the Pokédex sheet's template — confirmed via full-file search that `pokeprof.html` never reads any of these 37 fields. Harmless (unread), but they shouldn't be in this sheet at all, and at least one row (Brock, tier 6, slot 3, Omanyte) has actual leaked non-null values sitting in them — worth a cleanup pass on the Trainers sheet whenever convenient, not urgent.
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
- Badges live in the earning aide's per-aide inventory (`aide.trainerBag`), routed and isolated identically to HMs/Rods/Safari Pass — never shared between aides.

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

### Passive/Idle Gym Battles at Current Tier (SETTLED — v0.40)
- `isGymGrindEligible()` matches `isGymAccessible()` exactly (the same rule the watched-battle button uses) — idle gym-grinding is no longer gated on the badge already being held, so a first attempt (and a first badge) can happen through purely idle/Wander play, not only as a rematch mechanic. Elite Four/Champion stays correctly locked until 8 regular badges, enforced by `isGymAccessible()` itself.
- Waypoints (locations passed through en route, not the final mission destination) go through the same weighted method-selection system (`pickMethodForLocation()`) a destination gets, rather than always using the location's flat `defaultEncounterMethod` — gym becomes available while genuinely passing through a gym city, not just upon arrival, naturally rate-limited by the normal encounter cadence. As a side effect, waypoints also start respecting any `locationMethodPrefs` configured for that location, where they previously ignored it in favor of the flat default.

### Post-Wipe Gym Exclusion — Wander Deadlock Fix (SETTLED — v0.44)
A dedicated per-aide flag, `aide.wipeRecallLocation`, is set **only** by an actual party wipe (`endMission('faint', idx)` sets it to the return location; a deliberate `'recall'` does not) and cleared the moment the aide genuinely arrives anywhere else (`arriveAtLocation(locId, aide)` clears it as soon as `locId!==aide.wipeRecallLocation`). `rollEncounter()`'s gym-eligibility check is simply `locId===aide.wipeRecallLocation` — blocking only the one immediate re-fight right after a wipe, never touching gym battling otherwise. `pickMethodForLocation()` (taking a `trainerBag` param) mirrors the checkbox's own default in its no-prefs fallback: gym only joins the random pool if `hasGymBadge()` is already true (or per the New Player Preamble preference under Onboarding), matching what the UI would show as checked by default for a city Wander reaches without ever having its panel opened. `wipeRecallLocation` is a plain property on the aide object, flowing through existing generic per-aide serialization with no dedicated migration entry.

**Implementation Note:** when a fix needs to detect one *specific* transition (here: "did an aide just wipe, versus arrive normally"), reusing an existing multi-purpose location field is not equivalent to a dedicated flag scoped to that transition — two earlier attempts each reused a field with unrelated update semantics (`aide.missionOrigin`, then `aide.lastHealLocation`) and each failed differently: the first left every new city unprotected until a manual re-dispatch, the second over-corrected and blocked gym battles almost everywhere, since that field updates on every heal-location arrival, not just wipes. Verified via 15,000-tick simulation instrumentation: 2 genuine gym battles fired during ordinary idle play, 7 rolls correctly blocked in the post-wipe window.

### Watched Gym Battle — Aide Card Trigger (SETTLED — v0.29, NEW)
- A "Battle Gym" button is always visible on the aide card whenever the aide's current location is a gym (any of the 8 regular gyms, or Indigo Plateau once accessible) — no readiness/level gating, always tappable.
- Tapping it opens a **team-order prompt**: a draggable list of the player's current party sprites/icons, letting them set active lineup before the battle begins.
- The battle then plays back **turn-by-turn at ~0.5 seconds per move, mandatory, no skip option.**
- **This is the only path that can earn a badge on first win.**
- **Battle screen layout (mainline-style):** opponent's active Pokémon sprite + name + level + HP bar at the top, player's active Pokémon sprite + name + level + HP bar at the bottom, sprites swap immediately on faint as the next non-fainted teammate cycles in. A compact move/damage text line appears each turn (e.g. "Weedle used Bug Physical — 12 dmg!"), advancing at the playback pace. The opposing trainer's name + portrait (via new `TRAINER_SPRITE_MAP`, see "Aide Panel — Badge Sprite Display") is shown **briefly at the start only**, then gives way to the Pokémon sprites for the rest of the fight. Sprites correctly reflect `isShiny`, same as every other sprite call site in the file. **Implementation Note:** a derived/snapshot copy of a Pokémon (here, `playerSnapshot`, built fresh for this screen) doesn't automatically carry every field the real party object has — `isShiny` was missing from an earlier version of the snapshot mapping, so shiny sprites silently rendered as non-shiny here even though the rest of the file already handled `isShiny` correctly. Any new per-battle snapshot needs to be checked against the real object's full field set, not assumed complete.
- **Blocking flow:** once triggered, the player stays on-screen through team order → playback → result. No leaving mid-battle, for single fights and each gauntlet leg alike.
- **Indigo Plateau gauntlet (tier 9 and tier 10) specifics:** between each of the 5 legs, team order can be reshuffled and healing items may be used (existing `getWeakestEffectivePotion()` inter-battle auto-heal logic, unchanged). No-heal-*within*-a-leg and full-reset-on-loss-resets-to-leg-1 rules are unchanged — this only opens a management window *between* legs.
- **Indigo Plateau tier 9** (the original Elite Four/Champion clear) is always watched via this button — never offline, regardless of badge status. **Indigo Plateau tier 10** (postgame rebattle) can also be watched via this button, but isn't required to be — see the mission-modal grind path above for the offline alternative.
- **Immediate post-battle heal (v0.44.2):** both `finishWatchedBattle()` and the automatic gym-battle resolution path call the existing party-heal logic immediately once a battle concludes (win or lose), rather than waiting for the next tick's heal check. **Implementation Note:** `startWatchedGymBattle()` refuses to start (with a "team needs to heal first" message) if the party has no conscious Pokémon, and `runWatchedBattleLeg()`'s empty-team early-exit calls `showBattleScreen()` (or an equivalent minimal result render) before `finishWatchedBattle()` as a backstop, so `#battle-result-area` always exists and the Close button is always reachable. A plain `let` module-level variable used as a UI-visibility flag (here, `watchedBattle`, checked by `updateBattleGymButton()`) is never part of `state` and never saved — if the only code path that clears it (`closeWatchedBattle()`, tied to the Close button) is guarded behind a DOM element that might not exist (an early-exit branch that skips rendering), the flag can get stuck indefinitely with no way to clear it except a full page reload. Any such flag needs either a guaranteed clear path independent of rendering, or to be recomputed from real state rather than held as an independent boolean.

### Loss / Retry Behavior (SETTLED — wording revised v0.30)
- Regular gym battles: auto-retry, no gameplay penalty — behavior unchanged.
  **v0.30:** the "No penalty — try again" phrasing is dropped from all three
  player-facing strings (mission-modal grind-path log line, watched-battle log line,
  watched-battle result text) — now reads "Lost to [gym] (Tier [tier]). Try again."
  / "Lost a gym battle. Try again." / "Defeated. Try again." Wording only; the actual
  no-penalty behavior is unchanged. (DESIGN.md's own description of the mechanic is
  documentation, not player-facing copy, and is unaffected.)
- Tier-9 gauntlet: **no passive/free heal between the 5 legs** (e.g. no location-based auto-heal) — healing between legs is items-only, via the inter-leg auto-heal logic below. A loss at any point resets the entire attempt back to battle 1 (first Elite Four member).

### Inter-Battle Healing
- Reuses existing `getWeakestEffectivePotion()` auto-heal logic unchanged (smallest potion that heals without waste, no HP threshold), pulling from `state.professorBag`.
- Fires **only before each battle instance starts** (including before each of the 5 gauntlet legs) if not at full HP. Never mid-battle — individual battles remain single-tick resolutions with no interruption point, consistent with existing wild-encounter behavior.
- `checkLocationHeal()` (the passive per-tick heal at any `heals:true` location) is guarded with `if(watchedBattle) return;` — suppresses the passive heal only while a gym/gauntlet encounter is actively in progress. **Implementation Note:** a location-based passive heal must be suppressed during any active watched battle, or it silently bypasses battle-specific healing rules — Indigo Plateau is itself a heal location, so without this guard the passive tick-heal fully healed the party for free throughout Elite Four/Champion gauntlets, including between legs, defeating the "items only, no free heal" gauntlet rule above. Normal in-town heal-on-arrival/heal-on-tick behavior is unaffected everywhere else.

### Gauntlet Full-Heal (SETTLED — v0.36)
- **Scope:** Elite Four/Champion gauntlet only (tier 9 and tier 10). Regular gym battles keep the original single-application logic.
- `healPartyFullBeforeGauntletLeg()`, replacing the gauntlet-specific call sites only (live `runGymEncounter()`, silent/offline `runGymEncounterSilent()`, and `runWatchedBattleLeg()` conditional on `watchedBattle.isGauntlet`).
- Algorithm, looped per Pokémon until full HP or bag exhausted: strongest available potion that heals with zero waste first (Max Potion valued at 121 for this comparison — Hyper Potion 120 → Super Potion 60 → Potion 20), falling back to the weakest available potion to finish (overheal capped at max HP) once nothing fits without waste.
- No SAVE_VERSION impact.

### Per-KO EXP Attribution (SETTLED — v0.32)
- After `runTrainerBattle()` returns, walk `result.log`. For each `{faint:X}`
  entry where X belongs to the enemy team, the immediately preceding log entry's
  `attacker` field is the player Pokémon that landed that KO. Award that enemy's EXP
  (`baseExpYield×level/7`, unchanged formula) to that specific attacker via
  `giveExp`/`giveExpSilent`, looked up by id in the real `state.party` (not the
  battle-copy) — so credit persists even if that Pokémon faints later in the same
  battle. Applies identically to both the live (`runOneGymBattle`) and offline/silent
  (`runOneGymBattleSilent`) paths.
- **Implementation Note:** multi-KO battle EXP must be attributed per-KO by walking the battle log for the actual attacker, never pooled into one total and handed to whoever survives — a pooled total lets the strongest/highest-level survivor absorb credit for KOs it never landed, and can produce a level-up cascade whose HP-catch-up looks like a free heal as a side effect.
- **EXP banking past the level cap (confirmed intended):** `pokemon.exp`
  accumulates unconditionally regardless of the level cap; a capped Pokémon's excess
  EXP resolves in a burst of level-ups the moment the cap rises (e.g. a new badge). Not
  a bug.
- **Batched to one log line per Pokémon (v0.44.1):** for gym battles specifically, `giveExp()`'s per-call logging is replaced by `applyExpBatched()`/`emitExpSummary()` — EXP from every KO in the battle accumulates into a `{catchId: total}` map instead of logging immediately, and exactly one summary line per Pokémon ("Name #id +TOTAL EXP") emits once the battle concludes. Level-up transitions still log individually. `distributeExp()` and `awardPerKOExp()` both take an optional trailing `totals` parameter; every other caller (ordinary wild-encounter EXP) omits it and falls through to the original per-call behavior. The Elite Four/Champion gauntlet's 5-leg loop gets one summary per leg automatically, since each leg is its own `runOneGymBattle()` call.

### Progress Tracking
- Per-gym "highest tier reached" tracked as a **display/achievement stat only** — no gameplay effect, purely informational (trophy-style).

### SAVE_VERSION
- Badges (`aide.trainerBag`) and per-gym highest-tier tracker (`aide.gymProgress[gymId]`) are part of the v0.25 SAVE_VERSION 16→17 bump — see the central Versioning table, not repeated here.
- **v0.29 team-order prompt and battle playback require no bump** — transient UI state only, nothing new persists across app close (a watched battle is atomic once triggered — blocking flow, no leave-mid-battle).

### Elite Four/Champion Gauntlet (SETTLED — v0.28)
- All five Elite Four/Champion members' rows are consolidated to a single shared `trainerId: eliteFourChampion`, at **both** tier 9 and tier 10, with `gauntletOrder` 1–5 populated identically at both tiers (1=Lorelei, 2=Bruno, 3=Agatha, 4=Lance, 5=Blue). `isGauntlet: TRUE` on all these rows.
- `runGymEncounter()`/`runGymEncounterSilent()`: `isGauntlet=isIndigoTrainer(trainerId)&&(tier===9||tier===10)` — the postgame Indigo Plateau rebattle is a full 5-leg gauntlet at tier-10 rosters, same heal-before-leg/no-partial-credit rules as the first clear.
- **Implementation Note:** a schema field being supported end-to-end by the read side (`getTrainerRoster()`, `converter.html`) doesn't mean it's functional — `gauntletOrder` existed and was read correctly for years while never actually being populated in the data, because the gauntlet's five members were entered as five independent `trainerId`s instead of one shared id with the field populated. Roster-lookup code that filters on a field can fail silently (empty roster, not an error) if nothing ever populates that field.
- No further badge/TM re-grant risk — `awardGymWin()`/`awardGymWinSilent()`'s existing "already earned" guards already prevent double-granting on repeated wins.

### Offline Gym Battle Simulation (SETTLED — v0.26, re-scoped v0.29)
- **v0.25 gap (deliberate, not an oversight):** `processOfflineTime()` discarded gym encounters outright — `if(enc.type==='gym'){ advanceTravelPath(); continue; }` — because gym battles are full team-vs-team fights using the live turn-based engine (speed-order turns, `calcBattleDamage`, possible 5-leg gauntlet chains), and the wild-encounter offline path's simplified one-hit formula doesn't apply to them.
- **v0.26 fix:** offline catch-up now runs gym encounters through the exact same real functions the live path uses — `healPartyBeforeGymBattle()` → `buildEnemyTeam()` → `runOneGymBattle()` (or the 5-leg gauntlet loop for Indigo tier 9) → `awardGymWin()` on a win — silently, with no per-instance DOM/log calls, consistent with offline processing's existing batched-summary design.
- **v0.29 scope change:** this offline path now applies only to (a) regular gyms 1–8 whose badge is already earned, any tier, and (b) **Indigo Plateau tier 10**, once the Champion badge is earned — matching the mission-modal gating above. It does **not** apply to unbadged regular gyms (never offered as a method) or to **Indigo Plateau tier 9** under any circumstance — tier 9 is always watched-only, no exceptions, regardless of badge status. The engine call itself is unchanged from v0.26/v0.28; only eligibility to reach it changed.
- New offline summary fields: `gymWins`, `gymLosses`, `badgesEarned` — surfaced in the existing offline-return summary banner alongside encounters/catches/wins/income/heals/shinies. **As of v0.29, `badgesEarned` from this path is always 0** — since this path is only reachable post-badge (and tier 9 is excluded entirely), `awardGymWin()`'s "already earned" guard means it never grants a new badge, only TM/reward grants and tier-progression tracking.
- **Repeat-win tier progression requires no new logic** — `awardGymWin()` already gates badge/TM grants to first-win-only and only advances `gymProgress` when `getForcedTier()` rises (which only happens via a genuinely new badge), so repeated offline wins at an already-cleared gym behave identically to live: no further badge, no further TM, no tier change.
- A loss during offline catch-up has no penalty (matches live) and the loop continues to the next cycle.
- If an offline gym result leaves the party fully wiped, it flows into the existing offline wipe/heal-relocate handling (see "Offline Wipe & Auto-Repeat") with no separate wipe-handling logic needed.

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

### Gym Battle Default Question (SETTLED — v0.44)
A second one-time modal chains immediately after the welcome preamble (same `!hasSave`-gated trigger, no dismiss-by-clicking-outside — requires an explicit NO/YES choice), asking whether the player wants to manually fight each gym for the first time (NO) or a more idle experience (YES). Sets a persisted `state.gymBattleDefaultPreference` boolean (`false` for NO; defaults `false` for any save predating this question). **Not a master switch** — every location's Gym Battle checkbox stays individually overridable via the mission modal afterward; it only changes what an as-yet-untouched location's checkbox starts as, for an unearned badge: `renderMethodPrefs()`'s `gymChecked` default becomes `gymHasBadge||!!state.gymBattleDefaultPreference`, and `pickMethodForLocation()`'s no-prefs roll-time fallback gets the identical addition, keeping the displayed default and actual roll-time behavior in sync. The post-wipe gym exclusion (`aide.wipeRecallLocation`, see Gym System) applies unconditionally regardless of this preference — YES makes gym battles more common everywhere, but never reintroduces the recall-and-repeat loop right after a wipe. `SAVE_VERSION` bumped to `30` for the new field.

---

## Info Menu (SETTLED — v0.27, NEW)

- New "Info" button, fixed bottom-right, **visible on the Party tab only** (not Log/Dex/Map).
- Opens a 2-level flow styled like the existing Mission Behavior selector:
  - **Level 1:** a list of 9 topic tiles — titles only, no numbers: Objectives, Playable Characters, Dex Completion, Cash Generation, Level Caps, Time, Battles, Map, Wild Encounters.
  - **Level 2:** clicking a topic opens one scrollable text page for that topic. Sub-items from the source copy (e.g. "Moves" under Battles, "Evolution" under Dex Completion) render as **in-page bold headers** with their text underneath — not additional clickable tiles. A Back button returns to the topic list.
- No `state` changes — this is UI/content only, no SAVE_VERSION impact.
- All copy was verified against the actual live game constants before being locked in: shiny rate 1/4096, income formula ($1.00/min base + $0.01 per 100 catches), and tick intervals (10s open / 30s closed) all match code exactly. **Level cap formula:** the "Level Caps" topic must track the live formula in "Level Cap" above (currently `15 + badges×10`, changed from `10 + badges×10` in v0.33) — this copy was updated to match at that time; re-verify this line whenever the Level Cap formula changes again, since it's easy for topic copy to silently drift from a game constant it merely quotes.
- Full topic copy lives in the v0.27 change-request thread / commit message — not duplicated here to avoid drift between two copies of the same text; treat the in-code strings as canonical once implemented.

### `INFO_TOPICS` Extracted to `info.js` (SETTLED — v0.43)
`INFO_TOPICS` is generated data, not a hardcoded inline array — sourced from a dedicated Excel **Info** tab (`category | subCategory | text`, one row per idea) via `converter.html`'s `convertInfo()`, which groups rows by `category` in first-appearance order into `{id: category, title: category, sections: [{header: subCategory||null, text}]}` and outputs `info.js`'s `const INFO_TOPICS = [...]`. `text` is stored/rendered as raw HTML (`<br><br>` authored directly in the cell for line breaks). `showInfoMenu()`/`renderInfoTopicList()`/`renderInfoTopicPage()` and the hardcoded "🎨 Display" tile (first, unaffected — it's not part of `INFO_TOPICS`) are otherwise unchanged.

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
  - **Scope — Accent covers, and only covers:** header title + header border, active-tab underline, aide name, Battle Gym button, and all modal titles/borders (Pokémon detail modal, Day Care modal, Welcome modal, and the Destination/Mission modal — currently inconsistently red vs. light-blue across these; unified under Accent). *(v0.36: the map's selected-node ring, briefly moved to Accent here in v0.35, reverted to fixed gold — see "Map System — Fixed Palette Restoration." No longer part of Accent's scope.)*
  - Everything else that currently reads as "interactive-ish" but isn't brand/critical — informational captions, Level text, research-tested text — pulls from Main's `text` (at reduced opacity), not Accent.

### Fixed Constants (never theme-driven)
The following stay hardcoded regardless of theme choice, for the same legibility reasons as the existing HP-bar-state convention:
- `TYPE_COLORS` (the 18-entry type-chart map)
- HP bar states (high/mid/low)
- Success-green (primary/positive actions)
- Currency-gold
- Log-category colors (catch/evolve/damage/etc.)
- **v0.35 addition:** all warning/error states — fainted-Pokémon border, save-indicator error state, "Database not loaded" messages, "Need 1 TM" warnings, gym-battle-lost text. These previously reused the same red hex as the (now theme-driven) Accent color; consolidated onto the existing danger constant (`#e74c3c`, already used for damage-log/low-HP) so they read consistently as "something's wrong" independent of the player's theme.
- **v0.36 addition:** Map System colors — node fills, location labels, connector lines, and the selected-node ring (see "Map System — Fixed Palette Restoration").
- **Implementation Note:** any new subsystem's colors must be added to this list explicitly, at the time that subsystem is built or first themed — a theme sweep pass will otherwise pull it into theme tokens by default, and if that subsystem's default colors happen to collide with the background/panel tokens (as Map System's route-node color did against the page background under v0.35's sweep), the result is a silent legibility regression rather than an error. This has already happened once (Map System, v0.36) — check this list before assuming any color is safe to leave untouched.

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

### Pallet Town → Full Shop; Aide Hiring Relocated to Key Items (SETTLED — v0.44)
Pallet Town's `shopTier` changed from `"lab"` to `"full"` in `locations.js`; `aide-hire-2`'s `shopTier` changed from `"lab"` to `"full"` in `items.js` (`itemCategory` stays `"aide-hire"`). `SHOP_CATEGORY_MAP` gains `'aide-hire':'keyItems'`, surfacing it in the shop's existing Key Items tile alongside `hm`/`keyItem`/`rod`/`tool`. `buildShopItemRowHtml()` special-cases `item.effect==='hire-aide'`: renders a single button calling `hireAide()` directly (not `buyItem()` — `hireAide()` independently handles its own funds check and the `confirmHireAide()` emoji-picker flow), no ×1/×100/×1000, no bag-count display, disabled/hidden once `state.aides.length>1` (the same one-time-ever gate as before, just relocated). `buildHireAideButtonHtml()` and its standalone call in `renderParty()` are removed entirely, since the shop listing fully replaces it. This makes the previously-outstanding "`hasLab` boolean field" idea moot — Pallet Town now uses the real `shopTier:'full'` mechanism instead of a hardcoded `currentLocation==='palletTown'` check (struck from "Things That Are Future Goals").

### Once-Per-Aide Purchase Limit for Key Items (SETTLED — v0.44)
Applies to every item where `SHOP_CATEGORY_MAP[item.itemCategory]==='keyItems'` except the hire-aide item (governed entirely by the section above instead). Every other item in that group (`hm-*`, `pokeFlute`, `safariPass`, `silphScope`, `sSTicket`, `goodRod`/`oldRod`/`superRod`, `bicycle`/`coinCase`/`expShare`) is `bagType:"Trainer"` and `isConsumable:false`, so "already purchased by this aide" is fully answered by the existing `aide.trainerBag[itemId]` count — no new state needed. `buildShopItemRowHtml()` renders a single "Buy" button for these (no ×100/×1000 — never useful for a non-stacking one-per-aide item), showing a disabled "Owned" state once `(aide.trainerBag[itemId]||0)>=1` for the currently-shopping aide. `buyItem()` gets the identical check as a defensive backstop and clamps `qty` to 1 for these items regardless of the value passed in.

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
- `calcMaxHP(sp, lv, dexId=null, iv=0, formName=null)` → resolves the species via `getPokemonEntry(dexId, formName)` if `dexId` given, else falls back to `SPECIES[sp]`; then `floor((2×base+iv)×level/100)+level+10`. Nature never applies to HP. (`formName` param added v0.33 for Same-DexId Branching Form Evolutions — after this section was originally written; call sites needing a specific form's base HP must pass it explicitly.)
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

### Pokédex-Wide Perfect IV / Unicorn Indicators (SETTLED — v0.40)
- Species-level aggregate indicators, reusing the exact `getRarityBadge()` convention above rather than inventing new emoji: 💥 for Perfect IV, 🦄 for Unicorn (shiny AND perfect IV on the same individual). Two new aggregate functions, mirroring `hasLiveShiny()`'s "any live individual of this species" pattern: `hasLivePerfectIV(dexId)`, `hasLiveUnicorn(dexId)`.
- **Suppression rule:** unicorn supersedes, doesn't stack — check unicorn first; if true, show only 🦄. Otherwise check shiny and perfect-IV independently.
- **Scope — all three sites the shiny badge already appears:** Pokédex grid cells, evolution-chain nodes, species detail page header. Official Pokédex mode is unaffected — it uses a decoupled "preview" concept (`dexOfficialShinyPreview`) rather than real ownership, and Perfect IV/Unicorn have no equivalent "official" concept to preview.

### Perfect-IV Species-Cap Exemption (SETTLED — v0.31, NEW; REVERSED v0.37)
- ~~`checkSpeciesCap()`'s auto-release-on-catch-overflow check extended from `if(caught.isShiny) return;` to also exempt `isPerfectIV(caught)` — mirrors existing shiny behavior exactly.~~
- ~~The manual cap-lowering sweep (`onSpeciesCapChange`) gets the same exemption — perfect-IV individuals excluded from the release-eligible pool alongside shinies, regardless of how low the cap is set.~~
- **v0.37 — exemption removed entirely.** Perfect-IV individuals now behave exactly like any normal individual for species-cap purposes: they count toward the per-species cap total, can trigger and receive Family IV Inheritance donation (see below), and can be released via either fallback path (batch-collect weakest-by-move-power, or manual cap-lower sweep) with no special protection. **Shiny exemption is untouched** — shinies remain fully exempt everywhere this section describes.
- Confirm dialog text (see "Per-Species Catch Cap" above) updated: *"shiny/perfect-IV Pokémon excluded"* → *"shiny Pokémon excluded."*
- Rationale: previously, a perfect-IV individual could never donate its IVs via Family IV Inheritance, since it short-circuited out of `checkSpeciesCap()` before reaching that logic — meaning a freshly-rolled perfect individual could never upgrade an existing weaker family member. Removing the exemption lets that donation actually happen.

### SAVE_VERSION
- 19→20 bump — see the central Versioning table for the migration (retroactive `ivs`/`nature` roll + `recalcStats()` for existing party/dex Pokémon, not repeated here).

### Nature Mint (SETTLED — v0.36, NEW; category corrected v0.44)
- New item `natureMint` — Excel: `consumable` category (was mis-set to `"tool"` in the data at some point after this spec, silently shop-grouped alongside reusable tools instead of Consumables; corrected v0.44, data-only, no code change), $100, shop tier Full, `requiresTarget: TRUE`, `bagType: Professor`.
- Poke-modal's Friendship line gets a "Change Nature" button, disabled at 0 Nature Mints owned.
- New nature-picker modal (layered like the move picker): lists all 25 `NATURES`, each labeled with its effect (e.g. "Adamant — +ATK/-DEF"). The individual's current nature is shown grayed out/disabled. Requires a confirmation step before committing.
- On confirm: consumes 1 Nature Mint, sets `p.nature`, calls `recalcStats(p)`, logs it, refreshes the poke-modal. `confirmNatureChange()` already correctly decrements bag stock on use, matching its `isConsumable: true` flag.
- No SAVE_VERSION impact (`p.nature` already exists since v0.31).
- **Implementation Note:** new UI elements must use theme tokens (`var(--accent)`, `var(--main-*)`) from the start, never a hardcoded hex — this button and its modal shipped with `#9b59b6` hardcoded in three spots instead of `var(--accent)`, a gap in Theming System's Accent scope that wasn't caught until v0.37.
- **Implementation Note:** don't use the native HTML `disabled` attribute when a control needs to give feedback on why it can't be used — `disabled` silently blocks click events, so clicking with 0 Nature Mints gave no feedback at all. Fixed (v0.37): `disabled` removed (dimming replicated manually via `opacity:0.4`), and clicking at 0 now opens a themed message modal explaining what's needed.

---

## Nickname-Triggered Evolution Branches (SETTLED — v0.31, NEW, revised v0.36)

- New `EvoTree` column `evolveNickname` (blank for most rows) — fully generic, species-agnostic. No dexId is ever referenced in this logic; it applies to any branch a nickname trigger is set on, present or future.
- New "Evolution Secrets" entry in the in-game Info menu (`INFO_TOPICS`) — general hint that nicknames can lock in certain evolutions, without spoiling species or exact trigger words.
- Jack's data task (any time, no code changes required): populate `evolveNickname` on whichever `EvoTree` rows desired — no hardcoded list, works on any row it's set on. Already near-comprehensive as of this audit: **86 of 109 EVO_TREE branches (79%)** have it populated, covering Raichu, Vileplume/Bellossom, Poliwrath/Politoed, Slowbro/Slowking, and most Alolan/Galarian/Hisuian form branches — well beyond the original Koffing/Weezing and Espeon/Umbreon pilot pairs.

### Full Exclusivity Lock (SETTLED — v0.36, corrects v0.31 design)
- The nickname lock is purely **exclusionary**, not a substitute qualifier. `getNicknameEvolveLock(p)` returns the one branch (if any) whose `evolveNickname` is a substring of the nickname (case-insensitive, trimmed) — or `null`. A lock does **not** make its branch fire early or bypass its natural condition (day/night clock, friendship threshold, move equipped, etc.). It only removes every *other* branch from consideration until the locked branch's own real condition is met naturally.
- **Implementation Note:** an exclusivity lock must be checked before natural-condition qualification narrows the candidate list, not after — the original v0.31 design let a nickname match win only among branches that had *already* passed their own natural condition check, which meant a lock could never override anything for mutually-exclusive natural conditions (e.g. day/night): only one branch was ever a candidate at all by the time the nickname check ran.
- Scope spans **all three** evolution touchpoints:
  - `checkEvolution()`/`applyEvolutionSilent()` — branch qualification is otherwise unchanged; the naturally-qualifying list is simply narrowed to the locked branch when a lock is active. If the locked branch isn't naturally qualifying yet, evolution just doesn't happen this check.
  - `professorAutoTestEvolutions()` — the background stone-testing sweep excludes any individual whose lock target doesn't match the item/branch being tested.
  - `applyItemEvolution()` — manual item use refuses (same style as the existing `evolveBlocked` message) if the target doesn't match the individual's lock.
- **UI:** poke-modal shows a lock indicator near the nickname field when active (e.g. "🔒 Locked — will only evolve into Espeon").
- Match stays substring-based. No SAVE_VERSION impact.

---

## Raichu / Alolan Raichu — Player-Choice Item Evolution (SUPERSEDED v0.33)

Fully superseded by "Same-DexId Branching Form Evolutions" below — the mechanism this section originally described (per-branch confirmation via `.filter()` instead of `.find()`) is still true, but the identity-collision bug it left unfixed (Kantonian/Alolan Raichu sharing `{method, intoId}`) is what the next section's fix addresses. See the Resolved Bug Index for the specific v0.31/v0.33 history; nothing here is current behavior on its own anymore.

---

## Same-DexId Branching Form Evolutions (SETTLED — v0.33, NEW, supersedes v0.31 Raichu section above)

### Scope
Any species where two `EVO_TREE` branches share a `toDexId` but differ by `toFormName` — confirmed affected: Raichu (Kantonian/Alolan, Thunder Stone), Sandshrew→Sandslash (Kantonian/Alolan, Leaf Stone), Marowak (Kantonian level-up/Alolan friendship-night), Weezing (Kantonian level-up/Galarian level-up). Fixed at the mechanism level — no per-species special-casing, applies automatically to any future dual-form branch pair too.

### Compounding Gaps (all keyed on dexId alone)
Any species where two `EVO_TREE` branches share a `toDexId` but differ by `toFormName` exposed the same underlying gap in four places at once: the `confirmedBranches` duplicate-guard (compared only `{method, intoId}`, so form-variant branches collided into one entry), Evolution Chain Visual's edge construction (dropped `toFormName`, rendering colliding duplicate boxes), `getPokemonEntry(dexId)` (always resolved the `formName: null` row — no way to fetch a specific alternate-form row at all), and individual Pokémon objects themselves (`applySpeciesSwap()` wrote `species`/`pokedexId` only, so an evolved Alolan Raichu was indistinguishable from a regular one everywhere downstream). Fixed at the mechanism level below — no per-species special-casing, applies automatically to any future dual-form branch pair too.

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

### SAVE_VERSION
- Part of the v0.33 SAVE_VERSION 20→21 bump — see the central Versioning table for the `p.formName` backfill migration, not repeated here. The accompanying `confirmedBranches` reset migration (see "Confirmation Requires a Live Candidate" above) is folded into the same pass, not a separate bump.

### Move-Picker, Battle-Math, and Display Fixes (SETTLED — v0.36, extended v0.34/v0.40)
- Several `getPokemonEntry(dexId)` call sites were still missing the individual's `.formName`, silently falling back to base-form data — the same class of bug this section already exists to prevent, found recurring in new areas:
  - `buildMovePickerHtml()` — TM picker showed only the base form's learnable move slots (e.g. Alolan Raichu's Psychic slot never appeared).
  - `openMoveSlot()` — viewing/upgrading a form-exclusive equipped move read the base form's power cap.
  - `confirmMoveAction()` — same fix, for consistency.
  - `calcBattleDamage()`/`getBattleSpeed()` — STAB and type-effectiveness silently used base-form typing during real battles.
  - Watched-battle screen and battle-log lines — showed the base form's name mid-battle.
  - `getEvolutionDisplayText()` — a confirmed alt-form branch displayed using the base form's name.
  - `showPokemonDetail()`'s type/height/weight — read the base form's data for a form-variant individual, despite the stat table (fetched correctly elsewhere in the same function) already reflecting the true form-specific base stats.
- Fix: thread `.formName`/`toFormName` through all of the above. No SAVE_VERSION impact.
- **Poke-modal title duplication (v0.34):** the title concatenated `getDisplayName(p)` — which already appends `(formName)` for un-nicknamed form-variant individuals, see Nicknames — with a second, redundant `(p.formName)` append, producing e.g. "Raichu (Alolan) (Alolan)". Fixed by removing the redundant append.

---

## Cheat Codes — AdminMode, TurboMode (SETTLED — v0.32, revised v0.33)

- Purely live-derived, nothing persisted, no SAVE_VERSION impact — matches the v0.23 shiny-badge pattern (reflects current state only, no cached flag).
- Both cheats key on `p.id===1` — the literal first-ever catch, by permanent catch-order identity, never touched by evolution (`applySpeciesSwap()` only ever writes `species`/`pokedexId`/`formName`, never `id`) — checked against the **full `state.dex`** (every ever-owned individual, not just the active party — a boxed Catch #1 still activates either cheat), plus a nickname match (trimmed/lowercased).
- **Implementation Note:** anything meant to persist across evolution must key on catch-order identity (`p.id`), never species identity (`pokedexId`/`dexId`) — the same class of mistake as the dexId-identity pattern in Data Architecture, but inverted: here the bug was using species identity where permanent individual identity was the actual intent. AdminMode originally also required `pokedexId===19` (Rattata) and silently stopped working the moment Catch #1 evolved into Raticate; fixed v0.33 by dropping that check entirely.
- `isAdminModeActive()`: true if any individual in `state.dex` has `id===1` and nickname (trimmed/lowercased) equals `"adminmode"`.
  - `buyItem()`: when active, price is treated as `$0` for all shop purchases (both `professorBag` and `trainerBag` items) — funds check skipped entirely, full requested quantity granted, `state.funds` untouched.
  - Shop display shows `$0 ea` per item while active, for visible confirmation the cheat is live.
- **`isTurboModeActive()` (v0.33, NEW):** true if any individual in `state.dex` has `id===1` and nickname (trimmed/lowercased) equals `"turbomode"`.
  - New helper `getEncounterInterval(isOpen)` returns `1` when active, else the normal `ENC_INTERVAL_OPEN`/`ENC_INTERVAL_CLOSED`. Every site that sets `state.nextEncounterIn` — live `gameTick()`, mission-modal resets, initial party-member creation, and `processOfflineTime()`'s catch-up loop — reads through this helper instead of the raw constants. Both the open (10s) and closed/offline (30s) intervals drop to 1s.
  - **Offline catch-up safety cap:** `processOfflineTime()`'s `while(remaining>=nextIn)` loop gets a hard cap (2,000 iterations). If a long offline gap is processed while TurboMode is active, remaining offline time past the cap stops simulating individual encounters — funds/friendship still accrue from `secsAway` directly, unaffected, only encounter-by-encounter simulation stops. Prevents a real freeze/hang on reopen.
- Either cheat deactivates immediately (next check) if its nickname is changed or Catch #1 is released — no extra logic needed since nothing is cached; this is the intended "removing the nickname stops the mode" behavior, achieved for free by being purely derived.
- Precedent-setting pattern for future cheat codes via nickname parsing (see "Things That Are Future Goals").

### CheatN — Nickname-Triggered Release-and-Replace (SETTLED — v0.40)
Hooked into `saveNickname(catchId)`, checked *before* the literal nickname is applied: if the trimmed input matches `/^cheat(\d+)$/i` (case-insensitive) and the captured number is a real `dexId`:
1. If that `dexId` has more than one form in `POKEDEX_DATA`, show a picker modal listing every raw form (unfiltered — no Mega/cosmetic exclusion). Nothing is released or created until a form is chosen; cancelling leaves the original individual and its nickname-in-progress untouched.
2. Single-form species skip the picker and proceed directly.
3. Once the form is resolved: release the original individual (same mechanism as "Select Pokémon to Release" under Pokémon Storage), generate a replacement at the chosen `dexId`/form via `makePokemon()` **at the same level** as the one just released, taking the same held/boxed status and slot as the original.
4. **Shiny/Normal question (v0.43):** shown for **every** CheatN invocation, including single-form species (which previously replaced instantly with zero questions) — a `showCheatShinyPicker(catchId, targetDexId, formName)` modal with "✨ Shiny" / "Normal" buttons. `performCheatReplace()` takes a 4th param `isShiny=false`, setting `replacement.isShiny` post-creation (purely cosmetic) and adjusting the log message when true. Flow: single-form → shiny choice → replace; multi-form → form choice → shiny choice → replace. Nothing is created until the final choice is made.

If the captured number doesn't correspond to a real `dexId`, no special behavior fires — the input just applies as a literal nickname.

**Implementation Note:** required extending `makePokemon()` with an optional trailing `formName` parameter (default `null`, so all pre-existing call sites are unaffected) — it never supported spawning a specific form before this.

---

## Universal Selection Highlight (SETTLED — v0.39)

Standardizes the visual "selected" state across every selectable-item modal where a selection persists on screen (list stays visible, confirmed via a separate action) — full modal audit done v0.39, see below for what's excluded and why. Same treatment for single-select and multi-select.

**Standard:** 2–3px solid border in the accent color family (`var(--accent)` or `var(--accent-light)`, matched per-element to whichever the surrounding UI already uses for that element type — e.g. filled/dark backgrounds get the lighter variant for contrast), replacing whatever ad-hoc highlight (or lack of one) previously existed.

**Added (previously no highlight):**
- Mission destination picker (`renderDestList()`) — highlights the button matching `state._missionDest`; `selectMissionDest()` now calls `renderDestList()` after setting the destination so the highlight actually renders.
- Daycare breeding Parent B picker (`renderDaycareModalStep2()`) — `daycarePickerRowHtml()` takes a new optional `isSelected` param; highlights the row matching `daycareParentB`. Parent A (step 1) intentionally does NOT pass this param — picking a row there immediately navigates to step 2, so nothing persists on screen to highlight.

**Restyled (previously highlighted, inconsistent style):**
- Dex Type/Move-Type filter swatches (`openDexTypePicker()`) — was `outline:2px solid #fff`, now the standard border.
- Wander mode buttons (`selectWanderMode()`/`selectMissionDest()`) — was a full inline style-swap (border-color only, no explicit border-width, relying on the button's default) — now explicit `border:2px solid var(--accent)`.
- Theme custom-color swatch picker (`themeSwatchButtonHtml()`) — was `3px solid var(--accent-light)`, now the standard 2px accent.

**Explicitly out of scope:**
- Nature picker, Move add/change picker, TM-quantity picker, evolution-branch resolution — all fire their action and close the modal immediately on click; no selected-but-unconfirmed state ever persists on screen, so there's nothing to highlight.
- Map location node (SVG circle, map click handler) — structurally different (SVG `stroke`/`stroke-width`, not a CSS `border`) from every other case here; left with its existing gold-stroke treatment rather than forced into an ill-fitting spec.

No `SAVE_VERSION` impact — purely presentational.

---

*Generation-themed Silph Tower encounter floors were built and shipped in v0.39, then fully reverted in v0.39.1 due to a boot-time performance regression (~560ms added at every page load, worse on mobile) — not pursuing this approach again without a fundamentally different implementation.*

---

## Aide Roster & Hiring (SETTLED — v0.39.1)

Introduces a second aide, purchasable once. Restructures aide-owned state from singular fields into a `state.aides[]` array — **true parallel play**: two aides can be at different locations, on different missions, rolling encounters independently and simultaneously, every tick. This is a real architecture change, not a UI-only addition.

### Scope decision (confirmed)
Two aides run **fully in parallel** (not a "one active at a time" roster). Cost: `gameTick()`/`rollEncounter()`/`processOfflineTime()`'s per-tick simulation work now runs once per aide, so it scales linearly with aide count — permanent and compounding for any future 3rd+ aide, unlike the Silph Tower regression (which was a one-off fixable inefficiency, not an inherent cost of the feature). Accepted as the correct tradeoff for true parallel play.

### `state.aides[]` structure
Carl Oak is migrated into slot 0 (not special-cased separately from the new hire). Each aide entry owns:
- `id`, `name`, `emoji`
- `party` (was `state.party`)
- `trainerBag` (was `state.trainerBag` — **badges live here too**, as `itemCategory:'badge'` entries; no separate badge field needed, confirmed against `items.js`)
- `currentLocation` (was `state.currentLocation`)
- `missionDestination`, `currentEncounter`, `nextEncounterIn`, travel-path state (was `state.missionDestination`/`state.currentEncounter`/`state.nextEncounterIn`/etc.)

**`dex` (the box) is explicitly NOT per-aide — corrected in v0.39.3.** It shipped as per-aide in v0.39.1, which was wrong and directly caused a real bug: the box-browsing UI, breeding, and cheat-code detection all only ever read `aides[0].dex`, so anything Faraday caught himself was invisible and there was no way to assign anything to his party at all. `state.dex` is a single shared box (Professor-managed storage) across every aide — same "shared ledger" framing Jack applied to the log. Only the active 6-slot `party` is per-aide; any aide can be assigned any box individual, from either aide's own catches.

**Stays global/shared (Professor-owned, unaffected):** Pokédex/species-seen/caught records, `state.dex` (the box, corrected above), `state.funds`, Professor-side inventory (`state.professorBag`). Only party/inventory(+badges)/location/mission/travel state moves into `aides[]`.

**`SAVE_VERSION` bump required**, with a migration: existing saves' singular `state.party`/`state.trainerBag`/`state.currentLocation`/etc. get wrapped into `state.aides[0]` (Carl Oak, name/emoji preserved as `"Carl Oak"`/🧑‍🔬 — his existing emoji, not drawn from the new hire palette) on first load post-upgrade. **v0.39.3 — a second migration step**, since `dex` moved back out of `aides[]`: every aide's pre-existing `dex` array (not just `aides[0]`'s) is merged into the new shared `state.dex`, so a save where Faraday had already caught something doesn't lose it. Verified via a hand-crafted fake v26 two-aide save with a real individual in each aide's box.

### Hiring
- New Lab shop item, Professor-side purchase (`professorBag`), **$100**, `itemCategory` new value (e.g. `aide-hire`), **max 1 purchasable ever**. Precedent for a hard purchase cap needs establishing during implementation — no existing item currently enforces "buy once only," this will be new logic, not a reuse of an existing pattern.
- Purchasing immediately creates the second aide: fixed name **"M. Faraday"** (not player-editable), blank-slate `party: []` (player assigns from box manually — no starter given, unlike Carl Oak's `Rattata` at game init), blank `trainerBag` (starts with zero badges/items, same as a fresh aide would), starting `currentLocation: 'palletTown'`.
- At purchase time, player picks Faraday's `emoji` from a fixed palette grid: gender-presentation × skin-tone head emoji (e.g. 👨🏻👨🏽👨🏿👩🏻👩🏽👩🏿🧑🏻🧑🏽🧑🏿 — ~9-12 options). This picker is Faraday-specific; Carl Oak's emoji is not reassignable through it.

### Map
Each aide renders its own emoji marker at its own `currentLocation`. Same-location collision: small fixed pixel offset (e.g. ~8px left/right of the node's true position) rather than a stacked counter-badge — chosen because it generalizes cleanly to 3+ aides at one node (fan out further) without needing a redesign later.

### Party/roster screen
Per-aide collapsible sections. **Fixed order, not reorderable:** Carl Oak always first (slot 0), Faraday second, any future aide appended after in hire order. Collapsed state still shows name, party, and badges — collapse is purely visual density control, never hides status info. Start/Recall mission control requires expanding that aide's section (not exposed in the collapsed view).

### Mission assignment
No shared/global mission modal entry point anymore. Each aide's section in the Party/roster screen gets its own "Send on Mission" button, opening the existing mission-destination flow scoped to that specific aide (destination picker, confirm, etc. — same flow as today, just invoked per-aide instead of globally).

### Box assignment (SETTLED — v0.39.3)
`assignToAide(catchId, idx=0)` and `unassignPokemon(catchId)` — the functions behind the Pokémon detail modal's "+ Party"/"− Remove" buttons — were still entirely hardcoded to Carl Oak through v0.39.2, on top of the `dex` field-ownership bug above: even after that's fixed, nothing let the player choose *which* aide received an assignment. Fixed together: `assignToAide()` now takes a target aide index (the heal-location gate checks that specific aide's own location, not always Carl Oak's), and the detail modal renders one "+ [Aide Name]" button per aide instead of a single hardcoded "+ Party". `unassignPokemon()` searches every aide's `party` to find whichever one currently holds the individual, rather than assuming Carl Oak.

### v0.39.5 — Comprehensive Carl-Oak-Hardcoding Audit
Triggered by real-play reports (a `checkSpeciesCap` crash, a cross-aide level-cap bug, Faraday's items missing from the bag, and a confusing "3 catches in a row" log read that turned out to be two aides' unattributed encounters interleaved). Jack asked for a full pass finding every place the code assumes Carl Oak specifically.

**Implementation Note — this is a recurring failure class, not ten independent bugs:** once a second aide exists, *any* function that reads `state.aides[0]` (or a Carl-Oak-specific field) directly instead of taking an aide index/reference will work correctly for Carl Oak and silently misbehave for every other aide — often invisibly, since Carl Oak was the only aide during most of development and testing. This pattern recurred across at least ten unrelated subsystems in one pass: species-cap checking (crashed on virtually any catch — a stale search pattern missed an arrow-param `a.dex` reference), level-cap lookup (`getLevelCap()` called with no argument — Faraday's Pokémon frozen at the wrong level), the bag/inventory modal (`showBagModal()` only built a section for `state.aides[0]` — Faraday's items invisible), wild-encounter log messages (no aide attribution, reading as one confused story instead of two parallel ones), mission-modal summary text, the Findings Report title, the entire watched gym battle system (`renderTeamOrderModal()`, `confirmTeamOrder()`, `runWatchedBattleLeg()`, `finishWatchedBattle()` — despite `watchedBattle.aideIndex` already tracking the real triggering aide; a second aide's battle would run and award the badge to Carl Oak's team), route-table/pathfinding `requiresItem` gating (`buildRouteTable()`, `buildTravelPath()`, `getReachableDiscoveredLocations()`, `computeMissionDistance()` — checked the wrong aide's inventory), the `in-party` evolution condition (`hasPartyMate()`), and shop purchases (routed into the wrong aide's bag). Every one of these had already been "fixed" once in a prior pass under the assumption that fixing the obvious call sites was sufficient — it wasn't. When adding a second (or third) actor to a previously-singleton system, audit for the literal string pattern *and* equivalent short-variable-name forms (`a.dex`, not just `aide.dex`), and verify by directly testing the second actor's own state, not just that the first one still works.
- **Audited and confirmed correct, no change needed:** every remaining `state.aides[0]` reference is now either a legitimate default parameter (safely overridable by every real caller), `loadGame()`'s migration fallback, `init()`'s fresh-game creation, or the Daycare/breeding lines — confirmed intentionally deferred (see "Explicitly out of scope" above).

### v0.39.6 — Badges/Level Cap Readout Restored, Genuinely Per-Aide
`buildAideCapReadoutHtml(aide)` renders "🎖 Badges: X/8 · Level Cap: Y" (+ Champion note if applicable) inline inside each aide's own expanded Party-tab section, computed from that aide's own `trainerBag` — resolves the display gap v0.39.5 flagged when it removed the old Carl-Oak-only `#badge-cap-display` element. Only shown once `TRAINERS_DATA` is loaded.

### Explicitly out of scope for v0.39.1
- Firing/releasing an aide once hired
- Reordering aides
- More than 2 aides (though the array structure and map-offset mechanic are both designed to extend cleanly to a 3rd+ if that's ever revisited)

### Implementation notes — deviations from the original spec above, and known limitations

- **Hiring is NOT routed through the location-based shop system.** `shopTier:'lab'` is referenced in pre-existing code comments but was never actually wired to any location or to `getShopItems()`'s `tierOrder` (confirmed dormant — same root cause as the earlier "duplicate poke-ball, shopTier:lab" bug history entry). Rather than risk touching the shared shop-rendering system for one narrow, one-time special purchase, hiring gets its own dedicated "🧑‍🔬 Hire Second Aide — $100" button directly in the Party/roster screen (shown only while `state.aides.length===1` AND at least one aide is at Pallet Town), wired to `hireAide()`/`showAideEmojiPicker()`/`confirmHireAide()`. The `aide-hire-2` item still exists in `items.js` (itemCategory `aide-hire`, `shopPrice:100`, `bagType:'Professor'`) for data-consistency/documentation, but its `shopPrice` is read for display only — the purchase itself bypasses `buyItem()` entirely. **Gating stays `currentLocation==='palletTown'` directly, NOT `shopTier`, confirmed as the settled approach** — Pallet Town's existing `shopTier:'basic'` already drives its normal field shop, and `shopTier` is a single value, not a list, so setting it to a Lab-specific tier would have silently removed that basic shop. Jack confirmed the fix (a separate `hasLab` boolean field, so both can coexist) as a real future idea, not urgent — see "Things That Are Future Goals" below.
- **`aide-hire-2` was added directly to the local `items.js` file, not via Excel/`converter.html`, at the time.** Copyable Excel row provided to Jack directly in chat. **Resolved, confirmed via cross-file audit:** Jack maintains JS data files as an exact mirror of their Excel-tab source, so the row's presence in `items.js` (verified with the correct `shopTier:"full"`) confirms it's in the real Excel Items sheet too — not at risk of being lost on a future regen.
- **v0.39.2 — the battle engine is now fully aide-parameterized, live AND offline/TurboMode.** `runWildEncounterLoop()`/`runWildEncounterLoopSilent()`, `runGymEncounter()`/`runGymEncounterSilent()`, `runOneGymBattle()`/`runOneGymBattleSilent()`, `awardGymWin()`/`awardGymWinSilent()`, `healPartyBeforeGymBattle()`/`healPartyFullBeforeGauntletLeg()`, `awardPerKOExp()`, `catchPokemon()` — all now accept an aide index (default 0, so every pre-existing call site stays correct). **`processOfflineTime()` was previously entirely single-aide-only** (confirmed during this pass — closing and reopening the app, or any TurboMode catch-up, only ever simulated Carl Oak) — rewritten into a per-aide `processAideOfflineTime(idx,...)`, called once per aide with its own full simulation budget (each aide's own `remaining`/`nextIn`/2000-iteration cap, not split between them). A second aide now genuinely earns their own badges, both live and offline.
- **Per-species cap (`checkSpeciesCap`) is global across all aides' boxes combined, not per-aide** — this was already the stated design intent in the function's own pre-existing doc comment ("regardless of aide count"), now actually implemented: `sweepSpeciesToCap()`/`checkSpeciesCap()`/`removePokemonFromBoxAndParty()` all operate on `state.aides.flatMap(a=>a.dex)`. A wild caught by Faraday can donate IVs to (or trigger release of) an individual sitting in Carl Oak's box, and vice versa.
- **v0.39.2 — alternating collision priority, resolving the v0.39.1 "simultaneous encounters" flag.** If 2+ aides both roll a brand-new encounter in the same tick, they're processed in alternating order — first collision Carl-first, next collision Faraday-first, flipping only on a genuine collision (not every tick). Implemented via a single shared `aidePriorityFlip` toggle used by both `gameTick()` and `processOfflineTime()`, so the same fairness applies live, backgrounded, and under TurboMode (TurboMode is this same loop on a shorter interval, not a separate code path — confirmed, not assumed). **Confirmed by Jack as accepted, not a gap:** whichever aide processes second in a colliding tick still has its `#enc-body` text overwritten by whichever went first. Jack's framing — the log/encounter feed is conceptually "the Professor's Ledger," a single shared record, not per-aide attribution that needs preserving — means this is the correct final design, not a placeholder awaiting a two-modal fix.
- **Friendship ticking (`advanceFriendshipTicks()`) is a single shared global timer, not per-aide** — when it fires, it ticks every aide's party together. This was already gameTick()'s design (documented in the v0.39.1 entry above); `processOfflineTime()` is now consistent with it rather than trying to give each aide their own independent friendship clock, which would have meant sequentially-run offline loops fighting over a counter that was never designed to be split.
- **`watchedBattle`** (the full-screen watched-battle flow, gym or gauntlet) stays a single global variable with an `aideIndex` field added, rather than becoming a per-aide array — deliberate: the player can only watch one battle at a time regardless of aide count, so blocking a second aide's gym-trigger button while one is in progress is correct behavior, not a limitation.
- **Still explicitly out of scope, unrelated to battle resolution:** Daycare/breeding, Pokédex rendering (`renderDex*`), nickname/nature/move-editing modals, and item-usage-target pickers are still hardcoded to `aides[0]` by default-param fallback. None of these block a second aide from fighting, earning badges, or catching Pokémon — they're player-driven UI interactions the player would trigger while looking at a specific Pokémon, and converting all of them was judged lower priority than the battle-engine fix Jack explicitly asked for. Confirmed via `grep` that ~50 functions still reference `state.aides[0]` in this category — a bounded, known backlog, not a hidden gap.
- **Two data-loss-adjacent bugs found during v0.39.1 implementation:** (1) `saveGame()` initially still wrote the pre-v26 flat single-aide shape even after `state.aides[]` existed — would have silently discarded any hired aide's entire save on every autosave; found via an actual save→reload round-trip test, not just "does gameTick throw." (2) `loadGame()`'s tail section referenced old singular `#btn-start`/`#btn-recall` DOM elements (removed during the Party-tab restructure), throwing and getting silently swallowed by `loadGame()`'s own try/catch — a fully valid, correctly-migrated save would still report "load failed." Both fixed, covered by regression tests.
- **Verification:** 95 automated assertions across 11 jsdom-based test scripts (fresh boot, full mission flow, dual-aide `gameTick()` stress test, full save→reload round-trip, map rendering with both aides at the same location, full hire-flow, a complete realistic session end-to-end, a dedicated battle-engine test confirming Faraday's gym win credits his own `trainerBag` specifically not Carl Oak's, a CSS-layout regression test, a dedicated test assigning a box Pokémon to Faraday specifically, and a migration test using a hand-crafted fake v26 two-aide save to confirm no data loss when `dex` moved back to shared).

### Migration Correctness Lessons (v0.39.4)

Two data-loss bugs surfaced after real extended play (20 Pokémon across two aides, worked fine live, reload wiped the entire box) — both in `loadGame()`'s migration logic, both missed by v0.39.3's own tests.

- **Implementation Note — infer format from a direct structural check, not a sibling field's presence.** The v27-vs-v26 dex-source check used `s.aides && s.aides.length` to mean "this is a v26 save, dex is nested per-aide" — but `s.aides` exists on every save from v26 onward, including v27+ saves where `dex` is already correctly shared and top-level. Every reload of an already-migrated save re-derived `dex` from a per-aide field that doesn't exist there, silently producing an empty array. Fixed with a check on `s.dex !== undefined` itself — the field actually in question — instead of inferring format from something merely correlated with it.
- **Implementation Note — a per-object fix written against a single hardcoded instance doesn't generalize to a collection for free.** The party↔dex re-link (`state.party = state.party.map(...)`, restoring shared object references after a JSON round-trip) ran against the old flat `state.party` field during migration and never touched any additional aide's party — Faraday's party held disconnected copies after reload. Fixed with a second re-link pass, after the `aides[]` wrap completes, looping every aide.
- **Testing gap:** v0.39.3's migration test only covered the v26→v27 upgrade path (a hand-crafted v26 fixture), never reloading a save already in native v27 format — the actual scenario every real player hits on their second-and-later session. The round-trip test also only asserted on `aides[1].party`, not `state.dex`, missing the empty box entirely. Fixed: the round-trip test now populates a realistic ~20-Pokémon box split across two aides, asserts `state.dex.length` directly, verifies reference re-linking for both aides, and reloads twice to rule out a one-shot fluke.
- No `SAVE_VERSION` change — this was a load-logic bug, not a schema change; `saveGame()`'s output was already correct in v0.39.3, only the *reading* of it was broken.

---

*Generation-themed Silph Tower encounter floors were built and shipped in v0.39, then fully reverted in this version (v0.39.1) due to a boot-time performance regression (~560ms added at every page load, worse on mobile) — not pursuing this approach again without a fundamentally different implementation.*

---

## Version-to-Section Index (v0.40 through v0.44.4)

Every item shipped in these versions has been relocated to its topical section — nothing below is unique content, only a map from version number to where it actually lives, kept for anyone tracing a change back to when it shipped.

| Version | Items | Where they live |
|---|---|---|
| v0.40 | 7 | Day Care System (multi-aide access), Combat System (EXP Share), Pokémon Storage (ball-avoid toggle, Select Pokémon to Release), Gym System (passive/idle gym battles), Cheat Codes (CheatN), IVs/Natures cluster (Perfect IV/Unicorn indicators) |
| v0.41 | 4 | Game Loop (Render Focus-Guard), Encounter Methods (Gym Battle badge-aware checkbox), Map System (gym badge info), Pokémon Storage (Species Detail form-selection fix) |
| v0.42 | 3 | Branching Evolutions (`fromFormName`/`requiredGender`), Shedinja Creation (`shed`), Resolved Bug Index (Rockruff casing — since resolved) |
| v0.43 | 9 | Mission Modal — Wander Mode (discovery-ignoring) and Destination Sorting (level range), Data Architecture/Sprites (shiny-aware `spriteUrl`), Map System (missing-item gates), All Catches View (bidirectional sorting), Log Tab (Custom log view), Info Menu (`INFO_TOPICS` extraction), Pokémon Storage (Rattata #1 protection), Cheat Codes (shiny/normal question) |
| v0.44 | 15 | Evolution Research System (party-priority reservation), Mission Modal — Destination Sorting (location markers) and Wander Mode (tie-break, stale-destination fix), Shedinja Creation (auto rule-out), All Catches View (friendship display, Has Nickname filter), Day Care System (Ditto-first sorting, Research Mode), Pokémon Storage (universal species-cap enforcement), IVs/Natures cluster (Nature Mint category fix), Shop UI (Pallet Town full shop / aide-hire relocation, once-per-aide purchase limit), Gym System (post-wipe exclusion flag), Onboarding (Gym Battle Default question) |
| v0.44.1 | 2 | Mission Modal — Method Selection (newly-unlocked methods self-heal), Gym System (EXP batching). Versioning correction starts here — every prior v0.44-line delivery after the initial build was mislabeled "v0.44" instead of incrementing; see workflow.md for the standing rule going forward. |
| v0.44.2 | 1 | Gym System (Watched Gym Battle — Battle Gym button fix) |
| v0.44.3 | 2 | Revive Logic and Pre-Encounter Healing (both fixed to revive every fainted member per cycle, unconditionally, not gated behind an encounter rolling — see Trainer Battle System), dead code removal (`evoArrowDownHtml()`, see Branch Line-Break) |
| v0.44.4 | 2 | Combat System (Avoid Capped Species Toggle — first full spec written, and its HP-floor interaction bug fixed), version display (single `GAME_VERSION` source of truth, see Game Loop) |

`SAVE_VERSION`: 27→28 (v0.40), stays on 28 (v0.41–v0.43), reaches 30 across two bumps (v0.44), no bump (v0.44.1–v0.44.4, none of these touch save-file shape).

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
- ~~**`hasLab` boolean field on location data**~~ — **resolved v0.44.** Pallet Town's `shopTier` changed to `'full'` directly (see "Pallet Town → Full Shop; Aide Hiring Relocated to Key Items" under Shop UI); the Hire Second Aide button was removed and its purchase relocated into the generic shop's Key Items category, gated by the existing `state.aides.length>1` check instead of a hardcoded `currentLocation==='palletTown'` check.
- **New, v0.39.2: aide-aware Pokédex rendering, and nickname/nature/move-editing.** Currently all still hardcoded to `aides[0]` (default-param fallback) — Jack confirmed fine to defer, to be revisited later. *(Daycare/breeding specifically resolved v0.40 — see above.)*

---

## Outstanding Data Tasks (Jack's side — spreadsheet, not code)

- **Charjabug (dexId 737) instant-evolve data bug.** Currently `evolveMethod: "level"` with `evolveLevel: null` — coerces to `p.level >= 0` (always true), meaning it will evolve on its very next level-up. Jack confirmed the intended fix: `evolveMethod: "use-item"` with `evolveItem: "Thunder Stone"`.
- **Backlog: full Pokédex regen + form-hunting pass.** `fetcher.html` has no concept of hand-added alternate-form rows — any range re-fetch silently drops alternate forms sitting in that Excel row range (see Resolved Bug Index, v0.39 data corruption fix, for the standing limitation this task addresses). Planned: redo the full Pokédex tab from scratch via `converter.html`, then a dedicated pass to re-add every alternate form by hand. Not urgent; not blocking any current version.
