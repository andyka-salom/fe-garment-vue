<template>
    <div class="dashboard-view">
        <div class="container">
            <div class="role-manager-container"> <!-- Renamed class -->
                <header class="page-header">
                    <h1 class="page-title">Manajemen Role</h1>
                    <div class="d-flex flex-wrap gap-2 align-items-center">
                        <!-- View Toggle -->
                        <div class="btn-group btn-group-sm" role="group" aria-label="View Mode Toggle">
                            <button type="button" class="btn"
                                :class="viewMode === 'active' ? 'btn-primary active' : 'btn-outline-secondary'"
                                @click="switchViewMode('active')"
                                :disabled="isLoading">
                                <i class="fas fa-list me-1"></i> Daftar Aktif
                            </button>
                            <button type="button" class="btn"
                                :class="viewMode === 'trashed' ? 'btn-primary active' : 'btn-outline-secondary'"
                                @click="switchViewMode('trashed')"
                                :disabled="isLoading">
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
                                    :placeholder="`Cari di ${viewMode === 'active' ? 'daftar aktif' : 'tempat sampah'}...`"
                                    v-model.lazy="filters.search" @keyup.enter="applyFilters" :disabled="isLoading" />
                                <button v-if="filters.search" class="btn btn-outline-secondary" type="button"
                                    @click="clearSearch" title="Hapus Pencarian">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <!-- Apply Button -->
                        <div class="filter-item ms-md-auto">
                            <button class="btn btn-sm btn-primary" @click="applyFilters" :disabled="isLoading">
                                <i class="fas fa-check me-1"></i> Terapkan Filter
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Feedback Section -->
                <div class="feedback-section mb-3">
                     <div v-if="isLoading && (viewMode === 'active' ? !roles.length : !trashedRoles.length)" class="alert alert-info d-flex align-items-center shadow-sm" role="alert">
                         <div class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></div>
                         <span>Memuat data role {{ viewMode === 'trashed' ? ' sampah' : '' }}, mohon tunggu...</span>
                     </div>
                     <div v-if="error && !showModal" class="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
                         <i class="fas fa-exclamation-triangle me-2"></i> {{ error }}
                         <button type="button" class="btn-close btn-sm" @click="clearError" aria-label="Close"></button>
                     </div>
                     <div v-if="successMessage" class="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                         <i class="fas fa-check-circle me-2"></i> {{ successMessage }}
                         <button type="button" class="btn-close btn-sm" @click="successMessage = null" aria-label="Close"></button>
                     </div>
                     <div v-if="!isLoading && (viewMode === 'active' ? roles.length === 0 : trashedRoles.length === 0) && !error" class="alert alert-secondary text-center shadow-sm" role="alert">
                         <i class="fas fa-box-open me-2"></i>
                         Tidak ada data role ditemukan
                         <span v-if="filters.search"> sesuai filter</span>
                         <span v-if="viewMode === 'active' && !filters.search">. Silakan tambahkan role baru.</span>
                         <span v-if="viewMode === 'trashed' && !filters.search"> di tempat sampah.</span>
                         <button v-if="filters.search" @click="clearSearch" class="btn btn-sm btn-link p-0 ms-2">Hapus Filter</button>
                     </div>
                 </div>


                <!-- ======================= -->
                <!--      ACTIVE TABLE       -->
                <!-- ======================= -->
                <div v-if="viewMode === 'active'" class="table-container shadow-sm mb-4">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle modern-table">
                            <thead>
                                <tr>
                                    <th scope="col" style="width: 5%;">#</th>
                                    <th scope="col" @click="changeSort('name')" class="sortable-header">
                                        Nama Role <i :class="getSortIcon('name')"></i>
                                    </th>
                                    <th scope="col" style="width: 20%;" @click="changeSort('created_at')" class="sortable-header">
                                        Dibuat Pada <i :class="getSortIcon('created_at')"></i>
                                    </th>
                                    <th scope="col" class="text-center" style="width: 15%;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoading">
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
                                                :disabled="deletingId === role.uuid || restoringId === role.uuid || forceDeletingId === role.uuid">
                                                <i class="fas fa-pencil-alt"></i>
                                            </button>
                                            <button @click="confirmDeleteRole(role.uuid, role.name)"
                                                class="btn btn-icon btn-outline-danger" title="Pindahkan ke Tempat Sampah"
                                                :disabled="deletingId === role.uuid || restoringId === role.uuid || forceDeletingId === role.uuid">
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
                        <table class="table table-hover align-middle modern-table">
                            <thead>
                                <tr>
                                    <th scope="col" style="width: 5%;">#</th>
                                    <th scope="col"> <!-- No sorting for trash currently -->
                                        Nama Role
                                    </th>
                                    <th scope="col" style="width: 20%;"> <!-- No sorting for trash currently -->
                                        Dihapus Pada
                                    </th>
                                    <th scope="col" class="text-center" style="width: 20%;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoading">
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
                                     <td>{{ formatDate(role.deleted_at) }}</td> <!-- Assuming deleted_at exists -->
                                     <td>
                                        <div class="action-buttons">
                                            <button @click="restoreRole(role.uuid, role.name)"
                                                class="btn btn-icon btn-outline-success" title="Pulihkan Role"
                                                :disabled="restoringId === role.uuid || forceDeletingId === role.uuid || deletingId === role.uuid">
                                                <span v-if="restoringId === role.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                <i v-else class="fas fa-undo-alt"></i>
                                            </button>
                                            <button @click="confirmForceDeleteRole(role.uuid, role.name)"
                                                class="btn btn-icon btn-outline-danger" title="Hapus Permanen"
                                                :disabled="forceDeletingId === role.uuid || restoringId === role.uuid || deletingId === role.uuid">
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
                         <label for="perPageSelectRole" class="form-label mb-0 text-muted small">Item/Hal:</label>
                         <select id="perPageSelectRole" class="form-select form-select-sm" style="width: 75px;"
                             v-model="filters.per_page"
                             @change="applyFilters">
                             <option value="15">15</option>
                             <option value="25">25</option>
                             <option value="50">50</option>
                             <option value="100">100</option>
                         </select>
                         <span class="text-muted small ms-2 d-none d-md-inline">
                             Total {{ currentTotalItems }} role {{ viewMode === 'trashed' ? ' sampah' : ''}}
                         </span>
                     </div>
                     <nav aria-label="Page navigation">
                         <ul class="pagination pagination-sm mb-0">
                             <li class="page-item" :class="{ disabled: currentPagination.currentPage <= 1 }">
                                 <a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage - 1)" aria-label="Previous">
                                     <span aria-hidden="true">«</span>
                                 </a>
                             </li>
                             <li v-for="page in simplePaginationRange" :key="page" class="page-item"
                                 :class="{ active: page === currentPagination.currentPage, disabled: page === '...' }">
                                 <a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                                 <span v-else class="page-link">...</span>
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
                <!--         MODAL           -->
                <!-- ======================= -->
                <div v-if="showModal" class="modal-overlay" @click.self="closeAndResetModal">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content shadow-lg">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2']"></i>
                                    {{ isEditing ? 'Edit Role' : 'Tambah Role Baru' }}
                                </h5>
                                <button type="button" class="btn-close" @click="closeAndResetModal"
                                    aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div v-if="modalError" class="alert alert-danger alert-dismissible fade show" role="alert">
                                    {{ modalError }}
                                    <button type="button" class="btn-close btn-sm" @click="modalError = null" aria-label="Close"></button>
                                </div>
                                <form @submit.prevent="saveRole" id="roleForm" class="modern-form" novalidate>
                                    <!-- Name Field -->
                                    <div class="form-group mb-3">
                                        <label for="roleName" class="form-label">Nama Role <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" id="roleName" v-model.trim="currentRole.name"
                                            required placeholder="Masukkan nama role (e.g., Administrator, Editor)" :disabled="isSaving" />
                                    </div>
                                     <!-- Removed Status Field -->
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" @click="closeAndResetModal" :disabled="isSaving">Batal</button>
                                <button type="submit" form="roleForm" class="btn btn-primary" :disabled="isSaving || !currentRole.name">
                                    <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {{ isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Role') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div> <!-- End Modal -->

            </div> <!-- End .role-manager-container -->
        </div> <!-- End .container -->
    </div> <!-- End .dashboard-view -->
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';

// --- Axios Instance ---
const apiClient = axios.create({
  baseURL: `${process.env.VUE_APP_API_URL || 'http://localhost:8000/api'}`, // Ensure /api is included
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
});

// --- Axios Interceptors (Keep as is) ---
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
  } catch (e) { console.error("Error reading localStorage:", e); }
  return config;
}, error => Promise.reject(error));

