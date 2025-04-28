<template>
  <div class="user-management-page">
    <div class="container-fluid py-4">
      <!-- Header Halaman -->
      <div class="page-header mb-4">
        <h1 class="page-title">User Management</h1>
        <p class="page-description">Manage application users, roles, and basic details.</p>
      </div>

      <div class="card border-0 shadow-sm rounded-lg">
        <div class="card-body p-4">
          <!-- Aksi Utama (Tombol Tambah) -->
          <div class="mb-4 text-end">
            <button @click="openAddModal" class="btn btn-primary btn-lg" :disabled="isFetchingRoles">
               <i class="fas fa-user-plus me-2"></i> Add New User
            </button>
             <span v-if="isFetchingRoles" class="ms-2 text-muted small">Loading roles...</span>
          </div>

          <!-- Indikator Loading & Error Utama -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Loading user data...</p>
          </div>
          <div v-if="error && !isLoading && !showModal" class="alert alert-danger alert-dismissible fade show" role="alert">
             <i class="fas fa-exclamation-triangle me-2"></i> {{ error }}
             <button type="button" class="btn-close" @click="error = null" aria-label="Close"></button>
          </div>

          <!-- Tabel Users -->
          <div v-if="!isLoading && users.length > 0" class="table-wrapper">
            <table class="table user-table">
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, index) in users" :key="user.uuid">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="fw-medium">{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span :class="getRoleBadgeClass(user.role_id)" class="badge">
                      {{ getRoleName(user.role_id) }}
                    </span>
                  </td>
                  <td>{{ formatDate(user.created_at) }}</td>
                  <td>{{ formatDate(user.updated_at) }}</td>
                  <td class="text-center action-buttons">
                    <button
                        @click="openEditModal(user)"
                        class="btn btn-icon btn-ghost-warning"
                        title="Edit User"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top">
                       <i class="fas fa-user-edit fs-5"></i>
                    </button>
                    <button
                        @click="confirmDeleteUser(user)"
                        class="btn btn-icon btn-ghost-danger ms-2"
                        title="Delete User"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top">
                       <i class="fas fa-user-times fs-5"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pesan Jika Tidak Ada Data -->
          <div v-if="!isLoading && users.length === 0 && !error" class="empty-state">
             <i class="fas fa-users-slash fa-3x text-muted mb-3"></i>
             <h5 class="text-muted">No Users Found</h5>
             <p class="text-muted small">Get started by adding a new user using the button above.</p>
          </div>
        </div> <!-- End card-body -->
      </div> <!-- End card -->

      <!-- Modal untuk Tambah/Edit User -->
      <div v-if="showModal" class="modal-backdrop fade show">
        <div class="modal-dialog modal-dialog-centered modal-lg"> <!-- Modal lebih lebar -->
          <div class="modal-content border-0 shadow-lg rounded-lg">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title ms-2">{{ isEditing ? 'Edit User' : 'Add New User' }}</h5>
              <button type="button" class="btn-close me-1" @click="closeModal" :disabled="isSaving"></button>
            </div>
            <div class="modal-body px-4 pt-3 pb-4">
               <!-- Pesan Error Modal -->
              <div v-if="modalError" class="alert alert-danger d-flex align-items-center small py-2 mb-3" role="alert">
                  <i class="fas fa-times-circle me-2"></i>
                  <div>{{ modalError }}</div>
              </div>
              <form @submit.prevent="saveUser" novalidate>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="userName" class="form-label fw-medium">Full Name <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control form-control-lg"
                      :class="{ 'is-invalid': fieldErrors.name }"
                      id="userName"
                      v-model.trim="currentUser.name"
                      required
                      :disabled="isSaving"
                      placeholder="e.g., John Doe"
                      ref="userNameInput"
                    />
                     <div v-if="fieldErrors.name" class="invalid-feedback mt-1">{{ fieldErrors.name }}</div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="userEmail" class="form-label fw-medium">Email Address <span class="text-danger">*</span></label>
                    <input
                      type="email"
                      class="form-control form-control-lg"
                      :class="{ 'is-invalid': fieldErrors.email }"
                      id="userEmail"
                      v-model.trim="currentUser.email"
                      required
                      :disabled="isSaving"
                      placeholder="e.g., john.doe@example.com"
                    />
                    <div v-if="fieldErrors.email" class="invalid-feedback mt-1">{{ fieldErrors.email }}</div>
                  </div>
                </div>

                 <div class="row">
                   <div class="col-md-6 mb-3">
                     <label for="userRole" class="form-label fw-medium">Role <span class="text-danger">*</span></label>
                     <select
                       class="form-select form-select-lg"
                       :class="{ 'is-invalid': fieldErrors.role_id }"
                       id="userRole"
                       v-model="currentUser.role_id"
                       required
                       :disabled="isSaving || isFetchingRoles"
                     >
                       <option value="" disabled>-- Select Role --</option>
                       <option v-for="role in roles" :key="role.uuid" :value="role.uuid">
                         {{ role.name }}
                       </option>
                     </select>
                     <div v-if="isFetchingRoles" class="form-text">Loading roles...</div>
                     <div v-if="fieldErrors.role_id" class="invalid-feedback mt-1">{{ fieldErrors.role_id }}</div>
                   </div>
                 </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="userPassword" class="form-label fw-medium">
                      Password <span v-if="!isEditing" class="text-danger">*</span>
                      <span v-else class="text-muted small">(Leave blank to keep current)</span>
                    </label>
                    <input
                      type="password"
                      class="form-control form-control-lg"
                      :class="{ 'is-invalid': fieldErrors.password }"
                      id="userPassword"
                      v-model="currentUser.password"
                      :required="!isEditing"
                      :disabled="isSaving"
                      placeholder="Enter password (min 6 chars)"
                    />
                     <div v-if="fieldErrors.password" class="invalid-feedback mt-1">{{ fieldErrors.password }}</div>
                  </div>
                   <div class="col-md-6 mb-3">
                    <label for="userPasswordConfirm" class="form-label fw-medium">
                      Confirm Password <span v-if="!isEditing || currentUser.password" class="text-danger">*</span>
                      </label>
                    <input
                      type="password"
                      class="form-control form-control-lg"
                      :class="{ 'is-invalid': fieldErrors.passwordConfirmation }"
                      id="userPasswordConfirm"
                      v-model="passwordConfirmation"
                      :required="!isEditing || !!currentUser.password"
                      :disabled="isSaving"
                      placeholder="Confirm password"
                    />
                     <div v-if="fieldErrors.passwordConfirmation" class="invalid-feedback mt-1">{{ fieldErrors.passwordConfirmation }}</div>
                  </div>
                </div>
                <!-- Preferences Field (Optional Example - Textarea for JSON) -->
                <!--
                <div class="mb-3">
                    <label for="userPreferences" class="form-label fw-medium">Preferences (JSON)</label>
                    <textarea class="form-control" id="userPreferences" rows="3" v-model="preferencesString" :disabled="isSaving" placeholder='e.g., {"theme": "dark", "language": "id"}'></textarea>
                    <div v-if="fieldErrors.preferences" class="invalid-feedback mt-1 d-block">{{ fieldErrors.preferences }}</div>
                </div>
                 -->
              </form>
            </div>
            <div class="modal-footer border-0 pt-0 px-4 pb-4 justify-content-end">
              <button type="button" class="btn btn-outline-secondary me-2" @click="closeModal" :disabled="isSaving">Cancel</button>
              <button type="button" class="btn btn-primary px-4" @click="saveUser" :disabled="isSaving || isFetchingRoles || !isFormValid">
                <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ isSaving ? 'Processing...' : (isEditing ? 'Update User' : 'Create User') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div> <!-- End container-fluid -->
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { nextTick } from 'vue';

