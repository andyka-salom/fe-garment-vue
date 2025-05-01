<template>
    <div class="material-manager-view"> <!-- Root element -->
        <div class="container"> <!-- Bootstrap container -->
            <div class="material-manager-container"> <!-- Specific container for this view -->

                <!-- Page Header -->
                <header class="page-header">
                    <h1 class="page-title">Manajemen Material</h1>
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
                            <i class="fas fa-plus me-1"></i> Tambah Material Baru
                        </button>
                    </div>
                </header>

                <!-- Filters Section -->
                <div class="filter-section card shadow-sm mb-4">
                    <div class="card-body d-flex flex-column flex-md-row flex-wrap gap-3 align-items-md-center">
                        <!-- Search Input -->
                        <div class="filter-item flex-grow-1 mb-2 mb-md-0" style="min-width: 200px;">
                            <label for="searchFilterMaterial" class="form-label visually-hidden">Cari Material</label>
                            <div class="input-group input-group-sm">
                                <span class="input-group-text bg-light"><i class="fas fa-search fa-fw"></i></span>
                                <input type="text" id="searchFilterMaterial" class="form-control"
                                    :placeholder="`Cari di ${viewMode === 'active' ? 'daftar aktif' : 'tempat sampah'}...`"
                                    v-model.lazy="filters.search" @keyup.enter="applyFilters" :disabled="isLoading" />
                                <button v-if="filters.search" class="btn btn-outline-secondary" type="button"
                                    @click="clearSearch" title="Hapus Pencarian">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <!-- Status Filter (Only for Active View) -->
                        <div v-if="viewMode === 'active'" class="filter-item" style="min-width: 150px;">
                            <label for="statusFilterMaterial" class="form-label visually-hidden">Filter Status</label>
                            <select id="statusFilterMaterial" class="form-select form-select-sm"
                                v-model="filters.status" @change="applyFilters" :disabled="isLoading">
                                <option value="">Semua Status</option>
                                <option value="true">Aktif</option>
                                <option value="false">Tidak Aktif</option>
                            </select>
                        </div>
                        <!-- Apply & Clear Buttons -->
                        <div class="filter-item ms-md-auto">
                            <button class="btn btn-sm btn-primary" @click="applyFilters" :disabled="isLoading">
                                <i class="fas fa-check me-1"></i> Terapkan Filter
                            </button>
                            <button v-if="filters.search || (viewMode === 'active' && filters.status !== '')"
                                    class="btn btn-sm btn-outline-secondary ms-2" @click="clearAllFilters"
                                    :disabled="isLoading" title="Hapus Semua Filter">
                                <i class="fas fa-eraser"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Feedback Section -->
                <div class="feedback-section mb-3">
                    <!-- Loading Indicator -->
                    <div v-if="isLoading && (viewMode === 'active' ? !materials.length : !trashedMaterials.length)" class="alert alert-info d-flex align-items-center shadow-sm" role="alert">
                        <div class="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></div>
                        <span>Memuat data material {{ viewMode === 'trashed' ? ' sampah' : '' }}, mohon tunggu...</span>
                    </div>
                    <!-- Error Message -->
                    <div v-if="error && !showModal && !showAuditModal" class="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i> {{ error }}
                        <button type="button" class="btn-close btn-sm" @click="clearError" aria-label="Close"></button>
                    </div>
                    <!-- Success Message -->
                    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                        <i class="fas fa-check-circle me-2"></i> {{ successMessage }}
                        <button type="button" class="btn-close btn-sm" @click="successMessage = null" aria-label="Close"></button>
                    </div>
                    <!-- No Data Message -->
                    <div v-if="!isLoading && (viewMode === 'active' ? materials.length === 0 : trashedMaterials.length === 0) && !error" class="alert alert-secondary text-center shadow-sm" role="alert">
                        <i class="fas fa-box-open me-2"></i>
                        Tidak ada data material ditemukan
                        <span v-if="filters.search || (viewMode === 'active' && filters.status !== '')"> sesuai filter</span>
                        <span v-if="viewMode === 'active' && !filters.search && filters.status === ''">. Silakan tambahkan material baru.</span>
                        <span v-if="viewMode === 'trashed' && !filters.search"> di tempat sampah.</span>
                        <button v-if="filters.search || (viewMode === 'active' && filters.status !== '')" @click="clearAllFilters" class="btn btn-sm btn-link p-0 ms-2">Hapus Filter</button>
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
                                        Nama Material <i :class="getSortIcon('name')"></i>
                                    </th>
                                    <th scope="col" style="width: 20%;">Deskripsi</th>
                                    <th scope="col" style="width: 20%;">Info Supplier</th>
                                    <th scope="col" style="width: 10%;" @click="changeSort('is_active')" class="sortable-header">
                                        Status <i :class="getSortIcon('is_active')"></i>
                                    </th>
                                    <th scope="col" style="width: 15%;" @click="changeSort('created_at')" class="sortable-header">
                                        Dibuat Pada <i :class="getSortIcon('created_at')"></i>
                                    </th>
                                    <th scope="col" class="text-center" style="width: 15%;">Aksi</th> <!-- Adjusted width -->
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoading && materials.length === 0"> <!-- Show loading row only if list is initially empty -->
                                    <td colspan="7" class="text-center">
                                        <div class="d-flex justify-content-center align-items-center py-4">
                                            <div class="spinner-border text-primary" role="status"></div>
                                            <span class="ms-3 text-muted">Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-for="(material, index) in materials" :key="material.uuid" v-show="!isLoading || materials.length > 0">
                                    <td>{{ (pagination.currentPage - 1) * pagination.perPage + index + 1 }}</td>
                                    <td class="fw-medium">{{ material.name }}</td>
                                    <td class="text-muted small">{{ material.description || '-' }}</td>
                                    <td>
                                        <div v-if="parsedSupplierInfo(material.supplier_info).name || parsedSupplierInfo(material.supplier_info).contact"
                                             class="small supplier-info">
                                            <span v-if="parsedSupplierInfo(material.supplier_info).name" class="d-block">
                                                <i class="fas fa-building fa-fw me-1 text-muted"></i> {{ parsedSupplierInfo(material.supplier_info).name }}
                                            </span>
                                            <span v-if="parsedSupplierInfo(material.supplier_info).contact" class="d-block">
                                                <i class="fas fa-phone-alt fa-fw me-1 text-muted"></i> {{ parsedSupplierInfo(material.supplier_info).contact }}
                                            </span>
                                        </div>
                                        <span v-else class="text-muted small">-</span>
                                    </td>
                                    <td>
                                        <span :class="['badge', material.is_active ? 'bg-success-light text-success' : 'bg-secondary-light text-secondary']">
                                            {{ material.is_active ? 'Aktif' : 'Tidak Aktif' }}
                                        </span>
                                    </td>
                                    <td>{{ formatDate(material.created_at) }}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button @click="openEditModal(material)"
                                                class="btn btn-icon btn-outline-primary" title="Edit Material"
                                                :disabled="actionInProgress(material.uuid)">
                                                <i class="fas fa-pencil-alt"></i>
                                            </button>
                                            <!-- Audit Button -->
                                            <button @click="openAuditModal(material)"
                                                    class="btn btn-icon btn-outline-info" title="Lihat Riwayat Perubahan"
                                                    :disabled="actionInProgress(material.uuid) || isAuditLoading">
                                                <i class="fas fa-history"></i>
                                            </button>
                                            <button @click="confirmDeleteMaterial(material.uuid, material.name)"
                                                class="btn btn-icon btn-outline-danger" title="Pindahkan ke Tempat Sampah"
                                                :disabled="actionInProgress(material.uuid)">
                                                <span v-if="deletingId === material.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                <i v-else class="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div> <!-- End Active Table Container -->

                <!-- ======================= -->
                <!--      TRASHED TABLE      -->
                <!-- ======================= -->
                <div v-if="viewMode === 'trashed'" class="table-container shadow-sm mb-4">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle modern-table">
                            <thead>
                                <tr>
                                    <th scope="col" style="width: 5%;">#</th>
                                    <th scope="col">Nama Material</th>
                                    <th scope="col" style="width: 20%;">Deskripsi</th>
                                    <th scope="col" style="width: 20%;">Info Supplier</th>
                                    <th scope="col" style="width: 20%;">Dihapus Pada</th>
                                    <th scope="col" class="text-center" style="width: 15%;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoading && trashedMaterials.length === 0"> <!-- Show loading row only if list is initially empty -->
                                    <td colspan="6" class="text-center">
                                        <div class="d-flex justify-content-center align-items-center py-4">
                                            <div class="spinner-border text-primary" role="status"></div>
                                            <span class="ms-3 text-muted">Memuat data sampah...</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-for="(material, index) in trashedMaterials" :key="material.uuid" v-show="!isLoading || trashedMaterials.length > 0">
                                    <td>{{ (trashedPagination.currentPage - 1) * trashedPagination.perPage + index + 1 }}</td>
                                    <td class="fw-medium">{{ material.name }}</td>
                                    <td class="text-muted small">{{ material.description || '-' }}</td>
                                    <td>
                                        <div v-if="parsedSupplierInfo(material.supplier_info).name || parsedSupplierInfo(material.supplier_info).contact"
                                             class="small supplier-info">
                                            <span v-if="parsedSupplierInfo(material.supplier_info).name" class="d-block">
                                                <i class="fas fa-building fa-fw me-1 text-muted"></i> {{ parsedSupplierInfo(material.supplier_info).name }}
                                            </span>
                                            <span v-if="parsedSupplierInfo(material.supplier_info).contact" class="d-block">
                                                <i class="fas fa-phone-alt fa-fw me-1 text-muted"></i> {{ parsedSupplierInfo(material.supplier_info).contact }}
                                            </span>
                                        </div>
                                        <span v-else class="text-muted small">-</span>
                                    </td>
                                    <td>{{ formatDate(material.deleted_at) }}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button @click="restoreMaterial(material.uuid, material.name)"
                                                class="btn btn-icon btn-outline-success" title="Pulihkan Material"
                                                :disabled="actionInProgress(material.uuid)">
                                                <span v-if="restoringId === material.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                <i v-else class="fas fa-undo-alt"></i>
                                            </button>
                                            <button @click="confirmForceDeleteMaterial(material.uuid, material.name)"
                                                class="btn btn-icon btn-outline-danger" title="Hapus Permanen"
                                                :disabled="actionInProgress(material.uuid)">
                                                <span v-if="forceDeletingId === material.uuid" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                <i v-else class="fas fa-times-circle"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div> <!-- End Trashed Table Container -->

                <!-- Pagination -->
                <div v-if="!isLoading && currentTotalPages > 1" class="pagination-controls d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
                    <!-- Per Page Selector -->
                    <div class="d-flex align-items-center gap-2">
                        <label for="perPageSelectMaterial" class="form-label mb-0 text-muted small">Item/Hal:</label>
                        <select id="perPageSelectMaterial" class="form-select form-select-sm" style="width: 75px;"
                            v-model="filters.per_page" @change="applyFilters">
                            <option value="15">15</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span class="text-muted small ms-2 d-none d-md-inline">
                            Total {{ currentTotalItems }} material {{ viewMode === 'trashed' ? ' sampah' : ''}}
                        </span>
                    </div>
                    <!-- Page Links -->
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
                </div> <!-- End Pagination -->

                <!-- ========================== -->
                <!-- ADD/EDIT MATERIAL MODAL    -->
                <!-- ========================== -->
                <div v-if="showModal" class="modal-overlay" @click.self="closeAndResetModal">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content shadow-lg">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i :class="['fas', isEditing ? 'fa-edit' : 'fa-plus-circle', 'me-2']"></i>
                                    {{ isEditing ? 'Edit Material' : 'Tambah Material Baru' }}
                                </h5>
                                <button type="button" class="btn-close" @click="closeAndResetModal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div v-if="modalError" class="alert alert-danger alert-dismissible fade show" role="alert">
                                    {{ modalError }}
                                    <button type="button" class="btn-close btn-sm" @click="modalError = null" aria-label="Close"></button>
                                </div>
                                <form @submit.prevent="saveMaterial" id="materialForm" class="modern-form" novalidate>
                                    <!-- Name Field -->
                                    <div class="form-group mb-3">
                                        <label for="materialName" class="form-label">Nama Material <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" id="materialName" v-model.trim="currentMaterial.name"
                                            required placeholder="Masukkan nama material" :disabled="isSaving" />
                                    </div>
                                    <!-- Status Field -->
                                    <div class="form-group mb-3">
                                        <label class="form-label d-block">Status</label>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" role="switch" id="materialStatus"
                                                   v-model="currentMaterial.is_active" :disabled="isSaving">
                                            <label class="form-check-label" for="materialStatus">
                                                {{ currentMaterial.is_active ? 'Aktif' : 'Tidak Aktif' }}
                                            </label>
                                        </div>
                                        <small class="form-text text-muted">
                                            Material yang tidak aktif tidak akan muncul di pilihan saat membuat produk.
                                        </small>
                                    </div>
                                    <!-- Description Field -->
                                    <div class="form-group mb-3">
                                        <label for="materialDescription" class="form-label">Deskripsi</label>
                                        <textarea class="form-control" id="materialDescription" rows="3"
                                                  v-model="currentMaterial.description"
                                                  placeholder="Deskripsi atau catatan tambahan (opsional)"
                                                  :disabled="isSaving"></textarea>
                                    </div>
                                    <!-- Supplier Info Fields -->
                                    <div class="form-group mb-3">
                                        <label for="supplierName" class="form-label">Nama Supplier</label>
                                        <input type="text" class="form-control" id="supplierName"
                                               v-model.trim="currentMaterial.supplier_name"
                                               placeholder="Nama perusahaan supplier (opsional)" :disabled="isSaving" />
                                    </div>
                                    <div class="form-group mb-3">
                                        <label for="supplierContact" class="form-label">Kontak Supplier</label>
                                        <input type="text" class="form-control" id="supplierContact"
                                               v-model.trim="currentMaterial.supplier_contact"
                                               placeholder="Nomor telepon atau email (opsional)" :disabled="isSaving" />
                                    </div>
                                </form>
                            </div> <!-- End modal-body -->
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" @click="closeAndResetModal" :disabled="isSaving">Batal</button>
                                <button type="submit" form="materialForm" class="btn btn-primary" :disabled="isSaving || !currentMaterial.name">
                                    <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {{ isSaving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Material') }}
                                </button>
                            </div>
                        </div> <!-- End .modal-content -->
                    </div> <!-- End .modal-dialog -->
                </div>

                <!-- ======================= -->
                <!--     AUDIT LOG MODAL     -->
                <!-- ======================= -->
                <div v-if="showAuditModal" class="modal-overlay" @click.self="closeAuditModal">
                    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content shadow-lg">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-history me-2"></i>
                                    Riwayat Perubahan: {{ auditedMaterialName }}
                                </h5>
                                <button type="button" class="btn-close" @click="closeAuditModal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div v-if="isAuditLoading" class="text-center py-5">
                                    <div class="spinner-border text-primary" role="status"></div>
                                    <p class="mt-2 mb-0 text-muted">Memuat riwayat...</p>
                                </div>
                                <div v-else-if="auditError" class="alert alert-danger" role="alert">
                                    <i class="fas fa-exclamation-triangle me-2"></i> {{ auditError }}
                                </div>
                                <div v-else-if="!auditLogs || auditLogs.length === 0" class="alert alert-secondary text-center" role="alert">
                                    <i class="fas fa-info-circle me-2"></i> Belum ada riwayat perubahan untuk material ini.
                                </div>
                                <div v-else class="audit-log-list table-responsive">
                                    <table class="table table-sm table-bordered table-striped small align-middle">
                                        <thead class="table-light sticky-top">
                                            <tr>
                                                <th style="width: 15%;">Tanggal</th>
                                                <th style="width: 15%;">Pengguna</th>
                                                <th style="width: 10%;">Aksi</th>
                                                <th>Detail Perubahan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="log in auditLogs" :key="log.id">
                                                <td>{{ formatAuditTimestamp(log.created_at) }}</td>
                                                <td>
                                                    <!-- Access user data via log.user (from AuditResource) -->
                                                    {{ log.user?.name || 'Sistem/Tidak Diketahui' }}
                                                    <span v-if="!log.user?.name && log.user?.id" class="badge bg-secondary-light text-secondary ms-1" :title="`User ID: ${log.user.id}`">ID: {{ log.user.id }}</span>
                                                </td>
                                                <td class="text-center">
                                                    <span :class="['badge', auditEventBadgeClass(log.event)]">
                                                        {{ formatAuditEvent(log.event) }}
                                                    </span>
                                                </td>
                                                <td class="changes-cell">
                                                    <!-- Created Event -->
                                                    <div v-if="log.event === 'created'">
                                                        <span class="text-success fw-medium">Material Dibuat</span>
                                                        <ul class="list-unstyled mb-0 mt-1 small text-muted">
                                                            <li v-for="(value, key) in log.new_values" :key="key">
                                                                <strong>{{ formatFieldName(key) }}:</strong>
                                                                <span>{{ formatAuditValue(value) }}</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    <ul v-else-if="log.event === 'updated' && Object.keys(log.new_values).length > 0" class="list-unstyled mb-0">
                                                        <li v-for="(value, key) in log.new_values" :key="key">
                                                            <strong>{{ formatFieldName(key) }}:</strong>
                                                            <span class="change-value old-value text-danger text-decoration-line-through">{{ formatAuditValue(log.old_values[key]) }}</span>
                                                            <i class="fas fa-arrow-right fa-fw mx-1 text-muted small"></i>
                                                            <span class="change-value new-value text-success">{{ formatAuditValue(value) }}</span>
                                                        </li>
                                                    </ul>
                                                    <span v-else-if="log.event === 'deleted'" class="text-danger">
                                                        Material dipindahkan ke tempat sampah.
                                                    </span>
                                                    <span v-else-if="log.event === 'restored'" class="text-info">
                                                        Material dipulihkan dari tempat sampah.
                                                    </span>
                                                    <span v-else-if="log.event === 'forceDeleted'" class="text-danger fw-bold">
                                                         Material dihapus permanen.
                                                    </span>
                                                    <span v-else class="text-muted">{{ log.event }}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" @click="closeAuditModal">Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';

// --- Axios Instance Setup ---
const apiClient = axios.create({
    baseURL: `${process.env.VUE_APP_API_URL || 'http://localhost:8000/api'}`,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
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
    } catch (e) { console.error("Error reading token from localStorage:", e); }
    return config;
}, error => Promise.reject(error));

apiClient.interceptors.response.use(response => response, error => {
    if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
            console.error(`Authentication Error (${status}): Redirecting to login.`);
            localStorage.removeItem('userData');
            window.location.href = '/login';
            return Promise.reject(new Error(`Auth failed: ${status}`));
        }
        if (status === 409) { console.warn('Conflict Error (409):', error.response.data?.message); }
        if (status === 404) { console.warn('Not Found Error (404):', error.response.data?.message); }
    } else if (error.request) { console.error('Network Error:', error.request); }
    else { console.error('Request Setup Error:', error.message); }
    return Promise.reject(error);
});
// --- End Axios Setup ---

