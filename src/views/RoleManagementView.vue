<template>
  <div class="role-management">
    <h1>Role Management</h1>
    <p>Manage roles here.</p>

    <!-- Tombol Tambah Role -->
    <button @click="openAddModal" class="btn btn-primary mb-3">Add New Role</button>

    <!-- Indikator Loading -->
    <div v-if="isLoading" class="loading-indicator">Loading roles...</div>

    <!-- Pesan Error Utama -->
    <!-- Error dari fetch/delete/umum, bukan error modal -->
    <div v-if="error && !showModal" class="alert alert-danger">{{ error }}</div>

    <!-- Tabel Roles -->
    <table class="table table-striped table-bordered" v-if="!isLoading && roles.length > 0">
      <thead>
        <tr>
          <th>#</th>
          <th>Role Name</th>
          <th>Created At</th>
          <th>Updated At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(role, index) in roles" :key="role.uuid">
          <td>{{ index + 1 }}</td>
          <td>{{ role.name }}</td>
          <td>{{ formatDate(role.created_at) }}</td>
          <td>{{ formatDate(role.updated_at) }}</td>
          <td>
            <button @click="openEditModal(role)" class="btn btn-sm btn-warning me-2">Edit</button>
            <button @click="confirmDeleteRole(role.uuid)" class="btn btn-sm btn-danger">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
     <div v-if="!isLoading && roles.length === 0 && !error" class="alert alert-info">
        No roles found.
    </div>

    <!-- Modal untuk Tambah/Edit Role -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Edit Role' : 'Add New Role' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
             <!-- Pesan Error Modal -->
            <div v-if="modalError" class="alert alert-danger">{{ modalError }}</div>
            <form @submit.prevent="saveRole">
              <div class="mb-3">
                <label for="roleName" class="form-label">Role Name</label>
                <input
                  type="text"
                  class="form-control"
                  id="roleName"
                  v-model="currentRole.name"
                  required
                  :disabled="isSaving"
                  @keyup.enter="saveRole"
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="isSaving">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveRole" :disabled="isSaving">
              <span v-if="isSaving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ isSaving ? 'Saving...' : 'Save Role' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
// Jika Anda menggunakan Vue Router dan ingin redirect ke login page via router
// import router from '@/router'; // Sesuaikan path ke file router Anda

