// ==UserScript==
// @name         Always Active — Pro
// @namespace    k-pass
// @version      1.0.0
// @description  Keep every tab reporting active, visible, focused and fullscreen. Background tabs keep playing, tab switches and ESC fullscreen-exits stay invisible to pages.
// @match        *://*/*
// @allFrames    1
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

/*
 * HOW IT WORKS (pro notes)
 * Tampermonkey runs userscripts in an isolated sandbox whose patched prototypes
 * are INVISIBLE to page scripts. So this wrapper injects the real payload into
 * the page's MAIN world via a <script> tag at document-start. Everything below
 * the PAYLOAD marker executes in page context, before any page script.
 *
 * HONEST LIMITS (see docs/scripts/tampermonkey-always-active-plan.md)
 * - Browser timer/rAF throttling of truly hidden tabs cannot be unthrottled
 *   from script space. Property/event gates (the vast majority) are defeated.
 * - OS-level focus, screenshots, camera and real-input isTrusted are out of scope.
 */

(function () {
  'use strict';

  /* ============ 00 config ============ */
  var DEBUG = false;
  // Hosts where the script stays OFF (exact hostname match), e.g. ['bank.example.com']
  var DISABLED_HOSTS = [];

  try {
    if (DISABLED_HOSTS.indexOf(location.hostname) !== -1) return;
  } catch (e) { /* location unavailable this early in some frames — stay on */ }

  /* ============ payload (runs in page MAIN world) ============ */
  var PAYLOAD = '(' + function () {
    'use strict';

    var DBG = false;
    function log() { if (DBG) { try { console.log.apply(console, ['[always-active]'].concat([].slice.call(arguments))); } catch (e) {} } }

    /* ---- 01 stealth helpers ---- */
    var nativeToString = Function.prototype.toString;
    // WeakMap leaves no enumerable own-props (forensic-clean) and makes
    // cloaking idempotent: a 2nd injection (SPA nav, double userscript run)
    // reuses the ORIGINAL native source instead of laundering fake source.
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
            value: function () { return s; },
            writable: false, enumerable: false, configurable: true
          });
          Object.defineProperty(fn, 'toLocaleString', {
            value: function () { return s; },
            writable: false, enumerable: false, configurable: true
          });
        })(src);
        cloakedSrc.set(fn, src);
      } catch (e) {}
      return fn;
    }
    function redefine(obj, prop, getter) {
      try {
        var desc = Object.getOwnPropertyDescriptor(obj, prop);
        var nativeGet = desc && desc.get;
        Object.defineProperty(obj, prop, {
          get: getter, configurable: true, enumerable: desc ? !!desc.enumerable : false
        });
        return nativeGet || null;
      } catch (e) { return null; }
    }

    /* ---- 02 visibility state (V1, V2) ---- */
    (function visibility() {
      var proto = Document.prototype;
      redefine(proto, 'hidden', function () { return false; });
      redefine(proto, 'visibilityState', function () { return 'visible'; });
      try { redefine(proto, 'webkitHidden', function () { return false; }); } catch (e) {}
      try { redefine(proto, 'mozHidden', function () { return false; }); } catch (e) {}

      var killEvents = [
        'visibilitychange', 'webkitvisibilitychange', 'mozvisibilitychange',
        'pagehide', 'pageshow', 'freeze', 'resume'
      ];
      function firewall(e) {
        try { e.stopImmediatePropagation(); } catch (x) {}
        try { e.preventDefault(); } catch (x) {}
        log('swallowed', e.type);
      }
      cloak(firewall);
      [window, document].forEach(function (t) {
        killEvents.forEach(function (type) {
          try { t.addEventListener(type, firewall, true); } catch (e) {}
        });
      });
    })();

    /* ---- 03 focus (V3, V4) ---- */
    (function focus() {
      var nativeHasFocus = Document.prototype.hasFocus;
      function fakeHasFocus() { return true; }
      cloak(fakeHasFocus, nativeHasFocus);
      try {
        Document.prototype.hasFocus = fakeHasFocus;
      } catch (e) {}

      function firewall(e) {
        try { e.stopImmediatePropagation(); } catch (x) {}
        try { e.preventDefault(); } catch (x) {}
        log('swallowed', e.type);
      }
      cloak(firewall);
      [window, document].forEach(function (t) {
        ['blur', 'focusout'].forEach(function (type) {
          try { t.addEventListener(type, firewall, true); } catch (e) {}
        });
      });
      // Neutralize onblur property handlers assigned by the page later.
      function guardOnBlur() {
        try {
          if (window.onblur) { window.onblur = null; }
          if (document.onblur) { document.onblur = null; }
        } catch (e) {}
      }
      cloak(guardOnBlur);
      try { setInterval(guardOnBlur, 2000); } catch (e) {}
    })();

    /* ---- 04 pointer presence (V5) ---- */
    /* mouseleave/pointerleave only fire when the pointer EXITS the window —
       that is the detection-relevant signal. mouseout/pointerout fire on
       every move between elements, so swallowing them would break hover
       menus site-wide: deliberately NOT intercepted. */
    (function pointer() {
      function firewall(e) {
        try { e.stopImmediatePropagation(); } catch (x) {}
        try { e.preventDefault(); } catch (x) {}
        log('swallowed', e.type);
      }
      cloak(firewall);
      [window, document].forEach(function (t) {
        ['mouseleave', 'pointerleave'].forEach(function (type) {
          try { t.addEventListener(type, firewall, true); } catch (e) {}
        });
      });
    })();

    /* Shared API-fullscreen state (real transitions only; F11 browser
       chrome is outside DOM scope and intentionally untouched). */
    var FS = { active: false, el: null };

    /* ---- 05 fullscreen + ESC (V6, V7, V14) ---- */
    (function fullscreen() {
      var lastElement = null;

      // Cache the element whenever the page (or user gesture) enters fullscreen.
      ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen'].forEach(function (m) {
        try {
          var proto = Element.prototype;
          if (typeof proto[m] !== 'function') return;
          var nativeReq = proto[m];
          function wrapped() {
            try { lastElement = this; FS.active = true; FS.el = this; } catch (e) {}
            return nativeReq.apply(this, arguments);
          }
          cloak(wrapped, nativeReq);
          proto[m] = wrapped;
        } catch (e) {}
      });

      redefine(Document.prototype, 'fullscreenElement', function () { return lastElement; });
      try { redefine(Document.prototype, 'webkitFullscreenElement', function () { return lastElement; }); } catch (e) {}
      try { redefine(Document.prototype, 'mozFullScreenElement', function () { return lastElement; }); } catch (e) {}
      redefine(Document.prototype, 'fullscreenEnabled', function () { return true; });

      function firewall(e) {
        // Swallow EXIT notifications; the getters above keep reporting fullscreen.
        try { e.stopImmediatePropagation(); } catch (x) {}
        try { e.preventDefault(); } catch (x) {}
        log('swallowed', e.type);
      }
      cloak(firewall);
      [window, document].forEach(function (t) {
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange',
         'fullscreenerror', 'webkitfullscreenerror'].forEach(function (type) {
          try { t.addEventListener(type, firewall, true); } catch (e) {}
        });
      });

      // If the real element leaves (ESC), keep reporting the cached one.
      // Re-assert on a slow tick in case the page nulls its own reference.
      function reassert() {
        try {
          if (document.fullscreenElement !== lastElement && lastElement) {
            redefine(Document.prototype, 'fullscreenElement', function () { return lastElement; });
          }
        } catch (e) {}
      }
      try { setInterval(reassert, 2000); } catch (e) {}
    })();

    /* ---- 05b ESC exit (V14): exam sites trap ESC itself ----
       Their keydown trap sees the attempt (preventDefault blocks the exit
       AND logs it). We swallow their trap in capture so the attempt is
       invisible, and deliberately do NOT preventDefault so the browser
       still performs the exit. Gated on real API-fullscreen state, so
       ordinary ESC uses (dialogs, menus, F11) are never touched. */
    (function escExit() {
      function guard(e) {
        try {
          var k = e.key || '';
          if (k !== 'Escape' && e.keyCode !== 27) return;
          if (!FS.active) return;
          e.stopImmediatePropagation();
          FS.active = false;
          FS.el = null;
          log('ESC exit released (page trap bypassed)');
        } catch (x) {}
      }
      cloak(guard);
      [window, document].forEach(function (t) {
        try { t.addEventListener('keydown', guard, true); } catch (e) {}
      });
    })();

    /* ---- 05c pointer lock (V15): exam sites chain it with fullscreen ----
       First ESC exits the lock (browser-reserved, page never sees keydown),
       so only the lock-change events need swallowing + getter spoofing. */
    (function pointerlock() {
      var lastPLEl = null;
      ['requestPointerLock', 'webkitRequestPointerLock'].forEach(function (m) {
        try {
          var proto = Element.prototype;
          if (typeof proto[m] !== 'function') return;
          var nativeReq = proto[m];
          function wrapped() {
            try { lastPLEl = this; } catch (e) {}
            return nativeReq.apply(this, arguments);
          }
          cloak(wrapped, nativeReq);
          proto[m] = wrapped;
        } catch (e) {}
      });
      try { redefine(Document.prototype, 'pointerLockElement', function () { return lastPLEl; }); } catch (e) {}
      try { redefine(Document.prototype, 'webkitPointerLockElement', function () { return lastPLEl; }); } catch (e) {}
      function firewall(e) {
        try { e.stopImmediatePropagation(); } catch (x) {}
        try { e.preventDefault(); } catch (x) {}
        log('swallowed', e.type);
      }
      cloak(firewall);
      [window, document].forEach(function (t) {
        ['pointerlockchange', 'webkitpointerlockchange', 'pointerlockerror'].forEach(function (type) {
          try { t.addEventListener(type, firewall, true); } catch (e) {}
        });
      });
    })();

    /* ---- 06 watchdog (V12 re-pollution) ---- */
    (function watchdog() {
      function rearm() {
        try {
          var h = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
          if (!h || h.get === undefined || (function () { try { return h.get.call(document); } catch (e) { return 'x'; } })() !== false) {
            redefine(Document.prototype, 'hidden', function () { return false; });
          }
        } catch (e) {}
        try {
          if (typeof document.hasFocus !== 'function' || document.hasFocus() !== true) {
            var f = function () { return true; };
            cloak(f);
            Document.prototype.hasFocus = f;
          }
        } catch (e) {}
      }
      try { setInterval(rearm, 3000); } catch (e) {}
      log('armed');
    })();
  } + ')();';

  /* ============ inject into MAIN world ============ */
  function inject() {
    try {
      var el = document.createElement('script');
      el.textContent = PAYLOAD;
      var parent = document.documentElement || document.head || document;
      parent.insertBefore(el, parent.firstChild);
      if (el.parentNode) el.parentNode.removeChild(el);
    } catch (e) {
      // Last resort: run payload in sandbox (helps only sandbox-side checks).
      try { new Function(PAYLOAD)(); } catch (x) {}
    }
  }

  if (document.documentElement) {
    inject();
  } else {
    try {
      new MutationObserver(function () {
        if (document.documentElement) { inject(); this.disconnect(); }
      }).observe(document, { childList: true, subtree: true });
    } catch (e) {
      try { document.addEventListener('DOMContentLoaded', inject, { once: true }); } catch (x) {}
    }
  }
})();
