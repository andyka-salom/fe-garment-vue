<template>
  <div class="dashboard-view">
    <div class="container">
      <div class="user-manager-container">
        <header class="page-header">
          <h1 class="page-title">Manajemen User</h1>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <!-- View Toggle -->
            <div class="btn-group btn-group-sm" role="group" aria-label="View Mode Toggle">
              <button type="button" class="btn" :class="viewMode === 'active' ? 'btn-primary active' : 'btn-outline-secondary'" @click="switchViewMode('active')" :disabled="isLoading">
                <i class="fas fa-list me-1"></i> Daftar Aktif
              </button>
              <button type="button" class="btn" :class="viewMode === 'trashed' ? 'btn-primary active' : 'btn-outline-secondary'" @click="switchViewMode('trashed')" :disabled="isLoading">
                <i class="fas fa-trash me-1"></i> Tempat Sampah
                <span v-if="trashedCount > 0" class="badge bg-danger ms-1 rounded-pill">{{ trashedCountForDisplay }}</span>
              </button>
            </div>
            <!-- Add Button (only for active view) -->
            <button v-if="viewMode === 'active'" @click="openAddModal" class="btn btn-primary btn-sm">
              <i class="fas fa-plus me-1"></i> Tambah User Baru
            </button>
          </div>
        </header>

        <!-- Filters Section (Unchanged) -->
        <div class="filter-section card shadow-sm mb-4">
          <div class="card-body d-flex flex-column flex-md-row flex-wrap gap-3 align-items-md-center">
            <!-- Search Input -->
            <div class="filter-item flex-grow-1 mb-2 mb-md-0" style="min-width: 200px;">
              <label for="searchFilterUser" class="form-label visually-hidden">Cari User</label>
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-light"><i class="fas fa-search fa-fw"></i></span>
                <input type="text" id="searchFilterUser" class="form-control" :placeholder="`Cari nama/email di ${viewMode === 'active' ? 'daftar aktif' : 'tempat sampah'}...`" v-model.lazy="filters.search" @keyup.enter="applyFilters" :disabled="isLoading" />
                <button v-if="filters.search" class="btn btn-outline-secondary" type="button" @click="clearSearch" title="Hapus Pencarian"><i class="fas fa-times"></i></button>
              </div>
            </div>
            <!-- Status Filter (Only Active View) -->
            <div v-if="viewMode === 'active'" class="filter-item" style="min-width: 150px;">
              <label for="statusFilterUser" class="form-label visually-hidden">Filter Status</label>
              <select id="statusFilterUser" class="form-select form-select-sm" v-model="filters.is_active" @change="applyFilters" :disabled="isLoading">
                <option value="">Semua Status</option>
                <option value="true">Aktif</option>
                <option value="false">Tidak Aktif</option>
              </select>
            </div>
             <!-- Role Filter (Only Active View) -->
             <div v-if="viewMode === 'active'" class="filter-item" style="min-width: 180px;">
                 <label for="roleFilter" class="form-label visually-hidden">Filter Role</label>
                 <select id="roleFilter" class="form-select form-select-sm" v-model="filters.role_id" @change="applyFilters" :disabled="isLoading || isLoadingRoleOptions">
                     <option value="">Semua Role</option>
                     <!-- Options loaded once -->
                     <option v-for="option in roleOptions" :key="option.id" :value="option.id">
                         {{ option.text }}
                     </option>
                 </select>
                 <div v-if="isLoadingRoleOptions" class="spinner-border spinner-border-sm text-secondary ms-2" role="status" style="width: 1rem; height: 1rem;"><span class="visually-hidden">Loading roles...</span></div>
             </div>
            <!-- Apply/Clear Buttons -->
            <div class="filter-item ms-md-auto">
              <button class="btn btn-sm btn-primary" @click="applyFilters" :disabled="isLoading"><i class="fas fa-check me-1"></i> Terapkan</button>
              <button v-if="hasActiveFilters" class="btn btn-sm btn-outline-secondary ms-2" @click="clearAllFilters" :disabled="isLoading" title="Hapus Semua Filter"><i class="fas fa-eraser"></i></button>
            </div>
          </div>
        </div>

        <!-- Feedback Section -->
        <div class="feedback-section mb-3" aria-live="polite">
          <div v-if="isLoading && (viewMode === 'active' ? !users.length : !trashedUsers.length)" class="alert alert-info d-flex align-items-center shadow-sm"><div class="spinner-border spinner-border-sm me-3"></div><span>Memuat data user {{ viewMode === 'trashed' ? ' sampah' : '' }}...</span></div>
          <!-- Error check accounts for confirmation modal -->
          <div v-if="error && !showModal && !confirmationState.show" class="alert alert-danger alert-dismissible fade show shadow-sm"><i class="fas fa-exclamation-triangle me-2"></i> <span v-html="error"></span> <button type="button" class="btn-close btn-sm" @click="clearError"></button></div>
          <div v-if="successMessage" class="alert alert-success alert-dismissible fade show shadow-sm"><i class="fas fa-check-circle me-2"></i> {{ successMessage }} <button type="button" class="btn-close btn-sm" @click="successMessage = null"></button></div>
          <div v-if="!isLoading && (viewMode === 'active' ? users.length === 0 : trashedUsers.length === 0) && !error" class="alert alert-secondary text-center shadow-sm">
            <i class="fas fa-users-slash me-2"></i> Tidak ada user ditemukan
            <span v-if="hasActiveFilters"> sesuai filter</span>
            <span v-if="viewMode === 'active' && !hasActiveFilters">. Silakan tambahkan user baru.</span>
            <span v-if="viewMode === 'trashed' && !filters.search"> di tempat sampah.</span>
            <button v-if="hasActiveFilters" @click="clearAllFilters" class="btn btn-sm btn-link p-0 ms-2">Hapus Filter</button>
          </div>
        </div>

        <!-- Active Users Table -->
        <div v-if="viewMode === 'active'" class="table-container shadow-sm mb-4">
          <div class="table-responsive">
            <table class="table table-hover align-middle modern-table">
              <thead>
                <tr>
                  <th scope="col" style="width: 5%;">#</th>
                  <th scope="col" @click="changeSort('name')" class="sortable-header">Nama <i :class="getSortIcon('name')"></i></th>
                  <th scope="col" @click="changeSort('email')" class="sortable-header">Email <i :class="getSortIcon('email')"></i></th>
                  <th scope="col" style="width: 15%;">Role</th>
                  <th scope="col" style="width: 10%;" @click="changeSort('is_active')" class="sortable-header">Status <i :class="getSortIcon('is_active')"></i></th>
                  <th scope="col" style="width: 15%;" @click="changeSort('created_at')" class="sortable-header">Dibuat <i :class="getSortIcon('created_at')"></i></th>
                  <th scope="col" class="text-center" style="width: 12%;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading && !users.length"><td :colspan="7" class="text-center"><div class="d-flex justify-content-center align-items-center py-4"><div class="spinner-border text-primary"></div><span class="ms-3 text-muted">Memuat...</span></div></td></tr>
                <tr v-for="(user, index) in users" :key="user.uuid" v-show="!isLoading">
                  <td>{{ (pagination.currentPage - 1) * pagination.perPage + index + 1 }}</td>
                  <td class="fw-medium">{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.role?.name || 'N/A' }}</td>
                  <td><span :class="['badge', user.is_active ? 'bg-success-light text-success' : 'bg-secondary-light text-secondary']">{{ user.is_active ? 'Aktif' : 'Tidak Aktif' }}</span></td>
                  <td>{{ formatDate(user.created_at) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button @click="openEditModal(user)" class="btn btn-icon btn-outline-primary" title="Edit User" :disabled="actionInProgress(user.uuid)"><i class="fas fa-pencil-alt"></i></button>
                      <!-- Call askConfirmDeleteUser -->
                      <button @click="askConfirmDeleteUser(user.uuid, user.name)" class="btn btn-icon btn-outline-danger" title="Hapus User (Trash)" :disabled="actionInProgress(user.uuid) || isCurrentUser(user.uuid)">
                        <span v-if="deletingId === user.uuid" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Trashed Users Table -->
        <div v-if="viewMode === 'trashed'" class="table-container shadow-sm mb-4">
           <div class="table-responsive">
             <table class="table table-hover align-middle modern-table">
               <thead>
                 <tr>
                   <th scope="col" style="width: 5%;">#</th>
                   <th scope="col">Nama</th>
                   <th scope="col">Email</th>
                   <th scope="col" style="width: 20%;">Dihapus Pada</th>
                   <th scope="col" class="text-center" style="width: 15%;">Aksi</th>
                 </tr>
               </thead>
               <tbody>
                 <tr v-if="isLoading && !trashedUsers.length"><td :colspan="5" class="text-center"><div class="d-flex justify-content-center align-items-center py-4"><div class="spinner-border text-primary"></div><span class="ms-3 text-muted">Memuat...</span></div></td></tr>
                 <tr v-for="(user, index) in trashedUsers" :key="user.uuid" v-show="!isLoading">
                   <td>{{ (trashedPagination.currentPage - 1) * trashedPagination.perPage + index + 1 }}</td>
                   <td class="fw-medium">{{ user.name }}</td>
                   <td>{{ user.email }}</td>
                   <td>{{ formatDate(user.deleted_at) }}</td>
                   <td>
                     <div class="action-buttons">
                       <button @click="restoreUser(user.uuid, user.name)" class="btn btn-icon btn-outline-success" title="Pulihkan User" :disabled="actionInProgress(user.uuid)"><span v-if="restoringId === user.uuid" class="spinner-border spinner-border-sm"></span><i v-else class="fas fa-undo-alt"></i></button>
                       <!-- Call askConfirmForceDeleteUser -->
                       <button @click="askConfirmForceDeleteUser(user.uuid, user.name)" class="btn btn-icon btn-outline-danger" title="Hapus Permanen" :disabled="actionInProgress(user.uuid) || isCurrentUser(user.uuid)">
                            <span v-if="forceDeletingId === user.uuid" class="spinner-border spinner-border-sm"></span>
                            <i v-else class="fas fa-times-circle"></i>
                       </button>
                     </div>
                   </td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>

        <!-- Pagination (Unchanged) -->
        <div v-if="!isLoading && currentTotalPages > 1" class="pagination-controls d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
            <div class="d-flex align-items-center gap-2">
                <label :for="'perPageSelectUser'+viewMode" class="form-label mb-0 text-muted small">Item/Hal:</label>
                <select :id="'perPageSelectUser'+viewMode" class="form-select form-select-sm" style="width: 75px;" v-model="filters.per_page" @change="applyFilters">
                    <option value="15">15</option> <option value="25">25</option> <option value="50">50</option> <option value="100">100</option>
                </select>
                <span class="text-muted small ms-2 d-none d-md-inline">Total {{ currentTotalItems }} user {{ viewMode === 'trashed' ? ' sampah' : ''}}</span>
            </div>
            <nav aria-label="Page navigation">
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item" :class="{ disabled: currentPagination.currentPage <= 1 }"><a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage - 1)">«</a></li>
                    <li v-for="page in simplePaginationRange" :key="viewMode+'_'+page" class="page-item" :class="{ active: page === currentPagination.currentPage, disabled: page === '...' }">
                        <a v-if="page !== '...'" class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a> <span v-else class="page-link">...</span>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPagination.currentPage >= currentTotalPages }"><a class="page-link" href="#" @click.prevent="changePage(currentPagination.currentPage + 1)">»</a></li>
                </ul>
            </nav>
        </div>

        <!-- Add/Edit User Modal -->
        <div v-if="showModal" class="modal-overlay" @click.self="closeAndResetModal">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content shadow-lg">
              <div class="modal-header">
                <h5 class="modal-title"><i :class="['fas', isEditing ? 'fa-user-edit' : 'fa-user-plus', 'me-2']"></i>{{ isEditing ? 'Edit User' : 'Tambah User Baru' }}</h5>
                <button type="button" class="btn-close" @click="closeAndResetModal"></button>
              </div>
              <div class="modal-body">
                <div v-if="modalError" class="alert alert-danger alert-dismissible fade show"><span v-html="modalError"></span><button type="button" class="btn-close btn-sm" @click="modalError = null"></button></div>
                <form @submit.prevent="saveUser" id="userForm" class="modern-form" novalidate>
                  <div class="row">
                    <div class="col-md-6 form-group mb-3">
                      <label for="userName" class="form-label">Nama Lengkap <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="userName" v-model.trim="currentUser.name" required placeholder="Nama" :disabled="isSaving"/>
                    </div>
                    <div class="col-md-6 form-group mb-3">
                      <label for="userEmail" class="form-label">Email <span class="text-danger">*</span></label>
                      <input type="email" class="form-control" id="userEmail" v-model.trim="currentUser.email" required placeholder="Email" :disabled="isSaving"/>
                    </div>
                  </div>
                  <div class="row align-items-center">
                     <div class="col-md-6 form-group mb-3">
                        <label for="userRole" class="form-label">Role <span class="text-danger">*</span></label>
                        <select id="userRole" class="form-select" v-model="currentUser.role_id" required :disabled="isSaving || isLoadingRoleOptions">
                            <option value="" disabled>Pilih Role...</option>
                            <option v-for="option in roleOptions" :key="option.id" :value="option.id">
                                {{ option.text }}
                            </option>
                        </select>
                        <div v-if="isLoadingRoleOptions" class="spinner-border spinner-border-sm text-secondary mt-1" role="status"><span class="visually-hidden">Loading roles...</span></div>
                     </div>
                     <div class="col-md-6 form-group mb-3">
                         <label class="form-label d-block">Status Akun</label>
                         <div class="form-check form-switch">
                              <input class="form-check-input" type="checkbox" role="switch" id="isActiveSwitch" v-model="currentUser.is_active" :disabled="isSaving || isCurrentUser(currentUser.uuid)">
                              <label class="form-check-label" for="isActiveSwitch">{{ currentUser.is_active ? 'Aktif' : 'Tidak Aktif' }}</label>
                          </div>
                          <small v-if="isCurrentUser(currentUser.uuid)" class="form-text text-warning d-block mt-1">Anda tidak dapat menonaktifkan akun sendiri.</small>
                     </div>
                  </div>
                  <!-- Password fields only for Create User -->
                  <div v-if="!isEditing" class="row">
                     <div class="col-md-6 form-group mb-3">
                         <label for="userPassword" class="form-label">Password <span class="text-danger">*</span></label>
                         <input type="password" class="form-control" id="userPassword" v-model="currentUser.password" required placeholder="Password Baru" :disabled="isSaving"/>
                     </div>
                     <div class="col-md-6 form-group mb-3">
                         <label for="userPasswordConfirm" class="form-label">Konfirmasi Password <span class="text-danger">*</span></label>
                         <input type="password" class="form-control" id="userPasswordConfirm" v-model="currentUser.password_confirmation" required placeholder="Ulangi Password" :disabled="isSaving"/>
                     </div>
                  </div>
                  <!-- Optional Password fields for Edit User -->
                  <div v-if="isEditing" class="row">
                      <div class="col-12">
                          <p class="text-muted small">Biarkan password kosong jika tidak ingin mengubahnya.</p>
                          <div class="row">
                             <div class="col-md-6 form-group mb-3">
                                 <label for="userPasswordEdit" class="form-label">Password Baru (Opsional)</label>
                                 <input type="password" class="form-control" id="userPasswordEdit" v-model="currentUser.password" placeholder="Password Baru" :disabled="isSaving"/>
                             </div>
                             <div class="col-md-6 form-group mb-3">
                                 <label for="userPasswordConfirmEdit" class="form-label">Konfirmasi Password Baru</label>
                                 <input type="password" class="form-control" id="userPasswordConfirmEdit" v-model="currentUser.password_confirmation" placeholder="Ulangi Password Baru" :disabled="isSaving || !currentUser.password"/>
                             </div>
                          </div>
                      </div>
                  </div>

                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" @click="closeAndResetModal" :disabled="isSaving">Batal</button>
                <!-- Simplified :disabled, detailed check in saveUser -->
                <button type="submit" form="userForm" class="btn btn-primary"
                        :disabled="isSaving || !currentUser.name || !currentUser.email || !currentUser.role_id">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan User') }}
                </button>
              </div>
            </div>
          </div>
        </div> <!-- End Add/Edit User Modal -->

        <!-- Confirmation Modal -->
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
                             <div>User akan dipindahkan ke tempat sampah. Anda bisa memulihkannya nanti.</div>
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

      </div> <!-- End .user-manager-container -->
    </div> <!-- End .container -->
  </div> <!-- End .dashboard-view -->
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';

// --- Axios Instance & Interceptors (Unchanged) ---
const apiClient = axios.create({ baseURL: `${process.env.VUE_APP_API_URL || 'http://localhost:8000/api'}`, headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }});
apiClient.interceptors.request.use(config => { try { const userDataString = localStorage.getItem('userData'); if (userDataString) { const userData = JSON.parse(userDataString); const token = userData?.token; if (token) { config.headers = config.headers || {}; config.headers['Authorization'] = `Bearer ${token}`; } } } catch (e) { console.error("Error reading localStorage:", e); } return config; }, error => Promise.reject(error));
apiClient.interceptors.response.use(response => response, error => { if (error.response && (error.response.status === 401 || error.response.status === 403) && error.config.method !== 'get') { console.error(`Authorization Error (${error.response.status}) on ${error.config.method} ${error.config.url}`); localStorage.removeItem('userData'); return Promise.reject(new Error(`Auth failed or forbidden: ${error.response.status}`)); } if (error.response && error.response.status === 409) { console.warn('Conflict Error (409):', error.response.data?.message); } if (error.response && error.response.status === 404) { console.warn('Not Found Error (404):', error.response.data?.message); } if (error.response && error.response.status === 422) { console.warn('Validation Error (422):', error.response.data); } return Promise.reject(error); });