// --- Axios Configuration (Sama seperti sebelumnya) ---
const apiClient = axios.create({ baseURL: 'http://back-end.test/api', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } });
apiClient.interceptors.request.use((config) => { try { const d = localStorage.getItem('userData'); if (d) { const t = JSON.parse(d)?.token; if (t) { config.headers = config.headers || {}; config.headers['Authorization'] = `Bearer ${t}`; } } } catch (e) { console.error("LS Error:", e); } return config; }, (error) => Promise.reject(error));
apiClient.interceptors.response.use((response) => response, (error) => { if (error.response && (error.response.status === 401 || error.response.status === 403)) { localStorage.removeItem('userData'); console.error('Auth Error. Redirecting...'); alert('Session expired/unauthorized. Please login.'); setTimeout(() => { window.location.href = '/login'; }, 1000); return Promise.reject(new Error(`Auth failed (${error.response.status})`)); } return Promise.reject(error); });
// --- End Axios Configuration ---

export default {
  name: 'UserManagementView',
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      users: [],
      roles: [], // Untuk dropdown
      isLoading: false, // Loading tabel user
      isFetchingRoles: false, // Loading dropdown roles
      error: null,
      showModal: false,
      isEditing: false,
      isSaving: false,
      modalError: null, // Error umum modal
      fieldErrors: {}, // Error spesifik field
      currentUser: this.getEmptyUser(), // Data user di modal
      passwordConfirmation: '',
      // preferencesString: '', // Jika menggunakan textarea JSON
      tooltipInstances: [],
    };
  },
  computed: {
      // Validasi sederhana untuk mengaktifkan tombol save
      isFormValid() {
          const user = this.currentUser;
          if (!user.name || !user.email || !user.role_id) return false;
          if (!this.isEditing && (!user.password || user.password.length < 6)) return false; // Password wajib on create
          if ((!this.isEditing || user.password) && user.password !== this.passwordConfirmation) return false; // Konfirmasi wajib jika password diisi
          return true;
      }
  },
  methods: {
    getEmptyUser() {
      return {
        uuid: null,
        name: '',
        email: '',
        role_id: '', // Default kosong
        password: '',
        preferences: null // Atau {} jika lebih disukai
      };
    },
    async fetchUsers() {
      this.isLoading = true;
      this.error = null;
      this.destroyTooltips();
      try {
        const response = await apiClient.get('/users'); // Endpoint user
        if (response.data.success) {
          this.users = response.data.data;
          nextTick(() => { this.initializeTooltips(); });
        } else {
           this.toast.error(response.data.message || 'Failed to fetch users.');
           this.error = response.data.message || 'Failed to fetch users.';
        }
      } catch (err) {
        if (err.message && !err.message.includes('Authentication failed')) {
             const errorMessage = this.getErrorMessage(err, 'An error occurred while fetching users.');
             this.error = errorMessage; this.toast.error(errorMessage); this.users = [];
        }
      } finally {
        this.isLoading = false;
      }
    },
    async fetchRolesForDropdown() {
        this.isFetchingRoles = true;
        try {
            const response = await apiClient.get('/roles'); // Endpoint roles
            if (response.data.success) {
                this.roles = response.data.data;
            } else {
                this.toast.error(response.data.message || 'Failed to load roles for selection.');
            }
        } catch(err) {
             if (err.message && !err.message.includes('Authentication failed')) {
                const errorMessage = this.getErrorMessage(err, 'Failed to load roles.');
                this.toast.error(errorMessage);
             }
        } finally {
            this.isFetchingRoles = false;
        }
    },
    validateForm() {
        this.modalError = null;
        this.fieldErrors = {};
        let isValid = true;
        const user = this.currentUser;

        if (!user.name) { this.fieldErrors.name = 'Name is required.'; isValid = false; }
        if (!user.email) { this.fieldErrors.email = 'Email is required.'; isValid = false; }
        // Simple email format check (more robust check might be needed)
        else if (!/\S+@\S+\.\S+/.test(user.email)) { this.fieldErrors.email = 'Please enter a valid email address.'; isValid = false; }
        if (!user.role_id) { this.fieldErrors.role_id = 'Role is required.'; isValid = false; }

        const passwordRequired = !this.isEditing;
        const passwordEntered = !!user.password;

        if (passwordRequired && !passwordEntered) {
            this.fieldErrors.password = 'Password is required.'; isValid = false;
        }
        if (passwordEntered && user.password.length < 6) {
            this.fieldErrors.password = 'Password must be at least 6 characters.'; isValid = false;
        }
        if (passwordEntered && user.password !== this.passwordConfirmation) {
            this.fieldErrors.passwordConfirmation = 'Passwords do not match.'; isValid = false;
        }
        if (!passwordEntered && passwordRequired && !this.passwordConfirmation) {
             // Jika password wajib (create) tapi konfirmasi kosong (walau password mungkin sudah diisi lalu dihapus)
             this.fieldErrors.passwordConfirmation = 'Please confirm the password.'; isValid = false;
        }
         if (passwordEntered && !this.passwordConfirmation) {
             // Jika password diisi (create atau edit) tapi konfirmasi kosong
             this.fieldErrors.passwordConfirmation = 'Please confirm the password.'; isValid = false;
         }


        // Preferences validation (contoh jika menggunakan textarea JSON)
        // if (this.preferencesString) {
        //   try {
        //     JSON.parse(this.preferencesString);
        //   } catch (e) {
        //     this.fieldErrors.preferences = 'Preferences must be valid JSON or empty.'; isValid = false;
        //   }
        // }

        if (!isValid) {
            this.modalError = "Please fix the errors in the form.";
        }
        return isValid;
    },

    async saveUser() {
        if (!this.validateForm()) {
            this.toast.error("Please check the form for errors.");
            return;
        }

        this.isSaving = true;
        // Modal error sudah dihandle oleh validateForm

        // Construct payload
        const payload = {
            name: this.currentUser.name,
            email: this.currentUser.email,
            role_id: this.currentUser.role_id,
            // preferences: this.preferencesString ? JSON.parse(this.preferencesString) : null // Jika pakai textarea
            preferences: this.currentUser.preferences // Jika API menerima objek/null
        };

        // Hanya tambahkan password jika diisi (penting untuk update)
        if (this.currentUser.password) {
            payload.password = this.currentUser.password;
        }

        try {
            let response;
            const actionPast = this.isEditing ? 'updated' : 'created';

            if (this.isEditing) {
                response = await apiClient.put(`/users/${this.currentUser.uuid}`, payload);
            } else {
                response = await apiClient.post('/users', payload);
            }

            if (response.data.success) {
                this.closeModal();
                await this.fetchUsers();
                this.toast.success(response.data.message || `User ${actionPast} successfully!`);
            } else {
                // Tangani error API (termasuk validasi backend)
                const message = this.extractApiErrorMessage(response.data, true); // true for field errors
                this.modalError = message.general;
                this.fieldErrors = message.fields;
                this.toast.error(`Failed to ${actionPast} user: ${message.general || 'Check fields'}`, { timeout: 7000 });
            }
        } catch (err) {
             if (err.message && !err.message.includes('Authentication failed')) {
                 const errorMessage = this.getErrorMessage(err, `An error occurred while ${this.isEditing ? 'saving' : 'creating'} the user.`);
                 this.modalError = errorMessage;
                 this.toast.error(errorMessage, { timeout: 7000 });
             }
        } finally {
            this.isSaving = false;
        }
    },
    confirmDeleteUser(user) {
         if (confirm(`Are you sure you want to delete the user "${user.name}" (${user.email})? This action cannot be undone.`)) {
            this.deleteUser(user.uuid, user.name);
        }
    },
    async deleteUser(uuid, userName) {
      const toastId = this.toast.info(`Deleting user "${userName}"...`, { timeout: false, closeButton: false, icon: "fas fa-spinner fa-spin" });
      this.error = null;
      try {
        const response = await apiClient.delete(`/users/${uuid}`);
        if (response.data.success) {
           await this.fetchUsers();
           this.toast.update(toastId, { content: response.data.message || `User "${userName}" deleted successfully!`, type: 'success', timeout: 5000, closeButton: true, icon: true });
        } else {
            const message = response.data.message || 'Failed to delete user.';
            this.error = message;
            this.toast.update(toastId, { content: `Failed to delete user "${userName}": ${message}`, type: 'error', timeout: 7000, closeButton: true, icon: true });
        }
      } catch (err) {
         if (err.message && !err.message.includes('Authentication failed')) {
            const errorMessage = this.getErrorMessage(err, 'An error occurred while deleting the user.');
            this.error = errorMessage;
             this.toast.update(toastId, { content: `Error deleting user "${userName}": ${errorMessage}`, type: 'error', timeout: 7000, closeButton: true, icon: true });
         } else { this.toast.dismiss(toastId); }
      } finally { /* No loading needed */ }
    },
    openAddModal() {
      this.isEditing = false;
      this.currentUser = this.getEmptyUser();
      this.passwordConfirmation = '';
      // this.preferencesString = '';
      this.modalError = null;
      this.fieldErrors = {};
      this.error = null; // Reset error utama juga
      this.showModal = true;
      nextTick(() => { this.$refs.userNameInput?.focus(); });
    },
    openEditModal(user) {
      this.isEditing = true;
      // Salin data user, tapi kosongkan password
      this.currentUser = { ...user, password: '' };
      this.passwordConfirmation = '';
      // Handle preferences string jika pakai textarea
      // this.preferencesString = user.preferences ? JSON.stringify(user.preferences, null, 2) : '';
      this.modalError = null;
      this.fieldErrors = {};
      this.error = null; // Reset error utama juga
      this.showModal = true;
      nextTick(() => { this.$refs.userNameInput?.focus(); });
    },
    closeModal() {
        this.showModal = false;
    },
    formatDate(dateString) {
        if (!dateString) return '-';
        try { const d = new Date(dateString); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'}) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }); } catch (e) { return dateString; }
    },
    // Modifikasi untuk bisa mengembalikan error per field
    extractApiErrorMessage(responseData, returnFieldErrors = false) {
        let generalMessage = 'An unknown error occurred.';
        let fields = {};

        if (responseData?.errors) {
            const errors = responseData.errors;
            fields = { ...errors }; // Salin semua field error
            // Ambil pesan pertama sebagai pesan general jika ada
            const firstErrorKey = Object.keys(errors)[0];
            if (firstErrorKey && Array.isArray(errors[firstErrorKey]) && errors[firstErrorKey].length > 0) {
                 generalMessage = errors[firstErrorKey][0];
            } else if (responseData.message) {
                 generalMessage = responseData.message; // Fallback ke message utama jika errors kosong
            } else {
                 generalMessage = "Validation failed. Please check the fields.";
            }
        } else if (responseData?.message) {
            generalMessage = responseData.message;
        }

        // Ubah format field errors jika perlu (misal: ambil hanya pesan pertama per field)
        for (const key in fields) {
            if (Array.isArray(fields[key]) && fields[key].length > 0) {
                fields[key] = fields[key][0];
            } else {
                 delete fields[key]; // Hapus jika bukan array atau kosong
            }
        }


        if (returnFieldErrors) {
            return { general: generalMessage, fields: fields };
        } else {
            return generalMessage;
        }
    },
    getErrorMessage(error, defaultMessage = 'An unexpected error occurred.') {
        if (error && error.message && error.message.includes('Authentication failed')) return '';
        if (error && error.response) { if (error.response.status === 401 || error.response.status === 403) return "Authentication Error."; return this.extractApiErrorMessage(error.response.data) || `Server Error ${error.response.status}`; } // Pakai extract tanpa field errors
        else if (error && error.request) return 'Network error. Could not connect to the server.';
        else return (error && error.message) || defaultMessage;
    },
    // Helper untuk menampilkan nama Role di tabel
    getRoleName(roleId) {
        if (this.isFetchingRoles) return 'Loading...';
        const role = this.roles.find(r => r.uuid === roleId);
        return role ? role.name : 'Unknown Role';
    },
    // Helper untuk styling badge role (opsional)
    getRoleBadgeClass(roleId) {
        const roleName = this.getRoleName(roleId).toLowerCase();
        if (roleName === 'administrator') return 'bg-danger text-white';
        if (roleName === 'editor') return 'bg-warning text-dark';
        if (roleName === 'viewer') return 'bg-info text-dark';
        return 'bg-secondary text-white'; // Default
    },

    // --- Tooltip Methods (Sama seperti sebelumnya) ---
    initializeTooltips() {
      if (typeof window.bootstrap !== 'undefined' && typeof window.bootstrap.Tooltip === 'function') {
        this.destroyTooltips();
        const tooltipTriggerList = [...document.querySelectorAll('[data-bs-toggle="tooltip"]')];
        this.tooltipInstances = tooltipTriggerList.map(el => new window.bootstrap.Tooltip(el));
      } else { if (document.querySelectorAll('[data-bs-toggle="tooltip"]').length > 0) { console.warn('Bootstrap Tooltip JS not found.'); }}
    },
    destroyTooltips() {
      this.tooltipInstances.forEach(t => { if (t && typeof t.dispose === 'function') { t.dispose(); }});
      this.tooltipInstances = [];
    }
  },
  mounted() {
    this.fetchRolesForDropdown(); // Ambil roles dulu
    this.fetchUsers(); // Ambil users
  },
  beforeUnmount() {
    this.destroyTooltips();
  }
}
</script>

