# Page Information & Content Strategy
## K-Pass Tools Showcase

---

## 1. Page Anatomy

### 1.1 Header (Fixed Top)
| Element | Specification |
|---------|--------------|
| **Height** | Auto, based on content + padding |
| **Background** | `var(--color-bg)` `#FFFACD` with `backdrop-filter: blur(8px)` |
| **Z-Index** | 100 (above all other content) |
| **Padding** | `var(--space-4)` horizontal, `var(--space-4)` vertical |
| **Layout** | `flex` between title and actions |
| **Accessibility** | `aria-label="Main"`, focus visible on all interactive elements |

**Components:**
- **Title**: "K-Pass Tools" — `h1`, `var(--fs-fluid-3xl)`, `font-family: 'After Saved'`
- **Favorite Count**: `span`, `var(--color-primary)`, `aria-live="polite"`
- **Favorites Toggle**: `button`, toggles "Favorites Only" mode

---

### 1.2 Toolbar (Sticky, Below Header)
| Element | Specification |
|---------|--------------|
| **Position** | `sticky`, `top: 100px` (below fixed header) |
| **Background** | `var(--color-bg)` `#FFFACD` |
| **Z-Index** | 90 |
| **Padding** | `var(--space-4)` horizontal, `var(--space-4)` vertical |
| **Layout** | `flex`, `flex-wrap: wrap`, `gap: var(--space-4)`, `align-items: center` |

**Sub-Components:**
- **Search Bar**: `flex: 1`, `min-width: 280px`
  - Resting width: 280px
  - Focus width: 480px (desktop), 100% (mobile)
  - Transition: `width 250ms ease`
  - Placeholder: "Search tools..."
  - Clear button (Lucide `x`): appears when input has value

- **Category Filter Pills**: `flex-wrap: wrap`, `gap: var(--space-2)`
  - Default pill: `--color-bg-card` bg, `--color-text` text, `1px solid --color-border`
  - Active pill: `--color-primary` bg, white text, no border
  - Count badge: `--fs-fluid-xxs`, `--color-primary` bg, white text, `border-radius: 9999px`
  - "All" pill: always first, active by default
  - Keyboard navigation: ←/→ arrows, Enter to toggle, Escape to clear

---

### 1.3 Main Content (Bento Grid)
| Element | Specification |
|---------|--------------|
| **Layout** | CSS Grid, responsive columns |
| **Gap** | `var(--grid-gap)` 16px (desktop), 12px (mobile) |
| **Row Height** | 120px (desktop), 130px (tablet), 140px (mobile) |
| **Columns** | 1 (mobile), 2 (tablet), 4 (desktop) |

**Tool Card Structure:**
```
<article class="tool-card" role="article">
  <div class="card__inner">
    <div class="card__icon-wrapper">
      <i data-lucide="icon-name" class="card__icon icon--md"></i>
    </div>
    <h3 class="card__name">Tool Name</h3>
    <p class="card__description">Short description (1-2 lines)</p>
    <div class="card__category">Category</div>
    {/* Tags only on large cards */}
    <button class="card__favorite" aria-pressed="true">
      <i data-lucide="heart-off" class="icon--sm"></i>
    </button>
    <p class="card__external">
      <i data-lucide="external-link"></i> Visit Site
    </p>
  </div>
</article>
```

**Card Size Variants:**
| Variant | Desktop Spans | Mobile Spans | Description |
|---------|--------------|--------------|-------------|
| `standard` | 1×1 | 1×1 | Default, most common |
| `wide` | 2×1 | 1×1 | Medium-width tools |
| `tall` | 1×2 | 1×2 | Tools with more detail |
| `large` | 2×2 | 1×2 | Featured/hero tools |

**Empty State:**
- Centered in grid area
- Lucide `search-x` icon (64×64, `--color-text-muted`)
- Title: "No tools match your search"
- Description: "Try adjusting your filters or clearing the search above."
- Button: "Clear All Filters" — resets search + filters

---

### 1.4 Footer (Minimal)
| Element | Specification |
|---------|--------------|
| **Padding** | `var(--space-6)` vertical, `var(--space-6)` horizontal |
| **Background** | `var(--color-bg)` `#FFFACD` |
| **Border Top** | `1px solid var(--color-border)` `#E8D5B7` |
| **Color** | `var(--color-text-muted)` `#6B6B6B` |
| **Font Size** | `var(--fs-fluid-xs)` |
| **Text Align** | Center |

**Content:**
```
Curated with care · Icons by Lucide · Font: After Saved
[GitHub] [Submit a Tool] [Privacy]
```

**Links:**
- GitHub: Opens in new tab
- Submit a Tool: Placeholder link (opens in new tab)
- Privacy: Placeholder link

---

## 2. Content Strategy

### 2.1 Tool Categories (Fixed at Launch)
| Category | Description | Target Tools at Launch |
|----------|-------------|-----------------------|
| **Productivity** | Task management, notes, automation | 4 tools |
| **Development** | IDE extensions, CLI tools, debugging | 3 tools |
| **Design** | Color, typography, UI kits, prototyping | 2 tools |
| **Utilities** | System tools, converters, calculators | 3 tools |
| **Communication** | Email, chat, video, collaboration | 2 tools |
| **Entertainment** | Music, podcasts, streaming | 1 tool |

**Total at Launch:** 15 tools, balanced across 6 categories

