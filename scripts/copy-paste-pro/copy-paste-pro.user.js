// ==UserScript==
// @name         Copy Paste Pro — Liberator
// @namespace    k-pass
// @version      1.0.0
// @description  Re-enable copy, cut, paste, text selection and right-click on pages that block them. Capture-phase firewall + CSS override + property-handler guards.
// @match        *://*/*
// @allFrames    1
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

/*
 * HOW IT WORKS
 * Copy-blocking pages work by listening for copy/cut/paste/contextmenu/
 * selectstart/keydown events and calling preventDefault(), or by setting
 * oncopy-style property handlers, or by CSS `user-select: none`.
 * This script (injected into the page MAIN world at document-start, because
 * the Tampermonkey sandbox is invisible to page scripts):
 *  1. Registers capture-phase listeners FIRST, which call
 *     stopImmediatePropagation() ONLY for the hostile combos, so the page's
 *     own blockers never run and the browser default (copy/paste/menu) proceeds.
 *  2. Forces `user-select: text` back via an !important stylesheet.
 *  3. Nulls oncopy/oncut/onpaste/oncontextmenu/onselectstart property
 *     handlers on window/document, re-asserted by a watchdog.
 *  4. Cloaks every patched function (WeakMap-idempotent, forensic-clean).
 *
 * HONEST LIMITS
 * - Transparent overlay DIVs that swallow clicks cannot be safely removed
 *   (would break layouts); documented, not attempted.
 * - navigator.clipboard *reads* by pages still need a user gesture + permission;
 *   we do not fake gestures (isTrusted cannot be forged).
 * - Shortcut interception skips editable elements so editors (Docs, etc.)
 *   keep their own keybindings.
 */