<style scoped>
    /* Salin semua gaya dari RoleManagementView.vue yang sudah diperbaiki */
    /* ... (copy paste semua style dari <style scoped> RoleManagementView sebelumnya) ... */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    .user-management-page { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f4f7fc; min-height: 100vh; }
    .container-fluid { max-width: 1400px; } /* Sedikit lebih lebar untuk user */
    .page-header .page-title { font-weight: 700; color: #2d3748; margin-bottom: 0.25rem; }
    .page-header .page-description { color: #718096; font-size: 0.95rem; }
    .card { border-radius: 0.75rem; margin-bottom: 2rem; border: none; box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1); }
    .card-body { padding: 1.5rem; }
    .btn-primary { background-color: #4a55ff; border-color: #4a55ff; font-weight: 600; padding: 0.75rem 1.5rem; border-radius: 0.5rem; transition: all 0.2s ease-in-out; }
    .btn-primary:hover { background-color: #3c45cc; border-color: #3c45cc; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(74, 85, 255, 0.3); }
    .btn-lg i { font-size: 0.9em; }
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; min-height: 200px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; text-align: center; min-height: 200px; background-color: #f8f9fa; border-radius: 0.5rem; }
    .table-wrapper { overflow-x: auto; }
    .user-table { border-collapse: separate; border-spacing: 0; width: 100%; } /* Ganti nama class tabel */
    .user-table thead th { background-color: #f8f9fa; border-bottom: 2px solid #e2e8f0; color: #4a5568; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 1rem 1.25rem; vertical-align: middle; white-space: nowrap;} /* Tambah nowrap */
    .user-table thead th:first-child { border-top-left-radius: 0.5rem; }
    .user-table thead th:last-child { border-top-right-radius: 0.5rem; }
    .user-table tbody tr { border-bottom: 1px solid #e2e8f0; transition: background-color 0.15s ease-in-out; }
    .user-table tbody tr:last-child { border-bottom: none; }
    .user-table tbody tr:hover { background-color: #f7fafc; }
    .user-table tbody td { padding: 1rem 1.25rem; vertical-align: middle; color: #4a5568; font-size: 0.9rem; }
    .user-table tbody td .fw-medium { color: #2d3748; font-weight: 500; }
    .action-buttons .btn-icon { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background-color: transparent; border: none; transition: background-color 0.2s ease, color 0.2s ease; padding: 0; }
    .action-buttons .btn-icon i.fas { font-size: 1rem; line-height: 1; }
    .action-buttons .btn-ghost-warning { color: #f59e0b; }
    .action-buttons .btn-ghost-warning:hover { background-color: #fffbeb; color: #d97706; }
    .action-buttons .btn-ghost-danger { color: #ef4444; }
    .action-buttons .btn-ghost-danger:hover { background-color: #fee2e2; color: #dc2626; }
    .modal-content { border-radius: 0.75rem; border: none; box-shadow: 0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1); }
    .modal-header { padding: 1.5rem 1.5rem 0.5rem; border-bottom: none;}
    .modal-title { font-weight: 600; color: #2d3748; }
    .modal-body { padding: 1rem 1.5rem 1.5rem; }
    .modal-footer { padding: 1rem 1.5rem 1.5rem; background-color: #f8f9fa; border-top: none; border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem; }
    .form-control-lg, .form-select-lg { padding: 0.8rem 1rem; font-size: 1rem; border-radius: 0.5rem; border-color: #e2e8f0; } /* Terapkan ke select juga */
    .form-control-lg:focus, .form-select-lg:focus { border-color: #a3bffa; box-shadow: 0 0 0 0.25rem rgba(74, 85, 255, 0.2); }
    .form-label { font-size: 0.9rem; margin-bottom: 0.5rem; color: #4a5568; }
    .modal-footer .btn { border-radius: 0.5rem; padding: 0.6rem 1.2rem; font-weight: 500; }
    .modal-footer .btn-outline-secondary { border-color: #e2e8f0; color: #4a5568; }
    .modal-footer .btn-outline-secondary:hover { background-color: #e2e8f0; }
    .modal-footer .btn-primary { min-width: 120px; } /* Sedikit lebih lebar untuk user */
    .alert { border-radius: 0.5rem; }
    .tooltip-inner { background-color: #2d3748; color: white; border-radius: 0.375rem; padding: 0.4rem 0.8rem; font-size: 0.8rem; }
    .tooltip.bs-tooltip-top .tooltip-arrow::before { border-top-color: #2d3748; }
    .tooltip.bs-tooltip-bottom .tooltip-arrow::before { border-bottom-color: #2d3748; }

    /* Tambahan untuk User Management */
    .user-table .badge {
        font-size: 0.75rem;
        padding: 0.35em 0.65em;
        font-weight: 600;
    }
    .modal-lg { max-width: 800px; } /* Lebar modal lebih besar */
    .invalid-feedback { font-size: 0.8rem;}
</style>