<template>
    <div class="category-manager-container">
      <header class="page-header">
        <h1 class="page-title">Manajemen Kategori</h1>
        <button @click="openFormModal()" class="btn btn-primary btn-lg">
          <i class="fas fa-plus me-2"></i> Tambah Kategori Baru
        </button>
      </header>
  
      <!-- Feedback Section -->
      <div class="feedback-section">
        <div v-if="loading" class="alert alert-info d-flex align-items-center shadow-sm" role="alert">
          <div class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></div>
          <span>Memuat data kategori, mohon tunggu...</span>
        </div>
         <!-- Tampilkan error utama hanya jika tidak ada modal yang terbuka -->
        <div v-if="error && !showFormModal && !showAuditModal" class="alert alert-danger shadow-sm" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i> {{ error }}
        </div>
        <div v-if="!loading && categories.length === 0 && !error" class="alert alert-secondary text-center shadow-sm" role="alert">
           <!-- Ikon & teks disesuaikan -->
          <i class="fas fa-tags me-2"></i> Belum ada data kategori. Silakan tambahkan kategori baru.
        </div>
      </div>
  
      <!-- Tabel Kategori -->
      <div v-if="!loading && categories.length > 0" class="table-container shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle modern-table">
            <thead>
              <tr>
                <th scope="col" style="width: 35%;">UUID</th> <!-- Lebar kolom disesuaikan -->
                <th scope="col" style="width: 25%;">Nama Kategori</th>
                <th scope="col" style="width: 25%;">Deskripsi</th>
                <th scope="col" style="width: 15%;" class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.uuid">
                <td><code class="code-badge">{{ category.uuid }}</code></td>
                <td class="fw-medium">{{ category.name }}</td>
                <td>
                   <!-- Fallback jika deskripsi null -->
                   <span v-if="category.description">{{ category.description }}</span>
                   <span v-else class="text-muted fst-italic">-</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button @click="openFormModal(category)" class="btn btn-icon btn-outline-primary" title="Edit Kategori">
                      <i class="fas fa-pencil-alt"></i>
                    </button>
                     <!-- Tambah nama kategori di confirm -->
                    <button @click="confirmDelete(category.uuid, category.name)" class="btn btn-icon btn-outline-danger" title="Hapus Kategori">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                     <!-- Tombol audit tetap ada -->
                    <button @click="showAuditHistory(category)" class="btn btn-icon btn-outline-secondary" title="Lihat Riwayat Audit">
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
  
      <!-- Modal Form Tambah/Edit Kategori -->
       <!-- Gunakan closeModal -->
      <div v-if="showFormModal" class="modal-overlay" @click.self="closeModal">
         <!-- Ukuran standar -->
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg">
            <div class="modal-header">
              <h5 class="modal-title">
                <i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2']"></i>
                {{ isEditing ? 'Edit Kategori' : 'Tambah Kategori Baru' }}
              </h5>
               <!-- Gunakan closeModal -->
              <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div v-if="formError" class="alert alert-danger alert-dismissible fade show" role="alert">
                 {{ formError }}
                 <button type="button" class="btn-close btn-sm" @click="formError = null" aria-label="Close"></button>
              </div>
               <!-- Gunakan form-group -->
              <form @submit.prevent="saveCategory" id="categoryForm" class="modern-form">
                <div class="form-group mb-3">
                  <label for="categoryName" class="form-label">Nama Kategori</label>
                  <input
                    type="text"
                    class="form-control"
                    id="categoryName"
                    v-model.trim="currentCategory.name"
                    required
                    placeholder="Masukkan nama kategori"
                    :disabled="saving"
                  />
                </div>
                <div class="form-group">
                  <label for="categoryDescription" class="form-label">Deskripsi <span class="text-muted">(Opsional)</span></label>
                  <textarea
                    id="categoryDescription"
                    v-model.trim="currentCategory.description"
                    class="form-control"
                    rows="4"
                    placeholder="Masukkan deskripsi singkat"
                    :disabled="saving"
                  ></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
               <!-- Gunakan closeModal -->
              <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="saving">Batal</button>
              <button type="submit" form="categoryForm" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ saving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Kategori') }}
              </button>
            </div>
          </div>
        </div>
      </div>
  
       <!-- Modal Audit History -->
        <!-- Gunakan closeModal -->
       <div v-if="showAuditModal" class="modal-overlay" @click.self="closeModal">
          <!-- Ukuran XL -->
         <div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
           <div class="modal-content shadow-lg">
             <div class="modal-header">
               <h5 class="modal-title">
                   <i class="fas fa-history me-2"></i> Riwayat Audit Kategori: {{ categoryForAudit?.name }}
               </h5>
                <!-- Gunakan closeModal -->
               <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
             </div>
             <div class="modal-body">
               <div v-if="auditLoading" class="alert alert-light text-center">
                  <div class="spinner-border text-primary me-2" role="status"> <span class="visually-hidden">Loading...</span> </div>
                  Memuat riwayat audit...
              </div>
               <div v-if="auditError" class="alert alert-warning">{{ auditError }}</div>
  
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
                       <td>
                          <!-- Gunakan v-if/v-else untuk nama user -->
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
                   <i class="fas fa-info-circle me-2"></i> Tidak ada riwayat audit ditemukan untuk kategori ini.
                </div>
             </div>
             <div class="modal-footer">
                <!-- Gunakan closeModal -->
               <button type="button" class="btn btn-outline-secondary" @click="closeModal">Tutup</button>
             </div>
           </div>
         </div>
       </div>
  
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'; // Pastikan reactive diimpor jika digunakan
  import axios from 'axios';
  
  // --- Axios Instance & Interceptors ---
  const apiClient = axios.create({
    baseURL: 'http://back-end.test/api', // --- SESUAIKAN ---
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
  });
  apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken'); // --- GANTI KEY JIKA PERLU ---
    if (token) { config.headers.Authorization = `Bearer ${token}`; }
    return config;
  }, error => { console.error("Request Interceptor Error:", error); return Promise.reject(error); });
  apiClient.interceptors.response.use(response => response, error => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem('authToken'); // --- GANTI KEY JIKA PERLU ---
          alert('Sesi tidak valid. Silakan login kembali.');
          window.location.href = '/login'; // --- SESUAIKAN PATH LOGIN ---
          return Promise.reject(new Error(`Auth failed: ${error.response.status}`));
      }
      return Promise.reject(error);
  });
  
  // --- State ---
  const categories = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const saving = ref(false); // Nama state yang benar
  const formError = ref(null);
  const showFormModal = ref(false);
  const isEditing = ref(false);
  // Gunakan reactive agar lebih mudah jika state berkembang
  const currentCategory = reactive({
      uuid: null,
      name: '',
      description: ''
  });
  const showAuditModal = ref(false);
  const auditHistory = ref([]);
  const auditLoading = ref(false);
  const auditError = ref(null);
  const categoryForAudit = ref(null);
  
  // --- Fungsi API ---
  const fetchCategories = async () => {
      loading.value = true;
      error.value = null;
      try {
          const response = await apiClient.get('/categories');
          if (response.data && response.data.status) {
              categories.value = response.data.data;
          } else { throw new Error(response.data.message || 'Gagal mengambil data kategori.'); }
      } catch (err) {
          if (err.message && !err.message.includes('Auth failed')) {
              console.error("Error fetching categories:", err);
              error.value = getErrorMessage(err, 'Terjadi kesalahan saat mengambil data kategori.');
              categories.value = [];
          }
      } finally { loading.value = false; }
  };
  
  const saveCategory = async () => {
      if (!currentCategory.name.trim()) {
          formError.value = "Nama kategori tidak boleh kosong.";
          return;
      }
      saving.value = true; formError.value = null; // Gunakan saving.value
      const url = isEditing.value ? `/categories/${currentCategory.uuid}` : '/categories';
      const method = isEditing.value ? 'put' : 'post';
      const payload = { name: currentCategory.name, description: currentCategory.description };
      try {
          const response = await apiClient({ method, url, data: payload });
          if (response.data && response.data.status) {
              closeModal(); // Gunakan closeModal yang dimodifikasi
              await fetchCategories();
              // alert(response.data.message || 'Operasi berhasil!'); // Opsional
          } else { throw new Error(response.data.message || `Gagal ${isEditing.value ? 'memperbarui' : 'membuat'} kategori.`); }
      } catch (err) {
          if (err.message && !err.message.includes('Auth failed')) {
              console.error("Error saving category:", err);
              formError.value = getErrorMessage(err, `Terjadi kesalahan saat ${isEditing.value ? 'menyimpan' : 'membuat'} kategori.`);
          }
      } finally { saving.value = false; } // Gunakan saving.value
  };
  
  const deleteCategory = async (uuid) => {
      error.value = null;
      // Tambahkan state loading khusus delete jika perlu
      // loadingDelete.value = true;
      try {
          const response = await apiClient.delete(`/categories/${uuid}`);
          if (response.data && response.data.status) {
              await fetchCategories();
              // alert(response.data.message || 'Kategori berhasil dihapus.'); // Opsional
          } else { throw new Error(response.data.message || 'Gagal menghapus kategori.'); }
      } catch (err) {
          if (err.message && !err.message.includes('Auth failed')) {
              console.error("Error deleting category:", err);
              error.value = getErrorMessage(err, 'Terjadi kesalahan saat menghapus kategori.');
              setTimeout(() => { error.value = null; }, 7000);
          }
      } finally {
          // loadingDelete.value = false;
      }
  };
  
  const fetchAuditHistory = async (uuid) => {
      auditLoading.value = true; auditError.value = null; auditHistory.value = [];
      try {
          const response = await apiClient.get(`/categories/${uuid}/audits`);
          if (response.data && response.data.status) {
              auditHistory.value = response.data.data;
          } else { throw new Error(response.data.message || 'Gagal mengambil riwayat audit.'); }
      } catch (err) {
          if (err.message && !err.message.includes('Auth failed')) {
              console.error("Error fetching audit history:", err);
              auditError.value = getErrorMessage(err, 'Terjadi kesalahan saat mengambil riwayat audit.');
          }
      } finally { auditLoading.value = false; }
  };
  
  // --- Fungsi UI ---
  const openFormModal = (category = null) => {
      formError.value = null; error.value = null;
      if (category) {
          isEditing.value = true;
          Object.assign(currentCategory, { uuid: category.uuid, name: category.name, description: category.description || '' });
      } else {
          isEditing.value = false;
          Object.assign(currentCategory, { uuid: null, name: '', description: '' });
      }
      showFormModal.value = true;
  };
  
  // Modifikasi closeModal untuk menangani kedua modal
  const closeModal = () => {
      showFormModal.value = false;
      showAuditModal.value = false;
      // Reset error spesifik modal
      formError.value = null;
      auditError.value = null;
      // Reset state audit
      auditHistory.value = [];
      categoryForAudit.value = null;
      // Reset flags
      saving.value = false; // <-- PERBAIKAN DI SINI
  };
  
  const confirmDelete = (uuid, name) => { // Terima nama
      if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) { // Gunakan nama
          deleteCategory(uuid);
      }
  };
  
  const showAuditHistory = (category) => {
      categoryForAudit.value = category; error.value = null;
      showAuditModal.value = true; fetchAuditHistory(category.uuid);
  };
  
  // --- Fungsi Utilitas/Formatting ---
  const formatAuditValues = (values) => { if (!values || Object.keys(values).length === 0) return '-'; try { return JSON.stringify(values, null, 2); } catch (e) { return String(values); } };
  const formatAuditTimestamp = (timestamp) => { if (!timestamp) return '-'; try { return new Date(timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return timestamp; } };
  const getEventBadgeColor = (event) => { switch (event) { case 'created': return 'success'; case 'updated': return 'warning'; case 'deleted': return 'danger'; default: return 'secondary'; } };
  const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => {
      if (error.response) {
          let apiMessage = error.response.data?.message;
          if (error.response.status === 422 && error.response.data?.errors) {
               const errors = error.response.data.errors; const firstErrorKey = Object.keys(errors)[0];
               if (firstErrorKey && Array.isArray(errors[firstErrorKey]) && errors[firstErrorKey].length > 0) { apiMessage = errors[firstErrorKey][0]; }
               else { apiMessage = apiMessage || 'Validation failed.'; }
          }
          if (error.response.status === 401 || error.response.status === 403) return '';
          return apiMessage || `Error ${error.response.status}: ${error.response.statusText || defaultMessage}`;
      } else if (error.request) { return 'Tidak dapat terhubung ke server.'; }
      else { if (error.message && error.message.includes('Auth failed')) return ''; return error.message || defaultMessage; }
  };
  
  // --- Lifecycle Hook ---
  onMounted(() => { fetchCategories(); });
  // --- END SCRIPT ---
  </script>
  
  <style scoped>
  /* --- PASTE SELURUH BLOK STYLE MODERN DARI JAWABAN SEBELUMNYA DI SINI --- */
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
  .category-manager-container { /* <-- NAMA CLASS DIUBAH */
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
  .text-center { text-align: center !important; } .text-muted { color: var(--text-muted) !important; } .fst-italic { font-style: italic !important; } .fw-medium { font-weight: 500 !important; } .d-block { display: block !important; } .fs-xs { font-size: .75rem !important; }
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
  .code-badge { font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; background-color: var(--light-gray); color: var(--secondary-color); padding: 0.25em 0.6em; border-radius: var(--border-radius); font-size: 0.8em; border: 1px solid var(--border-color); }
  .action-buttons { display: flex; justify-content: center; align-items: center; gap: 0.5rem; }
  .btn-icon { padding: 0.4rem; line-height: 1; border-radius: var(--border-radius); width: 32px; height: 32px; display: inline-flex; justify-content: center; align-items: center; }
  .btn-icon i { font-size: 0.9rem; }
  .btn-outline-primary { color: var(--primary-color); border-color: var(--primary-color); } .btn-outline-primary:hover { background-color: #EEF2FF; color: var(--primary-hover); border-color: var(--primary-hover); }
  .btn-outline-danger { color: var(--danger-color); border-color: var(--danger-color); } .btn-outline-danger:hover { background-color: #FEF2F2; color: var(--danger-hover); border-color: var(--danger-hover); }
  .btn-outline-secondary { color: var(--secondary-color); border-color: var(--secondary-color); } .btn-outline-secondary:hover { background-color: var(--light-gray); color: var(--dark-gray); border-color: var(--dark-gray); }
  .modal-overlay { position: fixed; inset: 0; background-color: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1050; padding: 1rem; overflow-y: auto; }
  .modal-dialog { background-color: white; border-radius: var(--border-radius-lg); margin: auto; max-height: 90vh; display: flex; flex-direction: column; width: 100%; box-shadow: none; border: none; pointer-events: all; max-width: 500px; /* Ukuran default modal kategori */}
  .modal-dialog.modal-xl { max-width: 1140px; } /* Audit Modal Size */
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
  textarea.form-control { min-height: calc(1.5em + (0.625rem * 2) + 2px); } /* Sesuaikan min-height textarea */
  .audit-table th { background-color: var(--light-gray); font-size: 0.7rem; text-align: left; padding: 0.5rem 0.75rem;}
  .audit-table td { font-size: 0.8rem; padding: 0.5rem 0.75rem;}
  .audit-table .badge { font-size: 0.7rem; padding: 0.25em 0.5em; text-transform: uppercase; }
  .audit-table .user-agent { max-width: 200px; font-size: 0.75rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  pre.audit-values { font-size: 0.75rem; max-height: 120px; background-color: white; border: 1px solid var(--border-color); padding: 8px; margin: 0; font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; white-space: pre-wrap; overflow-y: auto; }
  .modal-dialog-scrollable .sticky-top { background-color: var(--light-gray); position: sticky; top: 0; z-index: 10;}
  @media (max-width: 768px) {
    .category-manager-container { padding: 1rem; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .modern-table th, .modern-table td { padding: 0.75rem; white-space: normal; }
    .action-buttons { justify-content: flex-start; }
    .modal-overlay { padding: 0.5rem; }
    .modal-dialog { max-width: calc(100% - 1rem); margin: 0.5rem; max-height: calc(100% - 1rem); }
    .modal-body { padding: 1rem; }
    .modal-footer { padding: 0.75rem 1rem; }
  }
  /* Tambahkan gaya spesifik untuk Kategori jika perlu */
  </style>