// --- Utility Function (Unchanged) ---
const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => { if (error?.message?.includes('Auth failed or forbidden')) { return 'Sesi Anda mungkin telah berakhir atau Anda tidak memiliki izin. Silakan login kembali.'; } if (error?.response) { let apiMessage = error.response.data?.message; const status = error.response.status; if (status === 422 && error.response.data?.errors) { const errors = error.response.data.errors; apiMessage = Object.values(errors).flat().join('<br/> '); apiMessage = `Data tidak valid:<br/> ${apiMessage}`; } else if (status === 404) { apiMessage = apiMessage || 'Data tidak ditemukan.'; } else if (status === 403) { apiMessage = apiMessage || 'Anda tidak memiliki izin untuk melakukan aksi ini.'; } else if (status === 409) { apiMessage = apiMessage || 'Operasi gagal karena konflik data.'; } else if (status >= 500) { apiMessage = 'Terjadi masalah pada server.'; console.error('Server Error (500):', error.response.data); } return apiMessage || `Error ${status}: ${error.response.statusText || defaultMessage}`; } else if (error?.request) { return 'Tidak dapat terhubung ke server.'; } return error?.message || defaultMessage; };


// --- Component State ---
const viewMode = ref('active');
const users = ref([]);
const trashedUsers = ref([]);
const pagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedPagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedCount = ref(0);
const filters = reactive({ search: '', is_active: '', role_id: '', sort_by: 'created_at', sort_direction: 'desc', page: 1, per_page: 15 });
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
const currentUser = reactive({ uuid: null, name: '', email: '', role_id: '', is_active: true, password: '', password_confirmation: '' });
const roleOptions = ref([]); // Roles loaded once
const isLoadingRoleOptions = ref(false);
const loggedInUserId = ref(null);

