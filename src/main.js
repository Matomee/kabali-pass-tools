/**
 * Main Application — K-Pass Tools Showcase
 * Bootstrap, data fetch, component initialization, event wiring
 */

import { debounce } from './utils/debounce.js'
import { iconMap } from './utils/icons.js'
import { storage } from './utils/storage.js'
import './styles/main.css'
import toolsData from './data/tools.json'
// Exact script sources (?raw) — the displayed code can never drift from the files.
import alwaysActiveSrc from '../scripts/always-active-pro/always-active-pro.user.js?raw'
import copyPasteSrc from '../scripts/copy-paste-pro/copy-paste-pro.user.js?raw'

// DOM Elements
const toolGrid = document.getElementById('tool-grid')
const searchInput = document.querySelector('.toolbar__search-input')
const filterPillsContainer = document.getElementById('filter-pills')
let filterPills = []
const favoriteCount = document.querySelector('.header__favorite-count')
const favoriteToggle = document.querySelector('.header__favorite-toggle')
const statTools = document.getElementById('stat-tools')
const statCats = document.getElementById('stat-cats')
const statFavs = document.getElementById('stat-favs')

// Initialize state
let allTools = toolsData.tools
let favorites = []
let selectedCategories = new Set(['all'])
let searchQuery = ''

/**
 * Render tool cards to the grid
 * @param {Array} tools - Array of tool objects
 */
function renderTools(tools) {
  if (!tools || tools.length === 0) {
    toolGrid.innerHTML = `
      <section class="empty-state" role="status">
        <i data-lucide="search-x" class="empty-state__icon icon--xl" aria-hidden="true"></i>
        <h2 class="empty-state__title">No tools match your search</h2>
        <p class="empty-state__description">
          Try adjusting your filters or clearing the search above.
        </p>
        <button class="empty-state__button" id="clear-filters">
          Clear All Filters
        </button>
      </section>`
    lucide.createIcons()
    return
  }

  toolGrid.innerHTML = tools
    .map((tool, index) => {
      const isFavorite = storage.isFavorite(tool.id)
      const cardSize = tool.cardSize || 'standard'
      const iconName = iconMap[tool.iconName] || 'code'
      const tags = tool.tags || []

      // Determine grid spans based on size and breakpoint
      let colSpan, rowSpan
      if (window.innerWidth <= 639) {
        colSpan = 1
        rowSpan = 1
      } else if (window.innerWidth <= 1023) {
        colSpan = cardSize === 'large' ? 2 : 1
        rowSpan = cardSize === 'large' ? 2 : 1
      } else {
        colSpan = { large: 2, wide: 2, tall: 1, standard: 1 }[cardSize] || 1
        rowSpan = { large: 2, wide: 1, tall: 2, standard: 1 }[cardSize] || 1
      }

      // Tags HTML (only for large cards)
      const tagsHTML =
        cardSize === 'large' && tags.length > 0
          ? `<div class="card__tags">
              ${tags
                .slice(0, 3)
                .map(
                  (tag) =>
                    `<span class="card__tag">${tag}</span>`
                )
                .join('')}
            </div>`
          : ''

      return `<article
        class="tool-card card card--${cardSize}"
        tabindex="0"
        role="article"
        aria-labelledby="card-name-${tool.id}"
        data-category="${tool.category}"
        data-id="${tool.id}"
        style="--animation-delay: ${index * 30}ms"
      >
        <div class="card__inner">
          <div class="card__icon-wrapper">
            <i
              data-lucide="${iconName}"
              class="card__icon icon--md"
              aria-hidden="true"
            ></i>
          </div>

          <h3 class="card__name" id="card-name-${tool.id}">
            ${tool.name}
          </h3>

          <p class="card__description">${tool.description}</p>

          ${tagsHTML}

          <button
            class="card__favorite"
            aria-pressed="${isFavorite}"
            aria-label="${isFavorite
              ? `Remove ${tool.name} from favorites`
              : `Add ${tool.name} to favorites`}"
            data-id="${tool.id}"
            title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
          >
            <i
              data-lucide="${isFavorite ? 'heart' : 'heart-off'}"
              class="icon--sm"
              aria-hidden="true"
            ></i>
          </button>

          <div class="card__footer">
            <a
              class="card__cta"
              href="${tool.url}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="${tool.url.includes('chromewebstore') ? `Get ${tool.name} extension` : `Visit ${tool.name} site`}"
            >
              <i
                data-lucide="${tool.url.includes('chromewebstore') ? 'download' : 'external-link'}"
                class="icon--xs"
                aria-hidden="true"
              ></i> ${tool.url.includes('chromewebstore') ? 'Get Extension' : 'Visit Site'}
            </a>
          </div>
        </div>
      </article>`
    })
    .join('')

  // Re-initialize Lucide icons
  lucide.createIcons()

  // Add event listeners to favorite buttons
  document
    .querySelectorAll('.card__favorite')
    .forEach((btn) => btn.addEventListener('click', handleFavoriteClick))

  // Add event listeners to tool cards for clicking to open URL
  document.querySelectorAll('.tool-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Don't navigate if clicking the favorite button or CTA link
      if (e.target.closest('.card__favorite') || e.target.closest('a')) return
      const id = card.dataset.id
      const tool = allTools.find((t) => t.id === id)
      if (tool && tool.url) {
        window.open(tool.url, '_blank')
      }
    })
  })

  // Update favorite count + mark grid ready
  updateFavoriteCount()
  toolGrid.setAttribute('aria-busy', 'false')
}

