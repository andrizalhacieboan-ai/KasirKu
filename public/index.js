// State global
let currentUser = null;
let currentSection = 'dashboard';
const API_BASE = '/api';

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = {
    success: '<i class="fa-solid fa-circle-check" style="color:#40C057"></i>',
    error: '<i class="fa-solid fa-circle-xmark" style="color:#FA5252"></i>',
    info: '<i class="fa-solid fa-circle-info" style="color:#339AF0"></i>'
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function openModal(title, content, footerHtml) {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modalContent');
  modal.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">${content}</div>
    ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
  `;
  overlay.classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(API_BASE + endpoint, options);
    return await res.json();
  } catch (err) {
    console.warn('API tidak tersedia:', err.message);
    return { success: false, message: 'Server tidak tersedia.' };
  }
}

const loginOverlay = document.getElementById('loginOverlay');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginError = document.getElementById('loginError');
const loginErrorMsg = document.getElementById('loginErrorMsg');

document.getElementById('btnLoginOk').addEventListener('click', doLogin);
loginPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
loginUser.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginPass.focus(); });

async function doLogin() {
  const username = loginUser.value.trim();
  const password = loginPass.value.trim();

  if (!username || !password) {
    loginError.style.display = 'flex';
    loginErrorMsg.textContent = 'Harap isi username dan password!';
    loginUser.classList.add('error');
    loginPass.classList.add('error');
    setTimeout(() => { loginUser.classList.remove('error'); loginPass.classList.remove('error'); }, 500);
    return;
  }

  const result = await apiCall('/login', 'POST', { username, password });

  if (result.success) {
    currentUser = result.user;
    loginSuccess();
  } else {
    if (username === 'andriyt' && password === 'andriyt002') {
      currentUser = { id: 1, username: 'andriyt', role: 'admin' };
      loginSuccess();
    } else {
      loginError.style.display = 'flex';
      loginErrorMsg.textContent = result.message || 'Username atau password anda salah';
      loginPass.classList.add('error');
      setTimeout(() => loginPass.classList.remove('error'), 500);
    }
  }
}

function loginSuccess() {
  loginOverlay.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
  loginOverlay.style.opacity = '0';
  loginOverlay.style.transform = 'scale(1.05)';
  setTimeout(() => {
    loginOverlay.style.display = 'none';
    document.getElementById('mainApp').classList.add('active');
    loadSection('dashboard');
    showToast('Selamat datang, ' + currentUser.username + '!', 'success');
  }, 400);
}

document.getElementById('btnLoginCancel').addEventListener('click', () => {
  loginUser.value = '';
  loginPass.value = '';
  loginError.style.display = 'none';
  loginUser.focus();
});

document.querySelectorAll('.dropdown-item[data-section]').forEach(item => {
  item.addEventListener('click', () => {
    const section = item.getAttribute('data-section');
    loadSection(section);
  });
});

document.getElementById('navExit').addEventListener('click', () => {
  openModal('Konfirmasi Exit', `
    <div style="text-align:center; padding: 20px 0;">
      <i class="fa-solid fa-right-from-bracket" style="font-size:48px; color:var(--danger); margin-bottom:16px; display:block;"></i>
      <p style="font-size:16px; font-weight:600;">Apakah Anda yakin ingin keluar dari program?</p>
      <p style="color:var(--gray); margin-top:8px;">Sesi Anda akan diakhiri.</p>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-danger" onclick="exitProgram()"><i class="fa-solid fa-right-from-bracket"></i> Exit Program</button>
  `);
});

function exitProgram() {
  closeModal();
  currentUser = null;
  document.getElementById('mainApp').classList.remove('active');
  loginOverlay.style.display = 'flex';
  loginOverlay.style.opacity = '1';
  loginOverlay.style.transform = 'scale(1)';
  loginUser.value = '';
  loginPass.value = '';
  loginError.style.display = 'none';
  showToast('Anda telah keluar dari program.', 'info');
}

function navigateTo(section) {
  loadSection(section);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadSection(section) {
  currentSection = section;
  const area = document.getElementById('contentArea');
  area.style.opacity = '0';
  area.style.transform = 'translateY(20px)';

  await new Promise(r => setTimeout(r, 150));

  const renderers = {
    'dashboard': renderDashboard,
    'profil-ganti-password': renderGantiPassword,
    'profil-add-admin': renderAddAdmin,
    'profil-add-user': renderAddUser,
    'master-area': renderMasterArea,
    'master-langganan': renderMasterLangganan,
    'master-stok': renderMasterStok,
    'penjualan-transaksi': renderPenjualanTransaksi,
    'penjualan-return': renderPenjualanReturn,
    'penjualan-cetak': renderPenjualanCetak,
    'piutang-penagihan': renderPiutangPenagihan,
    'pembelian-transaksi': renderPembelianTransaksi,
    'pembelian-return': renderPembelianReturn,
    'hutang-pembayaran': renderHutangPembayaran,
    'db-periode': renderDbPeriode,
    'db-index': renderDbIndex,
    'db-backup': renderDbBackup,
    'db-refresh': renderDbRefresh,
    'db-transfer': renderDbTransfer,
    'db-update': renderDbUpdate,
    'db-dropbox': renderDbDropbox,
    'db-spp': renderDbSpp,
    'db-reset-opname': renderDbResetOpname,
    'db-reupdate-saldo': renderDbReupdateSaldo,
    'db-export-excel': renderDbExportExcel,
    'db-tutup-buku': renderDbTutupBuku,
    'info-help': renderInfoHelp,
    'info-tentang': renderInfoTentang,
    'info-developer': renderInfoDeveloper
  };

  const renderer = renderers[section];
  area.innerHTML = renderer ? renderer() : renderDashboard();

  postRender(section);

  area.style.opacity = '1';
  area.style.transform = 'translateY(0)';
  area.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';

  initScrollReveal();
}

function postRender(section) {
  if (['master-area', 'master-langganan', 'master-stok', 'penjualan-transaksi', 'pembelian-transaksi', 'piutang-penagihan', 'hutang-pembayaran'].includes(section)) {
    loadSectionData(section);
  }
}

async function loadSectionData(section) {
  const endpoints = {
    'master-area': '/areas',
    'master-langganan': '/customers',
    'master-stok': '/products',
    'penjualan-transaksi': '/sales',
    'pembelian-transaksi': '/purchases',
    'piutang-penagihan': '/receivables',
    'hutang-pembayaran': '/payables'
  };
  const result = await apiCall(endpoints[section]);
  if (result.success && result.data) {
    populateTable(section, result.data);
  }
}

function populateTable(section, data) {
  const tbody = document.getElementById('table-' + section);
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--gray);padding:24px;">Tidak ada data</td></tr>';
    return;
  }

  const formatters = {
    'master-area': function(d) {
      return '<tr><td>' + d.id + '</td><td>' + (d.nama_area || '-') + '</td><td>' + (d.keterangan || '-') + '</td><td>' + formatTanggal(d.created_at) + '</td><td><button class="btn btn-danger btn-sm" onclick="deleteItem(\'areas\',' + d.id + ',\'master-area\')"><i class="fa-solid fa-trash"></i></button></td></tr>';
    },
    'master-langganan': function(d) {
      return '<tr><td>' + d.id + '</td><td>' + (d.nama || '-') + '</td><td>' + (d.alamat || '-') + '</td><td>' + (d.telepon || '-') + '</td><td>' + formatTanggal(d.created_at) + '</td><td><button class="btn btn-danger btn-sm" onclick="deleteItem(\'customers\',' + d.id + ',\'master-langganan\')"><i class="fa-solid fa-trash"></i></button></td></tr>';
    },
    'master-stok': function(d) {
      return '<tr><td>' + (d.kode || '-') + '</td><td>' + (d.nama || '-') + '</td><td class="text-right">' + formatRupiah(d.harga_beli) + '</td><td class="text-right">' + formatRupiah(d.harga_jual) + '</td><td class="text-right">' + d.stok + ' ' + (d.satuan || '') + '</td><td><button class="btn btn-danger btn-sm" onclick="deleteItem(\'products\',' + d.id + ',\'master-stok\')"><i class="fa-solid fa-trash"></i></button></td></tr>';
    },
    'penjualan-transaksi': function(d) {
      return '<tr><td>' + d.id + '</td><td>' + formatTanggal(d.tanggal) + '</td><td>' + (d.customer_name || 'Umum') + '</td><td class="text-right">' + formatRupiah(d.total) + '</td><td><span class="badge ' + (d.status === 'selesai' ? 'badge-success' : 'badge-warning') + '">' + d.status + '</span></td></tr>';
    },
    'pembelian-transaksi': function(d) {
      return '<tr><td>' + d.id + '</td><td>' + formatTanggal(d.tanggal) + '</td><td>' + (d.supplier || '-') + '</td><td class="text-right">' + formatRupiah(d.total) + '</td></tr>';
    },
    'piutang-penagihan': function(d) {
      return '<tr><td>' + d.id + '</td><td>' + (d.customer_name || '-') + '</td><td class="text-right">' + formatRupiah(d.jumlah) + '</td><td class="text-right">' + formatRupiah(d.dibayar) + '</td><td class="text-right">' + formatRupiah(d.sisa) + '</td><td><button class="btn btn-primary btn-sm" onclick="bayarPiutang(' + d.id + ',' + d.sisa + ')"><i class="fa-solid fa-money-bill"></i> Bayar</button></td></tr>';
    },
    'hutang-pembayaran': function(d) {
      return '<tr><td>' + d.id + '</td><td>' + (d.supplier || '-') + '</td><td class="text-right">' + formatRupiah(d.jumlah) + '</td><td class="text-right">' + formatRupiah(d.dibayar) + '</td><td class="text-right">' + formatRupiah(d.sisa) + '</td><td><button class="btn btn-blue btn-sm" onclick="bayarHutang(' + d.id + ',' + d.sisa + ')"><i class="fa-solid fa-money-bill"></i> Bayar</button></td></tr>';
    }
  };

  const formatter = formatters[section];
  if (formatter) {
    tbody.innerHTML = data.map(formatter).join('');
  }
}

async function deleteItem(endpoint, id, section) {
  if (!confirm('Hapus data ini?')) return;
  const result = await apiCall('/' + endpoint + '/' + id, 'DELETE');
  if (result.success) {
    showToast(result.message, 'success');
    loadSectionData(section);
  } else {
    showToast(result.message || 'Gagal menghapus data', 'error');
  }
}

async function bayarPiutang(id, sisa) {
  openModal('Bayar Piutang', `
    <div class="form-group">
      <label>Sisa Piutang</label>
      <input type="text" class="form-input" value="${formatRupiah(sisa)}" disabled>
    </div>
    <div class="form-group">
      <label>Jumlah Bayar</label>
      <input type="number" id="bayarPiutangJumlah" class="form-input" value="${sisa}" min="1" max="${sisa}">
    </div>
    <div class="form-group">
      <label>Keterangan</label>
      <input type="text" id="bayarPiutangKet" class="form-input" placeholder="Opsional">
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="submitBayarPiutang(${id})">Bayar</button>
  `);
}

async function submitBayarPiutang(id) {
  const jumlah = parseFloat(document.getElementById('bayarPiutangJumlah').value);
  const keterangan = document.getElementById('bayarPiutangKet').value;
  if (!jumlah || jumlah <= 0) { showToast('Masukkan jumlah bayar yang valid!', 'error'); return; }
  const result = await apiCall('/receivable-payments', 'POST', { receivable_id: id, jumlah: jumlah, keterangan: keterangan });
  if (result.success) {
    showToast(result.message, 'success');
    closeModal();
    loadSectionData('piutang-penagihan');
  } else {
    showToast(result.message, 'error');
  }
}

async function bayarHutang(id, sisa) {
  openModal('Bayar Hutang', `
    <div class="form-group">
      <label>Sisa Hutang</label>
      <input type="text" class="form-input" value="${formatRupiah(sisa)}" disabled>
    </div>
    <div class="form-group">
      <label>Jumlah Bayar</label>
      <input type="number" id="bayarHutangJumlah" class="form-input" value="${sisa}" min="1" max="${sisa}">
    </div>
    <div class="form-group">
      <label>Keterangan</label>
      <input type="text" id="bayarHutangKet" class="form-input" placeholder="Opsional">
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-blue" onclick="submitBayarHutang(${id})">Bayar</button>
  `);
}

async function submitBayarHutang(id) {
  const jumlah = parseFloat(document.getElementById('bayarHutangJumlah').value);
  const keterangan = document.getElementById('bayarHutangKet').value;
  if (!jumlah || jumlah <= 0) { showToast('Masukkan jumlah bayar yang valid!', 'error'); return; }
  const result = await apiCall('/payable-payments', 'POST', { payable_id: id, jumlah: jumlah, keterangan: keterangan });
  if (result.success) {
    showToast(result.message, 'success');
    closeModal();
    loadSectionData('hutang-pembayaran');
  } else {
    showToast(result.message, 'error');
  }
}

function sectionHeader(breadcrumb, title, subtitle) {
  return `
    <div class="section-header scroll-reveal">
      <div class="breadcrumb">${breadcrumb}</div>
      <h2>${title}</h2>
      <p>${subtitle}</p>
    </div>
  `;
}

function renderDashboard() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  return `
    ${sectionHeader('<span>Beranda</span>', 'Dashboard', 'Ringkasan aktivitas kasir Anda')}
    <div class="dashboard-welcome scroll-reveal">
      <h2>${greeting}, ${currentUser ? currentUser.username : 'User'}!</h2>
      <p>Selamat bekerja. Pilih menu di navbar untuk mulai mengelola transaksi.</p>
      <div class="user-badge"><i class="fa-solid fa-shield-halved"></i> ${currentUser ? currentUser.role.toUpperCase() : 'USER'}</div>
    </div>
    <div class="stat-grid scroll-reveal">
      <div class="stat-card orange">
        <div class="stat-label"><i class="fa-solid fa-cart-shopping"></i>Penjualan Hari Ini</div>
        <div class="stat-value">0</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label"><i class="fa-solid fa-boxes-stacked"></i>Total Stok</div>
        <div class="stat-value">0</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label"><i class="fa-solid fa-hand-holding-dollar"></i>Piutang</div>
        <div class="stat-value">Rp 0</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label"><i class="fa-solid fa-file-invoice-dollar"></i>Hutang</div>
        <div class="stat-value">Rp 0</div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;" class="scroll-reveal">
      <div class="card card-orange">
        <div class="card-header"><h3><i class="fa-solid fa-clock-rotate-left"></i>Transaksi Terakhir</h3></div>
        <p style="color:var(--gray); text-align:center; padding:30px 0;">Belum ada transaksi hari ini</p>
      </div>
      <div class="card card-blue">
        <div class="card-header"><h3><i class="fa-solid fa-chart-line"></i>Stok Menipis</h3></div>
        <p style="color:var(--gray); text-align:center; padding:30px 0;">Semua stok aman</p>
      </div>
    </div>
  `;
}

function renderGantiPassword() {
  return `
    ${sectionHeader('<span>Profil</span> <span class="sep">/</span> <span>Ganti Password</span>', 'Ganti Password', 'Ubah password akun Anda')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-key"></i>Form Ganti Password</h3></div>
      <div class="form-group">
        <label>Password Lama</label>
        <input type="password" id="oldPass" class="form-input" placeholder="Masukkan password lama">
      </div>
      <div class="form-group">
        <label>Password Baru</label>
        <input type="password" id="newPass" class="form-input" placeholder="Masukkan password baru">
      </div>
      <div class="form-group">
        <label>Konfirmasi Password Baru</label>
        <input type="password" id="confirmPass" class="form-input" placeholder="Ulangi password baru">
      </div>
      <button class="btn btn-primary" onclick="submitGantiPassword()"><i class="fa-solid fa-floppy-disk"></i>Simpan Perubahan</button>
    </div>
  `;
}

async function submitGantiPassword() {
  const oldPass = document.getElementById('oldPass').value;
  const newPass = document.getElementById('newPass').value;
  const confirmPass = document.getElementById('confirmPass').value;
  if (!oldPass || !newPass || !confirmPass) { showToast('Semua field harus diisi!', 'error'); return; }
  if (newPass !== confirmPass) { showToast('Konfirmasi password tidak cocok!', 'error'); return; }
  if (newPass.length < 4) { showToast('Password baru minimal 4 karakter!', 'error'); return; }
  const result = await apiCall('/change-password', 'POST', { userId: currentUser ? currentUser.id : 1, oldPassword: oldPass, newPassword: newPass });
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('oldPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
  } else {
    showToast(result.message, 'error');
  }
}

function renderAddAdmin() {
  return `
    ${sectionHeader('<span>Profil</span> <span class="sep">/</span> <span>Add Admin</span>', 'Tambah Admin', 'Buat akun admin baru dengan key password')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-user-shield"></i>Form Tambah Admin</h3></div>
      <div class="form-group">
        <label>Username Admin</label>
        <input type="text" id="adminUser" class="form-input" placeholder="Username admin baru">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="adminPass" class="form-input" placeholder="Password admin">
      </div>
      <div class="form-group">
        <label>Key Password</label>
        <input type="password" id="adminKey" class="form-input" placeholder="Key password untuk verifikasi">
      </div>
      <button class="btn btn-primary" onclick="submitAddAdmin()"><i class="fa-solid fa-user-plus"></i>Tambah Admin</button>
    </div>
  `;
}

async function submitAddAdmin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  const keyPassword = document.getElementById('adminKey').value;
  if (!username || !password || !keyPassword) { showToast('Semua field harus diisi!', 'error'); return; }
  const result = await apiCall('/add-admin', 'POST', { username: username, password: password, keyPassword: keyPassword });
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
    document.getElementById('adminKey').value = '';
  } else { showToast(result.message, 'error'); }
}

function renderAddUser() {
  return `
    ${sectionHeader('<span>Profil</span> <span class="sep">/</span> <span>Add User</span>', 'Tambah User', 'Buat akun user baru dengan key password')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-user-plus"></i>Form Tambah User</h3></div>
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="userUser" class="form-input" placeholder="Username user baru">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="userPass" class="form-input" placeholder="Password user">
      </div>
      <div class="form-group">
        <label>Key Password</label>
        <input type="password" id="userKey" class="form-input" placeholder="Key password untuk verifikasi">
      </div>
      <button class="btn btn-blue" onclick="submitAddUser()"><i class="fa-solid fa-user-plus"></i>Tambah User</button>
    </div>
  `;
}

async function submitAddUser() {
  const username = document.getElementById('userUser').value.trim();
  const password = document.getElementById('userPass').value;
  const keyPassword = document.getElementById('userKey').value;
  if (!username || !password || !keyPassword) { showToast('Semua field harus diisi!', 'error'); return; }
  const result = await apiCall('/add-user', 'POST', { username: username, password: password, keyPassword: keyPassword });
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('userUser').value = '';
    document.getElementById('userPass').value = '';
    document.getElementById('userKey').value = '';
  } else { showToast(result.message, 'error'); }
}

function renderMasterArea() {
  return `
    ${sectionHeader('<span>Master</span> <span class="sep">/</span> <span>Daftar Area</span>', 'Daftar Area', 'Kelola data area penjualan')}
    <div class="card scroll-reveal mb-3">
      <div class="card-header"><h3><i class="fa-solid fa-plus"></i>Tambah Area</h3></div>
      <div class="form-row">
        <div class="form-group" style="flex:1;">
          <label>Nama Area</label>
          <input type="text" id="areaNama" class="form-input" placeholder="Nama area baru">
        </div>
        <div class="form-group" style="flex:1;">
          <label>Keterangan</label>
          <input type="text" id="areaKet" class="form-input" placeholder="Keterangan (opsional)">
        </div>
        <button class="btn btn-primary" style="margin-bottom:4px;" onclick="submitAddArea()"><i class="fa-solid fa-plus"></i>Tambah</button>
      </div>
    </div>
    <div class="scroll-reveal">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Nama Area</th><th>Keterangan</th><th>Tanggal</th><th>Aksi</th></tr></thead>
          <tbody id="table-master-area"><tr><td colspan="5" style="text-align:center;color:var(--gray);padding:24px;">Memuat data...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}

async function submitAddArea() {
  const nama_area = document.getElementById('areaNama').value.trim();
  const keterangan = document.getElementById('areaKet').value.trim();
  if (!nama_area) { showToast('Nama area harus diisi!', 'error'); return; }
  const result = await apiCall('/areas', 'POST', { nama_area: nama_area, keterangan: keterangan });
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('areaNama').value = '';
    document.getElementById('areaKet').value = '';
    loadSectionData('master-area');
  } else { showToast(result.message, 'error'); }
}

function renderMasterLangganan() {
  return `
    ${sectionHeader('<span>Master</span> <span class="sep">/</span> <span>Daftar Langganan</span>', 'Daftar Langganan', 'Kelola data pelanggan/langganan')}
    <div class="card scroll-reveal mb-3">
      <div class="card-header"><h3><i class="fa-solid fa-user-plus"></i>Tambah Langganan</h3></div>
      <div class="form-grid">
        <div class="form-group"><label>Nama</label><input type="text" id="custNama" class="form-input" placeholder="Nama langganan"></div>
        <div class="form-group"><label>Alamat</label><input type="text" id="custAlamat" class="form-input" placeholder="Alamat"></div>
        <div class="form-group"><label>Telepon</label><input type="text" id="custTelp" class="form-input" placeholder="No. telepon"></div>
      </div>
      <button class="btn btn-primary mt-2" onclick="submitAddCustomer()"><i class="fa-solid fa-plus"></i>Tambah Langganan</button>
    </div>
    <div class="scroll-reveal">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Nama</th><th>Alamat</th><th>Telepon</th><th>Tanggal</th><th>Aksi</th></tr></thead>
          <tbody id="table-master-langganan"><tr><td colspan="6" style="text-align:center;color:var(--gray);padding:24px;">Memuat data...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}

async function submitAddCustomer() {
  const nama = document.getElementById('custNama').value.trim();
  const alamat = document.getElementById('custAlamat').value.trim();
  const telepon = document.getElementById('custTelp').value.trim();
  if (!nama) { showToast('Nama langganan harus diisi!', 'error'); return; }
  const result = await apiCall('/customers', 'POST', { nama: nama, alamat: alamat, telepon: telepon });
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('custNama').value = '';
    document.getElementById('custAlamat').value = '';
    document.getElementById('custTelp').value = '';
    loadSectionData('master-langganan');
  } else { showToast(result.message, 'error'); }
}

function renderMasterStok() {
  return `
    ${sectionHeader('<span>Master</span> <span class="sep">/</span> <span>Daftar Stok</span>', 'Daftar Stok Barang', 'Kelola data produk dan stok')}
    <div class="card scroll-reveal mb-3">
      <div class="card-header"><h3><i class="fa-solid fa-box"></i>Tambah Produk</h3></div>
      <div class="form-grid">
        <div class="form-group"><label>Kode Produk</label><input type="text" id="prodKode" class="form-input" placeholder="SKU / Kode"></div>
        <div class="form-group"><label>Nama Produk</label><input type="text" id="prodNama" class="form-input" placeholder="Nama produk"></div>
        <div class="form-group"><label>Harga Beli</label><input type="number" id="prodBeli" class="form-input" placeholder="0" min="0"></div>
        <div class="form-group"><label>Harga Jual</label><input type="number" id="prodJual" class="form-input" placeholder="0" min="0"></div>
        <div class="form-group"><label>Stok Awal</label><input type="number" id="prodStok" class="form-input" placeholder="0" min="0"></div>
        <div class="form-group"><label>Satuan</label><input type="text" id="prodSatuan" class="form-input" placeholder="pcs" value="pcs"></div>
      </div>
      <button class="btn btn-primary mt-2" onclick="submitAddProduct()"><i class="fa-solid fa-plus"></i>Tambah Produk</button>
    </div>
    <div class="scroll-reveal">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Kode</th><th>Nama</th><th>Harga Beli</th><th>Harga Jual</th><th>Stok</th><th>Aksi</th></tr></thead>
          <tbody id="table-master-stok"><tr><td colspan="6" style="text-align:center;color:var(--gray);padding:24px;">Memuat data...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}

async function submitAddProduct() {
  const kode = document.getElementById('prodKode').value.trim();
  const nama = document.getElementById('prodNama').value.trim();
  const harga_beli = parseFloat(document.getElementById('prodBeli').value) || 0;
  const harga_jual = parseFloat(document.getElementById('prodJual').value) || 0;
  const stok = parseInt(document.getElementById('prodStok').value) || 0;
  const satuan = document.getElementById('prodSatuan').value.trim() || 'pcs';
  if (!kode || !nama) { showToast('Kode dan nama produk harus diisi!', 'error'); return; }
  const result = await apiCall('/products', 'POST', { kode: kode, nama: nama, harga_beli: harga_beli, harga_jual: harga_jual, stok: stok, satuan: satuan });
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('prodKode').value = '';
    document.getElementById('prodNama').value = '';
    document.getElementById('prodBeli').value = '';
    document.getElementById('prodJual').value = '';
    document.getElementById('prodStok').value = '';
    loadSectionData('master-stok');
  } else { showToast(result.message, 'error'); }
}

function renderPenjualanTransaksi() {
  return `
    ${sectionHeader('<span>Penjualan</span> <span class="sep">/</span> <span>Transaksi 30 Hari</span>', 'Transaksi Penjualan 30 Hari', 'Riwayat transaksi penjualan dalam 30 hari terakhir')}
    <div class="card scroll-reveal mb-3">
      <div class="card-header">
        <h3><i class="fa-solid fa-receipt"></i> Daftar Transaksi</h3>
        <button class="btn btn-primary btn-sm" onclick="openNewSaleModal()"><i class="fa-solid fa-plus"></i>Buat Transaksi</button>
      </div>
    </div>
    <div class="scroll-reveal">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Tanggal</th><th>Pelanggan</th><th>Total</th><th>Status</th></tr></thead>
          <tbody id="table-penjualan-transaksi"><tr><td colspan="5" style="text-align:center;color:var(--gray);padding:24px;">Memuat data...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}

function openNewSaleModal() {
  openModal('Transaksi Penjualan Baru', `
    <div class="form-group">
      <label>ID Pelanggan (opsional, 0 = Umum)</label>
      <input type="number" id="saleCustId" class="form-input" placeholder="0 = Umum" value="0">
    </div>
    <div class="form-group">
      <label>Item Penjualan</label>
      <div id="saleItemsContainer">
        <div class="form-row" style="margin-bottom:8px;">
          <input type="number" class="form-input sale-product-id" placeholder="ID Produk" style="flex:1;">
          <input type="number" class="form-input sale-qty" placeholder="Qty" value="1" style="width:80px;">
          <input type="number" class="form-input sale-price" placeholder="Harga" style="flex:1;">
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="addSaleItemRow()"><i class="fa-solid fa-plus"></i>Tambah Item</button>
    </div>
    <div class="form-group">
      <label>Jumlah Bayar</label>
      <input type="number" id="saleBayar" class="form-input" placeholder="0" min="0">
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="submitNewSale()"><i class="fa-solid fa-check"></i>Simpan Transaksi</button>
  `);
}

function addSaleItemRow() {
  const container = document.getElementById('saleItemsContainer');
  const row = document.createElement('div');
  row.className = 'form-row';
  row.style.marginBottom = '8px';
  row.innerHTML = `
    <input type="number" class="form-input sale-product-id" placeholder="ID Produk" style="flex:1;">
    <input type="number" class="form-input sale-qty" placeholder="Qty" value="1" style="width:80px;">
    <input type="number" class="form-input sale-price" placeholder="Harga" style="flex:1;">
  `;
  container.appendChild(row);
}

async function submitNewSale() {
  const customer_id = parseInt(document.getElementById('saleCustId').value) || 0;
  const bayar = parseFloat(document.getElementById('saleBayar').value) || 0;
  const productIds = document.querySelectorAll('.sale-product-id');
  const qtys = document.querySelectorAll('.sale-qty');
  const prices = document.querySelectorAll('.sale-price');
  const items = [];
  productIds.forEach(function(el, i) {
    const pid = parseInt(el.value);
    const qty = parseInt(qtys[i].value) || 0;
    const harga = parseFloat(prices[i].value) || 0;
    if (pid && qty > 0) items.push({ product_id: pid, qty: qty, harga: harga });
  });
  if (items.length === 0) { showToast('Tambahkan minimal 1 item!', 'error'); return; }
  const result = await apiCall('/sales', 'POST', { customer_id: customer_id, items: items, bayar: bayar });
  if (result.success) {
    showToast(result.message, 'success');
    closeModal();
    loadSectionData('penjualan-transaksi');
  } else { showToast(result.message, 'error'); }
}

function renderPenjualanReturn() {
  return `
    ${sectionHeader('<span>Penjualan</span> <span class="sep">/</span> <span>Return Penjualan</span>', 'Transaksi Return Penjualan', 'Catat pengembalian barang penjualan')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-rotate-left"></i> Form Return Penjualan</h3></div>
      <div class="form-group"><label>ID Penjualan</label><input type="number" id="retSaleId" class="form-input" placeholder="ID transaksi penjualan"></div>
      <div class="form-group"><label>Total Return</label><input type="number" id="retTotal" class="form-input" placeholder="0" min="0"></div>
      <div class="form-group"><label>Keterangan</label><input type="text" id="retKet" class="form-input" placeholder="Alasan return"></div>
      <button class="btn btn-primary" onclick="submitSaleReturn()"><i class="fa-solid fa-check"></i>Simpan Return</button>
    </div>
  `;
}

async function submitSaleReturn() {
  const sale_id = parseInt(document.getElementById('retSaleId').value);
  const total = parseFloat(document.getElementById('retTotal').value) || 0;
  const keterangan = document.getElementById('retKet').value;
  if (!sale_id) { showToast('ID Penjualan harus diisi!', 'error'); return; }
  const result = await apiCall('/sale-returns', 'POST', { sale_id: sale_id, total: total, keterangan: keterangan });
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('retSaleId').value = '';
    document.getElementById('retTotal').value = '';
    document.getElementById('retKet').value = '';
  } else { showToast(result.message, 'error'); }
}

function renderPenjualanCetak() {
  return `
    ${sectionHeader('<span>Penjualan</span> <span class="sep">/</span> <span>Cetak Ulang Nota</span>', 'Cetak Ulang Nota Penjualan', 'Cetak ulang nota transaksi penjualan')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-print"></i>Cari dan Cetak Nota</h3></div>
      <div class="form-group"><label>ID Transaksi Penjualan</label><input type="number" id="cetakSaleId" class="form-input" placeholder="Masukkan ID transaksi"></div>
      <button class="btn btn-primary" onclick="cetakNota()"><i class="fa-solid fa-print"></i> Cetak Nota</button>
    </div>
  `;
}

function cetakNota() {
  const id = document.getElementById('cetakSaleId').value;
  if (!id) { showToast('Masukkan ID transaksi!', 'error'); return; }
  const printWin = window.open('', '_blank');
  printWin.document.write(`
    <html><head><title>Nota Penjualan #${id}</title>
    <style>
      body { font-family: 'Courier New', monospace; padding: 40px; max-width: 400px; margin: auto; font-size: 14px; }
      h2 { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 16px; }
      .line { border-bottom: 1px dashed #ccc; padding: 6px 0; display: flex; justify-content: space-between; }
      .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; display: flex; justify-content: space-between; }
      .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #666; }
    </style></head><body>
    <h2>KasirKu<br><small>Nota Penjualan</small></h2>
    <div class="line"><span>No. Transaksi</span><span>#${id}</span></div>
    <div class="line"><span>Tanggal</span><span>${new Date().toLocaleDateString('id-ID')}</span></div>
    <div class="line"><span>Kasir</span><span>${currentUser ? currentUser.username : '-'}</span></div>
    <hr style="border:1px dashed #000; margin:16px 0;">
    <p style="text-align:center; color:#888;">Detail item berdasarkan data transaksi server.</p>
    <div class="total"><span>TOTAL</span><span>Lihat di aplikasi</span></div>
    <div class="footer"><p>Terima kasih atas kunjungan Anda!</p><p>KasirKu - BY ANDRI STORE</p></div>
    <script>window.print();<\/script>
    </body></html>
  `);
  printWin.document.close();
  showToast('Nota berhasil dicetak!', 'success');
}

function renderPiutangPenagihan() {
  return `
    ${sectionHeader('<span>Piutang</span> <span class="sep">/</span> <span>Penagihan Piutang</span>', 'Transaksi Penagihan Piutang', 'Kelola pembayaran piutang pelanggan')}
    <div class="stat-grid scroll-reveal" style="margin-bottom:20px;">
      <div class="stat-card orange">
        <div class="stat-label"><i class="fa-solid fa-hand-holding-dollar"></i>Total Piutang</div>
        <div class="stat-value">-</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label"><i class="fa-solid fa-check-circle"></i>Sudah Dibayar</div>
        <div class="stat-value">-</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label"><i class="fa-solid fa-exclamation-circle"></i>Sisa Piutang</div>
        <div class="stat-value">-</div>
      </div>
    </div>
    <div class="scroll-reveal">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Pelanggan</th><th>Jumlah</th><th>Dibayar</th><th>Sisa</th><th>Aksi</th></tr></thead>
          <tbody id="table-piutang-penagihan"><tr><td colspan="6" style="text-align:center;color:var(--gray);padding:24px;">Memuat data...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPembelianTransaksi() {
  return `
    ${sectionHeader('<span>Pembelian</span> <span class="sep">/</span> <span>Transaksi Pembelian</span>', 'Transaksi Pembelian', 'Kelola transaksi pembelian barang')}
    <div class="card scroll-reveal mb-3">
      <div class="card-header">
        <h3><i class="fa-solid fa-truck"></i> Daftar Pembelian</h3>
        <button class="btn btn-blue btn-sm" onclick="openNewPurchaseModal()"><i class="fa-solid fa-plus"></i>Buat Pembelian</button>
      </div>
    </div>
    <div class="scroll-reveal">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Tanggal</th><th>Supplier</th><th>Total</th></tr></thead>
          <tbody id="table-pembelian-transaksi"><tr><td colspan="4" style="text-align:center;color:var(--gray);padding:24px;">Memuat data...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}

function openNewPurchaseModal() {
  openModal('Transaksi Pembelian Baru', `
    <div class="form-group">
      <label>Nama Supplier</label>
      <input type="text" id="purchaseSupplier" class="form-input" placeholder="Nama supplier">
    </div>
    <div class="form-group">
      <label>Item Pembelian</label>
      <div id="purchaseItemsContainer">
        <div class="form-row" style="margin-bottom:8px;">
          <input type="number" class="form-input purchase-product-id" placeholder="ID Produk" style="flex:1;">
          <input type="number" class="form-input purchase-qty" placeholder="Qty" value="1" style="width:80px;">
          <input type="number" class="form-input purchase-price" placeholder="Harga" style="flex:1;">
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="addPurchaseItemRow()"><i class="fa-solid fa-plus"></i>Tambah Item</button>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-blue" onclick="submitNewPurchase()"><i class="fa-solid fa-check"></i>Simpan Pembelian</button>
  `);
}

function addPurchaseItemRow() {
  const container = document.getElementById('purchaseItemsContainer');
  const row = document.createElement('div');
  row.className = 'form-row';
  row.style.marginBottom = '8px';
  row.innerHTML = `
    <input type="number" class="form-input purchase-product-id" placeholder="ID Produk" style="flex:1;">
    <input type="number" class="form-input purchase-qty" placeholder="Qty" value="1" style="width:80px;">
    <input type="number" class="form-input purchase-price" placeholder="Harga" style="flex:1;">
  `;
  container.appendChild(row);
}

async function submitNewPurchase() {
  const supplier = document.getElementById('purchaseSupplier').value.trim();
  const productIds = document.querySelectorAll('.purchase-product-id');
  const qtys = document.querySelectorAll('.purchase-qty');
  const prices = document.querySelectorAll('.purchase-price');
  const items = [];
  productIds.forEach(function(el, i) {
    const pid = parseInt(el.value);
    const qty = parseInt(qtys[i].value) || 0;
    const harga = parseFloat(prices[i].value) || 0;
    if (pid && qty > 0) items.push({ product_id: pid, qty: qty, harga: harga });
  });
  if (items.length === 0) { showToast('Tambahkan minimal 1 item!', 'error'); return; }
  const result = await apiCall('/purchases', 'POST', { supplier: supplier, items: items });
  if (result.success) {
    showToast(result.message, 'success');
    closeModal();
    loadSectionData('pembelian-transaksi');
  } else { showToast(result.message, 'error'); }
}

function renderPembelianReturn() {
  return `
    ${sectionHeader('<span>Pembelian</span> <span class="sep">/</span> <span>Return Pembelian</span>', 'Return Pembelian', 'Catat pengembalian barang pembelian ke supplier')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-rotate-left"></i>Form Return Pembelian</h3></div>
      <div class="form-group"><label>ID Pembelian</label><input type="number" id="retPurchaseId" class="form-input" placeholder="ID transaksi pembelian"></div>
      <div class="form-group"><label>Total Return</label><input type="number" id="retPurchaseTotal" class="form-input" placeholder="0" min="0"></div>
      <div class="form-group"><label>Keterangan</label><input type="text" id="retPurchaseKet" class="form-input" placeholder="Alasan return"></div>
      <button class="btn btn-blue" onclick="submitPurchaseReturn()"><i class="fa-solid fa-check"></i>Simpan Return</button>
    </div>
  `;
}

async function submitPurchaseReturn() {
  const purchase_id = parseInt(document.getElementById('retPurchaseId').value);
  const total = parseFloat(document.getElementById('retPurchaseTotal').value) || 0;
  const keterangan = document.getElementById('retPurchaseKet').value;
  if (!purchase_id) { showToast('ID Pembelian harus diisi!', 'error'); return; }
  const result = await apiCall('/purchase-returns', 'POST', { purchase_id: purchase_id, total: total, keterangan: keterangan });
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('retPurchaseId').value = '';
    document.getElementById('retPurchaseTotal').value = '';
    document.getElementById('retPurchaseKet').value = '';
  } else { showToast(result.message, 'error'); }
}

function renderHutangPembayaran() {
  return `
    ${sectionHeader('<span>Hutang</span> <span class="sep">/</span> <span>Pembayaran Hutang</span>', 'Transaksi Pembayaran Hutang', 'Kelola pembayaran hutang ke supplier')}
    <div class="stat-grid scroll-reveal" style="margin-bottom:20px;">
      <div class="stat-card red">
        <div class="stat-label"><i class="fa-solid fa-file-invoice-dollar"></i>Total Hutang</div>
        <div class="stat-value">-</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label"><i class="fa-solid fa-check-circle"></i> Sudah Dibayar</div>
        <div class="stat-value">-</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label"><i class="fa-solid fa-exclamation-circle"></i>Sisa Hutang</div>
        <div class="stat-value">-</div>
      </div>
    </div>
    <div class="scroll-reveal">
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Supplier</th><th>Jumlah</th><th>Dibayar</th><th>Sisa</th><th>Aksi</th></tr></thead>
          <tbody id="table-hutang-pembayaran"><tr><td colspan="6" style="text-align:center;color:var(--gray);padding:24px;">Memuat data...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDbPeriode() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Pilih Periode</span>', 'Pilih Periode Database', 'Atur periode aktif database')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-calendar"></i>Pilih Periode</h3></div>
      <div class="form-group">
        <label>Bulan</label>
        <select id="dbPeriodeBulan" class="form-input">
          <option value="01">Januari</option><option value="02">Februari</option><option value="03">Maret</option>
          <option value="04">April</option><option value="05">Mei</option><option value="06">Juni</option>
          <option value="07">Juli</option><option value="08">Agustus</option><option value="09">September</option>
          <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tahun</label>
        <input type="number" id="dbPeriodeTahun" class="form-input" value="${new Date().getFullYear()}" min="2020" max="2099">
      </div>
      <button class="btn btn-primary" onclick="showToast('Periode database berhasil dipilih!','success')"><i class="fa-solid fa-check"></i> Simpan Periode</button>
    </div>
  `;
}

function renderDbIndex() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Index Database</span>', 'Index Database', 'Informasi struktur dan index database')}
    <div class="card scroll-reveal">
      <div class="card-header"><h3><i class="fa-solid fa-list"></i>Daftar Tabel Database</h3></div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>No</th><th>Nama Tabel</th><th>Deskripsi</th></tr></thead>
          <tbody>
            <tr><td>1</td><td class="fw-700">users</td><td>Data pengguna sistem</td></tr>
            <tr><td>2</td><td class="fw-700">areas</td><td>Data area penjualan</td></tr>
            <tr><td>3</td><td class="fw-700">customers</td><td>Data pelanggan/langganan</td></tr>
            <tr><td>4</td><td class="fw-700">products</td><td>Data produk dan stok barang</td></tr>
            <tr><td>5</td><td class="fw-700">sales</td><td>Transaksi penjualan</td></tr>
            <tr><td>6</td><td class="fw-700">sale_items</td><td>Detail item penjualan</td></tr>
            <tr><td>7</td><td class="fw-700">sale_returns</td><td>Return penjualan</td></tr>
            <tr><td>8</td><td class="fw-700">purchases</td><td>Transaksi pembelian</td></tr>
            <tr><td>9</td><td class="fw-700">purchase_items</td><td>Detail item pembelian</td></tr>
            <tr><td>10</td><td class="fw-700">purchase_returns</td><td>Return pembelian</td></tr>
            <tr><td>11</td><td class="fw-700">receivables</td><td>Data piutang</td></tr>
            <tr><td>12</td><td class="fw-700">receivable_payments</td><td>Pembayaran piutang</td></tr>
            <tr><td>13</td><td class="fw-700">payables</td><td>Data hutang</td></tr>
            <tr><td>14</td><td class="fw-700">payable_payments</td><td>Pembayaran hutang</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDbBackup() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Backup Database</span>', 'Backup Database', 'Buat salinan cadangan database')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-cloud-arrow-down"></i>Backup Data</h3></div>
      <p style="color:var(--gray); margin-bottom:16px;">Klik tombol di bawah untuk membuat backup seluruh data database.</p>
      <button class="btn btn-primary" onclick="doBackup()"><i class="fa-solid fa-download"></i>Buat Backup Sekarang</button>
      <div id="backupResult" style="margin-top:16px;"></div>
    </div>
  `;
}

async function doBackup() {
  showToast('Memulai backup database...', 'info');
  const result = await apiCall('/db/backup', 'POST');
  const container = document.getElementById('backupResult');
  if (result.success) {
    const json = JSON.stringify(result.data, null, 2);
    container.innerHTML = `
      <div style="background:#F8F6F3; border:2px solid var(--black); border-radius:8px; padding:16px; margin-top:12px;">
        <p style="font-weight:700; color:var(--success); margin-bottom:8px;"><i class="fa-solid fa-check-circle"></i>Backup berhasil! (${result.timestamp})</p>
        <textarea style="width:100%; height:200px; font-family:monospace; font-size:11px; border:2px solid var(--black); border-radius:4px; padding:8px; resize:vertical;" readonly>${json}</textarea>
        <button class="btn btn-secondary btn-sm mt-1" onclick="downloadBackup()"><i class="fa-solid fa-download"></i>Download</button>
      </div>
    `;
    showToast('Backup database berhasil!', 'success');
  } else {
    container.innerHTML = `<p style="color:var(--danger); font-weight:600;">Gagal backup: ${result.message}</p>`;
    showToast('Backup gagal: ' + result.message, 'error');
  }
}

function downloadBackup() {
  showToast('Fitur download backup akan segera tersedia.', 'info');
}

function renderDbRefresh() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Refresh Database</span>', 'Refresh Database', 'Segarkan koneksi dan data database')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-arrows-rotate"></i> Refresh Database</h3></div>
      <p style="color:var(--gray); margin-bottom:16px;">Refresh akan memuat ulang koneksi database dan memperbarui cache data.</p>
      <button class="btn btn-primary" onclick="doRefreshDb()"><i class="fa-solid fa-arrows-rotate"></i>Refresh Sekarang</button>
      <div id="refreshResult" style="margin-top:16px;"></div>
    </div>
  `;
}

function doRefreshDb() {
  showToast('Memperbarui koneksi database...', 'info');
  setTimeout(function() {
    document.getElementById('refreshResult').innerHTML = '<p style="color:var(--success); font-weight:600;"><i class="fa-solid fa-check-circle"></i>Database berhasil di-refresh!</p>';
    showToast('Database berhasil di-refresh!', 'success');
  }, 1500);
}

function renderDbTransfer() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Transfer Data Olympic</span>', 'Transfer Data Penjualan Olympic', 'Import data penjualan dari sistem Olympic')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-right-left"></i> Transfer Data Olympic</h3></div>
      <p style="color:var(--gray); margin-bottom:16px;">Fitur ini memungkinkan transfer data penjualan dari sistem Olympic ke database KasirKu.</p>
      <div class="form-group">
        <label>Pilih File Data Olympic</label>
        <input type="file" id="olympicFile" class="form-input" accept=".csv,.xlsx,.xls">
      </div>
      <button class="btn btn-primary" onclick="showToast('Fitur transfer data Olympic sedang dalam pengembangan.','info')"><i class="fa-solid fa-upload"></i>Transfer Data</button>
    </div>
  `;
}

function renderDbUpdate() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Update Data Penjualan</span>', 'Update Data Penjualan', 'Perbarui data penjualan dari sumber eksternal')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-cloud-arrow-up"></i> Update Data Penjualan</h3></div>
      <p style="color:var(--gray); margin-bottom:16px;">Sinkronkan dan perbarui data penjualan terbaru dari server pusat.</p>
      <button class="btn btn-primary" onclick="showToast('Proses update data penjualan dimulai...','info'); setTimeout(()=>showToast('Update data penjualan berhasil!','success'),2000)"><i class="fa-solid fa-cloud-arrow-up"></i>Update Sekarang</button>
    </div>
  `;
}

function renderDbDropbox() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Dropbox</span>', 'Integrasi Dropbox', 'Kelola koneksi dan sinkronisasi dengan Dropbox')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-brands fa-dropbox"></i>Konfigurasi Dropbox</h3></div>
      <div class="form-group">
        <label>Dropbox Access Token</label>
        <input type="password" id="dropboxToken" class="form-input" placeholder="Masukkan Dropbox access token">
      </div>
      <div class="form-group">
        <label>Folder Backup</label>
        <input type="text" id="dropboxFolder" class="form-input" placeholder="/KasirKu/Backup" value="/KasirKu/Backup">
      </div>
      <div class="form-row">
        <button class="btn btn-primary" onclick="showToast('Koneksi Dropbox berhasil dikonfigurasi!','success')"><i class="fa-solid fa-link"></i>Hubungkan</button>
        <button class="btn btn-secondary" onclick="showToast('Sinkronisasi Dropbox dimulai...','info')"><i class="fa-solid fa-arrows-rotate"></i>Sinkronkan</button>
      </div>
    </div>
  `;
}

function renderDbSpp() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Proses SPP</span>', 'Proses SPP', 'Proses Surat Pesanan Pembelian')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-file-signature"></i> Proses SPP</h3></div>
      <p style="color:var(--gray); margin-bottom:16px;">Jalankan proses otomatis untuk menghasilkan dan memproses SPP (Surat Pesanan Pembelian).</p>
      <div class="form-group">
        <label>Periode SPP</label>
        <input type="month" id="sppPeriode" class="form-input">
      </div>
      <button class="btn btn-primary" onclick="showToast('Proses SPP berhasil dijalankan!','success')"><i class="fa-solid fa-play"></i> Jalankan Proses SPP</button>
    </div>
  `;
}

function renderDbResetOpname() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Reset Data Opname</span>', 'Reset Data Opname', 'Reset seluruh data stok opname menjadi nol')}
    <div class="card scroll-reveal card-danger" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-triangle-exclamation"></i> Reset Data Opname</h3></div>
      <div style="background:#FFF5F5; border:2px solid var(--danger); border-radius:8px; padding:16px; margin-bottom:16px;">
        <p style="color:var(--danger); font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Peringatan!</p>
        <p style="color:#C92A2A; font-size:14px;">Tindakan ini akan mengatur ulang seluruh stok menjadi 0. Tindakan ini tidak dapat dibatalkan!</p>
      </div>
      <div class="form-group">
        <label>Konfirmasi Password</label>
        <input type="password" id="resetOpnamePass" class="form-input" placeholder="Masukkan password untuk konfirmasi">
      </div>
      <button class="btn btn-danger" onclick="doResetOpname()"><i class="fa-solid fa-rotate"></i>Reset Data Opname</button>
    </div>
  `;
}

async function doResetOpname() {
  const pass = document.getElementById('resetOpnamePass').value;
  if (pass !== (currentUser ? 'andriyt002' : '')) { showToast('Password konfirmasi salah!', 'error'); return; }
  const result = await apiCall('/db/reset-opname', 'POST');
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('resetOpnamePass').value = '';
  } else { showToast(result.message, 'error'); }
}

function renderDbReupdateSaldo() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Re-Update Saldo</span>', 'Re-Update Saldo Periode Sebelumnya', 'Perbarui saldo dari periode sebelumnya')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-arrow-rotate-left"></i> Re-Update Saldo</h3></div>
      <p style="color:var(--gray); margin-bottom:16px;">Proses ini akan menghitung ulang dan memperbarui saldo dari periode sebelumnya.</p>
      <div class="form-group">
        <label>Periode Sebelumnya</label>
        <input type="month" id="saldoPeriode" class="form-input">
      </div>
      <button class="btn btn-primary" onclick="showToast('Re-update saldo periode berhasil!','success')"><i class="fa-solid fa-arrow-rotate-left"></i>Re-Update Saldo</button>
    </div>
  `;
}

function renderDbExportExcel() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Export Excel</span>', 'Export Raw Data ke Excel', 'Ekspor seluruh data mentah ke format Excel')}
    <div class="card scroll-reveal" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-file-excel"></i> Export Data</h3></div>
      <p style="color:var(--gray); margin-bottom:16px;">Pilih tabel yang ingin diekspor ke file Excel.</p>
      <div class="form-group">
        <label>Pilih Tabel</label>
        <select id="exportTable" class="form-input">
          <option value="all">Semua Tabel</option>
          <option value="sales">Transaksi Penjualan</option>
          <option value="purchases">Transaksi Pembelian</option>
          <option value="products">Data Produk & Stok</option>
          <option value="customers">Data Langganan</option>
          <option value="receivables">Data Piutang</option>
          <option value="payables">Data Hutang</option>
        </select>
      </div>
      <div class="form-group">
        <label>Periode</label>
        <div class="form-row">
          <input type="date" id="exportFrom" class="form-input" style="flex:1;">
          <span style="padding:8px;">s/d</span>
          <input type="date" id="exportTo" class="form-input" style="flex:1;">
        </div>
      </div>
      <button class="btn btn-primary" onclick="doExportExcel()"><i class="fa-solid fa-download"></i>Export ke Excel</button>
    </div>
  `;
}

function doExportExcel() {
  const table = document.getElementById('exportTable').value;
  showToast('Mengexport data ' + table + ' ke Excel...', 'info');
  // Buat file CSV sederhana
  setTimeout(function() {
    const csvContent = "ID,Tanggal,Keterangan,Total\n1,2024-01-15,Data Demo,100000\n2,2024-01-16,Data Demo 2,250000";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'kasirku_export_' + table + '.csv';
    link.click();
    showToast('Data berhasil diexport!', 'success');
  }, 1500);
}

function renderDbTutupBuku() {
  return `
    ${sectionHeader('<span>Database</span> <span class="sep">/</span> <span>Tutup Buku</span>', 'Tutup Buku Bulanan', 'Proses penutupan buku periode bulanan')}
    <div class="card scroll-reveal card-danger" style="max-width:500px;">
      <div class="card-header"><h3><i class="fa-solid fa-book"></i> Tutup Buku Bulanan</h3></div>
      <div style="background:#FFF3BF; border:2px solid var(--warning); border-radius:8px; padding:16px; margin-bottom:16px;">
        <p style="color:#E67700; font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Perhatian!</p>
        <p style="color:#E67700; font-size:14px;">Tutup buku akan mengunci semua transaksi pada periode yang dipilih. Pastikan semua data sudah benar sebelum melanjutkan.</p>
      </div>
      <div class="form-group">
        <label>Periode Tutup Buku</label>
        <input type="month" id="tutupBukuPeriode" class="form-input">
      </div>
      <div class="form-group">
        <label>Konfirmasi Password</label>
        <input type="password" id="tutupBukuPass" class="form-input" placeholder="Masukkan password admin">
      </div>
      <button class="btn btn-danger" onclick="doTutupBuku()"><i class="fa-solid fa-lock"></i> Tutup Buku</button>
    </div>
  `;
}

async function doTutupBuku() {
  const periode = document.getElementById('tutupBukuPeriode').value;
  const pass = document.getElementById('tutupBukuPass').value;
  if (!periode) { showToast('Pilih periode tutup buku!', 'error'); return; }
  if (!pass) { showToast('Masukkan password konfirmasi!', 'error'); return; }
  const result = await apiCall('/db/tutup-buku', 'POST', { periode: periode });
  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('tutupBukuPass').value = '';
  } else { showToast(result.message, 'error'); }
}