// NEW: Confirmation Modal State
const confirmationState = reactive({
    show: false,
    message: '',
    itemName: '',
    type: 'delete', // 'delete' or 'forceDelete'
    onConfirm: () => {},
});

// --- Get Logged-in User ID ---
const fetchLoggedInUser = () => {
     try {
         const userDataString = localStorage.getItem('userData');
         if (userDataString) {
            const userData = JSON.parse(userDataString);
            // Prioritize UUID if available, fallback to ID
            loggedInUserId.value = userData?.user?.uuid || userData?.uuid || userData?.user?.id || userData?.id || null;
         } else { loggedInUserId.value = null; }
     } catch (e) { console.error("Error parsing user data from localStorage:", e); loggedInUserId.value = null; }
};

// --- Computed Properties (Unchanged) ---
const currentPagination = computed(() => viewMode.value === 'active' ? pagination.value : trashedPagination.value);
const currentTotalPages = computed(() => currentPagination.value.totalPages);
const currentTotalItems = computed(() => currentPagination.value.totalItems);
const trashedCountForDisplay = computed(() => trashedCount.value > 99 ? '99+' : trashedCount.value);
const hasActiveFilters = computed(() => filters.search || (viewMode.value === 'active' && (filters.is_active !== '' || filters.role_id !== '')));
const isCurrentUser = (userUuid) => loggedInUserId.value && userUuid === loggedInUserId.value;
const getSortIcon = (column) => { if (viewMode.value !== 'active' || filters.sort_by !== column) return 'fas fa-sort text-muted opacity-50'; return filters.sort_direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'; };
const simplePaginationRange = computed(() => { const current = currentPagination.value.currentPage; const last = currentTotalPages.value; if (!last || last <= 1) return last === 1 ? [1] : []; const delta = 1; const range = []; const rangeWithDots = []; let l; range.push(1); for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) { range.push(i); } if (last > 1) range.push(last); const uniqueRange = [...new Set(range)].sort((a, b) => a - b); uniqueRange.forEach((i) => { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l > 2) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; }); return rangeWithDots; });
const actionInProgress = (uuid) => deletingId.value === uuid || restoringId.value === uuid || forceDeletingId.value === uuid;


