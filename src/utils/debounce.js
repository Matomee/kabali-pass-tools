/**
 * Debounce Utility — K-Pass Tools
 * Ensures a function only fires after N milliseconds of no calls.
 */

export const debounce = (fn, wait) => {
  let timeout = null
  return function (...args) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => fn.apply(context, args), wait)
  }
}