// --- Konfigurasi Axios ---
const apiClient = axios.create({
  baseURL: 'http://back-end.test/api', // Pastikan URL ini benar
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// --- Axios Request Interceptor ---
// Menambahkan token ke setiap request
apiClient.interceptors.request.use(
  (config) => {
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const token = userData?.token; // Ambil token

        if (token) {
          // Pastikan object headers ada sebelum menambahkan Authorization
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('Token not found in userData within localStorage.');
          // Anda mungkin ingin redirect ke login di sini juga jika token wajib ada
          // Contoh: window.location.href = '/login';
        }
      } else {
        console.warn('userData not found in localStorage.');
        // Anda mungkin ingin redirect ke login di sini
         // Contoh: window.location.href = '/login';
      }
    } catch (e) {
      console.error("Error reading or parsing user data from localStorage:", e);
      // Hapus data yang rusak jika perlu
      // localStorage.removeItem('userData');
      // Redirect ke login
      // Contoh: window.location.href = '/login';
    }
    return config; // Penting: Selalu return config
  },
  (error) => {
    // Lakukan sesuatu jika ada error saat setup request
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// --- Axios Response Interceptor ---
// Menangani error response, terutama 401/403
apiClient.interceptors.response.use(
  (response) => {
    // Jika response sukses (status 2xx), langsung teruskan
    return response;
  },
  (error) => {
    // Tangani error response
    if (error.response) {
      const { status } = error.response;

      // Jika status 401 (Unauthorized) atau 403 (Forbidden)
      if (status === 401 || status === 403) {
        console.error(`Authentication Error (${status}): Redirecting to login.`);
        // Hapus data user dari local storage karena token tidak valid/kadaluarsa
        localStorage.removeItem('userData');

        // Redirect ke halaman login
        // Opsi 1: Menggunakan Vue Router (jika diimpor) - lebih smooth
        // Pastikan router sudah diimpor di atas jika menggunakan opsi ini
        // router.push('/login'); // Ganti '/login' dengan path halaman login Anda

        // Opsi 2: Hard redirect (jika tidak menggunakan/mengimpor router di sini)
        alert('Your session has expired or you are unauthorized. Please log in again.'); // Beri tahu user
        window.location.href = '/login'; // Ganti '/login' dengan path halaman login Anda

        // Return promise reject agar tidak melanjutkan ke .catch di komponen
        // Kita sudah menanganinya di sini (dengan redirect)
        return Promise.reject(new Error(`Authentication failed with status ${status}. Redirected to login.`));
      }
    } else if (error.request) {
      // Request dibuat tapi tidak ada response (masalah jaringan, CORS, dll.)
      console.error('Network Error or No Response:', error.request);
    } else {
      // Error saat setup request
      console.error('Axios setup error:', error.message);
    }

    // Untuk error selain 401/403, teruskan error agar bisa ditangani di .catch komponen
    return Promise.reject(error);
  }
);
// ------------------------

export default {
  name: 'RoleManagementView',
  data() {
    return {
      roles: [],
      isLoading: false,
      error: null,
      showModal: false,
      isEditing: false,
      isSaving: false,
      modalError: null,
      currentRole: {
        uuid: null,
        name: ''
      },
    };
  },
  methods: {
    // --- Fungsi CRUD ---
    async fetchRoles() {
      this.isLoading = true;
      this.error = null; // Reset error utama
      try {
        // Interceptor akan otomatis menambahkan token di sini
        const response = await apiClient.get('/roles');
        if (response.data.success) {
          this.roles = response.data.data;
        } else {
           this.error = response.data.message || 'Failed to fetch roles.';
        }
      } catch (err) {
        // Error selain 401/403 akan masuk ke sini
        // Error 401/403 sudah ditangani interceptor (redirect)
        // Hanya tampilkan error jika bukan karena redirect
        if (err.message && !err.message.includes('Authentication failed')) {
             console.error("Error fetching roles:", err);
             this.error = this.getErrorMessage(err, 'An error occurred while fetching roles.');
             this.roles = [];
        }
      } finally {
        this.isLoading = false;
      }
    },

    async saveRole() {
        if (!this.currentRole.name.trim()) {
            this.modalError = "Role name cannot be empty.";
            return;
        }

        this.isSaving = true;
        this.modalError = null;
        try {
            let response;
            const payload = { name: this.currentRole.name };

            if (this.isEditing) {
                // Interceptor akan menambahkan token
                response = await apiClient.put(`/roles/${this.currentRole.uuid}`, payload);
            } else {
                // Interceptor akan menambahkan token
                response = await apiClient.post('/roles', payload);
            }

            if (response.data.success) {
                this.closeModal();
                await this.fetchRoles();
                // Notifikasi bisa diganti dengan library toast/notification
                alert(response.data.message || `Role ${this.isEditing ? 'updated' : 'created'} successfully!`);
            } else {
                // Error dari API (misal: validasi 422)
                this.modalError = response.data.message || `Failed to ${this.isEditing ? 'update' : 'create'} role.`;
                // Jika ada detail error validasi, coba tampilkan
                if (response.data.errors) {
                     const errors = response.data.errors;
                     const firstErrorKey = Object.keys(errors)[0];
                     if (firstErrorKey && Array.isArray(errors[firstErrorKey]) && errors[firstErrorKey].length > 0) {
                         this.modalError = errors[firstErrorKey][0];
                     }
                }
            }
        } catch (err) {
             // Error selain 401/403
             if (err.message && !err.message.includes('Authentication failed')) {
                 console.error(`Error ${this.isEditing ? 'updating' : 'creating'} role:`, err);
                 // Gunakan getErrorMessage untuk error validasi dll.
                 this.modalError = this.getErrorMessage(err, `An error occurred while ${this.isEditing ? 'saving' : 'creating'} the role.`);
             }
        } finally {
            this.isSaving = false;
        }
    },

    async deleteRole(uuid) {
      // Set loading state spesifik untuk delete jika perlu, atau gunakan isLoading utama
      this.isLoading = true;
      this.error = null; // Reset error utama
      try {
         // Interceptor akan menambahkan token
        const response = await apiClient.delete(`/roles/${uuid}`);
        if (response.data.success) {
           await this.fetchRoles(); // Refresh data
           alert(response.data.message || 'Role deleted successfully!');
        } else {
            // Error dari API saat delete
            this.error = response.data.message || 'Failed to delete role.';
        }
      } catch (err) {
         // Error selain 401/403
         if (err.message && !err.message.includes('Authentication failed')) {
            console.error("Error deleting role:", err);
            this.error = this.getErrorMessage(err, 'An error occurred while deleting the role.');
         }
      } finally {
         // Pastikan loading dimatikan walaupun delete gagal
         this.isLoading = false;
      }
    },

    // --- Fungsi Bantuan Modal ---
    openAddModal() {
      this.isEditing = false;
      this.currentRole = { uuid: null, name: '' };
      this.modalError = null;
      this.error = null; // Reset error utama saat buka modal
      this.showModal = true;
    },
    openEditModal(role) {
      this.isEditing = true;
      // Salin objek agar tidak mengubah data tabel langsung
      this.currentRole = { ...role };
      this.modalError = null;
      this.error = null; // Reset error utama saat buka modal
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.currentRole = { uuid: null, name: '' };
      this.modalError = null;
      this.isEditing = false;
      this.isSaving = false;
    },
    confirmDeleteRole(uuid) {
        // Pastikan user sadar tindakan ini
        if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            this.deleteRole(uuid);
        }
    },

    // --- Fungsi Utilitas ---
    formatDate(dateString) {
        if (!dateString) return '-';
        // **FIXED:** Menghapus deklarasi const options yang tidak terpakai
        try {
            // Format saat ini: Tanggal Pendek + Waktu Pendek
            return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'}) + ' ' +
                   new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return dateString; // Fallback ke string asli
        }
    },
    getErrorMessage(error, defaultMessage = 'An unexpected error occurred.') {
        // Fungsi ini masih relevan untuk error selain 401/403
        if (error.response) {
            let apiMessage = error.response.data?.message;
            // Tangani error validasi Laravel (422)
            if (error.response.status === 422 && error.response.data?.errors) {
                 const errors = error.response.data.errors;
                 const firstErrorKey = Object.keys(errors)[0];
                 if (firstErrorKey && Array.isArray(errors[firstErrorKey]) && errors[firstErrorKey].length > 0) {
                     apiMessage = errors[firstErrorKey][0]; // Ambil pesan error validasi pertama
                 } else {
                     apiMessage = apiMessage || 'Validation failed. Please check your input.';
                 }
            }
             // Jangan tampilkan pesan default jika sudah ditangani interceptor (401/403)
            if (error.response.status === 401 || error.response.status === 403) {
                // Pesan ini seharusnya tidak tampil karena interceptor sudah redirect
                return "Authentication failed or session expired.";
            }
            // Untuk error server lainnya (500, 404, dll.)
            return apiMessage || `Server Error ${error.response.status}: ${error.response.statusText || 'Please try again later.'}`;
        } else if (error.request) {
            // Error jaringan atau server tidak merespon
            return 'Could not connect to the server. Please check your network connection or API status.';
        } else {
             // Error lain saat setup request atau error yang tidak terduga
             // Jangan tampilkan pesan jika itu adalah error redirect dari interceptor
            if (error.message && error.message.includes('Authentication failed')) {
                return ''; // Jangan tampilkan apa-apa, redirect sedang terjadi
            }
            return error.message || defaultMessage;
        }
    }
  },
  mounted() {
    // Panggil fetchRoles saat komponen dimuat
    // Interceptor akan memastikan token disertakan jika ada
    this.fetchRoles();
  }
}
</script>

<style scoped>
    /* Styling CSS dari kode sebelumnya tetap sama */
    .role-management {
      padding: 20px;
      max-width: 900px; /* Batasi lebar agar lebih rapi */
      margin: 0 auto; /* Tengah kan konten */
    }

    .loading-indicator {
      text-align: center;
      padding: 20px;
      font-style: italic;
      color: #666;
    }

    .alert {
      margin-top: 15px;
      margin-bottom: 15px;
      padding: 10px 15px;
      border-radius: 4px;
    }
    .alert-danger {
      color: #a94442;
      background-color: #f2dede;
      border: 1px solid #ebccd1;
    }
    .alert-info {
      color: #31708f;
      background-color: #d9edf7;
      border: 1px solid #bce8f1;
    }

    .table {
      width: 100%;
      margin-bottom: 1rem;
      color: #212529;
      border-collapse: collapse;
    }
    .table th,
    .table td {
      padding: 0.75rem;
      vertical-align: top;
      border-top: 1px solid #dee2e6;
    }
    .table thead th {
      vertical-align: bottom;
      border-bottom: 2px solid #dee2e6;
      background-color: #f8f9fa;
    }
    .table-striped tbody tr:nth-of-type(odd) {
      background-color: rgba(0, 0, 0, 0.05);
    }
    .table-bordered {
        border: 1px solid #dee2e6;
    }
    .table-bordered th,
    .table-bordered td {
        border: 1px solid #dee2e6;
    }

    .btn {
      display: inline-block;
      font-weight: 400;
      line-height: 1.5;
      color: #212529;
      text-align: center;
      text-decoration: none;
      vertical-align: middle;
      cursor: pointer;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      background-color: transparent;
      border: 1px solid transparent;
      padding: 0.375rem 0.75rem;
      font-size: 1rem;
      border-radius: 0.25rem;
      transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    .btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }
    .btn-primary {
      color: #fff;
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
    .btn-primary:hover {
      color: #fff;
      background-color: #0b5ed7;
      border-color: #0a58ca;
    }
    .btn-warning {
        color: #000;
        background-color: #ffc107;
        border-color: #ffc107;
    }
    .btn-warning:hover {
        color: #000;
        background-color: #ffca2c;
        border-color: #ffc720;
    }
    .btn-danger {
        color: #fff;
        background-color: #dc3545;
        border-color: #dc3545;
    }
    .btn-danger:hover {
        color: #fff;
        background-color: #bb2d3b;
        border-color: #b02a37;
    }
    .btn-secondary {
        color: #fff;
        background-color: #6c757d;
        border-color: #6c757d;
    }
    .btn-secondary:hover {
        color: #fff;
        background-color: #5c636a;
        border-color: #565e64;
    }
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      border-radius: 0.2rem;
    }
    .me-2 { margin-right: 0.5rem !important; }
    .mb-3 { margin-bottom: 1rem !important; }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1050;
    }
    .modal-dialog {
      position: relative;
      margin: 0.5rem;
      pointer-events: none;
      max-width: 500px;
      width: calc(100% - 1rem);
    }
    .modal-content {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      pointer-events: auto;
      background-color: #fff;
      background-clip: padding-box;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 0.3rem;
      outline: 0;
    }
    .modal-header {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1rem;
      border-bottom: 1px solid #dee2e6;
      border-top-left-radius: calc(0.3rem - 1px);
      border-top-right-radius: calc(0.3rem - 1px);
    }
    .modal-title { margin-bottom: 0; line-height: 1.5; }
    .btn-close {
        box-sizing: content-box;
        width: 1em; height: 1em;
        padding: 0.25em 0.25em;
        color: #000;
        background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.414a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat;
        border: 0; border-radius: 0.25rem; opacity: .5; cursor: pointer;
    }
    .btn-close:hover { opacity: .75; }
    .modal-body { position: relative; flex: 1 1 auto; padding: 1rem; }
    .modal-footer {
      display: flex; flex-wrap: wrap; flex-shrink: 0;
      align-items: center; justify-content: flex-end;
      padding: 0.75rem; border-top: 1px solid #dee2e6;
      border-bottom-right-radius: calc(0.3rem - 1px);
      border-bottom-left-radius: calc(0.3rem - 1px);
    }
    .modal-footer > * { margin: 0.25rem; }

    .form-label { margin-bottom: 0.5rem; display: inline-block; }
    .form-control {
        display: block; width: 100%;
        padding: 0.375rem 0.75rem;
        font-size: 1rem; font-weight: 400; line-height: 1.5;
        color: #212529; background-color: #fff; background-clip: padding-box;
        border: 1px solid #ced4da; appearance: none;
        border-radius: 0.25rem;
        transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
    }
    .form-control:focus {
        color: #212529; background-color: #fff; border-color: #86b7fe;
        outline: 0; box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
    }
    .form-control:disabled, .form-control[readonly] { background-color: #e9ecef; opacity: 1; }

    .spinner-border {
        display: inline-block; width: 2rem; height: 2rem;
        vertical-align: -0.125em; border: 0.25em solid currentColor;
        border-right-color: transparent; border-radius: 50%;
        animation: .75s linear infinite spinner-border;
    }
    .spinner-border-sm { width: 1rem; height: 1rem; border-width: 0.2em; }
    @keyframes spinner-border { to { transform: rotate(360deg); } }
</style>