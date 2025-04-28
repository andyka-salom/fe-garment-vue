<template>
    <!-- Container Utama dengan gaya modern -->
    <div class="production-order-manager-container bg-gray-50">
      <!-- Header Halaman -->
      <header class="page-header">
        <h1 class="page-title">Manajemen Production Order</h1>
        <!-- Grup Tombol Aksi -->
        <div class="page-actions d-flex flex-wrap gap-2">
            <button @click="showImportModal = true" class="btn btn-success">
                <i class="fas fa-file-import me-2"></i> Import Excel
            </button>
            <button @click="triggerExport" class="btn btn-info text-white" :disabled="exporting">
                <span v-if="exporting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                <i v-else class="fas fa-file-export me-2"></i>
                {{ exporting ? 'Mengekspor...' : 'Export Excel' }}
            </button>
            <!-- Tombol Tambah dibuat lebih menonjol -->
            <button @click="openFormModal()" class="btn btn-primary btn-lg shadow-sm hover:shadow">
                 <i class="fas fa-plus me-2"></i> Tambah Order Baru
            </button>
        </div>
      </header>

      <!-- Kontrol Filter & Pencarian dalam Card -->
      <div class="filter-controls mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
         <div class="row g-3 align-items-end"> 
            <div class="col-md-4">
                <label for="searchInput" class="form-label fw-medium text-gray-600">Cari Order</label>
                <input type="text" id="searchInput" class="form-control form-control-sm" v-model="searchQuery" @keyup.enter="applyFiltersAndFetch" placeholder="Nomor Order, Status, User ID...">
            </div>
            <div class="col-md-3">
                <label for="statusFilter" class="form-label fw-medium text-gray-600">Filter Status</label>
                <select id="statusFilter" class="form-select form-select-sm" v-model="filterStatus" @change="applyFiltersAndFetch">
                    <option value="">Semua Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>
            <div class="col-md-3">
                 <label for="sortBy" class="form-label fw-medium text-gray-600">Urutkan</label>
                 <select id="sortBy" class="form-select form-select-sm" v-model="sortBy" @change="applyFiltersAndFetch">
                     <option value="order_date">Tanggal Order</option>
                     <option value="order_number">Nomor Order</option>
                     <option value="status">Status</option>
                     <option value="created_at">Tanggal Dibuat</option>
                      <option value="is_priority">Prioritas</option>
                 </select>
             </div>
            <div class="col-md-2 d-grid">
                <button @click="applyFiltersAndFetch" class="btn btn-outline-secondary btn-sm" :disabled="loading">
                    <i class="fas fa-filter me-1"></i> Terapkan
                </button>
            </div>
         </div>
      </div>

      <!-- Area Feedback (Alerts) -->
      <div class="feedback-section mb-4">
        <div v-if="loading" class="alert alert-info d-flex align-items-center shadow-sm" role="alert">
          <div class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></div>
          <span>Memuat data production order, mohon tunggu...</span>
        </div>
        <div v-if="error && !showFormModal && !showAuditModal && !showImportModal" class="alert alert-danger shadow-sm d-flex align-items-start" role="alert"> {/* align-items-start for better wrapping */}
          <i class="fas fa-exclamation-triangle me-2 mt-1 flex-shrink-0"></i>
          <span>{{ error }}</span>
          <button type="button" class="btn-close btn-sm ms-auto" @click="error = null" aria-label="Close"></button>
        </div>
         <div v-if="importSuccess" class="alert alert-success shadow-sm d-flex align-items-center" role="alert">
           <i class="fas fa-check-circle me-2"></i>
           <span>{{ importSuccess }}</span>
           <button type="button" class="btn-close btn-sm ms-auto" @click="importSuccess = null" aria-label="Close"></button>
         </div>
         <div v-if="importError && !showImportModal" class="alert alert-danger shadow-sm d-flex align-items-start" role="alert">
           <i class="fas fa-exclamation-triangle me-2 mt-1 flex-shrink-0"></i>
            <span>{{ importError }}</span>
            <button type="button" class="btn-close btn-sm ms-auto" @click="importError = null" aria-label="Close"></button>
         </div>
        <div v-if="!loading && orders.length === 0 && !error" class="alert alert-secondary text-center shadow-sm py-4" role="alert">
          <i class="fas fa-box-open fa-2x mb-2 d-block text-gray-400"></i> Belum ada data production order ditemukan.
        </div>
      </div>

      <!-- Tabel Production Order dalam Container -->
      <div v-if="!loading && orders.length > 0" class="table-container bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle modern-table mb-0">
            <thead class="table-light"> 
              <tr>
                <th scope="col" style="width: 15%;">Nomor Order</th>
                <th scope="col" style="width: 15%;">Tgl Order</th> 
                <th scope="col" style="width: 12%;">Status</th>
                <th scope="col" style="width: 8%;" class="text-center">Prioritas</th>
                <th scope="col" style="width: 15%;">User ID</th>
                <th scope="col" style="width: 15%;">Customer Info</th>
                <th scope="col" style="width: 15%;" class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.uuid" class="align-middle">
                <td class="fw-medium"><code class="code-badge">{{ order.order_number }}</code></td>
                <td>{{ formatTimestamp(order.order_date) }}</td>
                <td><span :class="`badge rounded-pill bg-${getStatusBadgeColor(order.status)}`">{{ order.status }}</span></td>
                <td class="text-center">
                    <i v-if="order.is_priority" class="fas fa-star text-warning fa-lg" title="Prioritas"><!-- Larger icon --></i>
                    <span v-else class="text-muted">-</span>
                </td>
                <td><code class="fs-xs text-muted">{{ order.user_id }}</code></td>
                <td>
                  <button v-if="order.customer_info" @click="showCustomerInfo(order.customer_info)" class="btn btn-sm btn-outline-secondary btn-icon" title="Lihat Customer Info">
                    <i class="fas fa-address-card"></i>
                  </button>
                  <span v-else class="text-muted fst-italic">-</span>
                </td>
                <td class="text-center">
                  <div class="action-buttons">
                    <button @click="openFormModal(order)" class="btn btn-icon btn-outline-primary" title="Edit Order">
                      <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button @click="confirmDelete(order.uuid, order.order_number)" class="btn btn-icon btn-outline-danger" title="Hapus Order">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                    <button @click="showAuditHistory(order)" class="btn btn-icon btn-outline-secondary" title="Lihat Riwayat Audit">
                      <i class="fas fa-history"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
         <!-- Pagination -->
        <nav v-if="pagination.last_page > 1" aria-label="Page navigation" class="p-3 border-top border-gray-200 bg-gray-50">
            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                 <div class="text-muted small mb-2 mb-sm-0">
                    Menampilkan {{ pagination.from }} - {{ pagination.to }} dari {{ pagination.total }} data
                </div>
                <ul class="pagination justify-content-center mb-0 ms-sm-auto"> {/* Align right on larger screens */}
                    <li class="page-item" :class="{ disabled: pagination.current_page <= 1 }">
                        <a class="page-link" href="#" @click.prevent="changePage(pagination.current_page - 1)">
                            <i class="fas fa-chevron-left"></i> {/* Icon for prev/next */}
                        </a>
                    </li>
                    <li v-for="page in pageRange" :key="page" class="page-item" :class="{ active: page === pagination.current_page, disabled: page === '...' }">
                        <a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                        <span v-else class="page-link">...</span>
                    </li>
                    <li class="page-item" :class="{ disabled: pagination.current_page >= pagination.last_page }">
                        <a class="page-link" href="#" @click.prevent="changePage(pagination.current_page + 1)">
                            <i class="fas fa-chevron-right"></i> {/* Icon for prev/next */}
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
              <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
              <div v-if="formError" class="alert alert-danger alert-dismissible fade show small p-2" role="alert">
                 {{ formError }}
                 <button type="button" class="btn-close btn-sm p-2" @click="formError = null" aria-label="Close"></button>
              </div>
              <form @submit.prevent="saveOrder" id="orderForm" class="modern-form">
                <div class="row g-3">
                  <div class="col-md-6 mb-3">
                    <label for="orderNumber" class="form-label">Nomor Order <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="orderNumber" v-model.trim="currentOrder.order_number" required placeholder="e.g., PO-2024-001" :disabled="saving">
                  </div>
                  <div class="col-md-6 mb-3">
                     <label for="orderDate" class="form-label">Tanggal Order <span class="text-danger">*</span></label>
                     <input type="datetime-local" class="form-control form-control-sm" id="orderDate" v-model="currentOrder.order_date" required :disabled="saving">
                   </div>
                </div>
                <div class="row g-3">
                    <div class="col-md-6 mb-3">
                        <label for="status" class="form-label">Status <span class="text-danger">*</span></label>
                        <select id="status" class="form-select form-select-sm" v-model="currentOrder.status" required :disabled="saving">
                             <option value="" disabled>Pilih Status</option>
                             <option value="Pending">Pending</option>
                             <option value="Processing">Processing</option>
                             <option value="Completed">Completed</option>
                             <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="userId" class="form-label">User ID <span class="text-danger">*</span></label>
                        <input type="text" class="form-control form-control-sm" id="userId" v-model.trim="currentOrder.user_id" required placeholder="UUID User" :disabled="saving || isEditing">
                         <small class="form-text text-muted">UUID user (tidak bisa diubah saat edit)</small>
                    </div>
                </div>
                 <div class="mb-3">
                   <label for="customerInfo" class="form-label">Customer Info <span class="text-muted">(Opsional, JSON)</span></label>
                   <textarea id="customerInfo" v-model="currentOrder.customer_info_text" class="form-control form-control-sm code-input" rows="4" placeholder='Contoh: {
  "name": "Customer A",
  "address": "Jalan Contoh 123",
  "phone": "08123456789"
}' :disabled="saving"></textarea>
                   <small class="form-text text-muted">Masukkan data customer dalam format JSON yang valid.</small>
                   <div v-if="customerInfoError" class="text-danger small mt-1">{{ customerInfoError }}</div>
                 </div>
                 <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="isPriority" v-model="currentOrder.is_priority" :disabled="saving">
                        <label class="form-check-label" for="isPriority">Jadikan Prioritas?</label>
                    </div>
                 </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="saving">Batal</button>
              <button type="submit" form="orderForm" class="btn btn-primary" :disabled="saving || !isFormValid">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ saving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Order') }}
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
             <div class="modal-body p-0">
                <div v-if="auditLoading" class="d-flex justify-content-center align-items-center p-5">
                    <div class="spinner-border text-primary me-2" role="status"> <span class="visually-hidden">Loading...</span> </div>
                    Memuat riwayat audit...
                </div>
                <div v-if="auditError" class="alert alert-warning m-4">{{ auditError }}</div>
                <div v-if="!auditLoading && auditHistory.length > 0" class="table-responsive">
                   <table class="table table-sm table-bordered table-striped audit-table mb-0"> 
                   <thead class="sticky-top table-light"> 
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
               <div v-if="!auditLoading && auditHistory.length === 0 && !auditError" class="alert alert-light text-center m-4">
                    <i class="fas fa-info-circle me-2"></i> Tidak ada riwayat audit ditemukan.
               </div>
             </div>
             <div class="modal-footer">
               <button type="button" class="btn btn-outline-secondary" @click="closeModal">Tutup</button>
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
               <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
             </div>
             <div class="modal-body p-4">
                <div v-if="importError" class="alert alert-danger small p-2">{{ importError }}</div>
                <div class="mb-3">
                    <label for="importFile" class="form-label">Pilih file Excel (.xlsx, .csv)</label>
                    <input class="form-control form-control-sm" type="file" id="importFile" @change="handleFileChange" accept=".xlsx,.csv"> {/* Limit accepted types */}
                </div>
                 <div v-if="importFile" class="mt-2 small bg-light border rounded p-2">
                    File dipilih: <strong class="text-success">{{ importFile.name }}</strong>
                 </div>
                 <div class="mt-3 alert alert-warning small p-2 d-flex align-items-center">
                     <i class="fas fa-exclamation-triangle me-2 flex-shrink-0"></i>
                     <div>Pastikan format kolom & header file sesuai. <br> Download template <a href="/path/to/template.xlsx" download class="fw-bold">di sini</a>.</div> {/* Add template link */}
                 </div>
             </div>
             <div class="modal-footer">
               <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="importing">Batal</button>
               <button type="button" class="btn btn-success" @click="triggerImport" :disabled="!importFile || importing">
                 <span v-if="importing" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                 {{ importing ? 'Mengimpor...' : 'Mulai Import' }}
               </button>
             </div>
           </div>
         </div>
       </div>

        <!-- Modal Customer Info -->
        <div v-if="showCustomerInfoModal" class="modal-overlay" @click.self="showCustomerInfoModal = false">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content shadow-xl">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-address-card me-2 text-info"></i> Detail Customer Info</h5>
                        <button type="button" class="btn-close" @click="showCustomerInfoModal = false" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <pre class="customer-info-pre bg-light border rounded p-3">{{ formattedCustomerInfo }}</pre>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="showCustomerInfoModal = false">Tutup</button>
                    </div>
                </div>
            </div>
        </div>

    </div>
  </template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import axios from 'axios';

