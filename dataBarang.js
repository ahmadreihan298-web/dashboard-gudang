// ================================================================
//  DATA BARANG
// ================================================================
let sortKey = 'supplier';
let sortAsc = true;
let filterKode = '__semua';

const filterSelect = document.getElementById('filterKode');
function populateFilter() {
  const kodes = getAllUniqueKodes(dataBarang);
  filterSelect.innerHTML = '<option value="__semua">Semua Kode</option>';
  kodes.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    filterSelect.appendChild(opt);
  });
  filterSelect.value = filterKode;
}

const tbody = document.getElementById('tabelBody');
const totalDataSpan = document.getElementById('totalData');
const arrowSupplier = document.getElementById('arrowSupplier');
const arrowTanggal = document.getElementById('arrowTanggal');
const arrowKode = document.getElementById('arrowKode');

// ================================================================
//  HALAMAN SISA
// ================================================================
function renderSisa() {
  const container = document.getElementById('tabelSisa');
  if (!container) return;

  const sorted = [...dataBarang].sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id'));
  if (sorted.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="empty-table">Tidak ada data</td></tr>`;
    return;
  }
  container.innerHTML = sorted.map((item, index) => {
    const badgeHtml = splitKode(item.kode).map(k => `<span class="badge">${k}</span>`).join(' ');
    const sisa = item.sisa || 0;
    return `<tr>
      <td>${index + 1}</td>
      <td>${badgeHtml}</td>
      <td>${item.nama}</td>
      <td>${item.supplier}</td>
      <td class="text-right"><input type="number" class="input-sisa-stok" data-idx="${item._idx}" min="0" value="${sisa}" style="width:140px; text-align:center; height:36px; border:1px solid var(--border-color); border-radius: var(--radius-md); padding:0 10px;" /></td>
    </tr>`;
  }).join('');
}

document.getElementById('tabelSisa')?.addEventListener('change', function (event) {
  const input = event.target;
  if (!input.classList.contains('input-sisa-stok')) return;
  const idx = parseInt(input.dataset.idx, 10);
  const item = dataBarang.find(i => i._idx === idx);
  if (!item) return;
  const val = parseInt(input.value, 10);
  item.sisa = isNaN(val) || val < 0 ? 0 : val;
  saveAllData();
  renderGudang();
  renderGudangItemTable();
});

document.getElementById('tabelSisa')?.addEventListener('keydown', function (event) {
  if (event.key !== 'Enter') return;
  const input = event.target;
  if (!input.classList.contains('input-sisa-stok')) return;
  const idx = parseInt(input.dataset.idx, 10);
  const item = dataBarang.find(i => i._idx === idx);
  if (!item) return;
  const val = parseInt(input.value, 10);
  item.sisa = isNaN(val) || val < 0 ? 0 : val;
  saveAllData();
  renderGudang();
  renderGudangItemTable();
  showSisaDoneToast();
});

function showSisaDoneToast() {
  const existing = document.getElementById('sisa-done-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'sisa-done-toast';
  toast.innerHTML = '<div style="display:flex; flex-direction:column; align-items:center; gap:14px;"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="font-size:16px; font-family:sans-serif; color:#333;">Stok sudah ditambahkan ke gudang</span></div>';
  toast.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid #e2e2e2; border-radius:16px; box-shadow:0 12px 32px rgba(0,0,0,.18); padding:28px 36px; z-index:9999; opacity:0; transition:opacity .25s ease, transform .25s ease;';
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%,-50%) scale(1.05)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%,-50%) scale(1)';
    setTimeout(() => toast.remove(), 250);
  }, 1800);
}

// Navigasi geser tabel Data Barang
(function setupDataTableScroll() {
  const wrapper = document.querySelector('#page-dataBarang .table-wrapper');
  const btnLeft = document.getElementById('scrollDataLeft');
  const btnRight = document.getElementById('scrollDataRight');
  if (!wrapper || !btnLeft || !btnRight) return;

  const scrollByAmount = () => wrapper.clientWidth * 0.8;

  function updateNavState() {
    const maxLeft = wrapper.scrollWidth - wrapper.clientWidth;
    btnLeft.disabled = wrapper.scrollLeft <= 1;
    btnRight.disabled = wrapper.scrollLeft >= maxLeft - 1;
  }

  btnLeft.addEventListener('click', () => {
    wrapper.scrollBy({ left: -scrollByAmount(), behavior: 'smooth' });
  });

  btnRight.addEventListener('click', () => {
    wrapper.scrollBy({ left: scrollByAmount(), behavior: 'smooth' });
  });

  wrapper.addEventListener('scroll', updateNavState);
  window.addEventListener('resize', updateNavState);
  updateNavState();
})();
const sortStatus = document.getElementById('sortStatus');
const jumlahFilter = document.getElementById('jumlahFilter');

const SORT_LABELS = { supplier: 'Supplier', tanggal: 'Tanggal', kode: 'Kode' };

function getSortValue(item, key) {
  if (key === 'tanggal') return item.tanggal || '';
  if (key === 'kode') return (item.kode || '').toUpperCase();
  return (item.supplier || '').toUpperCase();
}

function renderDataBarang() {
  let filtered = dataBarang;
  if (filterKode !== '__semua') {
    filtered = dataBarang.filter(item => splitKode(item.kode).includes(filterKode));
  }
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    const va = getSortValue(a, sortKey);
    const vb = getSortValue(b, sortKey);
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  // Indicator panah: hanya kolom aktif yang menampilkan arah urutan
  [arrowSupplier, arrowTanggal, arrowKode].forEach(arrow => {
    arrow.textContent = '↕';
    arrow.classList.remove('active');
  });
  const activeArrow = sortKey === 'supplier' ? arrowSupplier : sortKey === 'tanggal' ? arrowTanggal : arrowKode;
  activeArrow.textContent = sortAsc ? '↑' : '↓';
  activeArrow.classList.add('active');

  sortStatus.textContent = `${SORT_LABELS[sortKey]} ${sortAsc ? 'A–Z' : 'Z–A'}`;

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14" class="empty-table">Tidak ada data</td></tr>`;
  } else {
    let html = '';
    sorted.forEach((item, index) => {
      const totalPesan = getTotalPesan(item);
      const badgeHtml = splitKode(item.kode).map(k => `<span class="badge">${k}</span>`).join(' '); // Format for display
      html += `<tr id="item-row-${item._idx}">
        <td>${index + 1}</td>
        <td>${reverseDateFormat(item.tanggal)}</td>
        <td>${badgeHtml}</td>
        <td>${item.nama}</td>
        <td>${item.supplier}</td>
        <td>${item.gudang}</td>
        <td class="text-right">${totalPesan.toLocaleString('id-ID')}</td>
        <td class="text-right">${item.datang.toLocaleString('id-ID')}</td>
        <td class="text-right">${item.kiriman}</td>
        <td class="text-right">Rp ${item.hargaSatuan.toLocaleString('id-ID')}</td>
        <td class="text-right">Rp ${item.hargaJual.toLocaleString('id-ID')}</td>
        <td style="text-align: center;">
          <button class="btn-show-history" data-idx="${item._idx}">Lihat</button>
        </td>
        <td style="text-align: center;">
          <button class="btn-add-order" data-idx="${item._idx}">+ Pesan</button>
        </td>
        <td style="text-align: center;">
          <button class="btn-edit" data-idx="${item._idx}"><i data-feather="edit-2"></i></button>
        </td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }
  totalDataSpan.textContent = dataBarang.length;
  jumlahFilter.textContent = `${sorted.length} item`;
  feather.replace(); // Render new icons if any
}

function setSort(key) {
  if (sortKey === key) {
    sortAsc = !sortAsc;
  } else {
    sortKey = key;
    sortAsc = true;
  }
  renderDataBarang();
}

document.getElementById('sortSupplier').addEventListener('click', function () {
  setSort('supplier');
});
document.getElementById('sortTanggal').addEventListener('click', function () {
  setSort('tanggal');
});
document.getElementById('sortKode').addEventListener('click', function () {
  setSort('kode');
});
filterSelect.addEventListener('change', function () {
  filterKode = this.value;
  renderDataBarang();
});

function exportDataBarangCsv() {
  const headers = ['#', 'Tanggal', 'Kode', 'Nama', 'Supplier', 'Gudang', 'Total Pesan', 'Datang', 'Kiriman Terakhir', 'Harga Satuan', 'Harga Jual'];
  const rows = dataBarang.map((item, index) => [
    index + 1,
    reverseDateFormat(item.tanggal),
    item.kode,
    item.nama,
    item.supplier,
    item.gudang || 'N/A',
    getTotalPesan(item),
    item.datang,
    item.kiriman,
    item.hargaSatuan,
    item.hargaJual
  ]);
  exportTableToCsv('data_barang.csv', headers, rows);
}

// ================================================================
//  EDIT DATA BARANG
// ================================================================
let currentEditIdx = null;

tbody.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-edit');
  if (!btn) return;
  const idx = parseInt(btn.getAttribute('data-idx'));
  const item = dataBarang.find(d => d._idx === idx);
  if (!item) return;

  currentEditIdx = idx;
  document.getElementById('editItemTitle').textContent = `Edit ${item.nama}`;
  document.getElementById('editItemName').textContent = item.nama;
  document.getElementById('editNama').value = item.nama;
  document.getElementById('editSupplier').value = item.supplier;
  document.getElementById('editGudang').value = item.gudang;
  document.getElementById('editHargaSatuan').value = item.hargaSatuan;
  document.getElementById('editHargaJual').value = item.hargaJual;

  renderEditOrderHistoryList(item);

  document.getElementById('editItemModal').classList.add('is-visible');
  document.getElementById('editNama').focus();
});

document.getElementById('cancelEditItemBtn').addEventListener('click', function() {
  document.getElementById('editItemModal').classList.remove('is-visible');
  currentEditIdx = null;
});

// ================================================================
//  EDIT RIWAYAT PESANAN
// ================================================================
let editPesananList = [];

function renderEditOrderHistoryList(item) {
  const container = document.getElementById('editOrderHistoryList');
  if (!container) return;

  editPesananList = item.pesananHistory ? [...item.pesananHistory] : [];

  let html = '';
  editPesananList.forEach((order, i) => {
    html += `<div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
      <div style="flex:1;">
        <label style="font-size:11px; color:var(--text-muted);">Tanggal</label>
        <input type="date" value="${order.tanggal}" style="width:100%; height:36px;" data-edit-order-tanggal="${i}" readonly>
      </div>
      <div style="flex:1;">
        <label style="font-size:11px; color:var(--text-muted);">Jumlah</label>
        <input type="number" min="0" value="${order.jumlah}" style="width:100%; height:36px;" data-edit-order-jumlah="${i}">
      </div>
      <button type="button" class="btn-undo" style="background-color:#ef4444; height:36px; align-self:flex-end; padding:0 8px;" data-remove-order="${i}"><i data-feather="trash-2" style="width:14px; height:14px;"></i></button>
    </div>`;
  });

  container.innerHTML = html;
  feather.replace();
}

document.getElementById('editOrderHistoryList').addEventListener('click', function(e) {
  const removeBtn = e.target.closest('[data-remove-order]');
  if (!removeBtn) return;
  const idx = parseInt(removeBtn.getAttribute('data-remove-order'));
  editPesananList.splice(idx, 1);
  renderEditOrderHistoryList(dataBarang.find(d => d._idx === currentEditIdx));
});

document.getElementById('saveEditItemBtn').addEventListener('click', function() {
  if (currentEditIdx === null) return;
  const item = dataBarang.find(d => d._idx === currentEditIdx);
  if (!item) return;

  item.nama = document.getElementById('editNama').value;
  item.supplier = document.getElementById('editSupplier').value;
  item.gudang = document.getElementById('editGudang').value;
  item.hargaSatuan = parseInt(document.getElementById('editHargaSatuan').value) || 0;
  item.hargaJual = parseInt(document.getElementById('editHargaJual').value) || 0;

  const orderQtyInputs = document.querySelectorAll('[data-edit-order-jumlah]');
  const orderTanggalInputs = document.querySelectorAll('[data-edit-order-tanggal]');
  for (let i = 0; i < editPesananList.length; i++) {
    const qtyVal = parseInt(orderQtyInputs[i].value);
    if (!isNaN(qtyVal) && qtyVal >= 0) {
      editPesananList[i].jumlah = qtyVal;
    }
    if (orderTanggalInputs[i]) {
      editPesananList[i].tanggal = orderTanggalInputs[i].value;
    }
  }
  item.pesananHistory = [...editPesananList];

  saveAllData();
  renderDataBarang();
  document.getElementById('editItemModal').classList.remove('is-visible');
  currentEditIdx = null;
});

// Enter di kolom modal Edit Barang = klik Simpan Perubahan + tutup modal
document.getElementById('editItemModal')?.addEventListener('keydown', function (event) {
  if (event.key !== 'Enter') return;
  const tag = event.target.tagName;
  if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return;
  event.preventDefault();
  document.getElementById('saveEditItemBtn').click();
});

// Tutup modal saat klik di luar area konten
document.getElementById('editItemModal').addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('is-visible');
    currentEditIdx = null;
  }
});