// --- Utility Function for Error Messages ---
const getErrorMessage = (error, defaultMessage = 'Terjadi kesalahan.') => {
    if (error?.message?.includes('Auth failed')) return '';
    if (error?.response) {
        const status = error.response.status;
        let apiMessage = error.response.data?.message;
        const apiErrors = error.response.data?.errors;
        if (status === 422 && apiErrors) {
            const firstErrorKey = Object.keys(apiErrors)[0];
            apiMessage = apiErrors[firstErrorKey]?.[0] || apiMessage || 'Data tidak valid.';
        } else if (status === 404) {
            apiMessage = apiMessage || 'Data tidak ditemukan.';
        } else if (status === 409) {
           apiMessage = apiMessage || 'Operasi gagal karena konflik data.';
        } else if (status >= 500) {
           apiMessage = `Terjadi masalah pada server (Error ${status}).`;
           console.error("Server Error Detail:", error.response.data);
        }
        return apiMessage || `Error ${status}: ${defaultMessage}`;
    } else if (error?.request) { return 'Tidak dapat terhubung ke server.'; }
    else { return error?.message || defaultMessage; }
};

// --- Component State ---
const materials = ref([]);
const trashedMaterials = ref([]);
const pagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedPagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, perPage: 15 });
const trashedCount = ref(0);
const filters = reactive({ search: '', status: '', sort_by: 'created_at', sort_direction: 'desc', page: 1, per_page: 15 });
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
const currentMaterial = reactive({ uuid: null, name: '', is_active: true, description: '', supplier_name: '', supplier_contact: '' });
// --- Audit Log State ---
const showAuditModal = ref(false);
const isAuditLoading = ref(false);
const auditError = ref(null);
const auditLogs = ref([]);
const auditedMaterialName = ref('');

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
    if (!last || last <= 1) return last === 1 ? [1] : [];
    const delta = 1, left = current - delta, right = current + delta + 1, range = [], rangeWithDots = [];
    let l;
    for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= left && i < right)) range.push(i); }
    range.forEach((i) => { if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l > 2) rangeWithDots.push('...'); } rangeWithDots.push(i); l = i; });
    return rangeWithDots;
});
const actionInProgress = (uuid) => deletingId.value === uuid || restoringId.value === uuid || forceDeletingId.value === uuid;

