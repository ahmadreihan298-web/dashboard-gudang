// ================================================================
//  NAVIGASI
// ================================================================
const menuList = document.querySelector('.menu-list');
const pages = document.querySelectorAll('.page');

function smoothToggle(container, show) {
  container.style.display = show ? 'block' : 'none';
  container.classList.toggle('is-visible', show);
}

menuList.addEventListener('click', function (event) {
  const clickedItem = event.target.closest('.menu-item');

  // Do nothing if the click is not on a menu item
  if (!clickedItem) {
    return;
  }

  // Handle Delete All button
  if (clickedItem.id === 'deleteAllBtn') {
    const confirmation = confirm('PERINGATAN: Anda akan menghapus SEMUA data barang, riwayat barang keluar, gudang, transaksi keuangan, dan riwayat pengiriman ke Putri. Aksi ini tidak dapat dibatalkan.\n\nApakah Anda yakin ingin melanjutkan?');
    if (confirmation) {
      dataBarang = []; // Hapus semua data
      dataBarangKeluar = [];
      gudangList = [];
      if (typeof dataKeuangan !== 'undefined') dataKeuangan = [];
      nextBarangKeluarId = 1;
      if (typeof nextKeuanganId !== 'undefined') nextKeuanganId = 1;
      if (typeof kirimPutriHistory !== 'undefined') kirimPutriHistory = [];
      if (typeof nextKpId !== 'undefined') nextKpId = 1;
      filterKode = '__semua'; // Reset filter
      populateFilter();
      renderAll();
      renderRiwayatBarangKeluar();
      renderRiwayatBarangKeluarHP();
      if (typeof renderRiwayatPemasukan === 'function') renderRiwayatPemasukan();
      if (typeof renderRiwayatPengeluaran === 'function') renderRiwayatPengeluaran();
      if (typeof renderKirimPutriHistory === 'function') renderKirimPutriHistory();
      saveAllData();
      alert('Semua data telah berhasil dihapus.');
    }
    return; // Stop after handling action
  }

  // Handle Theme Switcher
  if (clickedItem.id === 'theme-switcher') {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    return; // Stop after handling theme switch
  }

  // Handle Pindah Perangkat (langsung tukar ke mode HP)
  if (clickedItem.id === 'deviceSwitcher') {
    window.location.href = 'hp.html';
    return; // Stop after handling device switch
  }

  // Handle regular navigation
  if (clickedItem.dataset.page) {
    // Update active state on all menu items
    const allMenuItems = menuList.querySelectorAll('.menu-item');
    allMenuItems.forEach(m => m.classList.remove('active'));
    clickedItem.classList.add('active');

    // Show the correct page
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + clickedItem.dataset.page).classList.add('active');

    // Re-render tables if needed
    if (clickedItem.dataset.page === 'home') renderHomePage();
    if (clickedItem.dataset.page === 'barangMasuk') renderBarangMasuk();
    if (clickedItem.dataset.page === 'dataBarang') renderDataBarang();
    if (clickedItem.dataset.page === 'barangKeluar') {
      populateBarangKeluarForm();
      renderRiwayatBarangKeluar();
    }
    if (clickedItem.dataset.page === 'gudang') {
      renderGudang();
      renderGudangItemTable();
    }
    if (clickedItem.dataset.page === 'keuangan') {
      renderRiwayatPemasukan();
      renderRiwayatPengeluaran();
      feather.replace();
    }
    if (clickedItem.dataset.page === 'kirimPutri') {
      if (typeof initKirimPutri === 'function') initKirimPutri();
    }
  }
});

// ================================================================
//  HALAMAN UTAMA (DASHBOARD)
// ================================================================
const LOW_STOCK_THRESHOLD = 50; // Menampilkan barang dengan stok 50 atau kurang (termasuk stok habis)

