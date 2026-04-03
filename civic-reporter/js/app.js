/**
 * app.js — Page-specific logic. Auto-detects current page and initialises.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Always run
  Storage.seedIfEmpty();
  UI.initTheme();
  UI.setActiveNav();
  UI.initMobileMenu();

  // Route to page logic
  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html' || page === '')  initHomePage();
  if (page === 'report.html')                initReportPage();
  if (page === 'issues.html')                initIssuesPage();
  if (page === 'details.html')               initDetailsPage();
  if (page === 'admin.html')                 initAdminPage();
});

/* ============================================================
   HOME PAGE
   ============================================================ */
function initHomePage() {
  // Animate stat counters
  const stats = Storage.getStats();
  const totalEl    = document.getElementById('stat-total');
  const resolvedEl = document.getElementById('stat-resolved');
  const pendingEl  = document.getElementById('stat-pending');
  if (totalEl)    UI.animateCounter(totalEl, stats.total);
  if (resolvedEl) UI.animateCounter(resolvedEl, stats.resolved);
  if (pendingEl)  UI.animateCounter(pendingEl, stats.pending + stats.inProgress);

  // Latest issues grid
  const grid = document.getElementById('latest-issues-grid');
  if (!grid) return;
  grid.innerHTML = UI.skeletonCards(3);

  setTimeout(() => {
    const issues = Storage.getAll().slice(0, 3);
    if (issues.length === 0) {
      grid.innerHTML = UI.emptyState('No reports yet', 'Be the first to report an issue in your area.');
    } else {
      grid.innerHTML = issues.map(UI.issueCard).join('');
      grid.querySelectorAll('.issue-card').forEach(card => {
        card.addEventListener('click', () => {
          window.location.href = `details.html?id=${card.dataset.id}`;
        });
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') window.location.href = `details.html?id=${card.dataset.id}`;
        });
      });
    }
  }, 600);
}

/* ============================================================
   REPORT PAGE
   ============================================================ */
function initReportPage() {
  const form       = document.getElementById('report-form');
  const titleInput = document.getElementById('input-title');
  const descInput  = document.getElementById('input-desc');
  const catSelect  = document.getElementById('input-category');
  const locInput   = document.getElementById('input-location');
  const imageInput = document.getElementById('input-image');
  const previewWrap = document.getElementById('image-preview-wrap');
  const previewImg  = document.getElementById('image-preview');
  const removeBtn   = document.getElementById('remove-preview-btn');
  const locBtn      = document.getElementById('btn-locate');
  const submitBtn   = document.getElementById('submit-btn');

  let imageDataURL = '';

  // ── Image Upload & Preview ──
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      UI.toast('Image must be under 5MB', 'error');
      return;
    }
    try {
      imageDataURL = await Utils.fileToDataURL(file);
      previewImg.src = imageDataURL;
      previewWrap.classList.add('visible');
    } catch {
      UI.toast('Failed to load image preview', 'error');
    }
  });

  removeBtn.addEventListener('click', () => {
    imageDataURL = '';
    imageInput.value = '';
    previewWrap.classList.remove('visible');
    previewImg.src = '';
  });

  // ── Geolocation ──
  locBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      UI.toast('Geolocation not supported by your browser', 'error');
      return;
    }
    locBtn.classList.add('loading');
    locBtn.innerHTML = '<span class="spinner"></span> Locating…';
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        locInput.value = `${lat}° N, ${lon}° E`;
        locBtn.classList.remove('loading');
        locBtn.innerHTML = '📍 Detect';
        UI.toast('Location detected!', 'success');
      },
      err => {
        locBtn.classList.remove('loading');
        locBtn.innerHTML = '📍 Detect';
        UI.toast('Unable to detect location: ' + err.message, 'error');
      },
      { timeout: 8000 }
    );
  });

  // ── Inline Validation ──
  function validate() {
    let valid = true;
    const required = [
      { el: titleInput, msg: 'Title is required' },
      { el: descInput,  msg: 'Description is required' },
      { el: catSelect,  msg: 'Please select a category' },
      { el: locInput,   msg: 'Location is required — use Detect or type manually' },
    ];
    required.forEach(({ el, msg }) => {
      if (!el.value.trim()) {
        UI.showFieldError(el, msg);
        valid = false;
      } else {
        UI.clearFieldError(el);
      }
    });
    return valid;
  }

  // Clear errors on input
  [titleInput, descInput, catSelect, locInput].forEach(el => {
    el.addEventListener('input', () => UI.clearFieldError(el));
  });

  // ── Form Submit ──
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      UI.toast('Please fill all required fields', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

    // Simulate slight async delay for UX
    setTimeout(() => {
      const issue = {
        id:          Utils.uid(),
        title:       titleInput.value.trim(),
        description: descInput.value.trim(),
        category:    catSelect.value,
        image:       imageDataURL,
        location:    locInput.value.trim(),
        status:      'Pending',
        date:        new Date().toISOString(),
      };
      Storage.save(issue);
      UI.toast('Issue reported successfully! 🎉', 'success', 4000);
      form.reset();
      imageDataURL = '';
      previewWrap.classList.remove('visible');
      previewImg.src = '';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🚀 Submit Report';
      // Redirect to issues page after short delay
      setTimeout(() => window.location.href = 'issues.html', 1800);
    }, 700);
  });
}

