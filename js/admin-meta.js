// Optional admin metadata helper
async function fetchAdminMeta() {
  try {
    const res = await fetch('/api/admin-meta');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to load admin metadata', err);
    return null;
  }
}