/**
 * Render category filter pills from live data (counts always correct)
 */
function renderFilterPills() {
  if (!filterPillsContainer) return
  const counts = {}
  allTools.forEach((t) => {
    counts[t.category] = (counts[t.category] || 0) + 1
  })
  const categories = [...new Set(allTools.map((t) => t.category))].sort()
  const label = (c) => c.charAt(0).toUpperCase() + c.slice(1)
  filterPillsContainer.innerHTML =
    `<button class="toolbar__filter-pill toolbar__filter-pill--active" data-category="all" aria-pressed="true">All <span class="toolbar__filter-count">${allTools.length}</span></button>` +
    categories
      .map(
        (c) =>
          `<button class="toolbar__filter-pill" data-category="${c}" aria-pressed="false">${label(c)} <span class="toolbar__filter-count">${counts[c]}</span></button>`
      )
      .join('')
  filterPills = [...filterPillsContainer.querySelectorAll('.toolbar__filter-pill')]
  filterPills.forEach((pill) => pill.addEventListener('click', handleFilterClick))
  lucide.createIcons()
}

/**
 * Update hero stat counters
 */
function updateHeroStats() {
  if (statTools) statTools.textContent = allTools.length
  const toolsLabel = document.getElementById('stat-tools-label')
  if (toolsLabel) toolsLabel.textContent = allTools.length === 1 ? 'tool' : 'tools'
  const catCount = new Set(allTools.map((t) => t.category)).size
  if (statCats) statCats.textContent = catCount
  const catsLabel = document.getElementById('stat-cats-label')
  if (catsLabel) catsLabel.textContent = catCount === 1 ? 'category' : 'categories'
  if (statFavs) statFavs.textContent = storage.loadFavorites().length
}

/**
 * Filter tools by search query and selected categories
 * @param {Array} tools - All tools
 * @param {string} query - Search query
 * @param {Set} categories - Selected category Set
 * @returns {Array} Filtered tools
 */
function filterTools(tools, query, categories) {
  if (!query && categories.has('all')) return tools

  return tools.filter((tool) => {
    // Category filter
    const categoryMatch =
      categories.has('all') ||
      categories.has(tool.category) ||
      categories.size === 0

    // Search filter
    const searchMatch =
      !query ||
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      (tool.tags &&
        tool.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())))

    return categoryMatch && searchMatch
  })
}

/**
 * Update the favorite count badge
 */
function updateFavoriteCount() {
  favorites = storage.loadFavorites()
  const count = favorites.length
  favoriteCount.textContent = count
  favoriteCount.setAttribute('aria-label', `You have ${count} favorite tools`)
  if (statFavs) statFavs.textContent = count
}

/**
 * Handle favorite button click
 * @param {Event} e - Click event
 */
function handleFavoriteClick(e) {
  e.stopPropagation()
  const id = e.currentTarget.dataset.id
  storage.toggleFavorite(id)

  // Re-render grid from storage truth (fresh heart icons + counts)
  renderTools(filterTools(allTools, searchQuery, selectedCategories))
}

/**
 * Handle search input
 * @param {Event} e - Input event
 */
function handleSearch(e) {
  const query = e.target.value.trim()
  searchQuery = query

  // Update search input state
  if (query) {
    e.target.classList.add('has-value')
  } else {
    e.target.classList.remove('has-value')
  }

  // Filter and re-render
  const filtered = filterTools(allTools, query, selectedCategories)
  renderTools(filtered)

  // Announce result count
  const resultAnnouncement = document.createElement('div')
  resultAnnouncement.setAttribute('role', 'status')
  resultAnnouncement.setAttribute('aria-live', 'polite')
  resultAnnouncement.textContent = `${filtered.length} tools found`
  // Insert after toolbar or as toast
  const toolbar = document.querySelector('.toolbar')
  if (toolbar.nextElementSibling?.className !== 'main') {
    toolbar.after(resultAnnouncement)
    setTimeout(() => resultAnnouncement.remove(), 3000)
  }
}