apiClient.interceptors.response.use(response => response, error => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error(`Authentication Error (${error.response.status})`);
      localStorage.removeItem('userData');
      window.location.href = '/login'; // Fallback
      return Promise.reject(new Error(`Auth failed: ${error.response.status}`));
  }
  if (error.response && error.response.status === 409) {
      console.warn('Conflict Error (409):', error.response.data?.message);
  }
   if (error.response && error.response.status === 404) {
      console.warn('Not Found Error (404):', error.response.data?.message);
  }
  return Promise.reject(error);
});
// --- End Axios Setup ---

// --- Utility Function ---
const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => {
  if (error?.message?.includes('Auth failed')) return '';
  if (error?.response) {
      let apiMessage = error.response.data?.message;
      const status = error.response.status;
      if (status === 422 && error.response.data?.errors) {
          const errors = error.response.data.errors;
          const firstErrorKey = Object.keys(errors)[0];
          apiMessage = errors[firstErrorKey]?.[0] || apiMessage || 'Data tidak valid.';
      } else if (status === 404) {
          apiMessage = apiMessage || 'Data tidak ditemukan.';
      } else if (status === 409) {
           apiMessage = apiMessage || 'Operasi gagal: Role ini masih digunakan oleh pengguna.';
      } else if (status >= 500) {
           apiMessage = apiMessage || 'Terjadi masalah pada server.';
      }
      return apiMessage || `Error ${status}: ${error.response.statusText || defaultMessage}`;
  } else if (error?.request) {
      return 'Tidak dapat terhubung ke server.';
  }
  return error?.message || defaultMessage;
};

