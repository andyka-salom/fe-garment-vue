<template>
  <div class="role-manager-container">
    <header class="page-header">
      <h1 class="page-title">Manajemen Role</h1>
      <button @click="openAddModal" class="btn btn-primary btn-lg">
        <i class="fas fa-plus me-2"></i> Tambah Role Baru
      </button>
    </header>

    <!-- Feedback Section -->
    <div class="feedback-section">
      <div v-if="isLoading" class="alert alert-info d-flex align-items-center shadow-sm" role="alert">
        <div class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></div>
        <span>Memuat data role, mohon tunggu...</span>
      </div>
      <div v-if="error && !showModal" class="alert alert-danger shadow-sm" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i> {{ error }}
      </div>
      <div v-if="!isLoading && roles.length === 0 && !error" class="alert alert-secondary text-center shadow-sm" role="alert">
        <i class="fas fa-shield-alt me-2"></i> Belum ada data role. Silakan tambahkan role baru.
      </div>
    </div>

    <!-- Tabel Roles -->
    <div v-if="!isLoading && roles.length > 0" class="table-container shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle modern-table">
          <thead>
            <tr>
              <th scope="col" style="width: 5%;">#</th>
              <th scope="col">Nama Role</th>
              <th scope="col">Dibuat Pada</th>
              <th scope="col">Diperbarui Pada</th>
              <th scope="col" class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(role, index) in roles" :key="role.uuid">
              <td>{{ index + 1 }}</td>
              <td class="fw-medium">{{ role.name }}</td>
              <td>{{ formatDate(role.created_at) }}</td>
              <td>{{ formatDate(role.updated_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="openEditModal(role)" class="btn btn-icon btn-outline-primary" title="Edit Role">
                    <i class="fas fa-pencil-alt"></i>
                  </button>
                  <button @click="confirmDeleteRole(role.uuid, role.name)" class="btn btn-icon btn-outline-danger" title="Hapus Role">
                      <i class="fas fa-trash-alt"></i>
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

    <!-- Modal Form Tambah/Edit Role -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title">
              <i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2']"></i>
              {{ isEditing ? 'Edit Role' : 'Tambah Role Baru' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="modalError" class="alert alert-danger alert-dismissible fade show" role="alert">
               {{ modalError }}
               <button type="button" class="btn-close btn-sm" @click="modalError = null" aria-label="Close"></button>
            </div>
            <form @submit.prevent="saveRole" id="roleForm" class="modern-form">
              <div class="form-group">
                <label for="roleName" class="form-label">Nama Role</label>
                <input
                  type="text"
                  class="form-control"
                  id="roleName"
                  v-model.trim="currentRole.name"
                  required
                  placeholder="Masukkan nama role (e.g., Administrator)"
                  :disabled="isSaving"
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="isSaving">Batal</button>
            <button type="submit" form="roleForm" class="btn btn-primary" :disabled="isSaving">
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Role') }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
// --- PASTE KODE <script setup> LENGKAP DARI JAWABAN SEBELUMNYA UNTUK ROLE DI SINI ---
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

// --- Konfigurasi Axios Instance ---
const apiClient = axios.create({
  baseURL: 'http://back-end.test/api', // --- SESUAIKAN BASE URL API ANDA ---
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
});

// --- Axios Interceptors (Sama seperti Product Manager) ---
apiClient.interceptors.request.use(config => {
  try {
    const userDataString = localStorage.getItem('userData'); // --- GANTI KEY JIKA PERLU ---
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      const token = userData?.token;
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      } else { console.warn('Token not found in userData'); /* handle redirect? */ }
    } else { console.warn('userData not found'); /* handle redirect? */ }
  } catch (e) { console.error("Error reading localStorage:", e); /* handle redirect? */ }
  return config;
}, error => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
});

apiClient.interceptors.response.use(response => response, error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error(`Authentication Error (${error.response.status})`);
        localStorage.removeItem('userData'); // --- GANTI KEY JIKA PERLU ---
        alert('Sesi tidak valid. Silakan login kembali.');
        window.location.href = '/login'; // --- SESUAIKAN PATH LOGIN ---
        // atau: router.push('/login');
        return Promise.reject(new Error(`Auth failed: ${error.response.status}`));
    }
    return Promise.reject(error);
});

// --- State ---
const roles = ref([]);
const isLoading = ref(false);
const error = ref(null); // Error utama halaman
const showModal = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const modalError = ref(null); // Error spesifik di dalam modal
const currentRole = reactive({ // Gunakan reactive untuk objek
  uuid: null,
  name: ''
});

// --- Fungsi CRUD ---
const fetchRoles = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await apiClient.get('/roles'); // Endpoint roles
     // Sesuaikan dengan struktur response API Anda
    if (response.data && response.data.success) { // Asumsi response.data.success
      roles.value = response.data.data;
    } else {
      // Jika API mengembalikan status sukses tapi data kosong atau format salah
       throw new Error(response.data.message || 'Failed to fetch roles or data format is incorrect.');
    }
  } catch (err) {
     if (err.message && !err.message.includes('Auth failed')) { // Jangan tampilkan error jika sudah redirect
        console.error("Error fetching roles:", err);
        error.value = getErrorMessage(err, 'An error occurred while fetching roles.');
        roles.value = []; // Kosongkan data jika error
     }
  } finally {
    isLoading.value = false;
  }
};

