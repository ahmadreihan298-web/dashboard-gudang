// ================================================================
//  PERSISTENSI â€” Google Sheets via Apps Script (+ fallback localStorage)
// ================================================================
const STORAGE_KEY = 'gdg_saved_data_v1';
const CLEAN_RESET_MARKER = 'gdg_clean_reset_v1';

function clearOldDataOnce() {
  if (localStorage.getItem(CLEAN_RESET_MARKER)) return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('gdg_saved_data');
  localStorage.setItem(CLEAN_RESET_MARKER, 'done');
}

// GANTI dengan URL hasil Deploy Apps Script kamu (akhiran /exec)
let firebaseDb = null;
let firebaseReady = false;

function setupFirebase() {
  const config = typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : null;
  if (!config || !config.apiKey || !config.projectId || !config.appId || typeof firebase === 'undefined') return;

  try {
    if (!firebase.apps.length) firebase.initializeApp(config);
    firebaseDb = firebase.firestore();
    firebaseReady = true;
    firebaseDb.enablePersistence({ synchronizeTabs: true }).catch((e) => {
      console.warn('Cache Firebase persistent tidak aktif:', e.code || e.message);
    });
  } catch (e) {
    console.warn('Firebase belum siap, memakai cache lokal:', e);
  }
}

setupFirebase();

function applySavedState(saved) {
  if (Array.isArray(saved.dataBarang)) dataBarang = saved.dataBarang;
  if (Array.isArray(saved.gudangList)) gudangList = saved.gudangList;
  if (Array.isArray(saved.dataBarangKeluar)) dataBarangKeluar = saved.dataBarangKeluar;
  if (typeof saved.nextBarangKeluarId === 'number') nextBarangKeluarId = saved.nextBarangKeluarId;
  if (typeof dataKeuangan !== 'undefined') {
    if (Array.isArray(saved.dataKeuangan)) dataKeuangan = saved.dataKeuangan;
    if (typeof saved.nextKeuanganId === 'number') nextKeuanganId = saved.nextKeuanganId;
  }
  if (Array.isArray(saved.kirimPutriHistory)) kirimPutriHistory = saved.kirimPutriHistory;
  if (typeof saved.nextKpId === 'number') nextKpId = saved.nextKpId;
}

function buildState() {
  const state = {
    dataBarang: dataBarang,
    gudangList: gudangList,
    dataBarangKeluar: dataBarangKeluar,
    nextBarangKeluarId: nextBarangKeluarId,
    kirimPutriHistory: kirimPutriHistory,
    nextKpId: nextKpId
  };
  if (typeof dataKeuangan !== 'undefined') {
    state.dataKeuangan = dataKeuangan;
    state.nextKeuanganId = nextKeuanganId;
  }
  return state;
}

function loadFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    applySavedState(JSON.parse(raw));
  } catch (e) {
    console.error('Gagal memuat data tersimpan lokal:', e);
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildState()));
  } catch (e) {
    console.error('Gagal menyimpan data lokal:', e);
  }
}

async function loadAllData() {
  // Tampilkan cache lokal secepatnya; jangan menunggu jaringan.
  clearOldDataOnce();
  loadFromLocalStorage();

  if (firebaseReady) {
    try {
      const snapshot = await firebaseDb.doc(FIREBASE_DATA_PATH).get();
      if (snapshot.exists) {
        applySavedState(snapshot.data());
        saveToLocalStorage();
        if (typeof refreshAppViews === 'function') refreshAppViews();
        return;
      }

      // Kirim cache lokal ke Firebase saat dokumen masih kosong.
      if (localStorage.getItem(STORAGE_KEY)) {
        await firebaseDb.doc(FIREBASE_DATA_PATH).set(buildState(), { merge: false });
        return;
      }
    } catch (e) {
      console.warn('Firebase tidak tersedia, memakai cache lokal:', e);
    }
  }

  if (typeof refreshAppViews === 'function') refreshAppViews();
}
async function saveAllData() {
  saveToLocalStorage(); // Backup instan ke localStorage

  if (firebaseReady) {
    try {
      await firebaseDb.doc(FIREBASE_DATA_PATH).set(buildState(), { merge: false });
      return;
    } catch (e) {
      console.error('Gagal menyimpan ke Firebase, data tetap aman di cache lokal:', e);
    }
  }

}
