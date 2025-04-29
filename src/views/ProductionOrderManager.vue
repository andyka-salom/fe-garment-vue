<template>
  <div class="dashboard-view">
    <div class="container">
  <div class="production-order-manager-container"> <!-- Container class -->

    <!-- Header Halaman -->
    <header class="page-header">
      <h1 class="page-title">Manajemen Production Order</h1>
      <!-- Grup Tombol Aksi -->
      <div class="page-actions d-flex flex-wrap gap-2">
        <button @click="showImportModal = true" class="btn btn-success btn-sm">
          <i class="fas fa-file-import me-2"></i> Import Excel
        </button>
        <button @click="triggerExport" class="btn btn-info text-white btn-sm" :disabled="exporting || loading">
          <span v-if="exporting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <i v-else class="fas fa-file-export me-2"></i>
          {{ exporting ? 'Mengekspor...' : 'Export Excel' }}
        </button>
        <button @click="openFormModal()" class="btn btn-primary btn-sm">
          <i class="fas fa-plus me-2"></i> Tambah Order Baru
        </button>
      </div>
    </header>

    <!-- Kontrol Filter & Pencarian -->
    <div class="filter-controls mb-4 p-3 bg-white rounded-lg shadow-sm border">
      <div class="row g-2 align-items-end">
        <div class="col-lg-4 col-md-6">
          <label for="searchInput" class="form-label form-label-sm">Cari</label>
          <input type="text" id="searchInput" class="form-control form-control-sm" v-model="searchQuery" @keyup.enter="applyFiltersAndFetch" placeholder="No Order, Status...">
        </div>
        <div class="col-lg-2 col-md-6">
          <label for="statusFilter" class="form-label form-label-sm">Status</label>
          <select id="statusFilter" class="form-select form-select-sm" v-model="filterStatus" @change="applyFiltersAndFetch">
            <option value="">Semua</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div class="col-lg-3 col-md-6">
          <label for="sortBy" class="form-label form-label-sm">Urutkan</label>
          <div class="input-group input-group-sm">
            <select id="sortBy" class="form-select form-select-sm" v-model="sortBy" @change="applyFiltersAndFetch">
              <option value="order_date">Tgl Order</option>
              <option value="order_number">No Order</option>
              <option value="status">Status</option>
              <option value="created_at">Dibuat</option>
              <option value="is_priority">Prioritas</option>
            </select>
             <select id="sortOrder" class="form-select form-select-sm" style="max-width: 70px;" v-model="sortOrder" @change="applyFiltersAndFetch">
                 <option value="desc">Desc</option>
                 <option value="asc">Asc</option>
             </select>
          </div>
        </div>
        <div class="col-lg-auto col-md-6 d-grid">
          <button @click="applyFiltersAndFetch" class="btn btn-outline-secondary btn-sm" :disabled="loading">
            <i class="fas fa-filter me-1"></i> Terapkan
          </button>
        </div>
      </div>
    </div>

    <!-- Area Feedback (Alerts) -->
    <div class="feedback-section mb-4">
      <div v-if="loading" class="alert alert-info shadow-sm" role="status">
        <div class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></div>
        <span>Memuat data production order...</span>
      </div>
      <div v-if="error && !showFormModal && !showAuditModal && !showImportModal" class="alert alert-danger shadow-sm d-flex align-items-start" role="alert">
        <i class="fas fa-exclamation-triangle me-2 mt-1 flex-shrink-0"></i>
        <span>{{ error }}</span>
        <button type="button" class="btn-close btn-sm ms-auto p-1" @click="error = null" aria-label="Close"></button>
      </div>
       <div v-if="importSuccess" class="alert alert-success shadow-sm d-flex align-items-center" role="alert">
         <i class="fas fa-check-circle me-2"></i>
         <span>{{ importSuccess }}</span>
         <button type="button" class="btn-close btn-sm ms-auto p-1" @click="importSuccess = null" aria-label="Close"></button>
       </div>
       <div v-if="importError && !showImportModal" class="alert alert-danger shadow-sm d-flex align-items-start" role="alert">
         <i class="fas fa-exclamation-triangle me-2 mt-1 flex-shrink-0"></i>
          <span>{{ importError }}</span>
          <button type="button" class="btn-close btn-sm ms-auto p-1" @click="importError = null" aria-label="Close"></button>
       </div>
      <div v-if="!loading && orders.length === 0 && !error" class="alert alert-secondary text-center shadow-sm py-4" role="alert">
        <i class="fas fa-box-open fa-lg mb-2 d-block text-muted"></i> Belum ada data production order ditemukan.
      </div>
    </div>

    <!-- Tabel Production Order -->
    <div v-if="!loading && orders.length > 0" class="table-container bg-white rounded-lg shadow border">
      <div class="table-responsive">
        <table class="table table-hover align-middle modern-table mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" style="width: 15%;">Nomor Order</th>
              <th scope="col" style="width: 15%;">Tgl Order</th>
              <th scope="col" style="width: 12%;">Status</th>
              <th scope="col" style="width: 8%;" class="text-center">Prioritas</th>
              <th scope="col" style="width: 15%;">User</th>
              <th scope="col" style="width: 15%;">Customer Info</th>
              <th scope="col" style="width: 10%;" class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.uuid" class="align-middle">
              <td class="fw-medium"><code class="code-badge">{{ order.order_number }}</code></td>
              <td>{{ formatTimestamp(order.order_date) }}</td>
              <td><span :class="`badge rounded-pill bg-${getStatusBadgeColor(order.status)}`">{{ order.status }}</span></td>
              <td class="text-center">
                  <i v-if="order.is_priority" class="fas fa-star text-warning" title="Prioritas"></i>
                  <span v-else class="text-muted">-</span>
              </td>
              <td>{{ order.user?.name || order.user_id || 'N/A' }}</td>
              <td>
                <button v-if="order.customer_info" @click="showCustomerInfo(order.customer_info)" class="btn btn-sm btn-outline-secondary btn-icon" title="Lihat Customer Info">
                  <i class="fas fa-address-card"></i>
                </button>
                <span v-else class="text-muted fst-italic">-</span>
              </td>
              <td class="text-center">
                <div class="action-buttons">
                  <button @click="openFormModal(order)" class="btn btn-icon btn-sm btn-outline-primary" title="Edit Order">
                    <i class="fas fa-pencil-alt"></i>
                  </button>
                  <button @click="confirmDelete(order.uuid, order.order_number)" class="btn btn-icon btn-sm btn-outline-danger" title="Hapus Order">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                  <button @click="showAuditHistory(order)" class="btn btn-icon btn-sm btn-outline-secondary" title="Lihat Riwayat Audit">
                    <i class="fas fa-history"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
       <!-- Pagination -->
      <nav v-if="pagination.last_page > 1" aria-label="Page navigation" class="p-3 border-top bg-light">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center">
               <div class="text-muted small mb-2 mb-sm-0">
                  Hal {{ pagination.current_page }} dari {{ pagination.last_page }}. Total {{ pagination.total }} data.
              </div>
              <ul class="pagination pagination-sm justify-content-center mb-0 ms-sm-auto">
                  <li class="page-item" :class="{ disabled: pagination.current_page <= 1 }">
                      <a class="page-link" href="#" @click.prevent="changePage(pagination.current_page - 1)">
                          <i class="fas fa-chevron-left small"></i>
                      </a>
                  </li>
                  <li v-for="page in pageRange" :key="page" class="page-item" :class="{ active: page === pagination.current_page.toString(), disabled: page === '...' }">
                      <a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changePage(parseInt(page))">{{ page }}</a>
                      <span v-else class="page-link px-2">…</span>
                  </li>
                  <li class="page-item" :class="{ disabled: pagination.current_page >= pagination.last_page }">
                      <a class="page-link" href="#" @click.prevent="changePage(pagination.current_page + 1)">
                          <i class="fas fa-chevron-right small"></i>
                      </a>
                  </li>
              </ul>
          </div>
      </nav>
    </div>

    <!-- ======================= -->
    <!--         MODALS          -->
    <!-- ======================= -->

    <!-- Modal Form Tambah/Edit Order -->
    <div v-if="showFormModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content shadow-xl">
          <div class="modal-header">
            <h5 class="modal-title">
              <i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2 text-primary']"></i>
              {{ isEditing ? 'Edit Production Order' : 'Tambah Production Order Baru' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close" :disabled="saving"></button>
          </div>
          <div class="modal-body p-4">
            <div v-if="formError" class="alert alert-danger alert-dismissible fade show small p-2" role="alert">
               {{ formError }}
               <button type="button" class="btn-close btn-sm p-1" @click="formError = null" aria-label="Close"></button>
            </div>
            <form @submit.prevent="saveOrder" id="orderForm" class="modern-form">
              <div class="row g-3">
                <div class="col-md-6 mb-3">
                  <label for="orderNumber" class="form-label form-label-sm">Nomor Order <span class="text-danger">*</span></label>
                  <input type="text" class="form-control form-control-sm" id="orderNumber" v-model.trim="currentOrder.order_number" required placeholder="e.g., PO-2024-001" :disabled="saving">
                   <div v-if="fieldErrors.order_number" class="invalid-feedback d-block">{{ fieldErrors.order_number }}</div>
                </div>
                <div class="col-md-6 mb-3">
                   <label for="orderDate" class="form-label form-label-sm">Tanggal Order <span class="text-danger">*</span></label>
                   <input type="datetime-local" class="form-control form-control-sm" id="orderDate" v-model="currentOrder.order_date" required :disabled="saving">
                    <div v-if="fieldErrors.order_date" class="invalid-feedback d-block">{{ fieldErrors.order_date }}</div>
                 </div>
              </div>
              <div class="row g-3">
                  <div class="col-md-6 mb-3">
                      <label for="status" class="form-label form-label-sm">Status <span class="text-danger">*</span></label>
                      <select id="status" class="form-select form-select-sm" v-model="currentOrder.status" required :disabled="saving">
                           <option value="" disabled>Pilih Status</option>
                           <option value="Pending">Pending</option>
                           <option value="Processing">Processing</option>
                           <option value="Completed">Completed</option>
                           <option value="Cancelled">Cancelled</option>
                      </select>
                       <div v-if="fieldErrors.status" class="invalid-feedback d-block">{{ fieldErrors.status }}</div>
                  </div>
                  <div class="col-md-6 mb-3">
                      <label for="userId" class="form-label form-label-sm">User ID <span class="text-danger">*</span></label>
                      <input type="text" class="form-control form-control-sm" id="userId" v-model.trim="currentOrder.user_id" required placeholder="UUID User" :disabled="saving || isEditing">
                       <small v-if="isEditing" class="form-text text-muted">User ID tidak dapat diubah.</small>
                       <div v-if="fieldErrors.user_id" class="invalid-feedback d-block">{{ fieldErrors.user_id }}</div>
                  </div>
              </div>
               <div class="mb-3">
                 <label for="customerInfo" class="form-label form-label-sm">Customer Info <span class="text-muted">(Opsional, JSON)</span></label>
                 <textarea id="customerInfo" v-model="currentOrder.customer_info_text" class="form-control form-control-sm code-input" rows="4" placeholder='Contoh: { "name": "Customer A", "phone": "081..." }' :disabled="saving"></textarea>
                 <small class="form-text text-muted">Masukkan data customer dalam format JSON yang valid.</small>
                 <div v-if="customerInfoError" class="invalid-feedback d-block">{{ customerInfoError }}</div>
                  <div v-if="fieldErrors.customer_info" class="invalid-feedback d-block">{{ fieldErrors.customer_info }}</div>
               </div>
               <div class="mb-3">
                  <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" role="switch" id="isPriority" v-model="currentOrder.is_priority" :disabled="saving">
                      <label class="form-check-label" for="isPriority">Jadikan Prioritas?</label>
                  </div>
                   <div v-if="fieldErrors.is_priority" class="invalid-feedback d-block">{{ fieldErrors.is_priority }}</div>
               </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeModal" :disabled="saving">Batal</button>
            <button type="submit" form="orderForm" class="btn btn-primary btn-sm" :disabled="saving || !isFormValid">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ saving ? 'Menyimpan...' : (isEditing ? 'Update Order' : 'Simpan Order') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal Audit History -->
    <div v-if="showAuditModal" class="modal-overlay" @click.self="closeModal">
       <div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
         <div class="modal-content shadow-xl">
           <div class="modal-header">
             <h5 class="modal-title">
                 <i class="fas fa-history me-2 text-primary"></i> Riwayat Audit Order: <code class="code-badge bg-primary-light text-primary-dark">{{ orderForAudit?.order_number }}</code>
             </h5>
             <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
           </div>
           <div class="modal-body p-0"> {# Remove padding for full-width table #}
              <!-- Kondisi 1: Loading -->
              <div v-if="auditLoading" class="d-flex justify-content-center align-items-center p-5 text-muted">
                  <div class="spinner-border text-primary me-2" role="status"> <span class="visually-hidden">Loading...</span> </div>
                  Memuat riwayat audit...
              </div>
              <!-- Kondisi 2: Error (setelah tidak loading) -->
              <div v-else-if="auditError" class="alert alert-warning m-4">{{ auditError }}</div>
              <!-- Kondisi 3: Ada Data (setelah tidak loading dan tidak error) -->
              <div v-else-if="auditHistory.length > 0" class="table-responsive">
                 <table class="table table-sm table-bordered table-striped audit-table mb-0">
                 <thead class="table-light sticky-top">
                   <tr>
                     <th style="width: 8%;">Event</th>
                     <th style="width: 15%;">User</th>
                     <th style="width: 15%;">Tanggal</th>
                     <th>Nilai Lama</th>
                     <th>Nilai Baru</th>
                     <th style="width: 10%;">IP</th>
                     <th style="width: 15%;">User Agent</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr v-for="audit in auditHistory" :key="audit.id">
                      <td><span :class="`badge bg-${getEventBadgeColor(audit.event)} text-uppercase`">{{ audit.event }}</span></td>
                      <td>
                          <span v-if="audit.user" class="fw-medium">{{ audit.user.name }}</span>
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
             <!-- Kondisi 4: Tidak Ada Data (setelah tidak loading dan tidak error) -->
             <div v-else class="alert alert-light text-center m-4">
                  <i class="fas fa-info-circle me-2"></i> Tidak ada riwayat audit ditemukan.
             </div>
           </div>
           <div class="modal-footer">
             <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeModal">Tutup</button>
           </div>
         </div>
       </div>
    </div>
     <!-- Modal Import -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="closeModal">
       <div class="modal-dialog modal-dialog-centered">
         <div class="modal-content shadow-xl">
           <div class="modal-header">
             <h5 class="modal-title"><i class="fas fa-file-import me-2 text-success"></i> Import Production Orders</h5>
             <button type="button" class="btn-close" @click="closeModal" aria-label="Close" :disabled="importing"></button>
           </div>
           <div class="modal-body p-4">
              <div v-if="importError" class="alert alert-danger alert-dismissible fade show small p-2" role="alert"> {# Use specific importError state #}
                 {{ importError }}
                 <button type="button" class="btn-close btn-sm p-1" @click="importError = null" aria-label="Close"></button>
              </div>
              <div class="mb-3">
                  <label for="importFile" class="form-label form-label-sm">Pilih file Excel (.xlsx, .csv)</label>
                  <input class="form-control form-control-sm" type="file" id="importFile" @change="handleFileChange" accept=".xlsx,.csv,.ods">
              </div>
               <div v-if="importFile" class="mt-2 small bg-light border rounded p-2">
                  File dipilih: <strong class="text-success">{{ importFile.name }}</strong> ({{ (importFile.size / 1024).toFixed(1) }} KB)
               </div>
               <div class="mt-3 alert alert-warning small p-2 d-flex align-items-start">
                   <i class="fas fa-exclamation-triangle me-2 mt-1 flex-shrink-0"></i>
                   <div>Pastikan format kolom & header file sesuai. <br> Download template <a href="/templates/production_order_template.xlsx" download class="fw-bold text-decoration-underline">di sini</a>.</div>
               </div>
           </div>
           <div class="modal-footer">
             <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeModal" :disabled="importing">Batal</button>
             <button type="button" class="btn btn-success btn-sm" @click="triggerImport" :disabled="!importFile || importing">
               <span v-if="importing" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
               {{ importing ? 'Mengimpor...' : 'Mulai Import' }}
             </button>
           </div>
         </div>
       </div>
     </div>

      <!-- Modal Customer Info -->
      <div v-if="showCustomerInfoModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content shadow-xl">
                  <div class="modal-header">
                      <h5 class="modal-title"><i class="fas fa-address-card me-2 text-info"></i> Detail Customer Info</h5>
                      <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body p-4">
                      <pre class="customer-info-pre bg-light border rounded p-3">{{ formattedCustomerInfo }}</pre>
                  </div>
                  <div class="modal-footer">
                      <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeModal">Tutup</button>
                  </div>
              </div>
          </div>
      </div>
</div>
      </div>
</div> <!-- End of .production-order-manager-container -->
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';

// --- Konfigurasi ---
const toast = useToast();
const router = useRouter();

// --- Environment Variable (Vue CLI) ---
const API_BASE_URL = process.env.VUE_APP_API_URL;
let isApiConfigured = true;
if (!API_BASE_URL) {
  isApiConfigured = false;
  console.error("VUE_APP_API_URL is not defined. Please check your .env file and restart the server.");
  toast.error("Konfigurasi server tidak ditemukan.", { timeout: 10000 });
}

// --- Axios Instance ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

// --- Axios Interceptors ---
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use((response) => response, (error) => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    console.error(`Auth Error (${error.response.status}). Redirecting...`);
    toast.error('Sesi Anda telah berakhir atau tidak sah.', { timeout: 7000 });
    setTimeout(() => { router.push('/'); }, 1500);
    error.message = 'UnauthorizedRedirect'; // Set custom flag
  }
  return Promise.reject(error);
});

// --- State Variables ---
const orders = ref([]);
const pagination = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });
const loading = ref(false);
const error = ref(null); // Error utama halaman
const saving = ref(false);
const formError = ref(null); // Error spesifik modal form
const showFormModal = ref(false);
const isEditing = ref(false);
const currentOrder = reactive({
    uuid: null, order_number: '', order_date: '', customer_info_text: '',
    status: '', is_priority: false, user_id: '', user: null
});
const customerInfoError = ref(null);
const showAuditModal = ref(false);
const auditHistory = ref([]);
const auditLoading = ref(false);
const auditError = ref(null); // Error spesifik modal audit
const orderForAudit = ref(null);
const showImportModal = ref(false);
const importFile = ref(null);
const importing = ref(false);
const importError = ref(null); // Error spesifik modal import
const importSuccess = ref(null);
const exporting = ref(false);
const showCustomerInfoModal = ref(false);
const customerInfoToDisplay = ref(null);
const searchQuery = ref('');
const filterStatus = ref('');
const sortBy = ref('order_date');
const sortOrder = ref('desc');
const fieldErrors = reactive({});
// const userNameInput = ref(null); // Removed as it was unused