// --- Konfigurasi Axios (Sesuaikan Base URL) ---
const apiClient = axios.create({
  baseURL: 'http://back-end.test/api', // --- SESUAIKAN BASE URL API ANDA ---
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
     // Jika menggunakan auth: 'Authorization': `Bearer ${localStorage.getItem('token')}` // Contoh
  }
});

// --- Interceptor untuk menangani 401/403 (Contoh) ---
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error("Unauthorized or Forbidden access. Redirecting...");
      // Redirect ke halaman login atau tampilkan pesan
      // window.location.href = '/login'; // Contoh redirect
      // Set error flag atau emit event jika perlu
      error.message = 'UnauthorizedRedirect'; // Custom flag to avoid double errors
    }
    // Penting: Handle Content-Type untuk FormData secara otomatis oleh browser
    if (error.config?.data instanceof FormData) {
        delete error.config.headers['Content-Type'];
    }
    return Promise.reject(error);
  }
);

// --- State Variables ---
const orders = ref([]);
const pagination = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });
const loading = ref(false);
const error = ref(null);
const saving = ref(false);
const formError = ref(null);
const showFormModal = ref(false);
const isEditing = ref(false);
const currentOrder = reactive({
    uuid: null, order_number: '', order_date: '', customer_info_text: '',
    status: '', is_priority: false, user_id: '',
});
const customerInfoError = ref(null);
const showAuditModal = ref(false);
const auditHistory = ref([]);
const auditLoading = ref(false);
const auditError = ref(null);
const orderForAudit = ref(null);
const showImportModal = ref(false);
const importFile = ref(null);
const importing = ref(false);
const importError = ref(null);
const importSuccess = ref(null);
const exporting = ref(false);
const showCustomerInfoModal = ref(false);
const customerInfoToDisplay = ref(null);
const searchQuery = ref('');
const filterStatus = ref('');
const sortBy = ref('order_date'); // Default sort
const sortOrder = ref('desc'); // Default order