(function () {
  'use strict';

  /* ============ 00 config ============ */
  var DEBUG = false;
  // Hosts where the script stays OFF, e.g. ['docs.google.com']
  var DISABLED_HOSTS = [];
  // When true, Ctrl/Cmd+C/X/V/A interception is skipped inside inputs,
  // textareas and contentEditable (keeps editor shortcuts intact).
  var SPARE_EDITABLES = true;

  try {
    if (DISABLED_HOSTS.indexOf(location.hostname) !== -1) return;
  } catch (e) {}

  /* ============ payload (page MAIN world) ============ */
  var PAYLOAD = '(' + function () {
    'use strict';

    var DBG = false;
    function log() { if (DBG) { try { console.log.apply(console, ['[copy-paste-pro]'].concat([].slice.call(arguments))); } catch (e) {} } }

    /* ---- 01 stealth (WeakMap-idempotent cloak) ---- */
    var nativeToString = Function.prototype.toString;
    var cloakedSrc = new WeakMap();
    function cloak(fn, nativeFn) {
      try {
        if (cloakedSrc.has(fn)) return fn;
        var src = null;
        if (nativeFn && cloakedSrc.has(nativeFn)) src = cloakedSrc.get(nativeFn);
        if (!src && nativeFn) { try { src = nativeToString.call(nativeFn); } catch (e) { src = null; } }
        if (!src || src.indexOf('[native code]') === -1) src = 'function () { [native code] }';
        (function (s) {
          Object.defineProperty(fn, 'toString', {
            value: function () { return s; }, writable: false, enumerable: false, configurable: true
          });
          Object.defineProperty(fn, 'toLocaleString', {
            value: function () { return s; }, writable: false, enumerable: false, configurable: true
          });
        })(src);
        cloakedSrc.set(fn, src);
      } catch (e) {}
      return fn;
    }

    function inEditable(t) {
      try {
        if (!t || !t.tagName) return false;
        var tag = (t.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
        if (t.isContentEditable) return true;
      } catch (e) {}
      return false;
    }

    /* ---- 02 clipboard event firewall (C1, C2, C7) ----
       Page blockers call preventDefault() in THEIR listeners. Our capture
       listener runs first and stops propagation, so their blocker never runs
       and the browser default (copy/cut/paste/menu) proceeds untouched. */
    (function firewall() {
      var KILL = ['copy', 'cut', 'paste', 'beforecopy', 'beforecut', 'beforepaste', 'contextmenu', 'selectstart', 'dragstart'];
      function guard(e) {
        try { e.stopImmediatePropagation(); } catch (x) {}
        // NOTE: deliberately NO preventDefault — we want the default action.
        log('released', e.type);
      }
      cloak(guard);
      [window, document].forEach(function (t) {
        KILL.forEach(function (type) {
          try { t.addEventListener(type, guard, true); } catch (e) {}
        });
      });
    })();

    /* ---- 03 shortcut firewall (C5) ----
       Swallow only hostile Ctrl/Cmd combos outside editable elements. */
    (function shortcuts() {
      function guard(e) {
        try {
          if (!(e.ctrlKey || e.metaKey)) return;
          var k = e.key || '';
          var kl = k.toLowerCase();
          if (kl !== 'c' && kl !== 'x' && kl !== 'v' && kl !== 'a' && k !== 'Insert') return;
          if (SPARE_EDITABLES_PLACEHOLDER && inEditable(e.target)) return;
          e.stopImmediatePropagation();
          log('released key', k);
        } catch (x) {}
      }
      cloak(guard);
      [window, document].forEach(function (t) {
        try { t.addEventListener('keydown', guard, true); } catch (e) {}
      });
    })();

    /* ---- 04 CSS override (C3, C9) ---- */
    function cssOverride() {
      try {
        var css = '*{user-select:text !important;-webkit-user-select:text !important;' +
          '-moz-user-select:text !important;-ms-user-select:text !important;' +
          '-webkit-touch-callout:default !important;}';
        var st = document.createElement('style');
        st.setAttribute('data-cpp', '1');
        st.textContent = css;
        var parent = document.documentElement || document.head;
        if (parent) parent.insertBefore(st, parent.firstChild);
      } catch (e) {}
    }

    /* ---- 05 property-handler guards (C4) + watchdog (C12) ----
       Deterministic, race-free: trap the setters on the prototypes so page
       assignments are swallowed the instant they happen (no interval race).
       The interval only re-traps + deletes sneaky own-props as backup. */
    var PROPS = ['oncopy', 'oncut', 'onpaste', 'oncontextmenu', 'onselectstart', 'ondragstart', 'onbeforecopy', 'onbeforecut', 'onbeforepaste'];
    function trapSetters() {
      var protos = [];
      try { if (window.Window && Window.prototype) protos.push(Window.prototype); } catch (e) {}
      try { if (window.Document && Document.prototype) protos.push(Document.prototype); } catch (e) {}
      try { if (window.HTMLElement && HTMLElement.prototype) protos.push(HTMLElement.prototype); } catch (e) {}
      protos.forEach(function (proto) {
        PROPS.forEach(function (p) {
          try {
            Object.defineProperty(proto, p, {
              get: function () { return null; },
              set: function () {},
              configurable: true, enumerable: true
            });
          } catch (e) {}
        });
      });
    }
    cloak(trapSetters);
    function disarm() {
      // Delete own-props a hostile page defined directly on instances.
      [window, document, document.body].forEach(function (t) {
        if (!t) return;
        PROPS.forEach(function (p) {
          try {
            if (Object.prototype.hasOwnProperty.call(t, p)) { delete t[p]; }
            else if (t[p]) { try { t[p] = null; } catch (e) {} }
          } catch (e) {}
        });
      });
      trapSetters();
      try {
        if (!document.querySelector('style[data-cpp]')) cssOverride();
      } catch (e) {}
    }
    cloak(disarm);
    disarm();
    try { setInterval(disarm, 2000); } catch (e) {}
    log('armed');
  } + ')();';

  // Bake the editable-sparing flag into the payload (sandbox consts don't cross worlds).
  PAYLOAD = PAYLOAD.split('SPARE_EDITABLES_PLACEHOLDER').join(SPARE_EDITABLES ? 'true' : 'false');

  /* ============ inject into MAIN world ============ */
  function inject() {
    try {
      var el = document.createElement('script');
      el.textContent = PAYLOAD;
      var parent = document.documentElement || document.head || document;
      parent.insertBefore(el, parent.firstChild);
      if (el.parentNode) el.parentNode.removeChild(el);
    } catch (e) {
      try { new Function(PAYLOAD)(); } catch (x) {}
    }
  }

  cssEarly();
  function cssEarly() {
    // Even before payload runs, plant the selection CSS from the sandbox side.
    try {
      var st = document.createElement('style');
      st.setAttribute('data-cpp', '1');
      st.textContent = '*{user-select:text !important;-webkit-user-select:text !important;-moz-user-select:text !important;}';
      var parent = document.documentElement || document.head;
      if (parent) parent.insertBefore(st, parent.firstChild);
    } catch (e) {}
  }

  if (document.documentElement) {
    inject();
  } else {
    try {
      new MutationObserver(function () {
        if (document.documentElement) { cssEarly(); inject(); this.disconnect(); }
      }).observe(document, { childList: true, subtree: true });
    } catch (e) {
      try { document.addEventListener('DOMContentLoaded', function () { cssEarly(); inject(); }, { once: true }); } catch (x) {}
    }
  }
})();
