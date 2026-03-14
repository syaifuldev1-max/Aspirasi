// Laporan & Export Page
import { api, getAuth, renderLayout, formatRupiah, bindLayoutEvents } from '../main.js';

export async function renderLaporan(container) {
  const { user } = getAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const year = new Date().getFullYear();

  // Show loading spinner immediately
  container.innerHTML = renderLayout('Laporan', '📊', `
    <div class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Memuat data laporan...</p>
    </div>
  `);
  bindLayoutEvents();

  // Fetch data in background
  let summary = {}, comparison = [], byDprd = [];
  try {
    const [sumRes, compRes, dprdRes] = await Promise.all([
      api(`/dashboard/summary?fiscal_year=${year}`),
      api(`/dashboard/chart/comparison?fiscal_year=${year}`),
      api(`/dashboard/chart/by-dprd?fiscal_year=${year}`)
    ]);
    if (sumRes?.success) summary = sumRes.data;
    if (compRes?.success) comparison = compRes.data;
    if (dprdRes?.success) byDprd = dprdRes.data;
  } catch (e) {}

  const penetapan = comparison.find(c => c.type === 'penetapan') || { count: 0, budget: 0 };
  const perubahan = comparison.find(c => c.type === 'perubahan') || { count: 0, budget: 0 };
  const totalCount = (penetapan.count || 0) + (perubahan.count || 0);
  const penetapanPct = totalCount > 0 ? Math.round((penetapan.count / totalCount) * 100) : 0;
  const perubahanPct = 100 - penetapanPct;

  // DPRD comparison
  const maxBudget = Math.max(...byDprd.map(d => d.budget), 1);
  const dprdBars = byDprd.map(d => `
    <div style="margin-bottom:16px;">
      <div class="flex-between text-sm" style="margin-bottom:4px;">
        <span style="font-weight:700;">${d.name}</span>
        <span style="font-weight:600;">${formatRupiah(d.budget)}</span>
      </div>
      <div style="background:var(--primary-surface);border-radius:6px;height:28px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,var(--primary),var(--primary-light));height:100%;border-radius:6px;width:${(d.budget / maxBudget) * 100}%;transition:width 1s ease;display:flex;align-items:center;padding-left:8px;">
          <span style="color:#fff;font-size:0.72rem;font-weight:600;">${d.count} aspirasi</span>
        </div>
      </div>
    </div>
  `).join('');

  const content = `
    <div class="flex-between mb-md">
      <h3>📊 Laporan Tahun Anggaran ${year}</h3>
      <div class="flex gap-sm">
        <a href="/api/export/excel?fiscal_year=${year}" target="_blank" class="btn btn-primary btn-sm">📥 Download Excel</a>
        <a href="/api/export/pdf?fiscal_year=${year}" target="_blank" class="btn btn-gold btn-sm">📥 Download PDF</a>
      </div>
    </div>

    <div class="summary-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="card summary-card">
        <div class="card-icon blue">📋</div>
        <div class="card-value">${summary.totalAspirasi || 0}</div>
        <div class="card-label">Total Aspirasi</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon gold">💰</div>
        <div class="card-value">${formatRupiah(summary.totalBudget || 0)}</div>
        <div class="card-label">Total Anggaran</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon green">📊</div>
        <div class="card-value">${penetapanPct}% / ${perubahanPct}%</div>
        <div class="card-label">Penetapan vs Perubahan</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:${isSuperAdmin ? '1fr 1fr' : '1fr'};gap:20px;">
      <div class="card">
        <h3 class="mb-md">📊 Ringkasan per Anggota DPRD</h3>
        ${dprdBars || '<p class="text-secondary">Belum ada data</p>'}
        <div style="margin-top:20px;padding-top:16px;border-top:2px solid var(--primary-surface);">
          <div class="flex-between">
            <span style="font-weight:700;font-size:1rem;">TOTAL KESELURUHAN</span>
            <span style="font-weight:700;font-size:1.1rem;color:var(--primary);">${formatRupiah(summary.totalBudget || 0)}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-md">📊 Perbandingan Tipe Aspirasi</h3>

        <div style="margin-bottom:20px;">
          <div class="flex-between text-sm" style="margin-bottom:6px;">
            <span>🟢 Penetapan (Murni)</span>
            <span style="font-weight:700;">${penetapan.count} usulan (${penetapanPct}%)</span>
          </div>
          <div style="background:#D1FAE5;border-radius:6px;height:24px;overflow:hidden;">
            <div style="background:var(--accent-green);height:100%;border-radius:6px;width:${penetapanPct}%;transition:width 1s ease;"></div>
          </div>
          <div class="text-xs text-secondary mt-sm">Anggaran: ${formatRupiah(penetapan.budget)}</div>
        </div>

        <div>
          <div class="flex-between text-sm" style="margin-bottom:6px;">
            <span>🟠 Perubahan (P-APBD)</span>
            <span style="font-weight:700;">${perubahan.count} usulan (${perubahanPct}%)</span>
          </div>
          <div style="background:#FFEDD5;border-radius:6px;height:24px;overflow:hidden;">
            <div style="background:var(--accent-orange);height:100%;border-radius:6px;width:${perubahanPct}%;transition:width 1s ease;"></div>
          </div>
          <div class="text-xs text-secondary mt-sm">Anggaran: ${formatRupiah(perubahan.budget)}</div>
        </div>

        <div style="margin-top:24px;display:flex;border-radius:8px;overflow:hidden;height:32px;">
          <div style="background:var(--accent-green);width:${penetapanPct}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-weight:700;">${penetapanPct}%</div>
          <div style="background:var(--accent-orange);width:${perubahanPct}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-weight:700;">${perubahanPct}%</div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = renderLayout('Laporan', '📊', content);
  bindLayoutEvents();
}
