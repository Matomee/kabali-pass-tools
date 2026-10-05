# UI/UX Specification
## K-Pass Tools Showcase — Bento Grid Interface

---

## 1. Design Principles

| Principle | Application |
|-----------|-------------|
| **Clarity First** | Every element serves a purpose; no decorative clutter |
| **Scannable Density** | Bento grid enables rapid visual parsing |
| **Direct Manipulation** | Click to favorite, click to filter, type to search |
| **Consistent Rhythm** | 4px baseline grid, fluid type scale |
| **Respectful Motion** | Subtle, purposeful, respects `prefers-reduced-motion` |
| **Accessible by Default** | WCAG AA not an afterthought |

---

## 2. Layout Architecture

### 2.1 Page Structure
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (fixed top)                                         │
│  ├─ Logo/Title                                              │
│  ├─ Favorite Count Badge                                    │
│  └─ Favorites Only Toggle                                   │
├─────────────────────────────────────────────────────────────┤
│  TOOLBAR (sticky below header)                              │
│  ├─ Search Bar (expands on focus)                           │
│  └─ Category Filter Pills (horizontal scroll)               │
├─────────────────────────────────────────────────────────────┤
│  MAIN — Bento Grid (scrollable)                             │
│  ├─ ToolCard × N (CSS Grid auto-placement)                  │
│  └─ Empty State (no results)                                │
├─────────────────────────────────────────────────────────────┤
│  FOOTER (minimal)                                           │
│  └─ Attribution / Links                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Grid Specifications

| Breakpoint | Columns | Row Height | Gap | Container Max-Width |
|------------|---------|------------|-----|---------------------|
| Mobile (≤639px) | 1 | 140px | 12px | 100% |
| Tablet (640-1023px) | 2 | 130px | 16px | 768px |
| Desktop (≥1024px) | 4 | 120px | 16px | 1400px |

**Card Size Variants (grid spans):**
| Variant | Desktop (4-col) | Tablet (2-col) | Mobile (1-col) |
|---------|-----------------|----------------|----------------|
| `standard` | 1×1 | 1×1 | 1×1 |
| `wide` | 2×1 | 2×1 | 1×1 |
| `tall` | 1×2 | 1×2 | 1×2 |
| `large` | 2×2 | 2×2 | 1×2 |

---

## 3. Component Specifications

### 3.1 Header
```
┌────────────────────────────────────────────────────────────┐
│ K-Pass Tools                                    [♥ 3] [☐]  │
└────────────────────────────────────────────────────────────┘
```
- **Title**: "K-Pass Tools" — `--fs-fluid-2xl`, `--color-text`, `--font-primary`
- **Favorite Badge**: Pill, `--color-primary` bg, white text, count number
- **Favorites Toggle**: Switch component, labeled "Favorites Only"
- **Position**: `fixed`, top: 0, z-index: 100
- **Background**: `--color-bg` with `backdrop-filter: blur(8px)`

### 3.2 Search Bar
```
┌────────────────────────────────────────────────────────────┐
│ 🔍  Search tools...                    [✕]                 │
└────────────────────────────────────────────────────────────┘
```
- **Resting width**: 320px (desktop), 100% (mobile)
- **Focus width**: 480px (desktop), 100% (mobile)
- **Transition**: `width 250ms ease`
- **Clear button**: Visible only when value exists
- **Placeholder**: "Search tools..."
- **ARIA**: `role="search"`, `aria-label="Search tools"`, `aria-controls="grid"`

### 3.3 Category Filter Pills
```
┌────────────────────────────────────────────────────────────┐
│ [All 18] [Prod 4] [Dev 3] [Design 2] [Util 3] [Comm 2]... │
└────────────────────────────────────────────────────────────┘
```
- **Container**: Horizontal scroll, `gap: 8px`, `padding: 0 16px`
- **Pill Default**: `--color-bg-card` bg, `--color-border` border, `--color-text` text
- **Pill Active**: `--color-primary` bg, white text
- **Count Badge**: `--fs-fluid-xs`, opacity 0.7
- **All Pill**: Always first, clears all other selections
- **Keyboard**: ←/→ navigate, Enter toggle, Escape clear

### 3.4 Tool Card