// --- API Functions ---
async function fetchUsers() {
    isLoading.value = true; error.value = null; filters.page = pagination.value.currentPage; filters.per_page = parseInt(filters.per_page, 10);
    const queryParams = { ...filters }; delete queryParams.page; delete queryParams.per_page;
    const activeFilters = Object.entries(queryParams).reduce((acc, [key, value]) => { if (value !== '' && value !== null) acc[key] = value; return acc; }, { page: filters.page, per_page: filters.per_page });
    try {
        const response = await apiClient.get('/users', { params: activeFilters });
        if (response.data && response.data.data) { users.value = response.data.data; pagination.value = { currentPage: response.data.meta?.current_page ?? 1, totalPages: response.data.meta?.last_page ?? 1, totalItems: response.data.meta?.total ?? 0, perPage: parseInt(response.data.meta?.per_page ?? filters.per_page, 10) }; await fetchTrashCount(); } else { users.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page }; }
    } catch (err) { error.value = getErrorMessage(err, 'Gagal memuat data user.'); users.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page }; } finally { isLoading.value = false; }
}
async function fetchTrashedUsers() {
    isLoading.value = true; error.value = null; const trashPage = trashedPagination.value.currentPage; const trashPerPage = parseInt(filters.per_page, 10);
    const params = { page: trashPage, per_page: trashPerPage, ...(filters.search && { search: filters.search }), };
    try {
        const response = await apiClient.get('/users/trash', { params });
         if (response.data && response.data.data) { trashedUsers.value = response.data.data; trashedPagination.value = { currentPage: response.data.meta?.current_page ?? 1, totalPages: response.data.meta?.last_page ?? 1, totalItems: response.data.meta?.total ?? 0, perPage: parseInt(response.data.meta?.per_page ?? trashPerPage, 10) }; trashedCount.value = response.data.meta?.total ?? 0; } else { trashedUsers.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage }; trashedCount.value = 0; }
    } catch (err) { error.value = getErrorMessage(err, 'Gagal memuat data user dari tempat sampah.'); trashedUsers.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage }; trashedCount.value = 0; } finally { isLoading.value = false; }
}
async function fetchTrashCount() { try { const response = await apiClient.get('/users/trash', { params: { per_page: 1 } }); trashedCount.value = response.data.meta?.total ?? 0; } catch (err) { console.error("Failed fetch trash count:", getErrorMessage(err)); } }

