/**
 * utils.js — Pure helper / utility functions
 */

const Utils = (() => {

  /** Generate a short unique ID */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** Format ISO date string → "Mar 31, 2026" */
  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  /** Relative time: "2 hours ago" */
  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return formatDate(iso);
  }

  /** Debounce a function */
  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /** Read URL query param */
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /** Escape HTML to prevent XSS */
  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, m => map[m]);
  }

  /** Category → emoji */
  const CATEGORY_EMOJI = {
    Pothole:     '🕳️',
    Garbage:     '🗑️',
    Streetlight: '💡',
    Drainage:    '🌊',
    Other:       '📌',
  };

  function categoryEmoji(cat) {
    return CATEGORY_EMOJI[cat] || '📌';
  }

  /** Status → badge class */
  function statusClass(status) {
    if (status === 'Resolved')   return 'badge-resolved';
    if (status === 'In Progress') return 'badge-progress';
    return 'badge-pending';
  }

  /** Category → CSS class */
  function categoryClass(cat) {
    return 'cat-' + (cat || 'other').toLowerCase().replace(/\s+/g, '');
  }

  /** Convert file to base64 data URL */
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /** Filter + sort issues */
  function filterIssues(issues, { search = '', category = '', status = '' } = {}) {
    let filtered = [...issues];
    if (search)   filtered = filtered.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
    if (category) filtered = filtered.filter(i => i.category === category);
    if (status)   filtered = filtered.filter(i => i.status === status);
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    return filtered;
  }

  return {
    uid, formatDate, timeAgo, debounce,
    getParam, escapeHtml, categoryEmoji,
    statusClass, categoryClass, fileToDataURL, filterIssues
  };
})();
