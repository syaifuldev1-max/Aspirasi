// Input Aspirasi Page — with Usulan/Description field
import { api, getAuth, renderLayout, showToast, navigate, bindLayoutEvents } from '../main.js';

export async function renderInputAspirasi(container) {
  const { user } = getAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  let members = [];
  if (isSuperAdmin) {
    try {
      const res = await api('/dprd-members');
      if (res?.success) members = res.data;
    } catch (e) {}
  }

  const content = `
    <div class="card" style="max-width:720px;">
      <h3 class="mb-md">📝 Form Aspirasi Baru</h3>

      <form id="aspirasiForm" enctype="multipart/form-data">
        ${isSuperAdmin ? `
          <div class="form-group">
            <label class="form-label">Anggota DPRD Tujuan *</label>
            <select class="form-select" id="dprdMemberId" required>
              <option value="">Pilih Anggota DPRD...</option>
              ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
          </div>
        ` : ''}

        <div class="form-group">
          <label class="form-label">Tipe Aspirasi *</label>
          <div class="toggle-group" id="typeToggle">
            <div class="toggle-card active-penetapan" data-type="penetapan" id="togglePenetapan">
              <div style="font-size:1.5rem;margin-bottom:6px;">🟢</div>
              <div style="font-weight:700;">PENETAPAN</div>
              <div class="text-xs text-secondary">(Murni)</div>
            </div>
            <div class="toggle-card" data-type="perubahan" id="togglePerubahan">
              <div style="font-size:1.5rem;margin-bottom:6px;">🟠</div>
              <div style="font-weight:700;">PERUBAHAN</div>
              <div class="text-xs text-secondary">(P-APBD)</div>
            </div>
          </div>
          <input type="hidden" id="aspirasiType" value="penetapan">
        </div>

        <div class="form-group">
          <label class="form-label">Nama Pengusul *</label>
          <input type="text" class="form-input" id="proposerName" placeholder="Masukkan nama lengkap pengusul" required>
        </div>

        <div class="form-group">
          <label class="form-label">No. HP (WhatsApp)</label>
          <input type="tel" class="form-input" id="proposerPhone" placeholder="+62 812-xxxx-xxxx">
        </div>

        <div class="form-group">
          <label class="form-label">Alamat Lengkap</label>
          <textarea class="form-textarea" id="proposerAddress" placeholder="Masukkan alamat lengkap pengusul"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">📄 Isi Usulan / Deskripsi Aspirasi *</label>
          <textarea class="form-textarea" id="aspirasiDescription" rows="4" placeholder="Jelaskan secara detail isi usulan aspirasi, misalnya: Pembangunan jalan desa sepanjang 2 km dari Dusun A ke Dusun B untuk memperlancar akses ekonomi warga..." required style="min-height:120px;"></textarea>
          <p class="text-sm text-secondary mt-sm">Tuliskan deskripsi lengkap mengenai usulan yang diajukan</p>
        </div>

        <div class="form-group">
          <label class="form-label">Foto Lokasi</label>
          <div class="upload-area" id="uploadArea">
            <div class="icon">📷</div>
            <p style="font-weight:600;">Klik untuk Upload Foto</p>
            <p class="text-sm text-secondary">atau Drag & Drop di sini (Maks 5 foto, 5MB/foto)</p>
          </div>
          <input type="file" id="photoInput" multiple accept="image/jpeg,image/png,image/webp" style="display:none;">
          <div id="photoPreview" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;"></div>
        </div>

        <div class="form-group">
          <label class="form-label">Estimasi Anggaran (Rp) *</label>
          <input type="text" class="form-input" id="budgetAmount" placeholder="1.000.000.000" required>
          <p class="text-sm text-secondary mt-sm" id="budgetTerbilang"></p>
        </div>

        <div id="formError" class="form-error" style="display:none;margin-bottom:12px;"></div>

        <div class="flex gap-md" style="margin-top:24px;">
          <button type="button" class="btn btn-secondary" onclick="window.location.hash='/'">❌ Batal</button>
          <button type="submit" class="btn btn-primary btn-lg" id="submitBtn">💾 Simpan Aspirasi</button>
        </div>
      </form>
    </div>
  `;

  container.innerHTML = renderLayout('Input Aspirasi', '➕', content);
  bindLayoutEvents();

  // Type toggle
  const togglePenetapan = document.getElementById('togglePenetapan');
  const togglePerubahan = document.getElementById('togglePerubahan');
  const typeInput = document.getElementById('aspirasiType');

  togglePenetapan.addEventListener('click', () => {
    typeInput.value = 'penetapan';
    togglePenetapan.className = 'toggle-card active-penetapan';
    togglePerubahan.className = 'toggle-card';
  });

  togglePerubahan.addEventListener('click', () => {
    typeInput.value = 'perubahan';
    togglePerubahan.className = 'toggle-card active-perubahan';
    togglePenetapan.className = 'toggle-card';
  });

  // Photo upload
  const uploadArea = document.getElementById('uploadArea');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  let selectedFiles = [];

  uploadArea.addEventListener('click', () => photoInput.click());
  uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--primary-light)'; });
  uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = ''; });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    handleFiles(e.dataTransfer.files);
  });

  photoInput.addEventListener('change', () => handleFiles(photoInput.files));

  function handleFiles(files) {
    for (const file of files) {
      if (selectedFiles.length >= 5) break;
      if (file.size > 5 * 1024 * 1024) { showToast('File terlalu besar (maks 5MB)', 'error'); continue; }
      selectedFiles.push(file);
    }
    renderPreview();
  }

  function renderPreview() {
    photoPreview.innerHTML = selectedFiles.map((f, i) => `
      <div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid var(--primary-surface);">
        <img src="${URL.createObjectURL(f)}" style="width:100%;height:100%;object-fit:cover;">
        <button type="button" data-remove="${i}" style="position:absolute;top:2px;right:2px;background:var(--danger);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:10px;cursor:pointer;">✕</button>
      </div>
    `).join('');

    document.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedFiles.splice(parseInt(btn.dataset.remove), 1);
        renderPreview();
      });
    });
  }

  // Budget auto-format
  const budgetInput = document.getElementById('budgetAmount');
  budgetInput.addEventListener('input', () => {
    let val = budgetInput.value.replace(/\D/g, '');
    budgetInput.value = val ? Number(val).toLocaleString('id-ID') : '';
    const num = parseInt(val);
    document.getElementById('budgetTerbilang').textContent = num > 0 ? `≈ Rp ${Number(num).toLocaleString('id-ID')}` : '';
  });

  // Form submit
  document.getElementById('aspirasiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formError = document.getElementById('formError');
    const submitBtn = document.getElementById('submitBtn');
    formError.style.display = 'none';

    const formData = new FormData();
    formData.append('type', typeInput.value);
    formData.append('proposer_name', document.getElementById('proposerName').value.trim());
    formData.append('proposer_phone', document.getElementById('proposerPhone').value.trim());
    formData.append('proposer_address', document.getElementById('proposerAddress').value.trim());
    formData.append('description', document.getElementById('aspirasiDescription').value.trim());
    formData.append('budget_amount', document.getElementById('budgetAmount').value.replace(/\D/g, ''));

    if (isSuperAdmin) {
      formData.append('dprd_member_id', document.getElementById('dprdMemberId').value);
    }

    selectedFiles.forEach(f => formData.append('photos', f));

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Menyimpan...';

    try {
      const { token } = getAuth();
      const res = await fetch('/api/aspirasi', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();

      if (result?.success) {
        showToast(`Aspirasi ${result.data.reference_no} berhasil disimpan! ✅`);
        navigate('/daftar');
      } else {
        formError.textContent = result?.error?.message || 'Gagal menyimpan';
        formError.style.display = 'block';
      }
    } catch (err) {
      formError.textContent = 'Tidak dapat terhubung ke server';
      formError.style.display = 'block';
    }

    submitBtn.disabled = false;
    submitBtn.textContent = '💾 Simpan Aspirasi';
  });
}