// --- Computed Properties ---
const isFormValid = computed(() => {
    return currentOrder.order_number && currentOrder.order_date && currentOrder.status && currentOrder.user_id && !customerInfoError.value;
});

const formattedCustomerInfo = computed(() => {
    if (!customerInfoToDisplay.value) return '';
    try {
        // Coba parse dulu, jika gagal, tampilkan apa adanya
        const parsed = JSON.parse(customerInfoToDisplay.value);
        return JSON.stringify(parsed, null, 2); // Pretty print JSON
    } catch (e) {
        return customerInfoToDisplay.value; // Tampilkan string asli jika bukan JSON valid
    }
});

// Improved pageRange for pagination with ellipsis
const pageRange = computed(() => {
    const current = pagination.value.current_page;
    const last = pagination.value.last_page;
    const delta = 1; // Number of pages around current page
    const left = current - delta;
    const right = current + delta + 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || (i >= left && i < right)) {
            range.push(i);
        }
    }

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l > 2) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }
    // Convert numbers to strings for v-for key and display
    return rangeWithDots.map(String);
});

// --- Watchers ---
watch(() => currentOrder.customer_info_text, (newValue) => {
    if (!newValue || newValue.trim() === '') {
        customerInfoError.value = null;
        return;
    }
    try {
        JSON.parse(newValue);
        customerInfoError.value = null;
    } catch (e) {
        customerInfoError.value = 'Format JSON tidak valid.';
    }
});

// Watch filters to trigger fetch
watch([searchQuery, filterStatus, sortBy, sortOrder], () => {
    // Optional: Debounce this if needed to avoid rapid API calls while typing
    // applyFiltersAndFetch(); // Replaced with manual apply button
});


// --- API Functions ---
const fetchOrders = async (page = 1) => {
    loading.value = true;
    error.value = null; // Clear previous errors
    importSuccess.value = null; // Clear import success message
    // Reset import error only if import modal is not shown
    if (!showImportModal.value) importError.value = null;

    try {
        // Construct parameters, only include if they have values
        const params = {
            page,
            per_page: pagination.value.per_page || 10, // Use current per_page or default
            search: searchQuery.value || undefined,
            status: filterStatus.value || undefined,
            sort_by: sortBy.value,
            order: sortOrder.value
        };
        const response = await apiClient.get('/production-orders', { params });

        if (response.data && response.data.data) {
            orders.value = response.data.data;
            // Update pagination state correctly from API response
            pagination.value = {
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to,
            };
        } else {
            // Handle cases where API returns unexpected structure but not an error status
            console.warn("Unexpected API response structure:", response.data);
            throw new Error('Format respons API tidak valid.');
        }
    } catch (err) {
        // Check if the error is the custom flag from the interceptor
        if (err.message !== 'UnauthorizedRedirect') {
            console.error("Error fetching orders:", err);
            error.value = getErrorMessage(err, 'Terjadi kesalahan saat mengambil data order.');
            // Reset data on error
            orders.value = [];
            pagination.value = { current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 };
        }
    } finally {
        loading.value = false;
    }
};

const saveOrder = async () => {
    if (!isFormValid.value) {
        formError.value = "Harap periksa kembali isian form.";
        return;
    }

    let customerInfoJSON = null;
    // Validate and parse JSON only if text exists
    if (currentOrder.customer_info_text && currentOrder.customer_info_text.trim() !== '') {
        try {
            customerInfoJSON = JSON.parse(currentOrder.customer_info_text);
        } catch (e) {
            customerInfoError.value = 'Format JSON tidak valid.';
            formError.value = "Format Customer Info JSON tidak valid.";
            return; // Stop submission
        }
    }

    saving.value = true;
    formError.value = null;
    customerInfoError.value = null; // Clear specific JSON error too

    const url = isEditing.value ? `/production-orders/${currentOrder.uuid}` : '/production-orders';
    const method = isEditing.value ? 'put' : 'post';

    // Format date for backend (assuming YYYY-MM-DD HH:MM:SS)
    // HTML datetime-local returns YYYY-MM-DDTHH:MM
    let formattedDate = '';
    if (currentOrder.order_date) {
        try {
            // Append ':00' for seconds if backend requires it
            formattedDate = currentOrder.order_date.replace('T', ' ') + ':00';
            // Or directly use ISO string if backend handles it:
            // formattedDate = new Date(currentOrder.order_date).toISOString();
        } catch (e) {
            console.error("Invalid date format:", currentOrder.order_date);
            formError.value = "Format tanggal order tidak valid.";
            saving.value = false;
            return;
        }
    }

    const payload = {
        order_number: currentOrder.order_number,
        order_date: formattedDate,
        // Send JSON string or null
        customer_info: customerInfoJSON ? JSON.stringify(customerInfoJSON) : null,
        status: currentOrder.status,
        is_priority: Boolean(currentOrder.is_priority), // Ensure boolean
        user_id: currentOrder.user_id, // Assuming user_id is required and valid
    };

    try {
        const response = await apiClient({ method, url, data: payload });

        // Check for successful status codes (200 OK or 201 Created)
        if (response.data && (response.status === 200 || response.status === 201)) {
            closeModal(); // Close modal on success
            // Fetch data again: go to page 1 if creating, stay on current page if editing
            await fetchOrders(isEditing.value ? pagination.value.current_page : 1);
            // Optional: Show a success notification/toast here
        } else {
            // Handle unexpected success responses
             throw new Error(response.data.message || `Gagal ${isEditing.value ? 'memperbarui' : 'membuat'} order.`);
        }
    } catch (err) {
        // Check if the error is the custom flag from the interceptor
        if (err.message !== 'UnauthorizedRedirect') {
            console.error("Error saving order:", err);
            // Set formError instead of the global error for modal context
            formError.value = getErrorMessage(err, `Terjadi kesalahan saat ${isEditing.value ? 'menyimpan' : 'membuat'} order.`);
        }
    } finally {
        saving.value = false;
    }
};