// --- Computed Properties ---
const isFormValid = computed(() => {
    if (!currentOrder.order_number || !currentOrder.order_date || !currentOrder.status || !currentOrder.user_id) return false;
    if (customerInfoError.value) return false;
    if (Object.keys(fieldErrors).length > 0) return false;
    return true;
});

const formattedCustomerInfo = computed(() => {
    if (!customerInfoToDisplay.value) return '';
    try {
        const parsed = JSON.parse(customerInfoToDisplay.value);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return customerInfoToDisplay.value;
    }
});

const pageRange = computed(() => {
    const current = pagination.value.current_page;
    const last = pagination.value.last_page;
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;
    if(last <= 1) return ['1'];
    for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) range.push(i); }
    for (let i of range) { if (l) { if (i - l === 2) rangeWithDots.push((l + 1).toString()); else if (i - l > 2) rangeWithDots.push('...'); } rangeWithDots.push(i.toString()); l = i; }
    return rangeWithDots;
});

// --- Watchers ---
watch(() => currentOrder.customer_info_text, (newValue) => {
    if (!newValue || newValue.trim() === '') {
        customerInfoError.value = null;
        delete fieldErrors.customer_info;
        return;
    }
    try {
        JSON.parse(newValue);
        customerInfoError.value = null;
         delete fieldErrors.customer_info;
    } catch (e) {
        customerInfoError.value = 'Format JSON tidak valid.';
    }
});

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleString('id-ID', options);
  } catch (e) { return dateString; }
};

