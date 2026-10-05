/**
 * Storage Utils — K-Pass Tools
 * localStorage helpers with fallback
 */

export const storage = {
  // Save favorites to localStorage
  saveFavorites(ids) {
    try {
      localStorage.setItem('kpass-favorites', JSON.stringify(ids))
      return true
    } catch (e) {
      console.warn('localStorage save failed', e)
      return false
    }
  },

  // Load favorites from localStorage
  loadFavorites() {
    try {
      const data = localStorage.getItem('kpass-favorites')
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.warn('localStorage load failed', e)
      return []
    }
  },

  // Check if a tool is favorited
  isFavorite(id) {
    const favorites = this.loadFavorites()
    return favorites.includes(id)
  },

  // Toggle favorite status for a tool ID
  toggleFavorite(id) {
    const favorites = this.loadFavorites()
    const idx = favorites.indexOf(id)

    if (idx > -1) {
      favorites.splice(idx, 1)
    } else {
      favorites.push(id)
    }

    this.saveFavorites(favorites)
    return this.isFavorite(id)
  },

  // Remove all favorites
  clearFavorites() {
    this.saveFavorites([])
  }
}