// Optimized: Fetch roles only once
async function fetchRoleOptions() {
    if (roleOptions.value.length > 0) return; // Don't refetch if already loaded
    isLoadingRoleOptions.value = true;
    try {
        const response = await apiClient.get('/role-options');
        roleOptions.value = response.data || [];
    } catch (err) {
        // Show error in main feedback area if roles fail to load initially
        error.value = getErrorMessage(err, "Gagal memuat opsi role. Fitur filter dan tambah/edit user mungkin terganggu.");
        roleOptions.value = [];
    } finally {
        isLoadingRoleOptions.value = false;
    }
}

async function saveUser() {
    // Basic client-side required field check
    if (!currentUser.name || !currentUser.email || !currentUser.role_id) {
         modalError.value = 'Nama, Email, dan Role wajib diisi.';
         return;
    }
    // Password validation
    if (!isEditing.value && (!currentUser.password || !currentUser.password_confirmation)) {
         modalError.value = 'Password dan Konfirmasi Password wajib diisi untuk user baru.';
         return;
    }
    if (currentUser.password && currentUser.password !== currentUser.password_confirmation) {
         modalError.value = 'Password dan Konfirmasi Password tidak cocok.';
         return;
    }

    isSaving.value = true; modalError.value = null; error.value = null;
    const payload = {
        name: currentUser.name,
        email: currentUser.email,
        role_id: currentUser.role_id,
        is_active: currentUser.is_active,
    };
    // Only include password fields if password is being set/changed
    if (currentUser.password) {
        payload.password = currentUser.password;
        payload.password_confirmation = currentUser.password_confirmation;
    }

    try {
        const url = isEditing.value ? `/users/${currentUser.uuid}` : '/users';
        const method = isEditing.value ? 'put' : 'post';
        const response = await apiClient({ method, url, data: payload });
        if ((response.status === 200 || response.status === 201) && response.data?.data) {
            setSuccessMessage(`User "${response.data.data.name}" berhasil ${isEditing.value ? 'diperbarui' : 'ditambahkan'}.`);
            closeAndResetModal();
            await fetchUsers(); // Refresh active list
        } else {
            // This case might not be reached if API returns proper error codes caught below
            throw new Error(response.data?.message || `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} user.`);
        }
    } catch (err) {
        // Use getErrorMessage which handles 422 validation errors etc.
        modalError.value = getErrorMessage(err, `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} user.`);
    } finally {
        isSaving.value = false;
    }
}

