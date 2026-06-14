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
  loadAdminMeta();
  loadAdminData();
  document.getElementById('adminRefreshBtn')?.addEventListener('click', loadAdminData);
}

window.addEventListener('DOMContentLoaded', initAdminConsole);