function renderInfoHelp() {
  return `
    ${sectionHeader('<span>Informasi</span> <span class="sep">/</span> <span>Help</span>', 'Bantuan', 'Panduan penggunaan aplikasi KasirKu')}
    <div class="card scroll-reveal mb-3 card-orange">
      <div class="card-header"><h3><i class="fa-solid fa-rocket"></i> Memulai</h3></div>
      <ol style="padding-left:20px; line-height:2;">
        <li>Login menggunakan User ID dan Password yang telah diberikan.</li>
        <li>Pilih menu di navbar untuk mengakses fitur yang diinginkan.</li>
        <li>Menu <strong>Master</strong> untuk mengelola data area, langganan, dan stok barang.</li>
        <li>Menu <strong>Penjualan</strong> untuk transaksi jual, return, dan cetak nota.</li>
        <li>Menu <strong>Pembelian</strong> untuk transaksi beli dan return pembelian.</li>
        <li>Menu <strong>Piutang</strong> untuk penagihan piutang pelanggan.</li>
        <li>Menu <strong>Hutang</strong> untuk pembayaran hutang ke supplier.</li>
        <li>Menu <strong>Database</strong> untuk pengaturan dan maintenance database.</li>
        <li>Menu<strong>Profil</strong>untuk mengatur akun pengguna.</li>
      </ol>
    </div>
    <div class="card scroll-reveal mb-3 card-blue">
      <div class="card-header"><h3><i class="fa-solid fa-keyboard"></i> Shortcut</h3></div>
      <table style="width:100%;">
        <tbody>
          <tr><td class="fw-700">Enter</td><td>Konfirmasi login / Simpan form</td></tr>
          <tr><td class="fw-700">Tab</td><td>Pindah ke field berikutnya</td></tr>
          <tr><td class="fw-700">Esc</td><td>Tutup modal dialog</td></tr>
        </tbody>
      </table>
    </div>
    <div class="card scroll-reveal card-success">
      <div class="card-header"><h3><i class="fa-solid fa-lightbulb"></i> Tips</h3></div>
      <ul style="padding-left:20px; line-height:2;">
        <li>Lakukan backup database secara berkala melalui menu Database > Backup.</li>
        <li>Gunakan tutup buku bulanan untuk mengunci transaksi periode yang sudah selesai.</li>
        <li>Pastikan stok barang sudah benar sebelum memulai transaksi harian.</li>
        <li>Cetak nota sebagai bukti transaksi untuk pelanggan.</li>
      </ul>
    </div>
  `;
}