/* ============================================================
   ISSUES PAGE
   ============================================================ */
function initIssuesPage() {
  const grid       = document.getElementById('issues-grid');
  const searchEl   = document.getElementById('filter-search');
  const catEl      = document.getElementById('filter-category');
  const statusEl   = document.getElementById('filter-status');
  const countEl    = document.getElementById('issues-count');

  let filters = { search: '', category: '', status: '' };

  function render() {
    const filtered = Utils.filterIssues(Storage.getAll(), filters);
    countEl.textContent = `${filtered.length} issue${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      grid.innerHTML = UI.emptyState('No issues match your filters', 'Try clearing some filters.');
      return;
    }
    grid.innerHTML = filtered.map(UI.issueCard).join('');
    grid.querySelectorAll('.issue-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = `details.html?id=${card.dataset.id}`;
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') window.location.href = `details.html?id=${card.dataset.id}`;
      });
    });
  }

  // Show skeletons first
  grid.innerHTML = UI.skeletonCards(6);
  setTimeout(() => render(), 500);

  // Debounced search
  const debouncedSearch = Utils.debounce((val) => {
    filters.search = val;
    render();
  }, 300);

  searchEl.addEventListener('input', e => debouncedSearch(e.target.value));
  catEl.addEventListener('change',    e => { filters.category = e.target.value; render(); });
  statusEl.addEventListener('change', e => { filters.status   = e.target.value; render(); });
}

/* ============================================================
   DETAILS PAGE
   ============================================================ */
function initDetailsPage() {
  const id = Utils.getParam('id');
  const container = document.getElementById('details-root');
  if (!container) return;

  if (!id) {
    container.innerHTML = UI.emptyState('Issue not found', 'No ID was provided in the URL.');
    return;
  }

  container.innerHTML = '<div style="padding:60px 24px;text-align:center;color:var(--text-faint);">Loading…</div>';

  setTimeout(() => {
    const issue = Storage.getById(id);
    if (!issue) {
      container.innerHTML = UI.emptyState('Issue not found', 'This issue may have been deleted.');
      return;
    }

    // Timeline
    const STATUSES = ['Pending', 'In Progress', 'Resolved'];
    const currentIdx = STATUSES.indexOf(issue.status);
    const timelineHtml = STATUSES.map((s, i) => {
      const cls = i < currentIdx ? 'done' : i === currentIdx ? 'active' : '';
      const icon = i < currentIdx ? '✓' : i === currentIdx ? '●' : '';
      return `
        <div class="timeline-item">
          <div class="timeline-dot ${cls}">${icon}</div>
          <div class="timeline-info">
            <div class="timeline-label">${Utils.escapeHtml(s)}</div>
            <div class="timeline-date">${i <= currentIdx ? Utils.formatDate(issue.date) : 'Awaiting'}</div>
          </div>
        </div>
      `;
    }).join('');

    const imageHtml = issue.image
      ? `<img class="details-image" src="${issue.image}" alt="${Utils.escapeHtml(issue.title)}">`
      : `<div class="details-image-placeholder">${Utils.categoryEmoji(issue.category)}</div>`;

    container.innerHTML = `
      <div class="details-container">
        <div>
          <button class="back-btn" onclick="history.back()">← Back</button>
          <div class="details-main-card">
            ${imageHtml}
            <div class="details-content">
              <div class="details-category">${Utils.escapeHtml(issue.category)}</div>
              <h1 class="details-title">${Utils.escapeHtml(issue.title)}</h1>
              <p class="details-desc">${Utils.escapeHtml(issue.description)}</p>
              <div class="details-meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Status</span>
                  <span class="meta-value"><span class="badge ${Utils.statusClass(issue.status)}">${Utils.escapeHtml(issue.status)}</span></span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Reported</span>
                  <span class="meta-value">${Utils.formatDate(issue.date)}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Location</span>
                  <span class="meta-value">${Utils.escapeHtml(issue.location || 'Not provided')}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Issue ID</span>
                  <span class="meta-value">${Utils.escapeHtml(issue.id)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="details-sidebar">
          <div class="sidebar-card">
            <div class="sidebar-card-title">Resolution Timeline</div>
            <div class="timeline">${timelineHtml}</div>
          </div>
          <div class="sidebar-card">
            <div class="sidebar-card-title">Quick Info</div>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div>
                <div class="meta-label">Category</div>
                <div style="font-size:14px;font-weight:600;margin-top:4px;">${Utils.categoryEmoji(issue.category)} ${Utils.escapeHtml(issue.category)}</div>
              </div>
              <div>
                <div class="meta-label">Time Since Report</div>
                <div style="font-size:14px;margin-top:4px;">${Utils.timeAgo(issue.date)}</div>
              </div>
            </div>
          </div>
          <a href="issues.html" class="btn-secondary" style="justify-content:center;">← View All Issues</a>
        </div>
      </div>
    `;
  }, 400);
}

/* ============================================================
   ADMIN PAGE
   ============================================================ */
function initAdminPage() {
  const tbody    = document.getElementById('admin-tbody');
  const searchEl = document.getElementById('admin-search');
  const statEls  = {
    total:    document.getElementById('admin-stat-total'),
    pending:  document.getElementById('admin-stat-pending'),
    progress: document.getElementById('admin-stat-progress'),
    resolved: document.getElementById('admin-stat-resolved'),
  };

  function updateStats() {
    const s = Storage.getStats();
    if (statEls.total)    UI.animateCounter(statEls.total,    s.total);
    if (statEls.pending)  UI.animateCounter(statEls.pending,  s.pending);
    if (statEls.progress) UI.animateCounter(statEls.progress, s.inProgress);
    if (statEls.resolved) UI.animateCounter(statEls.resolved, s.resolved);
  }

  function render(searchTerm = '') {
    const issues = Utils.filterIssues(Storage.getAll(), { search: searchTerm });
    if (issues.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--text-faint);">No issues found</td></tr>`;
    } else {
      tbody.innerHTML = issues.map(UI.adminTableRow).join('');
    }
    attachStatusHandlers();
    updateStats();
  }

  function attachStatusHandlers() {
    tbody.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const { id, status } = btn.dataset;
        Storage.update(id, { status });
        UI.toast(`Status updated to "${status}"`, 'success');
        render(searchEl.value.trim());
      });
    });
  }

  render();

  const debouncedSearch = Utils.debounce((val) => render(val), 300);
  searchEl.addEventListener('input', e => debouncedSearch(e.target.value));

  // Export CSV
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const issues = Storage.getAll();
      const rows = [
        ['ID', 'Title', 'Category', 'Status', 'Location', 'Date'],
        ...issues.map(i => [i.id, i.title, i.category, i.status, i.location, Utils.formatDate(i.date)])
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'civic-reporter-issues.csv';
      a.click();
      URL.revokeObjectURL(url);
      UI.toast('Issues exported as CSV', 'success');
    });
  }
}