// --- API Functions ---
async function fetchMaterials() {
    isLoading.value = true; error.value = null; filters.page = pagination.value.currentPage; filters.per_page = parseInt(filters.per_page, 10) || 15;
    const params = { page: filters.page, per_page: filters.per_page, sort_by: filters.sort_by, sort_direction: filters.sort_direction, ...(filters.search && { search: filters.search }), ...(filters.status !== '' && { status: filters.status }), };
    try {
        const response = await apiClient.get('/materials', { params });
        if (response.data && response.data.data && response.data.meta) {
            materials.value = response.data.data; pagination.value = { currentPage: response.data.meta.current_page ?? 1, totalPages: response.data.meta.last_page ?? 1, totalItems: response.data.meta.total ?? 0, perPage: parseInt(response.data.meta.per_page ?? filters.per_page, 10), };
            await fetchTrashCount();
        } else { console.warn("Unexpected data structure for materials:", response.data); materials.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page }; }
    } catch (err) { error.value = getErrorMessage(err, 'Gagal memuat data material.'); materials.value = []; pagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: filters.per_page }; }
    finally { isLoading.value = false; }
}
async function fetchTrashedMaterials() {
    isLoading.value = true; error.value = null; const trashPage = trashedPagination.value.currentPage; const trashPerPage = parseInt(filters.per_page, 10) || 15;
    const params = { page: trashPage, per_page: trashPerPage, ...(filters.search && { search: filters.search }), };
    try {
        const response = await apiClient.get('/materials/trash', { params });
         if (response.data && response.data.data && response.data.meta) {
            trashedMaterials.value = response.data.data; trashedPagination.value = { currentPage: response.data.meta.current_page ?? 1, totalPages: response.data.meta.last_page ?? 1, totalItems: response.data.meta.total ?? 0, perPage: parseInt(response.data.meta.per_page ?? trashPerPage, 10), }; trashedCount.value = response.data.meta.total ?? 0;
        } else { console.warn("Unexpected data structure for trashed materials:", response.data); trashedMaterials.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage }; trashedCount.value = 0; }
    } catch (err) { error.value = getErrorMessage(err, 'Gagal memuat data material dari tempat sampah.'); trashedMaterials.value = []; trashedPagination.value = { currentPage: 1, totalPages: 1, totalItems: 0, perPage: trashPerPage }; trashedCount.value = 0; }
    finally { isLoading.value = false; }
}
async function fetchTrashCount() {
    if (viewMode.value === 'active') {
        try { const response = await apiClient.get('/materials/trash', { params: { per_page: 1, page: 1 } }); trashedCount.value = response.data.meta?.total ?? 0; }
        catch (err) { console.error("Failed to fetch material trash count:", getErrorMessage(err)); trashedCount.value = 0; }
    }
}
async function saveMaterial() {
    if (!currentMaterial.name || !currentMaterial.name.trim()) { modalError.value = "Nama material tidak boleh kosong."; return; }
    isSaving.value = true; modalError.value = null; error.value = null;
    try {
        let supplierInfoPayload = null; const name = currentMaterial.supplier_name?.trim(); const contact = currentMaterial.supplier_contact?.trim(); if (name || contact) { supplierInfoPayload = JSON.stringify({ name: name || '', contact: contact || '' }); }
        const payload = { name: currentMaterial.name.trim(), is_active: !!currentMaterial.is_active, description: currentMaterial.description?.trim() || null, ...(supplierInfoPayload && { supplier_info: supplierInfoPayload }) };
        const url = isEditing.value ? `/materials/${currentMaterial.uuid}` : '/materials'; const method = isEditing.value ? 'put' : 'post'; const response = await apiClient({ method, url, data: payload });
        if ((response.status === 200 || response.status === 201) && response.data?.data) { setSuccessMessage(`Material "${response.data.data.name}" berhasil ${isEditing.value ? 'diperbarui' : 'ditambahkan'}.`); closeAndResetModal(); await fetchMaterials(); }
        else { throw new Error(response.data?.message || `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} material. Status: ${response.status}`); }
    } catch (err) { modalError.value = getErrorMessage(err, `Gagal ${isEditing.value ? 'menyimpan' : 'membuat'} material.`); }
    finally { isSaving.value = false; }
}
async function deleteMaterial(uuid, name) {
    deletingId.value = uuid; error.value = null; successMessage.value = null;
    try {
        const response = await apiClient.delete(`/materials/${uuid}`);
        if (response.status === 204) { setSuccessMessage(`Material "${name}" berhasil dipindahkan ke tempat sampah.`); const needsPageDecrement = materials.value.length === 1 && pagination.value.currentPage > 1; if (needsPageDecrement) { pagination.value.currentPage--; } await fetchMaterials(); }
        else { throw new Error(response.data?.message || `Gagal memindahkan material "${name}". Status: ${response.status}`); }
    } catch (err) { error.value = getErrorMessage(err, `Gagal memindahkan material "${name}" ke tempat sampah.`); }
    finally { deletingId.value = null; }
}
async function restoreMaterial(uuid, name) {
    restoringId.value = uuid; error.value = null; successMessage.value = null;
    try {
        const response = await apiClient.post(`/materials/restore/${uuid}`);
        if (response.status === 200 && response.data?.message) { setSuccessMessage(response.data.message); const needsPageDecrement = trashedMaterials.value.length === 1 && trashedPagination.value.currentPage > 1; if (needsPageDecrement) { trashedPagination.value.currentPage--; } await fetchTrashedMaterials(); }
        else { throw new Error(response.data?.message || `Gagal memulihkan material "${name}". Status: ${response.status}`); }
    } catch (err) { error.value = getErrorMessage(err, `Gagal memulihkan material "${name}".`); }
    finally { restoringId.value = null; }
}
async function forceDeleteMaterial(uuid, name) {
    forceDeletingId.value = uuid; error.value = null; successMessage.value = null;
    try {
        const response = await apiClient.delete(`/materials/force-delete/${uuid}`);
        if (response.status === 204) { setSuccessMessage(`Material "${name}" berhasil dihapus permanen.`); const needsPageDecrement = trashedMaterials.value.length === 1 && trashedPagination.value.currentPage > 1; if (needsPageDecrement) { trashedPagination.value.currentPage--; } await fetchTrashedMaterials(); }
        else { throw new Error(response.data?.message || `Gagal menghapus material "${name}" permanen. Status: ${response.status}`); }
    } catch (err) { error.value = getErrorMessage(err, `Gagal menghapus material "${name}" secara permanen.`); }
    finally { forceDeletingId.value = null; }
}