// deleteUser (called by confirmation action)
async function deleteUser(uuid, name) {
    // Redundant check as it's also done before showing modal, but good safety layer
    if (isCurrentUser(uuid)) { error.value = "Anda tidak dapat menghapus akun sendiri."; return; }
    if (actionInProgress(uuid)) return; // Prevent double clicks

    deletingId.value = uuid; error.value = null; successMessage.value = null;
    try {
        const response = await apiClient.delete(`/users/${uuid}`);
        // Soft delete usually returns 204 or 200
        if (response.status === 204 || response.status === 200) {
            setSuccessMessage(`User "${name}" berhasil dipindahkan ke tempat sampah.`);
            if (users.value.length === 1 && pagination.value.currentPage > 1) { pagination.value.currentPage--; }
            await fetchUsers(); // Refreshes active list & calls fetchTrashCount
        } else {
            // Should ideally be caught by interceptor or catch block based on status code
            throw new Error(response.data?.message || 'Gagal memindahkan user ke tempat sampah.');
        }
    } catch (err) {
        // Check if it's the specific Auth error from interceptor
        if (err.message?.includes('Auth failed or forbidden')) {
            error.value = getErrorMessage(err); // Use the formatted message from interceptor
        } else {
            // Otherwise, use generic getErrorMessage for other potential errors
            error.value = getErrorMessage(err, `Gagal memindahkan user "${name}" ke tempat sampah.`);
        }
    } finally { deletingId.value = null; }
}

