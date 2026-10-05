# PLAN — "Always Active" Pro Tampermonkey Script
## Spoof tab/window activity state so pages never detect backgrounding, tab-switching, or fullscreen exit

Status: PLAN ONLY — no script code written yet. Next session implements from this spec.
Scope: a single Tampermonkey userscript, pro-level stealth, plus a local test lab page.

---

## 1. Objective

A Tampermonkey script that makes **every tab behave as if it is always the active, visible, focused, fullscreen tab**, so that:

1. Background tabs keep playing / keep running (music players, timers, web apps).
2. Switching between multiple tabs is never detected by any open page.
3. Pressing **ESC to leave fullscreen is never detected** — the page keeps believing it is fullscreen and focused.
4. High-security pages (proctoring-style checks, strict media gates) are passed in all cases.

Non-goal: defeating OS-level surveillance (screenshots, camera, real input `isTrusted`, network timing). The script wins everything measurable **inside the DOM**.

---

## 2. Threat model — how pages detect you

| # | Detection vector | What the page does |
|---|---|---|
| V1 | `document.hidden` / `document.visibilityState` | Reads the property directly or in a loop |
| V2 | `visibilitychange` (+ `webkit`/`moz` variants) | Listens for hide/show events |
| V3 | `window blur` / `focus` events | Listens for focus loss (tab switch, alt-tab) |
| V4 | `document.hasFocus()` | Calls it on an interval |
| V5 | `mouseleave` / `pointerleave` on document/window | Detects pointer leaving the window (`mouseout`/`pointerout` deliberately NOT intercepted — they fire on every intra-page move and swallowing them breaks hover menus) |
| V6 | `fullscreenchange` / `fullscreenerror` | Detects ESC-exit from fullscreen |
| V13 | `pagehide` / `pageshow` / `freeze` / `resume` (Page Lifecycle) | Detects backgrounding, freezing and bfcache transitions |
| V7 | `document.fullscreenElement` | Reads it to confirm still fullscreen |
| V8 | Timer throttling probes | Compares `setInterval`/`setTimeout` drift to detect throttled (hidden) tabs |
| V9 | `requestAnimationFrame` stall probes | rAF stops in hidden tabs; page measures gaps |
| V10 | Native-function checks | `fn.toString()` must return `[native code]`; `Function.prototype.toString` tamper checks |
| V11 | Event `isTrusted` on synthesized events | Page ignores/blocklists fake events (we avoid synthesizing; we suppress instead) |
| V12 | Re-pollution | Page re-reads descriptors or re-adds listeners after our patch (SPA navigations, late scripts) |

---

## 3. Pro-level technique per vector

