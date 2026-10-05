# Product Design Requirements (PDR)
## K-Pass Tools Showcase — Daily Life Extensions & Applications

---

## 1. Project Overview

| Field | Detail |
|-------|--------|
| **Project Name** | K-Pass Tools Showcase |
| **Tagline** | Curated tools for daily productivity |
| **Type** | Static showcase website (Bento Grid UI) |
| **Target Platform** | Web (Desktop, Tablet, Mobile) |
| **Deployment** | Cloudflare Pages |
| **Repository** | Git-based (GitHub/GitLab) |
| **Build Tool** | Vite 5.x |

---

## 2. Problem Statement

Users discover useful browser extensions, CLI tools, and web applications through scattered sources (Twitter, Product Hunt, newsletters, word of mouth). There is no single, well-designed, searchable, and filterable collection that:
- Presents tools in a visually appealing, scannable layout
- Allows filtering by category
- Supports real-time search
- Lets users bookmark favorites locally
- Works offline-first with zero tracking

---

## 3. Target Audience

| Primary | Secondary |
|---------|-----------|
| Developers & engineers | Designers & creatives |
| Productivity enthusiasts | Students & researchers |
| Power users of browser extensions | Remote workers & freelancers |

**User Goals:**
- Quickly find tools by category or keyword
- Evaluate tools at a glance (name, description, category)
- Bookmark tools for later reference
- Access the collection from any device

---

## 4. Core Features (MVP)

### 4.1 Bento Grid Display
- Asymmetric grid layout with 4 card size variants
- Responsive: 1 col (mobile) → 2 col (tablet) → 4 col (desktop)
- CSS Grid auto-placement (no JS layout calculations)

### 4.2 Real-Time Search
- Debounced input (150ms)
- Searches: name, description, category, tags
- Match highlighting in results
- Result count announcement (ARIA live region)

### 4.3 Category Filter
- 8 predefined categories
- Multi-select via click (toggle)
- Visual pills with tool counts
- "All" reset option
- Keyboard accessible (Arrow keys, Enter, Escape)

### 4.4 Favorites System
- Heart icon on each card (outline → filled)
- localStorage persistence (no backend)
- "Show Favorites Only" toggle in header
- Favorite count badge in header
- Cross-session persistence

### 4.5 Tool Cards
- Tool name + Lucide icon
- Short description (1-2 lines)
- Category pill
- External link (opens in new tab)
- No images/screenshots — icon + text only

---

## 5. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | First Contentful Paint | < 1.5s |
| | Largest Contentful Paint | < 2.5s |
| | Total Blocking Time | < 200ms |
| | Cumulative Layout Shift | < 0.1 |
| **Accessibility** | WCAG 2.1 Level AA | Compliant |
| | Keyboard navigation | Full support |
| | Screen reader support | Full support |
| | Color contrast | >= 4.5:1 text, >= 3:1 UI |
| | Reduced motion | Respected |
| **Browser Support** | Modern browsers (last 2 versions) | Chrome, Firefox, Safari, Edge |
| | Mobile browsers | iOS Safari, Chrome Android |
| **SEO** | Semantic HTML | Complete |
| | Meta tags | Title, description, OG, Twitter |
| | Sitemap | Auto-generated |
| **Security** | CSP headers | Strict |
| | No external scripts (except Lucide CDN) | Enforced |
| | HTTPS only | Cloudflare default |

---

## 6. Design Requirements

### 6.1 Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #B81104 | Headers, CTAs, accents, focus rings, active pills |
| Primary Hover | #9D0E03 | Hover states |
| Background | #FFFACD | Page background |
| Card Background | #FFFEF7 | Card surfaces |
| Text Primary | #1A1A1A | Headings, body |
| Text Muted | #6B6B6B | Descriptions, meta |
| Border | #E8D5B7 | Card borders, input borders |
| Focus Ring | #B81104 | Focus indicators |