function applyFilters() {
    error.value = null; if (viewMode.value === 'active') { pagination.value.currentPage = 1; fetchMaterials(); } else { trashedPagination.value.currentPage = 1; fetchTrashedMaterials(); } }
function clearSearch() {
    if (filters.search) { filters.search = ''; applyFilters(); } }
function clearAllFilters() {
    filters.search = ''; filters.status = ''; applyFilters(); }
function clearError() {
    error.value = null; modalError.value = null; auditError.value = null; }
function setSuccessMessage(message) {
    successMessage.value = message; setTimeout(() => { if (successMessage.value === message) { successMessage.value = null; } }, 4000); }
function changePage(page) {
    if (isLoading.value || page === '...' || page < 1) return; clearError(); if (viewMode.value === 'active') { if (page <= pagination.value.totalPages && page !== pagination.value.currentPage) { pagination.value.currentPage = page; fetchMaterials(); } } else { if (page <= trashedPagination.value.totalPages && page !== trashedPagination.value.currentPage) { trashedPagination.value.currentPage = page; fetchTrashedMaterials(); } } }
function changeSort(column) {
    if (viewMode.value !== 'active' || isLoading.value) return; clearError(); if (filters.sort_by === column) { filters.sort_direction = filters.sort_direction === 'asc' ? 'desc' : 'asc'; } else { filters.sort_by = column; filters.sort_direction = 'asc'; } applyFilters(); }