const saveRole = async () => {
    if (!currentRole.name.trim()) {
        modalError.value = "Nama role tidak boleh kosong.";
        return;
    }

    isSaving.value = true;
    modalError.value = null;
    try {
        let response;
        const payload = { name: currentRole.name };
        const url = isEditing.value ? `/roles/${currentRole.uuid}` : '/roles';
        const method = isEditing.value ? 'put' : 'post';

        response = await apiClient({ method, url, data: payload });

        // Sesuaikan pengecekan sukses dengan response API Anda
        if (response.data && response.data.success) {
            closeModal();
            await fetchRoles(); // Tunggu fetch selesai
            // Tampilkan notifikasi sukses (opsional)
            // Contoh: alert(response.data.message || `Role ${isEditing.value ? 'updated' : 'created'} successfully!`);
        } else {
            // Error logis dari API
             throw new Error(response.data.message || `Failed to ${isEditing.value ? 'update' : 'create'} role.`);
        }
    } catch (err) {
         if (err.message && !err.message.includes('Auth failed')) {
            console.error(`Error ${isEditing.value ? 'updating' : 'creating'} role:`, err);
            modalError.value = getErrorMessage(err, `An error occurred while ${isEditing.value ? 'saving' : 'creating'} the role.`);
         }
    } finally {
        isSaving.value = false;
    }
};

const deleteRole = async (uuid) => {
  // Bisa tambahkan state loading/disabled spesifik untuk tombol delete
  error.value = null; // Reset error utama
  try {
    const response = await apiClient.delete(`/roles/${uuid}`);
     // Sesuaikan pengecekan sukses dengan response API Anda
    if (response.data && response.data.success) {
       await fetchRoles(); // Tunggu refresh data
       // Notifikasi sukses (opsional)
       // Contoh: alert(response.data.message || 'Role deleted successfully!');
    } else {
        // Error logis dari API saat delete
         throw new Error(response.data.message || 'Failed to delete role.');
    }
  } catch (err) {
     if (err.message && !err.message.includes('Auth failed')) {
        console.error("Error deleting role:", err);
        error.value = getErrorMessage(err, 'An error occurred while deleting the role.');
        setTimeout(() => { error.value = null; }, 7000); // Hapus error setelah beberapa saat
     }
  } finally {
     // Matikan state loading/disabled delete jika ada
  }
};

// --- Fungsi Bantuan Modal ---
const openAddModal = () => {
  isEditing.value = false;
  // Reset reactive object
  Object.assign(currentRole, { uuid: null, name: '' });
  modalError.value = null;
  error.value = null;
  showModal.value = true;
};

const openEditModal = (role) => {
  isEditing.value = true;
  // Salin properti ke reactive object
  Object.assign(currentRole, { uuid: role.uuid, name: role.name });
  modalError.value = null;
  error.value = null;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  // Opsional: Reset currentRole ke state awal jika cancel edit
  // if (isEditing.value) { Object.assign(currentRole, { uuid: null, name: '' }); }
  // isEditing.value = false;
  // isSaving.value = false;
  // modalError.value = null;
};

const confirmDeleteRole = (uuid, name) => { // Terima nama role
    if (confirm(`Apakah Anda yakin ingin menghapus role "${name}"? Tindakan ini tidak dapat dibatalkan.`)) { // Gunakan nama di prompt
        deleteRole(uuid);
    }
};

// --- Fungsi Utilitas ---
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleString('id-ID', { // Format Indonesia
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString;
    }
};

const getErrorMessage = (error, defaultMessage = 'An unexpected error occurred.') => {
    if (error.response) {
        let apiMessage = error.response.data?.message;
        if (error.response.status === 422 && error.response.data?.errors) {
             const errors = error.response.data.errors;
             const firstErrorKey = Object.keys(errors)[0];
             if (firstErrorKey && Array.isArray(errors[firstErrorKey]) && errors[firstErrorKey].length > 0) {
                 apiMessage = errors[firstErrorKey][0];
             } else {
                 apiMessage = apiMessage || 'Validation failed.';
             }
        }
        // Jangan tampilkan jika sudah di-handle interceptor
        if (error.response.status === 401 || error.response.status === 403) return '';
        return apiMessage || `Error ${error.response.status}: ${error.response.statusText || defaultMessage}`;
    } else if (error.request) {
        return 'Could not connect to server. Check network or API status.';
    } else {
         if (error.message && error.message.includes('Auth failed')) return ''; // Sudah redirect
        return error.message || defaultMessage;
    }
};

// --- Lifecycle Hook ---
onMounted(() => {
  fetchRoles();
});
// --- END SCRIPT ---
</script>

