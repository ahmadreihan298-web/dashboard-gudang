// ================================================================
//  GUDANG (WAREHOUSE)
// ================================================================
const addWarehouseFormContainer = document.getElementById('add-warehouse-form-container');
const addWarehouseForm = document.getElementById('addWarehouseForm');
const cancelAddWarehouseBtn = document.getElementById('cancelAddWarehouseBtn');
const toggleAddWarehouseFormBtn = document.getElementById('toggleAddWarehouseFormBtn');

const moveWarehouseFormContainer = document.getElementById('move-warehouse-form-container');
const moveWarehouseForm = document.getElementById('moveWarehouseForm');
const itemToMoveSelect = document.getElementById('itemToMove');
const destinationWarehouseSelect = document.getElementById('destinationWarehouse');
const cancelMoveWarehouseBtn = document.getElementById('cancelMoveWarehouseBtn');
const toggleMoveWarehouseFormBtn = document.getElementById('toggleMoveWarehouseFormBtn');

function renderGudang() {
  const container = document.getElementById('gudang-summary-container');
  if (!container) return;

  // 1. Group data by warehouse
  const gudangData = dataBarang.reduce((acc, item) => {
    const gudang = item.gudang || 'Tidak Diketahui';
    if (!acc[gudang]) {
      acc[gudang] = {
        items: [],
        suppliers: new Set(),
        totalStock: 0
      };
    }
    acc[gudang].items.push(item);
    acc[gudang].suppliers.add(item.supplier);
    acc[gudang].totalStock += (item.datang || 0) + (item.sisa || 0);
    return acc;
  }, {});

  // 2. Generate HTML
  let html = '';
  // Gabungkan gudang dari data master (gudangList) dan gudang yang ada di dataBarang
  const warehousesInData = new Set(dataBarang.map(item => item.gudang).filter(Boolean));
  const allGudangKeys = new Set([...gudangList, ...warehousesInData]);
  const gudangKeys = Array.from(allGudangKeys).sort();

  if (gudangKeys.length === 0) {
    html = `<div class="empty-page" style="height: auto; grid-column: 1 / -1;">
              <div class="big-icon"><i data-feather="box"></i></div>
              <h2 style="margin-top:16px;">Tidak Ada Data Gudang</h2>
              <p style="margin-top:8px;">Belum ada data barang dengan informasi gudang, atau belum ada gudang yang ditambahkan secara manual.</p>
            </div>`;
  } else {
    gudangKeys.forEach(gudang => {
      const data = gudangData[gudang] || { items: [], suppliers: new Set(), totalStock: 0 };
      const isInMasterList = gudangList.includes(gudang);
      const canDelete = isInMasterList && data.items.length === 0;

      html += `
        <div class="gudang-card">
          <div class="gudang-card-header">
            <div class="icon"><i data-feather="archive"></i></div>
            <h3>Gudang ${gudang}</h3>
            ${canDelete ? `<button type="button" class="btn-delete-warehouse" data-gudang="${gudang}" title="Hapus Gudang"><i data-feather="trash-2"></i></button>` : ''}
          </div>
          <div class="gudang-stats">
            <div class="gudang-stat">
              <span class="label">Jumlah Jenis Item</span>
              <span class="value"><strong>${data.items.length}</strong></span>
            </div>
            <div class="gudang-stat">
              <span class="label">Total Stok Tersedia</span>
              <span class="value"><strong>${data.totalStock.toLocaleString('id-ID')}</strong> pcs</span>
            </div>
            <div class="gudang-stat">
              <span class="label">Jumlah Supplier</span>
              <span class="value"><strong>${data.suppliers.size}</strong></span>
            </div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
  feather.replace();

  // Attach delete handlers
  container.querySelectorAll('.btn-delete-warehouse').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gudang = btn.dataset.gudang;
      if (!gudang) return;

      if (!confirm(`Hapus gudang "${gudang}" dari daftar master?`)) return;

      const idx = gudangList.indexOf(gudang);
      if (idx > -1) {
        gudangList.splice(idx, 1);
      }

      renderGudang();
      renderGudangItemTable();
      renderMoveWarehouseForm();
      saveAllData();
    });
  });
}

function renderGudangItemTable() {
  const tbody = document.getElementById('tabelGudangItem');
  if (!tbody) return;

  // Sort by warehouse then by name for better grouping
  const sortedData = [...dataBarang].sort((a, b) => {
    const gudangA = a.gudang || 'zzzz'; // put no-gudang at the end
    const gudangB = b.gudang || 'zzzz';
    if (gudangA < gudangB) return -1;
    if (gudangA > gudangB) return 1;
    // if warehouses are same, sort by name
    return a.nama.localeCompare(b.nama);
  });

  if (sortedData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-table">Tidak ada data barang</td></tr>`;
  } else {
    let html = '';
    sortedData.forEach((item, index) => {
      html += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${item.nama}</td>
          <td>${splitKode(item.kode).map(k => `<span class="badge">${k}</span>`).join(' ')}</td>
          <td>${item.gudang || 'N/A'}</td>
          <td class="text-right">${((item.datang || 0) + (item.sisa || 0)).toLocaleString('id-ID')}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }
}

// ================================================================
//  GUDANG - FORM TAMBAH GUDANG
// ================================================================
if (toggleAddWarehouseFormBtn) {
  toggleAddWarehouseFormBtn.addEventListener('click', () => {
    const isVisible = addWarehouseFormContainer.classList.contains('is-visible');
    smoothToggle(addWarehouseFormContainer, !isVisible);
    smoothToggle(moveWarehouseFormContainer, false);
    moveWarehouseForm.reset();
    if (!isVisible) {
      feather.replace();
    }
  });
}

if (cancelAddWarehouseBtn) {
  cancelAddWarehouseBtn.addEventListener('click', () => {
    smoothToggle(addWarehouseFormContainer, false);
    addWarehouseForm.reset();
  });
}

if (addWarehouseForm) {
  addWarehouseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const newWarehouseNameInput = document.getElementById('newWarehouseName');
    const gudangName = newWarehouseNameInput.value.trim().toUpperCase();

    if (!gudangName) {
      return alert('Nama Gudang harus diisi.');
    }

    if (gudangList.includes(gudangName)) {
      newWarehouseNameInput.focus();
      return alert(`Gudang dengan nama "${gudangName}" sudah ada.`);
    }

    gudangList.push(gudangName);
    gudangList.sort();

    renderGudang();
    saveAllData();
    alert(`Gudang "${gudangName}" berhasil ditambahkan.`);

    addWarehouseForm.reset();
    smoothToggle(addWarehouseFormContainer, false);
  });
}

// ================================================================
//  GUDANG - PINDAH GUDANG
// ================================================================
if (toggleMoveWarehouseFormBtn) {
  toggleMoveWarehouseFormBtn.addEventListener('click', () => {
    const isMoveFormVisible = moveWarehouseFormContainer.classList.contains('is-visible');

    // Pastikan form tambah gudang tertutup saat form pindah gudang dibuka
    smoothToggle(addWarehouseFormContainer, false);
    addWarehouseForm.reset();

    // Toggle form pindah gudang
    smoothToggle(moveWarehouseFormContainer, !isMoveFormVisible);
    if (!isMoveFormVisible) {
      renderMoveWarehouseForm(); // Isi dropdown saat form dibuka
      feather.replace();
    }
  });
}

if (cancelMoveWarehouseBtn) {
  cancelMoveWarehouseBtn.addEventListener('click', () => {
    smoothToggle(moveWarehouseFormContainer, false);
    moveWarehouseForm.reset();
  });
}

function renderMoveWarehouseCart() {
  const container = document.getElementById('custom-cart-container');
  if (!container) return;

  container.innerHTML = '';

  const availableItems = dataBarang.filter(item => item.datang > 0);

  if (availableItems.length === 0) {
    container.innerHTML = '<div class="cart-empty">Tidak ada barang dengan stok.</div>';
    return;
  }

  availableItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.idx = item._idx;

    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nama}</div>
        <div class="cart-item-details">Kode: ${item.kode} | Gudang: ${item.gudang || 'N/A'} | Stok: ${item.datang.toLocaleString('id-ID')}</div>
      </div>
      <input type="number" class="cart-item-qty" min="1" max="${item.datang}" value="1">
      <button type="button" class="cart-item-btn">Pilih</button>
    `;

    row.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      selectMoveWarehouseItem(item._idx, row);
    });

    row.querySelector('.cart-item-btn').addEventListener('click', () => {
      selectMoveWarehouseItem(item._idx, row);
    });

    container.appendChild(row);
  });
}

function selectMoveWarehouseItem(idx, row) {
  const isSelected = row.classList.contains('selected');
  if (isSelected) {
    row.classList.remove('selected');
  } else {
    row.classList.add('selected');
  }
}

function renderMoveWarehouseForm() {
  // Populate itemToMoveSelect (keep for form submission compatibility)
  itemToMoveSelect.innerHTML = '<option value="">-- Pilih Barang --</option>';
  dataBarang.filter(item => item.datang > 0).forEach(item => {
    const option = document.createElement('option');
    option.value = item._idx;
    option.textContent = `${item.nama} (${item.kode}) - Gudang: ${item.gudang} - Stok: ${item.datang.toLocaleString('id-ID')}`;
    itemToMoveSelect.appendChild(option);
  });

  renderMoveWarehouseCart();

  // Populate destinationWarehouseSelect
  destinationWarehouseSelect.innerHTML = '<option value="">-- Pilih Gudang --</option>';
  const allGudangNames = new Set([...gudangList, ...dataBarang.map(item => item.gudang).filter(Boolean)]);
  Array.from(allGudangNames).sort().forEach(gudangName => {
    const option = document.createElement('option');
    option.value = gudangName;
    option.textContent = gudangName;
    destinationWarehouseSelect.appendChild(option);
  });
}

if (moveWarehouseForm) {
  moveWarehouseForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const destinationGudang = destinationWarehouseSelect.value;

    if (!destinationGudang) {
      return alert('Pilih gudang tujuan.');
    }

    const container = document.getElementById('custom-cart-container');
    const selectedRows = container ? container.querySelectorAll('.cart-item.selected') : [];

    if (selectedRows.length === 0) {
      return alert('Pilih minimal satu barang untuk dipindahkan.');
    }

    const itemsToProcess = [];
    let hasError = false;

    selectedRows.forEach(row => {
      const idx = parseInt(row.dataset.idx);
      const qtyInput = row.querySelector('.cart-item-qty');
      const quantityToMove = parseInt(qtyInput.value);
      const sourceItem = dataBarang.find(i => i._idx === idx);

      if (!sourceItem) return;

      if (isNaN(quantityToMove) || quantityToMove <= 0) {
        alert(`Jumlah pindah untuk "${sourceItem.nama}" harus lebih dari 0.`);
        hasError = true;
        return;
      }

      if (quantityToMove > sourceItem.datang) {
        alert(`Jumlah pindah untuk "${sourceItem.nama}" (${quantityToMove}) tidak boleh melebihi stok tersedia (${sourceItem.datang}).`);
        hasError = true;
        return;
      }

      if (sourceItem.gudang === destinationGudang) {
        alert(`Barang "${sourceItem.nama}" sudah berada di gudang "${destinationGudang}".`);
        hasError = true;
        return;
      }

      itemsToProcess.push({ sourceItem, quantityToMove });
    });

    if (hasError || itemsToProcess.length === 0) return;

    itemsToProcess.forEach(({ sourceItem, quantityToMove }) => {
      if (quantityToMove === sourceItem.datang) {
        sourceItem.gudang = destinationGudang;
      } else {
        let destinationItem = dataBarang.find(item =>
          item.nama === sourceItem.nama &&
          item.kode === sourceItem.kode &&
          item.supplier === sourceItem.supplier &&
          item.gudang === destinationGudang
        );

        if (destinationItem) {
          destinationItem.datang += quantityToMove;
        } else {
          const newItem = { ...sourceItem };
          newItem.gudang = destinationGudang;
          newItem.datang = quantityToMove;
          newItem.pesananHistory = [];
          newItem.kirimanHistory = [{ kirimanKe: 1, jumlah: quantityToMove, tanggal: new Date().toISOString().split('T')[0] }];
          newItem.kiriman = 1;
          newItem._idx = Math.max(...dataBarang.map(item => item._idx)) + 1;

          dataBarang.push(newItem);
        }
        sourceItem.datang -= quantityToMove;
      }
    });

    alert(`${itemsToProcess.length} jenis barang berhasil dipindahkan ke gudang "${destinationGudang}".`);
    moveWarehouseForm.reset();
    smoothToggle(moveWarehouseFormContainer, false);
    renderAll();
    saveAllData();
    renderMoveWarehouseForm();
  });
}

// ================================================================
//  MODAL TAMBAH PESANAN
// ================================================================
const addOrderModal = document.getElementById('addOrderModal');
const modalItemName = document.getElementById('modalItemName');
const newOrderQtyInput = document.getElementById('newOrderQty');
const newOrderDateInput = document.getElementById('newOrderDate');
const saveOrderBtn = document.getElementById('saveOrderBtn');
const cancelOrderBtn = document.getElementById('cancelOrderBtn');

// Buka modal dari tabel Data Barang
tbody.addEventListener('click', function (event) {
  if (event.target.classList.contains('btn-add-order')) {
    const idx = parseInt(event.target.dataset.idx);
    const item = dataBarang[idx];

    addOrderModal.dataset.idx = idx;
    modalItemName.textContent = item.nama;
    newOrderDateInput.value = new Date().toISOString().split('T')[0]; // Set ke hari ini
    newOrderQtyInput.value = 1; // Reset ke 1

    addOrderModal.classList.add('is-visible');
    newOrderQtyInput.focus();
  }

  // Tampilkan/sembunyikan riwayat pesanan
  if (event.target.classList.contains('btn-show-history')) {
    const button = event.target;
    const idx = parseInt(button.dataset.idx);
    const parentRow = document.getElementById(`item-row-${idx}`);
    const existingHistoryRow = document.getElementById(`history-row-${idx}`);

    if (existingHistoryRow) {
      existingHistoryRow.remove();
      button.textContent = 'Lihat';
    } else {
      const item = dataBarang[idx];
      const historyHtml = item.pesananHistory.length > 0
        ? `<ul class="history-list">
            ${item.pesananHistory.map(order => `
              <li>
                <span class="date">Pesanan pada ${reverseDateFormat(order.tanggal)}</span>
                <span class="qty">${order.jumlah.toLocaleString('id-ID')} pcs</span>
              </li>
            `).join('')}
          </ul>`
        : '<span>Tidak ada riwayat pesanan tambahan.</span>';

      const historyRow = document.createElement('tr');
      historyRow.id = `history-row-${idx}`;
      historyRow.className = 'history-row';
      historyRow.innerHTML = `<td colspan="13">${historyHtml}</td>`;
      parentRow.after(historyRow);
      button.textContent = 'Tutup';
    }
  }
});

// Tutup modal
function closeModal() {
  addOrderModal.classList.remove('is-visible');
}
cancelOrderBtn.addEventListener('click', closeModal);
addOrderModal.addEventListener('click', function (event) {
  if (event.target === addOrderModal) { // Klik di luar area konten modal
    closeModal();
  }
});

// Simpan pesanan baru
saveOrderBtn.addEventListener('click', function () {
  const idx = parseInt(addOrderModal.dataset.idx);
  const newQty = parseInt(newOrderQtyInput.value);
  const newDate = newOrderDateInput.value;

  if (isNaN(newQty) || newQty <= 0) {
    return alert('Jumlah pesanan harus lebih dari 0.');
  }
  if (!newDate) {
    return alert('Tanggal pesanan harus diisi.');
  }

  dataBarang[idx].pesananHistory.push({ jumlah: newQty, tanggal: newDate });

  closeModal();
  renderAll();
  saveAllData();
});

// Handle Enter key press in modal
addOrderModal.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveOrderBtn.click();
  }
});

function exportGudangCsv() {
  const headers = ['#', 'Nama Barang', 'Kode', 'Gudang', 'Stok Tersedia'];
  const sorted = dataBarang.slice().sort((a, b) => {
    const gudangA = a.gudang || 'zzzz';
    const gudangB = b.gudang || 'zzzz';
    if (gudangA < gudangB) return -1;
    if (gudangA > gudangB) return 1;
    return a.nama.localeCompare(b.nama);
  });
  const rows = sorted.map((item, index) => [
    index + 1,
    item.nama,
    item.kode,
    item.gudang || 'N/A',
    item.datang
  ]);
  exportTableToCsv('gudang_barang.csv', headers, rows);
}

