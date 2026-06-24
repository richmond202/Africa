async function loadAdminData() {
  const loading = document.getElementById('adminLoading');
  if (loading) loading.classList.remove('hidden');
  try {
    const [startups, events, investors] = await Promise.all([
      fetchAdminData('startups', 120),
      fetchAdminData('events', 80),
      fetchAdminData('investors', 80)
    ]);
    renderAdminKPIs(startups, events, investors);
    renderStartupModeration(startups);
    renderEventManagement(events);
    renderInvestorVerification(investors);
  } catch (error) {
    console.error(error);
    showToast('Unable to load backend data. Please try again later.', 'error');
  }
  if (loading) loading.classList.add('hidden');
}

async function loadAdminMeta() {
  const meta = await fetchAdminMeta();
  if (!meta) return;
  document.getElementById('adminName')?.textContent = meta.name || 'Admin';
  document.getElementById('adminRole')?.textContent = meta.role || 'Administrator';
  document.getElementById('adminAccessMethod')?.textContent = capitalize(meta.accessMethod || 'session');
  document.getElementById('adminSessionTimeout')?.textContent = `${Math.round((meta.sessionTimeout || 0) / 60000)} min`;
  const info = document.getElementById('adminInfo');
  if (info) {
    info.textContent = `${meta.name || 'Admin'} — ${meta.role || 'Administrator'}`;
  }
}

function capitalize(value) {
  return String(value).replace(/\b\w/g, c => c.toUpperCase());
}

async function fetchAdminData(name, limit = 100) {
  const response = await fetch(`/admin-data/${encodeURIComponent(name)}?limit=${encodeURIComponent(limit)}`);
  if (!response.ok) throw new Error('Failed to fetch admin data');
  const json = await response.json();
  return json.data || [];
}

function renderAdminKPIs(startups, events, investors) {
  document.getElementById('adminKpiStartups').textContent = startups.length.toLocaleString();
  document.getElementById('adminKpiPending').textContent = startups.filter(s => s.status === 'pending').length.toLocaleString();
  document.getElementById('adminKpiInvestors').textContent = investors.length.toLocaleString();
  document.getElementById('adminKpiEvents').textContent = events.length.toLocaleString();
}

function renderStartupModeration(startups) {
  const body = document.getElementById('startupModerationBody');
  if (!body) return;
  if (!startups.length) {
    body.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);text-align:center">No startup records found.</td></tr>';
    return;
  }
  body.innerHTML = startups.map(startup => {
    const status = startup.status || 'pending';
    const featured = startup.is_featured ? 'Yes' : 'No';
    return `<tr>
      <td><strong>${startup.name}</strong><br><span class="hint">${startup.category || 'Unknown'}</span></td>
      <td>${startup.stage || 'N/A'}</td>
      <td><span class="status-pill status-${status}">${status}</span></td>
      <td>${featured}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="adminUpdateStartupStatus('${startup.id}','approved')">Approve</button>
        <button class="btn btn-sm btn-ghost" onclick="adminUpdateStartupStatus('${startup.id}','rejected')">Reject</button>
        <button class="btn btn-sm btn-outline" onclick="adminToggleStartupFeatured('${startup.id}', ${startup.is_featured ? 'false' : 'true'})">${startup.is_featured ? 'Unfeature' : 'Feature'}</button>
      </td>
    </tr>`;
  }).join('');
}

function renderEventManagement(events) {
  const body = document.getElementById('eventManagementBody');
  if (!body) return;
  if (!events.length) {
    body.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);text-align:center">No events found.</td></tr>';
    return;
  }
  body.innerHTML = events.map(event => {
    const status = event.status || 'upcoming';
    return `<tr>
      <td><strong>${event.title}</strong></td>
      <td>${new Date(event.date || '').toLocaleDateString('en-US')}</td>
      <td><span class="status-pill status-${status}">${status}</span></td>
      <td>${event.attendees || 0}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="adminUpdateEventStatus('${event.id}','completed')">Mark Complete</button>
        <button class="btn btn-sm btn-ghost" onclick="adminUpdateEventStatus('${event.id}','upcoming')">Mark Upcoming</button>
      </td>
    </tr>`;
  }).join('');
}

function renderInvestorVerification(investors) {
  const body = document.getElementById('investorVerificationBody');
  if (!body) return;
  if (!investors.length) {
    body.innerHTML = '<tr><td colspan="4" style="color:var(--text-muted);text-align:center">No investor profiles found.</td></tr>';
    return;
  }
  body.innerHTML = investors.map(investor => {
    const verified = investor.verified ? 'Yes' : 'No';
    return `<tr>
      <td><strong>${investor.name}</strong><br><span class="hint">${investor.company || 'Independent'}</span></td>
      <td>${investor.type || 'Investor'}</td>
      <td>${verified}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="adminToggleInvestorVerified('${investor.id}', true)">Verify</button>
        <button class="btn btn-sm btn-ghost" onclick="adminToggleInvestorVerified('${investor.id}', false)">Revoke</button>
      </td>
    </tr>`;
  }).join('');
}

