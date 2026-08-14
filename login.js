// ================================================================
//  SISTEM LOGIN — Username + Password (localStorage)
// ================================================================
const USERS_KEY = 'gdg_users_v1';
const SESSION_KEY = 'gdg_session_v1';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 jam

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', nama: 'Admin' }
];

function simpleHash(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'simple:' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

async function hashPassword(password) {
  const raw = 'gudang-sistem:' + password;
  try {
    if (window.crypto && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return 'sha256:' + Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  return simpleHash(raw);
}

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function seedDefaultUsers() {
  const users = readUsers();
  if (users.length > 0) return users;
  for (const u of DEFAULT_USERS) {
    users.push({ username: u.username, passwordHash: await hashPassword(u.password), nama: u.nama });
  }
  saveUsers(users);
  return users;
}

async function login(username, password) {
  const users = await seedDefaultUsers();
  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) return { ok: false, message: 'Username tidak ditemukan.' };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { ok: false, message: 'Password salah.' };
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    username: user.username,
    nama: user.nama,
    loginAt: Date.now()
  }));
  return { ok: true, user };
}

async function changePassword(username, oldPassword, newPassword, confirmPassword) {
  const users = await seedDefaultUsers();
  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) return { ok: false, message: 'Username tidak ditemukan.' };
  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== user.passwordHash) return { ok: false, message: 'Password lama salah.' };
  if (!newPassword || newPassword.length < 4) return { ok: false, message: 'Password baru minimal 4 karakter.' };
  if (newPassword !== confirmPassword) return { ok: false, message: 'Konfirmasi password tidak sama.' };
  user.passwordHash = await hashPassword(newPassword);
  saveUsers(users);
  return { ok: true, message: 'Password berhasil diganti.' };
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s.username || Date.now() - (s.loginAt || 0) > SESSION_DURATION_MS) {
      logout();
      return null;
    }
    return s;
  } catch (e) {
    return null;
  }
}

function isAuthenticated() {
  return !!getSession();
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.replace('login.html');
    return false;
  }
  return true;
}

// ================================================================
//  UI BINDING
// ================================================================
document.addEventListener('DOMContentLoaded', function () {

  // --- Halaman login ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errEl = document.getElementById('loginError');
      const btn = document.getElementById('loginBtn');
      if (!username || !password) {
        errEl.textContent = 'Isi username dan password.';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Memproses...';
      const res = await login(username, password);
      if (res.ok) {
        window.location.replace('hp.html');
      } else {
        errEl.textContent = res.message;
        btn.disabled = false;
        btn.innerHTML = '<i data-feather="log-in"></i> Masuk';
        feather.replace();
      }
    });
  }

  // --- Tombol keluar (dashboard & HP) ---
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', function () {
      logout();
      window.location.replace('login.html');
    });
  });

  // --- Ganti password (modal di sidebar desktop) ---
  const changePasswordMenuBtn = document.getElementById('changePasswordBtn');
  const cpModal = document.getElementById('changePasswordModal');
  if (changePasswordMenuBtn && cpModal) {
    changePasswordMenuBtn.addEventListener('click', function () {
      const session = getSession();
      const usernameInput = document.getElementById('cpUsername');
      const msgEl = document.getElementById('cpMessage');
      if (usernameInput) usernameInput.value = session ? session.username : '';
      ['cpOldPassword', 'cpNewPassword', 'cpConfirmPassword'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      if (msgEl) {
        msgEl.textContent = '';
        msgEl.className = '';
      }
      cpModal.classList.add('is-visible');
    });

    const cancelCpBtn = document.getElementById('cancelChangePasswordBtn');
    if (cancelCpBtn) cancelCpBtn.addEventListener('click', function () {
      cpModal.classList.remove('is-visible');
    });

    cpModal.addEventListener('click', function (event) {
      if (event.target === cpModal) cpModal.classList.remove('is-visible');
    });

    const saveCpBtn = document.getElementById('saveChangePasswordBtn');
    if (saveCpBtn) saveCpBtn.addEventListener('click', async function () {
      const username = document.getElementById('cpUsername').value.trim();
      const oldPass = document.getElementById('cpOldPassword').value;
      const newPass = document.getElementById('cpNewPassword').value;
      const confirmPass = document.getElementById('cpConfirmPassword').value;
      const msgEl = document.getElementById('cpMessage');
      if (!username || !oldPass || !newPass || !confirmPass) {
        if (msgEl) {
          msgEl.textContent = 'Lengkapi semua field.';
          msgEl.className = 'password-msg error';
        }
        return;
      }
      saveCpBtn.disabled = true;
      saveCpBtn.textContent = 'Menyimpan...';
      const res = await changePassword(username, oldPass, newPass, confirmPass);
      if (msgEl) {
        msgEl.textContent = res.message;
        msgEl.className = 'password-msg ' + (res.ok ? 'success' : 'error');
      }
      saveCpBtn.disabled = false;
      saveCpBtn.innerHTML = '<i data-feather="lock"></i> Simpan Password';
      if (res.ok) {
        setTimeout(() => cpModal.classList.remove('is-visible'), 1200);
      }
    });
  }

  // --- Tampilkan nama pengguna yang sedang login ---
  const session = getSession();
  if (session) {
    const dashboardEl = document.getElementById('sidebarUserInfo');
    if (dashboardEl) dashboardEl.textContent = 'Halo, ' + session.nama;
    const hpEl = document.getElementById('hpUserInfo');
    if (hpEl) hpEl.textContent = session.nama;
  }

  // --- Toggle lihat / sembunyikan password ---
  document.querySelectorAll('.pw-input-wrap').forEach(wrap => {
    const input = wrap.querySelector('input');
    const btn = wrap.querySelector('.pw-toggle');
    if (!input || !btn) return;
    btn.addEventListener('click', function () {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      this.innerHTML = '<i data-feather="' + (isPassword ? 'eye-off' : 'eye') + '"></i>';
      if (typeof feather !== 'undefined') feather.replace();
      input.focus();
    });
  });
});
