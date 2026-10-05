# Planning & Architecture
## K-Pass Tools Showcase

---

## 1. Project Structure Overview

```
/K-Pass/
├── index.html                  # HTML entry point
├── package.json                # NPM project config
├── vite.config.js              # Vite build config
├── dist/                       # Production build output
│   ├── index.html
│   ├── assets/main.js
│   ├── fonts/after-regular.otf
│   ├── _headers/
│   └── _redirects/
├── src/
│   ├── main.js                 # App bootstrap & initialization
│   ├── data/
│   │   └── tools.json          # Tool definitions (15 items)
│   ├── components/             # Vue/Lit-like renderers (inline in JS)
│   │   ├── ToolCard.js
│   │   ├── SearchBar.js
│   │   ├── CategoryFilter.js
│   │   └── FavoritesToggle.js
│   ├── utils/
│   │   ├── storage.js          # localStorage favorites
│   │   ├── debounce.js         # Search debouncing
│   │   └── icons.js            # Lucide icon mappings
│   └── styles/
│       ├── variables.css       # CSS custom properties
│       ├── reset.css           # Modern CSS reset
│       ├── grid.css            # Bento Grid layout
│       ├── cards.css           # Tool card components
│       ├── ui.css              # Header, search, filters, footer
│       └── animations.css      # Micro-interactions
├── docs/
│   ├── 01-PDR.md               # Product Design Requirements
│   ├── 02-UI-UX-Spec.md        # UI/UX Specifications
│   ├── 03-Planning-Architecture.md  (this file)
│   ├── 04-Page-Information.md  # Page content strategy
│   └── 05-Data-Schema-Guide.md # Content data guide
└── Font/
    └── after-regular.otf       # Original font file (source)
```

---

## 2. Architecture Decisions

### 2.1 Client-Side Only (No Backend)
**Rationale:**
- Zero server costs
- Instant page load (no network latency for HTML)
- Privacy-first — no user tracking or data collection
- Offline-capable (all assets cached)
- Simpler deployment (static files only)

**Trade-offs:**
- No user accounts or cloud sync
- Content updates require redeploy
- Favorite bookmarks persist only per-browser via localStorage

### 2.2 Vite + Vanilla JS (No Framework)
**Rationale:**
- Fast refresh development experience
- Native ES modules — no framework bundle size
- Native HTML/CSS — no CSS-in-JS overhead
- Lucide icons via CDN — no icon font loading
- After Saved font self-hosted as OTF — one file

**Build Output:**
- `dist/` contains static HTML/CSS/JS
- ~11KB JS bundle (minified)
- No runtime framework dependencies

### 2.3 CSS Grid vs. JS Layout
**Decision:** Pure CSS Grid with `grid-template-columns` and grid span properties on cards.

**Rationale:**
- No layout recalculation logic in JS
- Automatic reflow on resize
- Predictable, declarative layout
- Falls back gracefully on older browsers

**Implementation:**
- 4-column grid on desktop (`grid-template-columns: repeat(4, 1fr)`)
- Auto-rows based on card size variant
- Mobile: 1-column, tablet: 2-column
- Card size variants: `large` (2×2), `wide` (2×1), `tall` (1×2), `standard` (1×1)

### 2.4 Data-Driven Approach
**Decision:** Tool data stored in `src/data/tools.json`, imported via Vite's native JSON import.

**Rationale:**
- Non-technical can update tools by editing JSON
- No database setup required
- Version-controlled content
- Easy to add/remove/reorder tools

**Format:**
```json
{
  "tools": [{...}],
  "categories": ["productivity", "development", ...]
}
```

---

## 3. Deployment Pipeline

### 3.1 Cloudflare Pages Configuration

**Build Command:** `npm run build` (or `npx vite build`)  
**Output Directory:** `dist`  
**Framework Preset:** Vite  
**Node Version:** 20 (default)

**Directory Structure for Deploy:**
```
dist/
├── index.html          # Spa fallback
├── assets/main.js      # Minified JS bundle
├── fonts/after-regular.otf  # Self-hosted font
├── _headers/           # HTTP response headers
└── _redirects/         # URL redirect rules
```

**Zero-Config Cloudflare Pages Steps:**
1. Connect GitHub repository to Cloudflare Pages
2. Set build command: `npm run build` (or `npx vite build`)
3. Set output directory: `dist`
4. Deploy — CDN goes live at `k-pass.pages.dev`

**Custom Domain:**
- Add `k-pass.com` (or preferred domain) in Cloudflare dashboard
- Enable TLS certificate
- Configure DNS A/CNAME records

### 3.2 Post-Deploy Checklist

- [ ] Page loads at `k-pass.pages.dev`
- [ ] Font "After Saved" renders correctly
- [ ] Lucide icons load from CDN
- [ ] Search functionality works
- [ ] Category filters toggle properly
- [ ] Favorite heart toggles and persists in localStorage
- [ ] Mobile responsive (test on iPhone/Samsung)
- [ ] Focus visible states present
- [ ] No console errors
- [ ] CSP headers active (verify via dev tools)

---

## 4. Development Workflow

### 4.1 Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev   # Vite dev server on http://localhost:3000

# Build for production
npm run build # Vite build → dist/
```

### 4.2 Content Updates
1. Edit `src/data/tools.json` — add/remove/modify tools
2. Run `npm run build`
3. Deploy `dist/` to Cloudflare Pages

### 4.3 Feature Development
1. Create a new branch: `git checkout -b feature/xx`
2. Make changes in `src/`
3. Test locally: `npm run dev`
4. Build: `npm run build`
5. Commit and push
6. Cloudflare Pages auto-deploys on `main` branch

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Font fails to load | Low | Medium | System font fallback defined in CSS |
| Lucide CDN unavailable | Low | Medium | Self-host critical icons as data URIs |
| localStorage full/cleared | Medium | Low | Graceful degradation — favorites lost but UI intact |
| Cloudflare Pages limits | Very Low | Low | Free tier sufficient for this traffic level |
| JSON data corruption | Low | Low | Version control + backup `src/data/tools.json` |
| Browser ES2020 incompatibility | Very Low | Low | Target modern browsers only (last 2 versions) |

---

## 6. Future Considerations (Post-MVP)

| Feature | Estimated Effort | Value |
|---------|-----------------|-------|
| Dark mode | 2-3 days | Expands audience |
| User accounts + cloud sync | 1-2 weeks | Higher engagement |
| Tool submissions (moderated) | 2-3 weeks | Community growth |
| Analytics (privacy-first) | 1 day | Understand usage |
| PWA manifest + service worker | 2 days | Offline capability |
| Search API alternative | 3 days | Better search relevance |
| Internationalization | 1 week per language | Accessibility expansion |

---

## 7. Success Criteria (Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time (3G) | < 3s | Chrome DevTools Lighthouse |
| Search response | < 100ms | Performance timeline |
| Favorite persistence | 100% of sessions | localStorage audit |
| Mobile usability | Pass > 90% | Google PageSpeed |
| Return visitor rate (30d) | > 20% | Analytics (if allowed) |
| Tools clicked per session | > 3 | Event tracking |

---

*Document Version: 1.0*  
*Last Updated: 2026-10-05*  
*Status: Draft for Review*