// Aspirasi DPRD — SPA Router & Entry Point
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderInputAspirasi } from './pages/input-aspirasi.js';
import { renderDaftarAspirasi } from './pages/daftar-aspirasi.js';
import { renderLaporan } from './pages/laporan.js';
import { renderManajemenUser } from './pages/manajemen-user.js';

const app = document.getElementById('app');

// Auth helpers
export function getAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return { token, user };
}

export function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isLoggedIn() {
  return !!getAuth().token;
}

// API helper
export async function api(endpoint, options = {}) {
  const { token } = getAuth();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`/api${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    clearAuth();
    navigate('/login');
    return null;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

// Currency formatter
export function formatRupiah(num) {
  if (!num && num !== 0) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// Compact currency for dashboard cards
export function formatRupiahCompact(num) {
  if (!num && num !== 0) return 'Rp 0';
  const n = Number(num);
  if (n >= 1_000_000_000_000) return 'Rp ' + (n / 1_000_000_000_000).toFixed(1).replace('.0', '') + ' T';
  if (n >= 1_000_000_000) return 'Rp ' + (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1_000_000) return 'Rp ' + (n / 1_000_000).toFixed(0) + ' Jt';
  return 'Rp ' + n.toLocaleString('id-ID');
}

// Toast
export function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Global function to bind sidebar navigation & header events
export function bindLayoutEvents() {
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.nav);
    });
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      navigate('/login');
    });
  }

  const hamburger = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('active');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// Layout
export function renderLayout(pageTitle, icon, content) {
  const { user } = getAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').substring(0, 2) || 'U';

  return `
    <div class="app-layout">
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon" style="background:none;padding:0;overflow:hidden;">
            <img src="/logo-pan.png" alt="PAN" style="width:44px;height:44px;object-fit:contain;border-radius:8px;">
          </div>
          <div class="sidebar-brand-text">
            <h3>Aspirasi DPRD</h3>
            <p>${isSuperAdmin ? '👑 Super Admin' : user?.dprdMember?.name || 'Admin'}</p>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section">Menu Utama</div>
          <a href="#/" class="${pageTitle === 'Dashboard' || pageTitle.includes('Dashboard') ? 'active' : ''}" data-nav="/">
            <span class="nav-icon">${isSuperAdmin ? '👑' : '🏠'}</span> Dashboard
          </a>
          <a href="#/input" class="${pageTitle === 'Input Aspirasi' ? 'active' : ''}" data-nav="/input">
            <span class="nav-icon">➕</span> Input Aspirasi
          </a>
          <a href="#/daftar" class="${pageTitle === 'Daftar Aspirasi' ? 'active' : ''}" data-nav="/daftar">
            <span class="nav-icon">📋</span> Daftar Aspirasi
          </a>
          <a href="#/laporan" class="${pageTitle === 'Laporan' ? 'active' : ''}" data-nav="/laporan">
            <span class="nav-icon">📊</span> Laporan & Export
          </a>
            <div class="sidebar-section">Administrasi</div>
            <a href="#/users" class="${pageTitle === 'Manajemen User' ? 'active' : ''}" data-nav="/users">
              <span class="nav-icon">👥</span> Manajemen User
            </a>
        </nav>
        <div class="sidebar-footer">© 2026 Aspirasi DPRD · PAN</div>
      </aside>
      <div class="main-content">
        <header class="header">
          <div class="header-title">
            <button class="hamburger" id="hamburgerBtn">☰</button>
            <span class="icon">${icon}</span>
            <h2>${pageTitle}</h2>
          </div>
          <div class="header-actions">
            <div class="header-user">
              <div class="avatar">${initials}</div>
              <span class="text-sm">${user?.fullName || 'User'}</span>
            </div>
            <button class="btn btn-logout" id="logoutBtn">🚪 Keluar</button>
          </div>
        </header>
        <div class="page-content">${content}</div>
      </div>
    </div>
  `;
}

// Navigation
export function navigate(path) {
  window.location.hash = path;
}

function router() {
  const hash = window.location.hash.slice(1) || '/';

  if (!isLoggedIn() && hash !== '/login') {
    window.location.hash = '/login';
    return;
  }

  if (isLoggedIn() && hash === '/login') {
    window.location.hash = '/';
    return;
  }

  // Route mapping
  if (hash === '/login') {
    renderLogin(app);
  } else if (hash === '/' || hash === '/dashboard') {
    renderDashboard(app);
  } else if (hash === '/input') {
    renderInputAspirasi(app);
  } else if (hash === '/daftar') {
    renderDaftarAspirasi(app);
  } else if (hash === '/laporan') {
    renderLaporan(app);
  } else if (hash === '/users') {
    renderManajemenUser(app);
  } else {
    renderDashboard(app);
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
