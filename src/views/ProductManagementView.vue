<template>
  <div class="dashboard-view">
    <div class="container">
  <div class="product-manager-container">
    <header class="page-header">
      <h1 class="page-title">Manajemen Produk</h1>
      <button @click="openFormModal()" class="btn btn-primary btn-lg">
        <i class="fas fa-plus me-2"></i> Tambah Produk Baru
      </button>
    </header>

    <!-- Feedback Section (Loading, Error, No Data) -->
    <div class="feedback-section">
      <div v-if="loading" class="alert alert-info d-flex align-items-center shadow-sm" role="alert">
        <div class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></div>
        <span>Memuat data produk, mohon tunggu...</span>
      </div>
      <div v-if="error" class="alert alert-danger shadow-sm" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i> {{ error }}
      </div>
      <div v-if="!loading && products.length === 0 && !error" class="alert alert-secondary text-center shadow-sm" role="alert">
        <i class="fas fa-box-open me-2"></i> Belum ada data produk. Silakan tambahkan produk baru.
      </div>
    </div>

    <!-- Tabel Produk -->
    <div v-if="!loading && products.length > 0" class="table-container shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle modern-table">
          <thead>
            <tr>
              <th scope="col">Kode</th>
              <th scope="col">Nama Produk</th>
              <th scope="col">Kategori</th>
              <th scope="col" class="text-center">Status</th>
              <th scope="col" class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.uuid">
              <td><code class="code-badge">{{ product.product_code }}</code></td>
              <td class="fw-medium">{{ product.name }}</td>
              <!-- PERBAIKAN 1: Menggunakan v-if/v-else -->
              <td>
                <span v-if="product.category?.name">{{ product.category.name }}</span>
                <span v-else class="text-muted fst-italic">N/A</span>
              </td>
              <td class="text-center">
                <span :class="['status-badge', product.is_active ? 'status-active' : 'status-inactive']">
                  <i :class="['fas', product.is_active ? 'fa-check-circle' : 'fa-times-circle', 'me-1']"></i>
                  {{ product.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="openFormModal(product)" class="btn btn-icon btn-outline-primary" title="Edit Produk">
                    <i class="fas fa-pencil-alt"></i>
                  </button>
                  <button @click="confirmDelete(product.uuid, product.name)" class="btn btn-icon btn-outline-danger" title="Hapus Produk">
                      <i class="fas fa-trash-alt"></i>
                  </button>
                  <button @click="showAuditHistory(product)" class="btn btn-icon btn-outline-secondary" title="Lihat Riwayat Audit">
                      <i class="fas fa-history"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ======================= -->
    <!--         MODALS          -->
    <!-- ======================= -->

    <!-- Modal Form Tambah/Edit Produk -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal-dialog modal-lg modal-dialog-centered"> <!-- Modal Large -->
        <div class="modal-content shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title">
              <i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2']"></i>
              {{ isEditing ? 'Edit Produk' : 'Tambah Produk Baru' }}
            </h5>
            <button type="button" class="btn-close" @click="closeFormModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-danger alert-dismissible fade show" role="alert">
               {{ formError }}
               <button type="button" class="btn-close btn-sm" @click="formError = null" aria-label="Close"></button>
            </div>
            <form @submit.prevent="saveProduct" id="productForm" class="modern-form">
              <div class="row g-3"> <!-- Gutter between columns -->
                <!-- Kolom Kiri -->
                <div class="col-md-6">
                   <div class="form-group">
                      <label for="productCode" class="form-label">Kode Produk</label>
                      <input type="text" id="productCode" v-model.trim="currentProduct.product_code" class="form-control" required placeholder="Contoh: SKU-001">
                   </div>
                   <div class="form-group">
                      <label for="productName" class="form-label">Nama Produk</label>
                      <input type="text" id="productName" v-model.trim="currentProduct.name" class="form-control" required placeholder="Masukkan nama produk">
                   </div>
                   <div class="form-group">
                    <label for="productCategory" class="form-label">Kategori</label>
                    <select id="productCategory" v-model="currentProduct.category_id" class="form-select" required :disabled="categoriesLoading">
                        <option disabled value="">
                            {{ categoriesLoading ? 'Memuat...' : '-- Pilih Kategori --' }}
                        </option>
                        <option v-for="category in availableCategories" :key="category.uuid" :value="category.uuid">
                            {{ category.name }}
                        </option>
                    </select>
                    <div v-if="categoriesLoading" class="spinner-border spinner-border-sm text-secondary mt-1" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                     <div v-if="!categoriesLoading && availableCategories.length === 0" class="form-text text-warning mt-1">
                        <i class="fas fa-exclamation-triangle me-1"></i> Tidak ada kategori.
                    </div>
                   </div>
                    <div class="form-group form-check form-switch mt-4"> <!-- Menggunakan form-switch -->
                        <input type="checkbox" class="form-check-input" id="productIsActive" v-model="currentProduct.is_active" role="switch">
                        <label class="form-check-label" for="productIsActive">Produk Aktif</label>
                    </div>
                </div>
                <!-- Kolom Kanan -->
                <div class="col-md-6">
                  <div class="form-group">
                    <label for="productDescription" class="form-label">Deskripsi <span class="text-muted">(Opsional)</span></label>
                    <textarea id="productDescription" v-model.trim="currentProduct.description" class="form-control" rows="4" placeholder="Deskripsi singkat produk"></textarea>
                  </div>
                   <div class="form-group">
                      <label class="form-label">Spesifikasi <span class="text-muted">(Opsional)</span></label>
                      <div v-if="currentProduct.specifications.length === 0" class="text-muted small mb-2">Belum ada spesifikasi.</div>
                      <div v-for="(spec, index) in currentProduct.specifications" :key="index" class="spec-row">
                          <input type="text" v-model.trim="spec.key" class="form-control form-control-sm" placeholder="Nama (cth: Warna)">
                          <input type="text" v-model.trim="spec.value" class="form-control form-control-sm" placeholder="Nilai (cth: Merah)">
                          <button type="button" @click="removeSpecificationRow(index)" class="btn btn-icon-sm btn-ghost-danger" title="Hapus">
                              <i class="fas fa-times"></i>
                          </button>
                      </div>
                      <button type="button" @click="addSpecificationRow" class="btn btn-sm btn-outline-secondary mt-2">
                          <i class="fas fa-plus me-1"></i> Tambah Spesifikasi
                      </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="closeFormModal">Batal</button>
            <button type="submit" form="productForm" class="btn btn-primary" :disabled="saving || categoriesLoading">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ saving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Produk') }}
            </button>
          </div>
        </div>
      </div>
    </div>

     <!-- Modal Audit History -->
     <div v-if="showAuditModal" class="modal-overlay" @click.self="closeAuditModal">
       <div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered"> <!-- Extra Large -->
         <div class="modal-content shadow-lg">
           <div class="modal-header">
             <h5 class="modal-title">
                 <i class="fas fa-history me-2"></i> Riwayat Audit: {{ productForAudit?.name }}
             </h5>
             <button type="button" class="btn-close" @click="closeAuditModal" aria-label="Close"></button>
           </div>
           <div class="modal-body">
             <div v-if="auditLoading" class="alert alert-light text-center">
                <div class="spinner-border text-primary me-2" role="status"> <span class="visually-hidden">Loading...</span> </div>
                Memuat riwayat audit...
            </div>
             <div v-if="auditError" class="alert alert-warning">{{ auditError }}</div> <!-- Warning for audit error -->

             <div v-if="!auditLoading && auditHistory.length > 0" class="table-responsive">
                 <table class="table table-sm table-bordered table-striped audit-table">
                 <thead class="sticky-top">
                   <tr>
                     <th>Event</th>
                     <th>User</th>
                     <th>Tanggal</th>
                     <th>Nilai Lama</th>
                     <th>Nilai Baru</th>
                     <th>IP Address</th>
                     <th>User Agent</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr v-for="audit in auditHistory" :key="audit.id">
                     <td><span :class="`badge bg-${getEventBadgeColor(audit.event)} text-uppercase`">{{ audit.event }}</span></td>
                     <!-- PERBAIKAN 2: Menggunakan v-if/v-else -->
                     <td>
                       <span v-if="audit.user">{{ audit.user.name }}</span>
                       <span v-else class='fst-italic text-muted'>System</span>
                       <small class="text-muted d-block"> (ID: {{ audit.user_id || 'N/A' }})</small>
                     </td>
                     <td>{{ formatAuditTimestamp(audit.created_at) }}</td>
                     <td><pre class="audit-values">{{ formatAuditValues(audit.old_values) }}</pre></td>
                     <td><pre class="audit-values">{{ formatAuditValues(audit.new_values) }}</pre></td>
                     <td><code class="fs-xs">{{ audit.ip_address || '-' }}</code></td>
                     <td><small class="user-agent" :title="audit.user_agent">{{ audit.user_agent || '-' }}</small></td>
                   </tr>
                 </tbody>
               </table>
             </div>

              <div v-if="!auditLoading && auditHistory.length === 0 && !auditError" class="alert alert-light text-center">
                 <i class="fas fa-info-circle me-2"></i> Tidak ada riwayat audit ditemukan.
              </div>
           </div>
           <div class="modal-footer">
             <button type="button" class="btn btn-outline-secondary" @click="closeAuditModal">Tutup</button>
           </div>
         </div>
       </div>
     </div>
</div>
       </div>
  </div>
</template>

<script setup>
// --- PASTIKAN SEMUA KODE SCRIPT DARI JAWABAN SEBELUMNYA ADA DI SINI ---
// (Termasuk import, apiClient, state refs, API functions, UI functions, helpers)
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';

const apiClient = axios.create({
  baseURL:  `${process.env.VUE_APP_API_URL}`, // --- SESUAIKAN BASE URL API ANDA ---
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
});
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken'); // --- GANTI KEY JIKA PERLU ---
  if (token) { config.headers.Authorization = `Bearer ${token}`; }
  // else { console.warn("Auth token not found"); } // Optional warning
  return config;
}, error => {
    console.error("Axios request interceptor error:", error); // Log error asli
    return Promise.reject(error);
});
apiClient.interceptors.response.use(response => response, error => {
    if (error.response && error.response.status === 401) {
        console.error("Unauthorized (401)");
        localStorage.removeItem('authToken'); // --- GANTI KEY JIKA PERLU ---
        alert("Sesi tidak valid. Silakan login kembali.");
        window.location.href = '/login'; // --- SESUAIKAN PATH LOGIN ---
    }
    return Promise.reject(error);
});