function openAddModal() {
    isEditing.value = false; modalError.value = null; clearError(); Object.assign(currentMaterial, { uuid: null, name: '', is_active: true, description: '', supplier_name: '', supplier_contact: '' }); showModal.value = true; }
function openEditModal(material) {
    isEditing.value = true; modalError.value = null; clearError(); const parsedInfo = parsedSupplierInfo(material.supplier_info); Object.assign(currentMaterial, { uuid: material.uuid, name: material.name, is_active: material.is_active, description: material.description || '', supplier_name: parsedInfo.name, supplier_contact: parsedInfo.contact }); showModal.value = true; }
function closeAndResetModal() {
    showModal.value = false; isEditing.value = false; isSaving.value = false; modalError.value = null; Object.assign(currentMaterial, { uuid: null, name: '', is_active: true, description: '', supplier_name: '', supplier_contact: '' }); }
function confirmDeleteMaterial(uuid, name) {
    if (window.confirm(`Apakah Anda yakin ingin memindahkan material "${name}" ke tempat sampah?\n\nMaterial ini mungkin masih digunakan dalam Produk atau Bill of Materials.`)) { deleteMaterial(uuid, name); } }
function confirmForceDeleteMaterial(uuid, name) {
   if (window.confirm(`PERHATIAN!\nApakah Anda yakin ingin menghapus material "${name}" secara permanen?\n\nTindakan ini TIDAK DAPAT DIURUNGKAN.\nPastikan material ini benar-benar tidak lagi dibutuhkan atau direferensikan di mana pun.`)) { forceDeleteMaterial(uuid, name); } }