function renderHomePage() {
  // Render Low Stock Table (stok 0 - 50, termasuk yang habis)
  const lowStockItems = dataBarang
    .filter(item => item.datang >= 0 && item.datang <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.datang - b.datang); // Urutkan dari stok paling sedikit

  const tabelStokRendah = document.getElementById('tabelStokRendah');
  if (tabelStokRendah) { // Pastikan elemen tabel ada
    if (lowStockItems.length === 0) {
      tabelStokRendah.innerHTML = `<tr><td colspan="3" class="empty-table">Tidak ada barang dengan stok rendah</td></tr>`;
    } else {
      let html = '';
      lowStockItems.forEach(item => {
        html += `
          <tr>
            <td>${item.nama}</td>
            <td>${item.gudang || 'N/A'}</td>
            <td class="text-right" style="color: #ef4444; font-weight: 700;">${item.datang.toLocaleString('id-ID')}</td>
          </tr>
        `;
      });
      tabelStokRendah.innerHTML = html;
    }
  }

  // Pastikan ikon dirender dengan benar
  feather.replace(); // To render icons on the dashboard

  updateTotalPendapatanKeluar();
}

// Jam dashboard berjalan real-time agar halaman terasa aktif.
function updateDashboardClock() {
  const clock = document.getElementById('dashboardClock');
  const date = document.getElementById('dashboardDate');
  if (!clock || !date) return;

  const now = new Date();
  clock.textContent = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  date.textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

updateDashboardClock();
setInterval(updateDashboardClock, 1000);

function exportStokRendahCsv() {
  const headers = ['Nama Barang', 'Gudang', 'Sisa Stok'];
  const rows = dataBarang
    .filter(item => item.datang >= 0 && item.datang <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.datang - b.datang)
    .map(item => [item.nama, item.gudang || 'N/A', item.datang]);
  exportTableToCsv('barang_stok_rendah.csv', headers, rows);
}

// Quick Actions Event Listeners
document.getElementById('quick-action-pindah').addEventListener('click', () => {
  document.querySelector('.menu-item[data-page="gudang"]').click();
  // Small delay to ensure page is visible before opening form
  setTimeout(() => document.getElementById('toggleMoveWarehouseFormBtn').click(), 50);
});

document.getElementById('quick-action-tambah-gudang').addEventListener('click', () => {
  document.querySelector('.menu-item[data-page="gudang"]').click();
  setTimeout(() => document.getElementById('toggleAddWarehouseFormBtn').click(), 50);
});

document.getElementById('quick-action-upload').addEventListener('click', () => {
  document.querySelector('.menu-item[data-page="barangMasuk"]').click();
  setTimeout(() => document.getElementById('csvFileInput').click(), 50);
});

document.getElementById('quick-action-barang-masuk').addEventListener('click', () => {
  document.querySelector('.menu-item[data-page="barangMasuk"]').click();
});

document.addEventListener('DOMContentLoaded', () => {
  // Panggil renderHomePage saat DOM siap
  if (document.querySelector('#page-home.active')) {
    renderHomePage();
  }
});

// ================================================================
//  TOGGLE SIDEBAR
// ================================================================
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
let sidebarOpen = true;

function isMobile() {
  return window.innerWidth <= 768;
}

function updateSidebarState() {
  if (isMobile()) {
    sidebar.classList.toggle('mobile-open', sidebarOpen);
    sidebar.classList.toggle('collapsed', false);
    if (sidebarOverlay) {
      sidebarOverlay.style.display = sidebarOpen ? 'block' : 'none';
      sidebarOverlay.classList.toggle('is-visible', sidebarOpen);
    }
  } else {
    sidebar.classList.toggle('collapsed', !sidebarOpen);
    sidebar.classList.remove('mobile-open');
    if (sidebarOverlay) {
      sidebarOverlay.style.display = 'none';
      sidebarOverlay.classList.remove('is-visible');
    }
  }
}

toggleBtn.addEventListener('click', function () {
  sidebarOpen = !sidebarOpen;
  updateSidebarState();
});

window.addEventListener('resize', function () {
  updateSidebarState();
});

// Initial state
updateSidebarState();

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function (e) {
  if (isMobile() && sidebarOpen) {
    const clickedInside = sidebar.contains(e.target) || toggleBtn.contains(e.target);
    if (!clickedInside) {
      sidebarOpen = false;
      updateSidebarState();
    }
  }
});

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', function () {
    if (isMobile() && sidebarOpen) {
      sidebarOpen = false;
      updateSidebarState();
    }
  });
}