### 6.2 Typography
- **Font Family**: "After Saved" (OTF, self-hosted)
- **Fallback**: system-ui, -apple-system, BlinkMacSystemFont, sans-serif
- **Scale**: Fluid clamp() values (see Technical Spec)

### 6.3 Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Grid gap: 16px (desktop), 12px (mobile)

### 6.4 Border Radius
- Cards: 12px
- Pills/buttons: 9999px (fully rounded)
- Inputs: 8px

### 6.5 Shadows
- Card resting: 0 2px 8px rgba(0,0,0,0.06)
- Card hover: 0 8px 24px rgba(0,0,0,0.1)
- Focus ring: 0 0 0 2px #B81104

---

## 7. Content Requirements

### 7.1 Tool Data Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | Yes | Unique, kebab-case |
| name | string | Yes | Display name |
| description | string | Yes | 1-2 sentences, <= 160 chars |
| category | string | Yes | From predefined list |
| tags | string[] | No | 3-5 keywords |
| url | string | Yes | Valid HTTPS URL |
| iconName | string | Yes | Lucide icon identifier |
| cardSize | enum | Yes | standard, wide, tall, large |
| featured | boolean | No | Default false |

### 7.2 Categories (Fixed)
1. productivity — Task management, notes, automation
2. development — IDE extensions, CLI tools, debugging
3. design — Color, typography, UI kits, prototyping
4. utilities — System tools, converters, calculators
5. communication — Email, chat, video, collaboration
6. learning — Documentation, courses, references
7. finance — Budgeting, tracking, crypto, taxes
8. health — Fitness, meditation, ergonomics, sleep

### 7.3 Initial Content Target
- 15-20 tools at launch
- Balanced across categories (2-3 per category)
- 2-3 featured tools (larger cards)

---

## 8. User Flows

### 8.1 Discovery Flow
Landing -> Scan grid -> Search/filter -> Click card -> External site

### 8.2 Bookmark Flow
Scan grid -> Click heart -> Heart fills -> Count updates -> Toggle "Favorites Only" -> View subset

### 8.3 Search Flow
Type in search -> Debounce -> Filter grid -> Highlight matches -> Clear or refine

### 8.4 Filter Flow
Click category pill -> Pill activates -> Grid filters -> Click again -> Pill deactivates

---

## 9. Success Metrics (Post-Launch)

| Metric | Target |
|--------|--------|
| Page load (3G) | < 3s |
| Search response | < 100ms |
| Filter interaction | < 50ms |
| Favorite toggle | < 50ms |
| Return visitor rate (30d) | > 20% |
| Average session duration | > 2 min |
| Tools clicked per session | > 3 |

---

## 10. Constraints & Assumptions

### Constraints
- Zero backend — all client-side
- No user accounts or cloud sync
- No analytics/tracking (privacy-first)
- Static deployment only
- Manual content updates via JSON

### Assumptions
- Users have modern browsers with ES2020+ support
- Lucide CDN remains available
- Cloudflare Pages free tier sufficient
- Content updates monthly or quarterly

---

## 11. Out of Scope (v1)

- User accounts / cloud sync
- Tool ratings / reviews
- Community submissions
- Dark mode (single light theme per spec)
- Pagination / infinite scroll (all tools visible)
- Tool comparison view
- Collections / custom lists
- Export/import favorites
- RSS/Atom feed
- PWA / offline caching (beyond static assets)

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lucide CDN outage | Low | Medium | Self-host critical icons as fallback |
| Font loading failure | Low | High | System font fallback stack defined |
| Cloudflare Pages limits | Low | Low | Monitor usage, upgrade if needed |
| Content staleness | Medium | Medium | Quarterly review calendar |
| Mobile grid usability | Medium | High | Test on real devices, adjust card sizes |

---

## 13. Approval & Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Design Lead | | | |
| Engineering Lead | | | |

---

Document Version: 1.0
Last Updated: 2026-10-05
Status: Draft for Review