#### Standard (1×1)
```
┌─────────────────────────────────────┐
│  [ICON]  Tool Name           [♥]    │
│  ────────────────────────────────   │
│  Short description here...         │
│                                    │
│  [Category]              ↗         │
└─────────────────────────────────────┘
```

#### Large (2×2) — Featured
```
┌─────────────────────────────────────────────────────┐
│  [ICON]  Tool Name                         [♥]      │
│  ────────────────────────────────────────────────   │
│  Longer description that can span multiple lines    │
│  and provides more context about the tool.          │
│                                                     │
│  [Tag1] [Tag2] [Tag3]                               │
│                                                     │
│  [Category]                    ↗ Visit Site        │
└─────────────────────────────────────────────────────┘
```

**Card Anatomy:**
| Element | Spec |
|---------|------|
| Container | `--color-bg-card`, `border: 1px solid --color-border`, `border-radius: 12px`, `padding: 16px` |
| Icon | 24×24, `--color-primary`, Lucide icon |
| Name | `--fs-fluid-lg`, `--color-text`, `font-weight: 600` |
| Description | `--fs-fluid-sm`, `--color-text-muted`, `line-height: 1.5`, max 3 lines |
| Category Pill | `--fs-fluid-xs`, `--color-primary` bg (10%), `--color-primary` text |
| Tags (large only) | `--fs-fluid-xs`, `--color-border` bg, `--color-text-muted` |
| Favorite Button | 32×32 hit area, Lucide `heart` (outline) → `heart` (filled) |
| External Link | Lucide `external-link` (16×16), `--color-text-muted` |
| Hover Shadow | `--card-shadow-hover`, `transform: translateY(-2px)` |
| Focus Ring | `0 0 0 2px --color-focus` |

### 3.5 Empty State
```
┌─────────────────────────────────────┐
│                                     │
│         🔍                          │
│                                     │
│    No tools match your search       │
│    Try adjusting your filters       │
│                                     │
│    [Clear All Filters]              │
│                                     │
└─────────────────────────────────────┘
```
- Centered in grid area
- Lucide `search-x` icon (64×64, `--color-text-muted`)
- Action button to reset search + filters

### 3.6 Footer
```
┌────────────────────────────────────────────────────────────┐
│  Curated with care · Icons by Lucide · Font: After Saved   │
│  [GitHub] [Submit a Tool] [Privacy]                        │
└────────────────────────────────────────────────────────────┘
```
- Minimal, `--color-text-muted`, `--fs-fluid-xs`
- Links open in new tab

---

## 4. Interaction Patterns

### 4.1 Search
1. User types → 150ms debounce
2. Filter tools array (name, description, category, tags)
3. Re-render grid with filtered results
4. Update live region: "X tools found"
5. Highlight matches in name/description (mark tag)

### 4.2 Category Filter
1. User clicks pill → toggle active state
2. If "All" clicked → clear all, select "All"
3. If other pill clicked → deselect "All"
4. Filter tools by selected categories (OR logic)
5. Re-render grid
6. Announce: "Filtered by X, Y — Z tools"

### 4.3 Favorites
1. User clicks heart → toggle in localStorage
2. Heart icon: outline ↔ filled (200ms scale animation)
3. Header badge updates count
4. If "Favorites Only" active → re-filter grid
5. Persist: `localStorage.setItem('kpass-favorites', JSON.stringify(ids))`

### 4.4 Card Click
1. User clicks card (not heart, not external link)
2. Open `tool.url` in new tab (`rel="noopener noreferrer"`)
3. No navigation within page

---

## 5. Animation & Motion

| Trigger | Animation | Duration | Easing | Reduced Motion |
|---------|-----------|----------|--------|----------------|
| Card hover | `translateY(-2px)` + shadow | 200ms | ease-out | Disabled |
| Card focus | Focus ring fade-in | 150ms | ease | Instant |
| Search expand | Width transition | 250ms | ease | Instant |
| Pill activate | Background color + scale(1.02) | 150ms | ease-out | Instant |
| Heart toggle | Scale 1.2 → 1.0 + fill | 200ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Instant |
| Grid reflow | CSS Grid auto (browser) | — | — | — |
| Page load | Staggered fade-in (cards) | 400ms | ease-out | Disabled |