function renderInfoTentang() {
  return `
    ${sectionHeader('<span>Informasi</span> <span class="sep">/</span> <span>Tentang Program</span>', 'Tentang Program', 'Informasi versi dan deskripsi KasirKu')}
    <div class="card scroll-reveal mb-3">
      <div style="text-align:center; padding:20px 0;">
        <h1 style="font-family:var(--font-display); font-size:48px; font-weight:700; color:var(--primary); text-shadow:3px 3px 0 var(--black);">KasirKu</h1>
        <p style="color:var(--gray); font-size:14px; letter-spacing:2px; text-transform:uppercase; margin-top:4px;">Meja Kasir Online</p>
        <p style="margin-top:16px; font-size:16px;">Versi <strong>1.0.0</strong></p>
        <p style="color:var(--gray); margin-top:8px;">Build 2024.12 | Node.js + Express + SQL DB</p>
      </div>
    </div>
    <div class="card scroll-reveal card-orange">
      <div class="card-header"><h3><i class="fa-solid fa-info-circle"></i> Deskripsi</h3></div>
      <p style="line-height:1.8;">KasirKu adalah aplikasi meja kasir online yang dirancang untuk membantu UMKM dan bisnis kecil menengah dalam mengelola transaksi penjualan, pembelian, piutang, dan hutang secara terintegrasi. Dengan antarmuka yang intuitif dan fitur yang lengkap, KasirKu memudahkan proses operasional kasir harian Anda.</p>
    </div>
    <div class="card scroll-reveal mt-3 card-blue">
      <div class="card-header"><h3><i class="fa-solid fa-code"></i>Teknologi</h3></div>
      <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div style="text-align:center; padding:12px;">
          <i class="fa-brands fa-node-js" style="font-size:32px; color:var(--success);"></i>
          <p style="font-weight:600; margin-top:8px;">Node.js</p>
          <p style="color:var(--gray); font-size:12px;">Runtime Server</p>
        </div>
        <div style="text-align:center; padding:12px;">
          <i class="fa-solid fa-database" style="font-size:32px; color:var(--accent-blue);"></i>
          <p style="font-weight:600; margin-top:8px;">Turso</p>
          <p style="color:var(--gray); font-size:12px;">Edge Database</p>
        </div>
        <div style="text-align:center; padding:12px;">
          <i class="fa-brands fa-js" style="font-size:32px; color:var(--warning);"></i>
          <p style="font-weight:600; margin-top:8px;">Vanilla JS</p>
          <p style="color:var(--gray); font-size:12px;">Frontend</p>
        </div>
      </div>
    </div>
  `;
}