const products = ref([]);
const availableCategories = ref([]);
const loading = ref(false);
const categoriesLoading = ref(false);
const error = ref(null);
const saving = ref(false);
const formError = ref(null);
const showFormModal = ref(false);
const isEditing = ref(false);
const currentProduct = reactive({ uuid: null, product_code: '', name: '', description: '', specifications: [], is_active: true, category_id: '' });
const showAuditModal = ref(false);
const auditHistory = ref([]);
const auditLoading = ref(false);
const auditError = ref(null);
const productForAudit = ref(null);

const fetchProducts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await apiClient.get('/products');
    if (response.data && response.data.status) {
      products.value = response.data.data;
    } else {
      throw new Error(response.data.message || 'Gagal mengambil data produk.');
    }
  } catch (err) {
    console.error("Error fetching products:", err);
    error.value = err.response?.data?.message || err.message || 'Terjadi kesalahan saat mengambil data produk.';
  } finally {
    loading.value = false;
  }
};
const fetchAvailableCategories = async () => {
  categoriesLoading.value = true;
  try {
    const response = await apiClient.get('/categories');
    if (response.data && response.data.status) {
      availableCategories.value = response.data.data;
    } else {
      console.error("Failed to fetch categories:", response.data.message);
      availableCategories.value = [];
    }
  } catch (err) {
    console.error("Error fetching available categories:", err);
    formError.value = "Gagal memuat daftar kategori.";
    availableCategories.value = [];
  } finally {
    categoriesLoading.value = false;
  }
};
const saveProduct = async () => {
  saving.value = true;
  formError.value = null;
  if (!currentProduct.product_code || !currentProduct.name || !currentProduct.category_id) {
      formError.value = "Kode Produk, Nama Produk, dan Kategori wajib diisi.";
      saving.value = false;
      return;
  }
    const cleanSpecifications = currentProduct.specifications.filter(
        spec => spec.key?.trim() && spec.value?.trim()
    );
  const payload = {
    product_code: currentProduct.product_code, name: currentProduct.name, description: currentProduct.description,
    specifications: cleanSpecifications, is_active: currentProduct.is_active, category_id: currentProduct.category_id
  };
  const url = isEditing.value ? `/products/${currentProduct.uuid}` : '/products';
  const method = isEditing.value ? 'put' : 'post';
  try {
    const response = await apiClient({ method, url, data: payload });
    if (response.data && response.data.status) {
      closeFormModal();
      await fetchProducts();
    } else {
      throw new Error(response.data.message || `Gagal ${isEditing.value ? 'memperbarui' : 'membuat'} produk.`);
    }
  } catch (err) {
    console.error("Error saving product:", err);
    if (err.response?.status === 422) {
      const validationErrors = err.response.data.errors;
      let errorMsg = 'Kesalahan validasi: ';
      const errorMessages = [];
      for (const key in validationErrors) { errorMessages.push(`(${key}) ${validationErrors[key].join(', ')}`); }
      formError.value = errorMsg + errorMessages.join('; ');
    } else { formError.value = err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyimpan produk.'; }
  } finally { saving.value = false; }
};
const deleteProduct = async (uuid) => {
   error.value = null;
  try {
    const response = await apiClient.delete(`/products/${uuid}`);
    if (response.data && response.data.status) {
      await fetchProducts();
    } else { throw new Error(response.data.message || 'Gagal menghapus produk.'); }
  } catch (err) {
    console.error("Error deleting product:", err);
    error.value = err.response?.data?.message || err.message || 'Terjadi kesalahan saat menghapus produk.';
    setTimeout(() => { error.value = null; }, 7000);
  }
};
const fetchProductAuditHistory = async (uuid) => {
  auditLoading.value = true;
  auditError.value = null;
  auditHistory.value = [];
  try {
    const response = await apiClient.get(`/products/${uuid}/audits`);
    if (response.data && response.data.status) { auditHistory.value = response.data.data; }
    else { throw new Error(response.data.message || 'Gagal mengambil riwayat audit produk.'); }
  } catch (err) {
    console.error("Error fetching product audit history:", err);
    auditError.value = err.response?.data?.message || err.message || 'Gagal mengambil riwayat audit.';
  } finally { auditLoading.value = false; }
};
const openFormModal = (product = null) => {
  formError.value = null;
  Object.assign(currentProduct, { uuid: null, product_code: '', name: '', description: '', specifications: [], is_active: true, category_id: '' });
  if (product) {
    isEditing.value = true;
    currentProduct.uuid = product.uuid; currentProduct.product_code = product.product_code; currentProduct.name = product.name;
    currentProduct.description = product.description || ''; currentProduct.is_active = product.is_active ?? true; currentProduct.category_id = product.category_id || '';
    try {
        const parsedSpecs = JSON.parse(product.specifications || '[]');
        currentProduct.specifications = Array.isArray(parsedSpecs) ? parsedSpecs : [];
    } catch (e) { console.error("Error parsing specifications JSON:", e); currentProduct.specifications = []; formError.value = "Gagal memuat data spesifikasi produk."; }
  } else { isEditing.value = false; }
  fetchAvailableCategories();
  showFormModal.value = true;
};
const closeFormModal = () => { showFormModal.value = false; };
const confirmDelete = (uuid, name) => { if (window.confirm(`Hapus produk "${name}" (UUID: ${uuid})?`)) { deleteProduct(uuid); } };
const addSpecificationRow = () => { if (!Array.isArray(currentProduct.specifications)) { currentProduct.specifications = []; } currentProduct.specifications.push({ key: '', value: '' }); };
const removeSpecificationRow = (index) => { if (Array.isArray(currentProduct.specifications)) { currentProduct.specifications.splice(index, 1); } };
const showAuditHistory = (product) => { productForAudit.value = product; showAuditModal.value = true; fetchProductAuditHistory(product.uuid); };
const closeAuditModal = () => { showAuditModal.value = false; auditHistory.value = []; auditError.value = null; productForAudit.value = null; };
const formatAuditValues = (values) => { if (!values || Object.keys(values).length === 0) return '-'; try { return JSON.stringify(values, null, 2); } catch (e) { return String(values); } };
const formatAuditTimestamp = (timestamp) => { if (!timestamp) return '-'; try { return new Date(timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return timestamp; } };
const getEventBadgeColor = (event) => { switch (event) { case 'created': return 'success'; case 'updated': return 'warning'; case 'deleted': return 'danger'; default: return 'secondary'; } };
onMounted(() => { fetchProducts(); });

// --- END SCRIPT ---
</script>

<style scoped>
/* --- SEMUA GAYA DARI JAWABAN SEBELUMNYA HARUS ADA DI SINI --- */
:root {
  --font-family-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --primary-color: #4F46E5; --primary-hover: #4338CA; --secondary-color: #6B7280; --secondary-hover: #4B5563;
  --danger-color: #EF4444; --danger-hover: #DC2626; --warning-color: #F59E0B; --warning-hover: #D97706;
  --success-color: #10B981; --success-hover: #059669; --info-color: #3B82F6; --info-hover: #2563EB;
  --light-gray: #F3F4F6; --medium-gray: #D1D5DB; --dark-gray: #374151; --text-color: var(--dark-gray);
  --text-muted: var(--secondary-color); --border-color: #E5E7EB; --border-radius: 0.375rem;
  --border-radius-lg: 0.5rem; --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
.product-manager-container { font-family: var(--font-family-sans-serif); color: var(--text-color); background-color: #F9FAFB; padding: 2rem; max-width: 1280px; margin: 2rem auto; border-radius: var(--border-radius-lg); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
.page-title { font-size: 1.875rem; font-weight: 600; color: var(--dark-gray); margin: 0; }
.btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 500; line-height: 1.5; text-align: center; text-decoration: none; vertical-align: middle; cursor: pointer; user-select: none; background-color: transparent; border: 1px solid transparent; padding: 0.625rem 1.25rem; font-size: 0.875rem; border-radius: var(--border-radius); transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out; }
.btn-primary { background-color: var(--primary-color); border-color: var(--primary-color); color: white; }
.btn-primary:hover { background-color: var(--primary-hover); border-color: var(--primary-hover); }
.btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; } .btn i.me-1 { margin-right: 0.35rem; } .btn i.me-2 { margin-right: 0.5rem; }
.btn:disabled { cursor: not-allowed; opacity: 0.65; }
.feedback-section { margin-bottom: 1.5rem; }
.alert { border: none; border-radius: var(--border-radius); padding: 1rem 1.25rem; display: flex; align-items: center; }
.alert i { font-size: 1.2em; margin-right: 0.75rem; }
.alert-info { background-color: #EFF6FF; color: #1E40AF; } .alert-danger { background-color: #FEF2F2; color: #991B1B; }
.alert-secondary { background-color: var(--light-gray); color: var(--secondary-color); }
.alert-warning { background-color: #FFFBEB; color: #92400E; } .alert-light { background-color: var(--light-gray); color: var(--text-color); border: 1px solid var(--border-color); }
.spinner-border { display: inline-block; width: 2rem; height: 2rem; vertical-align: -0.125em; border: 0.25em solid currentColor; border-right-color: transparent; border-radius: 50%; -webkit-animation: .75s linear infinite spinner-border; animation: .75s linear infinite spinner-border; }
.spinner-border-sm { width: 1rem; height: 1rem; border-width: 0.2em; }
@-webkit-keyframes spinner-border { to { transform: rotate(360deg); } }
@keyframes spinner-border { to { transform: rotate(360deg); } }
.visually-hidden { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
.text-center { text-align: center !important; } .text-muted { color: var(--text-muted) !important; } .fst-italic { font-style: italic !important; } .fw-medium { font-weight: 500 !important; } .d-block { display: block !important; } .fs-xs { font-size: .75rem !important; }
.text-warning { color: var(--warning-color) !important; } .text-danger { color: var(--danger-color) !important; }
.mt-1 { margin-top: 0.25rem !important; } .mt-2 { margin-top: 0.5rem !important; } .mt-3 { margin-top: 1rem !important; } .mt-4 { margin-top: 1.5rem !important; }
.mb-2 { margin-bottom: 0.5rem !important; } .mb-3 { margin-bottom: 1rem !important; }
.table-container { background-color: white; border-radius: var(--border-radius-lg); border: 1px solid var(--border-color); overflow: hidden; }
.table-responsive { overflow-x: auto; }
.modern-table { border-collapse: separate; border-spacing: 0; width: 100%; margin-bottom: 0; }
.modern-table thead { background-color: var(--light-gray); }
.modern-table th { padding: 0.875rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--secondary-color); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid var(--border-color); white-space: nowrap; }
.modern-table tbody tr { transition: background-color 0.15s ease; }
.modern-table tbody tr:hover { background-color: #F9FAFB; }
.modern-table td { padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; font-size: 0.875rem; color: var(--text-color); }
.modern-table tbody tr:last-child td { border-bottom: none; }
.code-badge { font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; background-color: var(--light-gray); color: var(--secondary-color); padding: 0.25em 0.6em; border-radius: var(--border-radius); font-size: 0.8em; border: 1px solid var(--border-color); }
.status-badge { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px; white-space: nowrap; }
.status-badge i { font-size: 0.8em; }
.status-active { background-color: #ECFDF5; color: #065F46; } .status-inactive { background-color: #F1F5F9; color: #475569; }
.action-buttons { display: flex; justify-content: center; align-items: center; gap: 0.5rem; }
.btn-icon { padding: 0.4rem; line-height: 1; border-radius: var(--border-radius); width: 32px; height: 32px; display: inline-flex; justify-content: center; align-items: center; }
.btn-icon i { font-size: 0.9rem; }
.btn-outline-primary { color: var(--primary-color); border-color: var(--primary-color); } .btn-outline-primary:hover { background-color: #EEF2FF; color: var(--primary-hover); border-color: var(--primary-hover); }
.btn-outline-danger { color: var(--danger-color); border-color: var(--danger-color); } .btn-outline-danger:hover { background-color: #FEF2F2; color: var(--danger-hover); border-color: var(--danger-hover); }
.btn-outline-secondary { color: var(--secondary-color); border-color: var(--secondary-color); } .btn-outline-secondary:hover { background-color: var(--light-gray); color: var(--dark-gray); border-color: var(--dark-gray); }
.modal-overlay { position: fixed; inset: 0; background-color: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1050; padding: 1rem; overflow-y: auto; }
.modal-dialog { background-color: white; border-radius: var(--border-radius-lg); margin: auto; max-height: 90vh; display: flex; flex-direction: column; width: 100%; box-shadow: none; border: none; pointer-events: all; }
.modal-dialog.modal-lg { max-width: 800px; } .modal-dialog.modal-xl { max-width: 1140px; }
.modal-content { border: none; border-radius: inherit; box-shadow: var(--shadow-lg); overflow: hidden; flex: 1; display: flex; flex-direction: column; max-height: 100%; }
.modal-header { background-color: var(--light-gray); padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); }
.modal-title { font-size: 1.125rem; font-weight: 600; color: var(--dark-gray); } .modal-title i { color: var(--primary-color); }
.btn-close { background: none; border: none; font-size: 1.5rem; opacity: 0.7; transition: opacity 0.2s ease; cursor: pointer; padding: 0.5rem; margin: -0.5rem; } .btn-close:hover { opacity: 1; }
.modal-body { padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
.modal-footer { background-color: var(--light-gray); padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-outline-secondary { color: var(--secondary-color); border-color: var(--medium-gray); } .btn-outline-secondary:hover { background-color: var(--light-gray); border-color: var(--secondary-color); color: var(--secondary-color); }
.modern-form .form-group { margin-bottom: 1.25rem; }
.modern-form .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--dark-gray); margin-bottom: 0.5rem; }
.modern-form .form-control, .modern-form .form-select { display: block; width: 100%; padding: 0.625rem 0.875rem; font-size: 0.875rem; font-weight: 400; line-height: 1.5; color: var(--text-color); background-color: #fff; background-clip: padding-box; border: 1px solid var(--medium-gray); appearance: none; border-radius: var(--border-radius); transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; }
.modern-form .form-control::placeholder { color: var(--medium-gray); opacity: 1; }
.modern-form .form-control:focus, .modern-form .form-select:focus { border-color: var(--primary-color); outline: 0; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2); }
.modern-form .form-select { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.75rem center; background-size: 1.2em 1.2em; padding-right: 2.5rem; }
.modern-form .form-check { display: flex; align-items: center; } /* Align switch and label */
.modern-form .form-switch .form-check-input { height: 1.25rem; width: 2.5rem; margin-left: -0.25rem; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e"); background-position: left center; border-radius: 2rem; transition: background-position .15s ease-in-out; border-color: var(--medium-gray); background-color: var(--medium-gray); }
.modern-form .form-switch .form-check-input:focus { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e"); }
.modern-form .form-switch .form-check-input:checked { background-position: right center; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e"); background-color: var(--primary-color); border-color: var(--primary-color); }
.modern-form .form-check-label { padding-left: 0.75rem; font-size: 0.875rem; margin-bottom: 0; } /* Remove margin bottom */
.form-text { font-size: 0.8rem; }
.spec-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.spec-row input { font-size: 0.875rem; }
.btn-icon-sm { padding: 0.25rem; width: 24px; height: 24px; line-height: 1; } .btn-icon-sm i { font-size: 0.75rem; }
.btn-ghost-danger { background: transparent; border: none; color: var(--danger-color); padding: 0.25rem; width: 24px; height: 24px; display: inline-flex; justify-content: center; align-items: center; border-radius: var(--border-radius);} .btn-ghost-danger:hover { background-color: #FEF2F2; }
.audit-table th { background-color: var(--light-gray); font-size: 0.7rem; text-align: left; padding: 0.5rem 0.75rem;}
.audit-table td { font-size: 0.8rem; padding: 0.5rem 0.75rem;}
.audit-table .badge { font-size: 0.7rem; padding: 0.25em 0.5em; }
.audit-table .user-agent { max-width: 200px; font-size: 0.75rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
pre.audit-values { font-size: 0.75rem; max-height: 120px; background-color: white; border: 1px solid var(--border-color); padding: 8px; margin: 0; }
.modal-dialog-scrollable .modal-header, .modal-dialog-scrollable .modal-footer { flex-shrink: 0; } /* Prevent shrinking */
.modal-dialog-scrollable .sticky-top { background-color: var(--light-gray); /* Ensure bg color for sticky thead */ }
.row.g-3 { --bs-gutter-x: 1rem; --bs-gutter-y: 1rem; } /* Example gutter */
.col-md-6 { width: 50%; } /* Basic grid */
@media (max-width: 768px) {
  .product-manager-container { padding: 1rem; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .modern-table th, .modern-table td { padding: 0.75rem; white-space: normal; } /* Allow wrap on mobile */
  .action-buttons { justify-content: flex-start; }
  .modal-overlay { padding: 0.5rem; }
  .modal-dialog { max-width: calc(100% - 1rem); margin: 0.5rem; max-height: calc(100% - 1rem); }
  .modal-body { padding: 1rem; }
  .modal-footer { padding: 0.75rem 1rem; }
  .modern-form .row > [class*='col-'] { width: 100%; padding-left: 0; padding-right: 0;} /* Stack columns on mobile */
  .row.g-3 { --bs-gutter-x: 0; }
}

</style>