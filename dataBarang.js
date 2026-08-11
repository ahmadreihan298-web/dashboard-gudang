// ================================================================
//  DATA BARANG
// ================================================================
let sortSupplierAsc = true;
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
const sortStatus = document.getElementById('sortStatus');
const jumlahFilter = document.getElementById('jumlahFilter');

function renderDataBarang() {
  let filtered = dataBarang;
  if (filterKode !== '__semua') {
    filtered = dataBarang.filter(item => splitKode(item.kode).includes(filterKode));
  }
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    const nameA = a.supplier.toUpperCase();
    const nameB = b.supplier.toUpperCase();
    if (nameA < nameB) return sortSupplierAsc ? -1 : 1;
    if (nameA > nameB) return sortSupplierAsc ? 1 : -1;
    return 0;
  });
  arrowSupplier.textContent = sortSupplierAsc ? '↑' : '↓';
  arrowSupplier.className = 'arrow active';
  sortStatus.textContent = `Supplier ${sortSupplierAsc ? 'A–Z' : 'Z–A'}`;

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

document.getElementById('sortSupplier').addEventListener('click', function () {
  sortSupplierAsc = !sortSupplierAsc;
  renderDataBarang();
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

// Tutup modal saat klik di luar area konten
document.getElementById('editItemModal').addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('is-visible');
    currentEditIdx = null;
  }
});