const deleteOrder = async (uuid) => {
    // Optional: Add a loading state specific to deletion if needed
    // loadingDelete.value = true;
    error.value = null; // Clear previous global errors

    try {
        const response = await apiClient.delete(`/production-orders/${uuid}`);

        if (response.data && response.status === 200) {
            // Success: Fetch orders on the potentially now empty page or previous page
            const currentPage = pagination.value.current_page;
            const totalOnPage = pagination.value.to - pagination.value.from + 1;
            const goToPage = (totalOnPage === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
            await fetchOrders(goToPage);
            // Optional: Show success notification
        } else {
            throw new Error(response.data.message || 'Gagal menghapus order.');
        }
    } catch (err) {
         // Check if the error is the custom flag from the interceptor
         if (err.message !== 'UnauthorizedRedirect') {
            console.error("Error deleting order:", err);
            // Display error globally, maybe with a timeout
            error.value = getErrorMessage(err, 'Terjadi kesalahan saat menghapus order.');
            setTimeout(() => { error.value = null; }, 7000); // Auto-hide error after 7s
         }
    } finally {
        // loadingDelete.value = false;
    }
};

const fetchAuditHistory = async (uuid) => {
    auditLoading.value = true;
    auditError.value = null;
    auditHistory.value = []; // Clear previous history

    try {
        const response = await apiClient.get(`/production-orders/${uuid}/audits`);
        // Check if response.data itself is the array or if it's nested under response.data.data
        if (response.data && Array.isArray(response.data)) {
           auditHistory.value = response.data;
        } else if(response.data?.data && Array.isArray(response.data.data)) {
            // Handle cases where data is nested, e.g., paginated audit results (though less common)
            auditHistory.value = response.data.data;
            // You might need to handle audit pagination here if applicable
        } else {
            // Handle unexpected structure
            console.warn("Unexpected audit API response structure:", response.data);
            auditHistory.value = []; // Set to empty array if structure is wrong
        }
    } catch (err) {
         // Check if the error is the custom flag from the interceptor
         if (err.message !== 'UnauthorizedRedirect') {
            console.error("Error fetching audit history:", err);
            // Set auditError for display within the audit modal
            auditError.value = getErrorMessage(err, 'Terjadi kesalahan saat mengambil riwayat audit.');
         }
    } finally {
        auditLoading.value = false;
    }
};

const triggerExport = async () => {
    exporting.value = true;
    error.value = null; // Clear previous errors

    try {
        // Request the file as a blob
        const response = await apiClient.get('/production-orders/export', {
            responseType: 'blob', // Important for file download
            // Add filters to export if needed
            params: {
                search: searchQuery.value || undefined,
                status: filterStatus.value || undefined,
                // Add other relevant filters for export
            }
        });

        // Create a URL for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Extract filename from Content-Disposition header if available
        let filename = 'production_orders_export.xlsx'; // Default filename
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        link.setAttribute('download', filename); // Set the filename
        document.body.appendChild(link);
        link.click(); // Trigger download

        // Clean up
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (err) {
         if (err.message !== 'UnauthorizedRedirect') {
           console.error("Error exporting data:", err);
           error.value = getErrorMessage(err, 'Gagal mengekspor data.');
           setTimeout(() => { error.value = null; }, 7000); // Auto-hide error
        }
    } finally {
        exporting.value = false;
    }
};

const handleFileChange = (event) => {
    importError.value = null; // Clear error when a new file is selected
    const file = event.target.files[0];
    // Basic validation (optional: check file type/size here)
    if (file) {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
        if (!allowedTypes.includes(file.type)) {
            importError.value = 'Tipe file tidak valid. Hanya .xlsx atau .csv yang diizinkan.';
            importFile.value = null;
            event.target.value = ''; // Clear the input
            return;
        }
        // Add size limit check if needed
        // const maxSize = 5 * 1024 * 1024; // 5MB
        // if (file.size > maxSize) { ... }

        importFile.value = file;
    } else {
        importFile.value = null;
    }
};

const triggerImport = async () => {
    if (!importFile.value) {
        importError.value = "Silakan pilih file untuk diimpor.";
        return;
    }

    importing.value = true;
    importError.value = null; // Clear previous import errors
    importSuccess.value = null; // Clear previous success message
    error.value = null; // Clear global error

    const formData = new FormData();
    formData.append('file', importFile.value);
    // Add other form data if needed: formData.append('key', 'value');

    try {
        // Axios interceptor should handle Content-Type for FormData
        const response = await apiClient.post('/production-orders/import', formData);

        if (response.data && (response.status === 200 || response.status === 201)) {
            closeModal(); // Close import modal
            importSuccess.value = response.data.message || 'Data berhasil diimpor.'; // Show success message globally
            await fetchOrders(1); // Refresh data, go to first page
            importFile.value = null; // Reset file input state variable
        } else {
             throw new Error(response.data.message || 'Gagal mengimpor data.');
        }
    } catch (err) {
         if (err.message !== 'UnauthorizedRedirect') {
            console.error("Error importing data:", err);
            // Show error within the import modal
            importError.value = getErrorMessage(err, 'Terjadi kesalahan saat mengimpor data.');
         }
         // Do not close modal on import error
    } finally {
        importing.value = false;
    }
};


// --- UI Functions ---
const openFormModal = (order = null) => {
    // Clear errors relevant to the form modal
    formError.value = null;
    customerInfoError.value = null;
    error.value = null; // Also clear global error maybe?

    if (order) {
        // --- EDITING ---
        isEditing.value = true;
        // Safely format date for datetime-local input (YYYY-MM-DDTHH:mm)
        const orderDate = order.order_date ? new Date(order.order_date) : null;
        // Check if date is valid before formatting
        const formattedDate = orderDate && !isNaN(orderDate)
          ? orderDate.toISOString().slice(0, 16) // Cuts off seconds and Z
          : ''; // Provide empty string if date is invalid/null

        // Safely parse and format customer_info
        let customerInfoText = '';
        if (order.customer_info) {
            try {
                 // Parse first to validate, then stringify prettily
                const parsedInfo = JSON.parse(order.customer_info);
                customerInfoText = JSON.stringify(parsedInfo, null, 2);
            } catch (e) {
                console.warn("Invalid JSON in customer_info for order:", order.uuid, order.customer_info);
                customerInfoText = order.customer_info; // Display raw string if parsing fails
            }
        }

        Object.assign(currentOrder, {
            uuid: order.uuid,
            order_number: order.order_number,
            order_date: formattedDate,
            customer_info_text: customerInfoText,
            status: order.status,
            is_priority: Boolean(order.is_priority), // Ensure boolean
            user_id: order.user_id,
        });
    } else {
        // --- CREATING ---
        isEditing.value = false;
        // Reset form fields to default/empty state
        Object.assign(currentOrder, {
            uuid: null,
            order_number: '',
            order_date: '', // Or set a default date: new Date().toISOString().slice(0, 16)
            customer_info_text: '',
            status: '', // Default to empty or a specific status like 'Pending'
            is_priority: false,
            user_id: '', // Or prefill with current logged-in user ID if available
        });
    }
    showFormModal.value = true;
};

const closeModal = () => {
    // Hide all modals
    showFormModal.value = false;
    showAuditModal.value = false;
    showImportModal.value = false;
    showCustomerInfoModal.value = false;

    // Reset states associated with modals
    formError.value = null;
    auditError.value = null;
    importError.value = null; // Keep import error if modal was closed manually? Maybe clear always.
    customerInfoError.value = null;
    saving.value = false; // Reset saving state if form modal is closed
    importing.value = false; // Reset importing state

    // Reset data specific to modals
    auditHistory.value = [];
    orderForAudit.value = null;
    importFile.value = null;
    customerInfoToDisplay.value = null;

    // Optionally reset the form reactive object if needed, though openFormModal handles this
    // Object.assign(currentOrder, { uuid: null, ... });
};

const confirmDelete = (uuid, orderNumber) => {
    // Use a more user-friendly confirmation dialog (e.g., SweetAlert2 if available)
    if (window.confirm(`Anda yakin ingin menghapus Production Order "${orderNumber}"? \n\n(Tindakan ini akan memindahkan data ke arsip/trash, bukan menghapus permanen).`)) {
        deleteOrder(uuid);
    }
};

const showAuditHistory = (order) => {
    orderForAudit.value = order;
    // Clear potentially interfering global messages
    error.value = null;
    importSuccess.value = null;
    showAuditModal.value = true;
    // Fetch history immediately
    fetchAuditHistory(order.uuid);
};

const showCustomerInfo = (info) => {
    customerInfoToDisplay.value = info;
    showCustomerInfoModal.value = true;
};

const applyFiltersAndFetch = () => {
    // Reset to page 1 when applying new filters/search
    fetchOrders(1);
};

const changePage = (page) => {
    // Ensure page is valid and different from current
    if (page >= 1 && page <= pagination.value.last_page && page !== pagination.value.current_page) {
        fetchOrders(page);
    }
};

// --- Utility/Formatting Functions ---
const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
        // More robust formatting, handles potential invalid dates
        const date = new Date(timestamp);
        if (isNaN(date)) return timestamp; // Return original if invalid
        return date.toLocaleString('id-ID', {
            day: '2-digit', // DD
            month: 'short', // Mmm (Jan, Feb)
            year: 'numeric', // YYYY
            hour: '2-digit', // HH
            minute: '2-digit', // mm
            hour12: false // Use 24-hour format
        });
    } catch (e) {
        console.warn("Error formatting timestamp:", timestamp, e);
        return timestamp; // Return original string on error
    }
};

