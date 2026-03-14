(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const p of t)if(p.type==="childList")for(const a of p.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function o(t){const p={};return t.integrity&&(p.integrity=t.integrity),t.referrerPolicy&&(p.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?p.credentials="include":t.crossOrigin==="anonymous"?p.credentials="omit":p.credentials="same-origin",p}function i(t){if(t.ep)return;t.ep=!0;const p=o(t);fetch(t.href,p)}})();function V(d){d.innerHTML=`
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
              <option value="">Memuat data...</option>
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
  `;const n=document.getElementById("roleAdmin"),o=document.getElementById("roleSuperadmin"),i=document.getElementById("dprdGroup"),t=document.getElementById("username");let p="admin";n.addEventListener("click",()=>{p="admin",n.className="role-option active",o.className="role-option",i.style.display="block",t.value="",t.placeholder="Masukkan username"}),o.addEventListener("click",()=>{p="superadmin",o.className="role-option active-super",n.className="role-option",i.style.display="none",t.value="superadmin",t.placeholder="superadmin"}),document.getElementById("loginForm").addEventListener("submit",async a=>{var g,E,y,$,s;a.preventDefault();const l=document.getElementById("loginError"),c=document.getElementById("loginBtn"),k=document.getElementById("username").value.trim(),m=document.getElementById("password").value;if(!k||!m){l.textContent="Username dan password wajib diisi",l.style.display="block";return}if(p==="admin"&&!document.getElementById("dprdSelect").value){l.textContent="Pilih anggota DPRD terlebih dahulu",l.style.display="block";return}c.disabled=!0,c.textContent="⏳ Memproses...",l.style.display="none";try{const e=await x("/auth/login",{method:"POST",body:JSON.stringify({username:k,password:m})});e!=null&&e.success?(ee(e.data.token,e.data.user),D("Login berhasil! 🎉"),O("/")):(l.textContent=((g=e==null?void 0:e.error)==null?void 0:g.message)||"Login gagal",((y=(E=e==null?void 0:e.error)==null?void 0:E.details)==null?void 0:y.attemptsLeft)!==void 0&&(l.textContent+=` (${e.error.details.attemptsLeft} percobaan tersisa)`),(s=($=e==null?void 0:e.error)==null?void 0:$.details)!=null&&s.lockedUntil&&(l.textContent="🔒 Akun terkunci selama 30 menit"),l.style.display="block")}catch{l.textContent="Tidak dapat terhubung ke server",l.style.display="block"}c.disabled=!1,c.textContent="🔑 MASUK"}),x("/dprd-members").then(a=>{const l=document.getElementById("dprdSelect");l&&(a!=null&&a.success)&&a.data?l.innerHTML='<option value="">Pilih Anggota DPRD...</option>'+a.data.map(c=>`<option value="${c.id}">${c.name}</option>`).join(""):l&&(l.innerHTML='<option value="">Pilih Anggota DPRD...</option>')}).catch(()=>{const a=document.getElementById("dprdSelect");a&&(a.innerHTML='<option value="">Gagal memuat data</option>')})}async function q(d){var s;const{user:n}=N(),o=(n==null?void 0:n.role)==="superadmin",i=new Date().getFullYear();let t={},p=[],a=[];try{const[e,v,h]=await Promise.all([x(`/dashboard/summary?fiscal_year=${i}`),x(`/dashboard/chart/monthly?fiscal_year=${i}`),x("/aspirasi?limit=5&sort=created_at&order=desc")]);e!=null&&e.success&&(t=e.data),v!=null&&v.success&&(p=v.data),h!=null&&h.success&&(a=h.data)}catch{}let l="";if(o&&t.byDprd){const e=Math.max(...t.byDprd.map(v=>v.budget),1);l=`
      <div class="card mt-md">
        <h3 class="mb-md">📊 Perbandingan Anggaran per Anggota DPRD</h3>
        ${t.byDprd.map(v=>`
          <div style="margin-bottom:14px;">
            <div class="flex-between text-sm" style="margin-bottom:4px;">
              <span style="font-weight:600;">${v.name}</span>
              <span>${U(v.budget)}</span>
            </div>
            <div style="background:var(--primary-surface);border-radius:6px;height:24px;overflow:hidden;">
              <div style="background:linear-gradient(90deg,var(--primary),var(--primary-light));height:100%;border-radius:6px;width:${v.budget/e*100}%;transition:width 1s ease;"></div>
            </div>
            <div class="text-xs text-secondary" style="margin-top:2px;">${v.count} aspirasi · Penetapan: ${v.penetapanCount||0} · Perubahan: ${v.perubahanCount||0}</div>
          </div>
        `).join("")}
      </div>
    `}const c=Math.max(...p.map(e=>e.budget),1),k=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"],m=p.map(e=>`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
      <span class="text-xs">${e.count>0?U(e.budget):""}</span>
      <div style="width:100%;max-width:40px;background:var(--primary-surface);border-radius:4px 4px 0 0;height:200px;display:flex;align-items:flex-end;">
        <div style="width:100%;background:linear-gradient(180deg,var(--primary-light),var(--primary));border-radius:4px 4px 0 0;height:${e.budget>0?Math.max(e.budget/c*200,8):0}px;transition:height 1s ease;"></div>
      </div>
      <span class="text-xs text-secondary">${k[e.month-1]}</span>
    </div>
  `).join(""),g=a.length>0?a.map((e,v)=>`
    <tr>
      <td>${v+1}</td>
      <td><strong>${e.proposer_name}</strong></td>
      ${o?`<td>${e.dprd_name||"-"}</td>`:""}
      <td><span class="badge badge-${e.type}">${e.type==="penetapan"?"🟢 Penetapan":"🟠 Perubahan"}</span></td>
      <td>${U(e.budget_amount)}</td>
      <td><span class="badge badge-${e.status}">${e.status}</span></td>
      <td class="text-secondary text-sm">${new Date(e.created_at).toLocaleDateString("id-ID")}</td>
    </tr>
  `).join(""):`<tr><td colspan="${o?7:6}" style="text-align:center;padding:30px;">Belum ada data aspirasi</td></tr>`,E=o?"Super Admin Dashboard":`Dashboard — ${((s=n==null?void 0:n.dprdMember)==null?void 0:s.name)||""}`,y=o?"👑":"🏠",$=`
    <div class="summary-grid">
      <div class="card summary-card">
        <div class="card-icon blue">📋</div>
        <div class="card-value">${t.totalAspirasi||0}</div>
        <div class="card-label">Total Aspirasi</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon gold">💰</div>
        <div class="card-value">${te(t.totalBudget||0)}</div>
        <div class="card-label">Total Anggaran</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon green">🟢</div>
        <div class="card-value">${t.penetapanCount||0}</div>
        <div class="card-label">Penetapan (Murni)</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon orange">🟠</div>
        <div class="card-value">${t.perubahanCount||0}</div>
        <div class="card-label">Perubahan (P-APBD)</div>
      </div>
    </div>

    ${l}

    <div class="card mt-md">
      <h3 class="mb-md">📊 Anggaran per Bulan — ${i}</h3>
      <div style="display:flex;align-items:flex-end;gap:4px;min-height:260px;padding-top:20px;">
        ${m}
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
              ${o?"<th>DPRD</th>":""}
              <th>Tipe</th>
              <th>Anggaran</th>
              <th>Status</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>${g}</tbody>
        </table>
      </div>
    </div>
  `;d.innerHTML=H(E,y,$),G()}async function W(d){const{user:n}=N(),o=(n==null?void 0:n.role)==="superadmin";let i=[];if(o)try{const s=await x("/dprd-members");s!=null&&s.success&&(i=s.data)}catch{}const t=`
    <div class="card" style="max-width:720px;">
      <h3 class="mb-md">📝 Form Aspirasi Baru</h3>

      <form id="aspirasiForm" enctype="multipart/form-data">
        ${o?`
          <div class="form-group">
            <label class="form-label">Anggota DPRD Tujuan *</label>
            <select class="form-select" id="dprdMemberId" required>
              <option value="">Pilih Anggota DPRD...</option>
              ${i.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}
            </select>
          </div>
        `:""}

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
  `;d.innerHTML=H("Input Aspirasi","➕",t),G();const p=document.getElementById("togglePenetapan"),a=document.getElementById("togglePerubahan"),l=document.getElementById("aspirasiType");p.addEventListener("click",()=>{l.value="penetapan",p.className="toggle-card active-penetapan",a.className="toggle-card"}),a.addEventListener("click",()=>{l.value="perubahan",a.className="toggle-card active-perubahan",p.className="toggle-card"});const c=document.getElementById("uploadArea"),k=document.getElementById("photoInput"),m=document.getElementById("photoPreview");let g=[];c.addEventListener("click",()=>k.click()),c.addEventListener("dragover",s=>{s.preventDefault(),c.style.borderColor="var(--primary-light)"}),c.addEventListener("dragleave",()=>{c.style.borderColor=""}),c.addEventListener("drop",s=>{s.preventDefault(),c.style.borderColor="",E(s.dataTransfer.files)}),k.addEventListener("change",()=>E(k.files));function E(s){for(const e of s){if(g.length>=5)break;if(e.size>5*1024*1024){D("File terlalu besar (maks 5MB)","error");continue}g.push(e)}y()}function y(){m.innerHTML=g.map((s,e)=>`
      <div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid var(--primary-surface);">
        <img src="${URL.createObjectURL(s)}" style="width:100%;height:100%;object-fit:cover;">
        <button type="button" data-remove="${e}" style="position:absolute;top:2px;right:2px;background:var(--danger);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:10px;cursor:pointer;">✕</button>
      </div>
    `).join(""),document.querySelectorAll("[data-remove]").forEach(s=>{s.addEventListener("click",()=>{g.splice(parseInt(s.dataset.remove),1),y()})})}const $=document.getElementById("budgetAmount");$.addEventListener("input",()=>{let s=$.value.replace(/\D/g,"");$.value=s?Number(s).toLocaleString("id-ID"):"";const e=parseInt(s);document.getElementById("budgetTerbilang").textContent=e>0?`≈ Rp ${Number(e).toLocaleString("id-ID")}`:""}),document.getElementById("aspirasiForm").addEventListener("submit",async s=>{var R;s.preventDefault();const e=document.getElementById("formError"),v=document.getElementById("submitBtn");e.style.display="none";const h=new FormData;h.append("type",l.value),h.append("proposer_name",document.getElementById("proposerName").value.trim()),h.append("proposer_phone",document.getElementById("proposerPhone").value.trim()),h.append("proposer_address",document.getElementById("proposerAddress").value.trim()),h.append("description",document.getElementById("aspirasiDescription").value.trim()),h.append("budget_amount",document.getElementById("budgetAmount").value.replace(/\D/g,"")),o&&h.append("dprd_member_id",document.getElementById("dprdMemberId").value),g.forEach(_=>h.append("photos",_)),v.disabled=!0,v.textContent="⏳ Menyimpan...";try{const{token:_}=N(),I=await(await fetch("/api/aspirasi",{method:"POST",headers:{Authorization:`Bearer ${_}`},body:h})).json();I!=null&&I.success?(D(`Aspirasi ${I.data.reference_no} berhasil disimpan! ✅`),O("/daftar")):(e.textContent=((R=I==null?void 0:I.error)==null?void 0:R.message)||"Gagal menyimpan",e.style.display="block")}catch{e.textContent="Tidak dapat terhubung ke server",e.style.display="block"}v.disabled=!1,v.textContent="💾 Simpan Aspirasi"})}async function Q(d){const{user:n}=N(),o=(n==null?void 0:n.role)==="superadmin";let i=[];if(o)try{const m=await x("/dprd-members");m!=null&&m.success&&(i=m.data)}catch{}let t=1;const p=10;let a={type:"",fiscal_year:"",search:"",status:"",dprd_member_id:""};async function l(){const m=new URLSearchParams({page:t,limit:p});a.type&&m.set("type",a.type),a.fiscal_year&&m.set("fiscal_year",a.fiscal_year),a.search&&m.set("search",a.search),a.status&&m.set("status",a.status),a.dprd_member_id&&m.set("dprd_member_id",a.dprd_member_id);try{const g=await x(`/aspirasi?${m}`);if(g!=null&&g.success)return g}catch{}return{data:[],pagination:{total:0,totalPages:0}}}async function c(){var u,b,T,S,A,B,L;const m=await l(),g=m.data||[],{total:E,totalPages:y}=m.pagination||{},$=g.length>0?g.map((r,f)=>`
      <tr>
        <td>${(t-1)*p+f+1}</td>
        <td><strong style="font-size:0.82rem;">${r.reference_no}</strong></td>
        <td>${r.proposer_name}</td>
        ${o?`<td>${r.dprd_name||"-"}</td>`:""}
        <td><span class="badge badge-${r.type}">${r.type==="penetapan"?"🟢 Penetapan":"🟠 Perubahan"}</span></td>
        <td style="font-size:0.82rem;">${U(r.budget_amount)}</td>
        <td><span class="badge badge-${r.status}">${r.status}</span></td>
        <td class="text-sm text-secondary">${new Date(r.created_at).toLocaleDateString("id-ID")}</td>
        <td>
          <div class="flex gap-sm">
            <button class="btn btn-sm btn-secondary" data-edit-id="${r.id}" title="Edit">✏️</button>
            <button class="btn btn-sm btn-danger" data-delete-id="${r.id}" title="Hapus">🗑️</button>
          </div>
        </td>
      </tr>
    `).join(""):`<tr><td colspan="${o?9:8}" style="text-align:center;padding:40px;">
      <div class="empty-state"><div class="icon">📋</div><p>Belum ada data aspirasi</p></div>
    </td></tr>`;let s="";if(y>1){s='<div class="pagination">',s+=`<button ${t<=1?"disabled":""} data-page="${t-1}">‹ Prev</button>`;for(let r=1;r<=y;r++)s+=`<button class="${r===t?"active":""}" data-page="${r}">${r}</button>`;s+=`<button ${t>=y?"disabled":""} data-page="${t+1}">Next ›</button>`,s+="</div>"}const e=new Date().getFullYear(),v=`
      <div class="flex-between mb-md">
        <h3>📋 Total: ${E||0} aspirasi</h3>
        <a href="#/input" class="btn btn-primary">➕ Tambah Baru</a>
      </div>

      <div class="filter-bar">
        <input type="text" class="form-input" id="filterSearch" placeholder="🔍 Cari nama pengusul..." value="${a.search}">
        ${o?`
          <select class="form-select" id="filterDprd">
            <option value="">Semua DPRD</option>
            ${i.map(r=>`<option value="${r.id}" ${a.dprd_member_id==r.id?"selected":""}>${r.name}</option>`).join("")}
          </select>
        `:""}
        <select class="form-select" id="filterType">
          <option value="">Semua Tipe</option>
          <option value="penetapan" ${a.type==="penetapan"?"selected":""}>Penetapan</option>
          <option value="perubahan" ${a.type==="perubahan"?"selected":""}>Perubahan</option>
        </select>
        <select class="form-select" id="filterStatus">
          <option value="">Semua Status</option>
          <option value="draft" ${a.status==="draft"?"selected":""}>Draft</option>
          <option value="verified" ${a.status==="verified"?"selected":""}>Verified</option>
          <option value="rejected" ${a.status==="rejected"?"selected":""}>Rejected</option>
        </select>
        <select class="form-select" id="filterYear">
          <option value="" ${a.fiscal_year?"":"selected"}>Semua Tahun</option>
          <option value="${e}" ${a.fiscal_year==e?"selected":""}>${e}</option>
          <option value="${e-1}" ${a.fiscal_year==e-1?"selected":""}>${e-1}</option>
          <option value="${e-2}" ${a.fiscal_year==e-2?"selected":""}>${e-2}</option>
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
                ${o?"<th>DPRD</th>":""}
                <th>Tipe</th>
                <th>Anggaran</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>${$}</tbody>
          </table>
        </div>
      </div>
      ${s}

      <!-- Edit Aspirasi Modal -->
      <div id="editAspirasiModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:560px;margin:20px;max-height:90vh;overflow-y:auto;animation:slideUp 0.3s ease;">
          <h3 class="mb-md">✏️ Edit Aspirasi</h3>
          <form id="editAspirasiForm">
            <input type="hidden" id="editId">

            ${o?`
              <div class="form-group">
                <label class="form-label">Anggota DPRD</label>
                <select class="form-select" id="editDprdMemberId">
                  ${i.map(r=>`<option value="${r.id}">${r.name}</option>`).join("")}
                </select>
              </div>
            `:""}

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
    `;d.innerHTML=H("Daftar Aspirasi","📋",v),G();const h=document.getElementById("aspirasiTableCard");h&&h.addEventListener("click",async r=>{var z;const f=r.target.closest("[data-delete-id]");if(f){const F=f.dataset.deleteId;if(!confirm("Yakin ingin menghapus aspirasi ini?"))return;f.disabled=!0,f.textContent="⏳";try{const P=await x(`/aspirasi/${F}`,{method:"DELETE"});P!=null&&P.success?(D("Aspirasi berhasil dihapus ✅"),await c()):(D(((z=P==null?void 0:P.error)==null?void 0:z.message)||"Gagal menghapus","error"),f.disabled=!1,f.textContent="🗑️")}catch{D("Gagal menghapus","error"),f.disabled=!1,f.textContent="🗑️"}return}const M=r.target.closest("[data-edit-id]");if(M){const F=M.dataset.editId;M.disabled=!0,M.textContent="⏳";try{const P=await x(`/aspirasi/${F}`);if(P!=null&&P.success){const w=P.data;document.getElementById("editId").value=w.id,document.getElementById("editType").value=w.type,document.getElementById("editProposerName").value=w.proposer_name||"",document.getElementById("editProposerPhone").value=w.proposer_phone||"",document.getElementById("editProposerAddress").value=w.proposer_address||"",document.getElementById("editDescription").value=w.description||"",document.getElementById("editBudgetAmount").value=w.budget_amount?Number(w.budget_amount).toLocaleString("id-ID"):"",document.getElementById("editStatus").value=w.status||"draft",o&&(document.getElementById("editDprdMemberId").value=w.dprd_member_id),document.getElementById("editError").style.display="none",R("editAspirasiModal")}else D("Gagal memuat data","error")}catch{D("Gagal memuat data","error")}M.disabled=!1,M.textContent="✏️";return}});function R(r){const f=document.getElementById(r);f&&(f.style.display="flex")}function _(r){const f=document.getElementById(r);f&&(f.style.display="none")}const C=document.getElementById("editAspirasiModal");(u=document.getElementById("cancelEditAspirasi"))==null||u.addEventListener("click",()=>_("editAspirasiModal")),C==null||C.addEventListener("click",r=>{r.target===C&&_("editAspirasiModal")});const I=document.getElementById("editBudgetAmount");I==null||I.addEventListener("input",()=>{let r=I.value.replace(/\D/g,"");I.value=r?Number(r).toLocaleString("id-ID"):""}),(b=document.getElementById("editAspirasiForm"))==null||b.addEventListener("submit",async r=>{var P;r.preventDefault();const f=document.getElementById("editError"),M=document.getElementById("submitEditAspirasi");f.style.display="none";const z=document.getElementById("editId").value,F={type:document.getElementById("editType").value,proposer_name:document.getElementById("editProposerName").value.trim(),proposer_phone:document.getElementById("editProposerPhone").value.trim(),proposer_address:document.getElementById("editProposerAddress").value.trim(),description:document.getElementById("editDescription").value.trim(),budget_amount:document.getElementById("editBudgetAmount").value.replace(/\D/g,""),status:document.getElementById("editStatus").value};M.disabled=!0,M.textContent="⏳ Menyimpan...";try{const w=await x(`/aspirasi/${z}`,{method:"PUT",body:JSON.stringify(F)});w!=null&&w.success?(D("Aspirasi berhasil diperbarui ✅"),_("editAspirasiModal"),await c()):(f.textContent=((P=w==null?void 0:w.error)==null?void 0:P.message)||"Gagal menyimpan",f.style.display="block")}catch{f.textContent="Gagal terhubung ke server",f.style.display="block"}M.disabled=!1,M.textContent="💾 Simpan Perubahan"}),(T=document.getElementById("filterSearch"))==null||T.addEventListener("input",k(r=>{a.search=r.target.value,t=1,c()},400)),(S=document.getElementById("filterDprd"))==null||S.addEventListener("change",r=>{a.dprd_member_id=r.target.value,t=1,c()}),(A=document.getElementById("filterType"))==null||A.addEventListener("change",r=>{a.type=r.target.value,t=1,c()}),(B=document.getElementById("filterStatus"))==null||B.addEventListener("change",r=>{a.status=r.target.value,t=1,c()}),(L=document.getElementById("filterYear"))==null||L.addEventListener("change",r=>{a.fiscal_year=r.target.value,t=1,c()}),document.querySelectorAll("[data-page]").forEach(r=>{r.addEventListener("click",()=>{t=parseInt(r.dataset.page),c()})})}function k(m,g){let E;return(...y)=>{clearTimeout(E),E=setTimeout(()=>m(...y),g)}}await c()}async function X(d){const{user:n}=N(),o=(n==null?void 0:n.role)==="superadmin",i=new Date().getFullYear();let t={},p=[],a=[];try{const[s,e,v]=await Promise.all([x(`/dashboard/summary?fiscal_year=${i}`),x(`/dashboard/chart/comparison?fiscal_year=${i}`),x(`/dashboard/chart/by-dprd?fiscal_year=${i}`)]);s!=null&&s.success&&(t=s.data),e!=null&&e.success&&(p=e.data),v!=null&&v.success&&(a=v.data)}catch{}const l=p.find(s=>s.type==="penetapan")||{count:0,budget:0},c=p.find(s=>s.type==="perubahan")||{count:0,budget:0},k=(l.count||0)+(c.count||0),m=k>0?Math.round(l.count/k*100):0,g=100-m,E=Math.max(...a.map(s=>s.budget),1),y=a.map(s=>`
    <div style="margin-bottom:16px;">
      <div class="flex-between text-sm" style="margin-bottom:4px;">
        <span style="font-weight:700;">${s.name}</span>
        <span style="font-weight:600;">${U(s.budget)}</span>
      </div>
      <div style="background:var(--primary-surface);border-radius:6px;height:28px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,var(--primary),var(--primary-light));height:100%;border-radius:6px;width:${s.budget/E*100}%;transition:width 1s ease;display:flex;align-items:center;padding-left:8px;">
          <span style="color:#fff;font-size:0.72rem;font-weight:600;">${s.count} aspirasi</span>
        </div>
      </div>
    </div>
  `).join(""),$=`
    <div class="flex-between mb-md">
      <h3>📊 Laporan Tahun Anggaran ${i}</h3>
      <div class="flex gap-sm">
        <a href="/api/export/excel?fiscal_year=${i}" target="_blank" class="btn btn-primary btn-sm">📥 Download Excel</a>
        <a href="/api/export/pdf?fiscal_year=${i}" target="_blank" class="btn btn-gold btn-sm">📥 Download PDF</a>
      </div>
    </div>

    <div class="summary-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="card summary-card">
        <div class="card-icon blue">📋</div>
        <div class="card-value">${t.totalAspirasi||0}</div>
        <div class="card-label">Total Aspirasi</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon gold">💰</div>
        <div class="card-value">${U(t.totalBudget||0)}</div>
        <div class="card-label">Total Anggaran</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon green">📊</div>
        <div class="card-value">${m}% / ${g}%</div>
        <div class="card-label">Penetapan vs Perubahan</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:${o?"1fr 1fr":"1fr"};gap:20px;">
      <div class="card">
        <h3 class="mb-md">📊 Ringkasan per Anggota DPRD</h3>
        ${y||'<p class="text-secondary">Belum ada data</p>'}
        <div style="margin-top:20px;padding-top:16px;border-top:2px solid var(--primary-surface);">
          <div class="flex-between">
            <span style="font-weight:700;font-size:1rem;">TOTAL KESELURUHAN</span>
            <span style="font-weight:700;font-size:1.1rem;color:var(--primary);">${U(t.totalBudget||0)}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-md">📊 Perbandingan Tipe Aspirasi</h3>

        <div style="margin-bottom:20px;">
          <div class="flex-between text-sm" style="margin-bottom:6px;">
            <span>🟢 Penetapan (Murni)</span>
            <span style="font-weight:700;">${l.count} usulan (${m}%)</span>
          </div>
          <div style="background:#D1FAE5;border-radius:6px;height:24px;overflow:hidden;">
            <div style="background:var(--accent-green);height:100%;border-radius:6px;width:${m}%;transition:width 1s ease;"></div>
          </div>
          <div class="text-xs text-secondary mt-sm">Anggaran: ${U(l.budget)}</div>
        </div>

        <div>
          <div class="flex-between text-sm" style="margin-bottom:6px;">
            <span>🟠 Perubahan (P-APBD)</span>
            <span style="font-weight:700;">${c.count} usulan (${g}%)</span>
          </div>
          <div style="background:#FFEDD5;border-radius:6px;height:24px;overflow:hidden;">
            <div style="background:var(--accent-orange);height:100%;border-radius:6px;width:${g}%;transition:width 1s ease;"></div>
          </div>
          <div class="text-xs text-secondary mt-sm">Anggaran: ${U(c.budget)}</div>
        </div>

        <div style="margin-top:24px;display:flex;border-radius:8px;overflow:hidden;height:32px;">
          <div style="background:var(--accent-green);width:${m}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-weight:700;">${m}%</div>
          <div style="background:var(--accent-orange);width:${g}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-weight:700;">${g}%</div>
        </div>
      </div>
    </div>
  `;d.innerHTML=H("Laporan","📊",$),G()}async function Z(d){const{user:n}=N(),o=(n==null?void 0:n.role)==="superadmin";let i=[],t=[];async function p(){try{const[l,c]=await Promise.all([x("/users"),x("/dprd-members")]);l!=null&&l.success&&(i=l.data),c!=null&&c.success&&(t=c.data)}catch{}}async function a(){var e,v,h,R,_,C,I;await p();const l=u=>u==="superadmin"?'<span class="badge badge-superadmin">👑 Super Admin</span>':u==="admin"?'<span class="badge badge-draft">🏠 Admin</span>':'<span class="badge badge-verified">📝 Aspirator</span>',c=i.map(u=>`
      <tr>
        <td>${u.id}</td>
        <td><strong>${u.username}</strong></td>
        <td>${u.full_name}</td>
        <td>${l(u.role)}</td>
        <td>${u.dprd_name||"-"}</td>
        <td>
          ${u.locked_until?'<span class="badge badge-rejected">🔒 Terkunci</span>':'<span class="badge badge-verified">✅ Aktif</span>'}
        </td>
        <td>
          <div class="flex gap-sm">
            ${u.locked_until?`<button class="btn btn-sm btn-secondary" data-unlock-id="${u.id}">🔓</button>`:""}
            <button class="btn btn-sm btn-secondary" data-reset-id="${u.id}">🔑</button>
            ${u.id!==n.id?`<button class="btn btn-sm btn-danger" data-delete-user-id="${u.id}">🗑️</button>`:""}
          </div>
        </td>
      </tr>
    `).join(""),k=o?`<option value="admin">🏠 Admin DPRD</option>
         <option value="aspirator">📝 Aspirator</option>
         <option value="superadmin">👑 Super Admin</option>`:'<option value="aspirator">📝 Aspirator</option>',m=`
      <div class="flex-between mb-md">
        <h3>👥 Total: ${i.length} users</h3>
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
            <tbody>${c}</tbody>
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
                ${k}
              </select>
            </div>
            ${o?`
              <div class="form-group" id="newDprdGroup">
                <label class="form-label">Anggota DPRD</label>
                <select class="form-select" id="newDprdMemberId">
                  <option value="">Pilih DPRD...</option>
                  ${t.map(u=>`<option value="${u.id}">${u.name}</option>`).join("")}
                </select>
              </div>
            `:`
              <input type="hidden" id="newDprdMemberId" value="${((e=n==null?void 0:n.dprdMember)==null?void 0:e.id)||""}">
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
    `;d.innerHTML=H("Manajemen User","👥",m),G();const g=document.getElementById("userTableCard");g&&g.addEventListener("click",async u=>{var A;const b=u.target.closest("[data-delete-user-id]");if(b){const B=b.dataset.deleteUserId;if(!confirm("Yakin ingin menghapus user ini?"))return;try{const L=await x(`/users/${B}`,{method:"DELETE"});L!=null&&L.success?(D("User berhasil dihapus ✅"),await a()):D(((A=L==null?void 0:L.error)==null?void 0:A.message)||"Gagal","error")}catch{D("Gagal menghapus","error")}return}const T=u.target.closest("[data-unlock-id]");if(T){const B=T.dataset.unlockId;try{const L=await x(`/users/${B}/unlock`,{method:"PATCH"});L!=null&&L.success&&(D("Akun berhasil di-unlock ✅"),await a())}catch{D("Gagal unlock","error")}return}const S=u.target.closest("[data-reset-id]");if(S){const B=S.dataset.resetId;document.getElementById("resetPwUserId").value=B,document.getElementById("resetPwValue").value="",document.getElementById("resetPwError").style.display="none",E("resetPwModal");return}});function E(u){const b=document.getElementById(u);b&&(b.style.display="flex")}function y(u){const b=document.getElementById(u);b&&(b.style.display="none")}const $=document.getElementById("addUserModal"),s=document.getElementById("resetPwModal");(v=document.getElementById("btnAddUser"))==null||v.addEventListener("click",()=>{document.getElementById("addUserError").style.display="none",document.getElementById("addUserForm").reset(),E("addUserModal")}),(h=document.getElementById("cancelAddUser"))==null||h.addEventListener("click",()=>y("addUserModal")),(R=document.getElementById("cancelResetPw"))==null||R.addEventListener("click",()=>y("resetPwModal")),$==null||$.addEventListener("click",u=>{u.target===$&&y("addUserModal")}),s==null||s.addEventListener("click",u=>{u.target===s&&y("resetPwModal")}),o&&((_=document.getElementById("newRole"))==null||_.addEventListener("change",u=>{const b=document.getElementById("newDprdGroup");b&&(b.style.display=u.target.value==="superadmin"?"none":"block")})),(C=document.getElementById("addUserForm"))==null||C.addEventListener("submit",async u=>{var S;u.preventDefault();const b=document.getElementById("addUserError");b.style.display="none";const T={username:document.getElementById("newUsername").value.trim(),password:document.getElementById("newPassword").value,full_name:document.getElementById("newFullName").value.trim(),role:document.getElementById("newRole").value,dprd_member_id:document.getElementById("newDprdMemberId").value||null};try{const A=await x("/users",{method:"POST",body:JSON.stringify(T)});A!=null&&A.success?(D("User berhasil dibuat ✅"),y("addUserModal"),await a()):(b.textContent=((S=A==null?void 0:A.error)==null?void 0:S.message)||"Gagal membuat user",b.style.display="block")}catch{b.textContent="Gagal terhubung ke server",b.style.display="block"}}),(I=document.getElementById("resetPwForm"))==null||I.addEventListener("submit",async u=>{var A;u.preventDefault();const b=document.getElementById("resetPwError");b.style.display="none";const T=document.getElementById("resetPwUserId").value,S=document.getElementById("resetPwValue").value;try{const B=await x(`/users/${T}/reset-password`,{method:"PATCH",body:JSON.stringify({new_password:S})});B!=null&&B.success?(D("Password berhasil direset ✅"),y("resetPwModal")):(b.textContent=((A=B==null?void 0:B.error)==null?void 0:A.message)||"Gagal reset password",b.style.display="block")}catch{b.textContent="Gagal terhubung ke server",b.style.display="block"}})}await a()}const j=document.getElementById("app");function N(){const d=localStorage.getItem("token"),n=JSON.parse(localStorage.getItem("user")||"null");return{token:d,user:n}}function ee(d,n){localStorage.setItem("token",d),localStorage.setItem("user",JSON.stringify(n))}function Y(){localStorage.removeItem("token"),localStorage.removeItem("user")}function J(){return!!N().token}async function x(d,n={}){const{token:o}=N(),i={...n.headers||{}};o&&(i.Authorization=`Bearer ${o}`),n.body instanceof FormData||(i["Content-Type"]="application/json");const t=await fetch(`/api${d}`,{...n,headers:i});if(t.status===401)return Y(),O("/login"),null;const p=t.headers.get("content-type");return p&&p.includes("application/json")?t.json():t}function U(d){return!d&&d!==0?"Rp 0":"Rp "+Number(d).toLocaleString("id-ID")}function te(d){if(!d&&d!==0)return"Rp 0";const n=Number(d);return n>=1e12?"Rp "+(n/1e12).toFixed(1).replace(".0","")+" T":n>=1e9?"Rp "+(n/1e9).toFixed(1).replace(".0","")+" M":n>=1e6?"Rp "+(n/1e6).toFixed(0)+" Jt":"Rp "+n.toLocaleString("id-ID")}function D(d,n="success"){const o=document.querySelector(".toast");o&&o.remove();const i=document.createElement("div");i.className=`toast toast-${n}`,i.textContent=d,document.body.appendChild(i),setTimeout(()=>i.remove(),3500)}function G(){document.querySelectorAll("[data-nav]").forEach(t=>{t.addEventListener("click",p=>{p.preventDefault(),O(t.dataset.nav)})});const d=document.getElementById("logoutBtn");d&&d.addEventListener("click",()=>{Y(),O("/login")});const n=document.getElementById("hamburgerBtn"),o=document.getElementById("sidebar"),i=document.getElementById("sidebarOverlay");n&&o&&(n.addEventListener("click",()=>{o.classList.toggle("open"),i==null||i.classList.toggle("active")}),i==null||i.addEventListener("click",()=>{o.classList.remove("open"),i.classList.remove("active")}))}function H(d,n,o){var a,l;const{user:i}=N(),t=(i==null?void 0:i.role)==="superadmin",p=((a=i==null?void 0:i.fullName)==null?void 0:a.split(" ").map(c=>c[0]).join("").substring(0,2))||"U";return`
    <div class="app-layout">
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon" style="background:none;padding:0;overflow:hidden;">
            <img src="/logo-pan.png" alt="PAN" style="width:44px;height:44px;object-fit:contain;border-radius:8px;">
          </div>
          <div class="sidebar-brand-text">
            <h3>Aspirasi DPRD</h3>
            <p>${t?"👑 Super Admin":((l=i==null?void 0:i.dprdMember)==null?void 0:l.name)||"Admin"}</p>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section">Menu Utama</div>
          <a href="#/" class="${d==="Dashboard"||d.includes("Dashboard")?"active":""}" data-nav="/">
            <span class="nav-icon">${t?"👑":"🏠"}</span> Dashboard
          </a>
          <a href="#/input" class="${d==="Input Aspirasi"?"active":""}" data-nav="/input">
            <span class="nav-icon">➕</span> Input Aspirasi
          </a>
          <a href="#/daftar" class="${d==="Daftar Aspirasi"?"active":""}" data-nav="/daftar">
            <span class="nav-icon">📋</span> Daftar Aspirasi
          </a>
          <a href="#/laporan" class="${d==="Laporan"?"active":""}" data-nav="/laporan">
            <span class="nav-icon">📊</span> Laporan & Export
          </a>
            <div class="sidebar-section">Administrasi</div>
            <a href="#/users" class="${d==="Manajemen User"?"active":""}" data-nav="/users">
              <span class="nav-icon">👥</span> Manajemen User
            </a>
        </nav>
        <div class="sidebar-footer">© 2026 Aspirasi DPRD · PAN</div>
      </aside>
      <div class="main-content">
        <header class="header">
          <div class="header-title">
            <button class="hamburger" id="hamburgerBtn">☰</button>
            <span class="icon">${n}</span>
            <h2>${d}</h2>
          </div>
          <div class="header-actions">
            <div class="header-user">
              <div class="avatar">${p}</div>
              <span class="text-sm">${(i==null?void 0:i.fullName)||"User"}</span>
            </div>
            <button class="btn btn-logout" id="logoutBtn">🚪 Keluar</button>
          </div>
        </header>
        <div class="page-content">${o}</div>
      </div>
    </div>
  `}function O(d){window.location.hash=d}function K(){const d=window.location.hash.slice(1)||"/";if(!J()&&d!=="/login"){window.location.hash="/login";return}if(J()&&d==="/login"){window.location.hash="/";return}d==="/login"?V(j):d==="/"||d==="/dashboard"?q(j):d==="/input"?W(j):d==="/daftar"?Q(j):d==="/laporan"?X(j):d==="/users"?Z(j):q(j)}window.addEventListener("hashchange",K);window.addEventListener("DOMContentLoaded",K);