const formatTimestamp = (timestamp) => {
    return formatDate(timestamp);
};

const formatAuditTimestamp = (timestamp) => {
     if (!timestamp) return '-';
     try {
         const date = new Date(timestamp);
         if (isNaN(date)) return timestamp;
         return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium'});
     } catch (e) { return timestamp; }
};

const formatAuditValues = (values) => {
    if (values === null || typeof values !== 'object' || Object.keys(values).length === 0) return '-';
    try {
        return JSON.stringify(values, null, 2);
    } catch (e) { return String(values); }
};

const extractApiErrorMessage = (responseData, returnFieldErrors = false) => {
    let generalMessage = 'Terjadi kesalahan.';
    let fields = {};
    if (responseData?.errors) {
        fields = { ...responseData.errors };
        const firstErrorKey = Object.keys(fields)[0];
        generalMessage = fields[firstErrorKey]?.[0] ? `${firstErrorKey}: ${fields[firstErrorKey][0]}` : (responseData.message || "Validasi gagal.");
    } else if (responseData?.message) {
        generalMessage = responseData.message;
    }
    Object.keys(fields).forEach(key => {
        if (Array.isArray(fields[key]) && fields[key].length > 0) fields[key] = fields[key][0];
        else if (typeof fields[key] !== 'string') delete fields[key];
    });
    return returnFieldErrors ? { general: generalMessage, fields: fields } : generalMessage;
};