### 2.2 Tool Data Fields (Per Tool)
| Field | Type | Validation | Example |
|-------|------|------------|-------|
| `id` | string | Required, kebab-case, unique | `raycast` |
| `name` | string | Required, 3-50 chars | `Raycast` |
| `description` | string | Required, 1-300 chars, 1-2 sentences | `Fast, extensible launcher` |
| `category` | string | Required, from predefined list | `productivity` |
| `tags` | string[] | Optional, 3-5 items, lowercase | `["launcher", "automation"]` |
| `url` | string | Required, valid HTTPS URL, reachable | `https://raycast.com` |
| `iconName` | string | Required, from Lucide map | `command` |
| `cardSize` | enum | Required: `standard`, `wide`, `tall`, `large` | `large` |
| `featured` | boolean | Optional, default `false` | `true` |

### 2.2.1 Category Validation List
- `productivity`
- `development`
- `design`
- `utilities`
- `communication`
- `entertainment`

### 2.3 Initial Tool Set (15 Tools)
The launch set includes 15 tools balanced across categories:

1. **Raycast** (productivity, large, featured) — launcher replacement
2. **Notion** (productivity, standard) — all-in-one workspace
3. **Figma** (design, standard) — design & prototyping
4. **GitHub Copilot** (development, wide) — AI pair programmer
5. **Docker** (development, standard) — containerization
6. **Linear** (productivity, standard) — issue tracking
7. **Calendly** (communication, standard) — scheduling
8. **Spotify** (entertainment, standard) — music streaming
9. **Notion AI** (productivity, wide) — AI writing assistant
10. **Linear GitHub** (development, standard) — GitHub sync
11. **Dropbox** (utilities, standard) — file hosting
12. **LastPass** (utilities, standard) — password manager
13. **Grammarly** (productivity, standard) — AI writing assistant
14. **Zoom** (communication, standard) — video conferencing
15. **Trello** (productivity, standard) — kanban boards

### 2.4 Content Update Process
1. Edit `src/data/tools.json` — add/remove/modify tools
2. Ensure `categories` array includes all used categories
3. Run `npm run build`
4. Deploy `dist/` to Cloudflare Pages
5. Verify all tools render correctly

**Maximum Tools:** No hard limit — grid handles any quantity, but UI/UX is optimized for 15-25 tools. Beyond 30, consider adding virtualization or pagination.

### 2.5 Tool Icon Guidelines
- **Source**: All icons from Lucide CDN (`https://unpkg.com/lucide@latest`)
- **Naming**: Use exact Lucide icon names from the `iconMap`
- **Fallback**: If `iconName` is not in the map, default to `code`
- **Consistency**: All icons are 24px stroke width, rounded rectangles where applicable
- **No Custom Images**: Per spec — no tool screenshots or logos, only Lucide icons

### 2.6 URL Requirements
- All tool URLs must use `https://`
- URLs should be the official website or app store page
- No affiliate links or tracking parameters
- Links open in new tab with `rel="noopener noreferrer"`
- Broken URLs should be removed from the data set

---

## 3. SEO & Meta Information

### 3.1 Meta Tags (in `index.html`)
```html
<!-- Open Graph -->
<meta property="og:title" content="K-Pass Tools" />
<meta property="og:description" content="Curated tools for daily productivity" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://k-pass.pages.dev" />
<meta property="og:image" content="https://k-pass.pages.dev/assets/icon.png" />

<!-- Twitter -->
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="K-Pass Tools" />
<meta name="twitter:description" content="Curated tools for daily productivity" />

<!-- Standard -->
<title>K-Pass Tools — Daily Life Extensions & Applications</title>
<meta name="description" content="Curated tools for daily productivity — browser extensions, CLI tools, and web applications" />
```

### 3.2 Favicon
- **File**: `public/favicon.ico` (or add to build process)
- **Sizes**: 32×32, 16×16
- **Format**: ICO (supports multiple sizes)

### 3.3 Social Sharing Preview
When shared on social media:
- **Title**: "K-Pass Tools"
- **Description**: "Curated tools for daily productivity"
- **Image**: Consider adding an Open Graph image (`og:image`) to the HTML

---

## 4. Accessibility by Page Section

### 4.1 Header
- Focus visible: 2px solid `#B81104` outline
- Keyboard: Tab navigates title → favorite count → toggle → toolbar
- ARIA: `aria-label="Main"`, `aria-live="polite"` on count

### 1.2 Toolbar
- Search: `role="search"`, `aria-label="Search tools"`, `aria-controls="tool-grid"`
- Filter pills: `role="button"`, `aria-pressed` state
- Esc key: clears search, removes active filters

### 1.3 Tool Grid
- Each card: `<article>` with `aria-labelledby="card-name-{id}"`
- Live region: announces "X tools found" after search/filter
- Favorite buttons: `aria-pressed` reflects actual state
- Heart toggle: announces "Added to favorites" / "Removed from favorites"

### 1.4 Footer
- Simple text links with visible focus states
- Contrast: `#6B6B6B` on `#FFFACD` = 5.2:1 (WCAG AA)

---

## 5. Internationalization (i18n) — Post-MVP
*Not implemented in v1. All text is English-only.*

**If implemented:**
- JSON catalog of translated strings
- `navigator.language` detection
- Direction: LTR only (no RTL support planned for v1)
- Font: `After Saved` supports Latin glyphs only

---

## 5. Print Style
*Basic print styles included — hides sticky header/toolbar, prints grid of cards.*

**Print Behavior:**
- Header (`fixed`) → not printed
- Toolbar (`sticky`) → not printed
- Grid cards → printed as-is
- Footer → printed
- Color: grayscale-friendly (primary `#B81104` becomes dark gray)

**CSS for Print:**
```css
@media print {
  .header, .toolbar { display: none; }
  .tool-card { break-inside: avoid; }
  .footer { page-break-after: always; }
}
```