// --- Component State ---
const roles = ref([]);
const trashedRoles = ref([]);
const pagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedPagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedCount = ref(0);
const filters = reactive({ search: '', sort_by: 'name', sort_direction: 'asc', page: 1, per_page: 15 });
const isLoading = ref(false);
const isSaving = ref(false);
const deletingId = ref(null);
const restoringId = ref(null);
const forceDeletingId = ref(null);
const error = ref(null);
const successMessage = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const modalError = ref(null);
const viewMode = ref('active');
const currentRole = reactive({
  uuid: null,
  name: '',
});

// --- Computed Properties ---
const currentPagination = computed(() => viewMode.value === 'active' ? pagination.value : trashedPagination.value);
const currentTotalPages = computed(() => currentPagination.value.totalPages);
const currentTotalItems = computed(() => currentPagination.value.totalItems);
const trashedCountForDisplay = computed(() => trashedCount.value > 99 ? '99+' : trashedCount.value);

const getSortIcon = (column) => {
  if (viewMode.value !== 'active' || filters.sort_by !== column) return 'fas fa-sort text-muted opacity-50';
  return filters.sort_direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
};

const simplePaginationRange = computed(() => {
  const current = currentPagination.value.currentPage;
  const last = currentTotalPages.value;
    if (!last || last <= 1) return last === 1 ? [1] : []; // Handle no/single pages
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;
  range.push(1);
  for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) { range.push(i); }
  if (last > 1) range.push(last);
  const uniqueRange = [...new Set(range)].sort((a, b) => a - b); // Ensure sorted unique
  uniqueRange.forEach((i) => { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l > 2) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; });
  return rangeWithDots;
});


// --- API Functions ---
async function fetchRoles() {
  isLoading.value = true;
  clearError();
  filters.page = pagination.value.currentPage;
  filters.per_page = parseInt(filters.per_page, 10); // Ensure number
    const params = {
        page: filters.page,
        per_page: filters.per_page,
        sort_by: filters.sort_by,
        sort_direction: filters.sort_direction,
        ...(filters.search && { search: filters.search }),
    };

  try {
      const response = await apiClient.get('/roles', { params });
      if (response.data && response.data.data) {
          roles.value = response.data.data;
          pagination.value = {
              currentPage: response.data.meta?.current_page ?? 1,
              totalPages: response.data.meta?.last_page ?? 1,
              totalItems: response.data.meta?.total ?? 0,
              perPage: parseInt(response.data.meta?.per_page ?? filters.per_page, 10),
          };
          await fetchTrashCount();
      } else {
          roles.value = [];
          pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page };
      }
  } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat data role.');
      roles.value = [];
      pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page };
  } finally {
      isLoading.value = false;
  }
}