// --- Define getErrorMessage function ---
const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => {
    if (error.message === 'UnauthorizedRedirect') { return ''; }
    if (error.response) {
        console.error("API Error Response:", error.response);
        let apiMessage = error.response.data?.message || error.response.data?.error || error.response.data?.detail;
        if (error.response.status === 422 && error.response.data?.errors) {
            const errors = error.response.data.errors;
            const firstErrorKey = Object.keys(errors)[0];
            if (firstErrorKey && Array.isArray(errors[firstErrorKey]) && errors[firstErrorKey].length > 0) {
                 apiMessage = errors[firstErrorKey][0];
            } else { apiMessage = apiMessage || 'Data yang dikirim tidak valid.'; }
        }
         if (error.response.status === 401) return 'Akses ditolak. Silakan login kembali.';
         if (error.response.status === 403) return 'Anda tidak memiliki izin untuk melakukan tindakan ini.';
        return apiMessage || `Error ${error.response.status}: ${error.response.statusText || defaultMessage}`;
    } else if (error.request) {
        console.error("Network Error:", error.request);
        return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    } else {
        console.error("Generic Error:", error);
        return error.message || defaultMessage;
    }
};
// --- END Define getErrorMessage function ---


const handleApiError = (err, defaultMessage = 'Terjadi kesalahan.', setModalErr = false) => {
  if (err.message === 'UnauthorizedRedirect') return;

  let errorMessage = defaultMessage;
  let errorFields = {};

  if (err.response) {
    const extracted = extractApiErrorMessage(err.response.data, true);
    errorMessage = extracted.general;
    errorFields = extracted.fields;
    if (err.response.status === 404) errorMessage = "Data tidak ditemukan.";
  } else if (err.request) {
    errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
  } else {
    errorMessage = err.message || defaultMessage;
  }

  if (setModalErr) {
    formError.value = errorMessage; // Use formError for form modal general errors
    Object.assign(fieldErrors, errorFields); // Assign extracted field errors
  } else {
    error.value = errorMessage; // Set error for main page display
  }
  if(errorMessage) toast.error(errorMessage, { timeout: 7000 });
};

const getEventBadgeColor = (event) => {
    switch (event?.toLowerCase()) {
        case 'created': return 'success'; case 'updated': return 'warning';
        case 'deleted': return 'danger'; case 'restored': return 'info';
        default: return 'secondary';
    }
};

