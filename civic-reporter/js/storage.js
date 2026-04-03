/**
 * storage.js — LocalStorage abstraction layer
 * All data persistence operations are centralized here.
 */

const Storage = (() => {
  const KEY = 'civic_issues';

  /** Return all issues (array) */
  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }

  /** Return a single issue by id */
  function getById(id) {
    return getAll().find(i => i.id === id) || null;
  }

  /** Save a new issue */
  function save(issue) {
    const issues = getAll();
    issues.unshift(issue); // newest first
    localStorage.setItem(KEY, JSON.stringify(issues));
    return issue;
  }

  /** Update an existing issue (merge) */
  function update(id, changes) {
    const issues = getAll();
    const idx = issues.findIndex(i => i.id === id);
    if (idx === -1) return null;
    issues[idx] = { ...issues[idx], ...changes };
    localStorage.setItem(KEY, JSON.stringify(issues));
    return issues[idx];
  }

  /** Delete an issue */
  function remove(id) {
    const issues = getAll().filter(i => i.id !== id);
    localStorage.setItem(KEY, JSON.stringify(issues));
  }

  /** Stats helper */
  function getStats() {
    const issues = getAll();
    return {
      total:      issues.length,
      pending:    issues.filter(i => i.status === 'Pending').length,
      inProgress: issues.filter(i => i.status === 'In Progress').length,
      resolved:   issues.filter(i => i.status === 'Resolved').length,
    };
  }

  /** Seed demo data if store is empty */
  function seedIfEmpty() {
    if (getAll().length > 0) return;
    const demos = [
      {
        id: 'demo-1',
        title: 'Large pothole on MG Road',
        description: 'A deep pothole near the junction causing damage to vehicles. Has been there for over two weeks now.',
        category: 'Pothole',
        image: '',
        location: '12.9716° N, 77.5946° E',
        status: 'In Progress',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'demo-2',
        title: 'Overflowing garbage bins at Park Street',
        description: 'The municipal bins near the park entrance have not been cleared for 5 days. Causing unhygienic conditions.',
        category: 'Garbage',
        image: '',
        location: '13.0025° N, 77.5872° E',
        status: 'Pending',
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'demo-3',
        title: 'Street light out on Brigade Road',
        description: 'Three consecutive street lights are not working, making it unsafe for pedestrians at night.',
        category: 'Streetlight',
        image: '',
        location: '12.9741° N, 77.6073° E',
        status: 'Resolved',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'demo-4',
        title: 'Blocked drainage causing flooding',
        description: 'Storm drain blocked with debris causing the road to flood during rain. Vehicles have been getting stuck.',
        category: 'Drainage',
        image: '',
        location: '12.9783° N, 77.6408° E',
        status: 'Pending',
        date: new Date(Date.now() - 86400000 * 0.5).toISOString(),
      },
    ];
    localStorage.setItem(KEY, JSON.stringify(demos));
  }

  return { getAll, getById, save, update, remove, getStats, seedIfEmpty };
})();
