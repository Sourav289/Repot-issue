/**
 * ui.js — All DOM rendering and UI components
 */

const UI = (() => {

  /* ─── Toast Notifications ─── */
  function _ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function toast(message, type = 'success', duration = 3500) {
    const container = _ensureToastContainer();
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ'}</div>
      <span class="toast-message">${Utils.escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close">×</button>
    `;
    el.querySelector('.toast-close').addEventListener('click', () => _dismissToast(el));
    container.appendChild(el);
    setTimeout(() => _dismissToast(el), duration);
  }

  function _dismissToast(el) {
    if (!el.parentNode) return;
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 300);
  }

  /* ─── Skeleton Cards ─── */
  function skeletonCards(count = 3) {
    return Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line w-40"></div>
          <div class="skeleton skeleton-line w-80 h-16"></div>
          <div class="skeleton skeleton-line w-60"></div>
          <div class="skeleton skeleton-line w-80"></div>
        </div>
      </div>
    `).join('');
  }

  /* ─── Issue Card ─── */
  function issueCard(issue) {
    const emoji = Utils.categoryEmoji(issue.category);
    const imageHtml = issue.image
      ? `<img class="card-image" src="${issue.image}" alt="${Utils.escapeHtml(issue.title)}" loading="lazy">`
      : `<div class="card-image-placeholder">${emoji}</div>`;
    const badgeClass = Utils.statusClass(issue.status);
    const catClass   = Utils.categoryClass(issue.category);
    return `
      <article class="issue-card" data-id="${issue.id}" tabindex="0" role="button" aria-label="View ${Utils.escapeHtml(issue.title)}">
        ${imageHtml}
        <div class="card-body">
          <div class="card-meta">
            <span class="card-category ${catClass}">${Utils.escapeHtml(issue.category)}</span>
            <span class="card-date">${Utils.timeAgo(issue.date)}</span>
          </div>
          <h3 class="card-title">${Utils.escapeHtml(issue.title)}</h3>
          <p class="card-desc">${Utils.escapeHtml(issue.description)}</p>
          <div class="card-footer">
            <span class="card-location">📍 ${Utils.escapeHtml(issue.location || 'Location N/A')}</span>
            <span class="badge ${badgeClass}">${Utils.escapeHtml(issue.status)}</span>
          </div>
        </div>
      </article>
    `;
  }

  /* ─── Empty State ─── */
  function emptyState(title = 'No issues found', text = 'Try adjusting your filters or search term.') {
    return `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="empty-title">${Utils.escapeHtml(title)}</h3>
        <p class="empty-text">${Utils.escapeHtml(text)}</p>
      </div>
    `;
  }

  /* ─── Admin Table Row ─── */
  function adminTableRow(issue) {
    const statusMap = [
      { key: 'Pending',     cls: 'pending' },
      { key: 'In Progress', cls: 'progress' },
      { key: 'Resolved',    cls: 'resolved' },
    ];
    const btns = statusMap.map(s => `
      <button class="status-btn ${s.cls} ${issue.status === s.key ? 'active' : ''}"
              data-id="${issue.id}" data-status="${s.key}">
        ${Utils.escapeHtml(s.key)}
      </button>
    `).join('');

    return `
      <tr data-id="${issue.id}">
        <td>
          <div class="td-title">${Utils.escapeHtml(issue.title)}</div>
          <div class="td-title-sub">${Utils.formatDate(issue.date)}</div>
        </td>
        <td><span class="card-category ${Utils.categoryClass(issue.category)}">${Utils.escapeHtml(issue.category)}</span></td>
        <td><span class="badge ${Utils.statusClass(issue.status)}">${Utils.escapeHtml(issue.status)}</span></td>
        <td style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono);">${Utils.escapeHtml(issue.location || '—')}</td>
        <td>
          <div class="status-btn-group">${btns}</div>
        </td>
        <td>
          <a href="details.html?id=${issue.id}" style="font-size:12px;color:var(--accent);font-weight:600;">View →</a>
        </td>
      </tr>
    `;
  }

  /* ─── Field Error Helper ─── */
  function showFieldError(input, message) {
    input.classList.add('error');
    let err = input.parentNode.querySelector('.field-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'field-error';
      input.parentNode.appendChild(err);
    }
    err.innerHTML = `⚠ ${Utils.escapeHtml(message)}`;
  }

  function clearFieldError(input) {
    input.classList.remove('error');
    const err = input.parentNode.querySelector('.field-error');
    if (err) err.remove();
  }

  /* ─── Dark Mode Toggle ─── */
  function initTheme() {
    const saved = localStorage.getItem('civic_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = saved === 'dark' ? '☀️' : '🌙';
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('civic_theme', next);
        btn.textContent = next === 'dark' ? '☀️' : '🌙';
      });
    });
  }

  /* ─── Navbar active link ─── */
  function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  }

  /* ─── Mobile Menu ─── */
  function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (!hamburger || !mobileMenu) return;
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
      }
    });
  }

  /* ─── Animate stats counter ─── */
  function animateCounter(el, target, duration = 800) {
    let start = 0;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }

  return {
    toast, skeletonCards, issueCard, emptyState,
    adminTableRow, showFieldError, clearFieldError,
    initTheme, setActiveNav, initMobileMenu, animateCounter
  };
})();