<style scoped>
/* --- PASTE SELURUH BLOK STYLE DARI ProductManagerView.vue DI SINI --- */
/* --- Ganti .product-manager-container menjadi .role-manager-container --- */
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
.role-manager-container { /* <-- NAMA CLASS DIUBAH */
    font-family: var(--font-family-sans-serif); color: var(--text-color); background-color: #F9FAFB;
    padding: 2rem; max-width: 1280px; margin: 2rem auto; border-radius: var(--border-radius-lg);
}
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
.spinner-border { display: inline-block; width: 2rem; height: 2rem; vertical-align: -0.125em; border: 0.25em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: .75s linear infinite spinner-border; }
.spinner-border-sm { width: 1rem; height: 1rem; border-width: 0.2em; }
@keyframes spinner-border { to { transform: rotate(360deg); } }
.visually-hidden { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
.text-center { text-align: center !important; } .text-muted { color: var(--text-muted) !important; } .fst-italic { font-style: italic !important; } .fw-medium { font-weight: 500 !important; } .d-block { display: block !important; }
.mt-1 { margin-top: 0.25rem !important; } .mt-2 { margin-top: 0.5rem !important; } .mt-3 { margin-top: 1rem !important; } .mt-4 { margin-top: 1.5rem !important; }
.mb-3 { margin-bottom: 1rem !important; }
.table-container { background-color: white; border-radius: var(--border-radius-lg); border: 1px solid var(--border-color); overflow: hidden; }
.table-responsive { overflow-x: auto; }
.modern-table { border-collapse: separate; border-spacing: 0; width: 100%; margin-bottom: 0; }
.modern-table thead { background-color: var(--light-gray); }
.modern-table th { padding: 0.875rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--secondary-color); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid var(--border-color); white-space: nowrap; }
.modern-table tbody tr { transition: background-color 0.15s ease; }
.modern-table tbody tr:hover { background-color: #F9FAFB; }
.modern-table td { padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; font-size: 0.875rem; color: var(--text-color); }
.modern-table tbody tr:last-child td { border-bottom: none; }
.action-buttons { display: flex; justify-content: center; align-items: center; gap: 0.5rem; }
.btn-icon { padding: 0.4rem; line-height: 1; border-radius: var(--border-radius); width: 32px; height: 32px; display: inline-flex; justify-content: center; align-items: center; }
.btn-icon i { font-size: 0.9rem; }
.btn-outline-primary { color: var(--primary-color); border-color: var(--primary-color); } .btn-outline-primary:hover { background-color: #EEF2FF; color: var(--primary-hover); border-color: var(--primary-hover); }
.btn-outline-danger { color: var(--danger-color); border-color: var(--danger-color); } .btn-outline-danger:hover { background-color: #FEF2F2; color: var(--danger-hover); border-color: var(--danger-hover); }
.btn-outline-secondary { color: var(--secondary-color); border-color: var(--secondary-color); } .btn-outline-secondary:hover { background-color: var(--light-gray); color: var(--dark-gray); border-color: var(--dark-gray); }
.modal-overlay { position: fixed; inset: 0; background-color: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1050; padding: 1rem; overflow-y: auto; }
.modal-dialog { background-color: white; border-radius: var(--border-radius-lg); margin: auto; max-height: 90vh; display: flex; flex-direction: column; width: 100%; box-shadow: none; border: none; pointer-events: all; max-width: 500px; /* Ukuran default modal role */}
.modal-content { border: none; border-radius: inherit; box-shadow: var(--shadow-lg); overflow: hidden; flex: 1; display: flex; flex-direction: column; max-height: 100%; }
.modal-header { background-color: var(--light-gray); padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.modal-title { font-size: 1.125rem; font-weight: 600; color: var(--dark-gray); } .modal-title i { color: var(--primary-color); }
.btn-close { background: none; border: none; font-size: 1.5rem; opacity: 0.7; transition: opacity 0.2s ease; cursor: pointer; padding: 0.5rem; margin: -0.5rem; } .btn-close:hover { opacity: 1; }
.modal-body { padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
.modal-footer { background-color: var(--light-gray); padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }
.modern-form .form-group { margin-bottom: 1.25rem; }
.modern-form .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--dark-gray); margin-bottom: 0.5rem; }
.modern-form .form-control { display: block; width: 100%; padding: 0.625rem 0.875rem; font-size: 0.875rem; font-weight: 400; line-height: 1.5; color: var(--text-color); background-color: #fff; background-clip: padding-box; border: 1px solid var(--medium-gray); appearance: none; border-radius: var(--border-radius); transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out; }
.modern-form .form-control::placeholder { color: var(--medium-gray); opacity: 1; }
.modern-form .form-control:focus { border-color: var(--primary-color); outline: 0; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2); }
@media (max-width: 768px) {
  .role-manager-container { padding: 1rem; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .modern-table th, .modern-table td { padding: 0.75rem; white-space: normal; }
  .action-buttons { justify-content: flex-start; }
  .modal-overlay { padding: 0.5rem; }
  .modal-dialog { max-width: calc(100% - 1rem); margin: 0.5rem; max-height: calc(100% - 1rem); }
  .modal-body { padding: 1rem; }
  .modal-footer { padding: 0.75rem 1rem; }
}
</style>