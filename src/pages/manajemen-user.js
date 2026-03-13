// Manajemen User Page — for Super Admin and Admin DPRD
import { api, getAuth, renderLayout, showToast, bindLayoutEvents } from '../main.js';

export async function renderManajemenUser(container) {
  const { user } = getAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  let users = [];
  let members = [];

  async function loadData() {
    try {
      const [usersRes, membersRes] = await Promise.all([
        api('/users'),
        api('/dprd-members')
      ]);
      if (usersRes?.success) users = usersRes.data;
      if (membersRes?.success) members = membersRes.data;
    } catch (e) {}
  }

  async function render() {
    await loadData();

    const roleLabel = (role) => {
      if (role === 'superadmin') return '<span class="badge badge-superadmin">👑 Super Admin</span>';
      if (role === 'admin') return '<span class="badge badge-draft">🏠 Admin</span>';
      return '<span class="badge badge-verified">📝 Aspirator</span>';
    };

    const userRows = users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td><strong>${u.username}</strong></td>
        <td>${u.full_name}</td>
        <td>${roleLabel(u.role)}</td>
        <td>${u.dprd_name || '-'}</td>
        <td>
          ${u.locked_until ? '<span class="badge badge-rejected">🔒 Terkunci</span>' : '<span class="badge badge-verified">✅ Aktif</span>'}
        </td>
        <td>
          <div class="flex gap-sm">
            ${u.locked_until ? `<button class="btn btn-sm btn-secondary" data-unlock-id="${u.id}">🔓</button>` : ''}
            <button class="btn btn-sm btn-secondary" data-reset-id="${u.id}">🔑</button>
            ${u.id !== user.id ? `<button class="btn btn-sm btn-danger" data-delete-user-id="${u.id}">🗑️</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    // Role options depend on user role
    const roleOptions = isSuperAdmin
      ? `<option value="admin">🏠 Admin DPRD</option>
         <option value="aspirator">📝 Aspirator</option>
         <option value="superadmin">👑 Super Admin</option>`
      : `<option value="aspirator">📝 Aspirator</option>`;

    const content = `
      <div class="flex-between mb-md">
        <h3>👥 Total: ${users.length} users</h3>
        <button class="btn btn-primary" id="btnAddUser">➕ Tambah User</button>
      </div>

      <div class="card" style="padding:0;overflow:hidden;" id="userTableCard">
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Nama Lengkap</th>
                <th>Role</th>
                <th>DPRD</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>${userRows}</tbody>
          </table>
        </div>
      </div>

      <!-- Add User Modal -->
      <div id="addUserModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:480px;margin:20px;animation:slideUp 0.3s ease;">
          <h3 class="mb-md">➕ Tambah User Baru</h3>
          <form id="addUserForm">
            <div class="form-group">
              <label class="form-label">Username *</label>
              <input type="text" class="form-input" id="newUsername" placeholder="username" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password *</label>
              <input type="password" class="form-input" id="newPassword" placeholder="Min. 6 karakter" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Nama Lengkap *</label>
              <input type="text" class="form-input" id="newFullName" placeholder="Nama lengkap" required>
            </div>
            <div class="form-group">
              <label class="form-label">Role *</label>
              <select class="form-select" id="newRole" required>
                ${roleOptions}
              </select>
            </div>
            ${isSuperAdmin ? `
              <div class="form-group" id="newDprdGroup">
                <label class="form-label">Anggota DPRD</label>
                <select class="form-select" id="newDprdMemberId">
                  <option value="">Pilih DPRD...</option>
                  ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                </select>
              </div>
            ` : `
              <input type="hidden" id="newDprdMemberId" value="${user?.dprdMember?.id || ''}">
            `}
            <div id="addUserError" class="form-error" style="display:none;margin-bottom:12px;"></div>
            <div class="flex gap-md">
              <button type="button" class="btn btn-secondary" id="cancelAddUser">❌ Batal</button>
              <button type="submit" class="btn btn-primary" id="submitAddUser">💾 Simpan</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div id="resetPwModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:400px;margin:20px;animation:slideUp 0.3s ease;">
          <h3 class="mb-md">🔑 Reset Password</h3>
          <form id="resetPwForm">
            <input type="hidden" id="resetPwUserId">
            <div class="form-group">
              <label class="form-label">Password Baru *</label>
              <input type="password" class="form-input" id="resetPwValue" placeholder="Min. 6 karakter" required minlength="6">
            </div>
            <div id="resetPwError" class="form-error" style="display:none;margin-bottom:12px;"></div>
            <div class="flex gap-md">
              <button type="button" class="btn btn-secondary" id="cancelResetPw">❌ Batal</button>
              <button type="submit" class="btn btn-primary">💾 Reset</button>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = renderLayout('Manajemen User', '👥', content);
    bindLayoutEvents();

    // --- Event delegation on table ---
    const tableCard = document.getElementById('userTableCard');
    if (tableCard) {
      tableCard.addEventListener('click', async (e) => {
        // Delete user
        const deleteBtn = e.target.closest('[data-delete-user-id]');
        if (deleteBtn) {
          const id = deleteBtn.dataset.deleteUserId;
          if (!confirm('Yakin ingin menghapus user ini?')) return;
          try {
            const res = await api(`/users/${id}`, { method: 'DELETE' });
            if (res?.success) { showToast('User berhasil dihapus ✅'); await render(); }
            else showToast(res?.error?.message || 'Gagal', 'error');
          } catch (err) { showToast('Gagal menghapus', 'error'); }
          return;
        }

        // Unlock user
        const unlockBtn = e.target.closest('[data-unlock-id]');
        if (unlockBtn) {
          const id = unlockBtn.dataset.unlockId;
          try {
            const res = await api(`/users/${id}/unlock`, { method: 'PATCH' });
            if (res?.success) { showToast('Akun berhasil di-unlock ✅'); await render(); }
          } catch (err) { showToast('Gagal unlock', 'error'); }
          return;
        }

        // Reset password — open modal
        const resetBtn = e.target.closest('[data-reset-id]');
        if (resetBtn) {
          const id = resetBtn.dataset.resetId;
          document.getElementById('resetPwUserId').value = id;
          document.getElementById('resetPwValue').value = '';
          document.getElementById('resetPwError').style.display = 'none';
          showModal('resetPwModal');
          return;
        }
      });
    }

    // --- Modal helpers ---
    function showModal(id) {
      const modal = document.getElementById(id);
      if (modal) modal.style.display = 'flex';
    }
    function hideModal(id) {
      const modal = document.getElementById(id);
      if (modal) modal.style.display = 'none';
    }

    const addUserModal = document.getElementById('addUserModal');
    const resetPwModal = document.getElementById('resetPwModal');

    document.getElementById('btnAddUser')?.addEventListener('click', () => {
      document.getElementById('addUserError').style.display = 'none';
      document.getElementById('addUserForm').reset();
      showModal('addUserModal');
    });

    document.getElementById('cancelAddUser')?.addEventListener('click', () => hideModal('addUserModal'));
    document.getElementById('cancelResetPw')?.addEventListener('click', () => hideModal('resetPwModal'));

    addUserModal?.addEventListener('click', (e) => { if (e.target === addUserModal) hideModal('addUserModal'); });
    resetPwModal?.addEventListener('click', (e) => { if (e.target === resetPwModal) hideModal('resetPwModal'); });

    // Toggle DPRD field based on role (superadmin only)
    if (isSuperAdmin) {
      document.getElementById('newRole')?.addEventListener('change', (e) => {
        const dprdGroup = document.getElementById('newDprdGroup');
        if (dprdGroup) dprdGroup.style.display = (e.target.value === 'superadmin') ? 'none' : 'block';
      });
    }

    // Submit new user
    document.getElementById('addUserForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorDiv = document.getElementById('addUserError');
      errorDiv.style.display = 'none';

      const body = {
        username: document.getElementById('newUsername').value.trim(),
        password: document.getElementById('newPassword').value,
        full_name: document.getElementById('newFullName').value.trim(),
        role: document.getElementById('newRole').value,
        dprd_member_id: document.getElementById('newDprdMemberId').value || null
      };

      try {
        const res = await api('/users', { method: 'POST', body: JSON.stringify(body) });
        if (res?.success) {
          showToast('User berhasil dibuat ✅');
          hideModal('addUserModal');
          await render();
        } else {
          errorDiv.textContent = res?.error?.message || 'Gagal membuat user';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.textContent = 'Gagal terhubung ke server';
        errorDiv.style.display = 'block';
      }
    });

    // Submit reset password
    document.getElementById('resetPwForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorDiv = document.getElementById('resetPwError');
      errorDiv.style.display = 'none';

      const userId = document.getElementById('resetPwUserId').value;
      const newPassword = document.getElementById('resetPwValue').value;

      try {
        const res = await api(`/users/${userId}/reset-password`, {
          method: 'PATCH',
          body: JSON.stringify({ new_password: newPassword })
        });
        if (res?.success) {
          showToast('Password berhasil direset ✅');
          hideModal('resetPwModal');
        } else {
          errorDiv.textContent = res?.error?.message || 'Gagal reset password';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.textContent = 'Gagal terhubung ke server';
        errorDiv.style.display = 'block';
      }
    });
  }

  await render();
}
