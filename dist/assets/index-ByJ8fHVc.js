(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const p of e)if(p.type==="childList")for(const d of p.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&s(d)}).observe(document,{childList:!0,subtree:!0});function c(e){const p={};return e.integrity&&(p.integrity=e.integrity),e.referrerPolicy&&(p.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?p.credentials="include":e.crossOrigin==="anonymous"?p.credentials="omit":p.credentials="same-origin",p}function s(e){if(e.ep)return;e.ep=!0;const p=c(e);fetch(e.href,p)}})();async function V(i){let n=[];try{const m=await x("/dprd-members");m!=null&&m.success&&(n=m.data)}catch{}i.innerHTML=`
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
              ${n.map(m=>`<option value="${m.id}">${m.name}</option>`).join("")}
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
  `;const c=document.getElementById("roleAdmin"),s=document.getElementById("roleSuperadmin"),e=document.getElementById("dprdGroup"),p=document.getElementById("username");let d="admin";c.addEventListener("click",()=>{d="admin",c.className="role-option active",s.className="role-option",e.style.display="block",p.value="",p.placeholder="Masukkan username"}),s.addEventListener("click",()=>{d="superadmin",s.className="role-option active-super",c.className="role-option",e.style.display="none",p.value="superadmin",p.placeholder="superadmin"}),document.getElementById("loginForm").addEventListener("submit",async m=>{var $,y,A,t,a;m.preventDefault();const l=document.getElementById("loginError"),E=document.getElementById("loginBtn"),g=document.getElementById("username").value.trim(),v=document.getElementById("password").value;if(!g||!v){l.textContent="Username dan password wajib diisi",l.style.display="block";return}if(d==="admin"&&!document.getElementById("dprdSelect").value){l.textContent="Pilih anggota DPRD terlebih dahulu",l.style.display="block";return}E.disabled=!0,E.textContent="⏳ Memproses...",l.style.display="none";try{const o=await x("/auth/login",{method:"POST",body:JSON.stringify({username:g,password:v})});o!=null&&o.success?(ee(o.data.token,o.data.user),k("Login berhasil! 🎉"),O("/")):(l.textContent=(($=o==null?void 0:o.error)==null?void 0:$.message)||"Login gagal",((A=(y=o==null?void 0:o.error)==null?void 0:y.details)==null?void 0:A.attemptsLeft)!==void 0&&(l.textContent+=` (${o.error.details.attemptsLeft} percobaan tersisa)`),(a=(t=o==null?void 0:o.error)==null?void 0:t.details)!=null&&a.lockedUntil&&(l.textContent="🔒 Akun terkunci selama 30 menit"),l.style.display="block")}catch{l.textContent="Tidak dapat terhubung ke server",l.style.display="block"}E.disabled=!1,E.textContent="🔑 MASUK"})}async function q(i){var t;const{user:n}=N(),c=(n==null?void 0:n.role)==="superadmin",s=new Date().getFullYear();let e={},p=[],d=[];try{const[a,o,h]=await Promise.all([x(`/dashboard/summary?fiscal_year=${s}`),x(`/dashboard/chart/monthly?fiscal_year=${s}`),x("/aspirasi?limit=5&sort=created_at&order=desc")]);a!=null&&a.success&&(e=a.data),o!=null&&o.success&&(p=o.data),h!=null&&h.success&&(d=h.data)}catch{}let m="";if(c&&e.byDprd){const a=Math.max(...e.byDprd.map(o=>o.budget),1);m=`
      <div class="card mt-md">
        <h3 class="mb-md">📊 Perbandingan Anggaran per Anggota DPRD</h3>
        ${e.byDprd.map(o=>`
          <div style="margin-bottom:14px;">
            <div class="flex-between text-sm" style="margin-bottom:4px;">
              <span style="font-weight:600;">${o.name}</span>
              <span>${U(o.budget)}</span>
            </div>
            <div style="background:var(--primary-surface);border-radius:6px;height:24px;overflow:hidden;">
              <div style="background:linear-gradient(90deg,var(--primary),var(--primary-light));height:100%;border-radius:6px;width:${o.budget/a*100}%;transition:width 1s ease;"></div>
            </div>
            <div class="text-xs text-secondary" style="margin-top:2px;">${o.count} aspirasi · Penetapan: ${o.penetapanCount||0} · Perubahan: ${o.perubahanCount||0}</div>
          </div>
        `).join("")}
      </div>
    `}const l=Math.max(...p.map(a=>a.budget),1),E=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"],g=p.map(a=>`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
      <span class="text-xs">${a.count>0?U(a.budget):""}</span>
      <div style="width:100%;max-width:40px;background:var(--primary-surface);border-radius:4px 4px 0 0;height:200px;display:flex;align-items:flex-end;">
        <div style="width:100%;background:linear-gradient(180deg,var(--primary-light),var(--primary));border-radius:4px 4px 0 0;height:${a.budget>0?Math.max(a.budget/l*200,8):0}px;transition:height 1s ease;"></div>
      </div>
      <span class="text-xs text-secondary">${E[a.month-1]}</span>
    </div>
  `).join(""),v=d.length>0?d.map((a,o)=>`
    <tr>
      <td>${o+1}</td>
      <td><strong>${a.proposer_name}</strong></td>
      ${c?`<td>${a.dprd_name||"-"}</td>`:""}
      <td><span class="badge badge-${a.type}">${a.type==="penetapan"?"🟢 Penetapan":"🟠 Perubahan"}</span></td>
      <td>${U(a.budget_amount)}</td>
      <td><span class="badge badge-${a.status}">${a.status}</span></td>
      <td class="text-secondary text-sm">${new Date(a.created_at).toLocaleDateString("id-ID")}</td>
    </tr>
  `).join(""):`<tr><td colspan="${c?7:6}" style="text-align:center;padding:30px;">Belum ada data aspirasi</td></tr>`,$=c?"Super Admin Dashboard":`Dashboard — ${((t=n==null?void 0:n.dprdMember)==null?void 0:t.name)||""}`,y=c?"👑":"🏠",A=`
    <div class="summary-grid">
      <div class="card summary-card">
        <div class="card-icon blue">📋</div>
        <div class="card-value">${e.totalAspirasi||0}</div>
        <div class="card-label">Total Aspirasi</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon gold">💰</div>
        <div class="card-value">${te(e.totalBudget||0)}</div>
        <div class="card-label">Total Anggaran</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon green">🟢</div>
        <div class="card-value">${e.penetapanCount||0}</div>
        <div class="card-label">Penetapan (Murni)</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon orange">🟠</div>
        <div class="card-value">${e.perubahanCount||0}</div>
        <div class="card-label">Perubahan (P-APBD)</div>
      </div>
    </div>

    ${m}

    <div class="card mt-md">
      <h3 class="mb-md">📊 Anggaran per Bulan — ${s}</h3>
      <div style="display:flex;align-items:flex-end;gap:4px;min-height:260px;padding-top:20px;">
        ${g}
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
              ${c?"<th>DPRD</th>":""}
              <th>Tipe</th>
              <th>Anggaran</th>
              <th>Status</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>${v}</tbody>
        </table>
      </div>
    </div>
  `;i.innerHTML=z($,y,A),G()}async function W(i){const{user:n}=N(),c=(n==null?void 0:n.role)==="superadmin";let s=[];if(c)try{const t=await x("/dprd-members");t!=null&&t.success&&(s=t.data)}catch{}const e=`
    <div class="card" style="max-width:720px;">
      <h3 class="mb-md">📝 Form Aspirasi Baru</h3>

      <form id="aspirasiForm" enctype="multipart/form-data">
        ${c?`
          <div class="form-group">
            <label class="form-label">Anggota DPRD Tujuan *</label>
            <select class="form-select" id="dprdMemberId" required>
              <option value="">Pilih Anggota DPRD...</option>
              ${s.map(t=>`<option value="${t.id}">${t.name}</option>`).join("")}
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
  `;i.innerHTML=z("Input Aspirasi","➕",e),G();const p=document.getElementById("togglePenetapan"),d=document.getElementById("togglePerubahan"),m=document.getElementById("aspirasiType");p.addEventListener("click",()=>{m.value="penetapan",p.className="toggle-card active-penetapan",d.className="toggle-card"}),d.addEventListener("click",()=>{m.value="perubahan",d.className="toggle-card active-perubahan",p.className="toggle-card"});const l=document.getElementById("uploadArea"),E=document.getElementById("photoInput"),g=document.getElementById("photoPreview");let v=[];l.addEventListener("click",()=>E.click()),l.addEventListener("dragover",t=>{t.preventDefault(),l.style.borderColor="var(--primary-light)"}),l.addEventListener("dragleave",()=>{l.style.borderColor=""}),l.addEventListener("drop",t=>{t.preventDefault(),l.style.borderColor="",$(t.dataTransfer.files)}),E.addEventListener("change",()=>$(E.files));function $(t){for(const a of t){if(v.length>=5)break;if(a.size>5*1024*1024){k("File terlalu besar (maks 5MB)","error");continue}v.push(a)}y()}function y(){g.innerHTML=v.map((t,a)=>`
      <div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid var(--primary-surface);">
        <img src="${URL.createObjectURL(t)}" style="width:100%;height:100%;object-fit:cover;">
        <button type="button" data-remove="${a}" style="position:absolute;top:2px;right:2px;background:var(--danger);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:10px;cursor:pointer;">✕</button>
      </div>
    `).join(""),document.querySelectorAll("[data-remove]").forEach(t=>{t.addEventListener("click",()=>{v.splice(parseInt(t.dataset.remove),1),y()})})}const A=document.getElementById("budgetAmount");A.addEventListener("input",()=>{let t=A.value.replace(/\D/g,"");A.value=t?Number(t).toLocaleString("id-ID"):"";const a=parseInt(t);document.getElementById("budgetTerbilang").textContent=a>0?`≈ Rp ${Number(a).toLocaleString("id-ID")}`:""}),document.getElementById("aspirasiForm").addEventListener("submit",async t=>{var R;t.preventDefault();const a=document.getElementById("formError"),o=document.getElementById("submitBtn");a.style.display="none";const h=new FormData;h.append("type",m.value),h.append("proposer_name",document.getElementById("proposerName").value.trim()),h.append("proposer_phone",document.getElementById("proposerPhone").value.trim()),h.append("proposer_address",document.getElementById("proposerAddress").value.trim()),h.append("description",document.getElementById("aspirasiDescription").value.trim()),h.append("budget_amount",document.getElementById("budgetAmount").value.replace(/\D/g,"")),c&&h.append("dprd_member_id",document.getElementById("dprdMemberId").value),v.forEach(_=>h.append("photos",_)),o.disabled=!0,o.textContent="⏳ Menyimpan...";try{const{token:_}=N(),I=await(await fetch("/api/aspirasi",{method:"POST",headers:{Authorization:`Bearer ${_}`},body:h})).json();I!=null&&I.success?(k(`Aspirasi ${I.data.reference_no} berhasil disimpan! ✅`),O("/daftar")):(a.textContent=((R=I==null?void 0:I.error)==null?void 0:R.message)||"Gagal menyimpan",a.style.display="block")}catch{a.textContent="Tidak dapat terhubung ke server",a.style.display="block"}o.disabled=!1,o.textContent="💾 Simpan Aspirasi"})}async function Q(i){const{user:n}=N(),c=(n==null?void 0:n.role)==="superadmin";let s=[];if(c)try{const g=await x("/dprd-members");g!=null&&g.success&&(s=g.data)}catch{}let e=1;const p=10;let d={type:"",fiscal_year:"",search:"",status:"",dprd_member_id:""};async function m(){const g=new URLSearchParams({page:e,limit:p});d.type&&g.set("type",d.type),d.fiscal_year&&g.set("fiscal_year",d.fiscal_year),d.search&&g.set("search",d.search),d.status&&g.set("status",d.status),d.dprd_member_id&&g.set("dprd_member_id",d.dprd_member_id);try{const v=await x(`/aspirasi?${g}`);if(v!=null&&v.success)return v}catch{}return{data:[],pagination:{total:0,totalPages:0}}}async function l(){var u,b,T,S,B,P,L;const g=await m(),v=g.data||[],{total:$,totalPages:y}=g.pagination||{},A=v.length>0?v.map((r,f)=>`
      <tr>
        <td>${(e-1)*p+f+1}</td>
        <td><strong style="font-size:0.82rem;">${r.reference_no}</strong></td>
        <td>${r.proposer_name}</td>
        ${c?`<td>${r.dprd_name||"-"}</td>`:""}
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
    `).join(""):`<tr><td colspan="${c?9:8}" style="text-align:center;padding:40px;">
      <div class="empty-state"><div class="icon">📋</div><p>Belum ada data aspirasi</p></div>
    </td></tr>`;let t="";if(y>1){t='<div class="pagination">',t+=`<button ${e<=1?"disabled":""} data-page="${e-1}">‹ Prev</button>`;for(let r=1;r<=y;r++)t+=`<button class="${r===e?"active":""}" data-page="${r}">${r}</button>`;t+=`<button ${e>=y?"disabled":""} data-page="${e+1}">Next ›</button>`,t+="</div>"}const a=new Date().getFullYear(),o=`
      <div class="flex-between mb-md">
        <h3>📋 Total: ${$||0} aspirasi</h3>
        <a href="#/input" class="btn btn-primary">➕ Tambah Baru</a>
      </div>

      <div class="filter-bar">
        <input type="text" class="form-input" id="filterSearch" placeholder="🔍 Cari nama pengusul..." value="${d.search}">
        ${c?`
          <select class="form-select" id="filterDprd">
            <option value="">Semua DPRD</option>
            ${s.map(r=>`<option value="${r.id}" ${d.dprd_member_id==r.id?"selected":""}>${r.name}</option>`).join("")}
          </select>
        `:""}
        <select class="form-select" id="filterType">
          <option value="">Semua Tipe</option>
          <option value="penetapan" ${d.type==="penetapan"?"selected":""}>Penetapan</option>
          <option value="perubahan" ${d.type==="perubahan"?"selected":""}>Perubahan</option>
        </select>
        <select class="form-select" id="filterStatus">
          <option value="">Semua Status</option>
          <option value="draft" ${d.status==="draft"?"selected":""}>Draft</option>
          <option value="verified" ${d.status==="verified"?"selected":""}>Verified</option>
          <option value="rejected" ${d.status==="rejected"?"selected":""}>Rejected</option>
        </select>
        <select class="form-select" id="filterYear">
          <option value="" ${d.fiscal_year?"":"selected"}>Semua Tahun</option>
          <option value="${a}" ${d.fiscal_year==a?"selected":""}>${a}</option>
          <option value="${a-1}" ${d.fiscal_year==a-1?"selected":""}>${a-1}</option>
          <option value="${a-2}" ${d.fiscal_year==a-2?"selected":""}>${a-2}</option>
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
                ${c?"<th>DPRD</th>":""}
                <th>Tipe</th>
                <th>Anggaran</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>${A}</tbody>
          </table>
        </div>
      </div>
      ${t}

      <!-- Edit Aspirasi Modal -->
      <div id="editAspirasiModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;align-items:center;justify-content:center;">
        <div class="card" style="width:100%;max-width:560px;margin:20px;max-height:90vh;overflow-y:auto;animation:slideUp 0.3s ease;">
          <h3 class="mb-md">✏️ Edit Aspirasi</h3>
          <form id="editAspirasiForm">
            <input type="hidden" id="editId">

            ${c?`
              <div class="form-group">
                <label class="form-label">Anggota DPRD</label>
                <select class="form-select" id="editDprdMemberId">
                  ${s.map(r=>`<option value="${r.id}">${r.name}</option>`).join("")}
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
    `;i.innerHTML=z("Daftar Aspirasi","📋",o),G();const h=document.getElementById("aspirasiTableCard");h&&h.addEventListener("click",async r=>{var H;const f=r.target.closest("[data-delete-id]");if(f){const F=f.dataset.deleteId;if(!confirm("Yakin ingin menghapus aspirasi ini?"))return;f.disabled=!0,f.textContent="⏳";try{const D=await x(`/aspirasi/${F}`,{method:"DELETE"});D!=null&&D.success?(k("Aspirasi berhasil dihapus ✅"),await l()):(k(((H=D==null?void 0:D.error)==null?void 0:H.message)||"Gagal menghapus","error"),f.disabled=!1,f.textContent="🗑️")}catch{k("Gagal menghapus","error"),f.disabled=!1,f.textContent="🗑️"}return}const M=r.target.closest("[data-edit-id]");if(M){const F=M.dataset.editId;M.disabled=!0,M.textContent="⏳";try{const D=await x(`/aspirasi/${F}`);if(D!=null&&D.success){const w=D.data;document.getElementById("editId").value=w.id,document.getElementById("editType").value=w.type,document.getElementById("editProposerName").value=w.proposer_name||"",document.getElementById("editProposerPhone").value=w.proposer_phone||"",document.getElementById("editProposerAddress").value=w.proposer_address||"",document.getElementById("editDescription").value=w.description||"",document.getElementById("editBudgetAmount").value=w.budget_amount?Number(w.budget_amount).toLocaleString("id-ID"):"",document.getElementById("editStatus").value=w.status||"draft",c&&(document.getElementById("editDprdMemberId").value=w.dprd_member_id),document.getElementById("editError").style.display="none",R("editAspirasiModal")}else k("Gagal memuat data","error")}catch{k("Gagal memuat data","error")}M.disabled=!1,M.textContent="✏️";return}});function R(r){const f=document.getElementById(r);f&&(f.style.display="flex")}function _(r){const f=document.getElementById(r);f&&(f.style.display="none")}const C=document.getElementById("editAspirasiModal");(u=document.getElementById("cancelEditAspirasi"))==null||u.addEventListener("click",()=>_("editAspirasiModal")),C==null||C.addEventListener("click",r=>{r.target===C&&_("editAspirasiModal")});const I=document.getElementById("editBudgetAmount");I==null||I.addEventListener("input",()=>{let r=I.value.replace(/\D/g,"");I.value=r?Number(r).toLocaleString("id-ID"):""}),(b=document.getElementById("editAspirasiForm"))==null||b.addEventListener("submit",async r=>{var D;r.preventDefault();const f=document.getElementById("editError"),M=document.getElementById("submitEditAspirasi");f.style.display="none";const H=document.getElementById("editId").value,F={type:document.getElementById("editType").value,proposer_name:document.getElementById("editProposerName").value.trim(),proposer_phone:document.getElementById("editProposerPhone").value.trim(),proposer_address:document.getElementById("editProposerAddress").value.trim(),description:document.getElementById("editDescription").value.trim(),budget_amount:document.getElementById("editBudgetAmount").value.replace(/\D/g,""),status:document.getElementById("editStatus").value};M.disabled=!0,M.textContent="⏳ Menyimpan...";try{const w=await x(`/aspirasi/${H}`,{method:"PUT",body:JSON.stringify(F)});w!=null&&w.success?(k("Aspirasi berhasil diperbarui ✅"),_("editAspirasiModal"),await l()):(f.textContent=((D=w==null?void 0:w.error)==null?void 0:D.message)||"Gagal menyimpan",f.style.display="block")}catch{f.textContent="Gagal terhubung ke server",f.style.display="block"}M.disabled=!1,M.textContent="💾 Simpan Perubahan"}),(T=document.getElementById("filterSearch"))==null||T.addEventListener("input",E(r=>{d.search=r.target.value,e=1,l()},400)),(S=document.getElementById("filterDprd"))==null||S.addEventListener("change",r=>{d.dprd_member_id=r.target.value,e=1,l()}),(B=document.getElementById("filterType"))==null||B.addEventListener("change",r=>{d.type=r.target.value,e=1,l()}),(P=document.getElementById("filterStatus"))==null||P.addEventListener("change",r=>{d.status=r.target.value,e=1,l()}),(L=document.getElementById("filterYear"))==null||L.addEventListener("change",r=>{d.fiscal_year=r.target.value,e=1,l()}),document.querySelectorAll("[data-page]").forEach(r=>{r.addEventListener("click",()=>{e=parseInt(r.dataset.page),l()})})}function E(g,v){let $;return(...y)=>{clearTimeout($),$=setTimeout(()=>g(...y),v)}}await l()}async function X(i){const{user:n}=N(),c=(n==null?void 0:n.role)==="superadmin",s=new Date().getFullYear();let e={},p=[],d=[];try{const[t,a,o]=await Promise.all([x(`/dashboard/summary?fiscal_year=${s}`),x(`/dashboard/chart/comparison?fiscal_year=${s}`),x(`/dashboard/chart/by-dprd?fiscal_year=${s}`)]);t!=null&&t.success&&(e=t.data),a!=null&&a.success&&(p=a.data),o!=null&&o.success&&(d=o.data)}catch{}const m=p.find(t=>t.type==="penetapan")||{count:0,budget:0},l=p.find(t=>t.type==="perubahan")||{count:0,budget:0},E=(m.count||0)+(l.count||0),g=E>0?Math.round(m.count/E*100):0,v=100-g,$=Math.max(...d.map(t=>t.budget),1),y=d.map(t=>`
    <div style="margin-bottom:16px;">
      <div class="flex-between text-sm" style="margin-bottom:4px;">
        <span style="font-weight:700;">${t.name}</span>
        <span style="font-weight:600;">${U(t.budget)}</span>
      </div>
      <div style="background:var(--primary-surface);border-radius:6px;height:28px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,var(--primary),var(--primary-light));height:100%;border-radius:6px;width:${t.budget/$*100}%;transition:width 1s ease;display:flex;align-items:center;padding-left:8px;">
          <span style="color:#fff;font-size:0.72rem;font-weight:600;">${t.count} aspirasi</span>
        </div>
      </div>
    </div>
  `).join(""),A=`
    <div class="flex-between mb-md">
      <h3>📊 Laporan Tahun Anggaran ${s}</h3>
      <div class="flex gap-sm">
        <a href="/api/export/excel?fiscal_year=${s}" target="_blank" class="btn btn-primary btn-sm">📥 Download Excel</a>
        <a href="/api/export/pdf?fiscal_year=${s}" target="_blank" class="btn btn-gold btn-sm">📥 Download PDF</a>
      </div>
    </div>

    <div class="summary-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="card summary-card">
        <div class="card-icon blue">📋</div>
        <div class="card-value">${e.totalAspirasi||0}</div>
        <div class="card-label">Total Aspirasi</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon gold">💰</div>
        <div class="card-value">${U(e.totalBudget||0)}</div>
        <div class="card-label">Total Anggaran</div>
      </div>
      <div class="card summary-card">
        <div class="card-icon green">📊</div>
        <div class="card-value">${g}% / ${v}%</div>
        <div class="card-label">Penetapan vs Perubahan</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:${c?"1fr 1fr":"1fr"};gap:20px;">
      <div class="card">
        <h3 class="mb-md">📊 Ringkasan per Anggota DPRD</h3>
        ${y||'<p class="text-secondary">Belum ada data</p>'}
        <div style="margin-top:20px;padding-top:16px;border-top:2px solid var(--primary-surface);">
          <div class="flex-between">
            <span style="font-weight:700;font-size:1rem;">TOTAL KESELURUHAN</span>
            <span style="font-weight:700;font-size:1.1rem;color:var(--primary);">${U(e.totalBudget||0)}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-md">📊 Perbandingan Tipe Aspirasi</h3>

        <div style="margin-bottom:20px;">
          <div class="flex-between text-sm" style="margin-bottom:6px;">
            <span>🟢 Penetapan (Murni)</span>
            <span style="font-weight:700;">${m.count} usulan (${g}%)</span>
          </div>
          <div style="background:#D1FAE5;border-radius:6px;height:24px;overflow:hidden;">
            <div style="background:var(--accent-green);height:100%;border-radius:6px;width:${g}%;transition:width 1s ease;"></div>
          </div>
          <div class="text-xs text-secondary mt-sm">Anggaran: ${U(m.budget)}</div>
        </div>

        <div>
          <div class="flex-between text-sm" style="margin-bottom:6px;">
            <span>🟠 Perubahan (P-APBD)</span>
            <span style="font-weight:700;">${l.count} usulan (${v}%)</span>
          </div>
          <div style="background:#FFEDD5;border-radius:6px;height:24px;overflow:hidden;">
            <div style="background:var(--accent-orange);height:100%;border-radius:6px;width:${v}%;transition:width 1s ease;"></div>
          </div>
          <div class="text-xs text-secondary mt-sm">Anggaran: ${U(l.budget)}</div>
        </div>

        <div style="margin-top:24px;display:flex;border-radius:8px;overflow:hidden;height:32px;">
          <div style="background:var(--accent-green);width:${g}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-weight:700;">${g}%</div>
          <div style="background:var(--accent-orange);width:${v}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-weight:700;">${v}%</div>
        </div>
      </div>
    </div>
  `;i.innerHTML=z("Laporan","📊",A),G()}async function Z(i){const{user:n}=N(),c=(n==null?void 0:n.role)==="superadmin";let s=[],e=[];async function p(){try{const[m,l]=await Promise.all([x("/users"),x("/dprd-members")]);m!=null&&m.success&&(s=m.data),l!=null&&l.success&&(e=l.data)}catch{}}async function d(){var a,o,h,R,_,C,I;await p();const m=u=>u==="superadmin"?'<span class="badge badge-superadmin">👑 Super Admin</span>':u==="admin"?'<span class="badge badge-draft">🏠 Admin</span>':'<span class="badge badge-verified">📝 Aspirator</span>',l=s.map(u=>`
      <tr>
        <td>${u.id}</td>
        <td><strong>${u.username}</strong></td>
        <td>${u.full_name}</td>
        <td>${m(u.role)}</td>
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
    `).join(""),E=c?`<option value="admin">🏠 Admin DPRD</option>
         <option value="aspirator">📝 Aspirator</option>
         <option value="superadmin">👑 Super Admin</option>`:'<option value="aspirator">📝 Aspirator</option>',g=`
      <div class="flex-between mb-md">
        <h3>👥 Total: ${s.length} users</h3>
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
            <tbody>${l}</tbody>
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
                ${E}
              </select>
            </div>
            ${c?`
              <div class="form-group" id="newDprdGroup">
                <label class="form-label">Anggota DPRD</label>
                <select class="form-select" id="newDprdMemberId">
                  <option value="">Pilih DPRD...</option>
                  ${e.map(u=>`<option value="${u.id}">${u.name}</option>`).join("")}
                </select>
              </div>
            `:`
              <input type="hidden" id="newDprdMemberId" value="${((a=n==null?void 0:n.dprdMember)==null?void 0:a.id)||""}">
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
    `;i.innerHTML=z("Manajemen User","👥",g),G();const v=document.getElementById("userTableCard");v&&v.addEventListener("click",async u=>{var B;const b=u.target.closest("[data-delete-user-id]");if(b){const P=b.dataset.deleteUserId;if(!confirm("Yakin ingin menghapus user ini?"))return;try{const L=await x(`/users/${P}`,{method:"DELETE"});L!=null&&L.success?(k("User berhasil dihapus ✅"),await d()):k(((B=L==null?void 0:L.error)==null?void 0:B.message)||"Gagal","error")}catch{k("Gagal menghapus","error")}return}const T=u.target.closest("[data-unlock-id]");if(T){const P=T.dataset.unlockId;try{const L=await x(`/users/${P}/unlock`,{method:"PATCH"});L!=null&&L.success&&(k("Akun berhasil di-unlock ✅"),await d())}catch{k("Gagal unlock","error")}return}const S=u.target.closest("[data-reset-id]");if(S){const P=S.dataset.resetId;document.getElementById("resetPwUserId").value=P,document.getElementById("resetPwValue").value="",document.getElementById("resetPwError").style.display="none",$("resetPwModal");return}});function $(u){const b=document.getElementById(u);b&&(b.style.display="flex")}function y(u){const b=document.getElementById(u);b&&(b.style.display="none")}const A=document.getElementById("addUserModal"),t=document.getElementById("resetPwModal");(o=document.getElementById("btnAddUser"))==null||o.addEventListener("click",()=>{document.getElementById("addUserError").style.display="none",document.getElementById("addUserForm").reset(),$("addUserModal")}),(h=document.getElementById("cancelAddUser"))==null||h.addEventListener("click",()=>y("addUserModal")),(R=document.getElementById("cancelResetPw"))==null||R.addEventListener("click",()=>y("resetPwModal")),A==null||A.addEventListener("click",u=>{u.target===A&&y("addUserModal")}),t==null||t.addEventListener("click",u=>{u.target===t&&y("resetPwModal")}),c&&((_=document.getElementById("newRole"))==null||_.addEventListener("change",u=>{const b=document.getElementById("newDprdGroup");b&&(b.style.display=u.target.value==="superadmin"?"none":"block")})),(C=document.getElementById("addUserForm"))==null||C.addEventListener("submit",async u=>{var S;u.preventDefault();const b=document.getElementById("addUserError");b.style.display="none";const T={username:document.getElementById("newUsername").value.trim(),password:document.getElementById("newPassword").value,full_name:document.getElementById("newFullName").value.trim(),role:document.getElementById("newRole").value,dprd_member_id:document.getElementById("newDprdMemberId").value||null};try{const B=await x("/users",{method:"POST",body:JSON.stringify(T)});B!=null&&B.success?(k("User berhasil dibuat ✅"),y("addUserModal"),await d()):(b.textContent=((S=B==null?void 0:B.error)==null?void 0:S.message)||"Gagal membuat user",b.style.display="block")}catch{b.textContent="Gagal terhubung ke server",b.style.display="block"}}),(I=document.getElementById("resetPwForm"))==null||I.addEventListener("submit",async u=>{var B;u.preventDefault();const b=document.getElementById("resetPwError");b.style.display="none";const T=document.getElementById("resetPwUserId").value,S=document.getElementById("resetPwValue").value;try{const P=await x(`/users/${T}/reset-password`,{method:"PATCH",body:JSON.stringify({new_password:S})});P!=null&&P.success?(k("Password berhasil direset ✅"),y("resetPwModal")):(b.textContent=((B=P==null?void 0:P.error)==null?void 0:B.message)||"Gagal reset password",b.style.display="block")}catch{b.textContent="Gagal terhubung ke server",b.style.display="block"}})}await d()}const j=document.getElementById("app");function N(){const i=localStorage.getItem("token"),n=JSON.parse(localStorage.getItem("user")||"null");return{token:i,user:n}}function ee(i,n){localStorage.setItem("token",i),localStorage.setItem("user",JSON.stringify(n))}function Y(){localStorage.removeItem("token"),localStorage.removeItem("user")}function J(){return!!N().token}async function x(i,n={}){const{token:c}=N(),s={...n.headers||{}};c&&(s.Authorization=`Bearer ${c}`),n.body instanceof FormData||(s["Content-Type"]="application/json");const e=await fetch(`/api${i}`,{...n,headers:s});if(e.status===401)return Y(),O("/login"),null;const p=e.headers.get("content-type");return p&&p.includes("application/json")?e.json():e}function U(i){return!i&&i!==0?"Rp 0":"Rp "+Number(i).toLocaleString("id-ID")}function te(i){if(!i&&i!==0)return"Rp 0";const n=Number(i);return n>=1e12?"Rp "+(n/1e12).toFixed(1).replace(".0","")+" T":n>=1e9?"Rp "+(n/1e9).toFixed(1).replace(".0","")+" M":n>=1e6?"Rp "+(n/1e6).toFixed(0)+" Jt":"Rp "+n.toLocaleString("id-ID")}function k(i,n="success"){const c=document.querySelector(".toast");c&&c.remove();const s=document.createElement("div");s.className=`toast toast-${n}`,s.textContent=i,document.body.appendChild(s),setTimeout(()=>s.remove(),3500)}function G(){document.querySelectorAll("[data-nav]").forEach(e=>{e.addEventListener("click",p=>{p.preventDefault(),O(e.dataset.nav)})});const i=document.getElementById("logoutBtn");i&&i.addEventListener("click",()=>{Y(),O("/login")});const n=document.getElementById("hamburgerBtn"),c=document.getElementById("sidebar"),s=document.getElementById("sidebarOverlay");n&&c&&(n.addEventListener("click",()=>{c.classList.toggle("open"),s==null||s.classList.toggle("active")}),s==null||s.addEventListener("click",()=>{c.classList.remove("open"),s.classList.remove("active")}))}function z(i,n,c){var d,m;const{user:s}=N(),e=(s==null?void 0:s.role)==="superadmin",p=((d=s==null?void 0:s.fullName)==null?void 0:d.split(" ").map(l=>l[0]).join("").substring(0,2))||"U";return`
    <div class="app-layout">
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon" style="background:none;padding:0;overflow:hidden;">
            <img src="/logo-pan.png" alt="PAN" style="width:44px;height:44px;object-fit:contain;border-radius:8px;">
          </div>
          <div class="sidebar-brand-text">
            <h3>Aspirasi DPRD</h3>
            <p>${e?"👑 Super Admin":((m=s==null?void 0:s.dprdMember)==null?void 0:m.name)||"Admin"}</p>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section">Menu Utama</div>
          <a href="#/" class="${i==="Dashboard"||i.includes("Dashboard")?"active":""}" data-nav="/">
            <span class="nav-icon">${e?"👑":"🏠"}</span> Dashboard
          </a>
          <a href="#/input" class="${i==="Input Aspirasi"?"active":""}" data-nav="/input">
            <span class="nav-icon">➕</span> Input Aspirasi
          </a>
          <a href="#/daftar" class="${i==="Daftar Aspirasi"?"active":""}" data-nav="/daftar">
            <span class="nav-icon">📋</span> Daftar Aspirasi
          </a>
          <a href="#/laporan" class="${i==="Laporan"?"active":""}" data-nav="/laporan">
            <span class="nav-icon">📊</span> Laporan & Export
          </a>
            <div class="sidebar-section">Administrasi</div>
            <a href="#/users" class="${i==="Manajemen User"?"active":""}" data-nav="/users">
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
            <h2>${i}</h2>
          </div>
          <div class="header-actions">
            <div class="header-user">
              <div class="avatar">${p}</div>
              <span class="text-sm">${(s==null?void 0:s.fullName)||"User"}</span>
            </div>
            <button class="btn btn-logout" id="logoutBtn">🚪 Keluar</button>
          </div>
        </header>
        <div class="page-content">${c}</div>
      </div>
    </div>
  `}function O(i){window.location.hash=i}function K(){const i=window.location.hash.slice(1)||"/";if(!J()&&i!=="/login"){window.location.hash="/login";return}if(J()&&i==="/login"){window.location.hash="/";return}i==="/login"?V(j):i==="/"||i==="/dashboard"?q(j):i==="/input"?W(j):i==="/daftar"?Q(j):i==="/laporan"?X(j):i==="/users"?Z(j):q(j)}window.addEventListener("hashchange",K);window.addEventListener("DOMContentLoaded",K);
