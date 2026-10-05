# PLAN — "Copy Paste Pro" Liberator Tampermonkey Script
## Re-enable copy, cut, paste, selection and right-click on hostile paywall pages

Status: BUILT + LAB-TESTED (see §8). File: `scripts/copy-paste-pro/copy-paste-pro.user.js`
Lab: `public/copy-lab.html` → served at `/copy-lab.html`

---

## 1. Objective

A Tampermonkey script that defeats copy-protection on hostile pages so that:

1. Copy / cut / paste always perform the browser default (page blockers never run).
2. Right-click context menu always opens.
3. Text selection works even under `user-select: none` CSS.
4. Ctrl/Cmd+C/X/V/A reach the page un-killed (outside editors).
5. Late-injected blockers (the "high level" trick: blockers added seconds after load, or re-added on SPA navigation) are disarmed by a watchdog.
6. All patching is forensically clean (`toString` cloaks, idempotent, zero globals).

## 2. Threat model — how hostile pages block you

| # | Vector | Page technique |
|---|---|---|
| C1 | `copy` / `cut` / `paste` events | Bubble listener calls `preventDefault()` |
| C2 | `contextmenu` | Same — kills right-click menu |
| C3 | `selectstart` + `user-select: none` CSS | Kills selection start + CSS-level ban |
| C4 | `oncopy`/`oncut`/`onpaste`/`oncontextmenu`/`onselectstart` properties | Property handlers assigned any time |
| C5 | `keydown` Ctrl+C/X/V/A killer | preventDefault + stopPropagation on combos |
| C6 | `dragstart` / right `mousedown` | Kills drag + right-button press |
| C7 | `beforecopy/beforecut/beforepaste` | Legacy Edge/IE gates |
| C8 | Clipboard-API shaming | Page detects empty clipboard read (out of scope — needs gesture+permission) |
| C9 | `::selection { background: transparent }`, `-webkit-touch-callout` | Cosmetic selection hiding |
| C10 | Transparent overlay DIVs swallowing clicks | Layout-breaking to remove — documented limit, not attempted |
| C11 | `toString` inspection of patched fns | Must read `[native code]` |
| C12 | Late / re-injected blockers | Blockers added at +Ns or on SPA nav |

## 3. Techniques (mirrors the Always-Active architecture)

- **Capture firewall first**: script runs at `document-start` and registers capture-phase listeners on `window`+`document` for C1/C2/C3/C6/C7. Capture runs before any page bubble listener, so `stopImmediatePropagation()` kills the page's blocker before it executes — with deliberately NO `preventDefault()`, letting the browser default proceed.
- **Shortcut firewall**: Ctrl/Cmd+C/X/V/A/Insert swallowed in capture, EXCEPT inside inputs/textareas/contentEditable (editors keep their bindings; host list kill-switch available).
- **CSS override**: `*{user-select:text !important; ...}` planted before page CSS; `!important` beats any site rule regardless of specificity.
- **Property disarm + watchdog**: `on*` handlers nulled on window/document at start and every 2s; style tag re-planted if removed.
- **MAIN-world injection**: same `<script>`-tag bootstrap as Always-Active (sandbox patches are invisible to pages).
- **WeakMap-idempotent cloak** shared design: re-injection can never launder fake source into `toString()`.

## 4. Acceptance matrix

| Case | Expected |
|---|---|
| Select + Ctrl+C on paywall paragraph | Copies; page `copy` listener never ran |
| Right-click anywhere | Native menu opens |
| Drag-select across `user-select:none` text | Selects normally |
| Ctrl+A then Ctrl+C in article body | Selects all + copies; editors unaffected |
| Late blocker at +2s, then copy | Still copies (watchdog disarmed it) |
| `document.oncopy` read by page | `null` |
| `getComputedStyle(el).userSelect` | `'text'` |

## 5. Test plan + URLs

### Primary lab (built): `http://localhost:4173/copy-lab.html`
Hostile simulator: bubble-phase preventDefault on copy/cut/paste/contextmenu/selectstart/dragstart, Ctrl-key killer with counter, `document.oncopy` property handler, `.paywall{user-select:none}` CSS, late blocker at +2s and on-demand. 8 lamps (P1–P8); protocol: install script → wait 3s (watchdog tick) → **Run all checks** → all green; then **late blocker** → re-run → still green.

### Secondary real-world
- A known paste-blocking signup/login form (paste SMS code / password).
- A paywalled article with `user-select:none`.
- Google Docs stays OUT of scope for shortcut interception (spared editables + kill-switch list).

### Known limits (in script header)
- C10 overlay DIVs; C8 clipboard reads needing gesture+permission; exact-source `toString` matchers after stacked re-injections (generic native string still passes `[native code]` regex checks).

## 6. Execution log (all verified)

1. Scaffolded `scripts/copy-paste-pro/copy-paste-pro.user.js` (config, stealth, firewall, shortcuts, CSS, disarm watchdog, MAIN-world bootstrap).
2. Cleaned shortcut matcher to exact-combo logic.
3. Built `public/copy-lab.html` hostile simulator + scoreboard.
4. `node --check` clean; lab deployed via `vite build` into `dist/`.
5. Playwright injection test: first run 7/8 — P8 (`oncopy` disarm) lost a race between the 2s watchdog and the check.
6. Fixed PROPERLY, not by lengthening the interval: prototype setter traps on `Window`/`Document`/`HTMLElement` swallow hostile `on*` assignments deterministically the instant they happen; interval only deletes sneaky own-props as backup.
7. Re-test: **8/8 PASS**, including a manual late-blocker injection mid-run. Screenshot of the green board on file.

## 7. Open follow-ups (not started)

- Add a second spotlight card for this extension on the K-Pass page (page currently spotlights only Always Active; needs your go-ahead + store URL).
