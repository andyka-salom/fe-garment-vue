<template>
    <div class="dashboard-view">
      <div class="container">
        <div class="role-manager-container">
          <header class="page-header">
            <h1 class="page-title">Manajemen Role</h1>
            <div class="d-flex flex-wrap gap-2 align-items-center">
              <!-- View Toggle -->
              <div class="btn-group btn-group-sm" role="group" aria-label="View Mode Toggle">
                <button type="button" class="btn"
                        :class="viewMode === 'active' ? 'btn-primary active' : 'btn-outline-secondary'"
                        @click="switchViewMode('active')" :disabled="isLoading">
                  <i class="fas fa-list me-1"></i> Daftar Aktif
                </button>
                <button type="button" class="btn"
                        :class="viewMode === 'trashed' ? 'btn-primary active' : 'btn-outline-secondary'"
                        @click="switchViewMode('trashed')" :disabled="isLoading">
                  <i class="fas fa-trash me-1"></i> Tempat Sampah
                  <span v-if="trashedCount > 0" class="badge bg-danger ms-1 rounded-pill">{{ trashedCountForDisplay }}</span>
                </button>
              </div>
              <!-- Add Button (only for active view) -->
              <button v-if="viewMode === 'active'" @click="openAddModal" class="btn btn-primary btn-sm">
                <i class="fas fa-plus me-1"></i> Tambah Role Baru
              </button>
            </div>
          </header>
  
          <!-- Filters Section -->
          <div class="filter-section card shadow-sm mb-4">
            <div class="card-body d-flex flex-column flex-md-row flex-wrap gap-3 align-items-md-center">
              <!-- Search Input -->
              <div class="filter-item flex-grow-1 mb-2 mb-md-0" style="min-width: 200px;">
                <label for="searchFilterRole" class="form-label visually-hidden">Cari Role</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-light"><i class="fas fa-search fa-fw"></i></span>
                  <input type="text" id="searchFilterRole" class="form-control"
                         :placeholder="`Cari nama di ${viewMode === 'active' ? 'daftar aktif' : 'tempat sampah'}...`"
                         v-model.lazy="filters.search" @keyup.enter="applyFilters" :disabled="isLoading" />
                  <button v-if="filters.search" class="btn btn-outline-secondary" type="button"
                          @click="clearSearch" title="Hapus Pencarian">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <!-- Apply/Clear Buttons -->
              <div class="filter-item ms-md-auto">
                <button class="btn btn-sm btn-primary" @click="applyFilters" :disabled="isLoading">
                  <i class="fas fa-filter me-1"></i> Terapkan
                </button>
                <button v-if="filters.search" class="btn btn-sm btn-outline-secondary ms-2"
                        @click="clearSearch" :disabled="isLoading" title="Hapus Filter Pencarian">
                  <i class="fas fa-eraser"></i>
                </button>
              </div>
            </div>
          </div>
  
          <!-- Feedback Section -->
          <div class="feedback-section mb-3" aria-live="polite">
             <div v-if="isLoading && (viewMode === 'active' ? isActiveListEmpty : isTrashedListEmpty)" class="alert alert-info d-flex align-items-center shadow-sm" role="status">
                 <div class="spinner-border spinner-border-sm me-3" aria-hidden="true"></div>
                 <span>Memuat data role{{ viewMode === 'trashed' ? ' sampah' : '' }}...</span>
             </div>
             <div v-if="error && !showModal && !confirmationState.show" class="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
                 <i class="fas fa-exclamation-triangle me-2"></i> <span v-html="error"></span>
                 <button type="button" class="btn-close btn-sm" @click="clearError" aria-label="Close"></button>
             </div>
             <div v-if="successMessage" class="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                 <i class="fas fa-check-circle me-2"></i> {{ successMessage }}
                 <button type="button" class="btn-close btn-sm" @click="successMessage = null" aria-label="Close"></button>
             </div>
             <div v-if="!isLoading && (viewMode === 'active' ? isActiveListEmpty : isTrashedListEmpty) && !error" class="alert alert-secondary text-center shadow-sm">
                 <i class="fas fa-shield-alt me-2 opacity-50"></i>
                 Tidak ada role ditemukan
                 <span v-if="filters.search"> untuk pencarian "{{ filters.search }}"</span>
                 <span v-else-if="viewMode === 'active'">.</span>
                 <span v-else-if="viewMode === 'trashed'"> di tempat sampah.</span>
                 <button v-if="viewMode === 'active' && !filters.search" @click="openAddModal" class="btn btn-sm btn-link p-0 ms-2">Tambah Role Baru</button>
                 <button v-if="filters.search" @click="clearSearch" class="btn btn-sm btn-link p-0 ms-2">Hapus Filter</button>
             </div>
         </div>
  
          <!-- ======================= -->
          <!--      ACTIVE TABLE       -->
          <!-- ======================= -->
          <div v-if="viewMode === 'active'" class="table-container shadow-sm mb-4">
            <div class="table-responsive">
              <table class="table table-hover align-middle modern-table" :aria-busy="isLoading">
                <thead>
                  <tr>
                    <th scope="col" style="width: 5%;">#</th>
                    <th scope="col" @click="changeSort('name')" class="sortable-header" :aria-sort="getAriaSort('name')">
                      Nama Role <i :class="getSortIcon('name')"></i>
                    </th>
                    <th scope="col" style="width: 20%;" @click="changeSort('created_at')" class="sortable-header" :aria-sort="getAriaSort('created_at')">
                      Dibuat Pada <i :class="getSortIcon('created_at')"></i>
                    </th>
                    <th scope="col" class="text-center" style="width: 15%;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoading && isActiveListEmpty">
                    <td colspan="4" class="text-center">
                      <div class="d-flex justify-content-center align-items-center py-4">
                        <div class="spinner-border text-primary" role="status"></div>
                        <span class="ms-3 text-muted">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="(role, index) in roles" :key="role.uuid" v-show="!isLoading">
                    <td>{{ (pagination.currentPage - 1) * pagination.perPage + index + 1 }}</td>
                    <td class="fw-medium">{{ role.name }}</td>
                    <td>{{ formatDate(role.created_at) }}</td>
                    <td>
                      <div class="action-buttons">
                        <button @click="openEditModal(role)"
                                class="btn btn-icon btn-outline-primary" title="Edit Role"
                                :disabled="actionInProgress(role.uuid)">
                          <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button @click="askConfirmDeleteRole(role.uuid, role.name)"
                                class="btn btn-icon btn-outline-danger" title="Pindahkan ke Tempat Sampah"
                                :disabled="actionInProgress(role.uuid)">
                          <span v-if="deletingId === role.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          <!-- ======================= -->
          <!--      TRASHED TABLE      -->
          <!-- ======================= -->
          <div v-if="viewMode === 'trashed'" class="table-container shadow-sm mb-4">
            <div class="table-responsive">
              <table class="table table-hover align-middle modern-table" :aria-busy="isLoading">
                <thead>
                  <tr>
                    <th scope="col" style="width: 5%;">#</th>
                    <th scope="col">Nama Role</th>
                    <th scope="col" style="width: 20%;">Dihapus Pada</th>
                    <th scope="col" class="text-center" style="width: 20%;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoading && isTrashedListEmpty">
                    <td colspan="4" class="text-center">
                      <div class="d-flex justify-content-center align-items-center py-4">
                        <div class="spinner-border text-primary" role="status"></div>
                        <span class="ms-3 text-muted">Memuat data sampah...</span>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="(role, index) in trashedRoles" :key="role.uuid" v-show="!isLoading">
                    <td>{{ (trashedPagination.currentPage - 1) * trashedPagination.perPage + index + 1 }}</td>
                    <td class="fw-medium">{{ role.name }}</td>
                    <td>{{ formatDate(role.deleted_at) }}</td>
                    <td>
                      <div class="action-buttons">
                        <button @click="restoreRole(role.uuid, role.name)"
                                class="btn btn-icon btn-outline-success" title="Pulihkan Role"
                                :disabled="actionInProgress(role.uuid)">
                          <span v-if="restoringId === role.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-undo-alt"></i>
                        </button>
                        <button @click="askConfirmForceDeleteRole(role.uuid, role.name)"
                                class="btn btn-icon btn-outline-danger" title="Hapus Permanen"
                                :disabled="actionInProgress(role.uuid)">
                          <span v-if="forceDeletingId === role.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <i v-else class="fas fa-times-circle"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          <!-- Pagination -->
          <div v-if="!isLoading && currentTotalPages > 1" class="pagination-controls d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
            <div class="d-flex align-items-center gap-2">
              <label :for="'perPageSelectRole'+viewMode" class="form-label mb-0 text-muted small">Item/Hal:</label>
              <select :id="'perPageSelectRole'+viewMode" class="form-select form-select-sm" style="width: 75px;"
                      v-model="filters.per_page" @change="applyFilters">
                <option value="15">15</option> <option value="25">25</option> <option value="50">50</option> <option value="100">100</option>
              </select>
              <span class="text-muted small ms-2 d-none d-md-inline">
                Total {{ currentTotalItems }} role{{ viewMode === 'trashed' ? ' sampah' : ''}}
              </span>
            </div>
            <nav aria-label="Page navigation">
               <ul class="pagination pagination-sm mb-0">
                 <li class="page-item" :class="{ disabled: currentPagination.currentPage <= 1 }">
                   <a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage - 1)" aria-label="Previous">
                     <span aria-hidden="true">«</span>
                   </a>
                 </li>
                 <li v-for="page in simplePaginationRange" :key="viewMode+'_page_'+page" class="page-item"
                     :class="{ active: page === currentPagination.currentPage, disabled: page === '...' }"
                     :aria-current="page === currentPagination.currentPage ? 'page' : null">
                   <a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                   <span v-else class="page-link" aria-hidden="true">...</span>
                 </li>
                 <li class="page-item" :class="{ disabled: currentPagination.currentPage >= currentTotalPages }">
                   <a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage + 1)" aria-label="Next">
                     <span aria-hidden="true">»</span>
                   </a>
                 </li>
               </ul>
             </nav>
          </div>
  
          <!-- ======================= -->
          <!--    ADD/EDIT MODAL       -->
          <!-- ======================= -->
          <div v-if="showModal" class="modal-overlay" @click.self="closeAndResetModal">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content shadow-lg">
                <div class="modal-header">
                  <h5 class="modal-title">
                    <i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2']"></i>
                    {{ isEditing ? 'Edit Role' : 'Tambah Role Baru' }}
                  </h5>
                  <button type="button" class="btn-close" @click="closeAndResetModal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <div v-if="modalError" class="alert alert-danger alert-dismissible fade show" role="alert">
                    <span v-html="modalError"></span>
                    <button type="button" class="btn-close btn-sm" @click="modalError = null" aria-label="Close"></button>
                  </div>
                  <form @submit.prevent="saveRole" id="roleForm" class="modern-form" novalidate>
                    <div class="form-group mb-3">
                      <label for="roleName" class="form-label">Nama Role <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="roleName" v-model.trim="currentRole.name"
                             required placeholder="e.g., Administrator, Editor" :disabled="isSaving" />
                    </div>
                  </form>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-outline-secondary" @click="closeAndResetModal" :disabled="isSaving">Batal</button>
                  <button type="submit" form="roleForm" class="btn btn-primary" :disabled="isSaveDisabled">
                    <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {{ isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Role') }}
                  </button>
                </div>
              </div>
            </div>
          </div> <!-- End Add/Edit Modal -->
  
          <!-- ======================= -->
          <!--   CONFIRMATION MODAL    -->
          <!-- ======================= -->
          <div v-if="confirmationState.show" class="modal-overlay" @click.self="cancelConfirmation">
              <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content shadow-lg">
                      <div class="modal-header" :class="confirmationState.type === 'forceDelete' ? 'bg-danger text-white' : 'bg-warning'">
                          <h5 class="modal-title">
                             <i class="fas fa-exclamation-triangle me-2"></i> Konfirmasi Tindakan
                          </h5>
                          <button type="button" class="btn-close" :class="confirmationState.type === 'forceDelete' ? 'btn-close-white' : ''" @click="cancelConfirmation" aria-label="Close"></button>
                      </div>
                      <div class="modal-body">
                          <p v-html="confirmationState.message"></p>
                          <p v-if="confirmationState.itemName" class="fw-bold text-center my-3">
                             "{{ confirmationState.itemName }}"
                          </p>
                           <div v-if="confirmationState.type === 'forceDelete'" class="alert alert-danger d-flex align-items-center mt-3">
                              <i class="fas fa-skull-crossbones fs-4 me-3"></i>
                              <div><strong>PERHATIAN:</strong> Tindakan ini bersifat permanen dan tidak dapat diurungkan!</div>
                          </div>
                           <div v-if="confirmationState.type === 'delete'" class="alert alert-warning d-flex align-items-center mt-3">
                              <i class="fas fa-info-circle fs-4 me-3"></i>
                              <div>Role akan dipindahkan ke tempat sampah. Anda bisa memulihkannya nanti.</div>
                          </div>
                      </div>
                      <div class="modal-footer justify-content-center">
                          <button type="button" class="btn btn-secondary" @click="cancelConfirmation">Batal</button>
                          <button type="button" class="btn" :class="confirmationState.type === 'forceDelete' ? 'btn-danger' : 'btn-warning'" @click="confirmAction">
                             Ya, Lanjutkan
                          </button>
                      </div>
                  </div>
              </div>
          </div> <!-- End Confirmation Modal -->
  
        </div> <!-- End .role-manager-container -->
      </div> <!-- End .container -->
    </div> <!-- End .dashboard-view -->
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, computed, watch } from 'vue';
  import axios from 'axios';
  
  // --- Axios Instance ---
  const apiClient = axios.create({
    baseURL: `${process.env.VUE_APP_API_URL || 'http://localhost:8000/api'}`, // Ensure /api path
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  
  // --- Axios Interceptors ---
  apiClient.interceptors.request.use(config => {
      try {
          const userDataString = localStorage.getItem('userData');
          if (userDataString) {
              const userData = JSON.parse(userDataString);
              const token = userData?.token;
              if (token) {
                  config.headers = config.headers || {};
                  config.headers['Authorization'] = `Bearer ${token}`;
              }
          }
      } catch (e) { console.error("Error reading user data from localStorage:", e); }
      return config;
  }, error => Promise.reject(error));
  
  apiClient.interceptors.response.use(response => response, error => {
      const config = error.config;
      if (error.response && (error.response.status === 401 || error.response.status === 403) && config?.method !== 'get') {
          console.error(`Authorization Error (${error.response.status}) on ${config.method?.toUpperCase()} ${config.url}`);
          if (error.response.status === 401) {
              localStorage.removeItem('userData');
               // Optional: Redirect immediately or let the component handle the error message first
              // window.location.href = '/login';
          }
          return Promise.reject(new Error(`Auth failed or forbidden: ${error.response.status}`));
      }
      return Promise.reject(error);
  });
  // --- End Axios Setup ---
  
  // --- Utility Function ---
  const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => {
      if (error?.message?.startsWith('Auth failed or forbidden')) {
          const status = error.message.split(': ')[1];
          return `Sesi Anda mungkin telah berakhir (${status}) atau Anda tidak memiliki izin. Silakan login kembali.`;
      }
      if (error?.response) {
          let apiMessage = error.response.data?.message;
          const status = error.response.status;
          if (status === 422 && error.response.data?.errors) {
              const errors = error.response.data.errors;
              apiMessage = Object.values(errors).flat().join('<br/> ');
              apiMessage = `Data tidak valid:<br/> ${apiMessage}`;
          } else if (status === 404) {
              apiMessage = apiMessage || 'Data tidak ditemukan.';
          } else if (status === 403) {
               apiMessage = apiMessage || 'Anda tidak memiliki izin untuk melakukan aksi ini.';
          } else if (status === 409) { // Specific for roles potentially
              apiMessage = apiMessage || 'Operasi gagal: Role ini kemungkinan masih digunakan oleh pengguna aktif atau terdapat konflik data.';
          } else if (status >= 500) {
              apiMessage = 'Terjadi masalah pada server (5xx). Coba lagi nanti.';
          } else if (status === 401) {
               apiMessage = apiMessage || 'Autentikasi gagal (401). Silakan login kembali.';
          }
          return apiMessage || `Error ${status}: ${error.response.statusText || defaultMessage}`;
      } else if (error?.request) {
          return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      }
      return error?.message || defaultMessage;
  };
  
  // --- Component State ---
  const viewMode = ref('active'); // 'active' or 'trashed'
  const roles = ref([]);
  const trashedRoles = ref([]);
  const pagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
  const trashedPagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
  const trashedCount = ref(0);
  const filters = reactive({ search: '', sort_by: 'name', sort_direction: 'asc', page: 1, per_page: 15 });
  const isLoading = ref(false);
  const isSaving = ref(false); // For modal save
  const deletingId = ref(null); // UUID of role being soft-deleted
  const restoringId = ref(null); // UUID of role being restored
  const forceDeletingId = ref(null); // UUID of role being force-deleted
  const error = ref(null); // Main page error
  const successMessage = ref(null);
  const showModal = ref(false); // Add/Edit modal
  const isEditing = ref(false);
  const modalError = ref(null); // Add/Edit modal error
  const currentRole = reactive({ uuid: null, name: '' });
  
  // Confirmation Modal State
  const confirmationState = reactive({
      show: false,
      message: '',
      itemName: '',
      type: 'delete', // 'delete' or 'forceDelete'
      onConfirm: () => {},
  });
  
  
  // --- Watchers ---
  watch(() => [filters.search, filters.per_page], () => {
      if (viewMode.value === 'active') {
          if (pagination.value.currentPage !== 1) pagination.value.currentPage = 1;
      } else {
          if (trashedPagination.value.currentPage !== 1) trashedPagination.value.currentPage = 1;
      }
  }, { deep: true });
  
  // --- Computed Properties ---
  const currentPagination = computed(() => viewMode.value === 'active' ? pagination.value : trashedPagination.value);
  const currentTotalPages = computed(() => currentPagination.value.totalPages);
  const currentTotalItems = computed(() => currentPagination.value.totalItems);
  const trashedCountForDisplay = computed(() => trashedCount.value > 99 ? '99+' : trashedCount.value);
  
  // List empty states
  const isActiveListEmpty = computed(() => roles.value.length === 0);
  const isTrashedListEmpty = computed(() => trashedRoles.value.length === 0);
  
  // Action button states
  const actionInProgress = (uuid) => deletingId.value === uuid || restoringId.value === uuid || forceDeletingId.value === uuid;
  const isSaveDisabled = computed(() => isSaving.value || !currentRole.name || !currentRole.name.trim());
  
  // Sort icons & aria attributes
  const getSortIcon = (column) => {
      if (viewMode.value !== 'active' || filters.sort_by !== column) return 'fas fa-sort text-muted opacity-50';
      return filters.sort_direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  };
  const getAriaSort = (column) => {
      if (viewMode.value !== 'active' || filters.sort_by !== column) return 'none';
      return filters.sort_direction === 'asc' ? 'ascending' : 'descending';
  };
  
  // Simple pagination range generator (unchanged)
  const simplePaginationRange = computed(() => {
      const current = currentPagination.value.currentPage; const last = currentTotalPages.value;
      if (!last || last <= 1) return last === 1 ? [1] : [];
      const delta = 1; const range = []; const rangeWithDots = []; let l;
      range.push(1);
      for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) { range.push(i); }
      if (last > 1) range.push(last);
      const uniqueRange = [...new Set(range)].sort((a, b) => a - b);
      uniqueRange.forEach((i) => { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l > 2) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; });
      return rangeWithDots;
  });
  
  // --- API Functions ---
  async function fetchRoles() {
      isLoading.value = true; clearError();
      filters.page = pagination.value.currentPage;
      filters.per_page = parseInt(filters.per_page, 10);
      const params = {
          page: filters.page, per_page: filters.per_page,
          sort_by: filters.sort_by, sort_direction: filters.sort_direction,
          ...(filters.search && { search: filters.search }),
      };
      try {
          const response = await apiClient.get('/roles', { params });
          if (response.data?.data) {
              roles.value = response.data.data;
              pagination.value = {
                  currentPage: response.data.meta?.current_page ?? 1, totalPages: response.data.meta?.last_page ?? 1,
                  totalItems: response.data.meta?.total ?? 0, perPage: parseInt(response.data.meta?.per_page ?? filters.per_page, 10),
              };
              // Note: Trash count fetched separately initially or after relevant actions
          } else {
              roles.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page };
          }
      } catch (err) {
          error.value = getErrorMessage(err, 'Gagal memuat data role.');
          roles.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page };
      } finally { isLoading.value = false; }
  }
  
  async function fetchTrashedRoles() {
      isLoading.value = true; clearError();
      const trashPage = trashedPagination.value.currentPage;
      const trashPerPage = parseInt(filters.per_page, 10);
      const params = { page: trashPage, per_page: trashPerPage, ...(filters.search && { search: filters.search }), };
      try {
          const response = await apiClient.get('/roles/trash', { params });
          if (response.data?.data) {
              trashedRoles.value = response.data.data;
              trashedPagination.value = {
                  currentPage: response.data.meta?.current_page ?? 1, totalPages: response.data.meta?.last_page ?? 1,
                  totalItems: response.data.meta?.total ?? 0, perPage: parseInt(response.data.meta?.per_page ?? trashPerPage, 10),
              };
              trashedCount.value = response.data.meta?.total ?? 0; // Update count from trash response
          } else {
              trashedRoles.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage };
              trashedCount.value = 0;
          }
      } catch (err) {
          error.value = getErrorMessage(err, 'Gagal memuat data role dari tempat sampah.');
          trashedRoles.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage };
          trashedCount.value = 0;
      } finally { isLoading.value = false; }
  }
  
  async function fetchTrashCount() {
      try {
          const response = await apiClient.get('/roles/trash', { params: { per_page: 1 } });
          trashedCount.value = response.data.meta?.total ?? 0;
      } catch (err) { console.error("Failed fetch trash count:", getErrorMessage(err)); }
  }
  
  async function saveRole() {
      if (isSaveDisabled.value) {
          modalError.value = "Nama role tidak boleh kosong."; return;
      }
      isSaving.value = true; modalError.value = null; clearError();
      try {
          const payload = { name: currentRole.name };
          const url = isEditing.value ? `/roles/${currentRole.uuid}` : '/roles';
          const method = isEditing.value ? 'put' : 'post';
          const response = await apiClient({ method, url, data: payload });
          if ((method === 'put' && response.status === 200) || (method === 'post' && response.status === 201)) {
               const savedName = response.data?.data?.name || currentRole.name;
              setSuccessMessage(`Role "${savedName}" berhasil ${isEditing.value ? 'diperbarui' : 'ditambahkan'}.`);
              closeAndResetModal();
              await fetchRoles(); // Refresh active list
          } else { throw new Error(response.data?.message || `Gagal ${isEditing.value ? 'memperbarui' : 'membuat'} role.`); }
      } catch (err) { modalError.value = getErrorMessage(err, `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} role.`); }
      finally { isSaving.value = false; }
  }
  
  async function deleteRole(uuid, name) {
      if (actionInProgress(uuid)) return;
      deletingId.value = uuid; clearError();
      try {
          const response = await apiClient.delete(`/roles/${uuid}`);
          if (response.status === 204 || response.status === 200) {
              setSuccessMessage(`Role "${name}" berhasil dipindahkan ke tempat sampah.`);
              const needsPageDecrement = roles.value.length === 1 && pagination.value.currentPage > 1;
              if (needsPageDecrement) pagination.value.currentPage--;
              await fetchRoles(); // Refresh active list
              await fetchTrashCount(); // Update count badge
          } else { throw new Error(response.data?.message || 'Gagal menghapus role.'); }
      } catch (err) { error.value = getErrorMessage(err, `Gagal memindahkan role "${name}" ke tempat sampah.`); }
      finally { deletingId.value = null; }
  }
  
  async function restoreRole(uuid, name) {
      if (actionInProgress(uuid)) return;
      restoringId.value = uuid; clearError();
      try {
          const response = await apiClient.post(`/roles/restore/${uuid}`);
          if (response.status === 200 && response.data?.message) {
              setSuccessMessage(response.data.message || `Role "${name}" berhasil dipulihkan.`);
              const needsPageDecrement = trashedRoles.value.length === 1 && trashedPagination.value.currentPage > 1;
              if (needsPageDecrement) trashedPagination.value.currentPage--;
              await fetchTrashedRoles(); // Refresh trash list & count
          } else { throw new Error(response.data?.message || `Gagal memulihkan role "${name}".`); }
      } catch (err) { error.value = getErrorMessage(err, `Gagal memulihkan role "${name}".`); }
      finally { restoringId.value = null; }
  }
  
  async function forceDeleteRole(uuid, name) {
      if (actionInProgress(uuid)) return;
      forceDeletingId.value = uuid; clearError();
      try {
          const response = await apiClient.delete(`/roles/force-delete/${uuid}`);
          if (response.status === 204 || response.status === 200) {
              setSuccessMessage(`Role "${name}" berhasil dihapus permanen.`);
              const needsPageDecrement = trashedRoles.value.length === 1 && trashedPagination.value.currentPage > 1;
              if (needsPageDecrement) trashedPagination.value.currentPage--;
              await fetchTrashedRoles(); // Refresh trash list & count
          } else { throw new Error(response.data?.message || `Gagal menghapus role "${name}" permanen.`); }
      } catch (err) { error.value = getErrorMessage(err, `Gagal menghapus role "${name}" permanen.`); }
      finally { forceDeletingId.value = null; }
  }
  
  // --- Confirmation Modal Logic ---
  function askConfirmDeleteRole(uuid, name) {
      confirmationState.message = `Anda yakin ingin memindahkan role ini ke tempat sampah?`;
      confirmationState.itemName = name;
      confirmationState.type = 'delete';
      confirmationState.onConfirm = () => deleteRole(uuid, name);
      confirmationState.show = true;
      clearError(); // Clear main error when showing confirmation
  }
  
  function askConfirmForceDeleteRole(uuid, name) {
      confirmationState.message = `Anda yakin ingin menghapus role ini secara <strong>permanen</strong>?`;
      confirmationState.itemName = name;
      confirmationState.type = 'forceDelete';
      confirmationState.onConfirm = () => forceDeleteRole(uuid, name);
      confirmationState.show = true;
      clearError(); // Clear main error when showing confirmation
  }
  
  function cancelConfirmation() {
      confirmationState.show = false;
      confirmationState.onConfirm = () => {}; // Clear callback
  }
  
  function confirmAction() {
      if (typeof confirmationState.onConfirm === 'function') {
          confirmationState.onConfirm();
      }
      cancelConfirmation(); // Close modal after initiating action
  }
  
  
  // --- UI Functions ---
  function applyFilters() {
      // Watcher handles page reset, just fetch
      if (viewMode.value === 'active') fetchRoles();
      else fetchTrashedRoles();
  }
  
  function clearSearch() {
      if (filters.search) {
          filters.search = '';
          applyFilters(); // Will trigger fetch via watcher or directly
      }
  }
  
  function clearError() { error.value = null; }
  
  function setSuccessMessage(message) {
      successMessage.value = message;
      setTimeout(() => { successMessage.value = null; }, 5000); // Longer duration
  }
  
  function changePage(page) {
      if (isLoading.value || page === '...') return;
      if (viewMode.value === 'active') {
          if (page >= 1 && page <= pagination.value.totalPages && page !== pagination.value.currentPage) {
              pagination.value.currentPage = page; fetchRoles();
          }
      } else {
          if (page >= 1 && page <= trashedPagination.value.totalPages && page !== trashedPagination.value.currentPage) {
              trashedPagination.value.currentPage = page; fetchTrashedRoles();
          }
      }
  }
  
  function changeSort(column) {
      if (viewMode.value !== 'active' || isLoading.value) return;
      if (filters.sort_by === column) {
          filters.sort_direction = filters.sort_direction === 'asc' ? 'desc' : 'asc';
      } else {
          filters.sort_by = column; filters.sort_direction = 'asc';
      }
      applyFilters(); // Will trigger fetch
  }
  
  function openAddModal() {
      isEditing.value = false; modalError.value = null; clearError();
      Object.assign(currentRole, { uuid: null, name: '' });
      showModal.value = true;
  }
  
  function openEditModal(role) {
      isEditing.value = true; modalError.value = null; clearError();
      Object.assign(currentRole, { uuid: role.uuid, name: role.name });
      showModal.value = true;
  }
  
  function closeAndResetModal() {
      showModal.value = false; isEditing.value = false;
      modalError.value = null;
      Object.assign(currentRole, { uuid: null, name: '' });
  }
  
  function switchViewMode(mode) {
      if (mode === viewMode.value || isLoading.value) return;
      viewMode.value = mode;
      clearError(); successMessage.value = null;
      // applyFilters will fetch the correct data for the new view mode
      applyFilters();
  }
  
  // --- Utility Functions ---
  const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
          return new Date(dateString).toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: false
          });
      } catch (e) { console.warn("Error formatting date:", dateString, e); return dateString; }
  };
  
  // --- Lifecycle Hook ---
  onMounted(async () => {
       isLoading.value = true; // Set loading for initial fetches
       try {
          // Fetch initial active roles and the trash count concurrently
          await Promise.all([
              fetchRoles(),
              fetchTrashCount()
          ]);
       } catch (err) {
          console.error("Error during initial data fetch:", err);
          // Individual fetch functions handle setting the main error state
       } finally {
           isLoading.value = false;
       }
  });
  
  </script>
  
  <style scoped>
  /* Re-use or adapt styles from the User Management component */
  .dashboard-view { padding: 2rem 0; background-color: #f8f9fa; }
  .role-manager-container { background-color: #ffffff; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075); }
  .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #dee2e6; }
  .page-title { font-size: 1.75rem; font-weight: 500; margin: 0; }
  .filter-section.card { border: none; }
  .filter-item .input-group-text { border-right: 0; }
  .filter-item .form-control { border-left: 0; }
  .filter-item .form-control:focus { box-shadow: none; border-color: #ced4da; }
  .modern-table { border-collapse: separate; border-spacing: 0; width: 100%; }
  .modern-table th, .modern-table td { padding: 0.85rem 1rem; vertical-align: middle; font-size: 0.9rem; }
  .modern-table thead th { background-color: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057; white-space: nowrap; }
  .modern-table tbody tr:hover { background-color: #f1f3f5; }
  .modern-table td { color: #212529; }
  .sortable-header { cursor: pointer; user-select: none; }
  .sortable-header:hover { color: #0d6efd; }
  .sortable-header i { font-size: 0.8em; margin-left: 0.3rem; }
  .action-buttons { display: flex; justify-content: center; gap: 0.5rem; flex-wrap: nowrap; }
  .btn-icon { padding: 0.3rem 0.6rem; font-size: 0.85rem; line-height: 1; }
  
  /* Modal Styles */
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1050; }
  .modal-dialog { max-width: 500px; /* Standard modal width */ width: 90%; margin: 1.75rem auto;}
  .modal-content { border: none; border-radius: 0.5rem; }
  .modal-header { padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; }
  /* Custom modal header colors */
  .modal-header.bg-danger { border-bottom-color: rgba(0,0,0,0.2); }
  .modal-header.bg-warning { border-bottom-color: rgba(0,0,0,0.1); color: #000 !important; } /* Warning needs text adjustment */
  .modal-body { padding: 1.5rem; }
  .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; background-color: #f8f9fa; }
  .modern-form .form-label { font-weight: 500; margin-bottom: 0.3rem; font-size: 0.9rem; }
  .btn .spinner-border { vertical-align: middle; }
  
  /* Responsive adjustments */
  @media (max-width: 767.98px) {
      .page-header { flex-direction: column; align-items: flex-start; }
      .pagination-controls { flex-direction: column; align-items: center; }
      .filter-section .card-body { align-items: stretch !important; }
      .filter-item { min-width: 0 !important; width: 100%; }
      .filter-item.ms-md-auto { margin-left: 0 !important; margin-top: 0.5rem; display: flex; justify-content: flex-end; }
  }
  </style>