async function adminUpdateStartupStatus(id, status) {
  await adminPatch('startups', id, { status });
}

async function adminToggleStartupFeatured(id, value) {
  await adminPatch('startups', id, { is_featured: value });
}

async function adminUpdateEventStatus(id, status) {
  await adminPatch('events', id, { status });
}

async function adminToggleInvestorVerified(id, verified) {
  await adminPatch('investors', id, { verified });
}

async function adminPatch(table, id, payload) {
  try {
    const response = await fetch(`/admin/patch/${encodeURIComponent(table)}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Update failed');
    showToast('Backend record updated.', 'success');
    await loadAdminData();
  } catch (error) {
    console.error(error);
    showToast('Could not update backend record.', 'error');
  }
}

function initAdminConsole() {
  if (!document.body.classList.contains('admin-page')) return;
  // ensure auth + meta before loading large datasets
  fetch('/auth/status').then(r => {
    if (!r.ok) {
      window.location.href = '/login';
      return;
    }
    return r.json();
  }).then(status => {
    if (!status) return;
    loadAdminMeta();
    loadAdminData();
    loadAnalytics();
    loadStats();
  }).catch(() => window.location.href = '/login');
  document.getElementById('adminRefreshBtn')?.addEventListener('click', loadAdminData);
}

// Analytics endpoint
async function loadAnalytics() {
  try {
    const response = await fetch('/api/admin/analytics');
    if (!response.ok) return;
    const data = await response.json();
    displayAnalytics(data.analytics);
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

function displayAnalytics(analytics) {
  const grid = document.getElementById('analyticsGrid');
  if (!grid) return;
  
  const cards = [];
  
  if (analytics.startups) {
    cards.push({ label: 'Total Startups', value: analytics.startups.total, color: '#7c3aed' });
    cards.push({ label: 'Approved', value: analytics.startups.breakdown?.approved || 0, color: '#16a34a' });
    cards.push({ label: 'Pending', value: analytics.startups.breakdown?.pending || 0, color: '#f59e0b' });
    cards.push({ label: 'Featured', value: analytics.startups.breakdown?.featured || 0, color: '#ec4899' });
  }
  
  if (analytics.investors) {
    cards.push({ label: 'Total Investors', value: analytics.investors.total, color: '#0ea5e9' });
    cards.push({ label: 'Verified', value: analytics.investors.breakdown?.verified || 0, color: '#16a34a' });
  }
  
  if (analytics.events) {
    cards.push({ label: 'Total Events', value: analytics.events.total, color: '#8b5cf6' });
    cards.push({ label: 'Upcoming', value: analytics.events.breakdown?.upcoming || 0, color: '#0ea5e9' });
  }
  
  grid.innerHTML = cards.map(card => `
    <div style="background: rgba(${hexToRgb(card.color)}, 0.1); padding: 16px; border-radius: 12px; border-left: 3px solid ${card.color};">
      <p style="color: var(--text-muted); font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${card.label}</p>
      <p style="font-size: 1.8rem; font-weight: 700; margin: 8px 0 0; color: ${card.color};">${card.value.toLocaleString()}</p>
    </div>
  `).join('');
}

async function loadStats() {
  try {
    const response = await fetch('/api/admin/stats');
    if (!response.ok) return;
    const stats = await response.json();
    displayStats(stats);
  } catch (error) {
    console.error('Stats error:', error);
  }
}

function displayStats(stats) {
  const grid = document.getElementById('adminStatsGrid');
  const recent = document.getElementById('recentActionsList');
  if (!grid || !recent) return;

  const statCards = [
    { label: 'Server Uptime', value: `${Math.floor(stats.uptime)}s`, color: '#7c3aed' },
    { label: 'Session Timeout', value: `${Math.round((stats.sessionTimeout || 0) / 60000)} min`, color: '#0ea5e9' },
    { label: 'Admin User', value: stats.adminUser || '—', color: '#16a34a' },
    { label: 'Actions Logged', value: stats.recentActions?.length || 0, color: '#f59e0b' }
  ];

  grid.innerHTML = statCards.map(card => `
    <div style="background: rgba(${hexToRgb(card.color)}, 0.1); padding: 16px; border-radius: 12px; border-left: 3px solid ${card.color};">
      <p style="color: var(--text-muted); font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${card.label}</p>
      <p style="font-size: 1.4rem; font-weight: 700; margin: 8px 0 0; color: ${card.color};">${card.value}</p>
    </div>
  `).join('');

  recent.innerHTML = (stats.recentActions || []).map(action => `
    <div style="padding: 12px; background: rgba(22, 163, 74, 0.08); border-radius: 10px;">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <span style="font-weight:700;">${action.action}</span>
        <span style="color: var(--text-muted); font-size: 12px;">${new Date(action.timestamp).toLocaleString()}</span>
      </div>
      <div style="margin-top:8px; font-size:13px; color:var(--text);">
        ${action.table} • ${action.recordId}<br>
        ${JSON.stringify(action.changes)}
      </div>
    </div>
  `).join('') || '<p style="color: var(--text-muted);">No recent actions found.</p>';
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '124, 58, 237';
}

// Audit log
async function loadAuditLog() {
  try {
    const response = await fetch('/api/admin/audit?limit=50');
    if (!response.ok) {
      showToast('Failed to load audit log', 'error');
      return;
    }
    const data = await response.json();
    displayAuditLog(data.logs);
    document.getElementById('auditLogPanel').classList.remove('hidden');
  } catch (error) {
    console.error('Audit log error:', error);
    showToast('Error loading audit log', 'error');
  }
}

function displayAuditLog(logs) {
  const body = document.getElementById('auditLogBody');
  if (!body) return;
  
  if (!logs.length) {
    body.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No activity recorded yet.</td></tr>';
    return;
  }
  
  body.innerHTML = logs.map(log => `
    <tr>
      <td style="white-space: nowrap;">${new Date(log.timestamp).toLocaleString()}</td>
      <td>${log.admin}</td>
      <td><span class="status-pill" style="background: rgba(124,58,237,0.12); color: #c4b5fd;">${log.action}</span></td>
      <td style="font-weight: 600;">${log.table}</td>
      <td style="font-family: monospace; font-size: 11px;">${log.recordId}</td>
      <td style="font-family: monospace; font-size: 11px; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${JSON.stringify(log.changes).slice(0, 30)}…</td>
    </tr>
  `).join('');
}

// Bulk operations
function toggleBulkOpsPanel() {
  const panel = document.getElementById('bulkOpsPanel');
  if (panel) {
    panel.classList.toggle('hidden');
  }
}

async function executeBulkPatch() {
  const table = document.getElementById('bulkTable')?.value;
  const idsText = document.getElementById('bulkIds')?.value;
  const updatesText = document.getElementById('bulkUpdates')?.value;
  
  if (!table || !idsText || !updatesText) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  const ids = idsText.split(',').map(id => id.trim()).filter(id => id);
  let updates;
  
  try {
    updates = JSON.parse(updatesText);
  } catch (e) {
    showToast('Invalid JSON in Updates field', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/admin/bulk-patch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, ids, updates })
    });
    
    if (!response.ok) throw new Error('Bulk patch failed');
    const result = await response.json();
    
    const resultsDiv = document.getElementById('bulkResults');
    if (resultsDiv) {
      resultsDiv.classList.remove('hidden');
      resultsDiv.innerHTML = `
        <div style="background: rgba(22,163,74,0.12); padding: 16px; border-radius: 8px; color: #4ade80;">
          <p style="margin: 0; font-weight: 600;">✓ Bulk update completed</p>
          <p style="margin: 8px 0 0; font-size: 13px;">Successful: ${result.successful} / ${result.total}</p>
        </div>
      `;
    }
    
    showToast(`Updated ${result.successful} of ${result.total} records`, 'success');
    await loadAdminData();
  } catch (error) {
    console.error('Bulk patch error:', error);
    showToast('Bulk operation failed', 'error');
  }
}

// Global search
function toggleSearchPanel() {
  const panel = document.getElementById('searchPanel');
  if (panel) {
    panel.classList.toggle('hidden');
  }
}

async function performGlobalSearch() {
  const query = document.getElementById('searchQuery')?.value;
  if (!query || !query.trim()) {
    showToast('Enter a search query', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    
    displaySearchResults(data.results);
  } catch (error) {
    console.error('Search error:', error);
    showToast('Search failed', 'error');
  }
}

function displaySearchResults(results) {
  const resultsDiv = document.getElementById('searchResults');
  if (!resultsDiv) return;
  
  let html = '';
  
  for (const [table, records] of Object.entries(results)) {
    if (!records.length) continue;
    
    html += `<div style="margin-bottom: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
      <h3 style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; margin: 0 0 12px; letter-spacing: 0.05em;">${table}</h3>
      <div style="display: grid; gap: 8px;">`;
    
    records.slice(0, 10).forEach(record => {
      const name = record.name || record.title || record.id;
      html += `
        <div style="padding: 10px; background: rgba(124,58,237,0.05); border-radius: 6px; cursor: pointer; hover:background: rgba(124,58,237,0.1);">
          <p style="margin: 0; font-weight: 500; font-size: 13px;">${name}</p>
          <p style="margin: 4px 0 0; font-size: 11px; color: var(--text-muted);">${record.category || record.type || record.company || 'N/A'}</p>
        </div>
      `;
    });
    
    if (records.length > 10) {
      html += `<p style="margin: 12px 0 0; color: var(--text-muted); font-size: 12px;">+ ${records.length - 10} more results</p>`;
    }
    
    html += '</div></div>';
  }
  
  resultsDiv.innerHTML = html || '<p style="color: var(--text-muted); text-align: center;">No results found.</p>';
}

window.addEventListener('DOMContentLoaded', initAdminConsole);