/**
 * Handle category filter pill click
 * @param {Event} e - Click event
 */
function handleFilterClick(e) {
  const pill = e.currentTarget
  const category = pill.dataset.category

  // Toggle the pill
  if (selectedCategories.has(category)) {
    // Deselect this category
    selectedCategories.delete(category)
    pill.setAttribute('aria-pressed', 'false')
    pill.classList.remove('toolbar__filter-pill--active')
  } else {
    // Select this category
    selectedCategories.add(category)
    pill.setAttribute('aria-pressed', 'true')
    pill.classList.add('toolbar__filter-pill--active')
  }

  // If "All" is clicked, clear all others
  if (category === 'all') {
    selectedCategories.clear()
    selectedCategories.add('all')
    filterPills.forEach((p) => {
      p.setAttribute('aria-pressed', p === pill ? 'true' : 'false')
      p.classList.toggle('toolbar__filter-pill--active', p === pill)
    })
  }

  // Re-render grid
  const filtered = filterTools(allTools, searchQuery, selectedCategories)
  renderTools(filtered)
}

/**
 * Initialize the application
 */
function init() {
  // Load favorites from storage
  favorites = storage.loadFavorites()
  updateFavoriteCount()

  // Dynamic pills + hero stats, then initial render
  renderFilterPills()
  updateHeroStats()
  renderTools(allTools)

  // Event listeners
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 150))
  }

  // Favorite toggle in header
  if (favoriteToggle) {
    favoriteToggle.addEventListener('click', () => {
      const faveCount = storage.loadFavorites().length
      alert(`Favorites toggle — showing ${faveCount} saved tools`)
    })
  }

  // Clear filters button (in empty state)
  document.addEventListener('click', (e) => {
    if (e.target.id === 'clear-filters') {
      searchInput.value = ''
      searchInput.classList.remove('has-value')
      searchInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })

  // Lucide icons
  lucide.createIcons()

  // Announce page loaded
  document.documentElement.classList.add('page-loaded')
}

/**
 * Userscript source views + corner copy buttons
 */
const SCRIPT_SOURCES = {
  'always-active': { text: alwaysActiveSrc, codeEl: 'script-code-aa', metaEl: 'script-meta-aa' },
  'copy-paste': { text: copyPasteSrc, codeEl: 'script-code-cp', metaEl: 'script-meta-cp' }
}

function describeSource(text) {
  const lines = text.split('\n').length
  const kb = (new Blob([text]).size / 1024).toFixed(1)
  return lines + ' lines · ' + kb + ' KB · v' + ((text.match(/@version\s+([^\s]+)/) || [])[1] || '?')
}

function renderScriptSources() {
  Object.values(SCRIPT_SOURCES).forEach(({ text, codeEl, metaEl }) => {
    const code = document.getElementById(codeEl)
    const meta = document.getElementById(metaEl)
    if (code) code.textContent = text.trimEnd()
    if (meta) meta.textContent = describeSource(text)
  })
}

async function copySourceText(text, button) {
  const label = button.querySelector('span')
  const done = (ok) => {
    if (!label) return
    label.textContent = ok ? 'Copied' : 'Failed'
    button.setAttribute('aria-label', ok ? 'Source copied to clipboard' : 'Copy failed — select the code manually')
    setTimeout(() => {
      label.textContent = 'Copy'
      button.setAttribute('aria-label', button.dataset.script === 'always-active' ? 'Copy Always Active Pro source code' : 'Copy Copy Paste Pro source code')
    }, 2000)
  }
  try {
    await navigator.clipboard.writeText(text)
    done(true)
    return
  } catch (e) { /* fall through to legacy path */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    done(!!ok)
  } catch (e) {
    done(false)
  }
}

function initScriptCopies() {
  renderScriptSources()
  document.querySelectorAll('.script-card__copy').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const entry = SCRIPT_SOURCES[btn.dataset.script]
      if (entry) copySourceText(entry.text.trimEnd(), btn)
    })
  })
}

// Start the app
try {
  init()
  initScriptCopies()
} catch (err) {
  console.error('K-Pass Tools initialization error:', err)
}