const formatAuditTimestamp = (timestamp) => {
    // Can use the same function or a slightly different format if needed
     if (!timestamp) return '-';
     try {
         const date = new Date(timestamp);
         if (isNaN(date)) return timestamp;
         return date.toLocaleString('id-ID', {
             dateStyle: 'medium', // e.g., 17 Mei 2024
             timeStyle: 'medium'  // e.g., 10:30:55
            });
     } catch (e) { return timestamp; }
};

const formatAuditValues = (values) => {
    // Check for null, undefined, or non-object types first
    if (values === null || typeof values !== 'object' || Object.keys(values).length === 0) {
        return '-'; // Return dash for empty or non-object values
    }
    try {
        // Pretty print JSON for readability
        return JSON.stringify(values, null, 2); // Indentation of 2 spaces
    } catch (e) {
        // Fallback for potential circular references or other stringify errors
        return String(values);
    }
};

const getEventBadgeColor = (event) => {
    switch (event?.toLowerCase()) { // Handle potential null/undefined event
        case 'created': return 'success';
        case 'updated': return 'warning';
        case 'deleted': return 'danger'; // For soft deletes/restored events if applicable
        case 'restored': return 'info';
        default: return 'secondary'; // Default for unknown events
    }
};

const getStatusBadgeColor = (status) => {
    // Use Bootstrap background utility classes directly
    switch (status?.toLowerCase()) { // Handle potential null/undefined status
        case 'pending': return 'secondary';
        case 'processing': return 'primary';
        case 'completed': return 'success';
        case 'cancelled': return 'danger';
        case 'on hold': return 'warning'; // Example for another status
        default: return 'light text-dark border'; // Default with border for visibility
    }
};