function switchViewMode(mode) {
    if (mode === viewMode.value || isLoading.value) return; viewMode.value = mode; clearError(); successMessage.value = null; filters.search = ''; if (mode === 'active') { pagination.value.currentPage = 1; filters.status = ''; filters.sort_by = 'created_at'; filters.sort_direction = 'desc'; fetchMaterials(); } else { trashedPagination.value.currentPage = 1; fetchTrashedMaterials(); } }

// --- Audit Log Functions ---
async function fetchAuditLogs(uuid) {
    isAuditLoading.value = true;
    auditError.value = null;
    auditLogs.value = [];
    try {
        const response = await apiClient.get(`/materials/${uuid}/audits`);
        if (response.data && Array.isArray(response.data.data)) {
             auditLogs.value = response.data.data;
        } else {
            console.warn("Received unexpected data structure for audit logs:", response.data);
            auditLogs.value = [];
        }
    } catch (err) {
        console.error("Error fetching audit logs:", err);
        auditError.value = getErrorMessage(err, 'Gagal memuat riwayat perubahan.');
    } finally {
        isAuditLoading.value = false;
    }
}
function openAuditModal(material) {
    if (isAuditLoading.value) return; auditedMaterialName.value = material.name || 'Material'; clearError(); auditError.value = null; auditLogs.value = []; showAuditModal.value = true; fetchAuditLogs(material.uuid); }