async function restoreUser(uuid, name) {
    if (actionInProgress(uuid)) return;
    restoringId.value = uuid; error.value = null; successMessage.value = null;
    try {
        const response = await apiClient.post(`/users/restore/${uuid}`);
         if (response.status === 200 && response.data?.message) {
             setSuccessMessage(response.data.message || `User "${name}" berhasil dipulihkan.`);
             if (trashedUsers.value.length === 1 && trashedPagination.value.currentPage > 1) { trashedPagination.value.currentPage--; }
             await fetchTrashedUsers(); // Refresh trash list & count
         } else { throw new Error(response.data?.message || `Gagal memulihkan user "${name}".`); }
    } catch (err) { error.value = getErrorMessage(err, `Gagal memulihkan user "${name}".`); }
    finally { restoringId.value = null; }
}

// forceDeleteUser (called by confirmation action)
async function forceDeleteUser(uuid, name) {
    if (isCurrentUser(uuid)) { error.value = "Anda tidak dapat menghapus akun sendiri secara permanen."; return; }
     if (actionInProgress(uuid)) return;

    forceDeletingId.value = uuid; error.value = null; successMessage.value = null;
    // No need to find index - fetchTrashedUsers will refresh the list
    try {
        const response = await apiClient.delete(`/users/force-delete/${uuid}`);
        // Force delete usually returns 204
        if (response.status === 204 || response.status === 200) {
            setSuccessMessage(`User "${name}" berhasil dihapus permanen.`);
            // Check if page needs decrement *before* fetching
            const needsPageDecrement = trashedUsers.value.length === 1 && trashedPagination.value.currentPage > 1;
            if (needsPageDecrement) { trashedPagination.value.currentPage--; }
            await fetchTrashedUsers(); // Refresh trash list & count
        } else { throw new Error(response.data?.message || `Gagal menghapus user "${name}" permanen.`); }
    } catch (err) {
         if (err.message?.includes('Auth failed or forbidden')) {
              error.value = getErrorMessage(err);
         } else {
             error.value = getErrorMessage(err, `Gagal menghapus user "${name}" permanen.`);
         }
    } finally { forceDeletingId.value = null; }
}