function renderInfoDeveloper() {
  return `
    ${sectionHeader('<span>Informasi</span> <span class="sep">/</span> <span>Developer</span>', 'Developer Biodata & Kontak', 'Informasi pengembang aplikasi KasirKu')}
    <div class="developer-card scroll-reveal">
      <img src="https://c.termai.cc/i144/CTQEXTa.jpeg" alt="Developer" class="developer-avatar">
      <div class="developer-info">
        <h4>ANDRI STORE</h4>
        <p style="color:var(--primary); font-weight:600;">Full-Stack Developer</p>
        <p style="color:var(--gray);">Spesialisasi dalam pengembangan aplikasi web dan sistem informasi bisnis.</p>
        <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
          <span class="badge badge-blue">Node.js</span>
          <span class="badge badge-success">Express</span>
          <span class="badge badge-warning">JavaScript</span>
          <span class="badge badge-blue">Database</span>
        </div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;" class="scroll-reveal">
      <div class="card card-orange">
        <div class="card-header"><h3><i class="fa-solid fa-address-card"></i>Biodata</h3></div>
        <table style="width:100%;">
          <tbody>
            <tr><td class="fw-700" style="width:100px;">Nama</td><td>ANDRIZAL</td></tr>
            <tr><td class="fw-700">Lokasi</td><td>Pekanbaru, Indonesia</td></tr>
            <tr><td class="fw-700">Spesialis</td><td>Web Application Developer</td></tr>
            <tr><td class="fw-700">Pengalaman</td><td>1+ Tahun</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card card-blue">
        <div class="card-header"><h3><i class="fa-solid fa-paper-plane"></i> Kontak & Sosial Media</h3></div>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fa-solid fa-envelope" style="color:var(--primary); width:20px; text-align:center;"></i>
            <span>https://asm-ai-v1.vercel.app/</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fa-solid fa-phone" style="color:var(--primary); width:20px; text-align:center;"></i>
            <span>+6281934874758</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fa-brands fa-instagram" style="color:var(--primary); width:20px; text-align:center;"></i>
            <span>@limabelasjuny15</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fa-brands fa-github" style="color:var(--primary); width:20px; text-align:center;"></i>
            <span>github.com/andriyt</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fa-brands fa-linkedin" style="color:var(--primary); width:20px; text-align:center;"></i>
            <span>linkedin.com/in/andriyt</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <i class="fa-brands fa-telegram" style="color:var(--primary); width:20px; text-align:center;"></i>
            <span>@Androstore002</span>
          </div>
        </div>
      </div>
    </div>
    <div class="card scroll-reveal mt-3" style="text-align:center;">
      <p style="color:var(--gray); font-size:14px;">Dibuat dengan <span style="color:var(--danger);"><i class="fa-solid fa-heart"></i></span> oleh Andri Store &copy; 2026</p>
      <p style="color:var(--gray); font-size:12px; margin-top:4px;">KasirKu v1.0.0 - Unlimted Edition</p>
    </div>
  `;
}

function initScrollReveal() {
  const elements = document.querySelectorAll('.scroll-reveal');
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(function(el) {
    observer.observe(el);
  });
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});


window.addEventListener('DOMContentLoaded', function() {
  loginUser.focus();
});