async function fetchTrashedRoles() {
  isLoading.value = true;
  clearError();
  const trashPage = trashedPagination.value.currentPage;
  const trashPerPage = parseInt(filters.per_page, 10);
  const params = {
      page: trashPage,
      per_page: trashPerPage,
      ...(filters.search && { search: filters.search }),
  };

  try {
      const response = await apiClient.get('/roles/trash', { params });
       if (response.data && response.data.data) {
          trashedRoles.value = response.data.data;
          trashedPagination.value = {
              currentPage: response.data.meta?.current_page ?? 1,
              totalPages: response.data.meta?.last_page ?? 1,
              totalItems: response.data.meta?.total ?? 0,
              perPage: parseInt(response.data.meta?.per_page ?? trashPerPage, 10),
          };
          trashedCount.value = response.data.meta?.total ?? 0;
      } else {
          trashedRoles.value = [];
          trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage };
          trashedCount.value = 0;
      }
  } catch (err) {
      error.value = getErrorMessage(err, 'Gagal memuat data role dari tempat sampah.');
      trashedRoles.value = [];
      trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage };
      trashedCount.value = 0;
  } finally {
      isLoading.value = false;
  }
}

async function fetchTrashCount() {
  try {
      const response = await apiClient.get('/roles/trash', { params: { per_page: 1 } });
      trashedCount.value = response.data.meta?.total ?? 0;
  } catch (err) {
      console.error("Failed to fetch trash count:", err);
  }
}

async function saveRole() {
  if (!currentRole.name || !currentRole.name.trim()) {
      modalError.value = "Nama role tidak boleh kosong."; return;
  }
  isSaving.value = true;
  modalError.value = null;
  clearError();
  try {
      const payload = { name: currentRole.name };
      const url = isEditing.value ? `/roles/${currentRole.uuid}` : '/roles';
      const method = isEditing.value ? 'put' : 'post';
      const response = await apiClient({ method, url, data: payload });

      if ((response.status === 200 || response.status === 201) && response.data?.data) {
          setSuccessMessage(`Role "${response.data.data.name}" berhasil ${isEditing.value ? 'diperbarui' : 'ditambahkan'}.`);
          closeAndResetModal();
          await fetchRoles();
      } else {
          throw new Error(response.data?.message || `Gagal ${isEditing.value ? 'memperbarui' : 'membuat'} role.`);
      }
  } catch (err) {
      modalError.value = getErrorMessage(err, `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} role.`);
  } finally {
      isSaving.value = false;
  }
}

async function deleteRole(uuid, name) {
  deletingId.value = uuid;
  clearError();
  try {
      const response = await apiClient.delete(`/roles/${uuid}`);
      if (response.status === 204) {
          setSuccessMessage(`Role "${name}" berhasil dipindahkan ke tempat sampah.`);
          if (roles.value.length === 1 && pagination.value.currentPage > 1) {
              pagination.value.currentPage--;
          }
          await fetchRoles(); // Refreshes active roles & trash count
      } else {
           throw new Error(response.data?.message || 'Gagal menghapus role.');
      }
  } catch (err) {
      error.value = getErrorMessage(err, `Gagal memindahkan role "${name}" ke tempat sampah.`);
  } finally {
      deletingId.value = null;
  }
}

async function restoreRole(uuid, name) {
  restoringId.value = uuid;
  clearError();
  try {
      const response = await apiClient.post(`/roles/restore/${uuid}`);
      if (response.status === 200 && response.data?.message) {
           setSuccessMessage(response.data.message || `Role "${name}" berhasil dipulihkan.`);
          if (trashedRoles.value.length === 1 && trashedPagination.value.currentPage > 1) {
              trashedPagination.value.currentPage--;
          }
           await fetchTrashedRoles();
      } else {
          throw new Error(response.data?.message || `Gagal memulihkan role "${name}".`);
      }
  } catch (err) {
      error.value = getErrorMessage(err, `Gagal memulihkan role "${name}".`);
  } finally {
      restoringId.value = null;
  }
}

