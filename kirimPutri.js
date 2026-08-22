// ================================================================
//  KIRIM KE PUTRI
// ================================================================
const kirimPutriCartContainer = document.getElementById('kirimPutriCart');
const kirimPutriTotalEl = document.getElementById('kirimPutriTotal');
const kirimPutriForm = document.getElementById('kirimPutriForm');
const kirimPutriHistoryContainer = document.getElementById('kirimPutriHistory');
const kirimPutriSubmitBtn = document.getElementById('kirimPutriSubmitBtn');

function renderKirimPutriCart() {
  if (!kirimPutriCartContainer) return;

  const availableItems = dataBarang.filter(item => getStok(item) > 0);

  if (availableItems.length === 0) {
    kirimPutriCartContainer.innerHTML = '<div class="empty-table" style="padding: 20px 0;">Tidak ada barang dengan stok tersedia.</div>';
    return;
  }

  const grouped = new Map();
  availableItems.forEach(item => {
    const primaryKode = (item.kode || '').split(',')[0].trim() || 'LAINNYA';
    if (!grouped.has(primaryKode)) {
      grouped.set(primaryKode, []);
    }
    grouped.get(primaryKode).push(item);
  });

  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
    const numA = parseInt(a.split(' ')[0], 10);
    const numB = parseInt(b.split(' ')[0], 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  let html = `
    <div class="kirim-putri-cart-header">
      <label class="select-all-label">
        <input type="checkbox" id="kirimPutriSelectAll">
        <span class="kirim-putri-checkbox"></span>
        <span>Pilih Semua</span>
      </label>
    </div>
    <div class="kirim-putri-cart-groups">
  `;

  sortedKeys.forEach(kode => {
    const items = grouped.get(kode);
    html += `
      <div class="kirim-putri-group">
        <div class="kirim-putri-group-header">KODE: ${kode}</div>
        <div class="kirim-putri-cart-grid">
    `;

    items.forEach(item => {
      html += `
        <div class="kirim-putri-item" data-idx="${item._idx}">
          <div class="kirim-putri-item-info">
            <div class="kirim-putri-item-name">${item.nama}</div>
            <div class="kirim-putri-item-meta">Gudang: ${item.gudang || 'N/A'}</div>
            <div class="kirim-putri-item-stock">Stok: ${getStok(item).toLocaleString('id-ID')}</div>
          </div>
          <div class="kirim-putri-item-actions">
            <div class="kirim-putri-item-qty">
              <input type="number" class="kirim-putri-qty" data-idx="${item._idx}" min="1" max="${getStok(item)}" value="1" disabled>
            </div>
            <div class="kirim-putri-item-subtotal">Rp 0</div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += '</div>';
  kirimPutriCartContainer.innerHTML = html;

  const selectAllEl = document.getElementById('kirimPutriSelectAll');

  kirimPutriCartContainer.querySelectorAll('.kirim-putri-item').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const isSelected = card.classList.contains('selected');
      if (isSelected) {
        card.classList.remove('selected');
        const qtyInput = card.querySelector('.kirim-putri-qty');
        qtyInput.disabled = true;
        qtyInput.value = 1;
        card.querySelector('.kirim-putri-item-subtotal').textContent = 'Rp 0';
      } else {
        card.classList.add('selected');
        const qtyInput = card.querySelector('.kirim-putri-qty');
        qtyInput.disabled = false;
        const item = dataBarang.find(i => i._idx === parseInt(card.dataset.idx));
        if (item) {
          qtyInput.value = 1;
          card.querySelector('.kirim-putri-item-subtotal').textContent = `Rp ${(item.hargaJual || 0).toLocaleString('id-ID')}`;
        }
      }
      updateKirimPutriTotal();
      updateKirimPutriSelectAllState();
    });
  });

  kirimPutriCartContainer.querySelectorAll('.kirim-putri-qty').forEach(input => {
    input.addEventListener('input', function () {
      const idx = parseInt(this.dataset.idx);
      const card = kirimPutriCartContainer.querySelector(`.kirim-putri-item[data-idx="${idx}"]`);
      if (!card.classList.contains('selected')) return;

      const item = dataBarang.find(i => i._idx === idx);
      if (!item) return;

      let qty = parseInt(this.value) || 0;
      if (qty < 1) qty = 1;
      if (qty > getStok(item)) qty = getStok(item);
      this.value = qty;

      const subtotal = qty * (item.hargaJual || 0);
      card.querySelector('.kirim-putri-item-subtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
      updateKirimPutriTotal();
    });
  });

  if (selectAllEl) {
    selectAllEl.checked = false;
    selectAllEl.addEventListener('change', function () {
      const cards = kirimPutriCartContainer.querySelectorAll('.kirim-putri-item');
      cards.forEach(card => {
        const qtyInput = card.querySelector('.kirim-putri-qty');
        if (this.checked) {
          card.classList.add('selected');
          qtyInput.disabled = false;
          qtyInput.value = 1;
          const item = dataBarang.find(i => i._idx === parseInt(card.dataset.idx));
          if (item) {
            card.querySelector('.kirim-putri-item-subtotal').textContent = `Rp ${(item.hargaJual || 0).toLocaleString('id-ID')}`;
          }
        } else {
          card.classList.remove('selected');
          qtyInput.disabled = true;
          qtyInput.value = 1;
          card.querySelector('.kirim-putri-item-subtotal').textContent = 'Rp 0';
        }
      });
      updateKirimPutriTotal();
    });
  }

  updateKirimPutriTotal();
}

function updateKirimPutriTotal() {
  if (!kirimPutriTotalEl || !kirimPutriCartContainer) return;

  let total = 0;
  kirimPutriCartContainer.querySelectorAll('.kirim-putri-item.selected').forEach(card => {
    const idx = parseInt(card.dataset.idx);
    const qtyInput = card.querySelector('.kirim-putri-qty');
    const qty = parseInt(qtyInput.value) || 0;
    const item = dataBarang.find(i => i._idx === idx);
    if (item) {
      total += qty * (item.hargaJual || 0);
    }
  });

  kirimPutriTotalEl.textContent = `Rp ${total.toLocaleString('id-ID')}`;
  return total;
}

function updateKirimPutriSelectAllState() {
  const selectAllEl = document.getElementById('kirimPutriSelectAll');
  if (!selectAllEl || !kirimPutriCartContainer) return;
  const cards = kirimPutriCartContainer.querySelectorAll('.kirim-putri-item');
  const selected = kirimPutriCartContainer.querySelectorAll('.kirim-putri-item.selected');
  selectAllEl.checked = cards.length > 0 && cards.length === selected.length;
}

function processKirimPutri() {
  if (!kirimPutriCartContainer) return;

  const selectedCards = kirimPutriCartContainer.querySelectorAll('.kirim-putri-item.selected');
  if (selectedCards.length === 0) {
    return alert('Pilih minimal satu barang untuk dikirim.');
  }

  const tanggal = new Date().toISOString().split('T')[0];
  const itemsToSend = [];
  let totalNominal = 0;
  let hasError = false;

  selectedCards.forEach(card => {
    const idx = parseInt(card.dataset.idx);
    const qtyInput = card.querySelector('.kirim-putri-qty');
    const qty = parseInt(qtyInput.value) || 0;
    const item = dataBarang.find(i => i._idx === idx);

    if (!item) return;

    if (qty <= 0) {
      alert(`Jumlah kirim untuk "${item.nama}" harus lebih dari 0.`);
      hasError = true;
      return;
    }

    if (qty > getStok(item)) {
      alert(`Jumlah kirim untuk "${item.nama}" (${qty}) tidak boleh melebihi stok tersedia (${getStok(item)}).`);
      hasError = true;
      return;
    }

    const subtotal = qty * (item.hargaJual || 0);
    itemsToSend.push({ item, qty, subtotal });
    totalNominal += subtotal;
  });

  if (hasError || itemsToSend.length === 0) return;

  itemsToSend.forEach(({ item, qty }) => {
    kurangiStok(item, qty);
    item.kiriman += 1;
    item.kirimanHistory.push({
      kirimanKe: item.kiriman,
      jumlah: qty,
      tanggal: tanggal,
      tipe: 'kirim-putri'
    });
  });

  kirimPutriHistory.push({
    id: nextKpId++,
    tanggal: tanggal,
    items: itemsToSend.map(({ item, qty, subtotal }) => ({
      _idx: item._idx,
      nama: item.nama,
      kode: item.kode,
      qty,
      hargaJual: item.hargaJual || 0,
      subtotal
    })),
    total: totalNominal
  });

  alert(`${itemsToSend.length} jenis barang berhasil dikirim ke Putri. Total: Rp ${totalNominal.toLocaleString('id-ID')}`);
  renderKirimPutriCart();
  renderKirimPutriHistory();
  saveAllData();
}

function renderKirimPutriHistory() {
  const tbody = document.getElementById('kirimPutriHistoryTable')?.querySelector('tbody');
  if (!tbody) return;

  if (kirimPutriHistory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-table">Belum ada riwayat pengiriman ke Putri.</td></tr>`;
    return;
  }

  const sorted = [...kirimPutriHistory].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  let html = '';
  let no = sorted.length;
  sorted.forEach(record => {
    const mainItem = record.items[0];
    const extraCount = record.items.length - 1;
    const rowSpan = record.items.length;

    record.items.forEach((item, idx) => {
      const isFirst = idx === 0;
      html += `
        <tr>
          ${isFirst ? `<td rowspan="${rowSpan}" style="text-align: center; vertical-align: middle;">${no--}</td>` : ''}
          <td style="text-align: center;">${isFirst ? reverseDateFormat(record.tanggal) : ''}</td>
          <td style="text-align: center;">${item.nama}</td>
          <td style="text-align: center;">${item.kode}</td>
          <td style="text-align: center;">
            <input type="number" class="kirim-putri-history-qty" data-record-id="${record.id}" data-item-idx="${idx}" min="1" value="${item.qty}" style="width:140px; text-align:center; height:36px; border:1px solid var(--border-color); border-radius: var(--radius-md); padding:0 10px;">
          </td>
          <td style="text-align: center;">Rp ${item.hargaJual.toLocaleString('id-ID')}</td>
          <td style="text-align: center;">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
          ${isFirst ? `<td rowspan="${rowSpan}" style="text-align: center; vertical-align: middle; font-weight: 600;">Rp ${record.total.toLocaleString('id-ID')}</td>` : ''}
        </tr>
      `;
    });
  });

  tbody.innerHTML = html;

  tbody.querySelectorAll('.kirim-putri-history-qty').forEach(input => {
    input.addEventListener('change', function () {
      const recordId = parseInt(this.dataset.recordId);
      const itemIdx = parseInt(this.dataset.itemIdx);
      const newQty = parseInt(this.value) || 0;
      updateKirimPutriHistoryItem(recordId, itemIdx, newQty);
    });
  });
}

function updateKirimPutriHistoryItem(recordId, itemIdx, newQty) {
  const record = kirimPutriHistory.find(r => r.id === recordId);
  if (!record || !Array.isArray(record.items)) return;

  const item = record.items[itemIdx];
  if (!item) return;

  const oldQty = item.qty;
  if (newQty < 1) {
    renderKirimPutriHistory();
    return alert('Jumlah harus minimal 1.');
  }

  const dataItem = typeof item._idx === 'number'
    ? dataBarang.find(i => i._idx === item._idx)
    : dataBarang.find(i => i.kode === item.kode && i.nama === item.nama);
  if (!dataItem) {
    renderKirimPutriHistory();
    return alert(`Barang "${item.nama}" tidak ditemukan di data stok.`);
  }

  const diff = newQty - oldQty;
  if (diff > 0 && dataItem.datang < diff) {
    renderKirimPutriHistory();
    return alert(`Stok tersedia "${item.nama}" tidak cukup (${dataItem.datang.toLocaleString('id-ID')}).`);
  }

  dataItem.datang -= diff;

  const matches = (dataItem.kirimanHistory || []).filter(h => h.tipe === 'kirim-putri' && h.tanggal === record.tanggal);
  if (matches.length === 1) matches[0].jumlah = newQty;

  item.qty = newQty;
  item.subtotal = newQty * (item.hargaJual || 0);
  record.total = record.items.reduce((sum, it) => sum + (it.subtotal || 0), 0);

  renderKirimPutriHistory();
  renderKirimPutriCart();
  saveAllData();
}

function exportKirimPutriHistoryToCsv() {
  if (!kirimPutriHistory.length) {
    return alert('Belum ada riwayat pengiriman ke Putri.');
  }

  const sorted = [...kirimPutriHistory].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  const rows = [['No', 'Tanggal', 'Nama Barang', 'Kode', 'Qty', 'Harga Jual', 'Subtotal', 'Total']];

  let no = sorted.length;
  sorted.forEach(record => {
    const first = true;
    record.items.forEach((item, idx) => {
      rows.push([
        first && idx === 0 ? String(no--) : '',
        first && idx === 0 ? reverseDateFormat(record.tanggal) : '',
        item.nama,
        item.kode,
        item.qty,
        item.hargaJual,
        item.subtotal,
        first && idx === 0 ? record.total : ''
      ]);
    });
  });

  const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `riwayat-kirim-putri-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

if (kirimPutriForm) {
  kirimPutriForm.addEventListener('submit', (e) => {
    e.preventDefault();
    processKirimPutri();
  });
}

// Enter di halaman Kirim ke Putri = klik tombol Kirim ke Putri
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const page = document.getElementById('page-kirimPutri');
  if (!page || !page.classList.contains('active')) return;

  const target = e.target;
  if (target.closest && target.closest('button')) return;
  if (target !== document.body && target !== page && !page.contains(target)) return;

  const tag = target.tagName;
  if ((tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && kirimPutriForm && !kirimPutriForm.contains(target)) return;

  e.preventDefault();
  if (kirimPutriSubmitBtn) kirimPutriSubmitBtn.click();
});

const exportKirimPutriCsvBtn = document.getElementById('exportKirimPutriCsvBtn');
if (exportKirimPutriCsvBtn) {
  exportKirimPutriCsvBtn.addEventListener('click', exportKirimPutriHistoryToCsv);
}

function initKirimPutri() {
  renderKirimPutriCart();
  renderKirimPutriHistory();
}