// --- UI Functions ---
function applyFilters() { clearError(); if (viewMode.value === 'active') { pagination.value.currentPage = 1; fetchUsers(); } else { trashedPagination.value.currentPage = 1; fetchTrashedUsers(); } }
function clearSearch() { if(filters.search) { filters.search = ''; applyFilters(); } }
function clearAllFilters() { filters.search = ''; filters.is_active = ''; filters.role_id = ''; applyFilters(); }
function clearError() { error.value = null; modalError.value = null; /* Clear confirmation error implicitly */ }
function setSuccessMessage(message) { successMessage.value = message; setTimeout(() => { if(successMessage.value === message) successMessage.value = null; }, 4000); }
function changePage(page) { if (isLoading.value || page === '...') return; clearError(); if (viewMode.value === 'active') { if (page >= 1 && page <= pagination.value.totalPages && page !== pagination.value.currentPage) { pagination.value.currentPage = page; fetchUsers(); } } else { if (page >= 1 && page <= trashedPagination.value.totalPages && page !== trashedPagination.value.currentPage) { trashedPagination.value.currentPage = page; fetchTrashedUsers(); } } }
function changeSort(column) { if (viewMode.value !== 'active' || isLoading.value) return; clearError(); if (filters.sort_by === column) { filters.sort_direction = filters.sort_direction === 'asc' ? 'desc' : 'asc'; } else { filters.sort_by = column; filters.sort_direction = 'asc'; } applyFilters(); }

function resetCurrentUserForm() { Object.assign(currentUser, { uuid: null, name: '', email: '', role_id: '', is_active: true, password: '', password_confirmation: '' }); }
function openAddModal() { isEditing.value = false; modalError.value = null; resetCurrentUserForm(); /* Roles fetched on mount */ showModal.value = true; }
function openEditModal(user) { isEditing.value = true; modalError.value = null; Object.assign(currentUser, { uuid: user.uuid, name: user.name, email: user.email, role_id: user.role_id, is_active: user.is_active, password: '', password_confirmation: '' }); /* Roles fetched on mount */ showModal.value = true; }
function closeAndResetModal() { showModal.value = false; isEditing.value = false; modalError.value = null; resetCurrentUserForm(); }
function switchViewMode(mode) { if (mode === viewMode.value || isLoading.value) return; viewMode.value = mode; clearError(); successMessage.value = null; // Reset filters specific to active view when switching away
if (mode !== 'active') { filters.is_active = ''; filters.role_id = ''; } // Always reset search for clarity
filters.search = ''; applyFilters(); // Fetch data for new mode
}

// --- Confirmation Modal Functions ---
function askConfirmDeleteUser(uuid, name) {
    if (isCurrentUser(uuid)) { error.value = "Anda tidak dapat menghapus akun sendiri."; return; }
    confirmationState.message = `Yakin ingin memindahkan user ini ke tempat sampah?`;
    confirmationState.itemName = name;
    confirmationState.type = 'delete';
    confirmationState.onConfirm = () => deleteUser(uuid, name);
    confirmationState.show = true;
    clearError();
}

function askConfirmForceDeleteUser(uuid, name) {
    if (isCurrentUser(uuid)) { error.value = "Anda tidak dapat menghapus akun sendiri secara permanen."; return; }
    confirmationState.message = `Yakin ingin menghapus user ini secara <strong>permanen</strong>? Tindakan ini tidak dapat diurungkan.`;
    confirmationState.itemName = name;
    confirmationState.type = 'forceDelete';
    confirmationState.onConfirm = () => forceDeleteUser(uuid, name);
    confirmationState.show = true;
    clearError();
}

function cancelConfirmation() {
    confirmationState.show = false;
    confirmationState.onConfirm = () => {};
}

function confirmAction() {
    if (typeof confirmationState.onConfirm === 'function') {
        confirmationState.onConfirm();
    }
    cancelConfirmation();
}

// --- Utilities ---
const formatDate = (dateString) => { if (!dateString) return '-'; try { return new Date(dateString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', hour12: false }); } catch (e) { return dateString; } };

// --- Lifecycle Hook ---
onMounted(() => {
    fetchLoggedInUser(); // Get current user ID first
    fetchUsers();        // Fetch active users (which also fetches trash count)
    fetchRoleOptions();  // Fetch roles once for filters/modals
});

</script>