// Improved error message extractor
const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => {
    // 1. Check for custom 'UnauthorizedRedirect' flag first
    if (error.message === 'UnauthorizedRedirect') {
        return ''; // Don't display an additional error message if redirection/handling is occurring
    }

    // 2. Check for Axios response error
    if (error.response) {
        console.error("API Error Response:", error.response);
        // 2a. Specific backend error message (check common structures)
        let apiMessage = error.response.data?.message || error.response.data?.error || error.response.data?.detail;

        // 2b. Laravel Validation Errors (Status 422)
        if (error.response.status === 422 && error.response.data?.errors) {
            const errors = error.response.data.errors;
            // Get the first error message from the first field
            const firstErrorKey = Object.keys(errors)[0];
            if (firstErrorKey && Array.isArray(errors[firstErrorKey]) && errors[firstErrorKey].length > 0) {
                 // Combine field name (optional) and message
                 // apiMessage = `${firstErrorKey}: ${errors[firstErrorKey][0]}`;
                 apiMessage = errors[firstErrorKey][0]; // Just the message is often cleaner
            } else {
                apiMessage = apiMessage || 'Data yang dikirim tidak valid.'; // Fallback 422 message
            }
        }
        // 2c. Handle 401/403 again just in case interceptor missed or for direct display
         if (error.response.status === 401) return 'Akses ditolak. Silakan login kembali.';
         if (error.response.status === 403) return 'Anda tidak memiliki izin untuk melakukan tindakan ini.';

        // 2d. Generic HTTP status message
        return apiMessage || `Error ${error.response.status}: ${error.response.statusText || defaultMessage}`;
    }
    // 3. Check for Network errors (request made but no response)
    else if (error.request) {
        console.error("Network Error:", error.request);
        return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    }
    // 4. Check for setup errors or other JS errors
    else {
        console.error("Generic Error:", error);
        return error.message || defaultMessage;
    }
};


// --- Lifecycle Hook ---
onMounted(() => {
    // Fetch initial data when the component is mounted
    fetchOrders();
});

</script>

<style scoped>
/* Define CSS Variables (Tailwind-like naming convention for clarity) */
:root {
    --font-family-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    --color-primary: #4F46E5; /* Indigo 600 */
    --color-primary-hover: #4338CA; /* Indigo 700 */
    --color-primary-light: #EEF2FF; /* Indigo 50 */
    --color-primary-dark: #3730A3; /* Indigo 800 */

    --color-secondary: #6B7280; /* Gray 500 */
    --color-secondary-hover: #4B5563; /* Gray 600 */

    --color-success: #10B981; /* Emerald 500 */
    --color-success-hover: #059669; /* Emerald 600 */
    --color-success-light: #ECFDF5; /* Emerald 50 */

    --color-danger: #EF4444; /* Red 500 */
    --color-danger-hover: #DC2626; /* Red 600 */
    --color-danger-light: #FEF2F2; /* Red 50 */

    --color-warning: #F59E0B; /* Amber 500 */
    --color-warning-hover: #D97706; /* Amber 600 */
    --color-warning-light: #FFFBEB; /* Amber 50 */

    --color-info: #3B82F6; /* Blue 500 */
    --color-info-hover: #2563EB; /* Blue 600 */
    --color-info-light: #EFF6FF; /* Blue 50 */

    --color-gray-50: #F9FAFB;
    --color-gray-100: #F3F4F6;
    --color-gray-200: #E5E7EB;
    --color-gray-300: #D1D5DB;
    --color-gray-400: #9CA3AF;
    --color-gray-500: #6B7280;
    --color-gray-600: #4B5563;
    --color-gray-700: #374151;
    --color-gray-800: #1F2937;
    --color-gray-900: #111827;

    --border-radius-sm: 0.25rem;
    --border-radius: 0.375rem;
    --border-radius-lg: 0.5rem;
    --border-radius-xl: 0.75rem;
    --border-radius-full: 9999px;

    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
}

/* Apply base styles */
.production-order-manager-container {
    font-family: var(--font-family-sans);
    color: var(--color-gray-700);
    background-color: var(--color-gray-50); /* Slightly off-white background */
    padding: 2rem;
    max-width: 1400px; /* Adjust as needed */
    margin: 2rem auto;
    border-radius: var(--border-radius-xl); /* Softer corners for main container */
}

/* Header */
.page-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem; /* More space below header */
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-gray-200);
    gap: 1rem;
}

.page-title {
    font-size: 1.75rem; /* Slightly smaller */
    font-weight: 600;
    color: var(--color-gray-800);
    margin: 0;
}

/* Buttons */
.btn {
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 500; line-height: 1.5; text-align: center;
    text-decoration: none; vertical-align: middle; cursor: pointer;
    user-select: none; background-color: transparent;
    border: 1px solid transparent;
    padding: 0.5rem 1rem; /* Default button padding */
    font-size: 0.875rem;
    border-radius: var(--border-radius);
    transition: all .15s ease-in-out;
}
.btn:focus { box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 79, 70, 229), 0.25); outline: 0;} /* Consistent focus */
.btn:disabled, .btn.disabled { cursor: not-allowed; opacity: 0.65; box-shadow: none; }

.btn-primary { background-color: var(--color-primary); border-color: var(--color-primary); color: white; }
.btn-primary:hover { background-color: var(--color-primary-hover); border-color: var(--color-primary-hover); }
.btn-success { background-color: var(--color-success); border-color: var(--color-success); color: white; }
.btn-success:hover { background-color: var(--color-success-hover); border-color: var(--color-success-hover); }
.btn-info { background-color: var(--color-info); border-color: var(--color-info); color: white; }
.btn-info:hover { background-color: var(--color-info-hover); border-color: var(--color-info-hover); }
.btn-danger { background-color: var(--color-danger); border-color: var(--color-danger); color: white; }
.btn-danger:hover { background-color: var(--color-danger-hover); border-color: var(--color-danger-hover); }
.btn-warning { background-color: var(--color-warning); border-color: var(--color-warning); color: var(--color-gray-900); }
.btn-warning:hover { background-color: var(--color-warning-hover); border-color: var(--color-warning-hover); }

.btn-outline-secondary { color: var(--color-secondary); border-color: var(--color-gray-300); }
.btn-outline-secondary:hover { background-color: var(--color-gray-100); border-color: var(--color-gray-400); color: var(--color-gray-700); }
.btn-outline-primary { color: var(--color-primary); border-color: var(--color-primary); }
.btn-outline-primary:hover { background-color: var(--color-primary-light); color: var(--color-primary-hover); border-color: var(--color-primary-hover); }
.btn-outline-danger { color: var(--color-danger); border-color: var(--color-danger); }
.btn-outline-danger:hover { background-color: var(--color-danger-light); color: var(--color-danger-hover); border-color: var(--color-danger-hover); }

.btn-lg { padding: 0.65rem 1.5rem; font-size: 1rem; }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8rem; }
.btn-icon {
    padding: 0.4rem; line-height: 1; border-radius: var(--border-radius);
    width: 32px; height: 32px; display: inline-flex;
    justify-content: center; align-items: center;
}
.btn-icon i { font-size: 0.9rem; vertical-align: middle; }