### 3.1 Visibility state (V1, V2)
- At `document-start`, `Object.defineProperty` on `Document.prototype`:
  - `hidden` → getter always returns `false` (configurable: true so page can't tell it was redefined — it can, see 3.6).
  - `visibilityState` → getter always returns `'visible'`.
  - `webkitHidden` / `mozHidden` equivalents where present.
- Capture-phase firewall on `window` + `document` (capture: true, run before page listeners):
  - `visibilitychange`, `webkitvisibilitychange`, `mozvisibilitychange` → `stopImmediatePropagation()` + `preventDefault()`.
- Because suppression happens in capture phase at `window`, page listeners registered later (bubble or target phase) never fire.

### 3.2 Focus (V3, V4)
- `Document.prototype.hasFocus` → overridden to always return `true`.
- Capture-phase suppression of `blur` on window/document and `focusout`; allow real `focus`/`focusin` through (they agree with our story).
- `window.onblur` / `document.onblur` property handlers neutralized (define as no-op setters or re-assert after page sets them via a `MutationObserver`-free approach: wrap with a setter guard).

### 3.3 Pointer presence (V5)
- Capture-phase suppression of `mouseleave`/`mouseout` leaving-document events.
- Never synthesize mouse moves (V11) — pure suppression is undetectable by `isTrusted` checks.

### 3.4 Fullscreen + ESC (V6, V7) — the headline requirement
- Browser reserves ESC: we cannot stop the real fullscreen exit. Instead we **spoof the aftermath**:
  - `document.fullscreenElement` / `webkitFullscreenElement` getters → return the last known fullscreen element (cached on `fullscreenchange` before suppression… we can't see it if we suppress — so cache on entering: wrap `requestFullscreen` to record the target element).
  - `document.fullscreenEnabled` → `true`.
  - Capture-phase suppression of `fullscreenchange` + `fullscreenerror` + vendor variants, so the page never observes the ESC exit.
  - Optional pro touch: on `keydown` ESC (capture), if page was fullscreen, immediately re-assert cached element into the getter (already covered by the getter reading the cache).
- Result: user presses ESC, leaves fullscreen visually, page still reads "fullscreen + visible + focused". ESC itself is a real trusted keypress, so no `isTrusted` footprint from us.

### 3.5 Timer / rAF probes (V8, V9)
- Timers: hidden tabs get throttled by the browser to ~1Hz — we cannot unthrottle from userscript space. Mitigation: patch `Date.now`/`performance.now`? NO — too detectable, breaks pages. Pro stance: document as known limit; most media/visibility gates rely on V1–V5 (all spoofed), not drift probes. If a target page uses drift probes, add an optional `performance.now` smoothing module (off by default, flagged experimental).
- rAF: same — cannot force frames in a truly hidden tab; our visibility spoof keeps most players from pausing in the first place (their gate is V1, not rAF gaps).

### 3.6 Anti-anti-tamper (V10, V12)
- Every overridden function gets `toString` bound to return the native string (`fn.toString = Function.prototype.toString.bind(nativeFn)` pattern), and `toString` itself is protected.
- All patching inside a closure — zero new globals.
- Re-pollution guard: a lightweight interval + `MutationObserver` re-asserts getters and re-arms capture listeners after SPA route changes; page re-reads of `Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')` will still show `configurable: true` with a custom getter — accepted residual risk (only defeats forensic inspection, not runtime gates).
- `@run-at document-start`, `@match *://*/*`, all frames (`@allFrames 1`) so iframes are spoofed identically.
- Debug mode behind a `const DEBUG = false` flag — verbose logging only when enabled, never in normal runs.

---

## 4. Script architecture (modules, one file)

```
==UserScript==
  name:         Always Active — Pro
  run-at:       document-start
  match:        *://*/*
  allFrames:   true
  grant:        none        (pure DOM patching, no GM APIs needed)
==/UserScript==

  00 config      — DEBUG flag, per-site kill-switch list (default: on everywhere)
  01 stealth     — native-fn cloaking helpers, safe defineProperty wrapper
  02 visibility  — V1+V2 (hidden/visibilityState/getters + event firewall)
  03 focus       — V3+V4 (hasFocus, blur/focusout suppression)
  04 pointer     — V5 (mouseleave/mouseout suppression)
  05 fullscreen  — V6+V7 (cache element on request, spoof getters, swallow change events)
  06 watchdog    — V12 (re-assert on interval + SPA navigation)
```

---

## 5. ESC fullscreen-exit spec (acceptance behavior)

1. Page enters fullscreen (any element) → script caches the element reference.
2. User presses ESC → browser exits fullscreen for real (unpreventable, and fine).
3. Page's `fullscreenchange` listener: **never fires** (suppressed in capture).
4. Page reads `document.fullscreenElement`: **returns the cached element**, not `null`.
5. Page reads `document.hidden` / `hasFocus()`: **false / true** as always.
6. Net effect: page-side state machine never leaves "fullscreen + active". PASS.

---

## 6. Multi-tab matrix (acceptance behavior)

| Case | Expected |
|---|---|
| Tab A playing, switch to tab B | A keeps playing; A's gates still read visible+focused |
| Rapid A→B→A→C switching | No `visibilitychange`/`blur` reaches any page |
| 5+ tabs open, one fullscreen video, ESC out | Video tab keeps playing, still reports fullscreen |
| DevTools open on the page | No console output from script (DEBUG off); gates still spoofed |
| SPA route change (YouTube navigation) | Watchdog re-arms; spoofing continuous |

---

## 7. Test plan + the URL I will give you

### Primary: local high-security lab (I will build it next session)
- File: `test/visibility-lab.html` in this repo, served by the existing preview server:
  **`http://localhost:4173/visibility-lab.html`**
- The lab instruments every vector V1–V12 with live PASS/FAIL lamps plus a scoreboard:
  - hidden/state reads, event fire counters (must stay 0), hasFocus polls, fullscreen readback after ESC, timer-drift readout (informational), `toString()` nativeness check on patched fns, re-pollution check after 10s.
- You test by: opening the lab, backgrounding the tab, switching tabs, fullscreening the lab + pressing ESC — all lamps must stay green.

### Secondary: real-world pages
- A background music/video page (e.g., a YouTube watch page) — audio must not pause on tab switch.
- Any strict `visibilitychange` demo page.

### Known honest limits (documented in the script header, not hidden)
- True timer/rAF throttling in fully hidden tabs cannot be unthrottled from userscript space — gates based on property reads/events (the overwhelming majority) are all defeated.
- OS-level focus, screenshots, camera, and `isTrusted` on real input are outside DOM scope.

---

## 8. Hardening note (added during build, verified by test)

- `cloak()` is idempotent via a closure `WeakMap` (no enumerable own-props, forensic-clean).
- A second injection (SPA navigation, double userscript run, stacked test harnesses) reuses the original native source and can never launder fake source into `toString()`.
- Verified: three stacked injections + synthetic event storm → lab still **8/8 PASS**.
- Field-test follow-up (external visibility test page): all hide/blur counters 0, mouseleave 0. Added V13 (`pagehide`/`pageshow`/`freeze`/`resume`) + `pointerleave` to the firewall; REMOVED `mouseout` interception (it fires on every intra-page move — swallowing it breaks hover menus, only window-exit signals are gated). Lab extended; synthetic storm across all 10 gated events → **8/8 PASS**, every counter 0.

## 9. ESC-exit + pointer-lock round (built + verified)

- V14: exam sites trap ESC itself. New capture-phase `keydown` guard swallows the page's trap ONLY while real API-fullscreen is active (`FS.active`, set by the wrapped `requestFullscreen`), and never calls `preventDefault` so the browser still exits. Dialogs/menus/F11 untouched.
- V15: `requestPointerLock` wrapped + `pointerLockElement` spoofed + lock-change events swallowed (first ESC exits the lock browser-side, page sees nothing).
- Lab: new **Run ESC-trap drill** button (real fullscreen → synthetic ESC → assert page trap counter unchanged → cleanup) with honest gray SKIP when headless denies fullscreen; exam-trap mimic included.
- Verified: **9/10 PASS · 1 SKIP** (SKIP = headless fullscreen denial, by design), all 10 gated-event counters at 0.

## 10. False-alarm fix (lab verdict logic)

- Symptom: `RED — firewall leaked!` in the log while all 10 counters read 0 and the board showed 9/10 + 1 SKIP.
- Root cause: the Fire-button verdict compared `pass === checks.length` (9 === 10) without accounting for neutral SKIP lamps (V14 before its drill). The script was innocent — proven via `hidden` getter patched + zero counters.
- Fix: verdict is now `pass + skipped === total`. Re-verified live: Fire → `ALL GREEN after synthetic fire`.

## 11. Next-session execution order

1. Scaffold `always-active-pro.user.js` (header, config, stealth utils).
2. Build `test/visibility-lab.html` scoreboard page first (test-driven: red lamps, then turn them green).
3. Implement modules 02→06 one by one, lab PASS after each.
4. ESC fullscreen drill + 5-tab switching drill.
5. Harden pass (toString cloaks, watchdog, DEBUG-off audit).
6. Ship: script file + install note appended to this doc.
