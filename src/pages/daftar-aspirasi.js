// Daftar Aspirasi Page — with DPRD filter, edit modal, event delegation
import { api, getAuth, renderLayout, formatRupiah, showToast, bindLayoutEvents } from '../main.js';

export async function renderDaftarAspirasi(container) {
  const { user } = getAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  // Fetch DPRD members for filter + edit (super admin only)
  let members = [];
  if (isSuperAdmin) {
    try {
      const res = await api('/dprd-members');
      if (res?.success) members = res.data;
    } catch (e) {}
  }

  let currentPage = 1;
  const limit = 10;
  let filters = { type: '', fiscal_year: '', search: '', status: '', dprd_member_id: '' };

  async function loadData() {
    const params = new URLSearchParams({ page: currentPage, limit });
    if (filters.type) params.set('type', filters.type);
    if (filters.fiscal_year) params.set('fiscal_year', filters.fiscal_year);
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.dprd_member_id) params.set('dprd_member_id', filters.dprd_member_id);

    try {
      const res = await api(`/aspirasi?${params}`);
      if (res?.success) return res;
    } catch (e) {}
    return { data: [], pagination: { total: 0, totalPages: 0 } };
  }

  async function render() {
    const result = await loadData();
    const data = result.data || [];
    const { total, totalPages } = result.pagination || {};

    const tableRows = data.length > 0 ? data.map((a, i) => `
      <tr>
        <td>${(currentPage - 1) * limit + i + 1}</td>
        <td><strong style="font-size:0.82rem;">${a.reference_no}</strong></td>
        <td>${a.proposer_name}</td>
        ${isSuperAdmin ? `<td>${a.dprd_name || '-'}</td>` : ''}
        <td><span class="badge badge-${a.type}">${a.type === 'penetapan' ? '🟢 Penetapan' : '🟠 Perubahan'}</span></td>
        <td style="font-size:0.82rem;">${formatRupiah(a.budget_amount)}</td>
        <td><span class="badge badge-${a.status}">${a.status}</span></td>
        <td class="text-sm text-secondary">${new Date(a.created_at).toLocaleDateString('id-ID')}</td>
        <td>
          <div class="flex gap-sm">
            <button class="btn btn-sm btn-secondary" data-edit-id="${a.id}" title="Edit">✏️</button>
            <button class="btn btn-sm btn-danger" data-delete-id="${a.id}" title="Hapus">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="${isSuperAdmin ? 9 : 8}" style="text-align:center;padding:40px;">
      <div class="empty-state"><div class="icon">📋</div><p>Belum ada data aspirasi</p></div>
    </td></tr>`;

    let pagHtml = '';
    if (totalPages > 1) {
      pagHtml = '<div class="pagination">';
      pagHtml += `<button ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}">‹ Prev</button>`;
      for (let p = 1; p <= totalPages; p++) {
        pagHtml += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
      pagHtml += `<button ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next ›</button>`;
      pagHtml += '</div>';
    }

    const thisYear = new Date().getFullYear();

    const content = `
      <div class="flex-between mb-md">
        <h3>📋 Total: ${total || 0} aspirasi</h3>
        <a href="#/input" class="btn btn-primary">➕ Tambah Baru</a>
      </div>

      <div class="filter-bar">
        <input type="text" class="form-input" id="filterSearch" placeholder="🔍 Cari nama pengusul..." value="${filters.search}">
        ${isSuperAdmin ? `
          <select class="form-select" id="filterDprd">
            <option value="">Semua DPRD</option>
            ${members.map(m => `<option value="${m.id}" ${filters.dprd_member_id == m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
          </select>
        ` : ''}
        <select class="form-select" id="filterType">
          <option value="">Semua Tipe</option>
          <option value="penetapan" ${filters.type === 'penetapan' ? 'selected' : ''}>Penetapan</option>
          <option value="perubahan" ${filters.type === 'perubahan' ? 'selected' : ''}>Perubahan</option>
        </select>
        <select class="form-select" id="filterStatus">
          <option value="">Semua Status</option>
          <option value="draft" ${filters.status === 'draft' ? 'selected' : ''}>Draft</option>
          <option value="verified" ${filters.status === 'verified' ? 'selected' : ''}>Verified</option>
          <option value="rejected" ${filters.status === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
        <select class="form-select" id="filterYear">
          <option value="" ${!filters.fiscal_year ? 'selected' : ''}>Semua Tahun</option>
          <option value="${thisYear}" ${filters.fiscal_year == thisYear ? 'selected' : ''}>${thisYear}</option>
          <option value="${thisYear - 1}" ${filters.fiscal_year == (thisYear - 1) ? 'selected' : ''}>${thisYear - 1}</option>
          <option value="${thisYear - 2}" ${filters.fiscal_year == (thisYear - 2) ? 'selected' : ''}>${thisYear - 2}</option>
        </select>
      </div>

      <div class="card" style="padding:0;overflow:hidden;" id="aspirasiTableCard">
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Referensi</th>
                <th>Pengusul</th>
                ${isSuperAdmin ? '<th>DPRD</th>' : ''}
                <th>Tipe</th>
                <th>Anggaran</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>
      ${pagHtml}

      <!-- Edit Aspirasi Modal -->
      <div id="editAspirasiModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:560px;margin:20px;max-height:90vh;overflow-y:auto;animation:slideUp 0.3s ease;">
          <h3 class="mb-md">✏️ Edit Aspirasi</h3>
          <form id="editAspirasiForm">
            <input type="hidden" id="editId">

            ${isSuperAdmin ? `
              <div class="form-group">
                <label class="form-label">Anggota DPRD</label>
                <select class="form-select" id="editDprdMemberId">
                  ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                </select>
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label">Tipe Aspirasi</label>
              <select class="form-select" id="editType">
                <option value="penetapan">🟢 Penetapan (Murni)</option>
                <option value="perubahan">🟠 Perubahan (P-APBD)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Nama Pengusul *</label>
              <input type="text" class="form-input" id="editProposerName" required>
            </div>

            <div class="form-group">
              <label class="form-label">No. HP</label>
              <input type="text" class="form-input" id="editProposerPhone">
            </div>

            <div class="form-group">
              <label class="form-label">Alamat</label>
              <textarea class="form-textarea" id="editProposerAddress"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Isi Usulan</label>
              <textarea class="form-textarea" id="editDescription" style="min-height:100px;"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Anggaran (Rp)</label>
              <input type="text" class="form-input" id="editBudgetAmount">
            </div>

            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="editStatus">
                <option value="draft">Draft</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div id="editError" class="form-error" style="display:none;margin-bottom:12px;"></div>

            <div class="flex gap-md">
              <button type="button" class="btn btn-secondary" id="cancelEditAspirasi">❌ Batal</button>
              <button type="submit" class="btn btn-primary" id="submitEditAspirasi">💾 Simpan Perubahan</button>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = renderLayout('Daftar Aspirasi', '📋', content);
    bindLayoutEvents();

    // --- Event delegation for edit & delete ---
    const tableCard = document.getElementById('aspirasiTableCard');
    if (tableCard) {
      tableCard.addEventListener('click', async (e) => {
        // --- DELETE ---
        const deleteBtn = e.target.closest('[data-delete-id]');
        if (deleteBtn) {
          const id = deleteBtn.dataset.deleteId;
          if (!confirm('Yakin ingin menghapus aspirasi ini?')) return;
          deleteBtn.disabled = true;
          deleteBtn.textContent = '⏳';
          try {
            const res = await api(`/aspirasi/${id}`, { method: 'DELETE' });
            if (res?.success) {
              showToast('Aspirasi berhasil dihapus ✅');
              await render();
            } else {
              showToast(res?.error?.message || 'Gagal menghapus', 'error');
              deleteBtn.disabled = false;
              deleteBtn.textContent = '🗑️';
            }
          } catch (err) {
            showToast('Gagal menghapus', 'error');
            deleteBtn.disabled = false;
            deleteBtn.textContent = '🗑️';
          }
          return;
        }

        // --- EDIT ---
        const editBtn = e.target.closest('[data-edit-id]');
        if (editBtn) {
          const id = editBtn.dataset.editId;
          editBtn.disabled = true;
          editBtn.textContent = '⏳';

          try {
            const res = await api(`/aspirasi/${id}`);
            if (res?.success) {
              const a = res.data;
              document.getElementById('editId').value = a.id;
              document.getElementById('editType').value = a.type;
              document.getElementById('editProposerName').value = a.proposer_name || '';
              document.getElementById('editProposerPhone').value = a.proposer_phone || '';
              document.getElementById('editProposerAddress').value = a.proposer_address || '';
              document.getElementById('editDescription').value = a.description || '';
              document.getElementById('editBudgetAmount').value = a.budget_amount ? Number(a.budget_amount).toLocaleString('id-ID') : '';
              document.getElementById('editStatus').value = a.status || 'draft';

              if (isSuperAdmin) {
                document.getElementById('editDprdMemberId').value = a.dprd_member_id;
              }

              document.getElementById('editError').style.display = 'none';
              showModal('editAspirasiModal');
            } else {
              showToast('Gagal memuat data', 'error');
            }
          } catch (err) {
            showToast('Gagal memuat data', 'error');
          }

          editBtn.disabled = false;
          editBtn.textContent = '✏️';
          return;
        }
      });
    }

    // --- Modal helpers ---
    function showModal(id) {
      const m = document.getElementById(id);
      if (m) m.style.display = 'flex';
    }
    function hideModal(id) {
      const m = document.getElementById(id);
      if (m) m.style.display = 'none';
    }

    // Edit modal events
    const editModal = document.getElementById('editAspirasiModal');
    document.getElementById('cancelEditAspirasi')?.addEventListener('click', () => hideModal('editAspirasiModal'));
    editModal?.addEventListener('click', (e) => { if (e.target === editModal) hideModal('editAspirasiModal'); });

    // Budget format in edit modal
    const editBudgetInput = document.getElementById('editBudgetAmount');
    editBudgetInput?.addEventListener('input', () => {
      let val = editBudgetInput.value.replace(/\D/g, '');
      editBudgetInput.value = val ? Number(val).toLocaleString('id-ID') : '';
    });

    // Submit edit form
    document.getElementById('editAspirasiForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorDiv = document.getElementById('editError');
      const submitBtn = document.getElementById('submitEditAspirasi');
      errorDiv.style.display = 'none';

      const id = document.getElementById('editId').value;
      const body = {
        type: document.getElementById('editType').value,
        proposer_name: document.getElementById('editProposerName').value.trim(),
        proposer_phone: document.getElementById('editProposerPhone').value.trim(),
        proposer_address: document.getElementById('editProposerAddress').value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        budget_amount: document.getElementById('editBudgetAmount').value.replace(/\D/g, ''),
        status: document.getElementById('editStatus').value
      };

      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Menyimpan...';

      try {
        const res = await api(`/aspirasi/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });

        if (res?.success) {
          showToast('Aspirasi berhasil diperbarui ✅');
          hideModal('editAspirasiModal');
          await render();
        } else {
          errorDiv.textContent = res?.error?.message || 'Gagal menyimpan';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.textContent = 'Gagal terhubung ke server';
        errorDiv.style.display = 'block';
      }

      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Simpan Perubahan';
    });

    // --- Filter bindings ---
    document.getElementById('filterSearch')?.addEventListener('input', debounce((e) => {
      filters.search = e.target.value;
      currentPage = 1;
      render();
    }, 400));

    document.getElementById('filterDprd')?.addEventListener('change', (e) => {
      filters.dprd_member_id = e.target.value; currentPage = 1; render();
    });

    document.getElementById('filterType')?.addEventListener('change', (e) => {
      filters.type = e.target.value; currentPage = 1; render();
    });

    document.getElementById('filterStatus')?.addEventListener('change', (e) => {
      filters.status = e.target.value; currentPage = 1; render();
    });

    document.getElementById('filterYear')?.addEventListener('change', (e) => {
      filters.fiscal_year = e.target.value; currentPage = 1; render();
    });

    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        render();
      });
    });
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  await render();
}