/* Filter Controls Card */
.filter-controls {
    background-color: #fff;
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--color-gray-200);
    box-shadow: var(--shadow-sm);
}
.filter-controls .form-label {
    font-size: 0.75rem; /* Smaller label */
    margin-bottom: 0.25rem;
    color: var(--color-gray-600);
    font-weight: 500;
    text-transform: uppercase; /* Uppercase label */
    letter-spacing: 0.025em;
}
.filter-controls .form-control, .filter-controls .form-select {
    font-size: 0.875rem;
}
/* Use sm controls */
.form-control-sm, .form-select-sm {
    min-height: calc(1.5em + (0.5rem * 2) + 2px);
    padding: 0.375rem 0.75rem;
    font-size: .8rem;
    border-radius: var(--border-radius-sm);
}

/* Feedback Section (Alerts) */
.feedback-section { margin-bottom: 1.5rem; }
.alert {
    border: none; border-radius: var(--border-radius); padding: 0.8rem 1.25rem; /* Slightly less padding */
    display: flex; align-items: center; font-size: 0.9rem;
}
.alert i { font-size: 1.1em; margin-right: 0.75rem; }
.alert .btn-close { font-size: 0.8rem; padding: 0.8rem; }

/* Custom Alert Colors */
.alert-info { background-color: var(--color-info-light); color: #1E40AF; }
.alert-danger { background-color: var(--color-danger-light); color: #991B1B; }
.alert-success { background-color: var(--color-success-light); color: #166534; }
.alert-warning { background-color: var(--color-warning-light); color: #92400E; }
.alert-secondary { background-color: var(--color-gray-100); color: var(--color-gray-600); }
.alert-light { background-color: var(--color-gray-100); color: var(--color-gray-700); border: 1px solid var(--color-gray-200); }

/* Table Styling */
.table-container {
    border: 1px solid var(--color-gray-200);
    border-radius: var(--border-radius-lg); /* Match filter card */
    box-shadow: var(--shadow);
}
.modern-table { width: 100%; margin-bottom: 0; border-collapse: separate; border-spacing: 0; }
.modern-table thead { background-color: var(--color-gray-50); } /* Very light gray header */
.modern-table th {
    padding: 0.75rem 1rem; /* Adjust padding */
    text-align: left; font-size: 0.75rem; font-weight: 600;
    color: var(--color-gray-500); text-transform: uppercase;
    letter-spacing: 0.05em; border-bottom: 2px solid var(--color-gray-200); /* Thicker bottom border */
    white-space: nowrap;
}
.modern-table tbody tr { transition: background-color 0.15s ease; }
.modern-table tbody tr:hover { background-color: var(--color-gray-50); }
.modern-table td {
    padding: 0.75rem 1rem; /* Match th padding */
    border-bottom: 1px solid var(--color-gray-200);
    vertical-align: middle; font-size: 0.875rem; color: var(--color-gray-700);
    /* white-space: nowrap; Optional: prevent wrapping */
}
.modern-table tbody tr:last-child td { border-bottom: none; }

/* Table specific elements */
.code-badge {
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    background-color: var(--color-gray-100); color: var(--color-gray-600);
    padding: 0.2em 0.5em; border-radius: var(--border-radius-sm); font-size: 0.85em;
    border: 1px solid var(--color-gray-200); display: inline-block;
}
.code-badge.bg-primary-light { /* For Audit Modal Title */
    background-color: var(--color-primary-light);
    color: var(--color-primary-dark);
    border-color: var(--color-primary);
    font-weight: 600;
}
.badge.rounded-pill { padding: 0.3em 0.75em; font-size: 0.75rem; font-weight: 500;}
.action-buttons { display: flex; justify-content: center; align-items: center; gap: 0.5rem; }
.fa-star.text-warning { /* Slightly larger star */
    font-size: 1.1rem;
}

/* Pagination */
.pagination { display: flex; padding-left: 0; list-style: none; }
.page-link {
    position: relative; display: block; padding: 0.5rem 0.75rem;
    margin-left: -1px; line-height: 1.25; color: var(--color-primary);
    background-color: #fff; border: 1px solid var(--color-gray-300); text-decoration: none;
    transition: all .15s ease;
}
.page-link:hover { z-index: 2; color: var(--color-primary-hover); background-color: var(--color-gray-100); border-color: var(--color-gray-300); }
.page-item:first-child .page-link { margin-left: 0; border-top-left-radius: var(--border-radius); border-bottom-left-radius: var(--border-radius); }
.page-item:last-child .page-link { border-top-right-radius: var(--border-radius); border-bottom-right-radius: var(--border-radius); }
.page-item.active .page-link { z-index: 3; color: #fff; background-color: var(--color-primary); border-color: var(--color-primary); }
.page-item.disabled .page-link, .page-item.disabled span.page-link { color: var(--color-gray-400); pointer-events: none; background-color: #fff; border-color: var(--color-gray-300); }
.page-link i { font-size: 0.8em; } /* Smaller chevron icons */

/* Modal Styles */
.modal-overlay {
    position: fixed; inset: 0;
    background-color: rgba(17, 24, 39, 0.6); /* Darker overlay */
    backdrop-filter: blur(4px); /* Background blur */
    display: flex; justify-content: center; align-items: center;
    z-index: 1050; padding: 1rem; overflow-y: auto;
    transition: opacity 0.3s ease;
}
.modal-dialog {
    background-color: white; border-radius: var(--border-radius-lg);
    margin: auto; max-height: 90vh; display: flex; flex-direction: column;
    width: 100%; box-shadow: none; border: none; pointer-events: all;
    max-width: 500px; /* Default size */
    transition: transform 0.3s ease; transform: scale(0.95); opacity: 0;
}
/* Enter animation */
.modal-overlay > .modal-dialog { transform: scale(1); opacity: 1; }
/* Sizes */
.modal-dialog.modal-lg { max-width: 800px; }
.modal-dialog.modal-xl { max-width: 1140px; }

.modal-content {
    border: none; border-radius: inherit; box-shadow: var(--shadow-xl); /* More prominent shadow */
    overflow: hidden; flex: 1; display: flex; flex-direction: column;
    max-height: 100%;
}
.modal-header {
    background-color: var(--color-gray-50); /* Consistent light header */
    padding: 1rem 1.5rem; border-bottom: 1px solid var(--color-gray-200);
    flex-shrink: 0; display: flex; justify-content: space-between; align-items: center;
}
.modal-title { font-size: 1.125rem; font-weight: 600; color: var(--color-gray-800); margin-bottom: 0; }
.modal-title i { /* color: var(--color-primary); */ margin-right: 0.5rem; } /* Color set via text-primary etc */
.btn-close {
    background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236b7280'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat;
    border: 0; border-radius: var(--border-radius-sm); opacity: .5; cursor: pointer;
    padding: .5rem; margin: -0.5rem -0.5rem -0.5rem auto; transition: opacity 0.15s ease;
}
.btn-close:hover { opacity: 1; }
.modal-body { padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
.modal-footer {
    background-color: var(--color-gray-50); /* Consistent light footer */
    padding: 1rem 1.5rem; border-top: 1px solid var(--color-gray-200);
    display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0;
}
/* Remove body padding if table is direct child */
.modal-body.p-0 { padding: 0; }

/* Form Styles inside Modal */
.modern-form .form-label {
    display: block; font-size: 0.875rem; font-weight: 500;
    color: var(--color-gray-700); margin-bottom: 0.35rem; /* Smaller margin */
}
.modern-form .form-control, .modern-form .form-select {
    display: block; width: 100%;
    padding: 0.625rem 0.875rem; /* Standard padding */
    font-size: 0.875rem; font-weight: 400; line-height: 1.5;
    color: var(--color-gray-800); background-color: #fff;
    background-clip: padding-box; border: 1px solid var(--color-gray-300);
    appearance: none; border-radius: var(--border-radius);
    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
    box-shadow: var(--shadow-inner); /* Subtle inner shadow */
}
/* Apply sm styles if class is present */
.modern-form .form-control-sm, .modern-form .form-select-sm {
     padding: 0.375rem 0.75rem; font-size: .8rem; border-radius: var(--border-radius-sm);
}
.modern-form .form-control::placeholder { color: var(--color-gray-400); opacity: 1; }
.modern-form .form-control:focus, .modern-form .form-select:focus {
    border-color: var(--color-primary); outline: 0;
    box-shadow: var(--shadow-inner), 0 0 0 3px rgba(var(--color-primary-rgb, 79, 70, 229), 0.2);
}
.modern-form .form-check-input {
    width: 2.5em; height: 1.25em; margin-top: 0.25em;
    border-color: var(--color-gray-300);
}
.modern-form .form-check-input:checked { background-color: var(--color-primary); border-color: var(--color-primary); }
.modern-form .form-check-label { padding-left: 0.5em; font-size: 0.9rem; }
textarea.form-control { min-height: calc(1.5em + (0.625rem * 2) + 2px); }
textarea.code-input { /* Specific style for JSON textarea */
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
    background-color: var(--color-gray-50); /* Light background for code */
}
.form-text { font-size: 0.8rem; color: var(--color-gray-500); }
.text-danger { color: var(--color-danger) !important; }

/* Audit Table Styles */
.audit-table th {
    background-color: var(--color-gray-100); /* Slightly darker than modal header */
    font-size: 0.7rem; text-align: left; padding: 0.5rem 0.75rem;
    white-space: nowrap;
}
.audit-table td { font-size: 0.8rem; padding: 0.5rem 0.75rem; vertical-align: top; }
.audit-table .badge { font-size: 0.7rem; padding: 0.25em 0.5em; }
.audit-table .user-agent {
    max-width: 180px; /* Limit width */
    font-size: 0.75rem; display: block; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; color: var(--color-gray-500);
}
pre.audit-values {
    font-size: 0.75rem; max-height: 150px; /* Limit height */
    background-color: #fff; border: 1px solid var(--color-gray-200);
    padding: 8px; margin: 0;
    font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    white-space: pre-wrap; word-break: break-all; overflow-y: auto;
    border-radius: var(--border-radius-sm);
}
.modal-dialog-scrollable thead.sticky-top { /* Make sticky header look good */
    z-index: 10;
    /* background-color: var(--color-gray-100); Already applied via table-light? */
    box-shadow: inset 0 -1px 0 var(--color-gray-300); /* Bottom border */
}

/* Customer Info Modal */
pre.customer-info-pre {
     background-color: var(--color-gray-50); /* Consistent light bg */
     border: 1px solid var(--color-gray-200);
     border-radius: var(--border-radius);
     padding: 1rem; font-size: 0.85rem; color: var(--color-gray-700);
     white-space: pre-wrap; word-break: break-all;
     max-height: 65vh; /* Generous height */
     overflow-y: auto;
     font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

/* Utility Classes */
.bg-gray-50 { background-color: var(--color-gray-50) !important; }
.text-gray-400 { color: var(--color-gray-400) !important; }
.text-gray-600 { color: var(--color-gray-600) !important; }
.border-gray-200 { border-color: var(--color-gray-200) !important; }
.rounded-lg { border-radius: var(--border-radius-lg) !important; }
.rounded-xl { border-radius: var(--border-radius-xl) !important; }
.shadow { box-shadow: var(--shadow) !important; }
.shadow-sm { box-shadow: var(--shadow-sm) !important; }
.shadow-lg { box-shadow: var(--shadow-lg) !important; }
.shadow-xl { box-shadow: var(--shadow-xl) !important; }
.hover\:shadow:hover { box-shadow: var(--shadow-md) !important; } /* Example hover shadow */

/* Responsive Adjustments */
@media (max-width: 768px) {
    .production-order-manager-container { padding: 1rem; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .page-actions { justify-content: flex-start; width: 100%;} /* Stack actions */
    .filter-controls { padding: 1rem; }
    .filter-controls .row > div { margin-bottom: 0.75rem; } /* Space filter items vertically */
    .filter-controls .d-grid .btn { width: 100%; } /* Ensure button takes full width */

    .modern-table th, .modern-table td { padding: 0.6rem 0.75rem; white-space: normal; font-size: 0.8rem; } /* Allow wrapping, adjust padding */
    .action-buttons { justify-content: flex-start; /* Align actions left */ }
    .modal-overlay { padding: 0.5rem; }
    .modal-dialog { max-width: calc(100% - 1rem); margin: 0.5rem; max-height: calc(100% - 1rem); }
    .modal-body { padding: 1rem; }
    .modal-footer { padding: 0.75rem 1rem; }
    .pagination { font-size: 0.9rem; } /* Slightly smaller pagination */
    .pagination .page-link { padding: 0.4rem 0.6rem; }
    /* Hide pagination info text on very small screens if needed */
    .pagination + .text-muted.small { display: none; } /* Example */
    nav[aria-label="Page navigation"] .d-flex { flex-direction: column !important; align-items: center !important; }
    nav[aria-label="Page navigation"] .text-muted { margin-bottom: 0.5rem !important; }
    nav[aria-label="Page navigation"] .ms-sm-auto { margin-left: 0 !important; }
}

@media (max-width: 576px) {
    .page-title { font-size: 1.5rem; }
    .btn-lg { padding: 0.5rem 1rem; font-size: 0.9rem; } /* Smaller large button */
    .modern-table th { font-size: 0.7rem; } /* Even smaller header text */
    .modern-table td { font-size: 0.75rem; }
}

</style>