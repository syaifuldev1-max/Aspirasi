// Dashboard Page
import { api, getAuth, renderLayout, formatRupiah, formatRupiahCompact, bindLayoutEvents } from '../main.js';

export async function renderDashboard(container) {
  const { user } = getAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const year = new Date().getFullYear();

  // Fetch data
  let summary = {}, monthly = [], aspirasi = [];
  try {
    const [sumRes, monthRes, aspRes] = await Promise.all([
      api(`/dashboard/summary?fiscal_year=${year}`),
      api(`/dashboard/chart/monthly?fiscal_year=${year}`),
      api(`/aspirasi?limit=5&sort=created_at&order=desc`)
    ]);
    if (sumRes?.success) summary = sumRes.data;
    if (monthRes?.success) monthly = monthRes.data;
    if (aspRes?.success) aspirasi = aspRes.data;
  } catch (e) {}

  // Build DPRD comparison for super admin
  let dprdComparisonHtml = '';
  if (isSuperAdmin && summary.byDprd) {
    const maxBudget = Math.max(...summary.byDprd.map(d => d.budget), 1);
    dprdComparisonHtml = `
      <div class="card mt-md">
        <h3 class="mb-md">📊 Perbandingan Anggaran per Anggota DPRD</h3>
        ${summary.byDprd.map(d => `
          <div style="margin-bottom:14px;">
            <div class="flex-between text-sm" style="margin-bottom:4px;">
              <span style="font-weight:600;">${d.name}</span>
              <span>${formatRupiah(d.budget)}</span>
            </div>
            <div style="background:var(--primary-surface);border-radius:6px;height:24px;overflow:hidden;">
              <div style="background:linear-gradient(90deg,var(--primary),var(--primary-light));height:100%;border-radius:6px;width:${(d.budget / maxBudget) * 100}%;transition:width 1s ease;"></div>
            </div>
            <div class="text-xs text-secondary" style="margin-top:2px;">${d.count} aspirasi · Penetapan: ${d.penetapanCount || 0} · Perubahan: ${d.perubahanCount || 0}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Monthly chart (simple bar chart with CSS)
  const maxMonth = Math.max(...monthly.map(m => m.budget), 1);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const chartBars = monthly.map(m => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
      <span class="text-xs">${m.count > 0 ? formatRupiah(m.budget) : ''}</span>
      <div style="width:100%;max-width:40px;background:var(--primary-surface);border-radius:4px 4px 0 0;height:200px;display:flex;align-items:flex-end;">
        <div style="width:100%;background:linear-gradient(180deg,var(--primary-light),var(--primary));border-radius:4px 4px 0 0;height:${m.budget > 0 ? Math.max((m.budget / maxMonth) * 200, 8) : 0}px;transition:height 1s ease;"></div>
      </div>
      <span class="text-xs text-secondary">${monthNames[m.month - 1]}</span>
    </div>
  `).join('');

  // Recent aspirasi table
  const tableRows = aspirasi.length > 0 ? aspirasi.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${a.proposer_name}</strong></td>
      ${isSuperAdmin ? `<td>${a.dprd_name || '-'}</td>` : ''}
      <td><span class="badge badge-${a.type}">${a.type === 'penetapan' ? '🟢 Penetapan' : '🟠 Perubahan'}</span></td>
      <td>${formatRupiah(a.budget_amount)}</td>
      <td><span class="badge badge-${a.status}">${a.status}</span></td>
      <td class="text-secondary text-sm">${new Date(a.created_at).toLocaleDateString('id-ID')}</td>
    </tr>
  `).join('') : `<tr><td colspan="${isSuperAdmin ? 7 : 6}" style="text-align:center;padding:30px;">Belum ada data aspirasi</td></tr>`;

  const pageTitle = isSuperAdmin ? 'Super Admin Dashboard' : `Dashboard — ${user?.dprdMember?.name || ''}`;
  const icon = isSuperAdmin ? '👑' : '🏠';

  const content = `
    <div class="summary-grid">
      <div class="card summary-card">
        <div class="card-icon blue">📋</div>
        <div class="card-value">${summary.totalAspirasi || 0}</div>
        <div class="card-label">Total Aspirasi</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon gold">💰</div>
        <div class="card-value">${formatRupiahCompact(summary.totalBudget || 0)}</div>
        <div class="card-label">Total Anggaran</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon green">🟢</div>
        <div class="card-value">${summary.penetapanCount || 0}</div>
        <div class="card-label">Penetapan (Murni)</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon orange">🟠</div>
        <div class="card-value">${summary.perubahanCount || 0}</div>
        <div class="card-label">Perubahan (P-APBD)</div>
      </div>
    </div>

    ${dprdComparisonHtml}

    <div class="card mt-md">
      <h3 class="mb-md">📊 Anggaran per Bulan — ${year}</h3>
      <div style="display:flex;align-items:flex-end;gap:4px;min-height:260px;padding-top:20px;">
        ${chartBars}
      </div>
    </div>

    <div class="card mt-md">
      <h3 class="mb-md">📋 Aspirasi Terbaru</h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Pengusul</th>
              ${isSuperAdmin ? '<th>DPRD</th>' : ''}
              <th>Tipe</th>
              <th>Anggaran</th>
              <th>Status</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = renderLayout(pageTitle, icon, content);
  bindLayoutEvents();
}
