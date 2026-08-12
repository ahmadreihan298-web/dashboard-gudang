// ================================================================
//  PENCARIAN (SEARCH)
// ================================================================
function setupSearch(inputId, tbodyId) {
  const input = document.getElementById(inputId);
  const tbody = document.getElementById(tbodyId);
  if (!input || !tbody) return;

  input.addEventListener('input', function () {
    const term = this.value.toLowerCase().trim();
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
      if (row.classList.contains('empty-table')) return;
      const text = row.innerText.toLowerCase();
      // Tampilkan baris jika kosong (belum ada pencarian) atau kata kunci cocok
      row.style.display = (!term || text.includes(term)) ? '' : 'none';
    });
  });
}

setupSearch('searchDataBarang', 'tabelBody');
setupSearch('searchBarangMasuk', 'tabelMasuk');
setupSearch('searchGudangItem', 'tabelGudangItem');

// ================================================================
//  INIT
// ================================================================
function refreshAppViews() {
  populateFilter();
  renderDataBarang();
  renderBarangMasuk();
  renderGudang();
  renderGudangItemTable();
  populateBarangKeluarForm(); // Panggil agar form terisi saat pertama kali load
  renderHomePage();
}

function initApp() {
  // Data lokal langsung ditampilkan; Firebase disinkronkan di background.
  loadAllData();
  refreshAppViews();

  // Mobile: default tampilkan halaman Barang Keluar (satu-satunya menu di HP)
  if (window.innerWidth <= 768) {
    const keluarMenu = document.querySelector('.menu-item[data-page="barangKeluar"]');
    if (keluarMenu) keluarMenu.click();
  }
}
initApp();

// ================================================================
//  THEME TOGGLE
// ================================================================
const themeSwitcherIcon = document.querySelector('#theme-switcher .icon i');

function applyTheme(theme) {
  document.body.classList.toggle('dark-mode', theme === 'dark');
  if (themeSwitcherIcon) {
    themeSwitcherIcon.setAttribute('data-feather', theme === 'dark' ? 'sun' : 'moon');
    feather.replace();
  }
  localStorage.setItem('theme', theme);
}

// Initial theme load
const initialTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(initialTheme);