// --- CORRECTED forceDeleteRole with Optimistic UI Update ---
async function forceDeleteRole(uuid, name) {
    forceDeletingId.value = uuid;
    clearError();

    // Find index before API call
    const indexToDelete = trashedRoles.value.findIndex(role => role.uuid === uuid);

    try {
        const response = await apiClient.delete(`/roles/force-delete/${uuid}`);

        // Expect 204 No Content from controller
        if (response.status === 204) {
            setSuccessMessage(`Role "${name}" berhasil dihapus permanen.`);

            // Optimistic UI Update: Remove immediately from local array
            if (indexToDelete > -1) {
                trashedRoles.value.splice(indexToDelete, 1);
            }

            // Check if current page became empty *after* splicing
            const needsPageDecrement = trashedRoles.value.length === 0 && trashedPagination.value.currentPage > 1;

            if (needsPageDecrement) {
                 trashedPagination.value.currentPage--;
            }

            // Fetch the definitive state from the server to update counts/pagination
            // and ensure consistency. This will use the potentially decremented page number.
            await fetchTrashedRoles();

        } else {
             // Handle unexpected success status (though 204 is expected)
             throw new Error(response.data?.message || `Gagal menghapus role "${name}" secara permanen (status: ${response.status}).`);
        }
    } catch (err) {
        // Handle API errors (404, 409, 500, network issues)
        error.value = getErrorMessage(err, `Gagal menghapus role "${name}" secara permanen.`);
        // No need to revert splice here, as it only happens on 204 success.
        // If needed, a full refresh fetch could be added here for extreme robustness,
        // but generally showing the error is sufficient.
    } finally {
        forceDeletingId.value = null;
    }
}
// --- End of CORRECTED forceDeleteRole ---

// --- UI Functions ---
function applyFilters() {
  if (viewMode.value === 'active') {
      pagination.value.currentPage = 1;
      fetchRoles();
  } else {
      trashedPagination.value.currentPage = 1;
      fetchTrashedRoles();
  }
}

function clearSearch() {
  if (filters.search) {
      filters.search = '';
      applyFilters();
  }
}

function clearError() {
  error.value = null;
}

function setSuccessMessage(message) {
  successMessage.value = message;
  setTimeout(() => { successMessage.value = null; }, 4000);
}


function changePage(page) {
    if (isLoading.value) return; // Prevent page change while loading
    if (viewMode.value === 'active') {
        if (page >= 1 && page <= pagination.value.totalPages && page !== pagination.value.currentPage) {
            pagination.value.currentPage = page;
            fetchRoles();
        }
    } else {
        if (page >= 1 && page <= trashedPagination.value.totalPages && page !== trashedPagination.value.currentPage) {
            trashedPagination.value.currentPage = page;
            fetchTrashedRoles();
        }
    }
}

function changeSort(column) {
  if (viewMode.value !== 'active' || isLoading.value) return;

  if (filters.sort_by === column) {
      filters.sort_direction = filters.sort_direction === 'asc' ? 'desc' : 'asc';
  } else {
      filters.sort_by = column;
      filters.sort_direction = 'asc';
  }
  applyFilters();
}

function openAddModal() {
  isEditing.value = false;
  modalError.value = null;
  clearError();
  Object.assign(currentRole, { uuid: null, name: '' });
  showModal.value = true;
}

function openEditModal(role) {
  isEditing.value = true;
  modalError.value = null;
  clearError();
    Object.assign(currentRole, { uuid: role.uuid, name: role.name });
  showModal.value = true;
}

function closeAndResetModal() {
  showModal.value = false;
  isEditing.value = false;
  isSaving.value = false;
  modalError.value = null;
  Object.assign(currentRole, { uuid: null, name: '' });
}

function confirmDeleteRole(uuid, name) {
  if (confirm(`Apakah Anda yakin ingin memindahkan role "${name}" ke tempat sampah? Pengguna dengan role ini tidak akan terpengaruh.`)) {
      deleteRole(uuid, name);
  }
}

function confirmForceDeleteRole(uuid, name) {
   if (confirm(`PERHATIAN!\nApakah Anda yakin ingin menghapus role "${name}" secara permanen?\n\nTindakan ini tidak dapat diurungkan. Pastikan tidak ada pengguna yang masih terkait dengan role ini (meskipun API akan memeriksa kembali).`)) {
      forceDeleteRole(uuid, name);
  }
}

function switchViewMode(mode) {
  if (mode === viewMode.value || isLoading.value) return;
  viewMode.value = mode;
  clearError();
    successMessage.value = null; // Also clear success message
  if (mode === 'active') {
       pagination.value.currentPage = 1;
       fetchRoles();
   } else {
       trashedPagination.value.currentPage = 1;
       fetchTrashedRoles();
   }
}


// --- Utility Functions ---
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
      return new Date(dateString).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: false
      });
  } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString;
  }
};

// --- Lifecycle Hook ---
onMounted(() => {
  fetchRoles();
});

</script>

