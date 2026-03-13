// Login Page
import { api, setAuth, navigate, showToast } from '../main.js';

export async function renderLogin(container) {
  // Fetch DPRD members for dropdown
  let members = [];
  try {
    const res = await api('/dprd-members');
    if (res?.success) members = res.data;
  } catch (e) { /* server might not be running */ }

  container.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <div class="logo-icon" style="background:none;"><img src="/logo-pan.png" alt="PAN" style="width:54px;height:54px;object-fit:contain;"></div>
          <h1>ASPIRASI DPRD</h1>
          <p>Sistem Manajemen Aspirasi Masyarakat</p>
        </div>

        <div class="login-divider">Masuk sebagai</div>

        <div class="role-selector" id="roleSelector">
          <div class="role-option active" data-role="admin" id="roleAdmin">
            🏠 Admin DPRD
          </div>
          <div class="role-option" data-role="superadmin" id="roleSuperadmin">
            👑 Super Admin
          </div>
        </div>

        <form id="loginForm">
          <div class="form-group" id="dprdGroup">
            <label class="form-label">Anggota DPRD</label>
            <select class="form-select" id="dprdSelect">
              <option value="">Pilih Anggota DPRD...</option>
              ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-input" id="username" placeholder="Masukkan username" autocomplete="username">
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="password" placeholder="Masukkan password" autocomplete="current-password">
          </div>

          <div id="loginError" class="form-error" style="display:none; text-align:center; margin-bottom:12px;"></div>

          <button type="submit" class="btn btn-primary" id="loginBtn">
            🔑 MASUK
          </button>
        </form>

        <div class="login-footer">
          © 2026 Aspirasi DPRD · Partai Amanat Nasional
        </div>
      </div>
    </div>
  `;

  // Role toggle logic
  const roleAdmin = document.getElementById('roleAdmin');
  const roleSuperadmin = document.getElementById('roleSuperadmin');
  const dprdGroup = document.getElementById('dprdGroup');
  const usernameInput = document.getElementById('username');
  let selectedRole = 'admin';

  roleAdmin.addEventListener('click', () => {
    selectedRole = 'admin';
    roleAdmin.className = 'role-option active';
    roleSuperadmin.className = 'role-option';
    dprdGroup.style.display = 'block';
    usernameInput.value = '';
    usernameInput.placeholder = 'Masukkan username';
  });

  roleSuperadmin.addEventListener('click', () => {
    selectedRole = 'superadmin';
    roleSuperadmin.className = 'role-option active-super';
    roleAdmin.className = 'role-option';
    dprdGroup.style.display = 'none';
    usernameInput.value = 'superadmin';
    usernameInput.placeholder = 'superadmin';
  });

  // Login form submit
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      errorDiv.textContent = 'Username dan password wajib diisi';
      errorDiv.style.display = 'block';
      return;
    }

    if (selectedRole === 'admin') {
      const dprdId = document.getElementById('dprdSelect').value;
      if (!dprdId) {
        errorDiv.textContent = 'Pilih anggota DPRD terlebih dahulu';
        errorDiv.style.display = 'block';
        return;
      }
    }

    loginBtn.disabled = true;
    loginBtn.textContent = '⏳ Memproses...';
    errorDiv.style.display = 'none';

    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (result?.success) {
        setAuth(result.data.token, result.data.user);
        showToast('Login berhasil! 🎉');
        navigate('/');
      } else {
        errorDiv.textContent = result?.error?.message || 'Login gagal';
        if (result?.error?.details?.attemptsLeft !== undefined) {
          errorDiv.textContent += ` (${result.error.details.attemptsLeft} percobaan tersisa)`;
        }
        if (result?.error?.details?.lockedUntil) {
          errorDiv.textContent = '🔒 Akun terkunci selama 30 menit';
        }
        errorDiv.style.display = 'block';
      }
    } catch (err) {
      errorDiv.textContent = 'Tidak dapat terhubung ke server';
      errorDiv.style.display = 'block';
    }

    loginBtn.disabled = false;
    loginBtn.textContent = '🔑 MASUK';
  });
}