const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending': return 'secondary'; case 'processing': return 'primary';
        case 'completed': return 'success'; case 'cancelled': return 'danger';
        case 'on hold': return 'warning'; default: return 'light text-dark border';
    }
};

// --- Core Logic Methods ---
const fetchOrders = async (page = 1) => {
    if (!isApiConfigured) return;
    loading.value = true;
    error.value = null;
    importSuccess.value = null;
    if (!showImportModal.value) importError.value = null;
    try {
        const params = {
            page, per_page: pagination.value.per_page || 10,
            search: searchQuery.value || undefined, status: filterStatus.value || undefined,
            sort_by: sortBy.value, order: sortOrder.value, with: 'user'
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        const response = await apiClient.get('/production-orders', { params });
        const responseData = response.data;
        const items = responseData.data;
        const meta = responseData.meta || {
            current_page: responseData.current_page, last_page: responseData.last_page,
            per_page: responseData.per_page, total: responseData.total,
            from: responseData.from, to: responseData.to
        };
        if (items && Array.isArray(items) && meta) {
            orders.value = items; pagination.value = { ...pagination.value, ...meta };
        } else {
            console.warn("Unexpected API pagination structure:", responseData);
            handleApiError({ response: response }, 'Format data pagination tidak valid.');
            orders.value = []; pagination.value = { current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 };
        }
    } catch (err) {
        handleApiError(err, 'Gagal mengambil data order.');
        orders.value = []; pagination.value = { current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 };
    } finally { loading.value = false; }
};

const validateForm = () => { // Combined validation logic
    formError.value = null;
    Object.keys(fieldErrors).forEach(key => delete fieldErrors[key]);
    let isValid = true;
    if (!currentOrder.order_number) { fieldErrors.order_number = 'Nomor order wajib diisi.'; isValid = false; }
    if (!currentOrder.order_date) { fieldErrors.order_date = 'Tanggal order wajib diisi.'; isValid = false; }
    if (!currentOrder.status) { fieldErrors.status = 'Status wajib dipilih.'; isValid = false; }
    if (!currentOrder.user_id) { fieldErrors.user_id = 'User ID wajib diisi.'; isValid = false; }
    customerInfoError.value = null;
    if (currentOrder.customer_info_text && currentOrder.customer_info_text.trim() !== '') {
        try { JSON.parse(currentOrder.customer_info_text); }
        catch (e) { customerInfoError.value = 'Format JSON tidak valid.'; fieldErrors.customer_info = 'Format JSON tidak valid.'; isValid = false; }
    }
    if(!isValid && !formError.value) { formError.value = "Harap perbaiki isian formulir."; }
    return isValid;
};

const saveOrder = async () => {
    if (!isApiConfigured || !validateForm()) {
        if(!isApiConfigured) toast.error("Konfigurasi server tidak valid.");
        else toast.warning("Harap perbaiki isian formulir.");
        return;
    }
    saving.value = true; formError.value = null;
    const action = isEditing.value ? 'memperbarui' : 'membuat';
    const actionPast = isEditing.value ? 'diperbarui' : 'dibuat';
    let customerInfoJSON = null;
    if (currentOrder.customer_info_text && currentOrder.customer_info_text.trim() !== '') {
         try { customerInfoJSON = JSON.parse(currentOrder.customer_info_text); } catch(e){ /* Should be caught by validateForm */ }
    }
    let formattedDate = '';
    if (currentOrder.order_date) {
        try {
            const dateObj = new Date(currentOrder.order_date); if (isNaN(dateObj)) throw new Error("Invalid Date");
            const year = dateObj.getFullYear(); const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const day = dateObj.getDate().toString().padStart(2, '0'); const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:00`;
        } catch (e) { /* Should be caught by validateForm */ return; }
    } else { /* Should be caught by validateForm */ return; }

    const payload = {
        order_number: currentOrder.order_number, order_date: formattedDate,
        customer_info: customerInfoJSON ? JSON.stringify(customerInfoJSON) : null,
        status: currentOrder.status, is_priority: Boolean(currentOrder.is_priority),
        user_id: currentOrder.user_id,
    };
    const url = isEditing.value ? `/production-orders/${currentOrder.uuid}` : '/production-orders';
    const method = isEditing.value ? 'put' : 'post';

    try {
        const response = await apiClient({ method, url, data: payload });
        if (response.status === 200 || response.status === 201) {
            closeModal(); await fetchOrders(isEditing.value ? pagination.value.current_page : 1);
            toast.success(response.data?.message || `Order berhasil ${actionPast}!`);
        } else { handleApiError({ response: response }, `Gagal ${action} order.`, true); }
    } catch (err) {
        const extracted = extractApiErrorMessage(err.response?.data, true);
        handleApiError(err, `Terjadi kesalahan saat ${action} order.`, true);
        Object.assign(fieldErrors, extracted.fields);
    } finally { saving.value = false; }
};

const deleteOrder = async (uuid, orderNumber) => {
    if (!isApiConfigured) return;
    const toastId = toast.info(`Menghapus Order "${orderNumber}"...`, { timeout: false, closeButton: false, icon: "fas fa-spinner fa-spin" });
    error.value = null;
    try {
        const response = await apiClient.delete(`/production-orders/${uuid}`);
        if (response.status === 200 || response.status === 204) {
            toast.update(toastId, { content: response.data?.message || `Order "${orderNumber}" dihapus!`, type: 'success', timeout: 5000, closeButton: true, icon: true });
            const currentPage = pagination.value.current_page;
            const totalOnPage = (pagination.value.to || 0) - (pagination.value.from || 0) + 1;
            const goToPage = (totalOnPage === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            await fetchOrders(goToPage);
        } else {
            handleApiError({ response: response }, `Gagal menghapus Order "${orderNumber}"`);
             toast.update(toastId, { content: error.value || `Gagal menghapus "${orderNumber}"`, type: 'error', timeout: 7000, closeButton: true, icon: true });
        }
    } catch (err) {
        handleApiError(err, `Error menghapus Order "${orderNumber}"`);
        toast.dismiss(toastId);
    }
};

const fetchAuditHistory = async (uuid) => {
    if (!isApiConfigured) return;
    auditLoading.value = true; auditError.value = null; auditHistory.value = [];
    try {
        const response = await apiClient.get(`/production-orders/${uuid}/audits`);
        const auditsData = response.data?.data || response.data;
        if (Array.isArray(auditsData)) { auditHistory.value = auditsData; }
        else {
            console.warn("Unexpected audit API response structure:", response.data);
            auditError.value = "Format data audit tidak sesuai."; auditHistory.value = [];
        }
    } catch (err) {
        // Use handleApiError for toast/logging, but set specific state
        handleApiError(err, 'Gagal mengambil riwayat audit.');
        auditError.value = getErrorMessage(err, 'Gagal mengambil riwayat audit.'); // Set specific audit error state
    } finally { auditLoading.value = false; }
};

const triggerExport = async () => {
    if (!isApiConfigured) { toast.error("Konfigurasi server tidak valid."); return; }
    exporting.value = true; error.value = null;
    try {
        const params = {
            search: searchQuery.value || undefined, status: filterStatus.value || undefined,
            sort_by: sortBy.value, order: sortOrder.value
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        const response = await apiClient.get('/production-orders/export', { responseType: 'blob', params });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        const link = document.createElement('a'); link.href = url;
        let filename = 'production_orders_export.xlsx';
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
             if (filenameMatch && filenameMatch[1]) filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
             else { const simpleMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/); if (simpleMatch && simpleMatch[1]) filename = simpleMatch[1]; }
        }
        link.setAttribute('download', filename); document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
        toast.success("Data berhasil diekspor.");
    } catch (err) { handleApiError(err, 'Gagal mengekspor data.'); }
    finally { exporting.value = false; }
};

const handleFileChange = (event) => {
    importError.value = null; const file = event.target.files[0];
    if (file) {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.oasis.opendocument.spreadsheet'];
        if (!allowedTypes.includes(file.type)) { importError.value = 'Tipe file tidak valid (.xlsx, .csv, .ods).'; importFile.value = null; event.target.value = ''; return; }
        importFile.value = file;
    } else { importFile.value = null; }
};

const triggerImport = async () => {
    if (!isApiConfigured || !importFile.value) {
        if(!isApiConfigured) toast.error("Konfigurasi server tidak valid."); else importError.value = "Silakan pilih file untuk diimpor."; return; }
    importing.value = true; importError.value = null; importSuccess.value = null; error.value = null;
    const formData = new FormData(); formData.append('file', importFile.value);
    try {
        const response = await apiClient.post('/production-orders/import', formData);
        if (response.data?.success || response.status === 200) {
            closeModal(); importSuccess.value = response.data?.message || 'Data berhasil diimpor.';
            await fetchOrders(1); importFile.value = null;
        } else {
            // Use handleApiError for consistent error message display, set specific importError state
            handleApiError({ response: response }, 'Gagal mengimpor data.');
            importError.value = getErrorMessage({ response: response }, 'Gagal mengimpor data.');
        }
    } catch (err) {
       // Use handleApiError for toast/logging, but set specific state
       handleApiError(err, 'Terjadi kesalahan saat mengimpor data.');
       importError.value = getErrorMessage(err, 'Terjadi kesalahan saat mengimpor data.');
    } finally {
        importing.value = false;
        const fileInput = document.getElementById('importFile');
        if (fileInput) fileInput.value = '';
    }
};

// --- UI Functions ---
const openFormModal = (order = null) => {
    if (!isApiConfigured) { toast.error("Konfigurasi server tidak valid."); return; }
    formError.value = null; customerInfoError.value = null; error.value = null;
    Object.keys(fieldErrors).forEach(key => delete fieldErrors[key]);
    if (order) {
        isEditing.value = true;
        const orderDate = order.order_date ? new Date(order.order_date) : null;
        const formattedDate = orderDate && !isNaN(orderDate) ? orderDate.toISOString().slice(0, 16) : '';
        let customerInfoText = '';
        if (order.customer_info) { try { customerInfoText = JSON.stringify(JSON.parse(order.customer_info), null, 2); } catch (e) { customerInfoText = order.customer_info; } }
        Object.assign(currentOrder, { ...order, order_date: formattedDate, customer_info_text: customerInfoText });
    } else { isEditing.value = false; Object.assign(currentOrder, getEmptyOrder()); }
    showFormModal.value = true;
     nextTick(() => { const firstInput = document.querySelector('#orderForm input:not([disabled]), #orderForm select:not([disabled]), #orderForm textarea:not([disabled])'); firstInput?.focus(); });
};

const closeModal = () => {
    showFormModal.value = false; showAuditModal.value = false; showImportModal.value = false; showCustomerInfoModal.value = false;
    formError.value = null; auditError.value = null; importError.value = null; customerInfoError.value = null;
    saving.value = false; importing.value = false; auditHistory.value = []; orderForAudit.value = null;
    importFile.value = null; customerInfoToDisplay.value = null;
    Object.assign(currentOrder, getEmptyOrder()); Object.keys(fieldErrors).forEach(key => delete fieldErrors[key]);
};

const confirmDelete = (uuid, orderNumber) => {
    if (!isApiConfigured) { toast.error("Konfigurasi server tidak valid."); return; }
     if (window.confirm(`Yakin hapus Order "${orderNumber}"? Data akan diarsipkan.`)) { deleteOrder(uuid, orderNumber); }
};

const showAuditHistory = (order) => {
    if (!isApiConfigured) { toast.error("Konfigurasi server tidak valid."); return; }
    orderForAudit.value = order; error.value = null; importSuccess.value = null; auditError.value = null; auditHistory.value = [];
    showAuditModal.value = true; fetchAuditHistory(order.uuid);
};

const showCustomerInfo = (info) => {
    customerInfoToDisplay.value = info; showCustomerInfoModal.value = true;
};

const applyFiltersAndFetch = () => { fetchOrders(1); };

const changePage = (page) => {
    const pageNum = parseInt(page);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pagination.value.last_page && pageNum !== pagination.value.current_page) { fetchOrders(pageNum); }
};

// Function to get empty order structure
const getEmptyOrder = () => ({
    uuid: null, order_number: '', order_date: '', customer_info_text: '',
    status: '', is_priority: false, user_id: '', user: null
});

// --- Lifecycle Hook ---
onMounted(() => {
   if (isApiConfigured) { fetchOrders(); }
   else { error.value = "Konfigurasi server tidak valid. Fitur tidak dapat dimuat."; }
});
</script>

<style scoped>
/* Styles from previous answer, adapted for this component */
.production-order-manager-container {
  flex-grow: 1; display: flex; flex-direction: column;
  background-color: var(--color-gray-50, #F9FAFB); padding: 1.5rem; width: 100%;
}
.page-header { padding-bottom: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-gray-200, #E5E7EB); flex-shrink: 0; }
.page-title { font-size: 1.5rem; font-weight: 600; }
.page-actions .btn-sm { font-size: 0.8rem; padding: 0.375rem 0.75rem; }
.filter-controls { border-radius: var(--border-radius-lg, 0.5rem); border: 1px solid var(--color-gray-200, #E5E7EB); flex-shrink: 0; }
.form-label-sm { font-size: 0.7rem; margin-bottom: 0.2rem; color: var(--color-gray-600, #4B5563); font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; }
.filter-controls .input-group-sm .form-select { max-width: calc(100% - 70px); }
.table-container { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; border-radius: var(--border-radius-lg, 0.5rem); border: 1px solid var(--color-gray-200, #E5E7EB); box-shadow: var(--shadow, 0 1px 3px 0 rgb(0 0 0 / 0.1)); background-color: var(--white, #ffffff); }
.table-responsive { overflow-y: auto; flex-grow: 1; }
.modern-table thead { position: sticky; top: 0; z-index: 10; background-color: var(--color-gray-50, #F9FAFB); }
.modern-table th { font-size: 0.7rem; padding: 0.65rem 1rem; }
.modern-table td { font-size: 0.85rem; padding: 0.65rem 1rem; }
.code-badge { font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; background-color: var(--color-gray-100, #F3F4F6); color: var(--color-gray-600, #4B5563); padding: 0.2em 0.5em; border-radius: var(--border-radius-sm, 0.25rem); font-size: 0.85em; border: 1px solid var(--color-gray-200, #E5E7EB); display: inline-block; }
.code-badge.bg-primary-light { background-color: var(--color-primary-light, #EEF2FF); color: var(--color-primary-dark, #3730A3); border-color: var(--color-primary, #4F46E5); font-weight: 600; }
.modern-table .badge { font-size: 0.7rem; }
.modern-table .btn-icon.btn-sm { width: 28px; height: 28px; }
.modern-table .btn-icon.btn-sm i { font-size: 0.8rem; }
.modern-table .fa-star { font-size: 0.9rem; }
nav[aria-label="Page navigation"] { flex-shrink: 0; background-color: var(--color-gray-50, #F9FAFB); }
.pagination { margin-bottom: 0; }
.page-item:first-child .page-link { border-top-left-radius: var(--border-radius, 0.375rem); border-bottom-left-radius: var(--border-radius, 0.375rem); }
.page-item:last-child .page-link { border-top-right-radius: var(--border-radius, 0.375rem); border-bottom-right-radius: var(--border-radius, 0.375rem); }
.pagination-sm .page-link { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
.pagination-sm .page-link i.small { font-size: 0.7em; }
.page-link:focus { box-shadow: 0 0 0 0.2rem rgba(var(--color-primary-rgb, 79, 70, 229), 0.25); }
.modal-overlay { z-index: 1050; }
.modal-dialog { transition: transform 0.3s ease-out; }
.modal-overlay.show .modal-dialog { transform: scale(1); opacity: 1; }
.modal-content { box-shadow: var(--shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1)); }
.modal-body, .modal-footer { font-size: 0.9rem; }
.modal-title { font-size: 1.1rem; }
.modal-footer .btn-sm { font-size: 0.8rem; padding: 0.375rem 0.75rem; }
.modal-body .alert .btn-close { padding: 0.5rem; }
.modern-form .form-label-sm { font-size: 0.7rem; margin-bottom: 0.2rem; color: var(--color-gray-600); font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; }
.modern-form .form-control-sm, .modern-form .form-select-sm { padding: 0.375rem 0.75rem; font-size: .8rem; border-radius: var(--border-radius-sm, 0.25rem); }
textarea.code-input { font-size: 0.8rem; }
.form-text { font-size: 0.75rem; }
.invalid-feedback { font-size: 0.75rem; }
.invalid-feedback.d-block { display: block !important; }
.form-check-label { font-size: 0.85rem; }
.modal-xl { max-width: 90%; }
.audit-table th { background-color: var(--color-gray-100, #F3F4F6); font-size: 0.7rem; padding: 0.5rem 0.75rem; }
.audit-table td { font-size: 0.75rem; padding: 0.5rem 0.75rem; vertical-align: top; }
.audit-table .badge { font-size: 0.65rem; }
.audit-table .user-agent { max-width: 160px; font-size: 0.7rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-gray-500, #6B7280); }
pre.audit-values { font-size: 0.7rem; max-height: 120px; padding: 6px; }
.modal-dialog-scrollable thead.sticky-top { z-index: 10; box-shadow: inset 0 -1px 0 var(--color-gray-300, #D1D5DB); }
pre.customer-info-pre { font-size: 0.8rem; max-height: 60vh; }
@media (max-width: 768px) {
    .production-order-manager-container { padding: 1rem; }
    .filter-controls .row > div { margin-bottom: 0.75rem; }
    .modern-table th, .modern-table td { padding: 0.5rem 0.6rem; font-size: 0.75rem; }
    .action-buttons { gap: 0.3rem; }
    .modal-xl { max-width: calc(100% - 1rem); }
    nav[aria-label="Page navigation"] .d-flex { flex-direction: column !important; align-items: center !important; }
    nav[aria-label="Page navigation"] .text-muted { margin-bottom: 0.5rem !important; }
    nav[aria-label="Page navigation"] .ms-sm-auto { margin-left: 0 !important; }
}
@media (max-width: 576px) {
    .page-title { font-size: 1.3rem; }
    .modern-table th { font-size: 0.65rem; }
    .modern-table td { font-size: 0.7rem; }
    .pagination { font-size: 0.8rem; }
    .pagination .page-link { padding: 0.3rem 0.5rem; }
}
/* Ensure container takes full height */
.production-order-manager-container { display: flex; flex-direction: column; flex-grow: 1; }
/* Add utility classes if needed globally */
.text-muted { color: var(--text-light, #777777); }
.fst-italic { font-style: italic; }
.text-center { text-align: center; }
.d-block { display: block; }
.mb-2 { margin-bottom: 0.5rem; }
.text-decoration-underline { text-decoration: underline; }
.fw-bold { font-weight: var(--font-weight-bold, 700); }
.d-flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.gap-2 { gap: 0.5rem; }
.flex-shrink-0 { flex-shrink: 0; }
.align-items-start { align-items: flex-start; }
.align-items-center { align-items: center; }
.mt-1 { margin-top: 0.25rem; }
.ms-auto { margin-left: auto; }
.p-1 { padding: 0.25rem; }
.d-grid { display: grid; }
.me-1 { margin-right: 0.25rem; }
.me-2 { margin-right: 0.5rem; }
.me-3 { margin-right: 1rem; }
.mb-0 { margin-bottom: 0; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.p-0 { padding: 0; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 1rem; }
.p-4 { padding: 1.5rem; }
.p-5 { padding: 3rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-4 { padding-left: 1.5rem; padding-right: 1.5rem; }
.bg-white { background-color: var(--white, #ffffff); }
.bg-light { background-color: var(--background-light-gray, #F9FAFB); }
.rounded-lg { border-radius: var(--border-radius-lg, 0.5rem); }
.shadow-sm { box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)); }
.shadow-xl { box-shadow: var(--shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1)); }
.border { border: 1px solid var(--color-gray-200, #E5E7EB); }
.text-primary { color: var(--primary-color, #4F46E5); }
.text-success { color: var(--success-color, #10B981); }
.text-info { color: var(--info-color, #3B82F6); }
.text-warning { color: var(--warning-color, #F59E0B); }
.text-danger { color: var(--error-color, #EF4444); }
.text-white { color: var(--white, #ffffff); }
.text-uppercase { text-transform: uppercase; }
.fs-xs { font-size: 0.75rem; } /* Extra small font size */
.fade { transition: opacity .15s linear; }
.fade.show { opacity: 1; }
.alert-dismissible .btn-close { position: absolute; top: 0; right: 0; z-index: 2; padding: 1.25rem 1rem; }
.modal-dialog-scrollable .modal-body { overflow-y: auto; }
.modal-dialog-centered { display: flex; align-items: center; min-height: calc(100% - 1rem); }
@media (min-width: 576px) { .modal-dialog-centered { min-height: calc(100% - 3.5rem); } }
.row { --bs-gutter-x: 1.5rem; --bs-gutter-y: 0; display: flex; flex-wrap: wrap; margin-top: calc(-1 * var(--bs-gutter-y)); margin-right: calc(-.5 * var(--bs-gutter-x)); margin-left: calc(-.5 * var(--bs-gutter-x)); }
.row > * { flex-shrink: 0; width: 100%; max-width: 100%; padding-right: calc(var(--bs-gutter-x) * .5); padding-left: calc(var(--bs-gutter-x) * .5); margin-top: var(--bs-gutter-y); }
.g-2 { --bs-gutter-x: 0.5rem; --bs-gutter-y: 0.5rem; }
.g-3 { --bs-gutter-x: 1rem; --bs-gutter-y: 1rem; }
@media (min-width: 768px) { .col-md-6 { flex: 0 0 auto; width: 50%; } }
@media (min-width: 992px) { .col-lg-2 { flex: 0 0 auto; width: 16.66666667%; } .col-lg-3 { flex: 0 0 auto; width: 25%; } .col-lg-4 { flex: 0 0 auto; width: 33.33333333%; } .col-lg-auto { flex: 0 0 auto; width: auto; } }
.input-group { position: relative; display: flex; flex-wrap: wrap; align-items: stretch; width: 100%; }
.input-group > .form-control, .input-group > .form-select { position: relative; flex: 1 1 auto; width: 1%; min-width: 0; }
.input-group > .form-control:focus, .input-group > .form-select:focus { z-index: 3; }
.input-group .form-select:not(:last-child) { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.input-group .form-select:not(:first-child) { border-top-left-radius: 0; border-bottom-left-radius: 0; margin-left: -1px;}
.input-group-sm > .form-control, .input-group-sm > .form-select, .input-group-sm > .input-group-text { padding: 0.375rem 0.75rem; font-size: .8rem; border-radius: var(--border-radius-sm); }
.form-check { display: block; min-height: 1.5rem; padding-left: 1.5em; margin-bottom: .125rem; }
.form-check .form-check-input { float: left; margin-left: -1.5em; }
.form-check-input { width: 1em; height: 1em; margin-top: .25em; vertical-align: top; background-color: #fff; background-repeat: no-repeat; background-position: center; background-size: contain; border: 1px solid rgba(0,0,0,.25); appearance: none; print-color-adjust: exact; }
.form-check-input[type=checkbox] { border-radius: .25em; }
.form-check-input[type=checkbox]:checked { background-color: var(--color-primary); border-color: var(--color-primary); background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e"); }
.form-check-label { color: inherit; cursor: pointer; }
.form-switch { padding-left: 2.5em; }
.form-switch .form-check-input { width: 2em; margin-left: -2.5em; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba%280, 0, 0, 0.25%29'/%3e%3c/svg%3e"); background-position: left center; border-radius: 2em; transition: background-position .15s ease-in-out; }
.form-switch .form-check-input:focus { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%2386b7fe'/%3e%3c/svg%3e"); }
.form-switch .form-check-input:checked { background-position: right center; background-color: var(--color-primary); border-color: var(--color-primary); background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e"); }
.visually-hidden { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0,0,0,0) !important; white-space: nowrap !important; border: 0 !important; }

</style>