**Staggered Entrance:**
```css
.tool-card:nth-child(n) { animation-delay: calc(n * 30ms); }
@media (prefers-reduced-motion: reduce) {
  .tool-card { animation: none; opacity: 1; }
}
```

---

## 6. Responsive Behavior

### 6.1 Mobile (≤639px)
- Header: Title + favorite badge stacked, toggle below
- Search: Full width, no expand animation
- Filter pills: Horizontal scroll with scroll-snap
- Grid: Single column, all cards `standard` or `tall`
- Card padding: 12px
- Touch targets: Minimum 44×44px

### 6.2 Tablet (640-1023px)
- Header: Horizontal layout
- Search: 280px resting, 400px focus
- Filter pills: Visible 4-5, scroll for more
- Grid: 2 columns, `wide` cards span 2
- Card padding: 16px

### 6.3 Desktop (≥1024px)
- Full layout as specified
- Grid: 4 columns, all variants active
- Hover states enabled
- Keyboard shortcuts: `/` focus search, `f` toggle favorites

---

## 7. Accessibility Details

### 7.1 Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Next focusable element |
| Shift+Tab | Previous focusable element |
| Enter/Space | Activate button, toggle pill |
| Escape | Clear search, close filter, deselect all |
| Arrow Keys | Navigate between pills |
| `/` | Focus search input |
| `f` | Toggle favorites only |

### 7.2 Screen Reader Support
- Search input: `aria-label="Search tools"`, `aria-controls="tool-grid"`, `aria-live="polite"`
- Filter pills: `role="group"`, `aria-label="Filter by category"`, each pill `role="button"`, `aria-pressed`
- Favorite button: `aria-label="Add [Tool Name] to favorites"` / `aria-label="Remove [Tool Name] from favorites"`
- Tool card: `article` with `aria-labelledby="card-name-{id}"`
- Live region: `aria-live="polite"` for result count

### 7.3 Color Contrast
| Pair | Ratio | Status |
|------|-------|--------|
| Text Primary / Background | 12.6:1 | ✅ AAA |
| Text Muted / Background | 5.2:1 | ✅ AA |
| Primary / White | 5.8:1 | ✅ AA |
| Primary / Background | 4.9:1 | ✅ AA |
| Border / Background | 2.1:1 | ⚠️ UI only |
| Focus Ring / Background | 4.9:1 | ✅ AA |

---

## 8. Icon System (Lucide)

**CDN:** `<script src="https://unpkg.com/lucide@latest"></script>`
**Usage:** `<i data-lucide="icon-name" class="icon icon--size"></i>`
**Initialization:** `lucide.createIcons()` after DOM ready

**Size Classes:**
| Class | Dimensions |
|-------|------------|
| `.icon--xs` | 16×16 |
| `.icon--sm` | 20×20 |
| `.icon--md` | 24×24 |
| `.icon--lg` | 32×32 |
| `.icon--xl` | 48×48 |

**Required Icons:**
- UI: `search`, `x`, `heart`, `heart-off`, `external-link`, `filter`, `layout-grid`
- Categories: `check-square` (productivity), `code` (development), `palette` (design), `wrench` (utilities), `message-circle` (communication), `book-open` (learning), `credit-card` (finance), `heart-pulse` (health)
- Empty: `search-x`
- Footer: `github`, `plus-circle`, `shield`

---

## 9. Error & Edge Cases

| Scenario | Handling |
|----------|----------|
| No tools match search | Empty state with clear action |
| All categories deselected | Same as "All" selected |
| localStorage unavailable | Graceful degradation (session only) |
| Lucide CDN blocked | Icons hidden, text labels remain |
| Font fails to load | System font fallback activates |
| Network offline | Static assets cached, works fully |
| 100+ tools | Grid handles, consider virtualization later |

---

## 10. Visual Polish Checklist

- [ ] Font loads without flash (FOUT controlled)
- [ ] No layout shift on search/filter
- [ ] Heart animation feels delightful, not distracting
- [ ] Focus indicators visible on all interactive elements
- [ ] Scrollbar styled (thin, brand color)
- [ ] Selection color matches brand (`::selection`)
- [ ] Print stylesheet hides UI, shows grid only
- [ ] Meta tags for social sharing (OG, Twitter)
- [ ] Favicon set (multiple sizes)
- [ ] Manifest.json for "Add to Homescreen"