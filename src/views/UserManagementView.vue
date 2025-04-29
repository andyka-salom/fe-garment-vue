<template>
  <div class="dashboard-view">
    <div class="container">
  <div class="user-manager-container">
    <header class="page-header">
      <h1 class="page-title">Manajemen Pengguna</h1>
      <button @click="openAddModal" class="btn btn-primary btn-lg" :disabled="isFetchingRoles">
        <i class="fas fa-user-plus me-2"></i> Tambah Pengguna Baru
         <!-- Spinner jika roles sedang loading -->
        <span v-if="isFetchingRoles" class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
      </button>
    </header>

    <div class="feedback-section">
        <div v-if="isLoading" class="alert alert-info d-flex align-items-center shadow-sm" role="alert">
            <div class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></div>
            <span>Memuat data pengguna, mohon tunggu...</span>
        </div>
        <div v-if="error && !showModal" class="alert alert-danger shadow-sm" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i> {{ error }}
        </div>
        <div v-if="!isLoading && users.length === 0 && !error" class="alert alert-secondary text-center shadow-sm" role="alert">
            <i class="fas fa-users-slash me-2"></i> Belum ada data pengguna. Silakan tambahkan pengguna baru.
        </div>
    </div>

    <div v-if="!isLoading && users.length > 0" class="table-container shadow-sm">
      <div class="table-responsive">
        <!-- Terapkan class modern-table, table-hover, align-middle -->
        <table class="table table-hover align-middle modern-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Nama</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Dibuat Pada</th>
              <th scope="col">Diperbarui Pada</th>
              <th scope="col" class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in users" :key="user.uuid">
              <td class="text-center">{{ index + 1 }}</td>
              <td class="fw-medium">{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span :class="['badge', getRoleBadgeClass(user.role_id)]">
                  {{ getRoleName(user.role_id) }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>{{ formatDate(user.updated_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button
                      @click="openEditModal(user)"
                      class="btn btn-icon btn-outline-primary"
                      title="Edit User"
                      data-bs-toggle="tooltip" data-bs-placement="top">
                     <i class="fas fa-pencil-alt"></i>
                  </button>
                  <button
                      @click="confirmDeleteUser(user)"
                      class="btn btn-icon btn-outline-danger"
                      title="Delete User"
                      data-bs-toggle="tooltip" data-bs-placement="top">
                     <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content shadow-lg">
            <div class="modal-header">
              <h5 class="modal-title">
                <i :class="['fas', isEditing ? 'fa-user-edit' : 'fa-user-plus', 'me-2']"></i>
                {{ isEditing ? 'Edit Pengguna' : 'Tambah Pengguna Baru' }}
              </h5>
              <button type="button" class="btn-close" @click="closeModal" :disabled="isSaving"></button>
            </div>
            <div class="modal-body">
               <div v-if="modalError" class="alert alert-danger alert-dismissible fade show small py-2 mb-3" role="alert">
                    <i class="fas fa-times-circle me-2"></i>
                    <span>{{ modalError }}</span>
                    <button type="button" class="btn-close btn-sm ms-auto p-1" @click="modalError = null" aria-label="Close"></button>
              </div>

              <form @submit.prevent="saveUser" id="userForm" class="modern-form" novalidate>
                 <div class="row g-3 mb-3">
                   <div class="col-md-6">
                     <div class="form-group mb-0">
                       <label for="userName" class="form-label">Nama Lengkap</label>
                       <input
                         type="text"
                         class="form-control"
                         id="userName"
                         ref="userNameInput"
                         v-model.trim="currentUser.name"
                         required
                         placeholder="Masukkan nama lengkap"
                         :disabled="isSaving"
                         :class="{ 'is-invalid': fieldErrors.name }"
                         aria-describedby="nameError"
                       />
                       <div v-if="fieldErrors.name" id="nameError" class="invalid-feedback">
                         {{ fieldErrors.name }}
                       </div>
                     </div>
                   </div>
                   <div class="col-md-6">
                     <div class="form-group mb-0">
                       <label for="userEmail" class="form-label">Alamat Email</label>
                       <input
                         type="email"
                         class="form-control"
                         id="userEmail"
                         v-model.trim="currentUser.email"
                         required
                         placeholder="contoh@email.com"
                         :disabled="isSaving"
                         :class="{ 'is-invalid': fieldErrors.email }"
                         aria-describedby="emailError"
                       />
                       <div v-if="fieldErrors.email" id="emailError" class="invalid-feedback">
                         {{ fieldErrors.email }}
                       </div>
                     </div>
                   </div>
                 </div>

                 <div class="row g-3 mb-3">
                   <div class="col-md-6">
                     <div class="form-group mb-0">
                       <label for="userRole" class="form-label">Role Pengguna</label>
                       <select
                         class="form-select"
                         id="userRole"
                         v-model="currentUser.role_id"
                         required
                         :disabled="isSaving || isFetchingRoles"
                         :class="{ 'is-invalid': fieldErrors.role_id }"
                         aria-describedby="roleError"
                       >
                         <option value="" disabled>-- Pilih Role --</option>
                         <option v-if="isFetchingRoles" value="" disabled>Memuat role...</option>
                         <option v-for="role in roles" :key="role.uuid" :value="role.uuid">
                           {{ role.name }}
                         </option>
                       </select>
                       <div v-if="fieldErrors.role_id" id="roleError" class="invalid-feedback">
                         {{ fieldErrors.role_id }}
                       </div>
                     </div>
                   </div>
                   <div class="col-md-6">
                   </div>
                 </div>

                 <div class="row g-3">
                   <div class="col-md-6">
                     <div class="form-group mb-0">
                       <label for="userPassword" class="form-label">
                           Password {{ isEditing ? '(Kosongkan jika tidak ingin diubah)' : '' }}
                       </label>
                       <input
                         type="password"
                         class="form-control"
                         id="userPassword"
                         v-model="currentUser.password"
                         :required="!isEditing"
                         placeholder="Minimal 6 karakter"
                         minlength="6"
                         :disabled="isSaving"
                         :class="{ 'is-invalid': fieldErrors.password }"
                         aria-describedby="passwordError"
                       />
                       <div v-if="fieldErrors.password" id="passwordError" class="invalid-feedback">
                         {{ fieldErrors.password }}
                       </div>
                     </div>
                   </div>
                   <div class="col-md-6">
                     <div class="form-group mb-0">
                       <label for="passwordConfirmation" class="form-label">Konfirmasi Password</label>
                       <input
                         type="password"
                         class="form-control"
                         id="passwordConfirmation"
                         v-model="passwordConfirmation"
                         :required="!isEditing || !!currentUser.password"
                         placeholder="Ulangi password"
                         :disabled="isSaving"
                         :class="{ 'is-invalid': fieldErrors.passwordConfirmation }"
                         aria-describedby="confirmPasswordError"
                       />
                       <div v-if="fieldErrors.passwordConfirmation" id="confirmPasswordError" class="invalid-feedback">
                         {{ fieldErrors.passwordConfirmation }}
                       </div>
                     </div>
                   </div>
                 </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="isSaving">Batal</button>
              <button type="submit" form="userForm" class="btn btn-primary px-4" :disabled="isSaving || isFetchingRoles || !isFormValid">
                <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ isSaving ? 'Memproses...' : (isEditing ? 'Update Pengguna' : 'Buat Pengguna') }}
              </button>
            </div>
          </div>
        </div>
    </div>

  </div>    </div>

  </div>
</template>

<script>
// --- PASTE KODE SCRIPT LENGKAP UNTUK UserManagementView DI SINI ---
// --- Pastikan semua state, methods, computed, dll. sudah benar ---
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { nextTick } from 'vue';

// --- Konfigurasi Axios Instance (Sama seperti sebelumnya) ---
const apiClient = axios.create({
    baseURL:  `${process.env.VUE_APP_API_URL}`, // --- SESUAIKAN BASE URL API ANDA ---
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

// --- Axios Interceptors (Sama seperti sebelumnya) ---
apiClient.interceptors.request.use((config) => {
    try {
        const userDataString = localStorage.getItem('userData'); // --- GANTI KEY JIKA PERLU ---
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            const token = userData?.token;
            if (token) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
    } catch (e) {
        console.error("LocalStorage Error:", e);
    }
    return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use((response) => response, (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('userData'); // --- GANTI KEY JIKA PERLU ---
        console.error('Auth Error. Redirecting...');
        alert('Sesi Anda telah berakhir atau tidak sah. Silakan login kembali.');
        setTimeout(() => { window.location.href = '/login'; }, 1000); // --- SESUAIKAN PATH LOGIN ---
        // Mengembalikan Promise reject dengan error khusus agar tidak diproses lebih lanjut
        return Promise.reject(new Error(`Auth failed (${error.response.status})`));
    }
    // Penting: Kembalikan promise reject untuk error lainnya agar bisa ditangkap di catch
    return Promise.reject(error);
});


export default {
  name: 'UserManagementView',
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      users: [],
      roles: [],
      isLoading: false,
      isFetchingRoles: false, // State untuk loading roles di dropdown
      error: null, // Error utama halaman
      showModal: false,
      isEditing: false,
      isSaving: false, // Loading state untuk simpan/update
      modalError: null, // Error spesifik di dalam modal
      fieldErrors: {}, // Menyimpan error per field dari validasi backend
      currentUser: this.getEmptyUser(),
      passwordConfirmation: '',
      tooltipInstances: [], // Untuk manajemen instance tooltip Bootstrap
    };
  },
  computed: {
    // Validasi Sederhana di Frontend (bisa diperluas)
    isFormValid() {
        const user = this.currentUser;
        // Cek field wajib dasar
        if (!user.name || !user.email || !user.role_id) return false;
        // Cek password saat tambah baru
        if (!this.isEditing && (!user.password || user.password.length < 6)) return false;
        // Cek password jika diisi saat edit
        if (this.isEditing && user.password && user.password.length < 6) return false;
        // Cek konfirmasi password jika password diisi (baik tambah maupun edit)
        if (user.password && user.password !== this.passwordConfirmation) return false;
        // Jika tambah baru, konfirmasi wajib diisi jika password diisi
        if (!this.isEditing && user.password && !this.passwordConfirmation) return false;
        // Jika edit dan password diisi, konfirmasi wajib diisi
        if (this.isEditing && user.password && !this.passwordConfirmation) return false;

        // Jika semua lolos
        return true;
    }
  },
  methods: {
    getEmptyUser() {
      // Mengembalikan struktur user kosong
      return {
        uuid: null,
        name: '',
        email: '',
        role_id: '', // Default ke string kosong agar placeholder select "-- Pilih Role --" terpilih
        password: '',
        preferences: null // Sesuaikan jika ada field lain
      };
    },
    async fetchUsers() {
      this.isLoading = true;
      this.error = null;
      this.destroyTooltips(); // Hapus tooltip lama sebelum render ulang
      try {
        const response = await apiClient.get('/users');
        if (response.data.success) {
          this.users = response.data.data;
          // Inisialisasi tooltip setelah DOM diperbarui
          nextTick(() => {
            this.initializeTooltips();
          });
        } else {
          // Tampilkan pesan error dari API jika ada
          this.toast.error(response.data.message || 'Gagal memuat data pengguna.');
          this.error = response.data.message || 'Gagal memuat data pengguna.';
        }
      } catch (err) {
        // Hanya tampilkan error jika bukan karena redirect auth
        if (err.message && !err.message.includes('Auth failed')) {
          const errorMessage = this.getErrorMessage(err, 'Terjadi kesalahan saat memuat pengguna.');
          this.error = errorMessage;
          this.toast.error(errorMessage);
          this.users = []; // Kosongkan data jika error
        }
      } finally {
        this.isLoading = false;
      }
    },
    async fetchRolesForDropdown() {
      this.isFetchingRoles = true;
      try {
        const response = await apiClient.get('/roles'); // Endpoint untuk mengambil roles
        if (response.data.success) {
          this.roles = response.data.data;
        } else {
          this.toast.error(response.data.message || 'Gagal memuat data role untuk pilihan.');
          // Mungkin set error state lain untuk dropdown jika diperlukan
        }
      } catch(err) {
         if (err.message && !err.message.includes('Auth failed')) {
             const errorMessage = this.getErrorMessage(err, 'Gagal memuat data role.');
             this.toast.error(errorMessage);
             // Handle error loading roles (e.g., show message in dropdown)
         }
      } finally {
        this.isFetchingRoles = false;
      }
    },
    // Validasi form lebih detail sebelum submit
    validateForm() {
        this.modalError = null; // Reset general error
        this.fieldErrors = {}; // Reset field errors
        let isValid = true;
        const user = this.currentUser;

        if (!user.name) {
            this.fieldErrors.name = 'Nama lengkap wajib diisi.';
            isValid = false;
        }
        if (!user.email) {
            this.fieldErrors.email = 'Alamat email wajib diisi.';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(user.email)) { // Simple email format check
             this.fieldErrors.email = 'Format alamat email tidak valid.';
             isValid = false;
        }
        if (!user.role_id) {
            this.fieldErrors.role_id = 'Role pengguna wajib dipilih.';
            isValid = false;
        }

        // Validasi Password (hanya jika diperlukan atau diisi)
        const passwordRequired = !this.isEditing; // Wajib saat tambah
        const passwordEntered = !!user.password; // Apakah password diisi

        if (passwordRequired && !passwordEntered) {
             this.fieldErrors.password = 'Password wajib diisi.';
             isValid = false;
        }
        if (passwordEntered && user.password.length < 6) {
             this.fieldErrors.password = 'Password minimal harus 6 karakter.';
             isValid = false;
        }

        // Validasi Konfirmasi Password (hanya jika password diisi)
        if (passwordEntered && user.password !== this.passwordConfirmation) {
             this.fieldErrors.passwordConfirmation = 'Konfirmasi password tidak cocok.';
             isValid = false;
        }
        // Jika password wajib (add mode) dan belum diisi, konfirmasi juga error (meski mungkin redundant)
        if (passwordRequired && !passwordEntered && !this.passwordConfirmation) {
             this.fieldErrors.passwordConfirmation = 'Konfirmasi password wajib diisi.';
             isValid = false;
        }
        // Jika password diisi (add/edit) tapi konfirmasi kosong
        if (passwordEntered && !this.passwordConfirmation) {
             this.fieldErrors.passwordConfirmation = 'Konfirmasi password wajib diisi.';
             isValid = false;
        }


        if (!isValid) {
             this.modalError = "Harap perbaiki kesalahan pada formulir.";
        }

        return isValid;
    },
    async saveUser() {
        // Jalankan validasi frontend dulu
        if (!this.validateForm()) {
             this.toast.error("Silakan periksa kembali isian formulir.");
             return; // Hentikan jika validasi frontend gagal
        }

        this.isSaving = true;
        // this.modalError = null; // Direset di validateForm
        // this.fieldErrors = {}; // Direset di validateForm

        // Siapkan payload, hanya sertakan password jika diisi
        const payload = {
            name: this.currentUser.name,
            email: this.currentUser.email,
            role_id: this.currentUser.role_id,
            preferences: this.currentUser.preferences // Sertakan field lain jika ada
        };
        if (this.currentUser.password) {
            payload.password = this.currentUser.password;
            // API mungkin butuh password_confirmation juga, sesuaikan jika perlu
            // payload.password_confirmation = this.passwordConfirmation;
        }

      try {
        let response;
        const action = this.isEditing ? 'mengupdate' : 'membuat';
        const actionPast = this.isEditing ? 'diupdate' : 'dibuat';

        if (this.isEditing) {
          response = await apiClient.put(`/users/${this.currentUser.uuid}`, payload);
        } else {
          response = await apiClient.post('/users', payload);
        }

        if (response.data.success) {
          this.closeModal();
          await this.fetchUsers(); // Refresh data tabel
          this.toast.success(response.data.message || `Pengguna berhasil ${actionPast}!`);
        } else {
          // Tangani error logis dari API (termasuk validasi backend)
          const message = this.extractApiErrorMessage(response.data, true); // true untuk dapat fieldErrors
          this.modalError = message.general;
          this.fieldErrors = message.fields;
          this.toast.error(`Gagal ${action} pengguna: ${message.general || 'Periksa kembali isian'}`, { timeout: 7000 });
        }
      } catch (err) {
         // Tangani error network atau server (selain auth yang sudah ditangani interceptor)
         if (err.message && !err.message.includes('Auth failed')) {
             const errorMessage = this.getErrorMessage(err, `Terjadi kesalahan saat ${this.isEditing ? 'menyimpan' : 'membuat'} pengguna.`);
             this.modalError = errorMessage;
             this.toast.error(errorMessage, { timeout: 7000 });
         }
         // Reset field errors jika error bukan dari validasi API spesifik
         if (!err.response || err.response.status !== 422) {
             this.fieldErrors = {};
         }
      } finally {
        this.isSaving = false;
      }
    },
    confirmDeleteUser(user) {
      // Gunakan dialog konfirmasi browser standar
      if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.name}" (${user.email})? Tindakan ini tidak dapat dibatalkan.`)) {
        this.deleteUser(user.uuid, user.name); // Kirim uuid dan nama untuk notifikasi
      }
    },
    async deleteUser(uuid, userName) {
      // Tampilkan toast loading
      const toastId = this.toast.info(`Menghapus pengguna "${userName}"...`, {
          timeout: false, // Tidak otomatis hilang
          closeButton: false,
          icon: "fas fa-spinner fa-spin" // Icon loading
      });
      this.error = null; // Reset error utama

      try {
        const response = await apiClient.delete(`/users/${uuid}`);
        if (response.data.success) {
          await this.fetchUsers(); // Refresh tabel
          // Update toast menjadi sukses
          this.toast.update(toastId, {
              content: response.data.message || `Pengguna "${userName}" berhasil dihapus!`,
              type: 'success',
              timeout: 5000, // Hilang setelah 5 detik
              closeButton: true,
              icon: true // Tampilkan ikon default success
          });
        } else {
          // Gagal dari sisi API (misal: user tidak ditemukan, ada relasi, dll)
          const message = response.data.message || 'Gagal menghapus pengguna.';
          this.error = message; // Tampilkan di error utama juga jika perlu
          // Update toast menjadi error
          this.toast.update(toastId, {
              content: `Gagal menghapus pengguna "${userName}": ${message}`,
              type: 'error',
              timeout: 7000, // Lebih lama untuk error
              closeButton: true,
              icon: true
          });
        }
      } catch (err) {
        // Error network/server (selain auth)
        if (err.message && !err.message.includes('Auth failed')) {
          const errorMessage = this.getErrorMessage(err, 'Terjadi kesalahan saat menghapus pengguna.');
          this.error = errorMessage;
          // Update toast menjadi error
          this.toast.update(toastId, {
              content: `Error menghapus pengguna "${userName}": ${errorMessage}`,
              type: 'error',
              timeout: 7000,
              closeButton: true,
              icon: true
          });
        } else {
            // Jika error auth, toast mungkin sudah dihapus atau tidak relevan
            this.toast.dismiss(toastId); // Hapus saja toast loadingnya
        }
      }
    },
    openAddModal() {
      this.isEditing = false;
      this.currentUser = this.getEmptyUser();
      this.passwordConfirmation = ''; // Reset konfirmasi password
      this.modalError = null;
      this.fieldErrors = {};
      this.error = null; // Reset error utama halaman
      this.showModal = true;
      // Fokus ke input nama setelah modal siap
      nextTick(() => {
        this.$refs.userNameInput?.focus();
      });
    },
    openEditModal(user) {
      this.isEditing = true;
      // Salin data user ke currentUser, kosongkan password
      this.currentUser = { ...user, password: '' };
      this.passwordConfirmation = ''; // Reset konfirmasi password
      this.modalError = null;
      this.fieldErrors = {};
      this.error = null; // Reset error utama halaman
      this.showModal = true;
      // Fokus ke input nama setelah modal siap
      nextTick(() => {
        this.$refs.userNameInput?.focus();
      });
    },
    closeModal() {
      this.showModal = false;
      // Tidak perlu reset currentUser di sini karena bisa dibuka lagi
    },
    formatDate(dateString) {
      // Fungsi format tanggal (sama seperti di Role)
      if (!dateString) return '-';
      try {
        // Opsi format 'id-ID' untuk Bahasa Indonesia
        const optionsDate = { year: 'numeric', month: 'short', day: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', optionsDate) + ', ' + date.toLocaleTimeString('id-ID', optionsTime);
        // Atau format standar:
        // return new Date(dateString).toLocaleString();
      } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; // Kembalikan string asli jika error
      }
    },
    // Helper untuk ekstrak pesan error API (termasuk validasi 422)
    extractApiErrorMessage(responseData, returnFieldErrors = false) {
        let generalMessage = 'Terjadi kesalahan yang tidak diketahui.';
        let fields = {};

        if (responseData && responseData.errors) { // Laravel validation errors
            const errors = responseData.errors;
            fields = { ...errors }; // Salin semua field error
            // Ambil pesan dari error field pertama sebagai pesan umum
            const firstErrorKey = Object.keys(errors)[0];
            if (firstErrorKey && Array.isArray(errors[firstErrorKey]) && errors[firstErrorKey].length > 0) {
                generalMessage = errors[firstErrorKey][0];
            } else if (responseData.message) {
                 generalMessage = responseData.message; // Fallback ke message utama jika ada
            } else {
                 generalMessage = "Validasi gagal. Silakan periksa kembali isian.";
            }
        } else if (responseData && responseData.message) { // Pesan error umum dari API
            generalMessage = responseData.message;
        }

        // Bersihkan field errors agar hanya string (ambil error pertama jika array)
        for (const key in fields) {
            if (Array.isArray(fields[key]) && fields[key].length > 0) {
                fields[key] = fields[key][0];
            } else if (typeof fields[key] !== 'string') {
                 delete fields[key]; // Hapus jika bukan string (misal: objek atau array kosong)
            }
        }

        if (returnFieldErrors) {
            return { general: generalMessage, fields: fields };
        } else {
            return generalMessage;
        }
    },
    // Helper untuk mendapatkan pesan error yang lebih user-friendly
    getErrorMessage(error, defaultMessage = 'Terjadi kesalahan tak terduga.') {
        // Jangan tampilkan pesan jika error karena Auth (sudah dihandle interceptor)
        if (error && error.message && error.message.includes('Auth failed')) {
            return ''; // Kembalikan string kosong agar tidak tampil
        }
        if (error && error.response) {
            // Error dari response server (4xx, 5xx selain 401/403)
            if (error.response.status === 401 || error.response.status === 403) {
                return "Kesalahan Autentikasi."; // Seharusnya sudah ditangani interceptor
            }
            // Coba ekstrak pesan dari body response
            return this.extractApiErrorMessage(error.response.data) || `Terjadi Kesalahan Server (${error.response.status})`;
        } else if (error && error.request) {
            // Request dibuat tapi tidak ada response (masalah jaringan)
            return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else {
            // Error lain (setup request error, error JS, dll)
            return (error && error.message) || defaultMessage;
        }
    },
    getRoleName(roleId) {
      if (this.isFetchingRoles) return 'Memuat...'; // Tampilkan loading jika roles belum siap
      const role = this.roles.find(r => r.uuid === roleId);
      return role ? role.name : 'Role Tidak Diketahui';
    },
    getRoleBadgeClass(roleId) {
      // Fungsi untuk menentukan kelas badge berdasarkan nama role (case-insensitive)
      const roleName = this.getRoleName(roleId).toLowerCase();
      // --- PERUBAHAN DI SINI ---
      if (roleName.includes('admin')) return 'bg-warning text-dark'; // Administrator -> Kuning (warning)
      if (roleName.includes('editor') || roleName.includes('moderator')) return 'bg-info text-dark'; // Editor/Moderator -> Biru (info)
      if (roleName.includes('viewer') || roleName.includes('user') || roleName.includes('pengguna')) return 'bg-success text-white'; // Viewer/User -> Hijau (success)
      // Default badge
      return 'bg-secondary text-white';
    },
    // Inisialisasi Tooltip Bootstrap 5
    initializeTooltips() {
      // Pastikan Bootstrap sudah dimuat
      if (typeof window.bootstrap !== 'undefined' && typeof window.bootstrap.Tooltip === 'function') {
        this.destroyTooltips(); // Hapus instance lama dulu
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        this.tooltipInstances = tooltipTriggerList.map(tooltipTriggerEl => {
          return new window.bootstrap.Tooltip(tooltipTriggerEl);
        });
      } else {
         // Beri peringatan jika elemen ada tapi JS Bootstrap tidak ditemukan
         if(document.querySelectorAll('[data-bs-toggle="tooltip"]').length > 0) {
             console.warn('Bootstrap Tooltip JavaScript library is required but not loaded.');
         }
      }
    },
    // Hancurkan Tooltip sebelum komponen unmount atau sebelum re-render
    destroyTooltips() {
      this.tooltipInstances.forEach(tooltip => {
        if (tooltip && typeof tooltip.dispose === 'function') {
          tooltip.dispose();
        }
      });
      this.tooltipInstances = [];
    }
  },
  mounted() {
    // Panggil fetch data saat komponen dimuat
    this.fetchRolesForDropdown(); // Ambil roles dulu untuk dropdown
    this.fetchUsers(); // Ambil data user
  },
  beforeUnmount() {
    // Hancurkan tooltip saat komponen akan di-unmount
    this.destroyTooltips();
  }
}
</script>

<style scoped>
/* --- PASTE SELURUH BLOK STYLE DARI ROLE VIEW DI SINI --- */
/* --- Ganti .role-manager-container menjadi .user-manager-container --- */
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
/* Ganti nama class container utama */
.user-manager-container {
    font-family: var(--font-family-sans-serif); color: var(--text-color); background-color: #F9FAFB;
    padding: 2rem; max-width: 1280px; margin: 2rem auto; border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow); /* Tambahkan shadow ke container utama jika diinginkan */
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
.alert.shadow-sm { box-shadow: var(--shadow-sm); } /* Tambahkan shadow ke alert jika classnya ada */
.alert i { font-size: 1.2em; margin-right: 0.75rem; }
.alert-info { background-color: #EFF6FF; color: #1E40AF; } .alert-danger { background-color: #FEF2F2; color: #991B1B; }
.alert-secondary { background-color: var(--light-gray); color: var(--secondary-color); }
.alert-warning { background-color: #FFFBEB; color: #92400E; } .alert-light { background-color: var(--light-gray); color: var(--text-color); border: 1px solid var(--border-color); }
/* Tambahkan style untuk alert success jika digunakan */
.alert-success { background-color: #ECFDF5; color: #065F46; }

.spinner-border { display: inline-block; width: 2rem; height: 2rem; vertical-align: -0.125em; border: 0.25em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: .75s linear infinite spinner-border; }
.spinner-border-sm { width: 1rem; height: 1rem; border-width: 0.2em; }
@keyframes spinner-border { to { transform: rotate(360deg); } }
.visually-hidden { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
.text-center { text-align: center !important; } .text-muted { color: var(--text-muted) !important; } .fst-italic { font-style: italic !important; } .fw-medium { font-weight: 500 !important; } .d-block { display: block !important; }
.mt-1 { margin-top: 0.25rem !important; } .mt-2 { margin-top: 0.5rem !important; } .mt-3 { margin-top: 1rem !important; } .mt-4 { margin-top: 1.5rem !important; }
.mb-3 { margin-bottom: 1rem !important; }
.ms-2 { margin-left: 0.5rem !important; }
.me-2 { margin-right: 0.5rem !important; }
.me-3 { margin-right: 1rem !important; }
.px-4 { padding-right: 1.5rem !important; padding-left: 1.5rem !important; }

.table-container { background-color: white; border-radius: var(--border-radius-lg); border: 1px solid var(--border-color); overflow: hidden; }
.table-container.shadow-sm { box-shadow: var(--shadow-sm); } /* Tambahkan shadow jika classnya ada */
.table-responsive { overflow-x: auto; }
.modern-table { border-collapse: separate; border-spacing: 0; width: 100%; margin-bottom: 0; }
.modern-table thead { background-color: var(--light-gray); }
.modern-table th { padding: 0.875rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--secondary-color); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid var(--border-color); white-space: nowrap; vertical-align: middle; /* Pastikan vertical align middle */}
.modern-table tbody tr { transition: background-color 0.15s ease; }
.modern-table tbody tr:hover { background-color: #F9FAFB; }
.modern-table td { padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; font-size: 0.875rem; color: var(--text-color); }
.modern-table tbody tr:last-child td { border-bottom: none; }
/* Pastikan align middle diterapkan */
.modern-table.align-middle th,
.modern-table.align-middle td {
    vertical-align: middle !important;
}

/* Styling Badge */
.badge {
    display: inline-block;
    padding: 0.35em 0.65em;
    font-size: .75em;
    font-weight: 700;
    line-height: 1;
    color: #fff;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: 999px; /* Buat lebih bulat */
}
.badge.bg-danger { background-color: var(--danger-color); }
.badge.bg-warning { background-color: var(--warning-color); }
.badge.bg-info { background-color: var(--info-color); }
.badge.bg-success { background-color: var(--success-color); }
.badge.bg-secondary { background-color: var(--secondary-color); }
.badge.text-dark { color: var(--dark-gray) !important; }
.badge.text-white { color: #fff !important; }

.action-buttons { display: flex; justify-content: center; align-items: center; gap: 0.5rem; }
.btn-icon { padding: 0.4rem; line-height: 1; border-radius: var(--border-radius); width: 32px; height: 32px; display: inline-flex; justify-content: center; align-items: center; }
.btn-icon i { font-size: 0.9rem; }
.btn-outline-primary { color: var(--primary-color); border-color: var(--primary-color); } .btn-outline-primary:hover { background-color: #EEF2FF; color: var(--primary-hover); border-color: var(--primary-hover); }
.btn-outline-danger { color: var(--danger-color); border-color: var(--danger-color); } .btn-outline-danger:hover { background-color: #FEF2F2; color: var(--danger-hover); border-color: var(--danger-hover); }
.btn-outline-secondary { color: var(--secondary-color); border-color: var(--secondary-color); } .btn-outline-secondary:hover { background-color: var(--light-gray); color: var(--dark-gray); border-color: var(--dark-gray); }

.modal-overlay { position: fixed; inset: 0; background-color: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1050; padding: 1rem; overflow-y: auto; }
.modal-dialog { background-color: white; border-radius: var(--border-radius-lg); margin: auto; max-height: 90vh; display: flex; flex-direction: column; width: 100%; box-shadow: none; border: none; pointer-events: all; }
/* Ukuran Modal User (Gunakan .modal-lg) */
.modal-dialog.modal-lg { max-width: 800px; }
/* Fallback jika hanya .modal-dialog */
@media (min-width: 576px) {
  .modal-dialog { max-width: 500px; } /* Default size */
  .modal-dialog.modal-lg { max-width: 800px; } /* Ukuran large */
}

.modal-content { border: none; border-radius: inherit; box-shadow: var(--shadow-lg); overflow: hidden; flex: 1; display: flex; flex-direction: column; max-height: 100%; }
.modal-header { background-color: var(--light-gray); padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }
.modal-title { font-size: 1.125rem; font-weight: 600; color: var(--dark-gray); } .modal-title i { color: var(--primary-color); margin-right: 0.5rem; /* Tambahkan margin kanan pada icon */}
.btn-close { background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236b7280'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat; border: 0; border-radius: .25rem; opacity: .5; cursor: pointer; padding: 0.5rem; margin: -0.5rem; } .btn-close:hover { opacity: 1; } .btn-close:disabled { opacity: .25; }
.modal-body { padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
.modal-footer { background-color: var(--light-gray); padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.75rem; flex-shrink: 0; }

/* Styling Form Modern */
.modern-form .form-group { margin-bottom: 1rem; } /* Sesuaikan margin bottom jika perlu */
.modern-form .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--dark-gray); margin-bottom: 0.5rem; }
.modern-form .form-control,
.modern-form .form-select {
    display: block; width: 100%; padding: 0.625rem 0.875rem; font-size: 0.875rem; font-weight: 400; line-height: 1.5;
    color: var(--text-color); background-color: #fff; background-clip: padding-box; border: 1px solid var(--medium-gray);
    appearance: none; border-radius: var(--border-radius); transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}
.modern-form .form-control::placeholder { color: var(--medium-gray); opacity: 1; }
.modern-form .form-control:focus,
.modern-form .form-select:focus {
    border-color: var(--primary-color); outline: 0; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
}
.modern-form .form-select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
    background-repeat: no-repeat; background-position: right .75rem center; background-size: 16px 12px; padding-right: 2.25rem;
}
/* Styling untuk state invalid */
.modern-form .form-control.is-invalid,
.modern-form .form-select.is-invalid {
    border-color: var(--danger-color);
    padding-right: calc(1.5em + .75rem); /* Space for icon */
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
    background-repeat: no-repeat; background-position: right calc(.375em + .1875rem) center; background-size: calc(.75em + .375rem) calc(.75em + .375rem);
}
.modern-form .form-control.is-invalid:focus,
.modern-form .form-select.is-invalid:focus {
    border-color: var(--danger-color); box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
}
.modern-form .invalid-feedback {
    display: block; /* Pastikan tampil */
    width: 100%; margin-top: .25rem; font-size: .875em; color: var(--danger-color);
}
/* Bootstrap Grid helpers (jika belum ada global) */
.row { --bs-gutter-x: 1.5rem; --bs-gutter-y: 0; display: flex; flex-wrap: wrap; margin-top: calc(-1 * var(--bs-gutter-y)); margin-right: calc(-.5 * var(--bs-gutter-x)); margin-left: calc(-.5 * var(--bs-gutter-x)); }
.row > * { flex-shrink: 0; width: 100%; max-width: 100%; padding-right: calc(var(--bs-gutter-x) * .5); padding-left: calc(var(--bs-gutter-x) * .5); margin-top: var(--bs-gutter-y); }
.g-3 { --bs-gutter-x: 1.5rem; --bs-gutter-y: 1rem; } /* Gutter untuk row */
@media (min-width: 768px) {
    .col-md-6 { flex: 0 0 auto; width: 50%; }
}
/* Alert dismissible styling */
.alert-dismissible { padding-right: 3rem; }
.alert-dismissible .btn-close { position: absolute; top: 0; right: 0; z-index: 2; padding: 1.25rem 1rem; }
.alert-dismissible .btn-close.btn-sm { padding: 0.75rem; /* Adjust padding for smaller close button */}
.alert-dismissible .btn-close.p-1 { padding: 0.25rem !important; /* Override padding if needed */ }

/* Tooltip Styling (Pastikan sesuai dengan tema) */
.tooltip { /* Root element */
  --bs-tooltip-zindex: 1080; --bs-tooltip-max-width: 200px; --bs-tooltip-padding-x: 0.8rem; --bs-tooltip-padding-y: 0.4rem;
  --bs-tooltip-margin: 0; --bs-tooltip-font-size: 0.8rem; --bs-tooltip-color: #fff; --bs-tooltip-bg: #2d3748; /* Warna dark gray */
  --bs-tooltip-border-radius: var(--border-radius); --bs-tooltip-opacity: 0.95; --bs-tooltip-arrow-width: 0.8rem; --bs-tooltip-arrow-height: 0.4rem;
  z-index: var(--bs-tooltip-zindex); display: block; margin: var(--bs-tooltip-margin); font-family: var(--font-family-sans-serif);
  font-style: normal; font-weight: 400; line-height: 1.5; text-align: left; text-align: start; text-decoration: none;
  text-shadow: none; text-transform: none; letter-spacing: normal; word-break: normal; white-space: normal; word-spacing: normal;
  line-break: auto; font-size: var(--bs-tooltip-font-size); word-wrap: break-word; opacity: 0;
}
.tooltip.show { opacity: var(--bs-tooltip-opacity); }
.tooltip .tooltip-arrow { display: block; width: var(--bs-tooltip-arrow-width); height: var(--bs-tooltip-arrow-height); }
.tooltip .tooltip-arrow::before {
  position: absolute; content: ""; border-color: transparent; border-style: solid;
}
.bs-tooltip-top .tooltip-arrow::before, .bs-tooltip-auto[data-popper-placement^=top] .tooltip-arrow::before {
  bottom: calc(-1 * var(--bs-tooltip-arrow-height)); border-width: var(--bs-tooltip-arrow-height) calc(var(--bs-tooltip-arrow-width) * 0.5) 0; border-top-color: var(--bs-tooltip-bg);
}
.bs-tooltip-end .tooltip-arrow::before, .bs-tooltip-auto[data-popper-placement^=right] .tooltip-arrow::before {
  left: calc(-1 * var(--bs-tooltip-arrow-height)); width: 0; height: 0; border-width: calc(var(--bs-tooltip-arrow-width) * 0.5) var(--bs-tooltip-arrow-height) calc(var(--bs-tooltip-arrow-width) * 0.5) 0; border-right-color: var(--bs-tooltip-bg);
}
.bs-tooltip-bottom .tooltip-arrow::before, .bs-tooltip-auto[data-popper-placement^=bottom] .tooltip-arrow::before {
  top: calc(-1 * var(--bs-tooltip-arrow-height)); border-width: 0 calc(var(--bs-tooltip-arrow-width) * 0.5) var(--bs-tooltip-arrow-height); border-bottom-color: var(--bs-tooltip-bg);
}
.bs-tooltip-start .tooltip-arrow::before, .bs-tooltip-auto[data-popper-placement^=left] .tooltip-arrow::before {
  right: calc(-1 * var(--bs-tooltip-arrow-height)); width: 0; height: 0; border-width: calc(var(--bs-tooltip-arrow-width) * 0.5) 0 calc(var(--bs-tooltip-arrow-width) * 0.5) var(--bs-tooltip-arrow-height); border-left-color: var(--bs-tooltip-bg);
}
.tooltip-inner {
  max-width: var(--bs-tooltip-max-width); padding: var(--bs-tooltip-padding-y) var(--bs-tooltip-padding-x); color: var(--bs-tooltip-color);
  text-align: center; background-color: var(--bs-tooltip-bg); border-radius: var(--bs-tooltip-border-radius);
}


@media (max-width: 768px) {
  .user-manager-container { padding: 1rem; } /* Sesuaikan padding */
  .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .modern-table th, .modern-table td { padding: 0.75rem; white-space: normal; font-size: 0.8rem;}
  .action-buttons { justify-content: flex-start; } /* Rata kiri di mobile */
  .modal-overlay { padding: 0.5rem; }
  .modal-dialog { max-width: calc(100% - 1rem); margin: 0.5rem auto; max-height: calc(100% - 1rem); }
  .modal-body { padding: 1rem; }
  .modal-footer { padding: 0.75rem 1rem; }
  .modal-title { font-size: 1rem; }
}
/* Tambahan specific style jika perlu */
.small { font-size: .875em; }
.py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
.ms-auto { margin-left: auto !important; }
.p-1 { padding: 0.25rem !important; }
</style>