function closeAuditModal() {
    showAuditModal.value = false; auditLogs.value = []; auditError.value = null; auditedMaterialName.value = ''; isAuditLoading.value = false; }

const formatDate = (dateString) => {
    if (!dateString) return '-'; try { const date = new Date(dateString); if (isNaN(date.getTime())) return dateString; return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); } catch (e) { console.error("Error formatting date:", dateString, e); return dateString; } };
const parsedSupplierInfo = (infoString) => {
    let name = ''; let contact = ''; if (infoString && typeof infoString === 'string') { try { const parsed = JSON.parse(infoString); if (typeof parsed === 'object' && parsed !== null) { name = parsed.name || ''; contact = parsed.contact || ''; } } catch (e) { console.error("Failed to parse supplier_info JSON:", infoString, e); } } else if (typeof infoString === 'object' && infoString !== null) { name = infoString.name || ''; contact = infoString.contact || ''; } return { name, contact }; };
const formatAuditTimestamp = (dateString) => formatDate(dateString);
const formatFieldName = (fieldName) => {
    if (!fieldName) return ''; return fieldName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); };
const formatAuditEvent = (event) => {
    switch (event) { case 'created': return 'Dibuat'; case 'updated': return 'Diperbarui'; case 'deleted': return 'Dihapus'; case 'restored': return 'Dipulihkan'; case 'forceDeleted': return 'Hapus Permanen'; default: return event ? event.charAt(0).toUpperCase() + event.slice(1) : 'Unknown'; } };
const auditEventBadgeClass = (event) => {
     switch (event) { case 'created': return 'bg-success-light text-success'; case 'updated': return 'bg-warning-light text-warning'; case 'deleted': return 'bg-danger-light text-danger'; case 'restored': return 'bg-info-light text-info'; case 'forceDeleted': return 'bg-danger fw-bold text-white'; default: return 'bg-secondary-light text-secondary'; } };
const formatAuditValue = (value) => {
    if (value === null || value === undefined) return '<kosong>'; if (typeof value === 'boolean') return value ? 'Aktif' : 'Tidak Aktif'; if (typeof value === 'string') { try { const parsed = JSON.parse(value); if (typeof parsed === 'object' && parsed !== null && ('name' in parsed || 'contact' in parsed)) { const name = parsed.name || '-'; const contact = parsed.contact || '-'; return `[Supplier: ${name}, Kontak: ${contact}]`; } } catch (e) { /* Ignore */ } } if (typeof value === 'object') { try { return JSON.stringify(value); } catch { return '[Object]'; } } const strValue = String(value); return strValue; };

onMounted(() => {
    fetchMaterials();
});

</script>

